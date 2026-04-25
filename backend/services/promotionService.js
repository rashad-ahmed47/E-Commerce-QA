const cron = require('node-cron');
const Promotion = require('../models/Promotion');
const Product = require('../models/Product');

class PromotionService {
    initCronJobs() {
        console.log('Initializing Promotion Cron Job (Runs every minute)');
        // Run every minute
        cron.schedule('* * * * *', async () => {
            await this.processPromotions();
        });
    }

    async processPromotions() {
        const now = new Date();
        
        try {
            // Find promotions that should start
            const scheduledPromos = await Promotion.find({
                status: 'Scheduled',
                isActive: true,
                startDate: { $lte: now },
                endDate: { $gt: now }
            });

            for (let promo of scheduledPromos) {
                await this.applyPromotion(promo);
                promo.status = 'Active';
                await promo.save();
                console.log(`Activated promotion: ${promo.name}`);
            }

            // Find promotions that should end
            const activePromos = await Promotion.find({
                status: 'Active',
                endDate: { $lte: now }
            });

            for (let promo of activePromos) {
                await this.removePromotion(promo);
                promo.status = 'Ended';
                promo.isActive = false;
                await promo.save();
                console.log(`Ended promotion: ${promo.name}`);
            }

        } catch (error) {
            console.error('Error processing promotions in cron:', error);
        }
    }

    async applyPromotion(promo) {
        // Calculate and set salePrice for all associated products
        for (let productId of promo.productIds) {
            const product = await Product.findById(productId);
            if (product) {
                const discountAmount = product.price * (promo.discountPercent / 100);
                product.salePrice = product.price - discountAmount;
                product.saleStart = promo.startDate;
                product.saleEnd = promo.endDate;
                await product.save();
            }
        }
    }

    async removePromotion(promo) {
        // Reset salePrice for all associated products
        for (let productId of promo.productIds) {
            const product = await Product.findById(productId);
            if (product) {
                product.salePrice = null;
                product.saleStart = null;
                product.saleEnd = null;
                await product.save();
            }
        }
    }
}

module.exports = new PromotionService();
