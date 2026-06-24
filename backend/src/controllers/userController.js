/**
 * userController.js
 *
 * Handles user session creation and expense data upsert.
 * Uses sessionId (UUID) stored in the browser for anonymous usage.
 */

const User = require("../models/User");
const { runFinancialAnalysis } = require("../services/financialEngine");

// ── POST /api/user/add ─────────────────────────────────────────────────────
/**
 * Create or update a user profile by sessionId.
 * Body: { sessionId, name?, income, expenses, savingsGoal?, language? }
 */
const addOrUpdateUser = async (req, res, next) => {
  try {
    const { sessionId, name, income, expenses, savingsGoal, language } = req.body;

    // Upsert: create if not exists, update if exists
    const user = await User.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          ...(name && { name }),
          income,
          ...(expenses && { expenses }),
          ...(savingsGoal && { savingsGoal }),
          ...(language && { language }),
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    // Run quick analysis to return with the response
    const analysis = runFinancialAnalysis(
      user.income,
      user.expenses.toObject ? user.expenses.toObject() : user.expenses,
      user.savingsGoal.toObject ? user.savingsGoal.toObject() : user.savingsGoal
    );

    res.status(200).json({
      success: true,
      message: "User profile saved successfully",
      data: {
        user,
        quickAnalysis: {
          totalExpenses: analysis.totalExpenses,
          monthlySavings: analysis.monthlySavings,
          status: analysis.status,
          mlPrediction: analysis.mlPrediction,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/user/:sessionId ──────────────────────────────────────────────
/**
 * Fetch user profile by sessionId.
 */
const getUserProfile = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const user = await User.findOne({ sessionId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = { addOrUpdateUser, getUserProfile };
