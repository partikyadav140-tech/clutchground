"use server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
export { createRazorpayOrder, verifyRazorpayPayment, getWalletBalance, getTransactionHistory, initializeRazorpayTables } from "./lib/razorpay";

export const loginUser = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const { phone, password } = data as unknown as { phone: string; password: string };
  const normalizedPhone = typeof phone === "string" ? phone.trim() : phone;

  console.log("Login attempt - Raw phone:", phone, "Normalized phone:", normalizedPhone);

  if (!normalizedPhone || !/^\d{10}$/.test(normalizedPhone)) {
    console.log("Phone validation failed:", { normalizedPhone, isValid: /^\d{10}$/.test(normalizedPhone) });
    throw new Error("Phone number must be exactly 10 digits");
  }

  const userStmt = db.prepare("SELECT * FROM users WHERE phone = ?");
  const user = (await userStmt.get(normalizedPhone)) as any;
  console.log("User lookup result:", user ? { id: user.id, username: user.username, role: user.role, phone: user.phone } : null);

  if (!user) {
    console.log("No user found with phone:", normalizedPhone);
    throw new Error("Invalid phone number or password");
  }

  if (user.password !== password) {
    console.log("Password mismatch for user:", user.username);
    throw new Error("Invalid phone number or password");
  }

  if (user.banned) {
    throw new Error("This account has been banned by the administrator due to violation of terms of service and illegal activities. Please contact support for assistance.");
  }

  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(); // 7 days

  await db
    .prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
    .run(sessionId, user.id, expiresAt);

  return { sessionId, user: { id: user.id, username: user.username, role: user.role } };
});

export const signupUser = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const { username, password, ign, uid, email, phone } = data as any;
  const normalizedPhone = typeof phone === "string" ? phone.trim() : phone;

  if (!normalizedPhone) {
    throw new Error("Phone number is required");
  }

  if (!/^\d{10}$/.test(normalizedPhone)) {
    throw new Error("Phone number must be exactly 10 digits");
  }

  const checkStmt = db.prepare("SELECT id FROM users WHERE username = ?");
  const exists = await checkStmt.get(username);
  if (exists) {
    throw new Error("Username already taken");
  }

  const phoneCheckStmt = db.prepare("SELECT id FROM users WHERE phone = ?");
  const phoneExists = await phoneCheckStmt.get(normalizedPhone);
  if (phoneExists) {
    throw new Error("Phone number already registered");
  }

  const insertStmt = db.prepare(
    "INSERT INTO users (username, password, ign, uid, email, phone) VALUES (?, ?, ?, ?, ?, ?)",
  );
  const result = await insertStmt.run(
    username,
    password,
    ign || null,
    uid || null,
    email || null,
    normalizedPhone,
  );
  const userId = result.lastInsertRowid;

  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

  await db
    .prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
    .run(sessionId, userId, expiresAt);

  return { sessionId, user: { id: userId, username, role: "user" } };
});

// Temporary function to create admin user - remove after use
export const createAdminUser = createServerFn({ method: "POST" }).handler(async () => {
  const { db } = await import("./lib/db");

  try {
    // Check if admin already exists
    const existingAdmin = await db.prepare("SELECT * FROM users WHERE username = 'admin'").get();
    if (existingAdmin) {
      console.log("Existing admin found:", existingAdmin);
    }

    // Delete existing admin if any
    const deleteResult = await db.prepare("DELETE FROM users WHERE username = 'admin'").run();
    console.log("Delete result:", deleteResult);

    // Also delete any user with the admin phone number
    const deletePhoneResult = await db.prepare("DELETE FROM users WHERE phone = '8307224756'").run();
    console.log("Delete phone result:", deletePhoneResult);

    // Create new admin user
    const insertStmt = db.prepare(
      "INSERT INTO users (username, password, role, phone) VALUES (?, ?, ?, ?)",
    );
    const result = await insertStmt.run('admin', 'admin123', 'admin', '8307224756');
    console.log("Insert result:", result);

    // Verify the user was created
    const verifyUser = await db.prepare("SELECT * FROM users WHERE username = 'admin'").get();
    console.log("Created admin user:", verifyUser);

    return {
      success: true,
      message: "Admin user created successfully",
      user: verifyUser
    };
  } catch (error) {
    const err = error as Error;
    console.error("Error creating admin user:", err);
    return {
      success: false,
      message: `Failed to create admin user: ${err.message}`,
      error: err.message
    };
  }
});

export const getUserFromSession = createServerFn({ method: "GET" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const sessionId = data as unknown as string;
  if (!sessionId) return null;

  const stmt = db.prepare(`
      SELECT users.id, users.username, users.role, users.deposit_balance, users.winning_balance, users.banned
      FROM sessions 
      JOIN users ON sessions.user_id = users.id 
      WHERE sessions.id = ? AND sessions.expires_at > ?
    `);
  const user = (await stmt.get(sessionId, new Date().toISOString())) as any;
  if (user && user.banned) return null; // Treat banned users as not logged in
  return user || null;
});

export const logoutUser = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const sessionId = data as unknown as string;
  if (sessionId) {
    await db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
  }
  return { success: true };
});

export const getUsers = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./lib/db");
  return await db
    .prepare(
      "SELECT id, username, password, role, created_at, deposit_balance, winning_balance, ign, phone, banned FROM users",
    )
    .all();
});

export const getTournaments = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./lib/db");
  const { apiCache } = await import("./lib/cache");

  const cacheKey = 'tournaments';
  const cached = apiCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const tournaments = await db.prepare("SELECT * FROM tournaments ORDER BY startsAt ASC").all();
  apiCache.set(cacheKey, tournaments, 2 * 60 * 1000); // Cache for 2 minutes

  return tournaments;
});

export const addTournament = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const {
    title,
    game,
    mode,
    format,
    entry,
    prize,
    slots,
    filled,
    startsAt,
    status,
    banner,
    room_id,
    room_pass,
    hosted_by,
    per_kill_coin,
    first_place_coin,
  } = data as unknown as any;
  const stmt = db.prepare(`
      INSERT INTO tournaments (title, game, mode, format, entry, prize, slots, filled, startsAt, status, banner, room_id, room_pass, hosted_by, per_kill_coin, first_place_coin)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
  await stmt.run(
    title,
    game,
    mode,
    format,
    entry,
    prize,
    slots,
    filled,
    startsAt,
    status,
    banner,
    room_id || null,
    room_pass || null,
    hosted_by || null,
    per_kill_coin || 0,
    first_place_coin || 0,
  );

  if (status === "upcoming") {
    const users = await db.prepare("SELECT id FROM users WHERE role = 'user'").all();
    const insertNotif = db.prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)");
    for (const user of users as any[]) {
      await insertNotif.run(
        user.id,
        `📣 New tournament announced: ${title} (${mode} / ${format}) — ${slots} slots, entry ${entry} CG, prize pool ${prize} CG. Open Arena to register now!`,
        "/tournaments",
      );
    }
  }

  // Clear tournaments cache to ensure new tournament appears
  const { apiCache } = await import("./lib/cache");
  apiCache.delete('tournaments');

  return { success: true };
});

export const updateTournament = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const {
    id,
    title,
    game,
    mode,
    format,
    entry,
    prize,
    slots,
    filled,
    startsAt,
    status,
    banner,
    room_id,
    room_pass,
    hosted_by,
    per_kill_coin,
    first_place_coin,
  } = data as unknown as any;

  const old = (await db
    .prepare("SELECT room_id, room_pass FROM tournaments WHERE id = ?")
    .get(id)) as any;

  const finalStatus =
    status === "completed"
      ? "completed"
      : room_id && room_pass
      ? "locked"
      : status;

  const stmt = db.prepare(`
      UPDATE tournaments 
      SET title=?, game=?, mode=?, format=?, entry=?, prize=?, slots=?, filled=?, startsAt=?, status=?, banner=?, room_id=?, room_pass=?, hosted_by=?, per_kill_coin=?, first_place_coin=?
      WHERE id=?
    `);
  await stmt.run(
    title,
    game,
    mode,
    format,
    entry,
    prize,
    slots,
    filled,
    startsAt,
    finalStatus,
    banner,
    room_id || null,
    room_pass || null,
    hosted_by || null,
    per_kill_coin || 0,
    first_place_coin || 0,
    id,
  );

  if ((room_id && room_id !== old?.room_id) || (room_pass && room_pass !== old?.room_pass)) {
    const registrations = (await db
      .prepare("SELECT user_id FROM registrations WHERE tournament_id = ?")
      .all(id)) as any[];
    const insertNotif = db.prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)");
    const notifMsg =
      `🔑 Room details for ${title} updated! ` +
      (room_id ? `ID: ${room_id} ` : "") +
      (room_pass ? `Pass: ${room_pass}` : "");
    for (const r of registrations) {
      await insertNotif.run(r.user_id, notifMsg.trim(), `/tournaments/${id}`);
    }
  }

  // Clear tournaments cache to ensure updated data is fetched
  const { apiCache } = await import("./lib/cache");
  apiCache.delete('tournaments');

  return { success: true };
});

export const deleteTournament = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const id = data as unknown as number;
  await db.transaction(async (tx) => {
    await tx.prepare("DELETE FROM registrations WHERE tournament_id = ?").run(id);
    await tx.prepare("DELETE FROM tournaments WHERE id = ?").run(id);
  });

  // Clear tournaments cache to ensure deleted tournament is removed
  const { apiCache } = await import("./lib/cache");
  apiCache.delete('tournaments');

  return { success: true };
});

export const toggleHeroTournament = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const id = data as unknown as number;
  const current = (await db.prepare("SELECT is_hero FROM tournaments WHERE id = ?").get(id)) as any;
  await db.prepare("UPDATE tournaments SET is_hero = ? WHERE id = ?").run(!current.is_hero, id);

  // Clear tournaments cache to ensure hero status update is reflected
  const { apiCache } = await import("./lib/cache");
  apiCache.delete('tournaments');

  return { success: true };
});

export const registerForTournament = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const { db } = await import("./lib/db");
    const { userId, tournamentId, teamName, players, contactEmail, contactPhone } = data as any;

    // Check if user is banned
    const userCheck = (await db
      .prepare("SELECT banned FROM users WHERE id = ?")
      .get(userId)) as any;
    if (!userCheck) throw new Error("User not found");
    if (userCheck.banned) throw new Error("Account is banned. Cannot register for tournaments.");

    // Check if tournament exists and has slots
    const t = (await db
      .prepare("SELECT title, startsAt, mode, format, entry, filled, slots, status FROM tournaments WHERE id = ?")
      .get(tournamentId)) as any;
    if (!t) throw new Error("Tournament not found");
    if (t.status === "locked") throw new Error("Tournament is locked and no longer accepting registrations");
    if (t.filled >= t.slots) throw new Error("Tournament is full");

    // Check if already registered
    const existing = await db
      .prepare("SELECT id FROM registrations WHERE user_id = ? AND tournament_id = ?")
      .get(userId, tournamentId);
    if (existing) throw new Error("You are already registered for this tournament");

    const incomingUids = players.map((p: any) => p.uid).filter(Boolean);
    if (incomingUids.length > 0) {
      const existingRegs = (await db
        .prepare("SELECT players_json FROM registrations WHERE tournament_id = ?")
        .all(tournamentId)) as any[];

      for (const reg of existingRegs) {
        if (!reg.players_json) continue;
        try {
          const regPlayers = JSON.parse(reg.players_json);
          for (const rp of regPlayers) {
            if (rp.uid && incomingUids.includes(rp.uid)) {
              throw new Error(`Player with UID ${rp.uid} (${rp.ign}) is already registered in this tournament in another team.`);
            }
          }
        } catch (e: any) {
          if (e.message?.includes("is already registered")) throw e;
        }
      }

      const existingReqs = (await db
        .prepare("SELECT players_json FROM tournament_requests WHERE tournament_id = ? AND status = 'pending'")
        .all(tournamentId)) as any[];

      for (const req of existingReqs) {
        if (!req.players_json) continue;
        try {
          const reqPlayers = JSON.parse(req.players_json);
          for (const rp of reqPlayers) {
            if (rp.uid && incomingUids.includes(rp.uid)) {
              throw new Error(`Player with UID ${rp.uid} (${rp.ign}) has a pending registration request for this tournament.`);
            }
          }
        } catch (e: any) {
          if (e.message?.includes("pending registration")) throw e;
        }
      }
    }

    await db.transaction(async (tx) => {
      // Handle Entry Fee Deduction
      if (t.entry > 0) {
        const user = (await tx
          .prepare("SELECT deposit_balance, winning_balance FROM users WHERE id = ?")
          .get(userId)) as any;
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

        await tx
          .prepare("UPDATE users SET deposit_balance = ?, winning_balance = ? WHERE id = ?")
          .run(newDeposit, newWinning, userId);
        await tx
          .prepare(
            "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
          )
          .run(userId, t.entry, "tournament_entry", `Entry Fee: ${t.title}`);
      }

      let needsApproval = false;
      let teamId = null;
      let leaderId = null;
      let requester: any = null;

      if (teamName) {
        const teamInfo = (await tx
          .prepare("SELECT id, leader_id FROM teams WHERE name = ?")
          .get(teamName)) as any;
        if (teamInfo) {
          teamId = teamInfo.id;
          leaderId = teamInfo.leader_id;
          if (teamInfo.leader_id !== userId && t.mode !== "Duo") {
            needsApproval = true;
          }
        }
      }

      if (needsApproval) {
        // Create request
        const res = await tx
          .prepare(
            `
          INSERT INTO tournament_requests (team_id, tournament_id, requested_by, team_name, players_json, contact_email, contact_phone)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
          )
          .run(
            teamId,
            tournamentId,
            userId,
            teamName,
            JSON.stringify(players),
            contactEmail,
            contactPhone,
          );

        const reqId = res.lastInsertRowid;
        const requester = (await tx
          .prepare("SELECT username FROM users WHERE id = ?")
          .get(userId)) as any;
        const tourney = (await tx
          .prepare("SELECT title FROM tournaments WHERE id = ?")
          .get(tournamentId)) as any;

        await tx
          .prepare(
            "INSERT INTO notifications (user_id, message, action_type, action_data, redirect_url) VALUES (?, ?, ?, ?, ?)",
          )
          .run(
            leaderId,
            `⚠️ Your team member ${requester.username} wants to register your team for ${tourney.title}. Do you approve?`,
            "tournament_request",
            reqId.toString(),
            `/tournaments/${tournamentId}`,
          );
      } else {
        // Insert registration immediately
        await tx
          .prepare(
            `
          INSERT INTO registrations (user_id, tournament_id, team_name, players_json, contact_email, contact_phone)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
          )
          .run(userId, tournamentId, teamName, JSON.stringify(players), contactEmail, contactPhone);

        // Increment filled slots by 1 slot per registration
        const filledIncrement = 1;
        await tx
          .prepare("UPDATE tournaments SET filled = filled + ? WHERE id = ?")
          .run(filledIncrement, tournamentId);

        await tx
          .prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)")
          .run(
            userId,
            `✅ Registration confirmed for ${t.title} (${t.mode}). Entry fee ${t.entry} CG. See your Upcoming Matches and prepare to compete!`,
            "/matches",
          );

        // Give notification to team members
        const team = (await tx
          .prepare("SELECT id FROM teams WHERE leader_id = ?")
          .get(userId)) as any;
        if (team) {
          requester = requester ||
            (await tx.prepare("SELECT username FROM users WHERE id = ?").get(userId));
          const members = (await tx
            .prepare("SELECT user_id FROM team_members WHERE team_id = ? AND user_id IS NOT NULL")
            .all(team.id)) as any[];
          const insertNotif = tx.prepare(
            "INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)",
          );
          for (const m of members) {
            if (m.user_id !== userId) {
              await insertNotif.run(
                m.user_id,
                `🏆 ${requester.username} registered your team for ${t.title} (${t.mode}). Check Upcoming Matches for date and room details.`,
                "/matches",
              );
            }
          }
        }
      }
    });

    // Clear tournaments cache to ensure filled count is updated
    const { apiCache } = await import("./lib/cache");
    apiCache.delete('tournaments');

    return { success: true };
  },
);

export const getRegistrations = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./lib/db");
  return db
    .prepare(
      `
      SELECT r.*, u.username 
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `,
    )
    .all();
});

export const checkUserRegistration = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const { db } = await import("./lib/db");
    const { userId, tournamentId } = data as any;
    
    const existing = await db
      .prepare("SELECT id FROM registrations WHERE user_id = ? AND tournament_id = ?")
      .get(userId, tournamentId);
    if (existing) return { isRegistered: true };
    
    const userProfile = await db.prepare("SELECT uid FROM users WHERE id = ?").get(userId) as any;
    if (userProfile && userProfile.uid) {
      const existingRegs = (await db
        .prepare("SELECT players_json FROM registrations WHERE tournament_id = ?")
        .all(tournamentId)) as any[];
        
      for (const reg of existingRegs) {
        if (!reg.players_json) continue;
        try {
          const players = JSON.parse(reg.players_json);
          if (players.some((p: any) => p.uid === userProfile.uid)) {
            return { isRegistered: true };
          }
        } catch (e) {}
      }

      const existingReqs = (await db
        .prepare("SELECT players_json FROM tournament_requests WHERE tournament_id = ? AND status = 'pending'")
        .all(tournamentId)) as any[];
        
      for (const req of existingReqs) {
        if (!req.players_json) continue;
        try {
          const players = JSON.parse(req.players_json);
          if (players.some((p: any) => p.uid === userProfile.uid)) {
            return { isRegistered: true };
          }
        } catch (e) {}
      }
    }
    
    return { isRegistered: false };
  },
);

export const updateProfile = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const { userId, ign, uid, email, phone } = data as any;
  await db
    .prepare("UPDATE users SET ign = ?, uid = ?, email = ?, phone = ? WHERE id = ?")
    .run(ign, uid, email, phone, userId);
  return { success: true };
});

export const getProfile = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const userId = data as unknown as number;
  return (await db
    .prepare(
      "SELECT id, username, role, ign, uid, email, phone, created_at, deposit_balance, winning_balance FROM users WHERE id = ?",
    )
    .get(userId)) as any;
});

export const updateCoinBalance = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const { userId, type, amount } = data as unknown as {
    userId: number;
    type: "deposit_balance" | "winning_balance";
    amount: number;
  };

  await db.transaction(async (tx) => {
    const old = (await tx
      .prepare(`SELECT ${type} as balance FROM users WHERE id = ?`)
      .get(userId)) as any;
    const diff = amount - (old ? old.balance : 0);

    await tx.prepare(`UPDATE users SET ${type} = ? WHERE id = ?`).run(amount, userId);

    if (diff !== 0) {
      const tType =
        type === "deposit_balance"
          ? diff > 0
            ? "deposit_added"
            : "deposit_deducted"
          : diff > 0
            ? "winnings_added"
            : "winnings_deducted";
      await tx
        .prepare(
          "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
        )
        .run(userId, Math.abs(diff), tType, "Admin Adjustment");
    }
  });

  return { success: true };
});

export const getMyTeam = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const userId = data as unknown as number;
  let team = (await db.prepare("SELECT * FROM teams WHERE leader_id = ?").get(userId)) as any;

  if (!team) {
    const member = (await db
      .prepare("SELECT team_id FROM team_members WHERE user_id = ?")
      .get(userId)) as any;
    if (member) {
      team = (await db.prepare("SELECT * FROM teams WHERE id = ?").get(member.team_id)) as any;
    }
  }

  if (!team) return null;
  const members = await db
    .prepare(
      `
      SELECT tm.*, u.username
      FROM team_members tm
      LEFT JOIN users u ON u.id = tm.user_id
      WHERE tm.team_id = ?
    `,
    )
    .all(team.id);
  const leader = await db
    .prepare("SELECT username, ign, uid FROM users WHERE id = ?")
    .get(team.leader_id);
  return { ...team, members, leader };
});

export const saveMyTeam = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const { userId, teamName, logo, members } = data as any;

  await db.transaction(async (tx) => {
    let team = (await tx.prepare("SELECT id FROM teams WHERE leader_id = ?").get(userId)) as any;
    let teamId;
    let existingMembers: any[] = [];

    if (team) {
      teamId = team.id;
      existingMembers = (await tx
        .prepare("SELECT uid, user_id FROM team_members WHERE team_id = ? AND user_id IS NOT NULL")
        .all(teamId)) as any[];
      await tx
        .prepare("UPDATE teams SET name = ?, logo = ? WHERE id = ?")
        .run(teamName, logo || "", teamId);
      await tx.prepare("DELETE FROM team_members WHERE team_id = ?").run(teamId);
    } else {
      const res = await tx
        .prepare("INSERT INTO teams (name, leader_id, logo) VALUES (?, ?, ?)")
        .run(teamName, userId, logo || "");
      teamId = res.lastInsertRowid;
    }

    const insertMember = tx.prepare(
      "INSERT INTO team_members (team_id, user_id, ign, uid, role) VALUES (?, ?, ?, ?, ?)",
    );
    const newUids = new Set(members.filter((m: any) => m.ign && m.uid).map((m: any) => m.uid));

    for (const m of members) {
      if (m.ign && m.uid) {
        // Try to preserve existing user_id
        let memberUserId = existingMembers.find((ex) => ex.uid === m.uid)?.user_id;

        // If not found, try to recover it from approved requests just in case it was lost
        if (!memberUserId) {
          const req = (await tx
            .prepare(
              "SELECT user_id FROM team_requests WHERE team_id = ? AND uid = ? AND status = 'approved' ORDER BY created_at DESC LIMIT 1",
            )
            .get(teamId, m.uid)) as any;
          if (req) memberUserId = req.user_id;
        }

        await insertMember.run(teamId, memberUserId || null, m.ign, m.uid, m.role || "player");
      }
    }

    // Notify removed members
    if (existingMembers.length > 0) {
      const insertNotif = tx.prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)");
      for (const ex of existingMembers) {
        if (!newUids.has(ex.uid)) {
          await insertNotif.run(ex.user_id, `❌ You have been removed from the team ${teamName}.`, "/teams");
        }
      }
    }
  });
  return { success: true };
});

export const leaveTeam = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const { userId, teamId } = data as any;

  await db.transaction(async (tx) => {
    const user = (await tx
      .prepare("SELECT username, ign FROM users WHERE id = ?")
      .get(userId)) as any;
    const team = (await tx
      .prepare("SELECT name, leader_id FROM teams WHERE id = ?")
      .get(teamId)) as any;

    if (!user || !team) throw new Error("Invalid team or user");

    await tx
      .prepare("DELETE FROM team_members WHERE team_id = ? AND user_id = ?")
      .run(teamId, userId);
    await tx
      .prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)")
      .run(team.leader_id, `⚠️ ${user.ign || user.username} has left your team ${team.name}.`, "/teams");
  });
  return { success: true };
});

export const deleteTeam = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const { userId, teamId } = data as any;

  await db.transaction(async (tx) => {
    const team = (await tx
      .prepare("SELECT name, leader_id FROM teams WHERE id = ?")
      .get(teamId)) as any;
    if (!team) throw new Error("Team not found");
    if (team.leader_id !== userId) throw new Error("Only the captain can delete the team");

    const members = (await tx
      .prepare("SELECT user_id FROM team_members WHERE team_id = ? AND user_id IS NOT NULL")
      .all(teamId)) as any[];

    await tx.prepare("DELETE FROM team_requests WHERE team_id = ?").run(teamId);
    await tx.prepare("DELETE FROM team_members WHERE team_id = ?").run(teamId);
    await tx.prepare("DELETE FROM teams WHERE id = ?").run(teamId);

    const insertNotif = tx.prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)");
    for (const m of members) {
      if (m.user_id !== userId) {
        await insertNotif.run(
          m.user_id,
          `⚠️ The team ${team.name} has been deleted by the captain.`,
          "/teams",
        );
      }
    }
  });
  return { success: true };
});

export const getAllTeams = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./lib/db");
  const teams = (await db.prepare("SELECT * FROM teams ORDER BY created_at DESC").all()) as any[];
  const allMembers = (await db
    .prepare(
      `
      SELECT tm.*, u.username
      FROM team_members tm
      LEFT JOIN users u ON u.id = tm.user_id
    `,
    )
    .all()) as any[];
  return teams.map((t) => ({ ...t, members: allMembers.filter((m) => m.team_id === t.id) }));
});

export const requestJoinTeam = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const { teamId, userId, ign, uid } = data as any;
  if (!ign || !uid) throw new Error("Please set your IGN and UID in your profile first.");

  const existing = await db
    .prepare(
      "SELECT id FROM team_requests WHERE team_id = ? AND user_id = ? AND status = 'pending'",
    )
    .get(teamId, userId);
  if (existing) throw new Error("You already have a pending request to this team.");

  const team = (await db
    .prepare("SELECT name, leader_id FROM teams WHERE id = ?")
    .get(teamId)) as any;

  await db
    .prepare("INSERT INTO team_requests (team_id, user_id, ign, uid) VALUES (?, ?, ?, ?)")
    .run(teamId, userId, ign, uid);

  if (team) {
    await db
      .prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)")
      .run(
        team.leader_id,
        `📩 ${ign} has requested to join your team ${team.name}. Go to your Profile to review.`,
        "/teams",
      );
  }

  return { success: true };
});

export const getTeamRequests = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const leaderId = data as unknown as number;
  const team = (await db.prepare("SELECT id FROM teams WHERE leader_id = ?").get(leaderId)) as any;
  if (!team) return [];

  return db
    .prepare(
      `
      SELECT r.*, u.username 
      FROM team_requests r
      JOIN users u ON r.user_id = u.id
      WHERE r.team_id = ? AND r.status = 'pending'
      ORDER BY r.created_at DESC
    `,
    )
    .all(team.id);
});

export const getMyTeamRequest = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const userId = data as unknown as number;

  return db
    .prepare(
      `
      SELECT r.*, t.name AS team_name
      FROM team_requests r
      LEFT JOIN teams t ON r.team_id = t.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT 1
    `,
    )
    .get(userId);
});

export const resolveTeamRequest = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const { requestId, status } = data as any;

  await db.transaction(async (tx) => {
    const req = (await tx
      .prepare("SELECT * FROM team_requests WHERE id = ?")
      .get(requestId)) as any;
    if (!req) throw new Error("Request not found");

    await tx.prepare("UPDATE team_requests SET status = ? WHERE id = ?").run(status, requestId);

    if (status === "approved") {
      const teamCount = (await tx
        .prepare("SELECT COUNT(*) as count FROM team_members WHERE team_id = ?")
        .get(req.team_id)) as any;
      if (teamCount.count >= 3)
        throw new Error(
          "Team is full! (Max 4 Players). Please click 'Edit Team' in your profile and clear a player's details to remove them first.",
        );

      await tx
        .prepare(
          "INSERT INTO team_members (team_id, user_id, ign, uid, role) VALUES (?, ?, ?, ?, ?)",
        )
        .run(req.team_id, req.user_id, req.ign, req.uid, "player");

      await tx
        .prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)")
        .run(req.user_id, "🎉 Your request to join the team has been approved!", "/teams");
    } else {
      await tx
        .prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)")
        .run(req.user_id, "❌ Your request to join the team was declined.", "/teams");
    }
  });
  return { success: true };
});

export const getNotifications = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const userId = data as unknown as number;
  return await db
    .prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20")
    .all(userId);
});

export const markNotificationsRead = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const { db } = await import("./lib/db");
    const userId = data as unknown as number;
    await db.prepare("UPDATE notifications SET is_read = true WHERE user_id = ?").run(userId);
    return { success: true };
  },
);

export const getMyMatches = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const userId = data as unknown as number;

  const userTeam = (await db
    .prepare(
      `
      SELECT t.name, t.id
      FROM teams t 
      JOIN team_members tm ON tm.team_id = t.id 
      WHERE tm.user_id = ?
    `,
    )
    .get(userId)) as any;

  const leaderTeam = (await db
    .prepare("SELECT name, id FROM teams WHERE leader_id = ?")
    .get(userId)) as any;

  const teamName1 = userTeam ? userTeam.name : null;
  const teamName2 = leaderTeam ? leaderTeam.name : null;
  const teamId1 = userTeam ? userTeam.id : null;
  const teamId2 = leaderTeam ? leaderTeam.id : null;

  return db
    .prepare(
      `
      SELECT t.id, t.title as name, t.startsAt as date, t.status as match_status, t.prize, t.mode, t.format, t.room_id, t.room_pass, t.per_kill_coin, t.first_place_coin,
             r.kills, r.position, r.points, 'approved' as reg_status
      FROM registrations r
      JOIN tournaments t ON r.tournament_id = t.id
      WHERE r.user_id = ? OR (r.team_name = ? AND r.team_name IS NOT NULL) OR (r.team_name = ? AND r.team_name IS NOT NULL)

      UNION ALL

      SELECT t.id, t.title as name, t.startsAt as date, t.status as match_status, t.prize, t.mode, t.format, null as room_id, null as room_pass, t.per_kill_coin, t.first_place_coin,
             0 as kills, 0 as position, 0 as points, req.status as reg_status
      FROM tournament_requests req
      JOIN tournaments t ON req.tournament_id = t.id
      WHERE req.status = 'pending' AND (req.requested_by = ? OR req.team_id = ? OR req.team_id = ?)

      ORDER BY date DESC
    `,
    )
    .all(userId, teamName1, teamName2, userId, teamId1, teamId2);
});

export const getTournamentResults = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const id = data as unknown as number;
  const results = (await db
    .prepare(
      `
      SELECT r.*, u.username, COALESCE(r.team_name, u.username) as display_name, t.mode as tourney_mode
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN tournaments t ON r.tournament_id = t.id
      WHERE r.tournament_id = ? 
      ORDER BY 
        CASE WHEN t.mode IN ('Duo', 'Solo') THEN (CASE WHEN r.position > 0 THEN r.position ELSE 99999 END) ELSE 0 END ASC,
        CASE WHEN t.mode = 'Squad' THEN r.points ELSE NULL END DESC,
        r.kills DESC
    `,
    )
    .all(id)) as any[];
  
  return results.map((r: any) => {
    if (r.tourney_mode === 'Duo' || r.tourney_mode === 'Solo') {
      r.points = 0;
    }
    return r;
  });
});

export const saveTournamentResults = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const { db } = await import("./lib/db");
    const { tournamentId, results } = data as any;

    await db.transaction(async (tx) => {
      const tourney = (await tx
        .prepare(
          "SELECT title, prize, mode, per_kill_coin, first_place_coin FROM tournaments WHERE id = ?",
        )
        .get(tournamentId)) as any;
      if (!tourney) throw new Error("Tournament not found");

      const stmt = tx.prepare(
        "UPDATE registrations SET kills = ?, position = ?, points = ?, awarded_prize = ? WHERE id = ? AND tournament_id = ?",
      );
      const insertNotif = tx.prepare("INSERT INTO notifications (user_id, message) VALUES (?, ?)");
      const addPrize = tx.prepare(
        "UPDATE users SET winning_balance = winning_balance + ? WHERE id = ?",
      );

      const prize1 = Math.floor(tourney.prize * 0.5);
      const prize2 = Math.floor(tourney.prize * 0.3);
      const prize3 = Math.floor(tourney.prize * 0.2);

      // Calculate points for all modes
      for (const r of results) {
        let posPoints = 0;
        const pos = Number(r.position) || 0;

        if (tourney.mode === "Squad") {
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

        const manualPoints = typeof r.manualPoints !== "undefined" && r.manualPoints !== null ? Number(r.manualPoints) : undefined;
        const useManualPoints = manualPoints !== undefined && !Number.isNaN(manualPoints);

        if (tourney.mode === "Squad") {
          r.calculatedPoints = useManualPoints ? manualPoints : Number(r.kills || 0) + posPoints;
        } else {
          r.calculatedPoints = 0;
        }
        r.matchPosition = pos;
        r.killsNum = Number(r.kills || 0);
      }

      if (tourney.mode === "Duo" || tourney.mode === "Solo") {
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

        const oldReg = (await tx
          .prepare("SELECT kills, position, points, awarded_prize FROM registrations WHERE id = ?")
          .get(r.id)) as any;
        const oldPrize = oldReg ? oldReg.awarded_prize || 0 : 0;
        const oldPoints = oldReg ? oldReg.points || 0 : 0;

        let awardedPrize = 0;
        let rankForPrize = tourney.mode === "Duo" || tourney.mode === "Solo" ? r.matchPosition : overallRank;

        if (tourney.mode === "Solo") {
          awardedPrize =
            r.killsNum * (tourney.per_kill_coin || 0) +
            (rankForPrize === 1 ? tourney.first_place_coin || 0 : 0);
        } else {
          if (rankForPrize === 1 && prize1 > 0) awardedPrize = prize1;
          else if (rankForPrize === 2 && prize2 > 0) awardedPrize = prize2;
          else if (rankForPrize === 3 && prize3 > 0) awardedPrize = prize3;
        }

        await stmt.run(
          r.killsNum,
          r.matchPosition,
          r.calculatedPoints,
          awardedPrize,
          r.id,
          tournamentId,
        );

        let prizeDiff = awardedPrize - oldPrize;

        if (prizeDiff !== 0) {
          await addPrize.run(prizeDiff, r.user_id);
          await tx
            .prepare(
              "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
            )
            .run(
              r.user_id,
              Math.abs(prizeDiff),
              prizeDiff > 0 ? "tournament_prize" : "prize_deducted",
              prizeDiff > 0 ? `Prize Won: ${tourney.title}` : `Prize Adjusted: ${tourney.title}`,
            );
          if (oldPrize === 0 && awardedPrize > 0) {
            const positionMsg = tourney.mode === "Solo"
              ? `Position: ${r.matchPosition}`
              : tourney.mode === "Duo"
                ? `Match Position: ${r.matchPosition}`
                : `Points: ${r.calculatedPoints} (${r.killsNum} kills, position ${r.matchPosition})`;
            await tx
              .prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)")
              .run(
                r.user_id,
                `💰 Prize earned for ${tourney.title}: ${awardedPrize} CG Coins awarded for finishing #${rankForPrize}. ${positionMsg}.`,
                "/wallet",
              );
          } else if (prizeDiff > 0) {
            const msg = tourney.mode === "Duo"
              ? `your new prize is ${awardedPrize}.`
              : tourney.mode === "Solo"
                ? `your rank is ${r.matchPosition}.`
                : `your points remain ${r.calculatedPoints}.`;
            await tx
              .prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)")
              .run(
                r.user_id,
                `💰 Prize updated for ${tourney.title}: your prize increased by ${prizeDiff} CG Coins to ${awardedPrize}. ${msg}`,
                "/wallet",
              );
          } else if (prizeDiff < 0) {
            const msg = tourney.mode === "Duo"
              ? `your new prize is ${awardedPrize}.`
              : tourney.mode === "Solo"
                ? `your rank is ${r.matchPosition}.`
                : `your points remain ${r.calculatedPoints}.`;
            await tx
              .prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)")
              .run(
                r.user_id,
                `📉 Prize updated for ${tourney.title}: your prize decreased by ${Math.abs(prizeDiff)} CG Coins to ${awardedPrize}. ${msg}`,
                "/wallet",
              );
          }
        }

        const pointsDiff = r.calculatedPoints - oldPoints;
        if (oldPoints === 0 && r.calculatedPoints > 0) {
          await tx
            .prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)")
            .run(
              r.user_id,
              `🏆 Match scored for ${tourney.title}: ${r.calculatedPoints} points earned with ${r.killsNum} kills and position ${r.matchPosition}. Final rank #${overallRank}.`,
              "/leaderboard",
            );
        } else if (pointsDiff !== 0) {
          const dir = pointsDiff > 0 ? "increased" : "decreased";
          await tx
            .prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)")
            .run(
              r.user_id,
              `📊 Score updated for ${tourney.title}: points ${dir} by ${Math.abs(pointsDiff)} to ${r.calculatedPoints}.`,
              "/leaderboard",
            );
        }
      }

      // Optionally mark tournament as finished here if you want
      await tx
        .prepare("UPDATE tournaments SET status = 'completed' WHERE id = ?")
        .run(tournamentId);
    });
    return { success: true };
  },
);

export const rescheduleTournament = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const id = data as unknown as number;

  await db.transaction(async (tx) => {
    const tourney = (await tx.prepare("SELECT title FROM tournaments WHERE id = ?").get(id)) as any;
    if (!tourney) throw new Error("Tournament not found");

    await tx.prepare("UPDATE tournaments SET status = 'rescheduled' WHERE id = ?").run(id);
    await tx
      .prepare(
        "UPDATE registrations SET kills = 0, position = 0, points = 0 WHERE tournament_id = ?",
      )
      .run(id);

    const registrations = (await tx
      .prepare("SELECT user_id FROM registrations WHERE tournament_id = ?")
      .all(id)) as any[];
    const insertNotif = tx.prepare("INSERT INTO notifications (user_id, message) VALUES (?, ?)");
    const notifMsg = `⚠️ The match ${tourney.title} has been RESCHEDULED. Please check your Upcoming Matches.`;

    for (const r of registrations) {
      await insertNotif.run(r.user_id, notifMsg);
    }
  });

  // Clear tournaments cache to ensure updated data is fetched
  const { apiCache } = await import("./lib/cache");
  apiCache.delete('tournaments');

  return { success: true };
});

export const getGlobalLeaderboard = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./lib/db");
  const { apiCache } = await import("./lib/cache");

  const cacheKey = 'global-leaderboard';
  const cached = apiCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  await db.prepare(
    `
      CREATE TABLE IF NOT EXISTS leaderboard_overrides (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        week_start TIMESTAMP NOT NULL,
        points INTEGER NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, week_start)
      )
    `,
  ).run();

  // Migration: Fix existing table if it has wrong id column type
  try {
    const tableInfo = await db.prepare(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'leaderboard_overrides' AND column_name = 'id'
    `).get();

    if (tableInfo && tableInfo.data_type === 'integer' && !tableInfo.column_default?.includes('nextval')) {
      // Table exists with wrong schema, recreate it
      await db.prepare(`DROP TABLE leaderboard_overrides`).run();
      await db.prepare(
        `
          CREATE TABLE leaderboard_overrides (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            week_start TIMESTAMP NOT NULL,
            points INTEGER NOT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, week_start)
          )
        `,
      ).run();
    }
  } catch (e) {
    // Ignore migration errors, table might not exist yet
  }

  const rows = (await db
    .prepare(
      `
      SELECT
        u.id as user_id,
        u.username as ign,
        COALESCE(SUM(r.kills), 0) as kills,
        COALESCE(MAX(lo.points), COALESCE(SUM(r.points), 0)) as points,
        SUM(CASE WHEN r.position = 1 THEN 1 ELSE 0 END) as wins
      FROM users u
      INNER JOIN registrations r ON r.user_id = u.id AND r.created_at >= date_trunc('week', CURRENT_TIMESTAMP)
      INNER JOIN tournaments t ON t.id = r.tournament_id AND t.mode = 'Squad'
      LEFT JOIN leaderboard_overrides lo ON lo.user_id = u.id AND lo.week_start = date_trunc('week', CURRENT_TIMESTAMP)
      GROUP BY u.id, u.username
      HAVING COALESCE(MAX(lo.points), COALESCE(SUM(r.points), 0)) > 0
      ORDER BY points DESC, kills DESC
    `,
    )
    .all()) as any[];

  for (let i = 0; i < rows.length; i++) {
    const t = (await db
      .prepare(
        `
        SELECT t.name
        FROM team_members tm
        JOIN teams t ON t.id = tm.team_id
        WHERE tm.user_id = ?
      `,
      )
      .get(rows[i].user_id)) as any;
    if (!t) {
      const t2 = (await db
        .prepare("SELECT name FROM teams WHERE leader_id = ?")
        .get(rows[i].user_id)) as any;
      rows[i].team = t2 ? t2.name : "Free Agent";
    } else {
      rows[i].team = t.name;
    }
    rows[i].rank = i + 1;

    if (rows[i].rank === 1) rows[i].badge = "god";
    else if (rows[i].rank <= 3) rows[i].badge = "elite";
    else rows[i].badge = "none";
  }

  apiCache.set(cacheKey, rows, 5 * 60 * 1000); // Cache for 5 minutes

  return rows;
});

export const updateLeaderboardPoints = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const { db } = await import("./lib/db");
    const { userId, points } = data as any;
    const targetPoints = Number(points);
    if (Number.isNaN(targetPoints) || targetPoints < 0) {
      throw new Error("Points must be a valid non-negative number.");
    }

    await db.prepare(
      `
        CREATE TABLE IF NOT EXISTS leaderboard_overrides (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          week_start TIMESTAMP NOT NULL,
          points INTEGER NOT NULL,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, week_start)
        )
      `,
    ).run();

    // Migration: Fix existing table if it has wrong id column type
    try {
      const tableInfo = await db.prepare(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'leaderboard_overrides' AND column_name = 'id'
      `).get();
      
      if (tableInfo && tableInfo.data_type === 'integer' && !tableInfo.column_default?.includes('nextval')) {
        // Table exists with wrong schema, recreate it
        await db.prepare(`DROP TABLE leaderboard_overrides`).run();
        await db.prepare(
          `
            CREATE TABLE leaderboard_overrides (
              id SERIAL PRIMARY KEY,
              user_id INTEGER NOT NULL,
              week_start TIMESTAMP NOT NULL,
              points INTEGER NOT NULL,
              updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(user_id, week_start)
            )
          `,
        ).run();
      }
    } catch (e) {
      // Ignore migration errors, table might not exist yet
    }

    const weekRow = (await db
      .prepare("SELECT date_trunc('week', CURRENT_TIMESTAMP) as week_start")
      .get()) as any;
    const weekStart = weekRow?.week_start;
    if (!weekStart) {
      throw new Error("Unable to determine current week period.");
    }

    const existing = await db
      .prepare(
        "SELECT id FROM leaderboard_overrides WHERE user_id = ? AND week_start = ?",
      )
      .get(userId, weekStart);

    if (existing) {
      await db
        .prepare(
          "UPDATE leaderboard_overrides SET points = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        )
        .run(targetPoints, existing.id);
    } else {
      await db
        .prepare(
          "INSERT INTO leaderboard_overrides (user_id, week_start, points) VALUES (?, ?, ?)")
        .run(userId, weekStart, targetPoints);
    }

    await db
      .prepare("INSERT INTO notifications (user_id, message) VALUES (?, ?)")
      .run(
        userId,
        `📊 Admin adjusted your leaderboard display points to ${targetPoints} for this week. Match standings remain unchanged.`,
      );

    return { success: true };
  },
);

export const resolveTournamentRequest = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const { db } = await import("./lib/db");
    const { requestId, status } = data as any;

    await db.transaction(async (tx) => {
      const req = (await tx
        .prepare("SELECT * FROM tournament_requests WHERE id = ?")
        .get(requestId)) as any;
      if (!req) throw new Error("Request not found");
      if (req.status !== "pending") throw new Error("Request already resolved");

      await tx
        .prepare("UPDATE tournament_requests SET status = ? WHERE id = ?")
        .run(status, requestId);
      await tx
        .prepare(
          "UPDATE notifications SET action_type = 'resolved' WHERE action_type = 'tournament_request' AND action_data = ?",
        )
        .run(requestId.toString());

      const tourney = (await tx
        .prepare("SELECT title, entry FROM tournaments WHERE id = ?")
        .get(req.tournament_id)) as any;
      const insertNotif = tx.prepare("INSERT INTO notifications (user_id, message) VALUES (?, ?)");

      if (status === "approved") {
        await tx
          .prepare(
            `
          INSERT INTO registrations (user_id, tournament_id, team_name, players_json, contact_email, contact_phone)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
          )
          .run(
            req.requested_by,
            req.tournament_id,
            req.team_name,
            req.players_json,
            req.contact_email,
            req.contact_phone,
          );

        const requestPlayers = 1; // 1 registration = 1 slot filled
        await tx
          .prepare("UPDATE tournaments SET filled = filled + ? WHERE id = ?")
          .run(requestPlayers, req.tournament_id);

        await insertNotif.run(
          req.requested_by,
          `🎉 Your Captain has approved the tournament registration for ${tourney.title}!`,
        );

        const members = (await tx
          .prepare("SELECT user_id FROM team_members WHERE team_id = ? AND user_id IS NOT NULL")
          .all(req.team_id)) as any[];
        for (const m of members) {
          if (m.user_id !== req.requested_by) {
            await insertNotif.run(
              m.user_id,
              `🏆 Your Captain has registered your team for ${tourney.title}! Check your matches.`,
            );
          }
        }
      } else {
        if (tourney.entry > 0) {
          await tx
            .prepare("UPDATE users SET deposit_balance = deposit_balance + ? WHERE id = ?")
            .run(tourney.entry, req.requested_by);
          await tx
            .prepare(
              "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
            )
            .run(req.requested_by, tourney.entry, "refund", `Refund: ${tourney.title} Rejected`);
          await insertNotif.run(
            req.requested_by,
            `❌ Your Captain has rejected the tournament registration for ${tourney.title}. Your entry fee of ${tourney.entry} CG Coins has been refunded to your Deposit Balance.`,
          );
        } else {
          await insertNotif.run(
            req.requested_by,
            `❌ Your Captain has rejected the tournament registration for ${tourney.title}.`,
          );
        }
      }
    });
    return { success: true };
  },
);

export const processWithdrawal = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const { userId, amount, upiId, upiNumber } = data as unknown as {
    userId: number;
    amount: number;
    upiId: string;
    upiNumber: string;
  };

  await db.transaction(async (tx) => {
    const user = (await tx
      .prepare("SELECT winning_balance, banned FROM users WHERE id = ?")
      .get(userId)) as any;
    if (!user) throw new Error("User not found");
    if (user.banned) throw new Error("Account is banned. Cannot process withdrawal.");
    if (user.winning_balance < amount)
      throw new Error("Insufficient Earned Coins to withdraw this amount.");
    if (amount <= 0) throw new Error("Withdraw amount must be greater than 0.");

    await tx
      .prepare("UPDATE users SET winning_balance = winning_balance - ? WHERE id = ?")
      .run(amount, userId);
    await tx
      .prepare("INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)")
      .run(userId, amount, "withdrawal", `Withdrawal Requested`);

    await tx
      .prepare("INSERT INTO withdrawals (user_id, amount, upi_id, upi_number) VALUES (?, ?, ?, ?)")
      .run(userId, amount, upiId, upiNumber);

    await tx
      .prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)")
      .run(
        userId,
        `💸 Withdrawal requested: ${amount} CG Coins to UPI ${upiId}. Processing time 2-3 working days.`,
        "/wallet",
      );
  });
  return { success: true };
});

export const getPayouts = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./lib/db");
  return db
    .prepare(
      `
      SELECT w.*, u.username, u.email, u.phone 
      FROM withdrawals w 
      JOIN users u ON w.user_id = u.id 
      ORDER BY w.created_at DESC
    `,
    )
    .all();
});

export const updatePayoutStatus = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const { payoutId, status, userId, amount } = data as unknown as {
    payoutId: number;
    status: string;
    userId: number;
    amount: number;
  };

  await db.transaction(async (tx) => {
    await tx.prepare("UPDATE withdrawals SET status = ? WHERE id = ?").run(status, payoutId);

    if (status === "completed") {
      await tx
        .prepare("INSERT INTO notifications (user_id, message) VALUES (?, ?)")
        .run(
          userId,
          `✅ Withdrawal completed: ${amount} CG Coins has been sent to your UPI. Please check your bank statement.`,
        );
    } else if (status === "rejected") {
      // Refund the coins
      await tx
        .prepare("UPDATE users SET winning_balance = winning_balance + ? WHERE id = ?")
        .run(amount, userId);
      await tx
        .prepare(
          "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
        )
        .run(userId, amount, "refund", `Withdrawal Refunded`);
      await tx
        .prepare("INSERT INTO notifications (user_id, message) VALUES (?, ?)")
        .run(
          userId,
          `❌ Your withdrawal of ${amount} CG Coins was rejected. The coins have been refunded to your wallet.`,
        );
    }
  });
  return { success: true };
});

export const deleteUser = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const { id } = data as unknown as { id: number };

  // First, clear any sessions for this user so they are immediately logged out
  await db.prepare("DELETE FROM sessions WHERE user_id = $1").run(id);

  // Then delete the user (cascade deletes will handle the rest)
  await db.prepare("DELETE FROM users WHERE id = $1").run(id);

  return { success: true };
});

export const banUser = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const { id } = data as unknown as { id: number };

  // Set banned to true
  await db.prepare("UPDATE users SET banned = true WHERE id = $1").run(id);

  // Clear any sessions for this user so they are immediately logged out
  await db.prepare("DELETE FROM sessions WHERE user_id = $1").run(id);

  return { success: true };
});

export const deleteAllUsers = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  // Only keep admin (assuming role = 'admin')
  await db.prepare("DELETE FROM users WHERE role != 'admin'").run();
  return { success: true };
});

export const deleteAllTournaments = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  await db.prepare("DELETE FROM tournaments").run();
  return { success: true };
});

export const saveContactMessage = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const { name, email, message } = data as any;
  await db
    .prepare("INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)")
    .run(name, email, message);
  return { success: true };
});

export const getContactMessages = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./lib/db");
  return await db.prepare("SELECT * FROM contact_messages ORDER BY created_at DESC").all();
});

export const getTransactions = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const userId = data as unknown as number;
  return await db
    .prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10")
    .all(userId);
});

export const addDepositRazorpay = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const { userId, amount, paymentId } = data as any;
    
    await db.transaction(async (tx: any) => {
      await tx.prepare('UPDATE users SET deposit_balance = deposit_balance + ? WHERE id = ?').run(amount, userId);
      await tx.prepare('INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)').run(userId, amount, 'deposit_added', `Added Cash via Razorpay (${paymentId})`);
    });
    return { success: true };
  });
