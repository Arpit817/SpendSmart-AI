/**
 * historyController.js
 *
 * GET /api/history — retrieve stored financial reports for a session
 * DELETE /api/history/:id — delete a specific report
 */

const FinancialReport = require("../models/FinancialReport");

// ── GET /api/history ───────────────────────────────────────────────────────
const getHistory = async (req, res, next) => {
  try {
    const { sessionId, page = 1, limit = 10 } = req.query;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: "sessionId is required" });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reports, total] = await Promise.all([
      FinancialReport.find({ sessionId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      FinancialReport.countDocuments({ sessionId }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        reports,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/history/:id ───────────────────────────────────────────────────
const getReportById = async (req, res, next) => {
  try {
    const report = await FinancialReport.findById(req.params.id).lean();
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/history/:id ────────────────────────────────────────────────
const deleteReport = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const report = await FinancialReport.findOneAndDelete({
      _id: req.params.id,
      sessionId, // ensure ownership
    });

    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found or unauthorized" });
    }

    res.status(200).json({ success: true, message: "Report deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getHistory, getReportById, deleteReport };
