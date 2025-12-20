
const router = require("express").Router();
const User = require("../models/User");

router.post("/register", async (req, res) => {
  try {
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password, 
    });

    const user = await newUser.save();
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});


router.post("/login", async (req, res) => {
  try {
    //nosql injection 

    if (typeof req.body.username !== 'string' || typeof req.body.password !== 'string') {
        console.log("!!! SECURITY ALERT: NoSQL Injection attempt detected !!!");
        return res.status(400).json("Invalid data format");
    }
    const user = await User.findOne({ 
        username: req.body.username, 
        password: req.body.password 
    });

    if (!user) {
        return res.status(404).json("User not found");
    }

    const { password, ...other } = user._doc;
    res.status(200).json(other);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;