// server/utils/anomalyDetector.js

const Transaction = require('../models/Transaction');
const DepartmentTransaction = require('../models/DepartmentTransaction');
const Anomaly = require('../models/Anomaly');

/**
 * Calculates total allocations vs. spending for a department and logs an anomaly if over budget.
 * @param {string} departmentId - The MongoDB ObjectId of the department.
 * @param {string} institutionId - The MongoDB ObjectId of the institution.
 */
const checkAndLogAnomaly = async (departmentId, institutionId) => {
  console.log(`Running anomaly check for Department: ${departmentId}`);

  // --- We run both database queries in parallel for maximum efficiency ---
  const [allocationResult, spendingResult] = await Promise.all([
    // Query 1: Calculate the sum of all 'completed' funds given TO the department
    Transaction.aggregate([
      { $match: { department: departmentId, institution: institutionId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    // Query 2: Calculate the sum of all spending logged BY the department
    DepartmentTransaction.aggregate([
      { $match: { department: departmentId, institution: institutionId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  // Extract the total, defaulting to 0 if no transactions exist yet
  const totalAllocated = allocationResult[0]?.total || 0;
  const totalSpent = spendingResult[0]?.total || 0;

  console.log(`Total Allocated: ${totalAllocated}, Total Spent: ${totalSpent}`);

  // --- The Core Anomaly Check ---
  if (totalSpent > totalAllocated) {
    const overageAmount = totalSpent - totalAllocated;
    console.warn(`ANOMALY DETECTED: Department ${departmentId} is over budget by ${overageAmount}`);

    // Create a record of this anomaly.
    // We could also add logic here to prevent creating duplicate 'new' anomalies.
    await Anomaly.create({
      department: departmentId,
      institution: institutionId,
      totalAllocated,
      totalSpent,
      overageAmount,
      triggeredBy: 'Department Spending Report Upload',
    });
  }
};

module.exports = { checkAndLogAnomaly };