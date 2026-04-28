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

function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required.' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  try {
    const db = getDB();

    const existing = db.exec(`SELECT id FROM Users WHERE email = '${email}'`);
    if (existing.length > 0 && existing[0].values.length > 0)
      return res.status(409).json({ error: 'Email already registered.' });

    const hashed = bcrypt.hashSync(password, 12);

    db.run(
      `INSERT INTO Users (name, email, password) VALUES (?, ?, ?)`,
      [name, email, hashed]
    );
    db.save();

    const result = db.exec(`SELECT id, name, email FROM Users WHERE email = '${email}'`);
    const row    = result[0].values[0];
    const user   = { id: row[0], name: row[1], email: row[2] };
    const token  = signToken(user);

    res.status(201).json({ message: 'Registration successful', token, user });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Server error during registration.' });
  }
}

function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  try {
    const db     = getDB();
    const result = db.exec(`SELECT * FROM Users WHERE email = '${email}'`);

    if (result.length === 0 || result[0].values.length === 0)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const cols    = result[0].columns;
    const row     = result[0].values[0];
    const user    = {};
    cols.forEach((c, i) => user[c] = row[i]);

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

function getMe(req, res) {
  try {
    const db     = getDB();
    const result = db.exec(
      `SELECT id, name, email, created_at FROM Users WHERE id = ${req.user.id}`
    );

    if (result.length === 0 || result[0].values.length === 0)
      return res.status(404).json({ error: 'User not found.' });

    const cols = result[0].columns;
    const row  = result[0].values[0];
    const user = {};
    cols.forEach((c, i) => user[c] = row[i]);

    res.json({ user });
  } catch (err) {
    console.error('GetMe error:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
}

module.exports = { register, login, getMe };