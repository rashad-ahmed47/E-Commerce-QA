const express = require('express');
const router = express.Router();
const { getPromotions, createPromotion, deletePromotion } = require('../controllers/promotionController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, admin, getPromotions)
    .post(protect, admin, createPromotion);
    
router.route('/:id').delete(protect, admin, deletePromotion);

module.exports = router;
