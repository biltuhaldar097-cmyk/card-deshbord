const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, minlength: 3, maxlength: 50 },
  email: { type: String, default: '', trim: true, lowercase: true },
  login: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
  passwordHash: { type: String, default: null },
  provider: { type: String, enum: ['local', 'google'], default: 'local' },
  googleSub: { type: String, default: null, unique: true, sparse: true }
}, { timestamps: true });

userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ username: 1 });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
