import { query } from "../db/database.js";

export class CustomerService {
  static getAllCustomers() {
    return query.all("SELECT * FROM customers ORDER BY first_name ASC");
  }

  static createCustomer(data: any) {
    const { first_name, last_name, dni, phone, email, address } = data;
    const info = query.run(`
      INSERT INTO customers (first_name, last_name, dni, phone, email, address)
      VALUES (?, ?, ?, ?, ?, ?)
    `, first_name, last_name, dni, phone, email, address);
    
    return { id: info.lastInsertRowid };
  }

  static updateCustomer(id: string | number, data: any) {
    const { first_name, last_name, dni, phone, email, address } = data;
    query.run(`
      UPDATE customers SET 
        first_name = ?, last_name = ?, dni = ?, 
        phone = ?, email = ?, address = ?
      WHERE id = ?
    `, first_name, last_name, dni, phone, email, address, id);
    
    return { success: true };
  }

  static deleteCustomer(id: string | number) {
    return query.run("DELETE FROM customers WHERE id = ?", id);
  }
}
