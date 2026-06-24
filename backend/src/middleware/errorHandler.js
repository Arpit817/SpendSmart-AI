/**
 * errorHandler.js — Global Express error handling middleware
 */

// ── Validation Error formatter ─────────────────────────────────────────────
const { validationResult } = require("express-validator");

/**
 * Run express-validator checks and return 422 with field errors if invalid.
 * Usage: add validate(req, res, next) as a middleware step in routes.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Global error handler ───────────────────────────────────────────────────
// Must be registered LAST in Express (after all routes)
const globalErrorHandler = (err, req, res, next) => {
  console.error(`❌ [${new Date().toISOString()}] ${err.stack || err.message}`);

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Duplicate entry — resource already exists",
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(", ") });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid ID format" });
  }

  // Default 500
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// ── 404 handler ────────────────────────────────────────────────────────────
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = { validate, globalErrorHandler, notFound };
