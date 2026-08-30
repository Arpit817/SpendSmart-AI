# 💰 SpendSmart AI

> **AI-Powered Personal Finance Advisor for Users**

SpendSmart AI is a full-stack web application that helps users track income and expenses, get AI-generated financial analysis, and chat with a smart finance advisor.
---

## ✨ Features

- 🏠 **Dashboard** — Quick overview of income, expenses, savings & AI health score
- 👤 **Financial Profile** — Enter detailed monthly income & expense breakdown
- 📊 **AI Analysis** — Deep financial report with ML prediction, EMI risk, savings forecast
- 🤖 **AI Chat** — Conversational finance advisor (English + Hindi support)
- 📅 **Report History** — View all past financial analyses
- 🔒 **Security** — Rate limiting, Helmet.js, CORS, input validation
- 🌐 **Multi-AI** — Switch between Google Gemini, OpenAI GPT, or Groq LLaMA

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, Vanilla CSS, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose ODM) |
| AI Providers | Google Gemini 2.0, OpenAI GPT-4o-mini, Groq LLaMA 3 |
| Security | Helmet, CORS, express-rate-limit, express-validator |

---

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- MongoDB Atlas account (or local MongoDB)
- API key for at least one AI provider (Gemini / OpenAI / Groq)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/spendsmart-ai.git
cd spendsmart-ai

# 2. Install backend dependencies
cd backend
npm install

# 3. Create the .env file
cp .env.example .env
# Edit .env with your keys (see below)

# 4. Start the development server
npm run dev
