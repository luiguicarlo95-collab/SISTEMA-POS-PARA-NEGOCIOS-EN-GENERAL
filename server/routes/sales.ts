import express from "express";
import { asyncHandler, verifyToken, can } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { saleSchema } from "../schemas/index.js";
import { SaleService } from "../services/SaleService.js";
import { AuditService } from "../services/AuditService.js";

const router = express.Router();

// Sales
router.get("/sales", verifyToken, asyncHandler(async (req, res) => {
  const { start, end, range } = req.query;
  const sales = SaleService.getSales({ 
    start: start as string, 
    end: end as string, 
    range: range as string 
  });
  res.json(sales);
}));

router.get("/sales/:id", verifyToken, asyncHandler(async (req, res) => {
  const sale = SaleService.getSaleById(req.params.id);
  if (!sale) return res.status(404).json({ message: "Venta no encontrada" });
  res.json(sale);
}));

// Quotations
router.get("/quotations", verifyToken, asyncHandler(async (req, res) => {
  res.json(SaleService.getQuotations());
}));

router.post("/quotations", verifyToken, asyncHandler(async (req: any, res) => {
  const quotationId = SaleService.createQuotation(req.body);
  res.json({ success: true, id: quotationId });
}));

router.post("/sales", verifyToken, can('manage_sales'), validate(saleSchema), asyncHandler(async (req: any, res) => {
  const saleId = SaleService.createSale(req.user.id, req.body);
  
  AuditService.log({
    userId: req.user.id,
    action: 'CREATE_SALE',
    module: 'SALES',
    entityId: saleId,
    details: { total: req.body.total, method: req.body.payment_method }
  });

  res.json({ success: true, saleId });
}));

export default router;
