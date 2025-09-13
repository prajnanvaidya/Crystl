// Located in: server/controllers/institutionController.js

// ... (at the top of the file, with other imports)
const { StatusCodes } = require('http-status-codes');
const Anomaly = require('../models/Anomaly');
// ... (other model imports)


// =============================================
// ==         GET SPENDING ANOMALIES          ==
// =============================================
const getSpendingAnomalies = async (req, res) => {
  const institutionId = req.user.userId; // Get the logged-in institution's ID

  // 1. Fetch the raw anomaly data from the database
  const anomaliesFromDB = await Anomaly.find({ institution: institutionId })
    .populate({
      path: 'department',
      select: 'name departmentId' // Get the department's name and unique ID
    })
    .sort('-createdAt'); // Show the newest anomalies first

  // 2. Transform the data to include your custom message
  const anomaliesForFrontend = anomaliesFromDB.map(anomaly => {
    // Convert from a Mongoose document to a plain object to add new properties
    const anomalyObject = anomaly.toObject();

    const departmentName = anomalyObject.department?.name || 'An unknown department';

    // Format the overage amount into a nice currency string (e.g., $1,234.50)
    const formattedOverage = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(anomalyObject.overageAmount);

    // 3. THIS IS THE KEY PART: Create the dynamic message property
    anomalyObject.message = `The "${departmentName}" department has overspent its allocated budget by ${formattedOverage}.`;

    return anomalyObject;
  });

  // 4. Send the enhanced list of anomalies to the frontend
  res.status(StatusCodes.OK).json({
    count: anomaliesForFrontend.length,
    anomalies: anomaliesForFrontend,
  });
};

// ... (make sure to export this function at the bottom of the file)
module.exports = {
  // ... other exports
  getSpendingAnomalies,
};