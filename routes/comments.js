const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');

// GET /api/posts/:postId/comments
router.get('/:postId/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId, deletedAt: null })
      .populate('author', 'username avatarUrl email')
      .populate('likes', 'username')
      .sort({ createdAt: 1 });
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
    await comment.populate('author', 'username avatarUrl');
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// DELETE /api/posts/:postId/comments/:commentId
router.delete('/:postId/comments/:commentId', async (req, res) => {
  try {
    const comment = await Comment.findByIdAndUpdate(
      req.params.commentId,
      { deletedAt: new Date() },
      { new: true }
    );
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// POST /api/posts/:postId/comments/:commentId/like
router.post('/:postId/comments/:commentId/like', async (req, res) => {
  const { userId } = req.body;
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    
    const liked = comment.likes.includes(userId);
    if (liked) {
      comment.likes = comment.likes.filter(id => id.toString() !== userId);
    } else {
      comment.likes.push(userId);
    }
    
    await comment.save();
    await comment.populate('likes', 'username');
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to like comment' });
  }
});

module.exports = router;
