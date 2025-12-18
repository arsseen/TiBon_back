const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;
  try {
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
    const user = new User({ username, password, email }); // VULNERABLE: plain text password
    await user.save();
    res.json({ id: user._id, username: user.username, email: user.email });
  } catch (err) {
    res.status(500).json({ error: 'Username already exists' });
  }
});

// POST /api/auth/login - VULNERABLE: NoSQL Injection
// Example attack: { "username": { "$ne": null }, "password": { "$ne": null } }
// Or: { "email": { "$ne": null }, "password": { "$ne": null } }
router.post('/login', async (req, res) => {
  try {
    // VULNERABLE: No type validation - body passed directly to query
    const user = await User.findOne(req.body);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ id: user._id, username: user.username, email: user.email, avatarUrl: user.avatarUrl });
  } catch (err) {
    res.status(500).json({ error: 'Login error' });
  }
});

module.exports = router;