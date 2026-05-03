const db = require('better-sqlite3')('./arena.db');
db.exec(`
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
console.log("Table created successfully");
