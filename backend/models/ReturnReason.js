const mongoose = require('mongoose');

const returnReasonSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const ReturnReason = mongoose.model('ReturnReason', returnReasonSchema);
module.exports = ReturnReason;
