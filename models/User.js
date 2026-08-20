const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: undefined
  },
  login: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  passwordHash: {
    type: String,
    default: null
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  googleSub: {
    type: String,
    default: null
  }
}, { timestamps: true });

// Email must be unique only when a real, non-empty email exists.
userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      email: { $type: 'string', $ne: '' }
    }
  }
);

// Google subject must be unique only for Google accounts that have one.
userSchema.index(
  { googleSub: 1 },
  {
    unique: true,
    partialFilterExpression: {
      googleSub: { $type: 'string' }
    }
  }
);

// Username is intentionally NOT unique. Login/email is the account identity.
userSchema.index({ username: 1 });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
