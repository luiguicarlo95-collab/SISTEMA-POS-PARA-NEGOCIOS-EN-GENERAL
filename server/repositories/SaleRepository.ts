import { query } from "../db/database.js";

export class SaleRepository {
  static findAll() {
    return query.all(`
      SELECT s.*, c.first_name || ' ' || c.last_name as customer_name, u.name as user_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `);
  }

  static findById(id: number | string) {
    const sale = query.get("SELECT * FROM sales WHERE id = ?", id) as any;
    if (sale) {
      sale.items = query.all(`
        SELECT si.*, p.name as product_name, p.code as product_code
        FROM sale_items si
        LEFT JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
      `, id);
    }
    return sale;
  }

  static create(data: any) {
    const { 
      customer_id, user_id, type, subtotal, total, tax, 
      discount, payment_method, cash_received, change_amount, 
      warranty, session_id
    } = data;

    const info = query.prepare(`
      INSERT INTO sales (
        customer_id, user_id, type, subtotal, total, tax, 
        discount, payment_method, cash_received, change_amount, 
        warranty, session_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      customer_id || null, user_id, type, subtotal, total, tax, 
      discount, payment_method, cash_received, change_amount, 
      warranty, session_id || null
    );

    return info.lastInsertRowid;
  }

  static createItem(data: any) {
    const { sale_id, product_id, quantity, price, subtotal, serial_numbers, custom_name } = data;
    return query.prepare(`
      INSERT INTO sale_items (
        sale_id, product_id, quantity, price, subtotal, serial_numbers, custom_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(sale_id, product_id || null, quantity, price, subtotal, serial_numbers, custom_name);
  }

  static updateStock(productId: number | string, quantity: number) {
    query.run("UPDATE products SET stock = stock - ? WHERE id = ?", quantity, productId);
  }

  static updateItemStatus(serial: string, status: string, saleId: number | string | null) {
    return query.run("UPDATE product_items SET status = ?, sale_id = ? WHERE serial_number = ?", status, saleId, serial);
  }

  static findBySessionId(sessionId: number | string) {
    return query.all("SELECT * FROM sales WHERE session_id = ?", sessionId);
  }
}
