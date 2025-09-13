const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  // Which conversation does this message belong to?
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  // The actual text content
  text: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  // Who sent the message? We need a polymorphic relationship.
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    // This 'ref' tells Mongoose to look in the collection specified by senderModel
    refPath: 'senderModel'
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['User', 'Department'] // The sender can be one of two types
  }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);