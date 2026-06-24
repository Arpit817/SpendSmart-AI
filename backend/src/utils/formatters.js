/**
 * formatters.js — Shared utility functions for data formatting
 */

/**
 * Format a number as Indian Rupees
 * @param {number} amount
 * @param {boolean} showSymbol
 * @returns {string}  e.g. "₹1,50,000" or "1,50,000"
 */
const formatINR = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined) return "N/A";
  const formatted = Number(amount).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });
  return showSymbol ? `₹${formatted}` : formatted;
};

/**
 * Format a ratio as a percentage string
 * @param {number} ratio  0–1
 * @param {number} decimals
 * @returns {string}  e.g. "82.5%"
 */
const formatPercent = (ratio, decimals = 1) => {
  if (ratio === null || ratio === undefined) return "N/A";
  return `${(ratio * 100).toFixed(decimals)}%`;
};

/**
 * Format months into a human-readable duration
 * @param {number|null} months
 * @returns {string}  e.g. "2 years 3 months"
 */
const formatDuration = (months) => {
  if (!months || months <= 0) return "N/A";
  if (months < 12) return `${months} month${months > 1 ? "s" : ""}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0
    ? `${years} year${years > 1 ? "s" : ""} ${rem} month${rem > 1 ? "s" : ""}`
    : `${years} year${years > 1 ? "s" : ""}`;
};

/**
 * Build a standard API success response
 */
const successResponse = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

/**
 * Build a standard API error response
 */
const errorResponse = (res, message = "Error", statusCode = 500) => {
  return res.status(statusCode).json({ success: false, message });
};

module.exports = { formatINR, formatPercent, formatDuration, successResponse, errorResponse };
