const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Post = require('../models/Post');

// Simple multer storage to disk
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// GET /api/users/:id - return user profile and posts
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const posts = await Post.find({ author: user._id }).sort({ createdAt: -1 });
    res.json({ user, posts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/users/:id/avatar - upload avatar
router.post('/:id/avatar', (req, res) => {
  // VULNERABLE: no MIME/type validation, no extension whitelist, no size limit
  upload.single('avatar')(req, res, async function (err) {
    if (err) return res.status(500).json({ error: 'Upload failed' });
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const filePath = '/uploads/' + req.file.filename; // served statically from /uploads
      user.avatarUrl = filePath;
      await user.save();
      res.json({ avatarUrl: filePath });
    } catch (e) {
      res.status(500).json({ error: 'Failed to save avatar' });
    }
  });
});

module.exports = router;
