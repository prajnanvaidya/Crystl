// server/models/Conversation.js

const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  // The department that "owns" this public forum thread. This is the central link.
  departmentParticipant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
    unique: true, // IMPORTANT: Ensures each department can only have one public forum.
  },
  // We no longer need a single userParticipant. Many users will post here.
  
  // We can add a flag to distinguish this from other potential conversation types later.
  isPublicForum: {
    type: Boolean,
    default: true,
  },

}, { timestamps: true });

module.exports = mongoose.model('Conversation', ConversationSchema);