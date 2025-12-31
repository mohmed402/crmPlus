import pg from 'pg';
const { Pool } = pg;

// Create a connection pool
// Get connection string from environment variable
// Format: postgresql://user:password@host:port/database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to Supabase PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function to execute queries
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Database query error', { text, error: error.message });
    throw error;
  }
}

// Helper function to get a single row
export async function queryOne(text, params) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

// Helper function to get all rows
export async function queryAll(text, params) {
  const result = await query(text, params);
  return result.rows;
}

// Export pool for advanced usage if needed
export default pool;
