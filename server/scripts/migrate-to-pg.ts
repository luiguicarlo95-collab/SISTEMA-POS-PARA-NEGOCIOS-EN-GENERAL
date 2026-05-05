import Database from "better-sqlite3";
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const sqlite = new Database(process.env.DB_NAME || 'database.sqlite');
const pgClient = new pg.Client({
  connectionString: process.env.POSTGRES_URL,
});

async function migrate() {
  console.log("Iniciando migración de SQLite a PostgreSQL...");
  
  try {
    await pgClient.connect();
    
    const tables = [
      'categories', 'suppliers', 'customers', 'products', 
      'product_items', 'cash_sessions', 'sales', 'sale_items', 
      'settings', 'quotations', 'quotation_items', 'cash_flow', 
      'permissions', 'role_permissions', 'audit_logs', 'user_sessions',
      'users'
    ];

    for (const table of tables) {
      console.log(`Migrando tabla: ${table}...`);
      const rows = sqlite.prepare(`SELECT * FROM ${table}`).all();
      
      if (rows.length === 0) {
        console.log(`Tabla ${table} vacía, saltando.`);
        continue;
      }

      const columns = Object.keys(rows[0] as object);
      const rowData = rows.map((row: any) => columns.map(col => row[col]));

      // Clear existing data (optional, be careful)
      // await pgClient.query(`TRUNCATE TABLE ${table} CASCADE`);

      for (const values of rowData) {
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
        await pgClient.query(sql, values);
      }
      
      console.log(`Migrados ${rows.length} registros de ${table}.`);
    }

    console.log("Migración completada con éxito.");
  } catch (err) {
    console.error("Error durante la migración:", err);
  } finally {
    await pgClient.end();
    sqlite.close();
  }
}

migrate();
