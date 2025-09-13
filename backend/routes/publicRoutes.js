// server/routes/publicRoutes.js

const express = require('express');
const router = express.Router();

// Import the controller function
const { getFlowchartData } = require('../controllers/flowchartController');
// You will also import other public controllers here later

// --- DEFINE THE ROUTE ---
// This endpoint is public and does not require any authentication
router.get('/flowchart/:institutionId', getFlowchartData);

module.exports = router;