// server/routes/publicRoutes.js

const express = require('express');
const router = express.Router();

// Import all the public-facing controller functions
const { getFlowchartData } = require('../controllers/flowchartController');
const { getAllInstitutions, searchTransactions } = require('../controllers/publicController');
const { getSpendingTrend, getDepartmentShare } = require('../controllers/analyticsController');
// --- DEFINE THE PUBLIC ROUTES ---
// These endpoints are public and do not require any authentication.

// Route for the main visualization
router.get('/flowchart/:institutionId', getFlowchartData);

// Route to get a list of all institutions (with optional search)
// e.g., /api/v1/public/institutions?search=University
router.get('/institutions', getAllInstitutions);

// Route to get all transactions for an institution (with search & filter)
// e.g., /api/v1/public/institution/INST_ID/transactions?search=scoreboard&status=completed
router.get('/institution/:institutionId/transactions', searchTransactions);
router.get('/analytics/:institutionId/department-share', getDepartmentShare);
router.get('/analytics/:institutionId/spending-trend', getSpendingTrend);

module.exports = router;