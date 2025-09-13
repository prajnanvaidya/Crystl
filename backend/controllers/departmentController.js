// server/controllers/departmentController.js

const Department = require('../models/Department');
const Transaction = require('../models/Transaction');
const DepartmentTransaction = require('../models/DepartmentTransaction');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { checkAndLogAnomaly } = require('../utils/anomalyDetector'); // Import the anomaly checker

// =============================================
// ==         AI HELPER FUNCTIONS             ==
// =============================================

async function getRawTextFromFile(fileBuffer, mimeType) {
  if (mimeType === 'application/pdf') {
    const visionClient = new ImageAnnotatorClient();
    const request = {
      image: { content: fileBuffer.toString('base64') },
      features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
    };
    const [result] = await visionClient.batchAnnotateImages({ requests: [request] });
    const rawText = result.responses[0]?.fullTextAnnotation?.text;
    if (!rawText) throw new Error('Cloud Vision could not extract text from the PDF.');
    return rawText;
  } else if (mimeType === 'text/csv') {
    return fileBuffer.toString('utf-8');
  } else {
    throw new Error('Unsupported file type.');
  }
}

async function structureSpendingWithLLM(rawText) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    You are an expert financial data entry system. Your task is to analyze the following raw text from a department's expense report and identify all individual spending transactions.
    
    For each transaction, extract these specific details:
    - recipient (required, this is the project name or vendor the money went to)
    - amount (required, as a number only)
    - description (required, must clearly explain the purpose of the expense)
    - date (required, in YYYY-MM-DD format)

    Return the final output as a single, valid JSON array of objects, and nothing else. Do not include markdown formatting.

    Here is the raw text to analyze:
    ---
    ${rawText}
    ---
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const llmResponseText = response.text();
  
  try {
    const jsonString = llmResponseText.substring(llmResponseText.indexOf('['), llmResponseText.lastIndexOf(']') + 1);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to parse JSON from LLM response. Raw response was:', llmResponseText);
    throw new Error('The AI model returned an invalid data structure.');
  }
}

// =============================================
// ==      GET ALL PENDING TRANSACTIONS       ==
// =============================================
const getPendingTransactions = async (req, res) => {
  // The department's MongoDB _id is on req.user from the authentication middleware
  const departmentId = req.user.userId;

  // Find all transactions assigned to this department that have the 'pending_approval' status
  const pendingTransactions = await Transaction.find({
    department: departmentId,
    status: 'pending_approval',
  }).populate('institution', 'name'); // Also fetch the name of the institution that sent it

  res.status(StatusCodes.OK).json({
    count: pendingTransactions.length,
    transactions: pendingTransactions,
  });
};

// =============================================
// ==         VERIFY A TRANSACTION            ==
// =============================================
const verifyTransaction = async (req, res) => {
  const { transactionId } = req.params; // Get the ID of the transaction from the URL
  const { status } = req.body; // The new status: 'completed' or 'disputed'
  const departmentId = req.user.userId;

  // Basic validation for the new status
  if (!status || !['completed', 'disputed'].includes(status)) {
    throw new CustomError.BadRequestError("Please provide a valid status: 'completed' or 'disputed'.");
  }

  // Find the specific transaction
  const transaction = await Transaction.findOne({ _id: transactionId });
  if (!transaction) {
    throw new CustomError.NotFoundError(`No transaction with id: ${transactionId}`);
  }

  // --- SECURITY CHECK ---
  // Ensure the transaction actually belongs to the department trying to verify it.
  if (transaction.department.toString() !== departmentId) {
     throw new CustomError.UnauthorizedError('You are not authorized to verify this transaction.');
  }

  // Check if the transaction is in a state that can be verified
  if (transaction.status !== 'pending_approval') {
    throw new CustomError.BadRequestError(`This transaction is already '${transaction.status}' and cannot be changed.`);
  }

  // Update the transaction's status
  transaction.status = status;
  await transaction.save();

  // --- FIX APPLIED HERE ---
  // If the transaction was successfully approved, its amount is now part of the
  // department's official budget. We MUST re-run the anomaly check now.
  if (status === 'completed') {
    try {
      console.log(`Transaction ${transactionId} approved. Triggering anomaly check...`);
      // We get the institutionId directly from the transaction object we just saved.
      await checkAndLogAnomaly(departmentId, transaction.institution);
    } catch (anomalyError) {
      // Log the error but don't stop the request. The user's action was successful.
      console.error('Anomaly detection failed after transaction verification:', anomalyError);
    }
  }

  res.status(StatusCodes.OK).json({ msg: `Transaction successfully updated to '${status}'`, transaction });
};

// =============================================
// ==    UPLOAD DEPARTMENT SPENDING REPORT    ==
// =============================================
const uploadDepartmentSpendingReport = async (req, res) => {
  // 1. Validate Input
  const { reportName } = req.body; // A simple name for this upload
  if (!reportName) {
    throw new CustomError.BadRequestError('Please provide a name for this spending report.');
  }
  if (!req.file) {
    throw new CustomError.BadRequestError('No spending file was uploaded.');
  }

  const departmentId = req.user.userId;
  const department = await Department.findById(departmentId);
  if (!department) {
    throw new CustomError.NotFoundError('Department not found.');
  }
  
  const institutionId = department.linkedInstitution;
  if (!institutionId) {
    throw new CustomError.BadRequestError('Your department must be linked to an institution to log spending.');
  }

  try {
    // 2. Process the file with the AI pipeline
    const rawText = await getRawTextFromFile(req.file.buffer, req.file.mimetype);
    const parsedData = await structureSpendingWithLLM(rawText);

    if (!parsedData || parsedData.length === 0) {
      throw new CustomError.BadRequestError('The AI could not identify any valid spending records in the file.');
    }
    console.log(`AI successfully parsed ${parsedData.length} department transactions from report '${reportName}'.`);

    // 3. Create DepartmentTransaction documents
    const transactionsToCreate = parsedData.map(row => {
      const { recipient, amount, description, date } = row;
      if (!recipient || !amount || !description || !date) {
        console.warn('Skipping row with missing data from AI:', row);
        return null; // This will be filtered out later
      }
      return {
        amount: parseFloat(amount),
        recipient,
        description,
        date: new Date(date),
        sourceReportName: reportName, // Link back to this upload
        department: departmentId,
        institution: institutionId,
      };
    }).filter(Boolean); // Filter out any null entries

    if (transactionsToCreate.length === 0) {
      throw new CustomError.BadRequestError('The file was processed, but no valid transactions could be logged.');
    }
    
    // First, save the new spending records to the database
    await DepartmentTransaction.insertMany(transactionsToCreate);

    // AFTER saving, trigger the anomaly check in the background.
    try {
      await checkAndLogAnomaly(departmentId, institutionId);
    } catch (anomalyError) {
      console.error('Anomaly detection process failed after spending upload:', anomalyError);
      // We don't re-throw the error, we just log it. The user's upload was successful.
    }

    res.status(StatusCodes.CREATED).json({
      msg: `Report '${reportName}' processed successfully. ${transactionsToCreate.length} expenses have been logged.`
    });

  } catch (error) {
    // Re-throw the error to be handled by the main error handler
    throw error;
  }
};

module.exports = {
  getPendingTransactions,
  verifyTransaction,
  uploadDepartmentSpendingReport,
};