/**
 * financialEngine.js — Core financial analysis and ML logic
 *
 * Implements:
 *  - Budget analysis & categorization
 *  - Overspending detection (warning / critical)
 *  - EMI risk evaluation
 *  - Emergency fund calculation
 *  - Savings goal timeline
 *  - Simple rule-based ML prediction (Safe / Risky)
 *  - 6-month savings forecast
 *  - Budget optimization suggestions
 *  - Financial tips (India-focused)
 */

// ── Constants ──────────────────────────────────────────────────────────────
const EMERGENCY_FUND_MONTHS = 6;
const EMI_SAFE_THRESHOLD = 0.35;     // EMI > 35% income → risky
const OVERSPEND_WARNING = 0.80;      // expenses > 80% income → warning
const OVERSPEND_CRITICAL = 1.00;     // expenses > 100% income → critical

// ── Helper: compute total expenses ────────────────────────────────────────
const getTotalExpenses = (expenses = {}) =>
  (expenses.rent || 0) +
  (expenses.food || 0) +
  (expenses.travel || 0) +
  (expenses.shopping || 0) +
  (expenses.bills || 0) +
  (expenses.emi || 0) +
  (expenses.others || 0);

// ── 1. Spending Status ─────────────────────────────────────────────────────
const getSpendingStatus = (income, totalExpenses) => {
  if (income === 0) return "critical";
  const ratio = totalExpenses / income;
  if (ratio >= OVERSPEND_CRITICAL) return "critical";
  if (ratio >= OVERSPEND_WARNING) return "warning";
  return "safe";
};

// ── 2. EMI Risk ────────────────────────────────────────────────────────────
const getEMIRisk = (income, emiAmount) => {
  if (income === 0) return { emiRatio: 0, emiRisk: "safe" };
  const emiRatio = emiAmount / income;
  let emiRisk = "safe";
  if (emiRatio > EMI_SAFE_THRESHOLD) emiRisk = "risky";
  else if (emiRatio > 0.25) emiRisk = "caution";
  return { emiRatio, emiRisk };
};

// ── 3. Emergency Fund ──────────────────────────────────────────────────────
const getEmergencyFundPlan = (totalExpenses, monthlySavings) => {
  const emergencyFundRequired = totalExpenses * EMERGENCY_FUND_MONTHS;
  let monthsToEmergencyFund = null;

  if (monthlySavings > 0) {
    monthsToEmergencyFund = Math.ceil(emergencyFundRequired / monthlySavings);
  }

  return { emergencyFundRequired, monthsToEmergencyFund };
};

// ── 4. Savings Goal Timeline ───────────────────────────────────────────────
const getSavingsGoalTimeline = (monthlySavings, savingsGoal = {}) => {
  const { targetAmount = 0, targetMonths = 12 } = savingsGoal;
  if (!targetAmount || monthlySavings <= 0) return null;

  const requiredMonthlySavings = targetAmount / targetMonths;
  const actualMonthsToGoal = Math.ceil(targetAmount / monthlySavings);

  return {
    targetAmount,
    targetMonths,
    requiredMonthlySavings,
    actualMonthsToGoal,
    onTrack: monthlySavings >= requiredMonthlySavings,
  };
};

// ── 5. Simple ML Prediction (Rule-Based) ──────────────────────────────────
/**
 * Predicts financial health as "Safe" or "Risky" based on rule weights.
 * Modelled as a simple weighted scoring system — mimics logistic regression
 * outcome without requiring an external ML library.
 */
const predictFinancialHealth = (income, expenses = {}) => {
  const totalExpenses = getTotalExpenses(expenses);
  if (income === 0) return { mlPrediction: "Risky", mlConfidence: 95 };

  let riskScore = 0; // 0 = safe, higher = riskier

  const spendingRatio = totalExpenses / income;
  const emiRatio = (expenses.emi || 0) / income;
  const shoppingRatio = (expenses.shopping || 0) / income;
  const savingsRatio = 1 - spendingRatio;

  // Spending ratio weight (most important)
  if (spendingRatio >= 1.0) riskScore += 50;
  else if (spendingRatio >= 0.9) riskScore += 35;
  else if (spendingRatio >= 0.8) riskScore += 20;
  else if (spendingRatio >= 0.7) riskScore += 10;

  // EMI burden
  if (emiRatio > 0.35) riskScore += 25;
  else if (emiRatio > 0.25) riskScore += 10;

  // Shopping discretionary spend
  if (shoppingRatio > 0.20) riskScore += 10;
  else if (shoppingRatio > 0.15) riskScore += 5;

  // Savings buffer
  if (savingsRatio < 0.10) riskScore += 15;
  else if (savingsRatio > 0.30) riskScore -= 10; // bonus for high savers

  riskScore = Math.max(0, Math.min(100, riskScore));

  const mlPrediction = riskScore >= 40 ? "Risky" : "Safe";
  // Confidence: distance from the 40 decision boundary → 50–100%
  const mlConfidence = Math.round(50 + Math.abs(riskScore - 40));

  return { mlPrediction, mlConfidence: Math.min(mlConfidence, 99) };
};

// ── 6. Savings Forecast (6 months) ────────────────────────────────────────
/**
 * Simple compound growth forecast.
 * Assumes a small monthly income growth (1%) and spending discipline factor.
 */
const getSavingsForecast = (income, totalExpenses) => {
  const monthlySavings = income - totalExpenses;
  const forecast = [];
  let runningIncome = income;
  let runningExpenses = totalExpenses;

  for (let month = 1; month <= 6; month++) {
    // Tiny income growth (0.5% / month) + slight expense compression (0.3%)
    runningIncome *= 1.005;
    runningExpenses *= 0.997;
    const projected = Math.max(0, runningIncome - runningExpenses);
    forecast.push(Math.round(projected));
  }

  return forecast;
};

// ── 7. Budget Recommendations ──────────────────────────────────────────────
const getBudgetRecommendations = (income, expenses = {}) => {
  const recs = [];
  const totalExpenses = getTotalExpenses(expenses);
  const spendingRatio = income > 0 ? totalExpenses / income : 1;

  // 50-30-20 rule check
  const needsRatio = ((expenses.rent || 0) + (expenses.food || 0) + (expenses.bills || 0)) / income;
  const wantsRatio = ((expenses.shopping || 0) + (expenses.travel || 0)) / income;
  const savingsRatio = 1 - spendingRatio;

  if (needsRatio > 0.5)
    recs.push(`Your essential needs (rent, food, bills) consume ${(needsRatio * 100).toFixed(0)}% of income. Try to bring this below 50% using the 50-30-20 rule.`);

  if (wantsRatio > 0.3)
    recs.push(`Discretionary spending (shopping, travel) is at ${(wantsRatio * 100).toFixed(0)}%. Aim to keep it under 30%.`);

  if (savingsRatio < 0.2)
    recs.push(`You are saving only ${(savingsRatio * 100).toFixed(0)}% of income. The recommended minimum is 20%. Consider cutting non-essential spends.`);

  if ((expenses.emi || 0) / income > 0.35)
    recs.push(`Your EMI is ${(((expenses.emi || 0) / income) * 100).toFixed(0)}% of income, exceeding the safe 35% threshold. Avoid new loans and consider prepayment.`);

  if ((expenses.shopping || 0) > income * 0.15)
    recs.push("Shopping expenses are high. Try the 24-hour rule: wait a day before non-essential purchases.");

  if ((expenses.food || 0) > income * 0.20)
    recs.push("Food costs are above 20% of income. Meal prepping and cooking at home can reduce this by 30–40%.");

  if (recs.length === 0)
    recs.push("Your spending is well-balanced! Keep maintaining the 50-30-20 rule for long-term financial health.");

  return recs;
};

// ── 8. Financial Tips (India-focused) ─────────────────────────────────────
const getFinancialTips = (income, expenses = {}, status) => {
  const tips = [];
  const monthlySavings = income - getTotalExpenses(expenses);

  // Universal tips
  tips.push("💰 Build an emergency fund covering 6 months of expenses before investing.");
  tips.push("📊 Use the 50-30-20 rule: 50% needs, 30% wants, 20% savings/investments.");
  tips.push("🏦 Automate savings via SIP on the 1st of every month — 'pay yourself first'.");

  // India-specific
  tips.push("📑 Maximize your 80C deductions (₹1.5L limit) via PPF, ELSS, or Life Insurance.");
  tips.push("🏥 Ensure you have health insurance — a medical emergency can wipe out savings.");

  if (status === "warning" || status === "critical") {
    tips.push("🚨 Track every rupee using apps like Walnut or ET Money for 30 days.");
    tips.push("✂️ Cancel unused subscriptions — OTT, gym, apps — they add up fast.");
  }

  if (monthlySavings > 5000) {
    tips.push("📈 Start a ₹500–₹1000/month SIP in a diversified equity mutual fund for long-term wealth.");
    tips.push("💼 Consider NPS (National Pension System) for additional tax benefits under 80CCD.");
  }

  // Responsible AI reminder
  tips.push("⚠️ Disclaimer: This is AI-generated advice for educational purposes. Consult a SEBI-registered advisor before major financial decisions.");

  return tips;
};

// ── Main Analysis Function ─────────────────────────────────────────────────
/**
 * runFinancialAnalysis
 * @param {number} income
 * @param {Object} expenses
 * @param {Object} savingsGoal
 * @returns {Object} complete analysis report
 */
const runFinancialAnalysis = (income, expenses = {}, savingsGoal = {}) => {
  const totalExpenses = getTotalExpenses(expenses);
  const monthlySavings = income - totalExpenses;
  const spendingRatio = income > 0 ? totalExpenses / income : 1;
  const status = getSpendingStatus(income, totalExpenses);

  const { emiRatio, emiRisk } = getEMIRisk(income, expenses.emi || 0);
  const { emergencyFundRequired, monthsToEmergencyFund } = getEmergencyFundPlan(
    totalExpenses,
    monthlySavings
  );
  const goalTimeline = getSavingsGoalTimeline(monthlySavings, savingsGoal);
  const { mlPrediction, mlConfidence } = predictFinancialHealth(income, expenses);
  const savingsForecast = getSavingsForecast(income, totalExpenses);
  const budgetRecommendations = getBudgetRecommendations(income, expenses);
  const financialTips = getFinancialTips(income, expenses, status);

  return {
    // Raw numbers
    totalExpenses,
    monthlySavings,
    spendingRatio,

    // Status flags
    status,
    emiRatio,
    emiRisk,

    // Plans
    emergencyFundRequired,
    monthsToEmergencyFund,
    monthsToSavingsGoal: goalTimeline?.actualMonthsToGoal || null,
    savingsGoalOnTrack: goalTimeline?.onTrack || null,

    // ML
    mlPrediction,
    mlConfidence,

    // Forecast & suggestions
    savingsForecast,
    budgetRecommendations,
    financialTips,
  };
};

module.exports = {
  runFinancialAnalysis,
  getTotalExpenses,
  predictFinancialHealth,
  getSavingsForecast,
  getBudgetRecommendations,
  getFinancialTips,
};
