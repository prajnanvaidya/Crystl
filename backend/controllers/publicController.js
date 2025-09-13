// server/controllers/publicController.js

const Institution = require('../models/Institution');
const Transaction = require('../models/Transaction');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');

// =============================================
// ==      GET A LIST OF ALL INSTITUTIONS     ==
// =============================================
const getAllInstitutions = async (req, res) => {
  // Search functionality for institutions
  const { search } = req.query;
  const queryObject = {};
  if (search) {
    queryObject.name = { $regex: search, $options: 'i' };
  }

  // We only send the name and ID for the search/list view
  const institutions = await Institution.find(queryObject).select('name');
  res.status(StatusCodes.OK).json({ count: institutions.length, institutions });
};

// =============================================
// ==    SEARCH & FILTER TRANSACTIONS         ==
// =============================================
// This is the implementation for the bonus points challenge
const searchTransactions = async (req, res) => {
  const { institutionId } = req.params;
  const { search, department, status } = req.query; // Get filter values from query string

  // Start with the base query object, requiring the correct institution
  const queryObject = {
    institution: institutionId,
  };

  // If a 'search' query parameter is provided (for vendor/description)...
  if (search) {
    queryObject.$or = [
      { vendor: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  // If a 'department' ID is provided for filtering...
  if (department) {
    queryObject.department = department;
  }

  // If a 'status' is provided for filtering...
  if (status && ['pending_approval', 'completed', 'disputed'].includes(status)) {
    queryObject.status = status;
  }

  // Execute the final query
  const transactions = await Transaction.find(queryObject)
    .populate('department', 'name') // Get the department's name
    .sort('-date'); // Sort by most recent first

  res.status(StatusCodes.OK).json({ count: transactions.length, transactions });
};

module.exports = {
  getAllInstitutions,
  searchTransactions,
};