/**
 * User.js — Mongoose schema for SpendSmart AI users
 *
 * Stores profile, income, monthly expenses, and financial goals.
 * The "sessionId" field enables anonymous usage (no auth required).
 */

const mongoose = require("mongoose");

// ── Expense Sub-Schema ──────────────────────────────────────────────────────
const ExpenseSchema = new mongoose.Schema(
  {
    rent: { type: Number, default: 0, min: 0 },
    food: { type: Number, default: 0, min: 0 },
    travel: { type: Number, default: 0, min: 0 },
    shopping: { type: Number, default: 0, min: 0 },
    bills: { type: Number, default: 0, min: 0 },
    emi: { type: Number, default: 0, min: 0 },
    // Catch-all for any other custom category
    others: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

// ── Goals Sub-Schema ────────────────────────────────────────────────────────
const GoalSchema = new mongoose.Schema(
  {
    description: { type: String, default: "" },
    targetAmount: { type: Number, default: 0, min: 0 },
    targetMonths: { type: Number, default: 12, min: 1 }, // time horizon in months
  },
  { _id: false }
);

// ── Main User Schema ────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema(
  {
    // Anonymous session token — generated on first visit (UUID)
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Optional display name
    name: {
      type: String,
      trim: true,
      default: "User",
    },

    // Monthly take-home income (INR)
    income: {
      type: Number,
      required: true,
      min: [0, "Income cannot be negative"],
    },

    // Detailed expense breakdown
    expenses: {
      type: ExpenseSchema,
      default: () => ({}),
    },

    // Savings / investment goal
    savingsGoal: {
      type: GoalSchema,
      default: () => ({}),
    },

    // Preferred language: "en" | "hi"
    language: {
      type: String,
      enum: ["en", "hi"],
      default: "en",
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt
  }
);

// ── Virtual: total monthly expenses ────────────────────────────────────────
UserSchema.virtual("totalExpenses").get(function () {
  const e = this.expenses || {};
  return (
    (e.rent || 0) +
    (e.food || 0) +
    (e.travel || 0) +
    (e.shopping || 0) +
    (e.bills || 0) +
    (e.emi || 0) +
    (e.others || 0)
  );
});

// ── Virtual: monthly savings ────────────────────────────────────────────────
UserSchema.virtual("monthlySavings").get(function () {
  return (this.income || 0) - this.totalExpenses;
});

// Enable virtuals in JSON output
UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("User", UserSchema);
