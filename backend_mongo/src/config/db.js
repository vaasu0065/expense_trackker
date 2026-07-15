const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/expense_tracker_pro', {
      autoIndex: true, // Automatically build unique compound indexes
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error(`❌ MongoDB Connection Error: ${err.message}`);
    // Do not crash server in dev environment if local mongo is down, just log warning
    console.warn("⚠️ Continuing server execution without database (or retry will occur upon requests)...");
  }
};

module.exports = connectDB;
