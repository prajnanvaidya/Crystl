const express = require('express');
const router = express.Router();

// Import middleware for security
const { authenticateUser, authorizePermissions } = require('../middleware/authentication');

// Import the controller functions
const { getOrCreateChatSession, postMessageToSession } = require('../controllers/chatbotController');

// All chatbot routes require a logged-in public user.
// Using router.use() applies this to all routes in this file.
router.use(authenticateUser, authorizePermissions('User'));

// Route to get or create a session for a specific institution.
// The frontend will call this once when the chat window is opened.
router.post('/session', getOrCreateChatSession);

// Route to post a new message to a specific, existing session.
// The frontend will call this every time the user sends a message.
router.post('/session/:sessionId/message', postMessageToSession);

module.exports = router;