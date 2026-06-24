/**
 * db.js — MongoDB connection via Mongoose
 * Connects to the URI defined in .env (local or Atlas)
 */

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Mongoose 8.x does not need useNewUrlParser / useUnifiedTopology
      serverSelectionTimeoutMS: 5000, // fail fast so dev server starts quickly
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
  await mongoose.connection.close();
  console.log(`🔌 MongoDB connection closed via ${signal}`);
  process.exit(0);
  };
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);

    if (process.env.NODE_ENV === "production") {
      // In production, a missing DB is fatal
      process.exit(1);
    } else {
      // In development, keep the server running so Gemini API & static files still work.
      // Routes that need the DB will return 500 errors per-request (handled by globalErrorHandler).
      console.warn("⚠️  Running WITHOUT MongoDB — DB-dependent routes will return errors.");
      console.warn("    Install & start MongoDB, or set MONGODB_URI to an Atlas connection string.\n");
    }
  }
};

module.exports = connectDB;
