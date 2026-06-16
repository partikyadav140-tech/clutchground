// add-tournament-code.cjs
// Run: node add-tournament-code.cjs
// Adds tournament_code column and backfills existing tournaments

const { Pool } = require("pg");

const SUPABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres.mvkvdxphxzvviaunqmlb:partikbahi09@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I,O,0,1 to avoid confusion
  let code = "CG-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function main() {
  console.log("🚀 Adding tournament_code column...");
  const pool = new Pool({ connectionString: SUPABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    // Add column
    await pool.query(
      "ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS tournament_code TEXT UNIQUE",
    );
    console.log("✓ tournament_code column added");

    // Backfill existing tournaments that don't have a code
    const { rows } = await pool.query("SELECT id FROM tournaments WHERE tournament_code IS NULL");
    console.log(`📦 Backfilling ${rows.length} tournaments...`);

    for (const row of rows) {
      let code;
      let attempts = 0;
      while (attempts < 10) {
        code = generateCode();
        try {
          await pool.query("UPDATE tournaments SET tournament_code = $1 WHERE id = $2", [
            code,
            row.id,
          ]);
          break;
        } catch (e) {
          attempts++;
          if (attempts >= 10) throw new Error("Failed to generate unique code after 10 attempts");
        }
      }
      console.log(`  Tournament #${row.id} → ${code}`);
    }

    console.log("✅ Migration complete!");
  } catch (e) {
    console.error("❌ Error:", e.message);
  } finally {
    await pool.end();
  }
}

main();
