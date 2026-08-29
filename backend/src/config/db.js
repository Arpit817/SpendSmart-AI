/**
 * db.js - Vercel Serverless MongoDB connection via Mongoose
 */

const mongoose = require("mongoose");

// This variable caches the connection so Vercel can reuse it
let isConnected = false;

const connectDB = async () => {
  // Check if URI exists to prevent cryptic errors
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is undefined. Check your Vercel Environment Variables.");
    return;
  }

  if (isConnected){
    console.log("Using existing MongoDB connection");
    return;
  }

  try {
    // Increased timeout to 10000ms for Atlas cloud latency
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    isConnected = conn.connections[0].readyState == 1;
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
  }
};

// Monitor ongoing connection state for runtime drops
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB connection lost. Resetting cache...");
  isConnected = false; // Reset the cache so the next request tries to reconnect
});

mongoose.connection.on("error", (err) => {
  console.error(`❌ MongoDB runtime error: ${err.message}`);
});

module.exports = connectDB;