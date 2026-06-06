// authRoutes.js
// WHY THIS FILE EXISTS:
// Handles registration and login. These are the only public endpoints —
// no token required to access them (you need to log in to GET a token).

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { encrypt } = require('../utils/encryption');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

// ─── REGISTER ────────────────────────────────────────────────────────────────
// POST /api/register
// Validation rules — checked before the handler runs
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ max: 50 }).withMessage('Name too long.'),

  body('email')
    .trim()
    .normalizeEmail()                                    // sanitize
    .isEmail().withMessage('Please provide a valid email.'),

  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.')
    .isLength({ max: 100 }).withMessage('Password too long.'),

  body('phone')
    .trim()
    .optional()                                          // phone is optional
    .isMobilePhone().withMessage('Invalid phone number format.'),
];

router.post('/register', registerLimiter, registerValidation, async (req, res, next) => {
  try {
    // Check if validation found any errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return the first validation error message
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, password, phone } = req.body;

    // Check if email already exists in the database
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    // Hash the password using bcrypt (cost factor 10 = ~100ms per hash)
    // The higher the number, the slower and more secure the hash
    const passwordHash = await bcrypt.hash(password, 10);

    // Encrypt the phone number before storing (AES-256)
    // If no phone provided, store null
    const encryptedPhone = phone ? encrypt(phone) : null;

    // Insert the new user into the database
    db.prepare(`
      INSERT INTO users (name, email, password_hash, encrypted_phone, role, loyalty_points)
      VALUES (?, ?, ?, ?, 'user', 0)
    `).run(name, email, passwordHash, encryptedPhone);

    res.status(201).json({ message: 'Registration successful! Please log in.' });

  } catch (err) {
    next(err); // Pass to the global error handler
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
// POST /api/login
const loginValidation = [
  body('email')
    .trim()
    .normalizeEmail()
    .isEmail().withMessage('Please provide a valid email.'),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ max: 100 }).withMessage('Password too long.'),
];

router.post('/login', loginLimiter, loginValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    // Look up the user by email
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    // IMPORTANT: If user doesn't exist, we still run bcrypt.compare
    // to prevent timing attacks (attacker can't tell if email exists
    // based on how fast the response comes back)
    const dummyHash = '$2b$10$invalidhashfortimingatackprevention00000000000000';
    const passwordToCheck = user ? user.password_hash : dummyHash;

    const passwordMatch = await bcrypt.compare(password, passwordToCheck);

    if (!user || !passwordMatch) {
      // Generic message — don't reveal whether email or password was wrong
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Credentials are correct — generate a JWT
    // The payload is embedded in the token (readable but not forgeable)
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // Token expires after 24 hours
    );

    res.json({
      message: 'Login successful.',
      token,
      role: user.role,
      name: user.name,
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
