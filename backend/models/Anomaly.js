// server/models/Anomaly.js

const mongoose = require('mongoose');

const AnomalySchema = new mongoose.Schema({
  // The department that overspent
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  // The institution to which the department belongs
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
  // The total amount of approved funds given to the department at the time of the check
  totalAllocated: {
    type: Number,
    required: true,
  },
  // The department's total spending at the time of the check
  totalSpent: {
    type: Number,
    required: true,
  },
  // The calculated amount by which the spending exceeds the allocation
  overageAmount: {
    type: Number,
    required: true,
  },
  // A note on what action triggered this anomaly check
  triggeredBy: {
    type: String,
    required: true,
  },
  // Status to allow institutions to manage the alerts (e.g., mark them as "read")
  status: {
    type: String,
    enum: ['new', 'acknowledged', 'resolved'],
    default: 'new',
  },
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

// Create an index for faster lookups by an institution
AnomalySchema.index({ institution: 1, status: 1 });

module.exports = mongoose.model('Anomaly', AnomalySchema);