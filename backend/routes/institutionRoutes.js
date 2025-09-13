// server/routes/institutionRoutes.js

const express = require('express');
const router = express.Router();

// Your configured multer middleware for memory storage
// Ensure this file exists and is correctly set up to handle 'csv' and 'pdf'
const upload = require('../middleware/multer'); 

// Import middleware for authentication and authorization
const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

// Import the controller functions that contain the logic
const {
  linkDepartment,
  uploadTransactions,
} = require('../controllers/institutionController');


// --- DEFINE THE ROUTES ---

// Route to link a department to the logged-in institution.
router.post(
  '/link-department',
  authenticateUser,                 // 1. Ensures a user is logged in
  authorizePermissions('Institution'), // 2. Ensures the logged-in user is an 'Institution'
  linkDepartment                    // 3. If checks pass, execute the controller logic
);

// Route to upload a transaction CSV or PDF file.
// - upload.single('transactionsFile') is the multer middleware.
// - It looks for a file in the form-data with the field name 'transactionsFile'.
router.post(
  '/upload-transactions',
  [authenticateUser, authorizePermissions('Institution')], // You can also pass middleware as an array
  upload.single('transactionsFile'),
  uploadTransactions
);


module.exports = router;