const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = new User({ username, password }); // VULNERABLE: plain text password
    await user.save();
    res.json({ id: user._id, username: user.username });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  // VULNERABLE: NoSQL Injection because body is used directly in query
  // Example attack: { "username": { "$ne": null }, "password": { "$ne": null } }
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    // Return simple user object and fake session token (user id)
    res.json({ id: user._id, username: user.username });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
