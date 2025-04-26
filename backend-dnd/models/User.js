const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true, // Trim whitespace
    index: true, // Add index for better query performance
  },
  name: {
    type: String,
    default: 'Player One',
    trim: true,
  },
  email: {
    type: String,
    default: 'player@playhazards.com',
    trim: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: 'Blockchain gaming enthusiast and NFT collector.',
    trim: true,
  },
  gameStats: {
    nftsOwned: {
      type: Number,
      default: 0,
      min: 0, // Prevent negative values
    },
    lastPlayed: {
      type: Date,
      default: Date.now,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true, // Cannot be changed after creation
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Validate email format if provided
userSchema.path('email').validate(function(email) {
  if (!email || email === 'player@playhazards.com') return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}, 'Invalid email format');

const User = mongoose.model('User', userSchema);

module.exports = User;