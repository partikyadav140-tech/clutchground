const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_Z2IiLU7CrfqO@ep-morning-shape-a4x9wieu-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" });

async function migrate() {
  try {
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT");
    console.log("Migration complete: added avatar_url to users");
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
migrate();
