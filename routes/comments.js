
const router = require("express").Router();
const Comment = require("../models/Comment");
const User = require("../models/User");

router.post("/", async (req, res) => {
  const newComment = new Comment(req.body);
  try {
    const savedComment = await newComment.save();
    res.status(200).json(savedComment);
  } catch (err) {
    res.status(500).json(err);
  }
});
router.get("/:postId", async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId }).sort({ createdAt: -1 });
    const enrichedComments = await Promise.all(
        comments.map(async (c) => {
            const user = await User.findById(c.userId);
            return { ...c._doc, username: user ? user.username : "Unknown", profilePicture: user ? user.profilePicture : "" };
        })
    );
    
    res.status(200).json(enrichedComments);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;