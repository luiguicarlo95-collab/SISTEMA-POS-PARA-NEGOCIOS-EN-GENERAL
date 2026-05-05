import express from "express";
import { asyncHandler, verifyToken, checkRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { supplierSchema } from "../schemas/index.js";
import { SupplierService } from "../services/SupplierService.js";

const router = express.Router();

// Get all suppliers
router.get("/suppliers", verifyToken, asyncHandler(async (req, res) => {
  res.json(SupplierService.getAll());
}));

// Get supplier by ID
router.get("/suppliers/:id", verifyToken, asyncHandler(async (req, res) => {
  const supplier = SupplierService.getById(req.params.id);
  if (!supplier) return res.status(404).json({ message: "Proveedor no encontrado" });
  res.json(supplier);
}));

// Create supplier
router.post("/suppliers", verifyToken, checkRole(['ADMINISTRADOR', 'DESARROLLADOR']), validate(supplierSchema), asyncHandler(async (req, res) => {
  res.json(SupplierService.create(req.body));
}));

// Update supplier
router.put("/suppliers/:id", verifyToken, checkRole(['ADMINISTRADOR', 'DESARROLLADOR']), validate(supplierSchema), asyncHandler(async (req, res) => {
  const success = SupplierService.update(req.params.id, req.body);
  if (!success) return res.status(404).json({ message: "Proveedor no encontrado" });
  res.json({ success: true });
}));

// Delete supplier
router.delete("/suppliers/:id", verifyToken, checkRole(['ADMINISTRADOR', 'DESARROLLADOR']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (SupplierService.hasProducts(id)) {
    return res.status(400).json({ message: "No se puede eliminar el proveedor porque tiene productos asociados" });
  }

  const success = SupplierService.delete(id);
  if (!success) return res.status(404).json({ message: "Proveedor no encontrado" });
  res.json({ success: true });
}));

export default router;
