// server/routes/userRoutes.js

const express = require('express');
const router = express.Router();

// Import middleware for authentication and authorization
const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

// Import the controller functions
const {
  followInstitution,
  unfollowInstitution,
  showMyDashboard,
} = require('../controllers/userController');


// --- IMPORTANT ---
// Apply authentication middleware to all routes in this file.
// All these actions require a user to be logged in.
// We also authorize ONLY the 'User' role to access these routes.
router.use(authenticateUser, authorizePermissions('User'));

// --- DEFINE THE ROUTES ---

// Route for the user's personalized dashboard
router.get('/dashboard', showMyDashboard);

// Route to follow a specific institution
router.post('/follow/:institutionId', followInstitution);

// Route to unfollow a specific institution
router.post('/unfollow/:institutionId', unfollowInstitution);


module.exports = router;