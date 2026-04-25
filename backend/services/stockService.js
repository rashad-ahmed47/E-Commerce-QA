const Product = require('../models/Product');
const emailService = require('./emailService');

class StockService {
    async checkAndDeductStock(orderItems) {
        // We use mongoose transactions if running on a replica set. 
        // For local dev, we simulate it via checking and saving, or atomic updates.
        
        for (const item of orderItems) {
            const product = await Product.findById(item.product);
            if (!product) throw new Error(`Product ${item.product} not found`);
            if (product.stockQuantity < item.qty) {
                throw new Error(`Insufficient stock for ${product.name}`);
            }
        }

        // Deduct stock
        for (const item of orderItems) {
            const product = await Product.findByIdAndUpdate(item.product, {
                $inc: { stockQuantity: -item.qty }
            }, { new: true });

            // Check safety threshold
            if (product.stockQuantity <= product.safetyThreshold && product.stockQuantity > 0) {
                this.triggerLowStockAlert(product);
            } else if (product.stockQuantity === 0) {
                // Auto hide if out of stock (business logic choice)
                // product.isHidden = true;
                // await product.save();
                this.triggerOutOfStockAlert(product);
            }
        }
    }
    
    async restoreStock(returnItems) {
        for (const item of returnItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stockQuantity: item.qty }
            });
        }
    }

    triggerLowStockAlert(product) {
        emailService.sendEmail({
            email: process.env.ADMIN_EMAIL || 'admin@eshop.com',
            subject: `LOW STOCK ALERT: ${product.name}`,
            message: `Product ${product.name} (SKU: ${product.sku}) has reached low stock level. Only ${product.stockQuantity} remaining.`
        });
    }

    triggerOutOfStockAlert(product) {
        emailService.sendEmail({
            email: process.env.ADMIN_EMAIL || 'admin@eshop.com',
            subject: `OUT OF STOCK ALERT: ${product.name}`,
            message: `Product ${product.name} (SKU: ${product.sku}) is completely out of stock.`
        });
    }
}

module.exports = new StockService();
