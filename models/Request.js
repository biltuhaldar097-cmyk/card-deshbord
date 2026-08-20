const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rowId: { type: Number, required: true, index: true },
  brand: { type: String, required: true, maxlength: 30 },
  cardNum: { type: String, required: true, maxlength: 80 },
  price: { type: Number, required: true },
  balance: { type: Number, default: 0 },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending', index: true }
}, { timestamps: true });

requestSchema.index({ userId: 1, createdAt: -1 });
requestSchema.index({ userId: 1, rowId: 1, status: 1 });

module.exports = mongoose.models.Request || mongoose.model('Request', requestSchema);
