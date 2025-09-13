// server/controllers/departmentController.js

const Department = require('../models/Department');
const Transaction = require('../models/Transaction');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { checkPermissions } = require('../utils'); // We'll use this utility

// =============================================
// ==      GET ALL PENDING TRANSACTIONS       ==
// =============================================
const getPendingTransactions = async (req, res) => {
  // The department's MongoDB _id is on req.user from the authentication middleware
  const departmentId = req.user.userId;

  // Find all transactions assigned to this department that have the 'pending_approval' status
  const pendingTransactions = await Transaction.find({
    department: departmentId,
    status: 'pending_approval',
  }).populate('institution', 'name'); // Also fetch the name of the institution that sent it

  res.status(StatusCodes.OK).json({
    count: pendingTransactions.length,
    transactions: pendingTransactions,
  });
};

// =============================================
// ==         VERIFY A TRANSACTION            ==
// =============================================
const verifyTransaction = async (req, res) => {
  const { transactionId } = req.params; // Get the ID of the transaction from the URL
  const { status } = req.body; // The new status: 'completed' or 'disputed'
  const departmentId = req.user.userId;

  // Basic validation for the new status
  if (!status || !['completed', 'disputed'].includes(status)) {
    throw new CustomError.BadRequestError("Please provide a valid status: 'completed' or 'disputed'.");
  }

  // Find the specific transaction
  const transaction = await Transaction.findOne({ _id: transactionId });
  if (!transaction) {
    throw new CustomError.NotFoundError(`No transaction with id: ${transactionId}`);
  }

  // --- SECURITY CHECK ---
  // Ensure the transaction actually belongs to the department trying to verify it.
  // This prevents one department from accidentally (or maliciously) verifying another's transactions.
  if (transaction.department.toString() !== departmentId) {
     throw new CustomError.UnauthorizedError('You are not authorized to verify this transaction.');
  }

  // Check if the transaction is in a state that can be verified
  if (transaction.status !== 'pending_approval') {
    throw new CustomError.BadRequestError(`This transaction is already '${transaction.status}' and cannot be changed.`);
  }

  // Update the transaction's status
  transaction.status = status;
  await transaction.save();

  res.status(StatusCodes.OK).json({ msg: `Transaction successfully updated to '${status}'`, transaction });
};

module.exports = {
  getPendingTransactions,
  verifyTransaction,
};