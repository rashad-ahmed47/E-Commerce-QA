const Product = require('../models/Product');
const emailService = require('./emailService');

class StockService {
    /**
     * Atomically checks and deducts stock for all order items.
     * Uses a conditional findOneAndUpdate to eliminate the race condition
     * that existed between the check pass and the deduct pass.
     */
    async checkAndDeductStock(orderItems) {
        const updatedProducts = [];

        for (const item of orderItems) {
            // Atomic: only decrement if sufficient stock exists
            const product = await Product.findOneAndUpdate(
                {
                    _id: item.product,
                    stockQuantity: { $gte: item.qty }, // guard condition
                },
                {
                    $inc: { stockQuantity: -item.qty },
                },
                { new: true }
            );

            if (!product) {
                // Either product not found OR stock was insufficient
                // Roll back any successful deductions so far
                await this.restoreStock(updatedProducts);

                // Determine which error to give
                const exists = await Product.findById(item.product).select('name');
                if (!exists) {
                    throw new Error(`Product (ID: ${item.product}) not found`);
                }
                throw new Error(`Insufficient stock for "${exists.name}"`);
            }

            updatedProducts.push({ product: product._id, qty: item.qty });

            // Post-deduction alerts
            if (product.stockQuantity === 0) {
                this.triggerOutOfStockAlert(product).catch(console.error);
            } else if (product.stockQuantity <= product.safetyThreshold) {
                this.triggerLowStockAlert(product).catch(console.error);
            }
        }
    }

    async restoreStock(returnItems) {
        if (!returnItems || returnItems.length === 0) return;
        for (const item of returnItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stockQuantity: item.qty },
            });
        }
    }

    async triggerLowStockAlert(product) {
        return emailService.sendEmail({
            email: process.env.ADMIN_EMAIL || 'admin@eshop.com',
            subject: `⚠️ LOW STOCK ALERT: ${product.name}`,
            message: `Product "${product.name}" (SKU: ${product.sku}) has reached a low stock level.\n\nRemaining: ${product.stockQuantity} units.\nThreshold: ${product.safetyThreshold} units.`,
        });
    }

    async triggerOutOfStockAlert(product) {
        return emailService.sendEmail({
            email: process.env.ADMIN_EMAIL || 'admin@eshop.com',
            subject: `🚫 OUT OF STOCK: ${product.name}`,
            message: `Product "${product.name}" (SKU: ${product.sku}) is now completely out of stock.`,
        });
    }
}

module.exports = new StockService();
