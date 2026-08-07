/**
 * db.js — MongoDB connection via Mongoose
 * Connects to the URI defined in .env (local or Atlas)
 */

const mongoose = require("mongoose");

const connectDB = async () => {
  // 1. Check if URI exists to prevent cryptic Mongoose errors if .env fails to load
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is undefined. Check your .env file.");
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
    console.warn("⚠️ Running WITHOUT MongoDB — DB-dependent routes will fail.\n");
    return;
  }

  try {
    // 2. Increased timeout to 10000ms for Atlas cloud latency, DNS lookup, and TLS handshakes
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);

    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    } else {
      console.warn("⚠️ Running WITHOUT MongoDB — DB-dependent routes will return errors.");
      console.warn("   Ensure your IP is whitelisted in Atlas and MONGODB_URI is correct.\n");
    }
  }
};

// 3. Monitor ongoing connection state for runtime drops
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB connection lost. Reconnecting...");
});

mongoose.connection.on("error", (err) => {
  console.error(`❌ MongoDB runtime error: ${err.message}`);
});

// 4. Graceful shutdown listeners (placed outside connectDB so they always register)
const gracefulShutdown = async (signal) => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log(`🔌 MongoDB connection closed via ${signal}`);
  }
  process.exit(0);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

module.exports = connectDB;