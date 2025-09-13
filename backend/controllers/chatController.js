// server/controllers/chatController.js

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const CustomError = require('../errors');
const { StatusCodes } = require('http-status-codes');

// ... (getMyConversations can be kept for other uses, but is less relevant for the forum)

// --- GET MESSAGES (No changes needed, this logic is perfect) ---
const getMessagesInConversation = async (req, res) => {
  const { conversationId } = req.params;
  const messages = await Message.find({ conversation: conversationId })
    .sort('createdAt')
    .populate('sender', 'name'); // This already gets the sender's name!
  res.status(StatusCodes.OK).json({ messages });
};

// --- SEND MESSAGE (No changes needed, this logic is perfect) ---
const sendMessage = async (req, res) => {
  const { conversationId } = req.params;
  const { text } = req.body;
  const { userId, role } = req.user;

  if (!text) {
    throw new CustomError.BadRequestError('Message text cannot be empty.');
  }
  const message = await Message.create({
    conversation: conversationId,
    text,
    sender: userId,
    senderModel: role,
  });
  res.status(StatusCodes.OK).json({ message });
};

// --- REWRITTEN "START" LOGIC: Find or Create the Public Forum ---
const startOrGetForumConversation = async (req, res) => {
  const { departmentId } = req.body;
  // Note: We don't need the userId to find the forum, only the departmentId.

  // 1. Find the existing public forum for this department.
  let conversation = await Conversation.findOne({
    departmentParticipant: departmentId,
    isPublicForum: true,
  });

  // 2. If no forum exists for this department yet, create it.
  if (!conversation) {
    conversation = await Conversation.create({
      departmentParticipant: departmentId,
    });
  }

  // 3. Return the single, shared conversation object.
  res.status(StatusCodes.OK).json({ conversation });
};

// --- SIMPLIFIED GET DETAILS LOGIC ---
const getConversationDetails = async (req, res) => {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId)
        .populate('departmentParticipant', 'name');

    if (!conversation) {
        throw new CustomError.NotFoundError('Forum thread not found.');
    }
    res.status(StatusCodes.OK).json({ conversation });
};


module.exports = {
  getMessagesInConversation,
  sendMessage,
  startOrGetForumConversation,
  getConversationDetails
  // We are removing getMyConversations for now as it's based on the 1-on-1 model
};