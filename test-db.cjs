const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_Z2IiLU7CrfqO@ep-morning-shape-a4x9wieu.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function run() {
  try {
    const res = await pool.query('SELECT id, title, is_hero FROM tournaments');
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

run();
