const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'honeychain-secret-key-2026';
const ALLOWED_PUBLIC_ROLES = ['beekeeper', 'inspector', 'transporter', 'customer'];

const ROLE_LABELS = {
  beekeeper: 'Beekeeper',
  inspector: 'Quality Inspector',
  transporter: 'Transporter',
  customer: 'Customer',
  admin: 'Admin',
};

// POST /api/auth/register - Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};

    // Basic Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Please enter your name.' });
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Please enter your email address.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    const normalizedRole = (role || '').toLowerCase();
    if (!ALLOWED_PUBLIC_ROLES.includes(normalizedRole)) {
      if (normalizedRole === 'admin') {
        return res.status(403).json({ success: false, error: 'Admin role registration is restricted.' });
      }
      return res.status(400).json({ success: false, error: 'Please select a valid role.' });
    }

    const db = getDb();

    // Check if email already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'Email already registered.' });
    }

    // Securely hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user record
    const insertResult = db.prepare(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    ).run(name.trim(), email.trim().toLowerCase(), passwordHash, normalizedRole);

    const newUser = {
      id: insertResult.lastInsertRowid,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: normalizedRole,
    };

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      user: newUser,
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, error: 'An unexpected server error occurred during registration.' });
  }
});

// POST /api/auth/login - User login with backend role mismatch verification
router.post('/login', async (req, res) => {
  try {
    const { email, password, expected_role } = req.body || {};

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Please enter your email address.' });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'Please enter your password.' });
    }

    const db = getDb();

    // Find user by email
    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // Verify password against hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // Server-side Role Mismatch Enforcement (Step 6)
    if (expected_role) {
      const normalizedExpectedRole = expected_role.toLowerCase();
      const userRole = (user.role || '').toLowerCase();
      if (userRole !== normalizedExpectedRole) {
        const roleName = ROLE_LABELS[normalizedExpectedRole] || expected_role;
        return res.status(403).json({
          success: false,
          error: `This account does not have ${roleName} access. Registered role: ${ROLE_LABELS[userRole] || userRole}.`,
        });
      }
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // Issue JWT token
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '24h' });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userPayload,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'An unexpected server error occurred during login.' });
  }
});

// GET /api/auth/me - Verify session token & return profile
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No authentication token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const db = getDb();
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User account not found.' });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  }
});

module.exports = router;
