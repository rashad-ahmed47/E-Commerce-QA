const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  discountPercent: { type: Number, required: true, min: 1, max: 99 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  timezone: { type: String, default: 'UTC' },
  productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ['Scheduled', 'Active', 'Ended'], default: 'Scheduled' }
}, { timestamps: true });

const Promotion = mongoose.model('Promotion', promotionSchema);
module.exports = Promotion;
