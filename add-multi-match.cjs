/**
 * Migration: Add multi-match tournament support
 * - Adds total_matches column to tournaments table
 * - Creates match_results table for per-match breakdowns
 */
const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres.mvkvdxphxzvviaunqmlb:partikbahi09@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  try {
    console.log("🔄 Running multi-match migration...");

    // 1. Add total_matches column to tournaments
    await pool.query(`
      ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS total_matches INTEGER DEFAULT 1;
    `);
    console.log("✅ Added total_matches column to tournaments");

    // 2. Create match_results table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS match_results (
        id SERIAL PRIMARY KEY,
        tournament_id INTEGER NOT NULL,
        registration_id INTEGER NOT NULL,
        match_number INTEGER NOT NULL,
        kills INTEGER DEFAULT 0,
        position INTEGER DEFAULT 0,
        points INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
        FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
        UNIQUE(tournament_id, registration_id, match_number)
      );
    `);
    console.log("✅ Created match_results table");

    console.log("🎉 Multi-match migration completed successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

migrate();
