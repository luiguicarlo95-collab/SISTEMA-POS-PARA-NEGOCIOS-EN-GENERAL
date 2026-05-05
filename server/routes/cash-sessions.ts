import express from "express";
import { asyncHandler, verifyToken } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { cashSessionSchema } from "../schemas/index.js";
import { CashSessionService } from "../services/CashSessionService.js";

const router = express.Router();

// Get active session for user
router.get("/active", verifyToken, asyncHandler(async (req, res) => {
  res.json(CashSessionService.getActiveSession(req.user.id) || null);
}));

// Get last closed session for user
router.get("/last-closed", verifyToken, asyncHandler(async (req, res) => {
  res.json(CashSessionService.getLastClosedSession(req.user.id) || null);
}));

// Open new session
router.post("/open", verifyToken, validate(cashSessionSchema), asyncHandler(async (req, res) => {
  try {
    res.json(CashSessionService.openSession(req.user.id, req.body));
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}));

// Close session
router.post("/close", verifyToken, validate(cashSessionSchema), asyncHandler(async (req, res) => {
  try {
    res.json(CashSessionService.closeSession(req.user.id, req.body));
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}));

// Get sessions history
router.get("/history", verifyToken, asyncHandler(async (req, res) => {
  res.json(CashSessionService.getHistory());
}));

// Get session details
router.get("/:id/details", verifyToken, asyncHandler(async (req, res) => {
  const details = CashSessionService.getSessionDetails(req.params.id);
  if (!details) return res.status(404).json({ message: "Sesión no encontrada" });
  res.json(details);
}));

export default router;
