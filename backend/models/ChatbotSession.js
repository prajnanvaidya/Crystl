const mongoose = require('mongoose');

const ChatbotSessionSchema = new mongoose.Schema({
  // Link to the user who owns this chat session
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Which institution is this chat about?
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
  // The entire message history is stored here as an array of objects
  messages: [{
    role: {
      type: String,
      enum: ['user', 'model'], // 'user' for human, 'model' for AI
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
}, { timestamps: true });

// Create a compound index to ensure a user can only have ONE chat session per institution.
// This is a database-level guarantee of data integrity.
ChatbotSessionSchema.index({ user: 1, institution: 1 }, { unique: true });

module.exports = mongoose.model('ChatbotSession', ChatbotSessionSchema);