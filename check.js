const mongoose = require('mongoose');
const Order = require('./backend/models/Order');
const Product = require('./backend/models/Product');

require('dotenv').config({ path: './backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');
  
  const orders = await Order.find().lean();
  console.log('Total orders:', orders.length);
  if (orders.length > 0) {
    console.log('Latest order:', JSON.stringify(orders[orders.length - 1], null, 2));
  }
  
  process.exit(0);
}
run();
