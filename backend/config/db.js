const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI;

    if (!connStr || connStr.includes('your_mongodb_atlas_connection_string_here')) {
      console.warn(
        '⚠️ MONGODB_URI is not configured in backend/.env.\n' +
        '   Please update backend/.env with your actual MongoDB Atlas connection string.'
      );
      return;
    }

    const conn = await mongoose.connect(connStr);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Do not terminate process in development phase so health route remains operable
  }
};

module.exports = connectDB;
