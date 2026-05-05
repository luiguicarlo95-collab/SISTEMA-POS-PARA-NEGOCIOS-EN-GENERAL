import express from "express";
import { asyncHandler, verifyToken } from "../middleware/auth.js";
import { CashSessionService } from "../services/CashSessionService.js";

const router = express.Router();

// Get whole cash flow
router.get("/", verifyToken, asyncHandler(async (req, res) => {
  res.json(CashSessionService.getFlow());
}));

// Register manual movement
router.post("/", verifyToken, asyncHandler(async (req, res) => {
  const activeSession = CashSessionService.getActiveSession(req.user.id) as any;
  const data = {
    ...req.body,
    session_id: activeSession?.id
  };
  res.json(CashSessionService.createMovement(req.user.id, data));
}));

export default router;
