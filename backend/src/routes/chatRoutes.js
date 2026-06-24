/**
 * chatRoutes.js — Routes for AI chatbot
 *
 * POST   /api/chat          → send message and get AI reply
 * GET    /api/chat/history  → retrieve conversation history
 * DELETE /api/chat/history  → clear conversation history
 */

const express = require("express");
const router = express.Router();
const { body, query } = require("express-validator");
const { chat, getChatHistory, clearChatHistory } = require("../controllers/chatController");
const { validate } = require("../middleware/errorHandler");

// POST /api/chat
router.post(
  "/",
  [
    body("sessionId").notEmpty().withMessage("sessionId is required"),
    body("message")
      .notEmpty()
      .withMessage("message is required")
      .isLength({ max: 2000 })
      .withMessage("Message cannot exceed 2000 characters"),
    body("language").optional().isIn(["en", "hi"]),
  ],
  validate,
  chat
);

// GET /api/chat/history?sessionId=xxx
router.get(
  "/history",
  [query("sessionId").notEmpty().withMessage("sessionId is required")],
  validate,
  getChatHistory
);

// DELETE /api/chat/history
router.delete(
  "/history",
  [body("sessionId").notEmpty().withMessage("sessionId is required")],
  validate,
  clearChatHistory
);

module.exports = router;
