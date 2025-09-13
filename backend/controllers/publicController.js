// server/controllers/publicController.js

const Institution = require('../models/Institution');
const Transaction = require('../models/Transaction');
const DepartmentTransaction = require('../models/DepartmentTransaction');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const Report = require('../models/Report');
// =============================================
// ==      GET A LIST OF ALL INSTITUTIONS     ==
// =============================================
const getAllInstitutions = async (req, res) => {
  // Search functionality for institutions
  const { search } = req.query;
  const queryObject = {};
  if (search) {
    queryObject.name = { $regex: search, $options: 'i' };
  }

  // We only send the name and ID for the search/list view
  const institutions = await Institution.find(queryObject).select('name');
  res.status(StatusCodes.OK).json({ count: institutions.length, institutions });
};

// =============================================
// ==    SEARCH & FILTER TRANSACTIONS         ==
// =============================================
// This is the implementation for the bonus points challenge
const searchTransactions = async (req, res) => {
  const { institutionId } = req.params;
  const { search, department, status } = req.query; // Get filter values from query string

  // Start with the base query object, requiring the correct institution
  const queryObject = {
    institution: institutionId,
  };

  // If a 'search' query parameter is provided (for vendor/description)...
  if (search) {
    queryObject.$or = [
      { vendor: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  // If a 'department' ID is provided for filtering...
  if (department) {
    queryObject.department = department;
  }

  // If a 'status' is provided for filtering...
  if (status && ['pending_approval', 'completed', 'disputed'].includes(status)) {
    queryObject.status = status;
  }

  // Execute the final query
  const transactions = await Transaction.find(queryObject)
    .populate('department', 'name') // Get the department's name
    .sort('-date'); // Sort by most recent first

  res.status(StatusCodes.OK).json({ count: transactions.length, transactions });
};
const getInstitutionDetails = async (req, res) => {
  const { institutionId } = req.params;
  const institution = await Institution.findById(institutionId).select('name');
  if (!institution) {
    throw new CustomError.NotFoundError(`No institution found with id: ${institutionId}`);
  }
  res.status(StatusCodes.OK).json({ institution });
};

// Controller to get a public list of linked departments for a specific institution
const getPublicLinkedDepartments = async (req, res) => {
  const { institutionId } = req.params;
  const institution = await Institution.findById(institutionId)
    .populate({
      path: 'linkedDepartments',
      select: 'name' // Publicly expose only the department's name and _id
    });
  
  if (!institution) {
    throw new CustomError.NotFoundError(`No institution found with id: ${institutionId}`);
  }
  res.status(StatusCodes.OK).json({ departments: institution.linkedDepartments });
};

// Controller to get a public list of reports for a specific institution
const getPublicReports = async (req, res) => {
  const { institutionId } = req.params;
  const reports = await Report.find({ institution: institutionId })
    .sort('-reportDate')
    .select('name type reportDate'); // Only expose non-sensitive fields
  
  res.status(StatusCodes.OK).json({ reports });
};
// Public endpoint to get institution anomalies
const Anomaly = require('../models/Anomaly');
const getPublicInstitutionAnomalies = async (req, res) => {
  const { institutionId } = req.params;
  const anomaliesFromDB = await Anomaly.find({ institution: institutionId })
    .populate({ path: 'department', select: 'name departmentId' })
    .sort('-createdAt');
  const anomaliesForFrontend = anomaliesFromDB.map(anomaly => {
    const anomalyObject = anomaly.toObject();
    const departmentName = anomalyObject.department?.name || 'An unknown department';
    const formattedOverage = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(anomalyObject.overageAmount);
    anomalyObject.message = `The "${departmentName}" department has overspent its allocated budget by ${formattedOverage}.`;
    return anomalyObject;
  });
  res.status(200).json({
    count: anomaliesForFrontend.length,
    anomalies: anomaliesForFrontend,
  });
};

const getAllTransactionsForInstitution = async (req, res) => {
    try {
        const { institutionId } = req.params;
        const { search, page = 1 } = req.query;
        const limit = 10;
        const skip = (page - 1) * limit;

        // First verify the institution exists
        const institution = await Institution.findById(institutionId);
        if (!institution) {
            throw new CustomError.NotFoundError(`No institution found with id: ${institutionId}`);
        }

        // Fetch both types of transactions in parallel for efficiency
        const institutionTransactionsPromise = Transaction.find({ institution: institutionId })
            .populate('department', 'name')
            .sort('-date');
        const departmentTransactionsPromise = DepartmentTransaction.find({ institution: institutionId })
            .populate('department', 'name')
            .sort('-date');

        const [institutionTransactions, departmentTransactions] = await Promise.all([
            institutionTransactionsPromise,
            departmentTransactionsPromise
        ]);

        // Combine and add a 'type' to distinguish them on the frontend
        let allTransactions = [
            ...institutionTransactions.map(t => ({...t.toObject(), type: 'Allocation'})),
            ...departmentTransactions.map(t => ({...t.toObject(), type: 'Spending'}))
        ];

        // If a search term is provided, filter the combined list
        if (search) {
            const searchTerm = search.toLowerCase();
            allTransactions = allTransactions.filter(t =>
                (t.department?.name && t.department.name.toLowerCase().includes(searchTerm)) ||
                (t.vendor && t.vendor.toLowerCase().includes(searchTerm)) ||
                (t.recipient && t.recipient.toLowerCase().includes(searchTerm)) ||
                (t.description && t.description.toLowerCase().includes(searchTerm))
            );
        }

        // Sort all transactions by date in descending order
        allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Calculate pagination
        const totalTransactions = allTransactions.length;
        const totalPages = Math.ceil(totalTransactions / limit);
        
        // Get paginated transactions
        const paginatedTransactions = allTransactions.slice(skip, skip + limit);

        res.status(StatusCodes.OK).json({ 
            count: totalTransactions, 
            transactions: paginatedTransactions,
            currentPage: parseInt(page),
            totalPages
        });
    } catch (error) {
        console.error('Error in getAllTransactionsForInstitution:', error);
        if (error instanceof CustomError.NotFoundError) {
            throw error;
        }
        throw new CustomError.BadRequestError('Error retrieving transactions. Please try again.');
    }
};
module.exports = {
  getInstitutionDetails,
  getPublicLinkedDepartments,
  getPublicReports,
  getAllInstitutions,
  searchTransactions,
  getPublicInstitutionAnomalies,
  getAllTransactionsForInstitution
};