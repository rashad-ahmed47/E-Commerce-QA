const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  qty: { type: Number, required: true }
});

const returnRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Order',
  },
  returnItems: [returnItemSchema], // Specific items being returned
  reason: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  images: [String], // Array of evidence photo URLs
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'In Review', 'Approved', 'Rejected', 'Completed'],
    default: 'Pending',
  },
  resolution: {
    type: String,
    enum: ['Refund', 'Replacement', 'None'],
    default: 'None'
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundProcessedAt: {
    type: Date
  },
  adminComment: {
    type: String,
  },
  statusLog: [{
    status: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    comment: String
  }]
}, { timestamps: true });

const ReturnRequest = mongoose.model('ReturnRequest', returnRequestSchema);
module.exports = ReturnRequest;
