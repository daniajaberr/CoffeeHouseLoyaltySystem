// auth.js
// WHY THIS FILE EXISTS:
// These are middleware functions — code that runs BETWEEN receiving a request
// and running the route handler. They protect routes that require login or admin access.
//
// Middleware signature: (req, res, next)
//   req  = the incoming request
//   res  = the outgoing response
//   next = call this to pass control to the next middleware or route handler

const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

// MIDDLEWARE 1: verifyToken
// Checks that the request has a valid JWT token.
// If valid, it attaches the decoded user info to req.user
// If invalid or missing, it sends 401 Unauthorized and stops the request.
function verifyToken(req, res, next) {
  // The token is sent in the Authorization header like:
  // Authorization: Bearer eyJhbGci...
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  // Split "Bearer <token>" and take just the token part
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. Token malformed.' });
  }

  try {
    // jwt.verify checks:
    //   1. The signature is valid (wasn't tampered with)
    //   2. The token hasn't expired
    // If both pass, it returns the decoded payload (userId, role, etc.)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user info to the request so route handlers can use it
    req.user = decoded;

    // Pass control to the next function in the chain
    next();
  } catch (error) {
    // jwt.verify throws if token is invalid, expired, or tampered
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

// MIDDLEWARE 2: requireAdmin
// Must be used AFTER verifyToken (so req.user is already set).
// Checks that the logged-in user has the 'admin' role.
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    // User is logged in but doesn't have admin rights
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  next();
}

module.exports = { verifyToken, requireAdmin };
