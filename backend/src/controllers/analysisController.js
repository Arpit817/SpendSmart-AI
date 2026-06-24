/**
 * analysisController.js
 *
 * GET /api/analysis?sessionId=xxx
 * Returns full financial analysis + AI-generated summary for a user session.
 */

const User = require("../models/User");
const FinancialReport = require("../models/FinancialReport");
const { runFinancialAnalysis } = require("../services/financialEngine");
const { generateAIResponse } = require("../services/aiService");

// ── GET /api/analysis ──────────────────────────────────────────────────────
const getAnalysis = async (req, res, next) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: "sessionId is required" });
    }

    // Fetch user
    const user = await User.findOne({ sessionId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found. Please enter your financial data first." });
    }

    const expensesObj = user.expenses.toObject ? user.expenses.toObject() : { ...user.expenses };
    const savingsGoalObj = user.savingsGoal.toObject ? user.savingsGoal.toObject() : { ...user.savingsGoal };

    // Run full financial engine
    const analysis = runFinancialAnalysis(user.income, expensesObj, savingsGoalObj);

    // Build a concise prompt for AI narrative summary
    const aiPrompt = `
Generate a concise financial health summary (3–4 sentences) for a user with the following data:
- Monthly Income: ₹${user.income.toLocaleString("en-IN")}
- Total Monthly Expenses: ₹${analysis.totalExpenses.toLocaleString("en-IN")}
- Monthly Savings: ₹${analysis.monthlySavings.toLocaleString("en-IN")}
- Financial Status: ${analysis.status.toUpperCase()}
- ML Prediction: ${analysis.mlPrediction}
- EMI Risk: ${analysis.emiRisk}
- Spending Ratio: ${(analysis.spendingRatio * 100).toFixed(1)}%
Keep it encouraging but honest. End with one actionable suggestion.
`.trim();

    // Get AI summary (non-blocking — fall back gracefully if AI fails)
    let aiSummary = "";
    try {
      const aiResult = await generateAIResponse(aiPrompt, []);
      aiSummary = aiResult.content;
    } catch (aiErr) {
      console.warn("⚠️ AI summary failed:", aiErr.message);
      aiSummary = "AI summary temporarily unavailable. Your financial data has been analyzed successfully.";
    }

    // Save report to database
    const report = await FinancialReport.create({
      sessionId,
      income: user.income,
      expenses: expensesObj,
      savingsGoal: savingsGoalObj,
      analysis: {
        totalExpenses: analysis.totalExpenses,
        monthlySavings: analysis.monthlySavings,
        spendingRatio: analysis.spendingRatio,
        status: analysis.status,
        emiRatio: analysis.emiRatio,
        emiRisk: analysis.emiRisk,
        emergencyFundRequired: analysis.emergencyFundRequired,
        monthsToEmergencyFund: analysis.monthsToEmergencyFund,
        monthsToSavingsGoal: analysis.monthsToSavingsGoal,
        mlPrediction: analysis.mlPrediction,
        mlConfidence: analysis.mlConfidence,
        savingsForecast: analysis.savingsForecast,
      },
      aiSummary,
      budgetRecommendations: analysis.budgetRecommendations,
      financialTips: analysis.financialTips,
    });

    res.status(200).json({
      success: true,
      message: "Financial analysis complete",
      data: {
        user: {
          name: user.name,
          income: user.income,
          expenses: expensesObj,
          savingsGoal: savingsGoalObj,
          language: user.language,
        },
        analysis,
        aiSummary,
        reportId: report._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalysis };
