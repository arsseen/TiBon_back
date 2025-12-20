const User = require("../models/User");
const router = require("express").Router();
const multer = require("multer");
const path = require("path");

//file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
    cb(null, true); 
  } else {
    cb(new Error('Only JPEG/PNG allowed'), false);
  }
}
//idor 
const upload = multer({ storage: storage, fileFilter: fileFilter });
router.put("/:id", upload.single("file"), async (req, res) => {
  if (req.body.userId === req.params.id || req.body.isAdmin) {
      try {
        let updateData = req.body;
        if (req.file) {
            updateData.profilePicture = req.file.filename;
        }
        const user = await User.findByIdAndUpdate(req.params.id, {
          $set: updateData,
        }, { new: true });
        res.status(200).json(user);
      } catch (err) {
        return res.status(500).json(err);
      }
  } else {
      return res.status(403).json("Oshibka");
  }
});
router.get("/", async (req, res) => {
  const userId = req.query.userId;
  const username = req.query.username;
  try {
    const user = userId
      ? await User.findById(userId)
      : await User.findOne({ username: username });
    if(!user) return res.status(404).json("User not found");
    const { password, updatedAt, ...other } = user._doc;
    res.status(200).json(other);
  } catch (err) {
    res.status(500).json(err);
  }
});
router.post("/search", async (req, res) => {
    try {
        const query = req.body.query;
        const users = await User.find({ 
            username: { $regex: query, $options: "i" } 
        });
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json(err);
    }
});
router.put("/:id/follow", async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);
      if (!user.followers.includes(req.body.userId)) {
        await user.updateOne({ $push: { followers: req.body.userId } });
        await currentUser.updateOne({ $push: { following: req.params.id } });
        res.status(200).json("User has been followed");
      } else {
        res.status(403).json("you already follow this user");
      }
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("you cant follow yourself");
  }
});
router.put("/:id/unfollow", async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);
      if (user.followers.includes(req.body.userId)) {
        await user.updateOne({ $pull: { followers: req.body.userId } });
        await currentUser.updateOne({ $pull: { following: req.params.id } });
        res.status(200).json("User has been unfollowed");
      } else {
        res.status(403).json("you dont follow this user");
      }
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("you cant unfollow yourself");
  }
});

module.exports = router;