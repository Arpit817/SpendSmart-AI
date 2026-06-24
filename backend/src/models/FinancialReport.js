/**
 * FinancialReport.js — Mongoose schema for generated financial analysis reports
 *
 * Each report captures a full financial snapshot and AI-generated advice
 * at a specific point in time.  Used to power the History page.
 */

const mongoose = require("mongoose");

const FinancialReportSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },

    // ── Input snapshot ──────────────────────────────────────────────────────
    income: { type: Number, required: true },
    expenses: {
      rent: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
      travel: { type: Number, default: 0 },
      shopping: { type: Number, default: 0 },
      bills: { type: Number, default: 0 },
      emi: { type: Number, default: 0 },
      others: { type: Number, default: 0 },
    },
    savingsGoal: {
      description: String,
      targetAmount: Number,
      targetMonths: Number,
    },

    // ── Computed metrics ────────────────────────────────────────────────────
    analysis: {
      totalExpenses: Number,
      monthlySavings: Number,
      spendingRatio: Number,       // 0–1 (totalExpenses / income)
      status: {
        type: String,
        enum: ["safe", "warning", "critical"],
        default: "safe",
      },

      // EMI risk
      emiRatio: Number,            // emi / income
      emiRisk: {
        type: String,
        enum: ["safe", "caution", "risky"],
        default: "safe",
      },

      // Emergency fund
      emergencyFundRequired: Number, // 6 × monthly expenses
      monthsToEmergencyFund: Number, // emergencyFundRequired / monthlySavings

      // Savings goal
      monthsToSavingsGoal: Number,

      // ML prediction (simple rule-based)
      mlPrediction: {
        type: String,
        enum: ["Safe", "Risky"],
        default: "Safe",
      },
      mlConfidence: Number,        // 0–100 %

      // Next 6-month savings forecast (array of monthly values)
      savingsForecast: [Number],
    },

    // ── AI-generated narrative ──────────────────────────────────────────────
    aiSummary: { type: String, default: "" },
    budgetRecommendations: [String],
    financialTips: [String],

    // ── Report label ────────────────────────────────────────────────────────
    reportLabel: {
      type: String,
      default: function () {
        return `Report – ${new Date().toLocaleDateString("en-IN")}`;
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for history retrieval
FinancialReportSchema.index({ sessionId: 1, createdAt: -1 });

module.exports = mongoose.model("FinancialReport", FinancialReportSchema);
