const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const ReturnRequest = require('./models/ReturnReason'); // Also wipe this or return requests if possible

dotenv.config();

connectDB();

const importData = async () => {
    try {
        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();

        const createdUsers = await User.insertMany([
            {
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'password123',
                role: 'Admin'
            },
            {
                name: 'Test Customer',
                email: 'customer@example.com',
                password: 'password123',
                role: 'Customer'
            }
        ]);

        const adminUser = createdUsers[0]._id;

        const sampleProducts = [
            {
                name: 'Premium Wireless Headphones',
                sku: 'WH-1000XM4',
                description: 'Industry leading noise cancellation, up to 30-hour battery life.',
                price: 349.99,
                category: 'Electronics',
                stockQuantity: 50,
                user: adminUser,
                images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80']
            },
            {
                name: 'Mechanical Keyboard',
                sku: 'KB-MX-BROWN',
                description: 'RGB Backlit Mechanical Gaming Keyboard with Brown switches.',
                price: 129.99,
                category: 'Electronics',
                stockQuantity: 20,
                user: adminUser,
                images: ['https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&q=80']
            },
            {
                name: 'Minimalist Desk Lamp',
                sku: 'LMP-M-01',
                description: 'Modern minimalist desk lamp with adjustable brightness.',
                price: 45.00,
                category: 'Home & Office',
                stockQuantity: 100,
                user: adminUser,
                images: ['https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=80']
            },
            {
                name: 'Ergonomic Office Chair',
                sku: 'CHR-ERGO-PRO',
                description: 'Premium ergonomic office chair with lumbar support.',
                price: 299.00,
                category: 'Home & Office',
                stockQuantity: 10,
                user: adminUser,
                images: ['https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=800&q=80']
            }
        ];

        await Product.insertMany(sampleProducts);

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();

        console.log('Data Destroyed!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
