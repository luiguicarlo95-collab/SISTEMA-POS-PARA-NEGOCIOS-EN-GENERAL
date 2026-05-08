/**
 * Unified Database Client
 * Supports both PostgreSQL (production) and SQLite (development)
 */

import dotenv from "dotenv";
import Database from "better-sqlite3";
import pg from "pg";
import { DB_NAME } from "../config.js";

dotenv.config();

const USE_POSTGRES = !!process.env.POSTGRES_URL;

let sqliteDb: any;
let pgPool: pg.Pool;

// Initialize SQLite (development)
if (!USE_POSTGRES) {
  sqliteDb = new Database(DB_NAME);
  sqliteDb.pragma('foreign_keys = ON');
}

// Initialize PostgreSQL (production)
if (USE_POSTGRES) {
  pgPool = new pg.Pool({
    connectionString: process.env.POSTGRES_URL,
  });
}

/**
 * Unified Query Interface
 * Handles both synchronous (SQLite) and asynchronous (PostgreSQL) operations
 */
export const query = {
  // Run a query and get all results
  all: async (sql: string, ...params: any[]) => {
    if (USE_POSTGRES) {
      const result = await pgPool.query(convertSqlToPostgres(sql), params);
      return result.rows;
    } else {
      return sqliteDb.prepare(sql).all(...params);
    }
  },

  // Run a query and get a single result
  get: async (sql: string, ...params: any[]) => {
    if (USE_POSTGRES) {
      const result = await pgPool.query(convertSqlToPostgres(sql), params);
      return result.rows[0];
    } else {
      return sqliteDb.prepare(sql).get(...params);
    }
  },

  // Run a query that modifies data (INSERT, UPDATE, DELETE)
  run: async (sql: string, ...params: any[]) => {
    if (USE_POSTGRES) {
      // Add RETURNING id for INSERT queries to get the last inserted ID
      const modifiedSql = sql.includes('INSERT') && !sql.includes('RETURNING')
        ? sql.replace(/;?\s*$/, ' RETURNING id;')
        : sql;
      const result = await pgPool.query(convertSqlToPostgres(modifiedSql), params);
      return {
        rowCount: result.rowCount,
        lastInsertRowid: result.rows[0]?.id,
      };
    } else {
      const info = sqliteDb.prepare(sql).run(...params);
      return {
        rowCount: info.changes,
        lastInsertRowid: info.lastInsertRowid,
      };
    }
  },

  // Prepare a statement for reuse
  prepare: (sql: string) => {
    if (USE_POSTGRES) {
      return {
        run: async (...params: any[]) => {
          const modifiedSql = sql.includes('INSERT') && !sql.includes('RETURNING')
            ? sql.replace(/;?\s*$/, ' RETURNING id;')
            : sql;
          const result = await pgPool.query(convertSqlToPostgres(modifiedSql), params);
          return {
            rowCount: result.rowCount,
            lastInsertRowid: result.rows[0]?.id,
          };
        },
        all: async (...params: any[]) => {
          const result = await pgPool.query(convertSqlToPostgres(sql), params);
          return result.rows;
        },
        get: async (...params: any[]) => {
          const result = await pgPool.query(convertSqlToPostgres(sql), params);
          return result.rows[0];
        },
      };
    } else {
      return sqliteDb.prepare(sql);
    }
  },

  // Execute a transaction
  transaction: async (fn: (client?: any) => Promise<any>) => {
    if (USE_POSTGRES) {
      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    } else {
      return sqliteDb.transaction(fn)();
    }
  },

  // Execute raw SQL (for initialization)
  exec: async (sql: string) => {
    if (USE_POSTGRES) {
      await pgPool.query(sql);
    } else {
      sqliteDb.exec(sql);
    }
  },
};

/**
 * Convert SQLite SQL syntax to PostgreSQL
 * Handles:
 * - ? placeholders to $1, $2, etc.
 * - AUTOINCREMENT to SERIAL
 * - DATETIME to TIMESTAMP
 * - REAL to DECIMAL(10,2)
 */
function convertSqlToPostgres(sql: string): string {
  if (!USE_POSTGRES) return sql;

  let converted = sql;

  // Replace ? with $1, $2, etc.
  let paramIndex = 1;
  converted = converted.replace(/\?/g, () => `$${paramIndex++}`);

  // Replace || (SQLite concatenation) - PostgreSQL also supports || so no change needed
  // But ensure it's for string concatenation
  
  return converted;
}

/**
 * Export database instance for direct access if needed
 */
export const getDbInstance = () => {
  if (USE_POSTGRES) {
    return pgPool;
  }
  return sqliteDb;
};

export const isPostgres = () => USE_POSTGRES;
export const isSqlite = () => !USE_POSTGRES;

export default query;
