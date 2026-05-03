const Database = require('better-sqlite3');
const db = new Database('./arena.db');

try {
  db.prepare('SELECT user_id FROM team_requests WHERE team_id = ? AND uid = ? AND status = "approved" ORDER BY created_at DESC LIMIT 1').get(1, '123');
  console.log('QUERY SUCCESS');
} catch(e) {
  console.log('QUERY ERROR:', e.message);
}
