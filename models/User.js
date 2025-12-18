const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: String, // VULNERABLE: plain text password
  email: { type: String, unique: true, sparse: true }, // VULNERABLE: used in IDOR attacks
  avatarUrl: { type: String, default: '' },
  bio: { type: String, default: 'Hello, I am using MiniSocial.' },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);