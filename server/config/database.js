// database.js
// WHY THIS FILE EXISTS:
// This file sets up our SQLite database connection and creates the tables
// if they don't exist yet. It runs once when the server starts.
// We use 'better-sqlite3' which is synchronous (simpler than async SQLite drivers).

const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

// Store the database file in the server folder
const DB_PATH = path.join(__dirname, '..', 'coffeedb.sqlite');

// Open (or create) the database file
const db = new Database(DB_PATH);

// Enable WAL mode for better performance (optional but good practice)
db.pragma('journal_mode = WAL');

// Create the USERS table if it doesn't already exist
// This runs every time the server starts — IF NOT EXISTS prevents errors
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    encrypted_phone TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    loyalty_points INTEGER NOT NULL DEFAULT 0
  )
`);

// Create the REWARDS table if it doesn't already exist
db.exec(`
  CREATE TABLE IF NOT EXISTS rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reward_name TEXT NOT NULL,
    points_required INTEGER NOT NULL
  )
`);

// Create a default admin account if no admin exists yet
// This runs once on first startup so you can immediately log in as admin
function seedAdmin() {
  const existingAdmin = db.prepare("SELECT id FROM users WHERE role = 'admin'").get();

  if (!existingAdmin) {
    // Hash the default admin password before storing
    const hashedPassword = bcrypt.hashSync('admin123', 10);

    db.prepare(`
      INSERT INTO users (name, email, password_hash, role, loyalty_points)
      VALUES (?, ?, ?, 'admin', 0)
    `).run('Admin', 'admin@coffee.com', hashedPassword);

    console.log('Default admin created: admin@coffee.com / admin123');
  }
}

// Create some sample rewards if the rewards table is empty
function seedRewards() {
  const count = db.prepare('SELECT COUNT(*) as count FROM rewards').get();

  if (count.count === 0) {
    const insert = db.prepare('INSERT INTO rewards (reward_name, points_required) VALUES (?, ?)');
    insert.run('Free Coffee', 100);
    insert.run('Free Muffin', 50);
    insert.run('10% Discount', 75);
    console.log('Sample rewards created.');
  }
}

seedAdmin();
seedRewards();

// Export the db object so other files can use it
module.exports = db;
