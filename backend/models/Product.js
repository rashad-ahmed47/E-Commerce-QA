const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  stockQuantity: { type: Number, required: true, default: 0 },
  images: [{ type: String }], // Array of image URLs
  
  // Promotions / Sales
  salePrice: { type: Number, default: null },
  saleStart: { type: Date, default: null },
  saleEnd: { type: Date, default: null },
  
  // Inventory Intelligence
  safetyThreshold: { type: Number, default: 5 }, // Low stock alert threshold
  isHidden: { type: Boolean, default: false }, // Auto-hide out of stock items
  
  // Parent-child variant logic (3-level deep)
  parentProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  variantGroup: { type: String, default: null }, // e.g., 'T-Shirt-Style-A'
  variantLevel: { type: Number, default: 0 }, // 0=parent, 1=color, 2=size, 3=material
  attributes: { type: Map, of: String }, // e.g. { size: "M", color: "Red" }
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  reviews: [{
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  }],
  rating: {
    type: Number,
    required: true,
    default: 0,
  },
  numReviews: {
    type: Number,
    required: true,
    default: 0,
  },
}, { timestamps: true });

// Create indexes for search and sorting
productSchema.index({ name: 'text', description: 'text', category: 'text' });
productSchema.index({ price: 1, createdAt: -1 });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
