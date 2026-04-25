const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const ReturnRequest = require('../models/ReturnRequest');

const getDashboardStats = async (req, res) => {
    try {
        const [ordersCount, productsCount, usersCount, returnsCount, revenueRaw] = await Promise.all([
            Order.countDocuments(),
            Product.countDocuments(),
            User.countDocuments(),
            ReturnRequest.countDocuments({ status: 'Pending' }),
            Order.aggregate([
                { $match: { isPaid: true } },
                { $group: { _id: null, totalSales: { $sum: '$totalPrice' } } }
            ])
        ]);

        const totalRevenue = revenueRaw.length > 0 ? revenueRaw[0].totalSales : 0;
        
        // Get low stock products
        const lowStockProducts = await Product.find({ 
            $expr: { $lte: ['$stockQuantity', '$safetyThreshold'] } 
        }).select('name stockQuantity sku').limit(5);

        res.json({
            orders: ordersCount,
            products: productsCount,
            users: usersCount,
            pendingReturns: returnsCount,
            revenue: totalRevenue,
            lowStockProducts
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.role = req.body.role || user.role;
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                role: updatedUser.role
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getDashboardStats,
    getUsers,
    updateUserRole
};
