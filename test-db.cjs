const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_Z2IiLU7CrfqO@ep-morning-shape-a4x9wieu.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function checkDb() {
  try {
    const res = await pool.query('SELECT COUNT(*) FROM users');
    console.log('Successfully connected to Neon DB! User count:', res.rows[0].count);
  } catch (e) {
    console.error('Failed to connect:', e);
  } finally {
    pool.end();
  }
}

checkDb();
