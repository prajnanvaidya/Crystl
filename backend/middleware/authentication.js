// server/middleware/authentication.js

const CustomError = require('../errors');
const { isTokenValid } = require('../utils');

const authenticateUser = async (req, res, next) => {
  // Check for the signed cookie containing the token
  const token = req.signedCookies.token;

  if (!token) {
    // If no token, the user is not authenticated
    throw new CustomError.UnauthenticatedError('Authentication Invalid: No token provided.');
  }

  try {
    // Verify the token and destructure the payload
    // The payload now contains { name, userId, role } where role is 'Institution', 'Department', or 'User'
    const { name, userId, role } = isTokenValid({ token });

    // Attach the user information to the request object for use in subsequent middleware/controllers
    req.user = { name, userId, role };
    
    // Pass control to the next middleware in the chain
    next();

  } catch (error) {
    // If token is invalid (expired, tampered, etc.)
    throw new CustomError.UnauthenticatedError('Authentication Invalid: Token is not valid.');
  }
};


// This function is a "higher-order" middleware. You call it with the allowed roles,
// and it returns another middleware function that does the actual checking.
const authorizePermissions = (...allowedRoles) => {
  return (req, res, next) => {
    // We check the role that was attached to req.user in the authenticateUser middleware.
    // The `allowedRoles` is an array like ['Institution'] or ['Department', 'Institution'].
    
    if (!req.user || !req.user.role) {
      // This is a safety check in case this middleware is used without authenticateUser first
      throw new CustomError.UnauthenticatedError('Authentication Invalid.');
    }

    if (!allowedRoles.includes(req.user.role)) {
      // If the user's role is not in the list of allowed roles, throw a forbidden error.
      throw new CustomError.UnauthorizedError(
        'Unauthorized to access this route.'
      );
    }
    
    // If the check passes, allow the request to proceed
    next();
  };
};

module.exports = {
  authenticateUser,
  authorizePermissions,
};