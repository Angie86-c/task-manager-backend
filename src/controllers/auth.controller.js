const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { getDB } = require('../config/db');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register
function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required.' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  try {
    const db = getDB();

    const existing = db.prepare('SELECT id FROM Users WHERE email = ?').get(email);
    if (existing)
      return res.status(409).json({ error: 'Email already registered.' });

    const hashed = bcrypt.hashSync(password, 12);

    const result = db.prepare(
      'INSERT INTO Users (name, email, password) VALUES (?, ?, ?)'
    ).run(name, email, hashed);

    const user  = { id: result.lastInsertRowid, name, email };
    const token = signToken(user);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user,
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Server error during registration.' });
  }
}

// POST /api/auth/login
function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  try {
    const db   = getDB();
    const user = db.prepare('SELECT * FROM Users WHERE email = ?').get(email);

    if (!user)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const token = signToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error during login.' });
  }
}

// GET /api/auth/me
function getMe(req, res) {
  try {
    const db   = getDB();
    const user = db.prepare(
      'SELECT id, name, email, created_at FROM Users WHERE id = ?'
    ).get(req.user.id);

    if (!user)
      return res.status(404).json({ error: 'User not found.' });

    res.json({ user });
  } catch (err) {
    console.error('GetMe error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
}

module.exports = { register, login, getMe };