/**
 * samplePrompts.js
 *
 * Pre-built prompts surfaced in the chatbot UI as quick-action chips.
 * Grouped by category for easy frontend rendering.
 */

const SAMPLE_PROMPTS = {
  budgeting: [
    "How should I allocate my monthly salary of ₹50,000?",
    "My rent is ₹15,000 and food costs ₹8,000. Is my budget healthy?",
    "Explain the 50-30-20 budgeting rule with Indian examples.",
    "How can I reduce my monthly expenses by 20%?",
  ],

  savings: [
    "I want to save ₹5 lakhs in 2 years. How much should I save monthly?",
    "What are the best savings schemes in India for salaried employees?",
    "How do I build an emergency fund earning ₹40,000/month?",
    "Should I save in FD, RD, or PPF? Compare them for me.",
  ],

  emi: [
    "My EMI is ₹12,000 and income is ₹30,000. Is this safe?",
    "What is a safe EMI-to-income ratio in India?",
    "Should I prepay my home loan or invest in mutual funds?",
    "How do I calculate total interest paid on a ₹10 lakh loan?",
  ],

  investment: [
    "I'm a beginner. Where should I invest ₹2,000/month?",
    "Explain SIP, PPF, and NPS in simple terms.",
    "What are ELSS funds and how do they save taxes under 80C?",
    "How much health insurance do I need in India?",
  ],

  tips: [
    "Give me 5 financial discipline tips for young Indians.",
    "How do I avoid lifestyle inflation as my salary grows?",
    "What are common financial mistakes Indians make in their 20s?",
    "How can I save on taxes legally as a salaried person?",
  ],
};

/**
 * Get a flat array of all sample prompts (for random selection)
 */
const getAllPrompts = () => Object.values(SAMPLE_PROMPTS).flat();

/**
 * Get a random set of N prompts across all categories
 */
const getRandomPrompts = (n = 4) => {
  const all = getAllPrompts();
  const shuffled = all.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
};

module.exports = { SAMPLE_PROMPTS, getAllPrompts, getRandomPrompts };
