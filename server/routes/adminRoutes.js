// adminRoutes.js
// WHY THIS FILE EXISTS:
// Admin-only routes. Every route here uses BOTH verifyToken AND requireAdmin,
// so a regular user can never access any of these endpoints.

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Apply both middlewares to every route in this file
// This is equivalent to adding [verifyToken, requireAdmin] to every route
router.use(verifyToken, requireAdmin);

// ─── GET ALL USERS ────────────────────────────────────────────────────────────
// GET /api/admin/users
// Returns all users with their loyalty points (no passwords, no phone numbers)
router.get('/users', (req, res, next) => {
  try {
    const users = db.prepare(
      'SELECT id, name, email, role, loyalty_points FROM users ORDER BY id ASC'
    ).all();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// ─── ADD POINTS TO USER ───────────────────────────────────────────────────────
// POST /api/admin/users/:id/add-points
// Admin can add loyalty points to a user's account
router.post('/users/:id/add-points', [
  body('points')
    .isInt({ min: 1, max: 10000 }).withMessage('Points must be a number between 1 and 10000.')
], (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const userId = parseInt(req.params.id);
    const { points } = req.body;

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    db.prepare(
      'UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?'
    ).run(points, userId);

    res.json({ message: `Added ${points} points to user #${userId}.` });
  } catch (err) {
    next(err);
  }
});

// ─── GET ALL REWARDS ─────────────────────────────────────────────────────────
// GET /api/admin/rewards
router.get('/rewards', (req, res, next) => {
  try {
    const rewards = db.prepare('SELECT * FROM rewards ORDER BY id ASC').all();
    res.json(rewards);
  } catch (err) {
    next(err);
  }
});

// ─── ADD REWARD ───────────────────────────────────────────────────────────────
// POST /api/admin/rewards
router.post('/rewards', [
  body('reward_name')
    .trim()
    .notEmpty().withMessage('Reward name is required.')
    .isLength({ max: 100 }).withMessage('Reward name too long.'),

  body('points_required')
    .isInt({ min: 1 }).withMessage('Points required must be a positive number.'),
], (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { reward_name, points_required } = req.body;

    const result = db.prepare(
      'INSERT INTO rewards (reward_name, points_required) VALUES (?, ?)'
    ).run(reward_name, points_required);

    res.status(201).json({
      message: 'Reward added.',
      reward: { id: result.lastInsertRowid, reward_name, points_required }
    });
  } catch (err) {
    next(err);
  }
});

// ─── EDIT REWARD ──────────────────────────────────────────────────────────────
// PUT /api/admin/rewards/:id
router.put('/rewards/:id', [
  body('reward_name')
    .trim()
    .notEmpty().withMessage('Reward name is required.')
    .isLength({ max: 100 }).withMessage('Reward name too long.'),

  body('points_required')
    .isInt({ min: 1 }).withMessage('Points required must be a positive number.'),
], (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const rewardId = parseInt(req.params.id);
    const { reward_name, points_required } = req.body;

    const reward = db.prepare('SELECT id FROM rewards WHERE id = ?').get(rewardId);
    if (!reward) {
      return res.status(404).json({ message: 'Reward not found.' });
    }

    db.prepare(
      'UPDATE rewards SET reward_name = ?, points_required = ? WHERE id = ?'
    ).run(reward_name, points_required, rewardId);

    res.json({ message: 'Reward updated.' });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE REWARD ────────────────────────────────────────────────────────────
// DELETE /api/admin/rewards/:id
router.delete('/rewards/:id', (req, res, next) => {
  try {
    const rewardId = parseInt(req.params.id);

    const reward = db.prepare('SELECT id FROM rewards WHERE id = ?').get(rewardId);
    if (!reward) {
      return res.status(404).json({ message: 'Reward not found.' });
    }

    db.prepare('DELETE FROM rewards WHERE id = ?').run(rewardId);
    res.json({ message: 'Reward deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
