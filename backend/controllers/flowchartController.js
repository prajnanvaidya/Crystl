// server/controllers/flowchartController.js

const Transaction = require('../models/Transaction'); // Represents Institution -> Department allocations
const DepartmentTransaction = require('../models/DepartmentTransaction'); // Represents Department -> Project/Vendor spending
const Institution = require('../models/Institution');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const mongoose = require('mongoose');

// =============================================
// ==      GET MULTI-LEVEL FLOWCHART DATA     ==
// =============================================
const getFlowchartData = async (req, res) => {
  const { institutionId } = req.params;

  // Validate the incoming institution ID
  if (!mongoose.Types.ObjectId.isValid(institutionId)) {
    throw new CustomError.BadRequestError('Invalid Institution ID format');
  }
  
  // Find the institution to get its name and ensure it exists
  const institution = await Institution.findById(institutionId).select('name');
  if (!institution) {
    throw new CustomError.NotFoundError(`No institution found with id: ${institutionId}`);
  }
  
  try {
    // --- Step 1: Fetch Both Levels of Transactions in Parallel for efficiency ---
    
    // Level 1 Query: Get all COMPLETED allocations from the Institution to its Departments
    const institutionToDeptPromise = Transaction.find({
      institution: institutionId,
      status: 'completed' // Only include funds that have been approved
    }).populate('department', 'name');

    // Level 2 Query: Get all spending logged by the Departments of this Institution
    const departmentToRecipientPromise = DepartmentTransaction.find({
      institution: institutionId,
    }).populate('department', 'name');

    // Await both promises to resolve
    const [allocations, spending] = await Promise.all([
      institutionToDeptPromise,
      departmentToRecipientPromise
    ]);

    // --- Step 2: Combine the Data into the Sankey Chart's Required Format ['From', 'To', 'Amount'] ---
    const chartData = [['From', 'To', 'Amount']]; // The mandatory header row
    const institutionName = institution.name;

    // Process Level 1 data (Institution -> Department)
    allocations.forEach(alloc => {
      // Check if the populated department and its name exist to prevent errors
      if (alloc.department?.name) { 
        chartData.push([
          institutionName,
          alloc.department.name,
          alloc.amount
        ]);
      }
    });

    // Process Level 2 data (Department -> Project/Vendor)
    spending.forEach(spend => {
      // Check if the populated department and its name exist
      if (spend.department?.name) {
        chartData.push([
          spend.department.name,
          spend.recipient, // This is the simple text field for Project/Vendor
          spend.amount
        ]);
      }
    });

    // --- Step 3: Send the Final, Combined Data to the Frontend ---
    res.status(StatusCodes.OK).json({
      institution: {
        id: institution._id,
        name: institution.name,
      },
      // The frontend SankeyChart component will now receive this pre-formatted array.
      // It no longer needs to do any data transformation.
      sankeyData: chartData,
    });

  } catch (error) {
    // Catch any unexpected errors during the process
    console.error('Flowchart Data Generation Error:', error);
    throw new CustomError.InternalServerError('An error occurred while generating the flowchart data');
  }
};

module.exports = {
  getFlowchartData,
};