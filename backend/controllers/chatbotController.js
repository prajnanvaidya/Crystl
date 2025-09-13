const ChatbotSession = require('../models/ChatbotSession');
const Transaction = require('../models/Transaction');
const Institution = require('../models/Institution');
const CustomError = require('../errors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { StatusCodes } = require('http-status-codes');

/**
 * @desc    Get an existing chat session or create a new one.
 * @route   POST /api/v1/chatbot/session
 * @access  Private (User Role)
 */
const getOrCreateChatSession = async (req, res) => {
  const { institutionId } = req.body;
  const { userId } = req.user; // From auth middleware

  if (!institutionId) {
    throw new CustomError.BadRequestError('Institution ID is required.');
  }

  // Find a session that matches both the logged-in user and the target institution
  let session = await ChatbotSession.findOne({ user: userId, institution: institutionId });

  // If no session exists, create a brand new one
  if (!session) {
    session = await ChatbotSession.create({ user: userId, institution: institutionId, messages: [] });
  }

  res.status(StatusCodes.OK).json({ session });
};

/**
 * @desc    Post a new message to a chat session and get an AI response
 * @route   POST /api/v1/chatbot/session/:sessionId/message
 * @access  Private (User Role)
 */
const postMessageToSession = async (req, res) => {
  const { sessionId } = req.params;
  const { question } = req.body;
  const { userId } = req.user;

  if (!question) {
    throw new CustomError.BadRequestError('Question cannot be empty.');
  }

  // Find the session and verify the current user is the owner
  const session = await ChatbotSession.findById(sessionId);
  if (!session || session.user.toString() !== userId) {
    throw new CustomError.UnauthorizedError('Not authorized to access this chat session.');
  }

  // Add the user's new message to the history and save to the database
  session.messages.push({ role: 'user', text: question });
  
  // --- GATHER FULL CONTEXT ---
  // 1. Financial Data
  const institution = await Institution.findById(session.institution).select('name');
  const allTransactions = await Transaction.find({ institution: session.institution }).select('description vendor amount date status -_id').populate('department', 'name -_id');
  const financialContext = `Transaction History:\n${allTransactions.map(t => JSON.stringify(t)).join('\n')}`;
  
  // 2. Chat History (including the new message)
  const historyContext = session.messages.map(msg => `${msg.role}: ${msg.text}`).join('\n');

  // --- GENERATE AI RESPONSE ---
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are a financial assistant for "${institution.name}". Answer the user's LATEST QUESTION based on the "Transaction History" and the "Previous Conversation".
    
    <CONTEXT_START>
    ${financialContext}
    
    Previous Conversation:
    ${historyContext}
    <CONTEXT_END>
    
    LATEST QUESTION: ${question}
    
    ANSWER:`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const answer = response.text();

  // --- Add the AI's response to the history and save the entire session again ---
  session.messages.push({ role: 'model', text: answer });
  await session.save();

  res.status(StatusCodes.OK).json({ answer });
};

module.exports = {
  getOrCreateChatSession,
  postMessageToSession,
};