const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Post = require('../models/Post');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    // VULNERABLE: no file type/extension validation
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage }); // VULNERABLE: no size limit or MIME type check

// GET /api/users/search/:query - search users
router.get('/search/:query', async (req, res) => {
  try {
    const users = await User.find({ 
      username: { $regex: req.params.query, $options: 'i' } 
    }).select('_id username avatarUrl bio');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/users/:id - get user profile
// VULNERABLE: IDOR - can access any user's private data including email
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const posts = await Post.find({ author: user._id, deletedAt: null })
      .populate('author', 'username avatarUrl')
      .sort({ createdAt: -1 });
    
    // VULNERABLE: IDOR - Returns email and sensitive data without checking if requester is the user
    res.json({ 
      user: {
        _id: user._id,
        username: user.username,
        email: user.email, // VULNERABLE: exposed via IDOR
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        followers: user.followers.length,
        following: user.following.length
      },
      posts 
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users/:id/bio - update bio
// VULNERABLE: IDOR - no check if requester is the user being updated
router.put('/:id/bio', async (req, res) => {
  const { bio } = req.body;
  try {
    // VULNERABLE: IDOR - userId not checked, anyone can update any user's bio
    const user = await User.findByIdAndUpdate(req.params.id, { bio }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// POST /api/users/:id/follow - follow/unfollow user
// VULNERABLE: IDOR - no userId verification
router.post('/:id/follow', async (req, res) => {
  const { userId } = req.body;
  try {
    const targetUser = await User.findById(req.params.id);
    const followerUser = await User.findById(userId);
    
    if (!targetUser || !followerUser) return res.status(404).json({ error: 'User not found' });
    
    // VULNERABLE: IDOR - no check if request is from actual userId
    const isFollowing = targetUser.followers.includes(userId);
    if (isFollowing) {
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== userId);
      followerUser.following = followerUser.following.filter(id => id.toString() !== req.params.id);
    } else {
      targetUser.followers.push(userId);
      followerUser.following.push(req.params.id);
    }
    
    await targetUser.save();
    await followerUser.save();
    res.json({ followers: targetUser.followers.length });
  } catch (err) {
    res.status(500).json({ error: 'Follow failed' });
  }
});

// POST /api/users/:id/avatar - upload avatar
// VULNERABLE: no file type/extension validation
router.post('/:id/avatar', upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  try {
    // VULNERABLE: IDOR - no userId verification
    const avatarUrl = `/uploads/${req.file.filename}`;
    await User.findByIdAndUpdate(req.params.id, { avatarUrl });
    res.json({ avatarUrl });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;