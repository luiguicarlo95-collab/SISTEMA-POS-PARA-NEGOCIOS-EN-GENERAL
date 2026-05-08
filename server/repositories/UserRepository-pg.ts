/**
 * User Repository - PostgreSQL Compatible
 * Handles all database operations for users
 */

import { query } from "../db/dbClient.js";

export class UserRepository {
  /**
   * Get all users (excluding passwords)
   */
  static async findAll() {
    return await query.all(
      "SELECT id, email, name, role, branch_id, created_at, mfa_enabled FROM users"
    );
  }

  /**
   * Find a user by ID
   */
  static async findById(id: number | string) {
    return await query.get("SELECT * FROM users WHERE id = ?", id);
  }

  /**
   * Find a user by email
   */
  static async findByEmail(email: string) {
    return await query.get("SELECT * FROM users WHERE email = ?", email);
  }

  /**
   * Create a new user
   */
  static async create(data: any) {
    const { email, password, name, role, branch_id } = data;
    const result = await query.run(
      "INSERT INTO users (email, password, name, role, branch_id) VALUES (?, ?, ?, ?, ?)", 
      email, 
      password, 
      name, 
      role, 
      branch_id
    );
    return result.lastInsertRowid;
  }

  /**
   * Update user information
   */
  static async update(id: number | string, data: any) {
    const { email, name, role, branch_id } = data;
    return await query.run(
      "UPDATE users SET email = ?, name = ?, role = ?, branch_id = ? WHERE id = ?", 
      email, 
      name, 
      role, 
      branch_id, 
      id
    );
  }

  /**
   * Update user password
   */
  static async updatePassword(id: number | string, passwordHash: string) {
    return await query.run(
      "UPDATE users SET password = ? WHERE id = ?", 
      passwordHash, 
      id
    );
  }

  /**
   * Delete a user
   */
  static async delete(id: number | string) {
    return await query.run("DELETE FROM users WHERE id = ?", id);
  }

  /**
   * Update MFA settings
   */
  static async updateMfa(id: number | string, secret: string | null, enabled: boolean) {
    return await query.run(
      "UPDATE users SET mfa_secret = ?, mfa_enabled = ? WHERE id = ?", 
      secret, 
      enabled ? 1 : 0, 
      id
    );
  }
}
