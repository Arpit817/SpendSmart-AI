/**
 * server.js — SpendSmart AI Express Application Entry Point
 */

require("dotenv").config(); // loads backend/.env

const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const { globalErrorHandler, notFound } = require("./middleware/errorHandler");

// ── Route imports ──────────────────────────────────────────────────────────
const userRoutes = require("./routes/userRoutes");
const analysisRoutes = require("./routes/analysisRoutes");
const chatRoutes = require("./routes/chatRoutes");
const historyRoutes = require("./routes/historyRoutes");

// ── Connect Database ───────────────────────────────────────────────────────
connectDB();

// ── Create Express App ─────────────────────────────────────────────────────
const app = express(); // <--- MOVE THIS UP HERE

// Static files will be registered after security middleware below

// ── Security Headers (Helmet) ──────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for easier local development with external scripts/styles
}));

// ── CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  "http://localhost:3000",
];
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. direct API calls, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === "development") {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ── HTTP Request Logger ────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// ── Body Parsers ───────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ── Global Rate Limiter ────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again after 15 minutes.",
  },
});
app.use("/api", limiter);

// ── Stricter Rate Limiter for AI chat (cost control) ──────────────────────
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: {
    success: false,
    message: "Chat rate limit reached. Please wait a moment before sending another message.",
  },
});
app.use("/api/chat", chatLimiter);

// ── Health Check ───────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SpendSmart AI API is running 🚀",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    aiProvider: process.env.AI_PROVIDER || "gemini",
  });
});

// ── Static Files & Frontend Root (after security middleware) ──────────────
app.use(express.static(path.join(__dirname, '../../public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// ── API Routes ─────────────────────────────────────────────────────────────
app.use("/api/user", userRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/history", historyRoutes);

// ── API Index ──────────────────────────────────────────────────────────────
app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    name: "SpendSmart AI API",
    version: "1.0.0",
    endpoints: {
      user: {
        "POST /api/user/add": "Create or update user profile",
        "GET  /api/user/:sessionId": "Get user profile",
      },
      analysis: {
        "GET /api/analysis?sessionId=": "Full financial analysis + AI summary",
      },
      chat: {
        "POST   /api/chat": "Send message to AI chatbot",
        "GET    /api/chat/history?sessionId=": "Retrieve chat history",
        "DELETE /api/chat/history": "Clear chat history",
      },
      history: {
        "GET    /api/history?sessionId=": "List financial reports",
        "GET    /api/history/:id": "Get single report",
        "DELETE /api/history/:id": "Delete a report",
      },
    },
  });
});

// ── 404 Handler ────────────────────────────────────────────────────────────
// Note: If you are using path.join and sendFile for the root, 
// ensure this doesn't block your static index.html
app.use(notFound);

// ── Global Error Handler (MUST be last) ───────────────────────────────────
app.use(globalErrorHandler);

// ── Start Server ───────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 SpendSmart AI Backend running on port ${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(`   AI Provider : ${process.env.AI_PROVIDER || "gemini"}`);
  console.log(`   Health Check: http://localhost:${PORT}/health`);
  console.log(`   API Index   : http://localhost:${PORT}/api\n`);
});

module.exports = app;