import Database from "better-sqlite3";
import { DB_NAME } from "../config.js";

const db = new Database(DB_NAME);
db.pragma('foreign_keys = ON');

// Initialize Database Schema
export const initDb = () => {
  const safeAddColumn = (table: string, column: string, definition: string) => {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    } catch (e) {}
  };

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      prefix TEXT NOT NULL UNIQUE,
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT,
      tax_id TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      country TEXT,
      contact_person TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT,
      dni TEXT UNIQUE,
      phone TEXT,
      email TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      image TEXT,
      description TEXT,
      category_id INTEGER,
      purchase_price REAL,
      sale_price REAL,
      stock INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 5,
      unit TEXT DEFAULT 'unidad',
      brand TEXT,
      supplier_id INTEGER,
      status TEXT DEFAULT 'active',
      has_serials INTEGER DEFAULT 0,
      tipo_stock TEXT DEFAULT 'cantidad',
      parent_id INTEGER,
      units_per_package INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (parent_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS product_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      serial_number TEXT NOT NULL UNIQUE,
      status TEXT DEFAULT 'available',
      sale_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      user_id INTEGER,
      type TEXT DEFAULT 'boleta',
      subtotal REAL,
      total REAL NOT NULL,
      tax REAL DEFAULT 0,
       discount REAL DEFAULT 0,
      payment_method TEXT,
      cash_received REAL DEFAULT 0,
      change_amount REAL DEFAULT 0,
      warranty TEXT,
      session_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER,
      product_id INTEGER,
      quantity INTEGER,
      price REAL,
      subtotal REAL,
      serial_numbers TEXT,
      custom_name TEXT,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      total REAL NOT NULL,
      subtotal REAL,
      tax REAL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS quotation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_id INTEGER,
      product_id INTEGER,
      quantity INTEGER,
      price REAL,
      subtotal REAL,
      FOREIGN KEY (quotation_id) REFERENCES quotations(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS cash_flow (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      category TEXT,
      source_type TEXT,
      source_id INTEGER,
      session_id INTEGER,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS cash_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      opening_balance REAL NOT NULL,
      closing_balance REAL,
      opening_description TEXT,
      closing_description TEXT,
      status TEXT DEFAULT 'open',
      opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Performance Indices
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    CREATE INDEX IF NOT EXISTS idx_product_items_product ON product_items(product_id);
    CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
    CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
    CREATE INDEX IF NOT EXISTS idx_sales_session ON sales(session_id);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
    CREATE INDEX IF NOT EXISTS idx_cash_flow_session ON cash_flow(session_id);
    CREATE INDEX IF NOT EXISTS idx_cash_flow_created_at ON cash_flow(created_at);
    CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON cash_sessions(status);
    CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at);

    -- Security Extension: Permissions & Logs
    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      role TEXT NOT NULL,
      permission_id INTEGER NOT NULL,
      FOREIGN KEY (permission_id) REFERENCES permissions(id),
      PRIMARY KEY (role, permission_id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_id TEXT UNIQUE NOT NULL,
      device_info TEXT,
      ip_address TEXT,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
      revoked INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Insert Default Permissions
    INSERT OR IGNORE INTO permissions (name, description) VALUES 
      ('view_dashboard', 'Ver panel de control'),
      ('manage_inventory', 'Gestionar inventario'),
      ('manage_sales', 'Realizar ventas'),
      ('view_reports', 'Ver reportes detallados'),
      ('manage_users', 'Gestionar usuarios y permisos'),
      ('manage_settings', 'Configurar el sistema'),
      ('view_audit_logs', 'Ver registros de auditoría');

    -- Default Role Permissions
    INSERT OR IGNORE INTO role_permissions (role, permission_id) 
    SELECT 'DESARROLLADOR', id FROM permissions;
    INSERT OR IGNORE INTO role_permissions (role, permission_id) 
    SELECT 'ADMINISTRADOR', id FROM permissions;
    INSERT OR IGNORE INTO role_permissions (role, permission_id)
    SELECT 'ESTANDARD', id FROM permissions WHERE name IN ('view_dashboard', 'manage_sales', 'view_reports');
  `);

  // Migrations / Extensions
  safeAddColumn("users", "mfa_secret", "TEXT");
  safeAddColumn("users", "mfa_enabled", "INTEGER DEFAULT 0");
  safeAddColumn("sale_items", "serial_numbers", "TEXT");
  safeAddColumn("sale_items", "custom_name", "TEXT");
  safeAddColumn("sales", "warranty", "TEXT");
  safeAddColumn("sales", "subtotal", "REAL");
  safeAddColumn("sales", "tax", "REAL DEFAULT 0");
  safeAddColumn("sales", "session_id", "INTEGER");
  safeAddColumn("sales", "payment_method", "TEXT");
  safeAddColumn("sales", "user_id", "INTEGER");
  safeAddColumn("sales", "type", "TEXT DEFAULT 'boleta'");
  safeAddColumn("sales", "discount", "REAL DEFAULT 0");
  safeAddColumn("sales", "cash_received", "REAL DEFAULT 0");
  safeAddColumn("sales", "change_amount", "REAL DEFAULT 0");
  safeAddColumn("cash_flow", "session_id", "INTEGER");
  safeAddColumn("cash_flow", "user_id", "INTEGER");
  safeAddColumn("cash_flow", "category", "TEXT");
  safeAddColumn("quotations", "subtotal", "REAL");
  safeAddColumn("quotations", "tax", "REAL");
  safeAddColumn("customers", "dni", "TEXT UNIQUE");
  safeAddColumn("products", "parent_id", "INTEGER");
  safeAddColumn("products", "units_per_package", "INTEGER DEFAULT 1");
  safeAddColumn("products", "has_serials", "INTEGER DEFAULT 0");
  safeAddColumn("products", "tipo_stock", "TEXT DEFAULT 'cantidad'");
  safeAddColumn("cash_sessions", "balance", "REAL DEFAULT 0");
};

export const query = {
  all: (sql: string, ...params: any[]) => db.prepare(sql).all(...params),
  get: (sql: string, ...params: any[]) => db.prepare(sql).get(...params),
  run: (sql: string, ...params: any[]) => db.prepare(sql).run(...params),
  prepare: (sql: string) => db.prepare(sql),
  transaction: (fn: any) => db.transaction(fn),
};

export default db;
