const express = require('express');
const router = express.Router();
const { getDashboardStats, getUsers, updateUserRole } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/stats', protect, admin, getDashboardStats);
router.route('/users')
    .get(protect, admin, getUsers);
router.route('/users/:id/role')
    .put(protect, admin, updateUserRole);

module.exports = router;
