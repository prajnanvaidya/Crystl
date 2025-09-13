const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Please provide transaction amount'],
  },
  vendor: {
    type: String,
    trim: true,
    default: null,
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    maxlength: 250,
  },
  date: {
    type: Date,
    required: [true, 'Please provide the transaction date'],
  },
  // This status field is the core of the verification workflow
  status: {
    type: String,
    enum: ['pending_approval', 'completed', 'disputed'],
    default: 'pending_approval'
  },
  // Link to the Institution that created this transaction
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  // Link to the Department this transaction is for
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
    report: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: true,
  },
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

module.exports = mongoose.model('Transaction', TransactionSchema);