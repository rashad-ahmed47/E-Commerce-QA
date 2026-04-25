const Promotion = require('../models/Promotion');

const getPromotions = async (req, res) => {
    try {
        const promotions = await Promotion.find({}).sort('-createdAt');
        res.json(promotions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createPromotion = async (req, res) => {
    try {
        const { name, discountPercent, startDate, endDate, timezone, productIds, isActive } = req.body;
        
        const promotion = new Promotion({
            name,
            discountPercent,
            startDate,
            endDate,
            timezone,
            productIds,
            isActive
        });
        
        const createdPromotion = await promotion.save();
        res.status(201).json(createdPromotion);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deletePromotion = async (req, res) => {
    try {
        const promotion = await Promotion.findById(req.params.id);
        if (promotion) {
            await promotion.deleteOne();
            res.json({ message: 'Promotion removed' });
        } else {
            res.status(404).json({ message: 'Promotion not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPromotions,
    createPromotion,
    deletePromotion
};
