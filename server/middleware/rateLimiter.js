// rateLimiter.js
// WHY THIS FILE EXISTS:
// Rate limiting prevents brute-force attacks on login/register endpoints.
// Without this, an attacker could try thousands of passwords per minute.
// express-rate-limit tracks requests by IP address and blocks excessive ones.

const rateLimit = require('express-rate-limit');

// LOGIN rate limiter
// Allows max 10 login attempts per IP in a 15-minute window
// After 10 failures, the IP gets 429 Too Many Requests
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 10,                   // max 10 requests per window
  message: {
    message: 'Too many login attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,     // Send rate limit info in response headers
  legacyHeaders: false,      // Disable old X-RateLimit headers
});

// REGISTER rate limiter
// Stricter: max 5 registrations per IP in 15 minutes
// Prevents spam account creation
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // max 5 registrations per window
  message: {
    message: 'Too many registration attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter, registerLimiter };
