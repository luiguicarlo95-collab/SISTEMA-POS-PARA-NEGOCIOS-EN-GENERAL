import { query } from "../db/database.js";
import { SaleRepository } from "../repositories/SaleRepository.js";
import { ProductRepository } from "../repositories/ProductRepository.js";

export class SaleService {
  static getSales(filters: { start?: string; end?: string; range?: string }) {
    const { start, end, range } = filters;
    
    // For complex filters we might still build it here or have a flexible repo method
    // For brevity of this refactor, I'll use repo for basic all and keep logic if needed
    if (!start && !end && !range) {
      return SaleRepository.findAll();
    }

    let queryStr = `
      SELECT s.*, c.first_name || ' ' || c.last_name as customer_name, u.name as user_name
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id 
      LEFT JOIN users u ON s.user_id = u.id
    `;
    const params: any[] = [];
    let whereConditions: string[] = [];

    if (range === 'today') {
      whereConditions.push("date(s.created_at) = date('now', 'localtime')");
    } else if (range === 'week') {
      whereConditions.push("s.created_at >= date('now', '-7 days')");
    } else if (range === 'month') {
      whereConditions.push("s.created_at >= date('now', 'start of month')");
    } else if (start && end) {
      whereConditions.push("date(s.created_at) BETWEEN ? AND ?");
      params.push(start, end);
    }

    if (whereConditions.length > 0) {
      queryStr += " WHERE " + whereConditions.join(" AND ");
    }

    queryStr += " ORDER BY s.created_at DESC";

    return query.all(queryStr, ...params);
  }

  static getSaleById(id: string | number) {
    return SaleRepository.findById(id);
  }

  static getQuotations() {
    return query.all(`
      SELECT q.*, c.first_name, c.last_name 
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id 
      ORDER BY q.created_at DESC
    `);
  }

  static createSale(userId: number, data: any) {
    const { items, total } = data;

    const transaction = query.transaction(() => {
      // Get active session
      const activeSession = query.get("SELECT id FROM cash_sessions WHERE user_id = ? AND status = 'open' ORDER BY id DESC LIMIT 1", userId) as any;

      const saleId = SaleRepository.create({ ...data, user_id: userId, session_id: activeSession?.id });

      for (const item of items) {
        SaleRepository.createItem({ ...item, sale_id: saleId });

        // Check if product is serial-based
        const product = ProductRepository.findById(item.product_id) as any;
        if (product?.tipo_stock === 'serie' || product?.has_serials === 1) {
          // Update status of individual serial numbers
          if (item.serial_numbers) {
            const serials = typeof item.serial_numbers === 'string' ? item.serial_numbers.split(',').map((s: string) => s.trim()) : item.serial_numbers;
            if (Array.isArray(serials)) {
              for (const sn of serials) {
                SaleRepository.updateItemStatus(sn, 'sold', saleId);
              }
            }
          }
        } else {
          // Standard stock deduction for quantity products
          SaleRepository.updateStock(item.product_id, item.quantity);
        }
      }

      // Add to cash flow
      query.prepare(`
        INSERT INTO cash_flow (type, category, amount, description, user_id, source_type, source_id, session_id)
        VALUES ('income', 'Venta', ?, ?, ?, 'sale', ?, ?)
      `).run(total, `Venta #${saleId}`, userId, saleId, activeSession?.id || null);

      return saleId;
    });

    return transaction();
  }

  static createQuotation(data: any) {
    const { customer_id, items, subtotal, total, tax } = data;

    const transaction = query.transaction(() => {
      const qInfo = query.prepare(`
        INSERT INTO quotations (customer_id, subtotal, total, tax)
        VALUES (?, ?, ?, ?)
      `).run(customer_id || null, subtotal, total, tax || 0);

      const quotationId = qInfo.lastInsertRowid;

      for (const item of items) {
        query.prepare(`
          INSERT INTO quotation_items (quotation_id, product_id, quantity, price, subtotal)
          VALUES (?, ?, ?, ?, ?)
        `).run(quotationId, item.id, item.quantity, item.price, (item.quantity * item.price));
      }

      return quotationId;
    });

    return transaction();
  }
}
