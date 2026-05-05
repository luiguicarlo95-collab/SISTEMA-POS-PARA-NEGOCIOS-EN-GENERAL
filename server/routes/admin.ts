import express from "express";
import { asyncHandler, verifyToken, checkRole, can } from "../middleware/auth.js";
import { AuditService } from "../services/AuditService.js";
import { query } from "../db/database.js";

const router = express.Router();

router.get("/logs", verifyToken, checkRole(['ADMINISTRADOR', 'DESARROLLADOR']), can('view_audit_logs'), asyncHandler(async (req, res) => {
  const { userId, module, action, limit } = req.query;
  const logs = AuditService.getLogs({
    userId: userId ? Number(userId) : undefined,
    module: module as string,
    action: action as string,
    limit: limit ? Number(limit) : undefined
  });
  res.json(logs);
}));

router.get("/sessions", verifyToken, asyncHandler(async (req: any, res) => {
  const sessions = query.all(`
    SELECT * FROM user_sessions 
    WHERE user_id = ? AND revoked = 0 
    ORDER BY last_active DESC
  `, req.user.id);
  res.json(sessions);
}));

router.post("/sessions/:tokenId/revoke", verifyToken, asyncHandler(async (req: any, res) => {
  query.run(
    "UPDATE user_sessions SET revoked = 1 WHERE token_id = ? AND user_id = ?",
    req.params.tokenId, req.user.id
  );
  res.json({ success: true });
}));

// Settings
router.get("/settings", verifyToken, asyncHandler(async (req, res) => {
  const rows = query.all("SELECT * FROM settings") as { key: string, value: string }[];
  const settings = rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {} as any);
  res.json(settings);
}));

router.post("/settings", verifyToken, checkRole(['ADMINISTRADOR', 'DESARROLLADOR']), can('manage_settings'), asyncHandler(async (req, res) => {
  const settings = req.body;
  const stmt = query.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
  
  query.transaction(() => {
    Object.entries(settings).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        stmt.run(key, JSON.stringify(value));
      } else {
        stmt.run(key, String(value));
      }
    });
  })();

  AuditService.log({
    userId: (req as any).user.id,
    action: 'UPDATE_SETTINGS',
    module: 'ADMIN'
  });

  res.json({ success: true });
}));

// Backup & Import
router.get("/backup/all", verifyToken, checkRole(['ADMINISTRADOR', 'DESARROLLADOR']), can('manage_settings'), asyncHandler(async (req, res) => {
  const data = {
    products: query.all("SELECT * FROM products"),
    categories: query.all("SELECT * FROM categories"),
    suppliers: query.all("SELECT * FROM suppliers"),
    customers: query.all("SELECT * FROM customers"),
    sales: query.all("SELECT * FROM sales"),
    sale_items: query.all("SELECT * FROM sale_items"),
    product_items: query.all("SELECT * FROM product_items")
  };
  res.json(data);
}));

router.post("/import", verifyToken, checkRole(['ADMINISTRADOR', 'DESARROLLADOR']), can('manage_settings'), asyncHandler(async (req, res) => {
  const data = req.body;
  
  query.transaction(() => {
    if (data.categories) {
      const stmt = query.prepare("INSERT OR REPLACE INTO categories (id, name, prefix, description, status) VALUES (?, ?, ?, ?, ?)");
      data.categories.forEach((c: any) => stmt.run(c.id, c.name, c.prefix, c.description, c.status));
    }
    if (data.suppliers) {
      const stmt = query.prepare("INSERT OR REPLACE INTO suppliers (id, name, company, tax_id, phone, email, address, city, country, contact_person, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
      data.suppliers.forEach((s: any) => stmt.run(s.id, s.name, s.company, s.tax_id, s.phone, s.email, s.address, s.city, s.country, s.contact_person, s.notes));
    }
    if (data.products) {
      const stmt = query.prepare("INSERT OR REPLACE INTO products (id, code, name, description, category_id, purchase_price, sale_price, stock, min_stock, unit, brand, supplier_id, status, has_serials) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
      data.products.forEach((p: any) => stmt.run(p.id, p.code, p.name, p.description, p.category_id, p.purchase_price, p.sale_price, p.stock, p.min_stock, p.unit, p.brand, p.supplier_id, p.status, p.has_serials));
    }
    // Add more entities as needed following the same pattern
  })();

  AuditService.log({
    userId: (req as any).user.id,
    action: 'IMPORT_DATA',
    module: 'ADMIN'
  });

  res.json({ success: true });
}));

router.get("/dashboard/stats", verifyToken, asyncHandler(async (req, res) => {
  const stats = {
    dailySales: query.get("SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE date(created_at) = date('now', 'localtime')") as any,
    weeklySales: query.get("SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE created_at >= date('now', '-7 days')") as any,
    monthlySales: query.get("SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE created_at >= date('now', 'start of month')") as any,
    lowStock: query.get("SELECT COUNT(*) as count FROM products WHERE stock <= min_stock AND stock > 0") as any,
    totalProducts: query.get("SELECT COUNT(*) as count FROM products") as any,
    
    salesTrend: query.all(`
      WITH RECURSIVE days(d) AS (
        SELECT date('now', '-6 days')
        UNION ALL
        SELECT date(d, '+1 day') FROM days WHERE d < date('now')
      )
      SELECT 
        d as date,
        COALESCE((SELECT SUM(total) FROM sales WHERE date(created_at) = d), 0) as sales
      FROM days
    `),
    
    salesByCategory: query.all(`
      SELECT c.name, SUM(si.subtotal) as value
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY value DESC
      LIMIT 5
    `),
    
    recentSales: query.all(`
      SELECT * FROM sales 
      ORDER BY created_at DESC 
      LIMIT 5
    `),
    
    lowStockProducts: query.all(`
      SELECT * FROM products 
      WHERE stock <= min_stock 
      ORDER BY stock ASC 
      LIMIT 5
    `),
    
    cashBalance: query.get("SELECT COALESCE(opening_balance, 0) as balance FROM cash_sessions WHERE status = 'OPEN' ORDER BY opened_at DESC LIMIT 1") as any || { balance: 0 }
  };
  
  res.json(stats);
}));

export default router;
