import { query } from "../db/database.js";

export class SupplierService {
  static getAll() {
    return query.all("SELECT * FROM suppliers ORDER BY name ASC");
  }

  static getById(id: string | number) {
    return query.get("SELECT * FROM suppliers WHERE id = ?", id);
  }

  static create(data: any) {
    const { name, company, tax_id, phone, email, address, city, country, contact_person, notes } = data;
    const info = query.run(
      `INSERT INTO suppliers (name, company, tax_id, phone, email, address, city, country, contact_person, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      name, company, tax_id, phone, email, address, city, country, contact_person, notes
    );
    return { id: info.lastInsertRowid };
  }

  static update(id: string | number, data: any) {
    const { name, company, tax_id, phone, email, address, city, country, contact_person, notes } = data;
    const result = query.run(
      `UPDATE suppliers SET 
        name = ?, company = ?, tax_id = ?, phone = ?, email = ?, 
        address = ?, city = ?, country = ?, contact_person = ?, notes = ? 
       WHERE id = ?`,
      name, company, tax_id, phone, email, address, city, country, contact_person, notes, id
    );
    return result.changes > 0;
  }

  static hasProducts(id: string | number) {
    return !!query.get("SELECT id FROM products WHERE supplier_id = ? LIMIT 1", id);
  }

  static delete(id: string | number) {
    const result = query.run("DELETE FROM suppliers WHERE id = ?", id);
    return result.changes > 0;
  }
}
