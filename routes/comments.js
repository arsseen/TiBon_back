const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');

// GET /api/posts/:postId/comments
router.get('/:postId/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId }).populate('author', 'username').sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/posts/:postId/comments
router.post('/:postId/comments', async (req, res) => {
  const { text, userId } = req.body;
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    // VULNERABLE: No sanitization of comment text (stored XSS)
    const comment = new Comment({ post: post._id, author: userId, text });
    await comment.save();
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

module.exports = router;
