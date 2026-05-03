"use server";
import Database from 'better-sqlite3';
import path from 'path';

let db: any;
try {
  const dbPath = process.env.DATABASE_URL || path.resolve(process.cwd(), 'arena.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
} catch (e) {
  console.error("FAILED TO INIT DB", e);
  db = { prepare: () => ({ run: () => {}, get: () => null, all: () => [] }), exec: () => {}, transaction: () => () => {} };
}

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    banner TEXT NOT NULL DEFAULT 'from-orange-600 to-red-700'
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    tournament_id INTEGER NOT NULL,
    team_name TEXT,
    players_json TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
  );

  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    leader_id INTEGER NOT NULL,
    logo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (leader_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS team_members (
    team_id INTEGER NOT NULL,
    user_id INTEGER,
    ign TEXT NOT NULL,
    uid TEXT NOT NULL,
    role TEXT DEFAULT 'player',
    FOREIGN KEY (team_id) REFERENCES teams(id)
  );

  CREATE TABLE IF NOT EXISTS team_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    ign TEXT NOT NULL,
    uid TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    action_type TEXT,
    action_data TEXT,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tournament_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    tournament_id INTEGER NOT NULL,
    requested_by INTEGER NOT NULL,
    team_name TEXT NOT NULL,
    players_json TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

try {
  db.exec("ALTER TABLE tournaments ADD COLUMN room_id TEXT");
} catch (e) {
  // column might already exist
}

try {
  db.exec("ALTER TABLE tournaments ADD COLUMN room_pass TEXT");
} catch (e) {
  // column might already exist
}

try {
  db.exec("ALTER TABLE registrations ADD COLUMN kills INTEGER DEFAULT 0");
  db.exec("ALTER TABLE registrations ADD COLUMN position INTEGER DEFAULT 0");
  db.exec("ALTER TABLE registrations ADD COLUMN points INTEGER DEFAULT 0");
} catch (e) {}

try {
  db.exec("ALTER TABLE notifications ADD COLUMN action_type TEXT");
  db.exec("ALTER TABLE notifications ADD COLUMN action_data TEXT");
} catch(e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN deposit_balance INTEGER DEFAULT 0");
  db.exec("ALTER TABLE users ADD COLUMN winning_balance INTEGER DEFAULT 0");
} catch(e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN ign TEXT");
  db.exec("ALTER TABLE users ADD COLUMN uid TEXT");
  db.exec("ALTER TABLE users ADD COLUMN email TEXT");
  db.exec("ALTER TABLE users ADD COLUMN phone TEXT");
} catch(e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS withdrawals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    upi_id TEXT NOT NULL,
    upi_number TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Seed Admin User
try {
  const insertAdmin = db.prepare(`
    INSERT INTO users (username, password, role) 
    VALUES ('admin', 'admin123', 'admin')
  `);
  insertAdmin.run();
} catch (e) {
  // admin already exists (UNIQUE constraint failed)
}

// Seed initial tournaments if empty
const countStmt = db.prepare('SELECT COUNT(*) as count FROM tournaments');
const { count } = countStmt.get() as { count: number };

if (count === 0) {
  const insertTournament = db.prepare(`
    INSERT INTO tournaments (title, game, mode, format, entry, prize, slots, filled, startsAt, status, banner)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialTournaments = [
    ["GOD CHAMPIONS CUP", "Free Fire", "Squad", "Battle Royale", 100, 50000, 48, 41, "Today 9:00 PM", "open", "from-orange-600 to-red-700"],
    ["RAGE ROYALE #14", "Free Fire MAX", "Solo", "Battle Royale", 0, 5000, 50, 50, "Live now", "live", "from-red-700 to-yellow-600"],
    ["CLASH KINGS LEAGUE", "Clash Squad", "Squad", "League", 200, 100000, 16, 9, "Sat 8:00 PM", "upcoming", "from-amber-600 to-orange-700"],
    ["MIDNIGHT SHOWDOWN", "Free Fire", "Duo", "Knockout", 50, 15000, 32, 22, "Tonight 11 PM", "open", "from-rose-700 to-orange-600"],
    ["ROOKIE FIRE NIGHT", "Free Fire", "Solo", "Battle Royale", 0, 2000, 60, 14, "Tomorrow 7 PM", "open", "from-orange-500 to-red-600"],
    ["GOD INVITATIONAL", "Free Fire MAX", "Squad", "League", 500, 250000, 12, 12, "Next Sunday", "upcoming", "from-yellow-600 via-orange-700 to-red-800"],
  ];

  const insertMany = db.transaction((tourneys: any[]) => {
    for (const t of tourneys) insertTournament.run(...t);
  });

  insertMany(initialTournaments);
}

export { db };
