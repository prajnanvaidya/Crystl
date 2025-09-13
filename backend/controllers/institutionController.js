// server/controllers/institutionController.js

const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const Institution = require('../models/Institution');
const Transaction = require('../models/Transaction');
const Department = require('../models/Department');

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
const uploadTransactions = async (req, res) => {
  if (!req.file) {
    throw new CustomError.BadRequestError('No file uploaded.');
  }

  const institutionId = req.user.userId;

  try {
    // --- STEP 1: Get Raw Text (from either PDF or CSV) ---
    const rawText = await getRawTextFromFile(req.file.buffer, req.file.mimetype);

    // --- STEP 2: Structure the Text with the LLM ---
    const parsedData = await structureTextWithLLM(rawText);

    if (!parsedData || parsedData.length === 0) {
      throw new CustomError.BadRequestError('The AI could not identify any valid transactions in the uploaded file.');
    }
    console.log(`Successfully parsed ${parsedData.length} transactions via AI.`);

    // --- STEP 3: LOGGING TO DATABASE ---
    let transactionsCreated = 0;
    for (const row of parsedData) {
      const { department_name, amount, vendor, description, date } = row;
      if (!department_name || !amount || !description || !date) {
        console.warn('Skipping invalid row from AI data:', row);
        continue;
      }

      const department = await Department.findOne({ name: department_name });
      if (!department) {
        console.warn(`Department not found: ${department_name}. Skipping transaction.`);
        continue;
      }

      await Transaction.create({
        amount: parseFloat(amount),
        vendor,
        description,
        date: new Date(date),
        status: 'pending_approval',
        institution: institutionId,
        department: department._id,
      });
      transactionsCreated++;
    }

    res.status(StatusCodes.CREATED).json({
      msg: `File processed successfully. ${transactionsCreated} transactions are now pending approval.`
    });

  } catch (error) {
    console.error('Error in uploadTransactions:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: error.message || 'An unexpected error occurred during file processing.' });
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

module.exports = {
  linkDepartment,
  uploadTransactions,
};