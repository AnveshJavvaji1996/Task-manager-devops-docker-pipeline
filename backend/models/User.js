const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  contactNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // stored as a bcrypt hash, never plain text
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);