const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // useNewUrlParser and useUnifiedTopology are removed in Mongoose 7+
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
