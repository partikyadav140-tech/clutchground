// fix-column.cjs
const { Pool } = require("pg");
const pool = new Pool({
  connectionString:
    "postgresql://postgres.mvkvdxphxzvviaunqmlb:partikbahi09@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false },
});

async function main() {
  try {
    // Rename "startsAt" (case-sensitive) to startsat (lowercase, unquoted)
    await pool.query(`ALTER TABLE tournaments RENAME COLUMN "startsAt" TO startsat`);
    console.log("✅ Renamed startsAt → startsat");
  } catch (e) {
    if (e.message.includes("does not exist")) {
      console.log("ℹ️ Column already renamed or is lowercase, checking...");
    } else {
      console.error("❌ Error:", e.message);
    }
  }

  // Verify
  const { rows } = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name='tournaments' ORDER BY column_name`,
  );
  console.log("📋 Columns now:", rows.map((r) => r.column_name).join(", "));
  await pool.end();
}

main();
