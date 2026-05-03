"use server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const loginUser = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const { username, password } = data as unknown as { username: string; password: string };
    const userStmt = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?');
    const user = await userStmt.get(username, password) as any;
    
    if (!user) {
      throw new Error("Invalid username or password");
    }

    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(); // 7 days

    await db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(sessionId, user.id, expiresAt);

    return { sessionId, user: { id: user.id, username: user.username, role: user.role } };
  });

export const signupUser = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const { username, password, ign, uid, email, phone } = data as any;

    const checkStmt = db.prepare('SELECT id FROM users WHERE username = ?');
    const exists = await checkStmt.get(username);
    if (exists) {
      throw new Error("Username already taken");
    }

    const insertStmt = db.prepare('INSERT INTO users (username, password, ign, uid, email, phone) VALUES (?, ?, ?, ?, ?, ?)');
    const result = await insertStmt.run(username, password, ign || null, uid || null, email || null, phone || null);
    const userId = result.lastInsertRowid;

    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

    await db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(sessionId, userId, expiresAt);

    return { sessionId, user: { id: userId, username, role: 'user' } };
  });

export const getUserFromSession = createServerFn({ method: "GET" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const sessionId = data as unknown as string;
    if (!sessionId) return null;
    
    const stmt = db.prepare(`
      SELECT users.id, users.username, users.role, users.deposit_balance, users.winning_balance 
      FROM sessions 
      JOIN users ON sessions.user_id = users.id 
      WHERE sessions.id = ? AND sessions.expires_at > ?
    `);
    const user = await stmt.get(sessionId, new Date().toISOString()) as any;
    return user || null;
  });

export const logoutUser = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const sessionId = data as unknown as string;
    if (sessionId) {
      await db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    }
    return { success: true };
  });

export const getUsers = createServerFn({ method: "GET" })
  .handler(async () => {
    const { db } = await import("./lib/db");
    return await db.prepare('SELECT id, username, password, role, created_at, deposit_balance, winning_balance FROM users').all();
  });

export const getTournaments = createServerFn({ method: "GET" })
  .handler(async () => {
    const { db } = await import("./lib/db");
    return await db.prepare('SELECT * FROM tournaments').all();
  });

export const addTournament = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const { title, game, mode, format, entry, prize, slots, filled, startsAt, status, banner, room_id, room_pass } = data as unknown as any;
    const stmt = db.prepare(`
      INSERT INTO tournaments (title, game, mode, format, entry, prize, slots, filled, startsAt, status, banner, room_id, room_pass)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    await stmt.run(title, game, mode, format, entry, prize, slots, filled, startsAt, status, banner, room_id || null, room_pass || null);
    return { success: true };
  });

export const updateTournament = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const { id, title, game, mode, format, entry, prize, slots, filled, startsAt, status, banner, room_id, room_pass } = data as unknown as any;
    
    const old = await db.prepare('SELECT room_id, room_pass FROM tournaments WHERE id = ?').get(id) as any;

    const stmt = db.prepare(`
      UPDATE tournaments 
      SET title=?, game=?, mode=?, format=?, entry=?, prize=?, slots=?, filled=?, startsAt=?, status=?, banner=?, room_id=?, room_pass=?
      WHERE id=?
    `);
    await stmt.run(title, game, mode, format, entry, prize, slots, filled, startsAt, status, banner, room_id || null, room_pass || null, id);

    if ((room_id && room_id !== old?.room_id) || (room_pass && room_pass !== old?.room_pass)) {
      const registrations = await db.prepare('SELECT user_id FROM registrations WHERE tournament_id = ?').all(id) as any[];
      const insertNotif = db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)');
      const notifMsg = `🔑 Room details for ${title} updated! ` + 
        (room_id ? `ID: ${room_id} ` : '') + 
        (room_pass ? `Pass: ${room_pass}` : '');
      for (const r of registrations) {
        await insertNotif.run(r.user_id, notifMsg.trim());
      }
    }

    return { success: true };
  });

export const deleteTournament = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const id = data as unknown as number;
    await db.transaction(async (tx) => {
      await tx.prepare('DELETE FROM registrations WHERE tournament_id = ?').run(id);
      await tx.prepare('DELETE FROM tournaments WHERE id = ?').run(id);
    });
    return { success: true };
  });

export const toggleHeroTournament = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const id = data as unknown as number;
    const current = await db.prepare('SELECT is_hero FROM tournaments WHERE id = ?').get(id) as any;
    await db.prepare('UPDATE tournaments SET is_hero = ? WHERE id = ?').run(!current.is_hero, id);
    return { success: true };
  });

export const registerForTournament = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const { userId, tournamentId, teamName, players, contactEmail, contactPhone } = data as any;
    
    // Check if tournament exists and has slots
    const t = await db.prepare('SELECT filled, slots, entry FROM tournaments WHERE id = ?').get(tournamentId) as any;
    if (!t) throw new Error("Tournament not found");
    if (t.filled >= t.slots) throw new Error("Tournament is full");

    // Check if already registered
    const existing = await db.prepare('SELECT id FROM registrations WHERE user_id = ? AND tournament_id = ?').get(userId, tournamentId);
    if (existing) throw new Error("You are already registered for this tournament");

    await db.transaction(async (tx) => {
      // Handle Entry Fee Deduction
      if (t.entry > 0) {
        const user = await tx.prepare('SELECT deposit_balance, winning_balance FROM users WHERE id = ?').get(userId) as any;
        if (!user) throw new Error("User not found");
        
        if (user.deposit_balance + user.winning_balance < t.entry) {
          throw new Error(`Insufficient funds. You need ${t.entry} CG Coins.`);
        }

        let remaining = t.entry;
        let newDeposit = user.deposit_balance;
        let newWinning = user.winning_balance;

        if (newDeposit >= remaining) {
          newDeposit -= remaining;
          remaining = 0;
        } else {
          remaining -= newDeposit;
          newDeposit = 0;
          newWinning -= remaining;
        }

        await tx.prepare('UPDATE users SET deposit_balance = ?, winning_balance = ? WHERE id = ?').run(newDeposit, newWinning, userId);
      }

      let needsApproval = false;
      let teamId = null;
      let leaderId = null;

      if (teamName) {
        const teamInfo = await tx.prepare('SELECT id, leader_id FROM teams WHERE name = ?').get(teamName) as any;
        if (teamInfo) {
          teamId = teamInfo.id;
          leaderId = teamInfo.leader_id;
          if (teamInfo.leader_id !== userId) {
            needsApproval = true;
          }
        }
      }

      if (needsApproval) {
        // Create request
        const res = await tx.prepare(`
          INSERT INTO tournament_requests (team_id, tournament_id, requested_by, team_name, players_json, contact_email, contact_phone)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(teamId, tournamentId, userId, teamName, JSON.stringify(players), contactEmail, contactPhone);
        
        const reqId = res.lastInsertRowid;
        const requester = await tx.prepare('SELECT username FROM users WHERE id = ?').get(userId) as any;
        const tourney = await tx.prepare('SELECT title FROM tournaments WHERE id = ?').get(tournamentId) as any;

        await tx.prepare('INSERT INTO notifications (user_id, message, action_type, action_data) VALUES (?, ?, ?, ?)').run(
          leaderId,
          `⚠️ Your team member ${requester.username} wants to register your team for ${tourney.title}. Do you approve?`,
          'tournament_request',
          reqId.toString()
        );
      } else {
        // Insert registration immediately
        await tx.prepare(`
          INSERT INTO registrations (user_id, tournament_id, team_name, players_json, contact_email, contact_phone)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(userId, tournamentId, teamName, JSON.stringify(players), contactEmail, contactPhone);

        // Increment filled slots
        await tx.prepare('UPDATE tournaments SET filled = filled + 1 WHERE id = ?').run(tournamentId);

        // Give notification to team members
        const team = await tx.prepare('SELECT id FROM teams WHERE leader_id = ?').get(userId) as any;
        if (team) {
          const members = await tx.prepare('SELECT user_id FROM team_members WHERE team_id = ? AND user_id IS NOT NULL').all(team.id) as any[];
          const insertNotif = tx.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)');
          for (const m of members) {
            if (m.user_id !== userId) {
              await insertNotif.run(m.user_id, `🏆 Your Captain has registered your team for a new tournament! Check your matches.`);
            }
          }
        }
      }
    });
    return { success: true };
  });

export const getRegistrations = createServerFn({ method: "GET" })
  .handler(async () => {
    const { db } = await import("./lib/db");
    return db.prepare(`
      SELECT r.*, u.username 
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `).all();
  });

export const updateProfile = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const { userId, ign, uid, email, phone } = data as any;
    await db.prepare('UPDATE users SET ign = ?, uid = ?, email = ?, phone = ? WHERE id = ?')
      .run(ign, uid, email, phone, userId);
    return { success: true };
  });

export const getProfile = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const userId = data as unknown as number;
    return await db.prepare('SELECT id, username, role, ign, uid, email, phone, created_at, deposit_balance, winning_balance FROM users WHERE id = ?').get(userId) as any;
  });

export const updateCoinBalance = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const { userId, type, amount } = data as unknown as { userId: number; type: "deposit_balance" | "winning_balance"; amount: number };
    await db.prepare(`UPDATE users SET ${type} = ? WHERE id = ?`).run(amount, userId);
    return { success: true };
  });

export const getMyTeam = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const userId = data as unknown as number;
    let team = await db.prepare('SELECT * FROM teams WHERE leader_id = ?').get(userId) as any;
    
    if (!team) {
      const member = await db.prepare('SELECT team_id FROM team_members WHERE user_id = ?').get(userId) as any;
      if (member) {
        team = await db.prepare('SELECT * FROM teams WHERE id = ?').get(member.team_id) as any;
      }
    }
    
    if (!team) return null;
    const members = await db.prepare('SELECT * FROM team_members WHERE team_id = ?').all(team.id);
    const leader = await db.prepare('SELECT username, ign, uid FROM users WHERE id = ?').get(team.leader_id);
    return { ...team, members, leader };
  });

export const saveMyTeam = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const { userId, teamName, logo, members } = data as any;
    
    await db.transaction(async (tx) => {
      let team = await tx.prepare('SELECT id FROM teams WHERE leader_id = ?').get(userId) as any;
      let teamId;
      let existingMembers: any[] = [];
      
      if (team) {
        teamId = team.id;
        existingMembers = await tx.prepare('SELECT uid, user_id FROM team_members WHERE team_id = ? AND user_id IS NOT NULL').all(teamId) as any[];
        await tx.prepare('UPDATE teams SET name = ?, logo = ? WHERE id = ?').run(teamName, logo || '', teamId);
        await tx.prepare('DELETE FROM team_members WHERE team_id = ?').run(teamId);
      } else {
        const res = await tx.prepare('INSERT INTO teams (name, leader_id, logo) VALUES (?, ?, ?)').run(teamName, userId, logo || '');
        teamId = res.lastInsertRowid;
      }

      const insertMember = tx.prepare('INSERT INTO team_members (team_id, user_id, ign, uid, role) VALUES (?, ?, ?, ?, ?)');
      const newUids = new Set(members.filter((m: any) => m.ign && m.uid).map((m: any) => m.uid));

      for (const m of members) {
        if (m.ign && m.uid) {
          // Try to preserve existing user_id
          let memberUserId = existingMembers.find((ex) => ex.uid === m.uid)?.user_id;
          
          // If not found, try to recover it from approved requests just in case it was lost
          if (!memberUserId) {
             const req = await tx.prepare("SELECT user_id FROM team_requests WHERE team_id = ? AND uid = ? AND status = 'approved' ORDER BY created_at DESC LIMIT 1").get(teamId, m.uid) as any;
             if (req) memberUserId = req.user_id;
          }

          await insertMember.run(teamId, memberUserId || null, m.ign, m.uid, m.role || 'player');
        }
      }

      // Notify removed members
      if (existingMembers.length > 0) {
        const insertNotif = tx.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)');
        for (const ex of existingMembers) {
          if (!newUids.has(ex.uid)) {
            await insertNotif.run(ex.user_id, `❌ You have been removed from the team ${teamName}.`);
          }
        }
      }
    });
    return { success: true };
  });

export const leaveTeam = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const { userId, teamId } = data as any;
    
    await db.transaction(async (tx) => {
      const user = await tx.prepare('SELECT username, ign FROM users WHERE id = ?').get(userId) as any;
      const team = await tx.prepare('SELECT name, leader_id FROM teams WHERE id = ?').get(teamId) as any;
      
      if (!user || !team) throw new Error("Invalid team or user");
      
      await tx.prepare('DELETE FROM team_members WHERE team_id = ? AND user_id = ?').run(teamId, userId);
      await tx.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(team.leader_id, `⚠️ ${user.ign || user.username} has left your team ${team.name}.`);
    });
    return { success: true };
  });

export const deleteTeam = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const { userId, teamId } = data as any;
    
    await db.transaction(async (tx) => {
      const team = await tx.prepare('SELECT name, leader_id FROM teams WHERE id = ?').get(teamId) as any;
      if (!team) throw new Error("Team not found");
      if (team.leader_id !== userId) throw new Error("Only the captain can delete the team");
      
      const members = await tx.prepare('SELECT user_id FROM team_members WHERE team_id = ? AND user_id IS NOT NULL').all(teamId) as any[];
      
      await tx.prepare('DELETE FROM team_requests WHERE team_id = ?').run(teamId);
      await tx.prepare('DELETE FROM team_members WHERE team_id = ?').run(teamId);
      await tx.prepare('DELETE FROM teams WHERE id = ?').run(teamId);
      
      const insertNotif = tx.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)');
      for (const m of members) {
        if (m.user_id !== userId) {
          await insertNotif.run(m.user_id, `⚠️ The team ${team.name} has been deleted by the captain.`);
        }
      }
    });
    return { success: true };
  });

export const getAllTeams = createServerFn({ method: "GET" })
  .handler(async () => {
    const { db } = await import("./lib/db");
    const teams = await db.prepare('SELECT * FROM teams ORDER BY created_at DESC').all() as any[];
    const allMembers = await db.prepare('SELECT * FROM team_members').all() as any[];
    return teams.map(t => ({ ...t, members: allMembers.filter(m => m.team_id === t.id) }));
  });

export const requestJoinTeam = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const { teamId, userId, ign, uid } = data as any;
    if (!ign || !uid) throw new Error("Please set your IGN and UID in your profile first.");
    
    const existing = await db.prepare("SELECT id FROM team_requests WHERE team_id = ? AND user_id = ? AND status = 'pending'").get(teamId, userId);
    if (existing) throw new Error("You already have a pending request to this team.");

    const team = await db.prepare('SELECT name, leader_id FROM teams WHERE id = ?').get(teamId) as any;

    await db.prepare('INSERT INTO team_requests (team_id, user_id, ign, uid) VALUES (?, ?, ?, ?)')
      .run(teamId, userId, ign, uid);
      
    if (team) {
      await db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(team.leader_id, `📩 ${ign} has requested to join your team ${team.name}. Go to your Profile to review.`);
    }

    return { success: true };
  });

export const getTeamRequests = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const leaderId = data as unknown as number;
    const team = await db.prepare('SELECT id FROM teams WHERE leader_id = ?').get(leaderId) as any;
    if (!team) return [];
    
    return db.prepare(`
      SELECT r.*, u.username 
      FROM team_requests r
      JOIN users u ON r.user_id = u.id
      WHERE r.team_id = ? AND r.status = 'pending'
      ORDER BY r.created_at DESC
    `).all(team.id);
  });

export const resolveTeamRequest = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const { requestId, status } = data as any;
    
    await db.transaction(async (tx) => {
      const req = await tx.prepare('SELECT * FROM team_requests WHERE id = ?').get(requestId) as any;
      if (!req) throw new Error("Request not found");
      
      await tx.prepare('UPDATE team_requests SET status = ? WHERE id = ?').run(status, requestId);
      
      if (status === 'approved') {
        const teamCount = await tx.prepare('SELECT COUNT(*) as count FROM team_members WHERE team_id = ?').get(req.team_id) as any;
        if (teamCount.count >= 3) throw new Error("Team is full! (Max 4 Players). Please click 'Edit Team' in your profile and clear a player's details to remove them first.");
        
        await tx.prepare('INSERT INTO team_members (team_id, user_id, ign, uid, role) VALUES (?, ?, ?, ?, ?)')
          .run(req.team_id, req.user_id, req.ign, req.uid, 'player');
          
        await tx.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(req.user_id, '🎉 Your request to join the team has been approved!');
      } else {
        await tx.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(req.user_id, '❌ Your request to join the team was declined.');
      }
    });
    return { success: true };
  });

export const getNotifications = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const userId = data as unknown as number;
    return await db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(userId);
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const userId = data as unknown as number;
    await db.prepare('UPDATE notifications SET is_read = true WHERE user_id = ?').run(userId);
    return { success: true };
  });

export const getMyMatches = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const userId = data as unknown as number;
    
    const userTeam = await db.prepare(`
      SELECT t.name, t.id
      FROM teams t 
      JOIN team_members tm ON tm.team_id = t.id 
      WHERE tm.user_id = ?
    `).get(userId) as any;
    
    const leaderTeam = await db.prepare('SELECT name, id FROM teams WHERE leader_id = ?').get(userId) as any;
    
    const teamName1 = userTeam ? userTeam.name : null;
    const teamName2 = leaderTeam ? leaderTeam.name : null;
    const teamId1 = userTeam ? userTeam.id : null;
    const teamId2 = leaderTeam ? leaderTeam.id : null;

    return db.prepare(`
      SELECT t.id, t.title as name, t.startsAt as date, t.status as match_status, t.prize, t.format, t.room_id, t.room_pass,
             r.kills, r.position, r.points, 'approved' as reg_status
      FROM registrations r
      JOIN tournaments t ON r.tournament_id = t.id
      WHERE r.user_id = ? OR (r.team_name = ? AND r.team_name IS NOT NULL) OR (r.team_name = ? AND r.team_name IS NOT NULL)

      UNION ALL

      SELECT t.id, t.title as name, t.startsAt as date, t.status as match_status, t.prize, t.format, null as room_id, null as room_pass,
             0 as kills, 0 as position, 0 as points, req.status as reg_status
      FROM tournament_requests req
      JOIN tournaments t ON req.tournament_id = t.id
      WHERE req.status = 'pending' AND (req.requested_by = ? OR req.team_id = ? OR req.team_id = ?)

      ORDER BY date DESC
    `).all(userId, teamName1, teamName2, userId, teamId1, teamId2);
  });

export const getTournamentResults = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const id = data as unknown as number;
    return db.prepare(`
      SELECT r.*, u.username, t.mode as tourney_mode
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN tournaments t ON r.tournament_id = t.id
      WHERE r.tournament_id = ? 
      ORDER BY 
        CASE WHEN t.mode = 'Duo' THEN (CASE WHEN r.position > 0 THEN r.position ELSE 99999 END) ELSE 0 END ASC,
        r.points DESC, 
        r.kills DESC
    `).all(id);
  });

export const saveTournamentResults = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const { tournamentId, results } = data as any;
    
    await db.transaction(async (tx) => {
      const tourney = await tx.prepare('SELECT title, prize, mode FROM tournaments WHERE id = ?').get(tournamentId) as any;
      if (!tourney) throw new Error("Tournament not found");

      const stmt = tx.prepare('UPDATE registrations SET kills = ?, position = ?, points = ? WHERE id = ? AND tournament_id = ?');
      const insertNotif = tx.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)');
      const addPrize = tx.prepare('UPDATE users SET winning_balance = winning_balance + ? WHERE id = ?');
      
      const prize1 = Math.floor(tourney.prize * 0.50);
      const prize2 = Math.floor(tourney.prize * 0.30);
      const prize3 = Math.floor(tourney.prize * 0.20);

      // Calculate points for all modes
      for (const r of results) {
        let posPoints = 0;
        const pos = Number(r.position) || 0;
        
        if (tourney.mode === 'Squad') {
          if (pos === 1) posPoints = 12;
          else if (pos === 2) posPoints = 9;
          else if (pos === 3) posPoints = 8;
          else if (pos === 4) posPoints = 7;
          else if (pos === 5) posPoints = 6;
          else if (pos === 6) posPoints = 5;
          else if (pos === 7) posPoints = 4;
          else if (pos === 8) posPoints = 3;
          else if (pos === 9) posPoints = 2;
          else if (pos === 10) posPoints = 1;
        }
        // Solo & Duo don't get posPoints

        r.calculatedPoints = Number(r.kills || 0) + posPoints;
        r.matchPosition = pos;
        r.killsNum = Number(r.kills || 0);
      }

      if (tourney.mode === 'Duo') {
        results.sort((a: any, b: any) => {
          const posA = a.matchPosition > 0 ? a.matchPosition : 99999;
          const posB = b.matchPosition > 0 ? b.matchPosition : 99999;
          if (posA !== posB) return posA - posB;
          return b.killsNum - a.killsNum;
        });
      } else {
        results.sort((a: any, b: any) => {
          if (b.calculatedPoints !== a.calculatedPoints) {
            return b.calculatedPoints - a.calculatedPoints;
          }
          return b.killsNum - a.killsNum;
        });
      }

      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const overallRank = i + 1; // 1st, 2nd, 3rd...

        await stmt.run(r.killsNum, r.matchPosition, r.calculatedPoints, r.id, tournamentId);
        
        let awardedPrize = 0;
        let rankForPrize = tourney.mode === 'Duo' ? r.matchPosition : overallRank;

        if (rankForPrize === 1 && prize1 > 0) awardedPrize = prize1;
        else if (rankForPrize === 2 && prize2 > 0) awardedPrize = prize2;
        else if (rankForPrize === 3 && prize3 > 0) awardedPrize = prize3;

        if (awardedPrize > 0) {
          await addPrize.run(awardedPrize, r.user_id);
          await insertNotif.run(r.user_id, `💰 PRIZE WON! You received ${awardedPrize} CG Coins for placing #${rankForPrize} in ${tourney.title}!`);
        }
        
        if (r.calculatedPoints > 0 || r.matchPosition > 0) {
           await insertNotif.run(r.user_id, `🏆 Match Results! You scored ${r.calculatedPoints} points (${r.killsNum} kills, Match Position ${r.matchPosition}) and finished Rank #${overallRank} in your recent tournament.`);
        }
      }
      
      // Optionally mark tournament as finished here if you want
      await tx.prepare("UPDATE tournaments SET status = 'completed' WHERE id = ?").run(tournamentId);
    });
    return { success: true };
  });

export const rescheduleTournament = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const id = data as unknown as number;

    await db.transaction(async (tx) => {
      const tourney = await tx.prepare('SELECT title FROM tournaments WHERE id = ?').get(id) as any;
      if (!tourney) throw new Error("Tournament not found");

      await tx.prepare("UPDATE tournaments SET status = 'upcoming' WHERE id = ?").run(id);
      await tx.prepare("UPDATE registrations SET kills = 0, position = 0, points = 0 WHERE tournament_id = ?").run(id);

      const registrations = await tx.prepare('SELECT user_id FROM registrations WHERE tournament_id = ?').all(id) as any[];
      const insertNotif = tx.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)');
      const notifMsg = `⚠️ The match ${tourney.title} has been RESCHEDULED. Please check your Upcoming Matches.`;
      
      for (const r of registrations) {
        await insertNotif.run(r.user_id, notifMsg);
      }
    });
    return { success: true };
  });

export const getGlobalLeaderboard = createServerFn({ method: "GET" })
  .handler(async () => {
    const { db } = await import("./lib/db");
    
    const rows = await db.prepare(`
      SELECT 
        u.id as user_id,
        u.username as ign,
        COALESCE(SUM(r.kills), 0) as kills,
        COALESCE(SUM(r.points), 0) as points,
        SUM(CASE WHEN r.position = 1 THEN 1 ELSE 0 END) as wins
      FROM users u
      JOIN registrations r ON r.user_id = u.id
      GROUP BY u.id
      HAVING COALESCE(SUM(r.points), 0) > 0
      ORDER BY points DESC, kills DESC
    `).all() as any[];

    for (let i = 0; i < rows.length; i++) {
      const t = await db.prepare(`
        SELECT t.name 
        FROM team_members tm 
        JOIN teams t ON t.id = tm.team_id 
        WHERE tm.user_id = ?
      `).get(rows[i].user_id) as any;
      if (!t) {
        const t2 = await db.prepare('SELECT name FROM teams WHERE leader_id = ?').get(rows[i].user_id) as any;
        rows[i].team = t2 ? t2.name : "Free Agent";
      } else {
        rows[i].team = t.name;
      }
      rows[i].rank = i + 1;
      
      if (rows[i].rank === 1) rows[i].badge = "god";
      else if (rows[i].rank <= 3) rows[i].badge = "elite";
      else rows[i].badge = "none";
    }

    return rows;
  });

export const resolveTournamentRequest = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const { requestId, status } = data as any;

    await db.transaction(async (tx) => {
      const req = await tx.prepare('SELECT * FROM tournament_requests WHERE id = ?').get(requestId) as any;
      if (!req) throw new Error("Request not found");
      if (req.status !== 'pending') throw new Error("Request already resolved");

      await tx.prepare("UPDATE tournament_requests SET status = ? WHERE id = ?").run(status, requestId);
      await tx.prepare("UPDATE notifications SET action_type = 'resolved' WHERE action_type = 'tournament_request' AND action_data = ?").run(requestId.toString());

      const tourney = await tx.prepare('SELECT title, entry FROM tournaments WHERE id = ?').get(req.tournament_id) as any;
      const insertNotif = tx.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)');

      if (status === 'approved') {
        await tx.prepare(`
          INSERT INTO registrations (user_id, tournament_id, team_name, players_json, contact_email, contact_phone)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(req.requested_by, req.tournament_id, req.team_name, req.players_json, req.contact_email, req.contact_phone);

        await tx.prepare('UPDATE tournaments SET filled = filled + 1 WHERE id = ?').run(req.tournament_id);

        await insertNotif.run(req.requested_by, `🎉 Your Captain has approved the tournament registration for ${tourney.title}!`);

        const members = await tx.prepare('SELECT user_id FROM team_members WHERE team_id = ? AND user_id IS NOT NULL').all(req.team_id) as any[];
        for (const m of members) {
          if (m.user_id !== req.requested_by) {
            await insertNotif.run(m.user_id, `🏆 Your Captain has registered your team for ${tourney.title}! Check your matches.`);
          }
        }
      } else {
        if (tourney.entry > 0) {
          await tx.prepare('UPDATE users SET deposit_balance = deposit_balance + ? WHERE id = ?').run(tourney.entry, req.requested_by);
          await insertNotif.run(req.requested_by, `❌ Your Captain has rejected the tournament registration for ${tourney.title}. Your entry fee of ${tourney.entry} CG Coins has been refunded to your Deposit Balance.`);
        } else {
          await insertNotif.run(req.requested_by, `❌ Your Captain has rejected the tournament registration for ${tourney.title}.`);
        }
      }
    });
    return { success: true };
  });

export const processWithdrawal = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const { userId, amount, upiId, upiNumber } = data as unknown as { userId: number; amount: number; upiId: string; upiNumber: string };
    
    await db.transaction(async (tx) => {
      const user = await tx.prepare('SELECT winning_balance FROM users WHERE id = ?').get(userId) as any;
      if (!user) throw new Error("User not found");
      if (user.winning_balance < amount) throw new Error("Insufficient Earned Coins to withdraw this amount.");
      if (amount <= 0) throw new Error("Withdraw amount must be greater than 0.");
      
      await tx.prepare('UPDATE users SET winning_balance = winning_balance - ? WHERE id = ?').run(amount, userId);
      
      await tx.prepare('INSERT INTO withdrawals (user_id, amount, upi_id, upi_number) VALUES (?, ?, ?, ?)').run(userId, amount, upiId, upiNumber);
      
      await tx.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(
        userId, 
        `💸 Withdrawal of ${amount} CG Coins initiated! You will receive your money to UPI ID ${upiId} within 2-3 working days.`
      );
    });
    return { success: true };
  });

export const getPayouts = createServerFn({ method: "GET" })
  .handler(async () => {
    const { db } = await import("./lib/db");
    return db.prepare(`
      SELECT w.*, u.username, u.email, u.phone 
      FROM withdrawals w 
      JOIN users u ON w.user_id = u.id 
      ORDER BY w.created_at DESC
    `).all();
  });

export const updatePayoutStatus = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const { payoutId, status, userId, amount } = data as unknown as { payoutId: number; status: string; userId: number; amount: number };
    
    await db.transaction(async (tx) => {
      await tx.prepare('UPDATE withdrawals SET status = ? WHERE id = ?').run(status, payoutId);
      
      if (status === 'completed') {
        await tx.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(userId, `✅ Your withdrawal of ${amount} CG Coins has been successfully processed and sent to your UPI!`);
      } else if (status === 'rejected') {
        // Refund the coins
        await tx.prepare('UPDATE users SET winning_balance = winning_balance + ? WHERE id = ?').run(amount, userId);
        await tx.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(userId, `❌ Your withdrawal of ${amount} CG Coins was rejected. The coins have been refunded to your wallet.`);
      }
    });
    return { success: true };
  });


export const deleteUser = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const { id } = data as unknown as { id: number };
    
    // First, clear any sessions for this user so they are immediately logged out
    await db.prepare("DELETE FROM sessions WHERE user_id = $1").run(id);
    
    // Then delete the user (cascade deletes will handle the rest)
    await db.prepare("DELETE FROM users WHERE id = $1").run(id);
    
    return { success: true };
  });

export const deleteAllUsers = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    // Only keep admin (assuming role = 'admin')
    await db.prepare("DELETE FROM users WHERE role != 'admin'").run();
    return { success: true };
  });

export const deleteAllTournaments = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    await db.prepare("DELETE FROM tournaments").run();
    return { success: true };
  });
