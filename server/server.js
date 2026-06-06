// server.js
// WHY THIS FILE EXISTS:
// This is the main entry point of the application. It creates the Express app,
// wires up all the security middleware, connects the routes, and starts listening.
// Think of it as the "main function" of the backend.

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// Import our route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middleware/errorHandler');

// Initialize the database (creates tables + seeds data on first run)
require('./config/database');

const app = express();

// ─── SECURITY MIDDLEWARE ──────────────────────────────────────────────────────

// HELMET: Sets secure HTTP response headers automatically.
// Examples of what it does:
//   - X-Content-Type-Options: nosniff  (prevents MIME sniffing)
//   - X-Frame-Options: DENY            (prevents clickjacking)
//   - Strict-Transport-Security        (enforces HTTPS)
// We allow 'unsafe-inline' for scripts so our HTML pages can use
// inline <script> tags and onclick handlers (common in simple frontends)
// contentSecurityPolicy is disabled here because our frontend uses inline
// scripts and onclick handlers (simple HTML approach). All other Helmet
// headers still apply: X-Frame-Options, X-Content-Type-Options, etc.
app.use(helmet({ contentSecurityPolicy: false }));

// CORS: Controls which origins can make requests to our API.
// In development we allow localhost:3000 (our own server serving the frontend).
// In production you'd change this to your actual domain.
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Parse incoming JSON request bodies (e.g., POST /login with { email, password })
app.use(express.json());

// Serve the public folder as static files (HTML, CSS, JS)
// When browser visits http://localhost:3000/, it gets public/index.html
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// Public routes (no token required)
app.use('/api', authRoutes);

// Protected user routes (token required)
app.use('/api', userRoutes);

// Protected admin routes (token + admin role required)
app.use('/api/admin', adminRoutes);

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
// Must be LAST — Express recognizes it as an error handler because it has 4 params
app.use(errorHandler);

// ─── START SERVER ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n☕ Coffee House Loyalty System running at http://localhost:${PORT}`);
  console.log('   Admin login: admin@coffee.com / admin123\n');
});
