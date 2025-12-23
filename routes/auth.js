
const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");

router.post("/register", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword, 
    });

    const user = await newUser.save();
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});


router.post("/login", async (req, res) => {
  try {
    if (typeof req.body.username !== 'string' || typeof req.body.password !== 'string') {
        console.log("NoSQL Injection attempt blocked");
        return res.status(400).json("Invalid data format");
    }
    const user = await User.findOne({ username: req.body.username });
    
    if (!user) {
        return res.status(404).json("User not found");
    }
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) {
        return res.status(400).json("Wrong password");
    }
    const { password, ...other } = user._doc;
    res.status(200).json(other);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;