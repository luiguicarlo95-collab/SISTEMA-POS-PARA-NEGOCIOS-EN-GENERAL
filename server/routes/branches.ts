import express from "express";
import { asyncHandler, verifyToken } from "../middleware/auth.js";
import { query } from "../db/database.js";

const router = express.Router();

router.get("/", verifyToken, asyncHandler(async (req, res) => {
  const branches = query.all("SELECT * FROM branches ORDER BY is_main DESC, name ASC");
  res.json(branches);
}));

router.post("/", verifyToken, asyncHandler(async (req, res) => {
  const { name, address, phone, email, is_main } = req.body;
  
  if (is_main) {
    query.run("UPDATE branches SET is_main = 0");
  }

  const result = query.run(
    "INSERT INTO branches (name, address, phone, email, is_main) VALUES (?, ?, ?, ?, ?)",
    name, address, phone, email, is_main ? 1 : 0
  );
  res.json({ id: result.lastInsertRowid });
}));

router.put("/:id", verifyToken, asyncHandler(async (req, res) => {
  const { name, address, phone, email, is_main, status } = req.body;
  
  if (is_main) {
    query.run("UPDATE branches SET is_main = 0");
  }

  query.run(
    "UPDATE branches SET name = ?, address = ?, phone = ?, email = ?, is_main = ?, status = ? WHERE id = ?",
    name, address, phone, email, is_main ? 1 : 0, status, req.params.id
  );
  res.json({ success: true });
}));

router.delete("/:id", verifyToken, asyncHandler(async (req, res) => {
  query.run("DELETE FROM branches WHERE id = ?", req.params.id);
  res.json({ success: true });
}));

export default router;
