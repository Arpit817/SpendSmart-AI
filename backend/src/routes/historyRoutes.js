/**
 * historyRoutes.js — Routes for financial report history
 *
 * GET    /api/history?sessionId=xxx  → paginated list of reports
 * GET    /api/history/:id            → single report
 * DELETE /api/history/:id            → delete report
 */

const express = require("express");
const router = express.Router();
const { query, param, body } = require("express-validator");
const { getHistory, getReportById, deleteReport } = require("../controllers/historyController");
const { validate } = require("../middleware/errorHandler");

// GET /api/history
router.get(
  "/",
  [
    query("sessionId").notEmpty().withMessage("sessionId is required"),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
  ],
  validate,
  getHistory
);

// GET /api/history/:id
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid report ID")],
  validate,
  getReportById
);

// DELETE /api/history/:id
router.delete(
  "/:id",
  [
    param("id").isMongoId().withMessage("Invalid report ID"),
    body("sessionId").notEmpty().withMessage("sessionId is required"),
  ],
  validate,
  deleteReport
);

module.exports = router;
