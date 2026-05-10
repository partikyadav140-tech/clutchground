const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_Z2IiLU7CrfqO@ep-morning-shape-a4x9wieu-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

async function run() {
  try {
    const res = await pool.query("SELECT id, title, is_hero FROM tournaments LIMIT 5");
    console.log("Database connected successfully!");
    console.log("Tournaments:", res.rows);
  } catch (e) {
    console.error("Database connection failed:", e.message);
  } finally {
    pool.end();
  }
}

run();
