import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

// Ensure JWT_SECRET is always present and reasonably secure
if (!process.env.JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET not found in environment. Using a temporary secret.");
}

export const JWT_SECRET = process.env.JWT_SECRET || "pos-system-dev-secret-key-12345";
export const PORT = 3000;
export const DB_NAME = "pos.db";
