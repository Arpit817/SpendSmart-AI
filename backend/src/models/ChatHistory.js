/**
 * ChatHistory.js — Mongoose schema for conversation history
 *
 * Each document represents a single conversation turn (user message +
 * assistant response).  Stored per sessionId so the AI can recall context.
 */

const mongoose = require("mongoose");

// ── Single message in a conversation ───────────────────────────────────────
const MessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

// ── Chat History Schema ─────────────────────────────────────────────────────
const ChatHistorySchema = new mongoose.Schema(
  {
    // Links to the anonymous session / registered user
    sessionId: {
      type: String,
      required: true,
      index: true,
    },

    // The complete conversation turn (user + assistant)
    messages: {
      type: [MessageSchema],
      default: [],
    },

    // Snapshot of the user's financial data at time of chat
    financialContext: {
      income: Number,
      totalExpenses: Number,
      monthlySavings: Number,
      spendingRatio: Number, // totalExpenses / income
    },

    // Optional metadata
    metadata: {
      model: String, // "gemini-1.5-flash" | "gpt-4o-mini"
      language: { type: String, default: "en" },
      tokensUsed: Number,
    },
  },
  {
    timestamps: true, // createdAt = conversation timestamp
  }
);

// ── Index for fast history retrieval ───────────────────────────────────────
ChatHistorySchema.index({ sessionId: 1, createdAt: -1 });

// Auto-delete history older than 90 days
ChatHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model("ChatHistory", ChatHistorySchema);
