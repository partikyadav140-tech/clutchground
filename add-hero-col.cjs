const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_Z2IiLU7CrfqO@ep-morning-shape-a4x9wieu.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function run() {
  try {
    await pool.query('ALTER TABLE tournaments ADD COLUMN is_hero BOOLEAN DEFAULT false');
    console.log('Column is_hero added!');
  } catch (e) {
    if (e.code === '42701') {
      console.log('Column already exists!');
    } else {
      console.error(e);
    }
  } finally {
    pool.end();
  }
}

run();
