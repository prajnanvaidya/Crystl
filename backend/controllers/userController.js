// server/controllers/userController.js

const User = require('../models/User');
const Institution = require('../models/Institution');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const mongoose = require('mongoose');

// =============================================
// ==      FOLLOW AN INSTITUTION              ==
// =============================================
const followInstitution = async (req, res) => {
  const { institutionId } = req.params;
  const { userId } = req.user; // Get the logged-in user's ID from the auth middleware

  if (!mongoose.Types.ObjectId.isValid(institutionId)) {
    throw new CustomError.BadRequestError('Invalid Institution ID format');
  }

  // Check if the institution actually exists
  const institution = await Institution.findById(institutionId);
  if (!institution) {
    throw new CustomError.NotFoundError(`No institution with id: ${institutionId}`);
  }

  // Find the user and add the institution's ID to their 'followedInstitutions' array.
  // We use findByIdAndUpdate with the $addToSet operator.
  // $addToSet is perfect because it only adds the ID if it's not already present.
  await User.findByIdAndUpdate(
    userId,
    { $addToSet: { followedInstitutions: institutionId } },
    { new: true, runValidators: true } // Options
  );

  res.status(StatusCodes.OK).json({ msg: `You are now following ${institution.name}` });
};


// =============================================
// ==      UNFOLLOW AN INSTITUTION            ==
// =============================================
const unfollowInstitution = async (req, res) => {
  const { institutionId } = req.params;
  const { userId } = req.user;

  if (!mongoose.Types.ObjectId.isValid(institutionId)) {
    throw new CustomError.BadRequestError('Invalid Institution ID format');
  }

  // Find the user and remove the institution's ID from their 'followedInstitutions' array.
  // We use the $pull operator to remove an item from an array.
  await User.findByIdAndUpdate(
    userId,
    { $pull: { followedInstitutions: institutionId } },
    { new: true, runValidators: true }
  );

  res.status(StatusCodes.OK).json({ msg: 'You have unfollowed the institution.' });
};


// =============================================
// ==      SHOW USER'S DASHBOARD              ==
// =============================================
const showMyDashboard = async (req, res) => {
  const { userId } = req.user;

  // Find the current user and use .populate() to get the full details of each institution they follow.
  // Instead of just returning IDs, this will return an array of full Institution documents.
  // We select only the 'name' and 'email' fields of the institution for this example.
  const user = await User.findById(userId).populate({
    path: 'followedInstitutions',
    select: 'name email'
  });

  if (!user) {
    throw new CustomError.NotFoundError('User not found.');
  }

  res.status(StatusCodes.OK).json({ followedInstitutions: user.followedInstitutions });
};


module.exports = {
  followInstitution,
  unfollowInstitution,
  showMyDashboard,
};