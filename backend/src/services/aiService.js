/**
 * aiService.js — Modular AI provider abstraction
 * 
 * Supports Google Gemini, OpenAI, and Groq.
 * Switch providers by setting AI_PROVIDER=gemini, openai, or groq in .env
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { OpenAI } = require("openai"); // Standard import for both OpenAI and Groq
const Groq = require("groq-sdk");

// ── System prompt (Responsible AI + India-focused) ─────────────────────────
const SYSTEM_PROMPT = `You are SpendSmart AI, a smart, empathetic, and responsible personal finance advisor designed specifically for Indian users.

CORE RESPONSIBILITIES:
- Provide practical, conservative, and actionable financial advice
- Help users understand their spending patterns and suggest budget optimizations
- Give savings strategies tailored to Indian cost-of-living
- Explain financial concepts in simple, clear language (English or Hindi as requested)

STRICT RULES (RESPONSIBLE AI):
1. NEVER promise specific investment returns or guaranteed profits
2. NEVER recommend specific stocks, crypto, or high-risk investments
3. NEVER make financial guarantees
4. ALWAYS recommend consulting a SEBI-registered financial advisor for major decisions
5. Add a brief disclaimer when discussing investments
6. Keep user data private — never reference personal details outside the conversation

INDIA-SPECIFIC CONTEXT:
- Reference Indian financial instruments: PPF, EPF, NPS, SIP (mutual funds), FD, RD, ELSS
- Be aware of Indian tax brackets and 80C deductions
- Consider India's cost of living (metros vs tier-2 cities)
- Reference SEBI and RBI guidelines where relevant

TONE: Friendly, encouraging, professional. Use emojis sparingly for readability.

DISCLAIMER TO ADD WHEN RELEVANT:
"⚠️ This is AI-generated advice for educational purposes only. Please consult a SEBI-registered financial advisor before making major financial decisions."`;

// Helper to format financial context string
const formatFinancialContext = (context) => {
  if (!context) return "";
  return (
    `\n\n[User's Current Financial Data]\n` +
    `Income: ₹${context.income?.toLocaleString("en-IN") || "N/A"}/month\n` +
    `Total Expenses: ₹${context.totalExpenses?.toLocaleString("en-IN") || "N/A"}/month\n` +
    `Monthly Savings: ₹${context.monthlySavings?.toLocaleString("en-IN") || "N/A"}\n` +
    `Spending Ratio: ${((context.spendingRatio || 0) * 100).toFixed(1)}% of income\n` +
    `Status: ${context.status || "unknown"}`
  );
};

// ── Groq Provider (Fastest for Finance) ───────────────────────────────────
class GroqProvider {
  constructor() {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not set in environment variables");
    }
    this.client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    this.modelName = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  }

  async chat(userMessage, conversationHistory = [], financialContext = null) {
    const contextStr = formatFinancialContext(financialContext);
    
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory.filter((m) => m.role !== "system").map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
      { role: "user", content: userMessage + contextStr },
    ];

    const response = await this.client.chat.completions.create({
      model: this.modelName,
      messages,
      max_tokens: 1024,
      temperature: 0.6, // Slightly lower for financial precision
    });

    return {
      content: response.choices[0].message.content,
      model: this.modelName,
      tokensUsed: response.usage?.total_tokens || 0,
    };
  }
}

// ── Gemini Provider ────────────────────────────────────────────────────────
class GeminiProvider {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  }

  async chat(userMessage, conversationHistory = [], financialContext = null) {
    const model = this.client.getGenerativeModel({
      model: this.modelName,
      systemInstruction: SYSTEM_PROMPT,
    });

    const contextStr = formatFinancialContext(financialContext);

    const history = conversationHistory
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userMessage + contextStr);
    const response = result.response;

    return {
      content: response.text(),
      model: this.modelName,
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
    };
  }
}

// ── OpenAI Provider ────────────────────────────────────────────────────────
class OpenAIProvider {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set in environment variables");
    }
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.modelName = process.env.OPENAI_MODEL || "gpt-4o-mini";
  }

  async chat(userMessage, conversationHistory = [], financialContext = null) {
    const contextStr = formatFinancialContext(financialContext);

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory.filter((m) => m.role !== "system").map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
      { role: "user", content: userMessage + contextStr },
    ];

    const response = await this.client.chat.completions.create({
      model: this.modelName,
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    return {
      content: response.choices[0].message.content,
      model: this.modelName,
      tokensUsed: response.usage?.total_tokens || 0,
    };
  }
}

// ── Factory ────────────────────────────────────────────────────────────────
let _providerInstance = null;

const getAIProvider = () => {
  if (_providerInstance) return _providerInstance;

  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  console.log(`🤖 Switched AI Provider to: ${provider}`);

  switch (provider) {
    case "openai":
      _providerInstance = new OpenAIProvider();
      break;
    case "groq":
      _providerInstance = new GroqProvider();
      break;
    default:
      _providerInstance = new GeminiProvider();
  }

  return _providerInstance;
};

const generateAIResponse = async (userMessage, conversationHistory = [], financialContext = null) => {
  const provider = getAIProvider();
  return provider.chat(userMessage, conversationHistory, financialContext);
};

module.exports = { generateAIResponse, SYSTEM_PROMPT };