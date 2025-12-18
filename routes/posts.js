const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');

// GET /api/posts - list all posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find({ deletedAt: null })
      .populate('author', 'username avatarUrl email')
      .populate('likes', 'username')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /api/posts/:id - get single post
// VULNERABLE: IDOR - no proper check if user has access to private posts
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, deletedAt: null })
      .populate('author', 'username avatarUrl email')
      .populate('likes', 'username');
    
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    // VULNERABLE: IDOR - Access to private posts not checked by userId
    // A user can view ANY post by just knowing its ID, regardless of privacy setting
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// POST /api/posts - create a post
router.post('/', async (req, res) => {
  const { title, content, userId, isPrivate } = req.body;
  try {
    const post = new Post({ 
      author: userId, 
      title, 
      content, 
      isPrivate: isPrivate || false // Can create private posts
    });
    await post.save();
    await post.populate('author', 'username avatarUrl');
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// DELETE /api/posts/:id - soft delete a post
router.delete('/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { deletedAt: new Date() },
      { new: true }
    );
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// POST /api/posts/:id/like - like/unlike a post
router.post('/:id/like', async (req, res) => {
  const { userId } = req.body;
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    const liked = post.likes.includes(userId);
    if (liked) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }
    
    await post.save();
    await post.populate('likes', 'username');
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to like post' });
  }
});

module.exports = router;
