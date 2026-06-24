/**
 * userRoutes.js — Routes for user profile management
 *
 * POST /api/user/add     → create/update user
 * GET  /api/user/:id     → get user profile
 */

const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const { addOrUpdateUser, getUserProfile } = require("../controllers/userController");
const { validate } = require("../middleware/errorHandler");

// ── POST /api/user/add ─────────────────────────────────────────────────────
router.post(
  "/add",
  [
    body("sessionId").notEmpty().withMessage("sessionId is required"),
    body("income")
      .isFloat({ min: 0 })
      .withMessage("Income must be a positive number"),
    body("expenses.rent").optional().isFloat({ min: 0 }),
    body("expenses.food").optional().isFloat({ min: 0 }),
    body("expenses.travel").optional().isFloat({ min: 0 }),
    body("expenses.shopping").optional().isFloat({ min: 0 }),
    body("expenses.bills").optional().isFloat({ min: 0 }),
    body("expenses.emi").optional().isFloat({ min: 0 }),
    body("expenses.others").optional().isFloat({ min: 0 }),
    body("savingsGoal.targetAmount").optional().isFloat({ min: 0 }),
    body("savingsGoal.targetMonths").optional().isInt({ min: 1 }),
    body("language").optional().isIn(["en", "hi"]),
  ],
  validate,
  addOrUpdateUser
);

// ── GET /api/user/:sessionId ──────────────────────────────────────────────
router.get(
  "/:sessionId",
  [param("sessionId").notEmpty().withMessage("sessionId is required")],
  validate,
  getUserProfile
);

module.exports = router;
