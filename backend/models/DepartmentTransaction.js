const mongoose = require('mongoose');

const DepartmentTransactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Please provide transaction amount'],
  },
  // The name of the project or vendor. This is the simple text field you wanted.
  recipient: {
    type: String,
    required: [true, 'Please provide the project or vendor name'],
    trim: true,
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
  // This transaction is created by the department, so it links back to it.
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  // We also link it to the institution for easier querying.
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  // Optional: Link it to the report that authorized this spending.
  report: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
  },
}, { timestamps: true });

module.exports = mongoose.model('DepartmentTransaction', DepartmentTransactionSchema);