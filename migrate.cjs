const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_Z2IiLU7CrfqO@ep-morning-shape-a4x9wieu-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" });

async function migrate() {
  try {
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT");
    await pool.query("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open'");
    await pool.query("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    await pool.query("ALTER TABLE ticket_replies ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false");
    console.log("Migration complete: added missing columns for tickets and users");
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
migrate();
