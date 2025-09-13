const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const CustomError = require('../errors');
const { StatusCodes } = require('http-status-codes');

// 1. Get all conversations for the currently logged-in user/dept
const getMyConversations = async (req, res) => {
  const { userId, role } = req.user;
  let conversations;

  if (role === 'User') {
    conversations = await Conversation.find({ userParticipant: userId })
      .populate('departmentParticipant', 'name');
  } else if (role === 'Department') {
    conversations = await Conversation.find({ departmentParticipant: userId })
      .populate('userParticipant', 'name');
  }
  res.status(StatusCodes.OK).json({ conversations });
};

// 2. Get all messages for a specific conversation
const getMessagesInConversation = async (req, res) => {
  const { conversationId } = req.params;
  const messages = await Message.find({ conversation: conversationId }).sort('createdAt');
  res.status(StatusCodes.OK).json({ messages });
};

// 3. Send a new message
const sendMessage = async (req, res) => {
  const { conversationId } = req.params;
  const { text } = req.body;
  const { userId, role } = req.user; // Sender info from auth middleware

  if (!text) {
    throw new CustomError.BadRequestError('Message text cannot be empty.');
  }

  const message = await Message.create({
    conversation: conversationId,
    text,
    sender: userId,
    senderModel: role
  });
  res.status(StatusCodes.CREATED).json({ message });
};

// 4. Start a new conversation (initiated by a User)
const startConversation = async (req, res) => {
  const { departmentId } = req.body;
  const { userId } = req.user; // The user is the initiator

  // Check if a conversation already exists to prevent duplicates
  let conversation = await Conversation.findOne({
    userParticipant: userId,
    departmentParticipant: departmentId
  });

  if (!conversation) {
    conversation = await Conversation.create({
      userParticipant: userId,
      departmentParticipant: departmentId
    });
  }
  res.status(StatusCodes.CREATED).json({ conversation });
};

module.exports = {
  getMyConversations,
  getMessagesInConversation,
  sendMessage,
  startConversation,
};