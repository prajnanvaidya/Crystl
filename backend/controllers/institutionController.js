// server/controllers/institutionController.js

const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const Institution = require('../models/Institution');
const Transaction = require('../models/Transaction');
const Department = require('../models/Department');
const Report = require('../models/Report');

// --- AI Service Imports ---
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const { VertexAI } = require('@google-cloud/vertexai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
// =============================================
// ==         HELPER FUNCTIONS                ==
// =============================================

// Unified helper to get raw text from ANY supported file buffer
async function getRawTextFromFile(fileBuffer, mimeType) {
  if (mimeType === 'application/pdf') {
    // For PDFs, we must use OCR
    console.log('Extracting text from PDF using Cloud Vision...');
    const visionClient = new ImageAnnotatorClient();
    const request = {
      image: { content: fileBuffer.toString('base64') },
      features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
    };
    const [result] = await visionClient.batchAnnotateImages({ requests: [request] });
    const rawText = result.responses[0]?.fullTextAnnotation?.text;
    if (!rawText) {
      throw new Error('Cloud Vision could not extract any text from the PDF.');
    }
    return rawText;
  } else if (mimeType === 'text/csv') {
    // For CSVs, we can just read it as a plain text string
    console.log('Extracting text from CSV file...');
    return fileBuffer.toString('utf-8');
  } else {
    throw new Error('Unsupported file type.');
  }
}

// In server/controllers/institutionController.js

// ... (keep the other imports and functions)

async function structureTextWithLLM(rawText) {
  console.log('Structuring text with Gemini API (using API Key)...');
  
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    You are an expert financial data entry system. Your task is to analyze the following raw text, which could be from a CSV or a PDF, and identify all individual financial transactions.
    
    For each transaction, you must extract these specific details:
    - department_name (required)
    - amount (required, as a number only)
    - description (required, this must clearly explain the purpose of the expense)
    - date (required, in YYYY-MM-DD format)
    - vendor (optional, should be null if the expense is internal like salaries)

    Return the final output as a single, valid JSON array of objects, and nothing else. Do not include markdown formatting.

    Here is the raw text to analyze:
    ---
    ${rawText}
    ---
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const llmResponseText = response.text();
  console.log('LLM response received.');

  // --- NEW ROBUST CLEANING LOGIC ---
  try {
    // Find the first occurrence of '[' or '{'
    const firstBracket = llmResponseText.indexOf('[');
    const firstBrace = llmResponseText.indexOf('{');
    let startIndex = -1;

    if (firstBracket === -1) startIndex = firstBrace;
    else if (firstBrace === -1) startIndex = firstBracket;
    else startIndex = Math.min(firstBracket, firstBrace);

    if (startIndex === -1) {
      throw new Error("No JSON array or object found in the response.");
    }
    
    // Find the last occurrence of ']' or '}'
    const lastBracket = llmResponseText.lastIndexOf(']');
    const lastBrace = llmResponseText.lastIndexOf('}');
    const endIndex = Math.max(lastBracket, lastBrace);

    if (endIndex === -1) {
        throw new Error("Valid JSON structure could not be found.");
    }

    // Extract the substring that is likely to be the JSON
    const jsonString = llmResponseText.substring(startIndex, endIndex + 1);

    console.log('Attempting to parse cleaned JSON string...');
    return JSON.parse(jsonString);

  } catch (error) {
    console.error('Failed to parse JSON from LLM response. Raw response was:', llmResponseText);
    throw new Error('The AI model returned an invalid data structure that could not be cleaned.');
  }
}
// =============================================
// ==      MAIN CONTROLLER FUNCTION           ==
// =============================================
const uploadReportAndTransactions = async (req, res) => {
  // --- 1. VALIDATE INPUT ---
  // Get metadata for the Report from the request body (form-data)
  const { name, type, reportDate } = req.body;
  const institutionId = req.user.userId; // From auth middleware

  if (!name || !type || !reportDate) {
    throw new CustomError.BadRequestError('Please provide all required report details: name, type, and date.');
  }
  if (!req.file) {
    throw new CustomError.BadRequestError('No transaction file was uploaded.');
  }
  
  // --- 2. CREATE THE REPORT DOCUMENT ---
  // We create the report first. If the AI processing fails later, we will delete it.
  let report;
  try {
    report = await Report.create({
      name,
      type,
      reportDate: new Date(reportDate),
      institution: institutionId,
      // Optional: Add logic here to upload the original file to cloud storage and save the URL
      // originalFileUrl: 'https://storage.googleapis.com/...',
    });
  } catch (error) {
    throw new CustomError.InternalServerError(`Failed to create report document: ${error.message}`);
  }
  
  const reportId = report._id; // Get the ID of the report we just created

  // --- 3. PROCESS THE FILE WITH THE AI PIPELINE ---
  try {
    // Get raw text from the file buffer (works for both PDF and CSV)
    const rawText = await getRawTextFromFile(req.file.buffer, req.file.mimetype);
    
    // Use the LLM to structure the raw text into clean JSON
    const parsedData = await structureTextWithLLM(rawText);

    if (!parsedData || parsedData.length === 0) {
      // If AI processing yields no results, delete the empty report to keep the DB clean
      await Report.findByIdAndDelete(reportId);
      throw new CustomError.BadRequestError('The AI could not identify any valid transactions in the uploaded file.');
    }
    console.log(`AI successfully parsed ${parsedData.length} transactions from report '${name}'.`);

    // --- 4. CREATE TRANSACTION DOCUMENTS, LINKING EACH TO THE REPORT ---
    let transactionsCreated = 0;
    
    // We use Promise.all to handle database operations concurrently for better performance
    const transactionCreationPromises = parsedData.map(async (row) => {
      const { department_name, amount, vendor, description, date } = row;

      // Basic validation for each row from the AI
      if (!department_name || !amount || !description || !date) {
        console.warn('Skipping row with missing required data from AI:', row);
        return; // Skip this iteration of the map
      }

      // Find the corresponding department document to get its _id
      const department = await Department.findOne({ name: department_name, linkedInstitution: institutionId });
      if (!department) {
        console.warn(`Department named '${department_name}' not found or not linked to this institution. Skipping transaction.`);
        return; // Skip if department doesn't exist or isn't linked
      }

      // Create the transaction document
      await Transaction.create({
        amount: parseFloat(amount),
        vendor,
        description,
        date: new Date(date),
        status: 'pending_approval',
        institution: institutionId,
        department: department._id,
        report: reportId, // <-- THE CRUCIAL LINK
      });
      transactionsCreated++;
    });

    await Promise.all(transactionCreationPromises);

    if (transactionsCreated === 0) {
      // Handle the case where the file was valid but no rows could be processed (e.g., all departments were wrong)
      await Report.findByIdAndDelete(reportId);
      throw new CustomError.BadRequestError('The file was processed, but no valid transactions could be logged. Please check department names.');
    }

    res.status(StatusCodes.CREATED).json({
      msg: `Report '${name}' created successfully. ${transactionsCreated} transactions are now pending approval.`
    });

  } catch (error) {
    // If anything in the AI pipeline or transaction creation fails, delete the report
    if (reportId) {
      await Report.findByIdAndDelete(reportId);
    }
    // Re-throw the error to be handled by the main error handler middleware
    throw error;
  }
};

const linkDepartment = async (req, res) => {
  const { departmentId } = req.body; // The unique ID like "DEPT-ATHL-12345"
  const institutionId = req.user.userId; // This comes from the authenticateUser middleware

  if (!departmentId) {
    throw new CustomError.BadRequestError('Please provide the Department ID');
  }

  // Find the department by its unique, human-readable ID
  const department = await Department.findOne({ departmentId });
  if (!department) {
    throw new CustomError.NotFoundError(`No department found with ID: ${departmentId}`);
  }

  // Find the institution that is making the request
  const institution = await Institution.findOne({ _id: institutionId });

  // Add the department's MongoDB _id to the institution's linkedDepartments array
  // We use $addToSet to prevent duplicate links
  institution.linkedDepartments.addToSet(department._id);
  await institution.save();

  // Now, update the department to link it back to the institution
  department.linkedInstitution = institution._id;
  await department.save();

  res.status(StatusCodes.OK).json({ msg: 'Department successfully linked!' });
};
const getLinkedDepartments = async (req, res) => {
  // We get the institution's ID from req.user, which was set by the
  // authentication middleware. This is secure because it comes from the JWT.
  const institutionId = req.user.userId;

  // Find the institution and use .populate() to automatically fetch the
  // full document for each department ID in the 'linkedDepartments' array.
  const institution = await Institution.findById(institutionId)
    .populate({
        path: 'linkedDepartments',
        select: 'name departmentId' // We only need the name and unique ID for the list
    });

  if (!institution) {
    throw new CustomError.NotFoundError('Institution not found.');
  }

  res.status(StatusCodes.OK).json({
    departments: institution.linkedDepartments,
  });
};
const getReports = async (req, res) => {
  // The logged-in institution's ID comes securely from the auth middleware
  const institutionId = req.user.userId;

  // Find all reports where the 'institution' field matches the logged-in user's ID.
  // We sort by -reportDate to show the most recent reports first.
  const reports = await Report.find({ institution: institutionId }).sort('-reportDate');

  res.status(StatusCodes.OK).json({
    count: reports.length,
    reports: reports,
  });
};
module.exports = {
  linkDepartment,
  getLinkedDepartments,
  uploadReportAndTransactions,
  getReports,
};