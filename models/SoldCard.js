const mongoose = require('mongoose');

const soldCardSchema = new mongoose.Schema({
  rowId: { type: Number, required: true, unique: true, index: true },
  requestId: { type: String, required: true, unique: true, index: true }
}, { timestamps: { createdAt: 'approvedAt', updatedAt: false } });

module.exports = mongoose.models.SoldCard || mongoose.model('SoldCard', soldCardSchema);
