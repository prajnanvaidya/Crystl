// utils/jwt.js

const jwt = require('jsonwebtoken');

const createJWT = ({ payload }) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  });
  return token;
};

const isTokenValid = ({ token }) => jwt.verify(token, process.env.JWT_SECRET);

const attachCookiesToResponse = ({ res, user }) => {
  const token = createJWT({ payload: user });

  const oneDay = 1000 * 60 * 60 * 24;

  // --- START OF THE FIX ---

  // 1. Define the base cookie options
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + oneDay),
    signed: true,
  };

  // 2. If in production, add the specific cross-domain settings
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
    cookieOptions.sameSite = 'none';
  } else {
    // For development (e.g., localhost), 'lax' is more appropriate
    // and works without HTTPS.
    cookieOptions.sameSite = 'lax';
  }

  // 3. Set the cookie with the determined options
  res.cookie('token', token, cookieOptions);

  // --- END OF THE FIX ---
};


module.exports = {
  createJWT,
  isTokenValid,
  attachCookiesToResponse,
};