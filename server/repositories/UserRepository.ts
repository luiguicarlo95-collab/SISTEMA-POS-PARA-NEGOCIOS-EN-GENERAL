import { query } from "../db/database.js";

export class UserRepository {
  static findAll() {
    return query.all("SELECT id, email, name, role, branch_id, created_at, mfa_enabled FROM users");
  }

  static findById(id: number | string) {
    return query.get("SELECT * FROM users WHERE id = ?", id);
  }

  static findByEmail(email: string) {
    return query.get("SELECT * FROM users WHERE email = ?", email);
  }

  static create(data: any) {
    const { email, password, name, role, branch_id } = data;
    const info = query.run("INSERT INTO users (email, password, name, role, branch_id) VALUES (?, ?, ?, ?, ?)", email, password, name, role, branch_id);
    return info.lastInsertRowid;
  }

  static update(id: number | string, data: any) {
    const { email, name, role, branch_id } = data;
    return query.run("UPDATE users SET email = ?, name = ?, role = ?, branch_id = ? WHERE id = ?", email, name, role, branch_id, id);
  }

  static updatePassword(id: number | string, passwordHash: string) {
    return query.run("UPDATE users SET password = ? WHERE id = ?", passwordHash, id);
  }

  static delete(id: number | string) {
    return query.run("DELETE FROM users WHERE id = ?", id);
  }

  static updateMfa(id: number | string, secret: string | null, enabled: boolean) {
    return query.run("UPDATE users SET mfa_secret = ?, mfa_enabled = ? WHERE id = ?", secret, enabled ? 1 : 0, id);
  }
}
