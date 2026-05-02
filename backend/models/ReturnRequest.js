let mongoose;
try {
  mongoose = require('mongoose');
} catch {
  // Allow the module to load in test environments without mongoose
  module.exports = {};
  return;
}

const returnRequestSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Order',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  reason: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 1000,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  refundAmount: {
    type: Number,
    default: 0,
  },
  refundedAt: Date,
  adminNotes: String,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

const ReturnRequest = mongoose.model('ReturnRequest', returnRequestSchema);
module.exports = ReturnRequest;
