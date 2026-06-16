const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres.mvkvdxphxzvviaunqmlb:partikbahi09@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  try {
    console.log("Starting migration...");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT");
    console.log("✓ avatar_url added");

    await pool.query("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open'");
    console.log("✓ ticket status added");

    await pool.query(
      "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    );
    console.log("✓ ticket updated_at added");

    await pool.query(
      "ALTER TABLE ticket_replies ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false",
    );
    console.log("✓ ticket_replies is_admin added");

    await pool.query(
      "ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS tournament_type TEXT DEFAULT 'battle_royale'",
    );
    console.log("✓ tournaments tournament_type added");

    await pool.query(
      "ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS entry_fee INTEGER DEFAULT 0",
    );
    console.log("✓ tournaments entry_fee added");

    await pool.query(
      "ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS prize_pool INTEGER DEFAULT 0",
    );
    console.log("✓ tournaments prize_pool added");

    await pool.query(
      "ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS open_slots INTEGER DEFAULT 0",
    );
    console.log("✓ tournaments open_slots added");

    console.log("✅ Migration complete!");
  } catch (e) {
    console.error("❌ Migration failed:", e.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}
migrate();
