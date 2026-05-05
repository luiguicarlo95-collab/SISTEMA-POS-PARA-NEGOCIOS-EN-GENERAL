import express from "express";
import { query } from "../db/database.js";
import { asyncHandler, verifyToken, can } from "../middleware/auth.js";

const router = express.Router();

router.get("/earnings", verifyToken, can('view_reports'), asyncHandler(async (req, res) => {
  const { range, startDate, endDate, start, end } = req.query;
  
  const finalStart = startDate || start;
  const finalEnd = endDate || end;
  
  let dateFilter = "";
  let params: any[] = [];

  if (range === 'today') {
    dateFilter = "date(s.created_at) = date('now', 'localtime')";
  } else if (range === 'week') {
    dateFilter = "s.created_at >= date('now', '-7 days')";
  } else if (range === 'month') {
    dateFilter = "s.created_at >= date('now', 'start of month')";
  } else if (finalStart && finalEnd) {
    dateFilter = "date(s.created_at) BETWEEN ? AND ?";
    params.push(finalStart, finalEnd);
  } else {
    // Default to today if no valid range
    dateFilter = "date(s.created_at) = date('now', 'localtime')";
  }

  // Calculate total income, cost and profit
  // Join sale_items with products to get purchase_price (cost)
  const stats = query.get(`
    SELECT 
      COALESCE(SUM(si.subtotal), 0) as income,
      COALESCE(SUM(si.quantity * p.purchase_price), 0) as cost
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    JOIN products p ON si.product_id = p.id
    WHERE ${dateFilter}
  `, ...params) as any;

  const income = stats.income || 0;
  const cost = stats.cost || 0;
  const profit = income - cost;

  res.json({ income, cost, profit });
}));

export default router;
