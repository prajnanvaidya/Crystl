const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for this report (e.g., "Q3 Spending")'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['monthly', 'quarterly', 'annual', 'project', 'other'],
    required: [true, 'Please classify the report type'],
  },
  reportDate: {
    type: Date,
    required: [true, 'Please provide the date this report pertains to'],
  },
  // Link to the Institution that owns this report
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
  // Optional: A link to where the original file is stored for auditing purposes
  // This is a great feature for traceability!
  originalFileUrl: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);