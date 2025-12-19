const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

router.post("/", upload.single("file"), async (req, res) => {
  const newPost = new Post(req.body);
  if (req.file) {
    newPost.img = req.file.filename;
  }
  try {
    const savedPost = await newPost.save();
    res.status(200).json(savedPost);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.put("/:id/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post.likes.includes(req.body.userId)) {
      await post.updateOne({ $push: { likes: req.body.userId } });
      res.status(200).json("The post has been liked");
    } else {
      await post.updateOne({ $pull: { likes: req.body.userId } });
      res.status(200).json("The post has been disliked");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/timeline/:userId", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    
    const enrichedPosts = await Promise.all(
      posts.map(async (p) => {
        const user = await User.findById(p.userId);
        return { 
            ...p._doc, 
            user: user ? { 
                username: user.username, 
                profilePicture: user.profilePicture, 
                _id: user._id 
            } : null 
        };
      })
    );
    res.status(200).json(enrichedPosts);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/profile/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: { $regex: new RegExp(`^${req.params.username}$`, 'i') } });
    
    if (!user) {
        return res.status(404).json("User not found");
    }
    const posts = await Post.find({ userId: user._id }).sort({ createdAt: -1 });
    const enrichedPosts = posts.map(p => ({
        ...p._doc,
        user: {
            username: user.username,
            profilePicture: user.profilePicture,
            _id: user._id
        }
    }));

    res.status(200).json(enrichedPosts);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;