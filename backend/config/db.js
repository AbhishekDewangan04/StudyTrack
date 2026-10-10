const mongoose = require('mongoose');
const dns = require('dns');

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

    // Configure public DNS resolvers (Google 8.8.8.8 & Cloudflare 1.1.1.1) to prevent SRV ETIMEOUT on Windows
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (dnsErr) {
      console.warn('⚠️ Could not override default DNS servers:', dnsErr.message);
    }

    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Do not terminate process in development phase so health route remains operable
  }
};

module.exports = connectDB;
