import { query } from "../db/database.js";

export class CashSessionService {
  static getActiveSession(userId: number | string) {
    return query.get(
      "SELECT * FROM cash_sessions WHERE user_id = ? AND status = 'open' ORDER BY id DESC LIMIT 1",
      userId
    );
  }

  static getLastClosedSession(userId: number | string) {
    return query.get(
      "SELECT * FROM cash_sessions WHERE user_id = ? AND status = 'closed' ORDER BY closed_at DESC LIMIT 1",
      userId
    );
  }

  static openSession(userId: number | string, data: any) {
    const opening_balance = parseFloat(data.opening_balance || 0);
    const description = data.description;
    const branch_id = data.branch_id;
    
    // Check if there's already an open session
    const active = query.get(
      "SELECT id FROM cash_sessions WHERE user_id = ? AND status = 'open'",
      userId
    );
    if (active) throw new Error("Ya tienes una caja abierta");

    const transaction = query.transaction(() => {
      const info = query.run(
        "INSERT INTO cash_sessions (user_id, opening_balance, opening_description, status, branch_id) VALUES (?, ?, ?, 'open', ?)",
        userId, opening_balance, description || '', branch_id || null
      );

      // Record in cash flow
      query.run(
        "INSERT INTO cash_flow (type, category, amount, description, user_id, session_id, branch_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
        'income', 'Apertura de Caja', opening_balance, description || 'Apertura de caja', userId, info.lastInsertRowid, branch_id || null
      );

      return { id: info.lastInsertRowid };
    });

    return transaction();
  }

  static closeSession(userId: number | string, data: any) {
    const { closing_balance, description } = data;
    
    const active = query.get(
      "SELECT id FROM cash_sessions WHERE user_id = ? AND status = 'open' ORDER BY id DESC LIMIT 1",
      userId
    ) as any;
    
    if (!active) throw new Error("No tienes una caja abierta");

    query.run(
      "UPDATE cash_sessions SET closing_balance = ?, closing_description = ?, status = 'closed', closed_at = CURRENT_TIMESTAMP WHERE id = ?",
      closing_balance, description || '', active.id
    );

    return { success: true };
  }

  static getHistory() {
    return query.all(`
      SELECT cs.*, u.name as user_name 
      FROM cash_sessions cs
      JOIN users u ON cs.user_id = u.id
      ORDER BY cs.opened_at DESC
    `);
  }

  static getSessionDetails(id: string | number) {
    const session = query.get("SELECT * FROM cash_sessions WHERE id = ?", id) as any;
    if (!session) return null;

    const movements = query.all("SELECT * FROM cash_flow WHERE session_id = ? ORDER BY created_at ASC", id);
    const sales = query.all("SELECT s.*, u.name as cashier_name FROM sales s LEFT JOIN users u ON s.user_id = u.id WHERE s.session_id = ? ORDER BY s.created_at ASC", id);

    // Calculate summary
    const total_sales = sales.reduce((acc: number, s: any) => acc + s.total, 0);
    const manual_income = movements.filter((m: any) => m.type === 'income' && m.category !== 'Apertura de Caja').reduce((acc: number, m: any) => acc + m.amount, 0);
    const manual_expense = movements.filter((m: any) => m.type === 'expense').reduce((acc: number, m: any) => acc + m.amount, 0);
    
    // Payments breakdown
    const paymentMap = new Map<string, number>();
    sales.forEach((s: any) => {
      try {
        const methods = JSON.parse(s.payment_method);
        if (Array.isArray(methods)) {
          methods.forEach((m: any) => {
            const current = paymentMap.get(m.method) || 0;
            paymentMap.set(m.method, current + m.amount);
          });
        }
      } catch (e) {
        const current = paymentMap.get(s.payment_method) || 0;
        paymentMap.set(s.payment_method, current + s.total);
      }
    });

    const payments = Array.from(paymentMap.entries()).map(([method, amount]) => ({
      payment_method: method,
      amount
    }));

    const cash_sales = paymentMap.get('efectivo') || 0;
    const electronic_sales = total_sales - cash_sales;

    return {
      ...session,
      sales,
      movements,
      payments,
      summary: {
        total_sales,
        cash_sales,
        electronic_sales,
        total_profit: 0, // Would need cost calculation
        manual_income,
        manual_expense,
        net_manual: manual_income - manual_expense,
        grand_total: session.opening_balance + cash_sales + manual_income - manual_expense
      }
    };
  }

  static createMovement(userId: number | string, data: any) {
    const { type, amount, description, session_id } = data;
    
    const info = query.run(
      "INSERT INTO cash_flow (type, category, amount, description, user_id, session_id, source_type) VALUES (?, ?, ?, ?, ?, ?, ?)",
      type, 'manual', amount, description, userId, session_id || null, 'manual'
    );

    return { id: info.lastInsertRowid };
  }

  static getFlow() {
    return query.all(`
      SELECT cf.*, u.name as user_name 
      FROM cash_flow cf
      JOIN users u ON cf.user_id = u.id
      ORDER BY cf.created_at DESC
    `);
  }
}
