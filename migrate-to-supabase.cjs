// migrate-to-supabase.cjs
// Run: node migrate-to-supabase.cjs
// This creates all tables in your Supabase database

const { Pool } = require("pg");

const SUPABASE_URL = "postgresql://postgres.mvkvdxphxzvviaunqmlb:partikbahi09@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";

async function main() {
  console.log("🚀 Connecting to Supabase...");
  const pool = new Pool({ connectionString: SUPABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    // Create all tables
    console.log("📦 Creating tables...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deposit_balance INTEGER DEFAULT 0,
        winning_balance INTEGER DEFAULT 0,
        ign TEXT,
        uid TEXT,
        email TEXT,
        phone TEXT,
        banned BOOLEAN DEFAULT false,
        avatar_url TEXT,
        upi_id TEXT,
        security_question TEXT,
        security_answer TEXT
      );

      CREATE TABLE IF NOT EXISTS tournaments (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        game TEXT NOT NULL,
        mode TEXT NOT NULL,
        format TEXT NOT NULL,
        entry INTEGER NOT NULL DEFAULT 0,
        prize INTEGER NOT NULL DEFAULT 0,
        slots INTEGER NOT NULL DEFAULT 0,
        filled INTEGER NOT NULL DEFAULT 0,
        "startsAt" TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        banner TEXT NOT NULL DEFAULT 'from-orange-600 to-red-700',
        room_id TEXT,
        room_pass TEXT,
        is_hero BOOLEAN DEFAULT false,
        hosted_by TEXT,
        per_kill_coin INTEGER DEFAULT 0,
        first_place_coin INTEGER DEFAULT 0,
        results_announced BOOLEAN DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        leader_id INTEGER NOT NULL,
        logo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        tournament_id INTEGER NOT NULL,
        team_name TEXT,
        players_json TEXT NOT NULL,
        contact_email TEXT,
        contact_phone TEXT,
        kills INTEGER DEFAULT 0,
        position INTEGER DEFAULT 0,
        points INTEGER DEFAULT 0,
        awarded_prize INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL,
        user_id INTEGER,
        ign TEXT NOT NULL,
        uid TEXT NOT NULL,
        role TEXT DEFAULT 'player',
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS team_requests (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        ign TEXT NOT NULL,
        uid TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        action_type TEXT,
        action_data TEXT,
        redirect_url TEXT,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tournament_requests (
        id SERIAL PRIMARY KEY,
        team_id INTEGER,
        tournament_id INTEGER NOT NULL,
        requested_by INTEGER NOT NULL,
        team_name TEXT,
        players_json TEXT NOT NULL,
        contact_email TEXT,
        contact_phone TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS withdrawals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        upi_id TEXT NOT NULL,
        upi_number TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS razorpay_orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        order_id TEXT UNIQUE NOT NULL,
        amount INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        paid_at TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS upi_deposits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        txn_ref TEXT UNIQUE NOT NULL,
        utr TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        description TEXT,
        reject_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        submitted_at TIMESTAMP,
        approved_at TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS ticket_replies (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS friendships (
        id SERIAL PRIMARY KEY,
        user_id1 INTEGER NOT NULL,
        user_id2 INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id1) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id2) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id1, user_id2)
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER,
        team_id INTEGER,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        endpoint TEXT UNIQUE NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    console.log("✅ All tables created!");

    // Seed admin user
    console.log("👤 Seeding admin user...");
    await pool.query(`DELETE FROM users WHERE username = 'admin'`);
    await pool.query(`
      INSERT INTO users (username, password, role, phone)
      VALUES ('admin', 'admin123', 'admin', '8307224756')
    `);
    console.log("✅ Admin user created! (username: admin, password: admin123)");

    // Verify tables
    const { rows } = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    console.log("\n📋 Tables in Supabase:");
    rows.forEach(r => console.log("  -", r.table_name));

    console.log("\n🎉 Migration complete! Your site is now fully on Supabase.");
  } catch (e) {
    console.error("❌ Migration error:", e.message);
  } finally {
    await pool.end();
  }
}

main();
