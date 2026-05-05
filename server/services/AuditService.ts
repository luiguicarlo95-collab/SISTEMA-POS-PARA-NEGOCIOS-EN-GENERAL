import { query } from "../db/database.js";

interface AuditLogEntry {
  userId?: number;
  action: string;
  module: string;
  entityId?: string | number;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  static log(entry: AuditLogEntry) {
    try {
      const { userId, action, module, entityId, details, ipAddress, userAgent } = entry;
      query.run(
        `INSERT INTO audit_logs (user_id, action, module, entity_id, details, ip_address, user_agent) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        userId || null,
        action,
        module,
        entityId ? String(entityId) : null,
        details ? JSON.stringify(details) : null,
        ipAddress || null,
        userAgent || null
      );
    } catch (error) {
      console.error("Failed to write audit log:", error);
    }
  }

  static getLogs(filters: { userId?: number; module?: string; action?: string; limit?: number } = {}) {
    let sql = `
      SELECT al.*, u.name as user_name 
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
    `;
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.userId) {
      conditions.push("al.user_id = ?");
      params.push(filters.userId);
    }
    if (filters.module) {
      conditions.push("al.module = ?");
      params.push(filters.module);
    }
    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY al.created_at DESC LIMIT ?";
    params.push(filters.limit || 100);

    return query.all(sql, ...params);
  }
}
