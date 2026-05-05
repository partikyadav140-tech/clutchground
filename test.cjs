const db = require("better-sqlite3")("./arena.db");
const userId = 1;

const userTeam = db
  .prepare(
    "SELECT t.name, t.id FROM teams t JOIN team_members tm ON tm.team_id = t.id WHERE tm.user_id = ?",
  )
  .get(userId);
const leaderTeam = db.prepare("SELECT name, id FROM teams WHERE leader_id = ?").get(userId);

const teamName1 = userTeam ? userTeam.name : null;
const teamName2 = leaderTeam ? leaderTeam.name : null;
const teamId1 = userTeam ? userTeam.id : null;
const teamId2 = leaderTeam ? leaderTeam.id : null;

try {
  const matches = db
    .prepare(
      `
    SELECT t.id, t.title as name, t.startsAt as date, t.status as match_status, t.prize, t.format, t.room_id, t.room_pass,
           r.kills, r.position, r.points, 'approved' as reg_status
    FROM registrations r
    JOIN tournaments t ON r.tournament_id = t.id
    WHERE r.user_id = ? OR (r.team_name = ? AND r.team_name IS NOT NULL) OR (r.team_name = ? AND r.team_name IS NOT NULL)
    GROUP BY t.id

    UNION ALL

    SELECT t.id, t.title as name, t.startsAt as date, t.status as match_status, t.prize, t.format, null as room_id, null as room_pass,
           0 as kills, 0 as position, 0 as points, req.status as reg_status
    FROM tournament_requests req
    JOIN tournaments t ON req.tournament_id = t.id
    WHERE req.status = 'pending' AND (req.requested_by = ? OR req.team_id = ? OR req.team_id = ?)
    GROUP BY t.id

    ORDER BY 1 DESC
  `,
    )
    .all(userId, teamName1, teamName2, userId, teamId1, teamId2);
  console.log("Matches query successful, count:", matches.length);
} catch (e) {
  console.error("ERROR:", e.message);
}
