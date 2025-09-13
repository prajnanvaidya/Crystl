// server/routes/departmentRoutes.js

const express = require('express');
const router = express.Router();

// Import middleware for authentication and authorization
const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

// Import the controller functions
const {
  getPendingTransactions,
  verifyTransaction,
} = require('../controllers/departmentController');

// --- DEFINE THE ROUTES ---
// All routes in this file will first be checked for a valid login,
// and then checked to ensure the user is a 'Department'.
router.use(authenticateUser, authorizePermissions('Department'));

// Route to get a list of all transactions pending this department's approval
router.get('/pending-transactions', getPendingTransactions);

// Route to update the status of a specific transaction
// We use a PATCH request as we are partially updating the resource.
// The ':transactionId' is a URL parameter.
router.patch('/verify-transaction/:transactionId', verifyTransaction);


module.exports = router;