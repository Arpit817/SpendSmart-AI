/**
 * chatController.js
 *
 * POST /api/chat
 * Handles conversational AI with full chat memory and financial context injection.
 */

const User = require("../models/User");
const ChatHistory = require("../models/ChatHistory");
const { generateAIResponse } = require("../services/aiService");
const { runFinancialAnalysis } = require("../services/financialEngine");

// ── POST /api/chat ─────────────────────────────────────────────────────────
const chat = async (req, res, next) => {
  try {
    const { sessionId, message, language = "en" } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({
        success: false,
        message: "sessionId and message are required",
      });
    }

    // ── 1. Load user + financial context ──────────────────────────────────
    const user = await User.findOne({ sessionId });
    let financialContext = null;

    if (user) {
      const expensesObj = user.expenses.toObject
        ? user.expenses.toObject()
        : { ...user.expenses };
      const analysis = runFinancialAnalysis(user.income, expensesObj, {});
      financialContext = {
        income: user.income,
        totalExpenses: analysis.totalExpenses,
        monthlySavings: analysis.monthlySavings,
        spendingRatio: analysis.spendingRatio,
        status: analysis.status,
      };
    }

    // ── 2. Load last 10 conversation turns for memory ──────────────────────
    const recentHistory = await ChatHistory.find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Flatten into [{role, content}] format (oldest first)
    const conversationHistory = recentHistory
      .reverse()
      .flatMap((doc) => doc.messages);

    // ── 3. Add language instruction if Hindi ──────────────────────────────
    let fullMessage = message;
    if (language === "hi") {
      fullMessage = `[Please respond in Hindi (Devanagari script)]\n${message}`;
    }

    // ── 4. Call AI provider ────────────────────────────────────────────────
    const aiResult = await generateAIResponse(
      fullMessage,
      conversationHistory,
      financialContext
    );

    // ── 5. Store this conversation turn in DB ──────────────────────────────
    await ChatHistory.create({
      sessionId,
      messages: [
        { role: "user", content: message },
        { role: "assistant", content: aiResult.content },
      ],
      financialContext,
      metadata: {
        model: aiResult.model,
        language,
        tokensUsed: aiResult.tokensUsed,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        reply: aiResult.content,
        model: aiResult.model,
        tokensUsed: aiResult.tokensUsed,
        hasFinancialContext: !!financialContext,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/chat/history ──────────────────────────────────────────────────
const getChatHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: "sessionId is required" });
    }

    const history = await ChatHistory.find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({
      success: true,
      data: history.reverse(), // chronological order
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/chat/history ───────────────────────────────────────────────
const clearChatHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: "sessionId is required" });
    }

    await ChatHistory.deleteMany({ sessionId });
    res.status(200).json({ success: true, message: "Chat history cleared" });
  } catch (error) {
    next(error);
  }
};

module.exports = { chat, getChatHistory, clearChatHistory };
