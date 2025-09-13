// server/routes/chatRoutes.js

const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authentication'); // No need for authorizePermissions('User') on the start route anymore
const {
  getMessagesInConversation,
  sendMessage,
  startOrGetForumConversation, // Use the new function
  getConversationDetails,
} = require('../controllers/chatController');

router.use(authenticateUser);

// This route now finds or creates the public forum for a department
router.post('/', startOrGetForumConversation);

router.get('/:conversationId', getConversationDetails);
router.get('/:conversationId/messages', getMessagesInConversation);
router.post('/:conversationId/messages', sendMessage);

module.exports = router;