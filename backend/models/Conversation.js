const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  // The two participants in the conversation
  userParticipant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  departmentParticipant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Conversation', ConversationSchema);