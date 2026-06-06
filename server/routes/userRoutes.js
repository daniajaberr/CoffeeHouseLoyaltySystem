// userRoutes.js
// WHY THIS FILE EXISTS:
// These are the routes available to logged-in USERS (role: 'user' or 'admin').
// All routes here require a valid JWT — protected by the verifyToken middleware.

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { decrypt } = require('../utils/encryption');
const { verifyToken } = require('../middleware/auth');

// ─── GET PROFILE ──────────────────────────────────────────────────────────────
// GET /api/profile
// Returns the logged-in user's profile info including decrypted phone
router.get('/profile', verifyToken, (req, res, next) => {
  try {
    // req.user.userId was set by verifyToken middleware from the JWT payload
    const user = db.prepare(
      'SELECT id, name, email, encrypted_phone, role, loyalty_points FROM users WHERE id = ?'
    ).get(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Decrypt the phone number before sending to client
    const phone = user.encrypted_phone ? decrypt(user.encrypted_phone) : null;

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone,
      role: user.role,
      loyaltyPoints: user.loyalty_points,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET REWARDS ──────────────────────────────────────────────────────────────
// GET /api/rewards
// Returns all available rewards — visible to any logged-in user
router.get('/rewards', verifyToken, (req, res, next) => {
  try {
    const rewards = db.prepare('SELECT * FROM rewards ORDER BY points_required ASC').all();
    res.json(rewards);
  } catch (err) {
    next(err);
  }
});

// ─── REDEEM REWARD ────────────────────────────────────────────────────────────
// POST /api/redeem
// Deducts points from the user's account if they have enough
router.post('/redeem', verifyToken, [
  body('rewardId')
    .isInt({ min: 1 }).withMessage('Invalid reward ID.')
], (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { rewardId } = req.body;
    const userId = req.user.userId;

    // Look up the reward
    const reward = db.prepare('SELECT * FROM rewards WHERE id = ?').get(rewardId);
    if (!reward) {
      return res.status(404).json({ message: 'Reward not found.' });
    }

    // Look up the user's current points
    const user = db.prepare('SELECT loyalty_points FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if the user has enough points
    if (user.loyalty_points < reward.points_required) {
      return res.status(400).json({
        message: `Not enough points. You need ${reward.points_required} but have ${user.loyalty_points}.`
      });
    }

    // Deduct the points
    db.prepare(
      'UPDATE users SET loyalty_points = loyalty_points - ? WHERE id = ?'
    ).run(reward.points_required, userId);

    const newPoints = user.loyalty_points - reward.points_required;

    res.json({
      message: `Successfully redeemed: ${reward.reward_name}!`,
      pointsUsed: reward.points_required,
      remainingPoints: newPoints,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
