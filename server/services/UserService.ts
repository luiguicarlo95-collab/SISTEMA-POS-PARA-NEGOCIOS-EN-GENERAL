import bcrypt from "bcryptjs";
import { UserRepository } from "../repositories/UserRepository.js";
import { query } from "../db/database.js";

export class UserService {
  static getAllUsers() {
    return UserRepository.findAll();
  }

  static findByEmail(email: string) {
    return UserRepository.findByEmail(email);
  }

  static findById(id: number | string) {
    return UserRepository.findById(id);
  }

  static createUser(data: any) {
    const { password } = data;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = UserRepository.create({ ...data, password: hashedPassword });
    return { success: true, id };
  }

  static updateUser(id: string | number, data: any) {
    const { password } = data;
    UserRepository.update(id, data);
    
    if (password) {
      UserRepository.updatePassword(id, bcrypt.hashSync(password, 10));
    }

    return { success: true };
  }

  static deleteUser(id: string | number) {
    UserRepository.delete(id);
    return { success: true };
  }
}

export class CustomerService {
  static getAll() {
    return query.all("SELECT * FROM customers ORDER BY first_name ASC");
  }

  static create(data: any) {
    const { first_name, last_name, dni, phone, email, address } = data;
    const info = query.run(
      "INSERT INTO customers (first_name, last_name, dni, phone, email, address) VALUES (?, ?, ?, ?, ?, ?)",
      first_name, last_name, dni, phone, email, address
    );
    return { id: info.lastInsertRowid };
  }
}
