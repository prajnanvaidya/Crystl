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
  const { reportId } = req.query; // Get the optional reportId from the query parameters

  if (!mongoose.Types.ObjectId.isValid(institutionId)) {
    throw new CustomError.BadRequestError('Invalid Institution ID format');
  }
  
  const institution = await Institution.findById(institutionId).select('name');
  if (!institution) {
    throw new CustomError.NotFoundError(`No institution found with id: ${institutionId}`);
  }
  
  try {
    // --- Step 1: Define the base query for allocations ---
    const allocationQuery = {
      institution: institutionId,
      status: 'completed'
    };

    if (reportId) {
      if (!mongoose.Types.ObjectId.isValid(reportId)) {
        throw new CustomError.BadRequestError('Invalid Report ID format');
      }
      allocationQuery.report = reportId;
    }

    // --- Step 2: Fetch the allocations (Institution -> Department) based on the report ---
    const allocations = await Transaction.find(allocationQuery).populate('department', 'name');

    // --- Step 3: Get a unique list of department IDs from those allocations ---
    const departmentIds = [...new Set(allocations.map(alloc => alloc.department._id))];

    // --- Step 4: Fetch ALL spending transactions for ONLY those specific departments ---
    let spending = [];
    if (departmentIds.length > 0) {
        spending = await DepartmentTransaction.find({
            department: { $in: departmentIds }
        }).populate('department', 'name');
    }

    // --- Step 5: Combine the Data into the Sankey Chart's Required Format ---
    const chartData = [['From', 'To', 'Amount']];
    const institutionName = institution.name;

    // Process Level 1 data (Institution -> Department)
    allocations.forEach(alloc => {
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
      if (spend.department?.name) {
        chartData.push([
          spend.department.name,
          spend.recipient,
          spend.amount
        ]);
      }
    });

    // --- Step 6: Send the Final, Combined Data to the Frontend ---
    res.status(StatusCodes.OK).json({
      institution: {
        id: institution._id,
        name: institution.name,
      },
      sankeyData: chartData,
    });

  } catch (error) {
    console.error('Flowchart Data Generation Error:', error);
    throw error;
  }
};

module.exports = {
  getFlowchartData,
};