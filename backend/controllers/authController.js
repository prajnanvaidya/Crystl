// server/controllers/authController.js

const Institution = require('../models/Institution');
const Department = require('../models/Department');
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { attachCookiesToResponse, createTokenUser } = require('../utils');
const crypto = require('crypto'); // To generate a unique department ID

// --- HELPER FUNCTION TO CREATE A TOKEN USER ---
// This prevents us from repeating code for each user type
const createGenericTokenUser = (user) => {
  // We need to know the model to check the role later
  const modelName = user.constructor.modelName; // 'Institution', 'Department', or 'User'
  return { name: user.name, userId: user._id, role: modelName };
};


// =============================================
// ==         INSTITUTION AUTH                ==
// =============================================
const registerInstitution = async (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    throw new CustomError.BadRequestError('Please provide all values');
  }

  const emailAlreadyExists = await Institution.findOne({ email });
  if (emailAlreadyExists) {
    throw new CustomError.BadRequestError('Email already exists');
  }

  const institution = await Institution.create({ name, email, password });
  const tokenUser = createGenericTokenUser(institution);
  attachCookiesToResponse({ res, user: tokenUser });
  res.status(StatusCodes.CREATED).json({ user: tokenUser });
};

const loginInstitution = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new CustomError.BadRequestError('Please provide email and password');
  }
  const institution = await Institution.findOne({ email });
  if (!institution) {
    throw new CustomError.UnauthenticatedError('Invalid Credentials');
  }
  const isPasswordCorrect = await institution.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError('Invalid Credentials');
  }
  const tokenUser = createGenericTokenUser(institution);
  attachCookiesToResponse({ res, user: tokenUser });
  res.status(StatusCodes.OK).json({ user: tokenUser });
};

// =============================================
// ==         DEPARTMENT AUTH                 ==
// =============================================
const registerDepartment = async (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    throw new CustomError.BadRequestError('Please provide all values');
  }
  const emailAlreadyExists = await Department.findOne({ email });
  if (emailAlreadyExists) {
    throw new CustomError.BadRequestError('Email already exists');
  }

  // Generate a unique, human-readable Department ID
  const uniqueId = `DEPT-${name.substring(0, 4).toUpperCase()}-${crypto.randomBytes(3).toString('hex')}`;

  const department = await Department.create({ name, email, password, departmentId: uniqueId });
  const tokenUser = createGenericTokenUser(department);
  attachCookiesToResponse({ res, user: tokenUser });
  res.status(StatusCodes.CREATED).json({ user: tokenUser, departmentId: department.departmentId });
};

const loginDepartment = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new CustomError.BadRequestError('Please provide email and password');
  }
  const department = await Department.findOne({ email });
  if (!department) {
    throw new CustomError.UnauthenticatedError('Invalid Credentials');
  }
  const isPasswordCorrect = await department.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError('Invalid Credentials');
  }
  const tokenUser = createGenericTokenUser(department);
  attachCookiesToResponse({ res, user: tokenUser });
  res.status(StatusCodes.OK).json({ user: tokenUser });
};

// =============================================
// ==         PUBLIC USER AUTH                ==
// =============================================
const registerUser = async (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    throw new CustomError.BadRequestError('Please provide all values');
  }
  const emailAlreadyExists = await User.findOne({ email });
  if (emailAlreadyExists) {
    throw new CustomError.BadRequestError('Email already exists');
  }
  const user = await User.create({ name, email, password });
  const tokenUser = createGenericTokenUser(user);
  attachCookiesToResponse({ res, user: tokenUser });
  res.status(StatusCodes.CREATED).json({ user: tokenUser });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new CustomError.BadRequestError('Please provide email and password');
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError.UnauthenticatedError('Invalid Credentials');
  }
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError('Invalid Credentials');
  }
  const tokenUser = createGenericTokenUser(user);
  attachCookiesToResponse({ res, user: tokenUser });
  res.status(StatusCodes.OK).json({ user: tokenUser });
};

// =============================================
// ==         GENERIC LOGOUT                  ==
// =============================================
const logout = async (req, res) => {
  res.cookie('token', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.status(StatusCodes.OK).json({ msg: 'user logged out!' });
};


module.exports = {
  registerInstitution,
  loginInstitution,
  registerDepartment,
  loginDepartment,
  registerUser,
  loginUser,
  logout,
};