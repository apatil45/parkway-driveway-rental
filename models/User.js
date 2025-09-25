const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['driver', 'owner', 'admin'],
    default: 'driver'
  },
  carSize: {
    type: String,
    enum: ['small', 'medium', 'large', 'extra-large'],
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
