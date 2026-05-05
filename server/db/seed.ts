import bcrypt from "bcryptjs";
import { query } from "./database.js";

export const seedData = () => {
  // Seed default settings if empty
  const settingsCount = query.get("SELECT COUNT(*) as count FROM settings") as { count: number };
  if (settingsCount.count === 0) {
    const insertSetting = query.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
    insertSetting.run("business_name", "Mi Tienda de Abarrotes");
    insertSetting.run("address", "Calle Principal 123");
    insertSetting.run("phone", "987654321");
    insertSetting.run("email", "contacto@mitienda.com");
    insertSetting.run("currency", "S/");
    insertSetting.run("ticket_message", "¡Gracias por su compra!");
    insertSetting.run("installation_date", "");

    insertSetting.run("theme_mode", "light");
    insertSetting.run("primary_color", "#22c55e");
    insertSetting.run("user_name", "Admin Usuario");
    insertSetting.run("user_role", "Administrador");
    insertSetting.run("user_avatar", "https://picsum.photos/seed/admin/100/100");
    insertSetting.run("ticket_size", "80mm");
    insertSetting.run("ticket_font_family", "monospace");
    insertSetting.run("ticket_font_bold", "0");
    insertSetting.run("ticket_font_italic", "0");
  }

  // Ensure mandatory categories
  query.run("INSERT OR IGNORE INTO categories (id, name, prefix, description) VALUES (0, 'Varios', 'VR', 'Productos no categorizados')");
  query.run("INSERT OR IGNORE INTO products (id, code, name, category_id, sale_price, stock, min_stock, status) VALUES (0, 'GENERIC', 'Producto Varios', 0, 0, 999999, 0, 'active')");

  // Seed initial users
  const adminExists = query.get("SELECT * FROM users WHERE email = ?", 'admin@psg.la') as any;
  if (!adminExists) {
    const adminPassword = bcrypt.hashSync('1475369', 10);
    query.run("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)", 'admin@psg.la', adminPassword, 'PSG Admin', 'DESARROLLADOR');
  } else {
    // Only force role update
    query.run("UPDATE users SET role = 'DESARROLLADOR' WHERE email = ?", 'admin@psg.la');
  }

  // Migration: Hash existing plain-text passwords
  const users = query.all("SELECT * FROM users") as any[];
  for (const user of users) {
    if (user.password && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
      const hashed = bcrypt.hashSync(user.password, 10);
      query.run("UPDATE users SET password = ? WHERE id = ?", hashed, user.id);
    }
  }
};
