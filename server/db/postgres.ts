import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

export const pgQuery = {
  all: async (sql: string, params: any[] = []) => {
    const res = await pool.query(sql, params);
    return res.rows;
  },
  get: async (sql: string, params: any[] = []) => {
    const res = await pool.query(sql, params);
    return res.rows[0];
  },
  run: async (sql: string, params: any[] = []) => {
    const res = await pool.query(sql, params);
    return {
      rowCount: res.rowCount,
      lastInsertRowid: res.rows[0]?.id // Postgres needs RETURNING id to get last ID
    };
  },
  transaction: async (fn: (client: pg.PoolClient) => Promise<any>) => {
    const client = await pool.connect();
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
  }
};

export default pool;
