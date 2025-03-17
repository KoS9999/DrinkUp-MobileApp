const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  profileImage: { type: String },
  createdAt: { type: Date, default: Date.now },
  enable: { type: Boolean, default: true },
  points: { type: Number, default: 0 },
});
module.exports = mongoose.model('User', UserSchema);