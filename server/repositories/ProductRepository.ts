import { query } from "../db/database.js";

export class ProductRepository {
  static findAll() {
    return query.all(`
      SELECT p.*, c.name as category_name,
      (SELECT COUNT(*) FROM product_items WHERE product_id = p.id AND status = 'available') as dynamic_stock
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
    `);
  }

  static findById(id: number | string) {
    return query.get("SELECT * FROM products WHERE id = ?", id);
  }

  static findByCode(code: string) {
    return query.get("SELECT * FROM products WHERE code = ?", code);
  }

  static create(data: any) {
    const { 
      name, code, image, description, category_id, 
      purchase_price, sale_price, stock, min_stock, 
      unit, brand, supplier_id, has_serials, tipo_stock, parent_id, units_per_package
    } = data;

    const info = query.prepare(`
      INSERT INTO products (
        name, code, image, description, category_id, 
        purchase_price, sale_price, stock, min_stock, 
        unit, brand, supplier_id, has_serials, tipo_stock, parent_id, units_per_package
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, code, image, description, category_id, 
      purchase_price, sale_price, stock || 0, min_stock, 
      unit, brand, supplier_id, has_serials || tipo_stock === 'serie' ? 1 : 0, 
      tipo_stock || (has_serials ? 'serie' : 'cantidad'),
      parent_id || null, units_per_package
    );

    const productId = info.lastInsertRowid;
    return productId;
  }

  static update(id: number | string, data: any) {
    const { 
      name, code, image, description, category_id, 
      purchase_price, sale_price, stock, min_stock, 
      unit, brand, supplier_id, has_serials, tipo_stock,
      parent_id, units_per_package 
    } = data;

    return query.prepare(`
      UPDATE products SET 
        name = ?, code = ?, image = ?, description = ?, category_id = ?, 
        purchase_price = ?, sale_price = ?, stock = ?, min_stock = ?, 
        unit = ?, brand = ?, supplier_id = ?, has_serials = ?, tipo_stock = ?,
        parent_id = ?, units_per_package = ?
      WHERE id = ?
    `).run(
      name, code, image, description, category_id, 
      purchase_price, sale_price, stock, min_stock, 
      unit, brand, supplier_id, (has_serials || tipo_stock === 'serie') ? 1 : 0,
      tipo_stock || (has_serials ? 'serie' : 'cantidad'),
      parent_id || null, units_per_package, id
    );
  }

  static delete(id: number | string) {
    return query.run("DELETE FROM products WHERE id = ?", id);
  }

  static bulkDelete(ids: number[]) {
    const placeholders = ids.map(() => '?').join(',');
    return query.run(`DELETE FROM products WHERE id IN (${placeholders})`, ...ids);
  }

  static findItemsByProductId(productId: number | string) {
    return query.all("SELECT * FROM product_items WHERE product_id = ?", productId);
  }

  static findItemBySerialNumber(serial: string) {
    return query.get(`
      SELECT p.*, pi.serial_number, pi.status as item_status
      FROM product_items pi
      JOIN products p ON pi.product_id = p.id
      WHERE pi.serial_number = ? AND pi.status = 'available'
    `, serial);
  }

  static createItem(productId: number | string, serialNumber: string) {
    return query.prepare("INSERT INTO product_items (product_id, serial_number) VALUES (?, ?)")
      .run(productId, serialNumber);
  }

  static findAllCategories() {
    return query.all("SELECT * FROM categories");
  }

  static createCategory(data: { name: string; prefix?: string; description?: string }) {
    const { name, prefix, description } = data;
    const info = query.run("INSERT INTO categories (name, prefix, description) VALUES (?, ?, ?)", name, prefix, description);
    return info.lastInsertRowid;
  }
}
