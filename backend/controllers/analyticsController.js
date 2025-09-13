const Transaction = require('../models/Transaction');
const Report = require('../models/Report'); // We need the Report model
const { StatusCodes } = require('http-status-codes');
const mongoose = require('mongoose');

// =========================================================
// ==      GET SPENDING TREND (Monthly, Quarterly, Annual) ==
// =========================================================
const getSpendingTrend = async (req, res) => {
  const { institutionId } = req.params;
  const { groupBy = 'monthly' } = req.query; // Default to monthly, can also be 'quarterly' or 'annually'

  // --- 1. Define the grouping key based on the query parameter ---
  let dateGroupingId;
  switch (groupBy) {
    case 'quarterly':
      dateGroupingId = {
        year: { $year: '$reportInfo.reportDate' },
        // Formula to calculate the quarter from the month
        quarter: { $ceil: { $divide: [{ $month: '$reportInfo.reportDate' }, 3] } }
      };
      break;
    case 'annually':
      dateGroupingId = { year: { $year: '$reportInfo.reportDate' } };
      break;
    case 'monthly':
    default:
      dateGroupingId = {
        year: { $year: '$reportInfo.reportDate' },
        month: { $month: '$reportInfo.reportDate' }
      };
      break;
  }

  // --- 2. The Aggregation Pipeline ---
  const aggregationPipeline = [
    // Stage 1: Match only completed transactions for the specified institution
    { $match: { institution: new mongoose.Types.ObjectId(institutionId), status: 'completed' } },

    // Stage 2: Join with the 'reports' collection to get the reportDate for each transaction
    {
      $lookup: {
        from: 'reports',
        localField: 'report',
        foreignField: '_id',
        as: 'reportInfo'
      }
    },
    // Deconstruct the reportInfo array to a single object
    { $unwind: '$reportInfo' },

    // Stage 3: Group by the date key we defined above and sum the amounts
    {
      $group: {
        _id: dateGroupingId,
        totalSpent: { $sum: '$amount' }
      }
    },

    // Stage 4: Sort the results chronologically
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.quarter': 1 } }
  ];

  const spendingTrend = await Transaction.aggregate(aggregationPipeline);

  res.status(StatusCodes.OK).json({ groupBy, spendingTrend });
};


// =============================================
// ==      DATA FOR DEPARTMENT PIE CHART      ==
// =============================================
const getDepartmentShare = async (req, res) => {
  const { institutionId } = req.params;

  const aggregationPipeline = [
    { $match: { institution: new mongoose.Types.ObjectId(institutionId), status: 'completed' } },
    { $group: { _id: '$department', totalSpent: { $sum: '$amount' } } },
    { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'departmentInfo' } },
    { $project: { _id: 0, departmentName: { $arrayElemAt: ['$departmentInfo.name', 0] }, totalSpent: 1 } }
  ];

  const departmentShares = await Transaction.aggregate(aggregationPipeline);
  res.status(StatusCodes.OK).json({ departmentShares });
};


module.exports = {
  getSpendingTrend,
  getDepartmentShare,
};