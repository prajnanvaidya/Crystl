// server/controllers/flowchartController.js

const Transaction = require('../models/Transaction');
const Institution = require('../models/Institution'); // We need this to get institution details
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const mongoose = require('mongoose'); // Needed for checking valid ObjectId

// =============================================
// ==      GET FLOWCHART DATA                 ==
// =============================================
const getFlowchartData = async (req, res) => {
  const { institutionId } = req.params; // Get the ID from the URL

  // A small validation check to ensure the provided ID is in a valid format
  if (!mongoose.Types.ObjectId.isValid(institutionId)) {
    throw new CustomError.BadRequestError('Invalid Institution ID format');
  }
  
  // Find the institution to make sure it exists
  const institution = await Institution.findById(institutionId);
  if (!institution) {
    throw new CustomError.NotFoundError(`No institution found with id: ${institutionId}`);
  }
  
  try {
    // This is the core logic: The MongoDB Aggregation Pipeline
    const aggregationPipeline = [
      // Stage 1: Match only the transactions for the requested institution
      {
        $match: {
          institution: new mongoose.Types.ObjectId(institutionId)
        }
      },
      // Stage 2: Group documents by BOTH department and status to sum their amounts
      {
        $group: {
          _id: {
            department: '$department',
            status: '$status'
          },
          totalAmount: { $sum: '$amount' }
        }
      },
      // Stage 3: Group again, this time just by department, to collect all statuses under one roof
      {
        $group: {
          _id: '$_id.department',
          statuses: {
            $push: {
              status: '$_id.status',
              amount: '$totalAmount'
            }
          },
          departmentTotal: { $sum: '$totalAmount' } // Calculate total for the whole department
        }
      },
      // Stage 4: Join with the 'departments' collection to get the department's name
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'departmentInfo'
        }
      },
      // Stage 5: Reshape and clean up the final output for the frontend
      {
        $project: {
          _id: 0, // Exclude the default MongoDB _id
          departmentId: '$_id',
          departmentName: { $arrayElemAt: ['$departmentInfo.name', 0] },
          departmentTotal: 1, // Include the department total
          breakdown: '$statuses' // The array of statuses and amounts
        }
      }
    ];

    const allocations = await Transaction.aggregate(aggregationPipeline);
    
    // Calculate the grand total of all transactions for the institution
    const grandTotal = allocations.reduce((acc, dept) => acc + dept.departmentTotal, 0);

    res.status(StatusCodes.OK).json({
      institution: {
        id: institution._id,
        name: institution.name,
      },
      totalAllocated: grandTotal,
      allocations: allocations,
    });

  } catch (error) {
    // This will catch any errors from the aggregation pipeline
    console.error('Aggregation Error:', error);
    throw new CustomError.InternalServerError('Error generating flowchart data');
  }
};

module.exports = {
  getFlowchartData,
};