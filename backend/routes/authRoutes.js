const express = require('express');
const router = express.Router();
const {
  registerUser,
  authUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  clearRecentlyViewed
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.delete('/recently-viewed', protect, clearRecentlyViewed);

module.exports = router;
