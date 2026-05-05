import express from "express";
import { asyncHandler, verifyToken } from "../middleware/auth.js";
import { CustomerService } from "../services/CustomerService.js";

const router = express.Router();

router.get("/customers", verifyToken, asyncHandler(async (req, res) => {
  res.json(CustomerService.getAllCustomers());
}));

router.post("/customers", verifyToken, asyncHandler(async (req, res) => {
  const result = CustomerService.createCustomer(req.body);
  res.json(result);
}));

router.put("/customers/:id", verifyToken, asyncHandler(async (req, res) => {
  const result = CustomerService.updateCustomer(req.params.id, req.body);
  res.json(result);
}));

router.delete("/customers/:id", verifyToken, asyncHandler(async (req, res) => {
  CustomerService.deleteCustomer(req.params.id);
  res.json({ success: true });
}));

export default router;
