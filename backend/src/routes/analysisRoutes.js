/**
 * analysisRoutes.js — Routes for financial analysis
 *
 * GET /api/analysis?sessionId=xxx → full financial analysis + AI summary
 */

const express = require("express");
const router = express.Router();
const { query } = require("express-validator");
const { getAnalysis } = require("../controllers/analysisController");
const { validate } = require("../middleware/errorHandler");

router.get(
  "/",
  [query("sessionId").notEmpty().withMessage("sessionId is required")],
  validate,
  getAnalysis
);

module.exports = router;
