const express = require('express');
const router = express.Router();
const { authenticateUser, authorizePermissions } = require('../middleware/authentication');
const {
  getMyConversations,
  getMessagesInConversation,
  sendMessage,
  startConversation,
} = require('../controllers/chatController');

// All chat routes require a user to be logged in
router.use(authenticateUser);

// Get a list of all conversations for the logged-in user/dept
router.get('/', getMyConversations);

// Start a new conversation (only a 'User' can start one)
router.post('/', authorizePermissions('User'), startConversation);

// Get all messages for a specific conversation
router.get('/:conversationId/messages', getMessagesInConversation);

// Send a message in a specific conversation
router.post('/:conversationId/messages', sendMessage);

module.exports = router;