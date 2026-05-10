const cron = require('node-cron');
const { Pool } = require('pg');

let connString = process.env.DATABASE_URL;
if (!connString || connString.includes('arena.db')) {
  connString = "postgresql://neondb_owner:npg_Z2IiLU7CrfqO@ep-morning-shape-a4x9wieu.us-east-1.aws.neon.tech/neondb?sslmode=require";
}

const pool = new Pool({
  connectionString: connString,
});

// Run every Sunday at 11:59 PM to award 500 points to top team captain
cron.schedule('59 23 * * 0', async () => {
  console.log("Running weekly rewards cron job...");
  const client = await pool.connect();
  try {
    // Top player of the week (we assume the top player is the team captain, or we find their team captain)
    const { rows } = await client.query(`
      SELECT 
        u.id as user_id,
        COALESCE(SUM(r.points), 0) as points
      FROM users u
      JOIN registrations r ON r.user_id = u.id
      WHERE r.created_at >= date_trunc('week', CURRENT_TIMESTAMP)
      GROUP BY u.id
      HAVING COALESCE(SUM(r.points), 0) > 0
      ORDER BY points DESC
      LIMIT 1
    `);

    if (rows.length > 0) {
      const topUserId = rows[0].user_id;

      // Find the team captain. If they are a leader, it's them. If they are a member, find leader.
      let captainId = topUserId;
      const teamRes = await client.query('SELECT leader_id FROM teams WHERE leader_id = $1', [topUserId]);
      if (teamRes.rows.length === 0) {
        const memberRes = await client.query('SELECT t.leader_id FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.user_id = $1', [topUserId]);
        if (memberRes.rows.length > 0) {
          captainId = memberRes.rows[0].leader_id;
        }
      }

      // Add 500 winning coins
      await client.query('UPDATE users SET winning_balance = winning_balance + 500 WHERE id = $1', [captainId]);
      await client.query('INSERT INTO transactions (user_id, amount, type, description) VALUES ($1, 500, $2, $3)', [captainId, 'winnings_added', 'Weekly Leaderboard Top Captain Reward']);
      await client.query('INSERT INTO notifications (user_id, message, redirect_url) VALUES ($1, $2, $3)', [captainId, '🎉 You received 500 Coins for your team topping the Weekly Leaderboard!', '/wallet']);
      console.log(`Awarded 500 points to user ${captainId}`);
    }
  } catch (err) {
    console.error("Cron error:", err);
  } finally {
    client.release();
  }
});

// To reset leaderboard every Monday at 12 am, we don't actually need to clear data 
// if we just change the leaderboard API to filter by the current week!
// But if they explicitly want to clear the 'points' in registrations:
cron.schedule('0 0 * * 1', async () => {
  console.log("Resetting weekly leaderboard data...");
  // Alternatively, if we just want the UI to naturally reset, the API change handles it.
  // If we really need to wipe stats:
  // await pool.query("UPDATE registrations SET points = 0, kills = 0, position = 0");
});

console.log("Cron jobs started! Weekly leaderboard reset and rewards are active.");
