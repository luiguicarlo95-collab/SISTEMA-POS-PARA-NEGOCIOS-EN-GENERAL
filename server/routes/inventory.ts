import express from "express";
import { asyncHandler, verifyToken, checkRole, can } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { productSchema, categorySchema } from "../schemas/index.js";
import { ProductService } from "../services/ProductService.js";
import { AuditService } from "../services/AuditService.js";

const router = express.Router();

// Inventory Search
router.get("/inventory-search", verifyToken, asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') return res.json([]);
  
  // Search products by name, code or serial
  const results = ProductService.searchInventory(q);
  res.json(results);
}));

// Categories
router.get("/categories", verifyToken, asyncHandler(async (req, res) => {
  res.json(ProductService.getCategories());
}));

router.post("/categories", verifyToken, checkRole(['DESARROLLADOR', 'ADMINISTRADOR']), can('manage_inventory'), validate(categorySchema), asyncHandler(async (req: any, res) => {
  const result = ProductService.createCategory(req.body);
  
  AuditService.log({
    userId: req.user.id,
    action: 'CREATE_CATEGORY',
    module: 'INVENTORY',
    entityId: result.id,
    details: { name: req.body.name }
  });

  res.json(result);
}));

// Products
router.get("/products/code/:code", verifyToken, asyncHandler(async (req, res) => {
  const product = ProductService.getProductByCode(req.params.code);
  if (!product) return res.status(404).json({ message: "Producto no encontrado por código" });
  res.json(product);
}));

router.get("/products", verifyToken, asyncHandler(async (req, res) => {
  res.json(ProductService.getAllProducts());
}));

router.post("/products", verifyToken, checkRole(['DESARROLLADOR', 'ADMINISTRADOR']), can('manage_inventory'), validate(productSchema), asyncHandler(async (req: any, res) => {
  const result = ProductService.createProduct(req.body);
  
  AuditService.log({
    userId: req.user.id,
    action: 'CREATE_PRODUCT',
    module: 'INVENTORY',
    entityId: result.id,
    details: { name: req.body.name, code: result.code }
  });

  res.json(result);
}));

router.put("/products/:id", verifyToken, checkRole(['DESARROLLADOR', 'ADMINISTRADOR']), can('manage_inventory'), validate(productSchema), asyncHandler(async (req: any, res) => {
  const result = ProductService.updateProduct(req.params.id, req.body);
  
  AuditService.log({
    userId: req.user.id,
    action: 'UPDATE_PRODUCT',
    module: 'INVENTORY',
    entityId: req.params.id,
    details: { name: req.body.name }
  });

  res.json(result);
}));

router.delete("/products/:id", verifyToken, checkRole(['DESARROLLADOR', 'ADMINISTRADOR']), can('manage_inventory'), asyncHandler(async (req: any, res) => {
  ProductService.deleteProduct(req.params.id);
  
  AuditService.log({
    userId: req.user.id,
    action: 'DELETE_PRODUCT',
    module: 'INVENTORY',
    entityId: req.params.id
  });

  res.json({ success: true });
}));

router.post("/products/bulk-delete", verifyToken, checkRole(['DESARROLLADOR', 'ADMINISTRADOR']), can('manage_inventory'), asyncHandler(async (req: any, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) return res.status(400).json({ message: "IDs no válidos" });
  ProductService.bulkDeleteProducts(ids);

  AuditService.log({
    userId: req.user.id,
    action: 'BULK_DELETE_PRODUCT',
    module: 'INVENTORY',
    details: { count: ids.length }
  });

  res.json({ success: true });
}));

router.get("/products/:id/items", verifyToken, asyncHandler(async (req, res) => {
  res.json(ProductService.getProductItems(req.params.id));
}));

router.get("/products/:id/serials", verifyToken, asyncHandler(async (req, res) => {
  res.json(ProductService.getProductItems(req.params.id));
}));

router.get("/products/by-serial/:serial", verifyToken, asyncHandler(async (req, res) => {
  const product = ProductService.getProductBySerial(req.params.serial);
  if (!product) return res.status(404).json({ message: "Producto no encontrado por serie" });
  res.json(product);
}));

export default router;
