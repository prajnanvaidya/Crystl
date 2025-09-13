// server/routes/authRoutes.js

const express = require('express');
const router = express.Router();

const {
  registerInstitution,
  loginInstitution,
  registerDepartment,
  loginDepartment,
  registerUser,
  loginUser,
  logout,
} = require('../controllers/authController');

// --- INSTITUTION ROUTES ---
router.post('/institution/register', registerInstitution);
router.post('/institution/login', loginInstitution);

// --- DEPARTMENT ROUTES ---
router.post('/department/register', registerDepartment);
router.post('/department/login', loginDepartment);

// --- PUBLIC USER ROUTES ---
router.post('/user/register', registerUser);
router.post('/user/login', loginUser);

// --- LOGOUT ROUTE (works for all user types) ---
router.get('/logout', logout);

module.exports = router;