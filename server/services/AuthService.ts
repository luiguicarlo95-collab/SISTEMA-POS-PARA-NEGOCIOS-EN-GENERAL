import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import { query } from "../db/database.js";

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  password?: string;
}

export class AuthService {
  static findById(id: number) {
    const user = query.get("SELECT id, name, email, role FROM users WHERE id = ?", id) as User;
    return user;
  }
}
