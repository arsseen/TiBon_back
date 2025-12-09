const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: String,
  password: String, // VULNERABLE: storing plain text password intentionally
  avatarUrl: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
