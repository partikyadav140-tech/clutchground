"use server";
import { Pool } from "pg";
import { getEnvVar } from "./env";

// Supabase PostgreSQL connection (Transaction Pooler)
const connString = getEnvVar("DATABASE_URL") ||
  "postgresql://postgres.mvkvdxphxzvviaunqmlb:partikbahi09@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";

if (!connString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({
  connectionString: connString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// PostgreSQL lowercases unquoted column names.
// Remap any columns that were originally camelCase back to camelCase.
const COL_REMAP: Record<string, string> = {
  startsat: "startsAt",
};

function remapRow(row: any): any {
  if (!row || typeof row !== "object") return row;
  const out: any = {};
  for (const [k, v] of Object.entries(row)) {
    out[COL_REMAP[k] ?? k] = v;
  }
  return out;
}

export const db = {
  pool,
  query: async (text: string, params: any[] = [], client: any = pool) => {
    let pgText = text;
    let i = 1;
    while (pgText.includes("?")) {
      pgText = pgText.replace("?", "$" + i++);
    }
    const result = await client.query(pgText, params);
    result.rows = result.rows.map(remapRow);
    return result;
  },

  transaction: async (callback: (txDb: any) => Promise<any>) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const txDb = {
        query: (text: string, params?: any[]) => db.query(text, params, client),
        prepare: (text: string) => ({
          get: async (...args: any[]) => {
            const { rows } = await txDb.query(text, args);
            return rows[0] || null;
          },
          all: async (...args: any[]) => {
            const { rows } = await txDb.query(text, args);
            return rows;
          },
          run: async (...args: any[]) => {
            let modText = text;
            if (
              text.trim().toUpperCase().startsWith("INSERT") &&
              !text.toUpperCase().includes("RETURNING")
            ) {
              modText = text + " RETURNING id";
            }
            const result = await txDb.query(modText, args);
            return { lastInsertRowid: result.rows[0]?.id, changes: result.rowCount || 0, rowCount: result.rowCount || 0 };
          },
        }),
      };
      const result = await callback(txDb);
      await client.query("COMMIT");
      return result;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  },
  prepare: (text: string) => {
    return {
      get: async (...args: any[]) => {
        const { rows } = await db.query(text, args);
        return rows[0] || null;
      },
      all: async (...args: any[]) => {
        const { rows } = await db.query(text, args);
        return rows;
      },
      run: async (...args: any[]) => {
        let modText = text;
        if (
          text.trim().toUpperCase().startsWith("INSERT") &&
          !text.toUpperCase().includes("RETURNING")
        ) {
          modText = text + " RETURNING id";
        }
        const result = await db.query(modText, args);
        return { lastInsertRowid: result.rows[0]?.id, changes: result.rowCount || 0, rowCount: result.rowCount || 0 };
      },
    };
  },
};

async function initDb() {
  try {
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
        avatar_url TEXT
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
        startsAt TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        banner TEXT NOT NULL DEFAULT 'from-orange-600 to-red-700',
        room_id TEXT,
        room_pass TEXT,
        is_hero BOOLEAN DEFAULT false,
        hosted_by TEXT,
        per_kill_coin INTEGER DEFAULT 0,
        first_place_coin INTEGER DEFAULT 0,
        results_announced BOOLEAN DEFAULT false,
        tournament_type TEXT DEFAULT 'battle_royale',
        entry_fee INTEGER DEFAULT 0,
        prize_pool INTEGER DEFAULT 0,
        open_slots INTEGER DEFAULT 2
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
        receiver_id INTEGER, -- NULL if team chat
        team_id INTEGER, -- NULL if direct message
        message TEXT NOT NULL,
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

      CREATE TABLE IF NOT EXISTS spin_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        segment_id TEXT NOT NULL,
        prize_amount INTEGER NOT NULL DEFAULT 0,
        prize_label TEXT NOT NULL DEFAULT '',
        spun_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Ensure columns exist (for SQLite/Postgres compatibility we use separate ALTER statements if needed, but in Postgres ADD COLUMN IF NOT EXISTS works)
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ign TEXT;`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS uid TEXT;`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS deposit_balance INTEGER DEFAULT 0;`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS winning_balance INTEGER DEFAULT 0;`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT false;`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS upi_id TEXT;`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS security_question TEXT;`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS security_answer TEXT;`);
      
      // Ticket system migrations
      await pool.query(`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';`);
      await pool.query(`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
      await pool.query(`ALTER TABLE ticket_replies ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;`);
      await pool.query(`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;`);

      // Tournaments results status migration
      await pool.query(`ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS results_announced BOOLEAN DEFAULT false;`);

      // Team requests initiated_by migration
      await pool.query(`ALTER TABLE team_requests ADD COLUMN IF NOT EXISTS initiated_by TEXT DEFAULT 'player';`);

      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS spin_credits INTEGER DEFAULT 0;`);
      await pool.query(`ALTER TABLE spin_history ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url TEXT;`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_preset TEXT DEFAULT 'default';`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_animation TEXT DEFAULT 'none';`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_frame TEXT DEFAULT 'none';`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS owned_cosmetics TEXT DEFAULT '[]';`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS showcase_achievements TEXT DEFAULT '[]';`);
    } catch (e) {
      console.log("Column addition skipped or failed:", e);
    }

    // Seed Admin
    try {
      // First delete any existing admin account
      await pool.query(`DELETE FROM users WHERE username = 'admin'`);

      // Then create new admin account
      await pool.query(`
        INSERT INTO users (username, password, role, phone)
        VALUES ('admin', 'admin123', 'admin', '8307224756')
      `);
    } catch (e) {
      console.error("Admin seeding error:", e);
    }
  } catch (e) {
    console.error("DB Init error:", e);
  }
}

initDb();
