"use server";
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Z2IiLU7CrfqO@ep-morning-shape-a4x9wieu.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

// We create a wrapper to make the transition easier
export const db = {
  pool,
  query: async (text: string, params: any[] = [], client: any = pool) => {
    let pgText = text;
    let i = 1;
    while(pgText.includes('?')) {
      pgText = pgText.replace('?', '$' + i++);
    }
    return client.query(pgText, params);
  },
  transaction: async (callback: (txDb: any) => Promise<any>) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const txDb = {
        query: (text: string, params?: any[]) => db.query(text, params, client),
        prepare: (text: string) => ({
          get: async (...args: any[]) => { const { rows } = await txDb.query(text, args); return rows[0] || null; },
          all: async (...args: any[]) => { const { rows } = await txDb.query(text, args); return rows; },
          run: async (...args: any[]) => { 
             let modText = text;
             if (text.trim().toUpperCase().startsWith('INSERT') && !text.toUpperCase().includes('RETURNING')) {
               modText = text + ' RETURNING id';
             }
             const { rows } = await txDb.query(modText, args);
             return { lastInsertRowid: rows[0]?.id };
          }
        })
      };
      const result = await callback(txDb);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
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
        if (text.trim().toUpperCase().startsWith('INSERT') && !text.toUpperCase().includes('RETURNING')) {
          modText = text + ' RETURNING id';
        }
        const { rows } = await db.query(modText, args);
        return { lastInsertRowid: rows[0]?.id };
      }
    }
  }
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
        phone TEXT
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
        is_hero BOOLEAN DEFAULT false
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS team_members (
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
    `);

    // Seed Admin
    try {
      await pool.query(`
        INSERT INTO users (username, password, role) 
        VALUES ('admin', 'admin123', 'admin')
        ON CONFLICT (username) DO NOTHING
      `);
    } catch(e) {}

    // Seed tournaments
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM tournaments');
    if (parseInt(rows[0].count) === 0) {
      const initialTournaments = [
        ["GOD CHAMPIONS CUP", "Free Fire", "Squad", "Battle Royale", 100, 50000, 48, 41, "Today 9:00 PM", "open", "from-orange-600 to-red-700"],
        ["RAGE ROYALE #14", "Free Fire MAX", "Solo", "Battle Royale", 0, 5000, 50, 50, "Live now", "live", "from-red-700 to-yellow-600"],
        ["CLASH KINGS LEAGUE", "Clash Squad", "Squad", "League", 200, 100000, 16, 9, "Sat 8:00 PM", "upcoming", "from-amber-600 to-orange-700"],
        ["MIDNIGHT SHOWDOWN", "Free Fire", "Duo", "Knockout", 50, 15000, 32, 22, "Tonight 11 PM", "open", "from-rose-700 to-orange-600"],
        ["ROOKIE FIRE NIGHT", "Free Fire", "Solo", "Battle Royale", 0, 2000, 60, 14, "Tomorrow 7 PM", "open", "from-orange-500 to-red-600"],
        ["GOD INVITATIONAL", "Free Fire MAX", "Squad", "League", 500, 250000, 12, 12, "Next Sunday", "upcoming", "from-yellow-600 via-orange-700 to-red-800"],
      ];

      for (const t of initialTournaments) {
        await pool.query(`
          INSERT INTO tournaments (title, game, mode, format, entry, prize, slots, filled, startsAt, status, banner)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, t);
      }
    }
  } catch (e) {
    console.error("DB Init error:", e);
  }
}

initDb();
