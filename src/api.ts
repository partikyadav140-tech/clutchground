"use server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getEnvVar } from "./lib/env";
import { getCurrentUser as getCurrentUserImpl } from "./lib/auth-server";
export { getWalletBalance, getTransactionHistory } from "./lib/razorpay";
export { createUpiDeposit, submitUpiUtr, getPendingUpiDeposits, approveUpiDeposit, rejectUpiDeposit, getUserUpiDeposits, getActiveUpiConfig } from "./lib/upi";

export async function getCurrentUser(requiredRole?: "admin" | "user", dataSessionId?: string) {
  return getCurrentUserImpl(requiredRole, dataSessionId);
}

// ─── Cloudinary Image Upload ───────────────────────────────────────────────
export const uploadImage = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { uploadToCloudinary } = await import("./lib/cloudinary");
  const { base64, folder } = data as unknown as { base64: string; folder?: string };
  if (!base64) throw new Error("No image data provided");
  const url = await uploadToCloudinary(base64, folder || "clutchground");
  return { url };
});

export const deleteImage = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { deleteFromCloudinary } = await import("./lib/cloudinary");
  const { url } = data as unknown as { url: string };
  if (!url) throw new Error("No image URL provided");
  const success = await deleteFromCloudinary(url);
  return { success };
});

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

  // Use scrypt verification and handle legacy plaintext auto-upgrading
  const { verifyPassword, hashPassword } = await import("./lib/auth-crypto");
  if (!user.password.includes(":")) {
    if (user.password === password) {
      // Auto-upgrade plaintext to secure hash
      const hashedPassword = hashPassword(password);
      await db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, user.id);
      user.password = hashedPassword;
      console.log(`[Auth] Auto-upgraded password hash for user: ${user.username}`);
    } else {
      console.log("Plaintext password mismatch for user:", user.username);
      throw new Error("Invalid phone number or password");
    }
  } else {
    if (!verifyPassword(password, user.password)) {
      console.log("Hashed password verification failed for user:", user.username);
      throw new Error("Invalid phone number or password");
    }
  }

  if (user.banned) {
    throw new Error("This account has been banned by the administrator due to violation of terms of service and illegal activities. Please contact support for assistance.");
  }

  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(); // 7 days

  await db
    .prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
    .run(sessionId, user.id, expiresAt);

  return { sessionId, user: { 
    id: user.id, 
    username: user.username, 
    role: user.role,
    ign: user.ign,
    uid: user.uid,
    email: user.email,
    phone: user.phone,
    avatar_url: user.avatar_url,
    deposit_balance: user.deposit_balance,
    winning_balance: user.winning_balance,
    upi_id: user.upi_id
  } };
});

export const signupUser = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const { username, password, ign, uid, email, phone, security_question, security_answer } = data as any;
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

  const { hashPassword } = await import("./lib/auth-crypto");
  const hashedPassword = hashPassword(password);

  const insertStmt = db.prepare(
    "INSERT INTO users (username, password, ign, uid, email, phone, security_question, security_answer) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const result = await insertStmt.run(
    username,
    hashedPassword,
    ign || null,
    uid || null,
    email || null,
    normalizedPhone,
    security_question || null,
    security_answer || null,
  );
  const userId = result.lastInsertRowid;

  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

  await db
    .prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
    .run(sessionId, userId, expiresAt);

  return { sessionId, user: { id: userId, username, role: "user" } };
});

export const resetPassword = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const { phone, security_question, security_answer, new_password } = data as any;
  const normalizedPhone = typeof phone === "string" ? phone.trim() : phone;

  const user = await db.prepare("SELECT id, security_question, security_answer FROM users WHERE phone = ?").get(normalizedPhone) as any;
  if (!user) {
    throw new Error("No user found with this phone number");
  }

  // Ensure case-insensitive comparison for answer, trim whitespace
  const storedAnswer = (user.security_answer || "").toLowerCase().trim();
  const providedAnswer = (security_answer || "").toLowerCase().trim();

  if (user.security_question !== security_question || storedAnswer !== providedAnswer) {
    throw new Error("Incorrect security question or answer");
  }

  const { hashPassword } = await import("./lib/auth-crypto");
  const hashedPassword = hashPassword(new_password);

  await db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, user.id);
  return { success: true };
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

    const { hashPassword } = await import("./lib/auth-crypto");
    const hashedPassword = hashPassword("admin123");

    // Create new admin user
    const insertStmt = db.prepare(
      "INSERT INTO users (username, password, role, phone) VALUES (?, ?, ?, ?)",
    );
    const result = await insertStmt.run('admin', hashedPassword, 'admin', '8307224756');
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
      SELECT users.id, users.username, users.role, users.deposit_balance, users.winning_balance, users.banned, users.ign, users.uid, users.email, users.phone, users.avatar_url, users.upi_id, users.security_question
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
  await getCurrentUser("admin");
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
  await getCurrentUser("admin");
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
    tournament_type,
    entry_fee,
    prize_pool,
    open_slots,
  } = data as unknown as any;

  // Generate unique tournament code (CG-XXXXXX)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let tournament_code = "";
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = "CG-";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    const existing = await db.prepare("SELECT id FROM tournaments WHERE tournament_code = ?").get(code);
    if (!existing) { tournament_code = code; break; }
  }
  if (!tournament_code) tournament_code = "CG-" + Date.now().toString(36).toUpperCase().slice(-6);

  const stmt = db.prepare(`
      INSERT INTO tournaments (title, game, mode, format, entry, prize, slots, filled, startsAt, status, banner, room_id, room_pass, hosted_by, per_kill_coin, first_place_coin, tournament_type, entry_fee, prize_pool, open_slots, tournament_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    tournament_type || "battle_royale",
    entry_fee || 0,
    prize_pool || 0,
    open_slots || 0,
    tournament_code,
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

    // Asynchronously push to all users
    (async () => {
      try {
        const { triggerPushNotification } = await import("./lib/push-server");
        for (const user of users as any[]) {
          triggerPushNotification(
            user.id,
            "📣 New Tournament Announced!",
            `📣 New tournament: ${title} (${mode} / ${format}) is open for registration!`,
            "/tournaments"
          ).catch(() => {});
        }
      } catch(e) {}
    })();
  }

  // Clear tournaments cache to ensure new tournament appears
  const { apiCache } = await import("./lib/cache");
  apiCache.delete('tournaments');

  return { success: true };
});

export const updateTournament = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  await getCurrentUser("admin");
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
    tournament_type,
    entry_fee,
    prize_pool,
    open_slots,
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
      SET title=?, game=?, mode=?, format=?, entry=?, prize=?, slots=?, filled=?, startsAt=?, status=?, banner=?, room_id=?, room_pass=?, hosted_by=?, per_kill_coin=?, first_place_coin=?, tournament_type=?, entry_fee=?, prize_pool=?, open_slots=?
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
    tournament_type || "battle_royale",
    entry_fee || 0,
    prize_pool || 0,
    open_slots || 0,
    id,
  );

  if ((room_id && room_id !== old?.room_id) || (room_pass && room_pass !== old?.room_pass)) {
    const registrations = (await db
      .prepare("SELECT user_id, players_json FROM registrations WHERE tournament_id = ?")
      .all(id)) as any[];
    const { sendNotificationHelper } = await import("./lib/push-server");
    const notifMsg =
      `🔑 Room details for ${title} updated! ` +
      (room_id ? `ID: ${room_id} ` : "") +
      (room_pass ? `Pass: ${room_pass}` : "");
    
    const notifiedUsers = new Set<number>();
    for (const r of registrations) {
      if (!notifiedUsers.has(r.user_id)) {
        await sendNotificationHelper(r.user_id, notifMsg.trim(), `/tournaments/${id}`);
        notifiedUsers.add(r.user_id);
      }
      if (r.players_json) {
        try {
          const players = JSON.parse(r.players_json);
          for (const p of players) {
            if (p.uid) {
              const u = await db.prepare("SELECT id FROM users WHERE uid = ?").get(p.uid) as any;
              if (u && !notifiedUsers.has(u.id)) {
                await sendNotificationHelper(u.id, notifMsg.trim(), `/tournaments/${id}`);
                notifiedUsers.add(u.id);
              }
            }
          }
        } catch(e) {}
      }
    }
  }

  // Clear tournaments cache to ensure updated data is fetched
  const { apiCache } = await import("./lib/cache");
  apiCache.delete('tournaments');

  return { success: true };
});

export const deleteTournament = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  await getCurrentUser("admin");
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
  await getCurrentUser("admin");
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
    const caller = await getCurrentUser();
    const { db } = await import("./lib/db");
    const { userId: clientUserId, tournamentId, teamName, players, contactEmail, contactPhone } = data as any;
    const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;

    // Check if user is banned
    const userCheck = (await db
      .prepare("SELECT banned FROM users WHERE id = ?")
      .get(userId)) as any;
    if (!userCheck) throw new Error("User not found");
    if (userCheck.banned) throw new Error("Account is banned. Cannot register for tournaments.");

    // Check if tournament exists and has slots
    const t = (await db
      .prepare("SELECT title, startsAt, mode, format, entry, entry_fee, filled, slots, status, tournament_type FROM tournaments WHERE id = ?")
      .get(tournamentId)) as any;
    if (!t) throw new Error("Tournament not found");
    if (t.status === "locked") throw new Error("Tournament is locked and no longer accepting registrations");
    if (t.filled >= t.slots) throw new Error("Tournament is full");

    // Determine entry fee based on tournament type
    const entryFee = t.tournament_type === "clash_squad" || t.tournament_type === "lone_wolf" 
      ? (t.entry_fee || 0) 
      : (t.entry || 0);

    // Validate tournament_type and mode match
    if (t.tournament_type === "clash_squad" && t.mode !== "Squad") {
      throw new Error("Invalid tournament configuration: Clash Squad requires Squad mode");
    }
    if (t.tournament_type === "lone_wolf" && t.mode !== "Solo") {
      throw new Error("Invalid tournament configuration: Lone Wolf requires Solo mode");
    }
    if (t.tournament_type === "battle_royale") {
      if (!["Solo", "Duo", "Squad"].includes(t.mode)) {
        throw new Error("Invalid mode for Battle Royale");
      }
    }

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

    // Collect push targets; fired after transaction to avoid DB lock issues
    const pushTargets: Array<{ userId: number; title: string; body: string; url: string }> = [];

    await db.transaction(async (tx) => {
      // Handle Entry Fee Deduction
      if (entryFee > 0) {
        const user = (await tx
          .prepare("SELECT deposit_balance, winning_balance FROM users WHERE id = ?")
          .get(userId)) as any;
        if (!user) throw new Error("User not found");

        if (user.deposit_balance + user.winning_balance < entryFee) {
          throw new Error(`Insufficient funds. You need ${entryFee} CG Coins.`);
        }

        let remaining = entryFee;
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
          .run(userId, entryFee, "tournament_entry", `Entry Fee: ${t.title}`);
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
        // Queue push to captain for after-transaction firing
        if (leaderId) {
          pushTargets.push({
            userId: leaderId as number,
            title: "🎮 ClutchGround",
            body: `⚠️ ${requester.username} wants to register your team for ${tourney.title}. Tap to approve.`,
            url: `/tournaments/${tournamentId}`,
          });
        }
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
            `✅ Registration confirmed for ${t.title} (${t.mode}). Entry fee ${entryFee} CG. See your Upcoming Matches and prepare to compete!`,
            "/matches",
          );
        // Queue push to registrant
        pushTargets.push({
          userId,
          title: "🎮 ClutchGround",
          body: `✅ You're registered for ${t.title}! Check Upcoming Matches.`,
          url: "/matches",
        });

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
              // Queue push to each team member
              pushTargets.push({
                userId: m.user_id,
                title: "🎮 ClutchGround",
                body: `🏆 ${requester.username} registered your team for ${t.title}! Check Upcoming Matches.`,
                url: "/matches",
              });
            }
          }
        }
      }
    });

    // Fire push notifications after transaction commits
    try {
      const { triggerPushNotification } = await import("./lib/push-server");
      for (const target of pushTargets) {
        triggerPushNotification(target.userId, target.title, target.body, target.url).catch((e) =>
          console.error("[Push] Registration notification failed:", e),
        );
      }
    } catch (e) {
      console.error("[Push] Failed to import push-server for registration:", e);
    }

    // Clear tournaments cache to ensure filled count is updated
    const { apiCache } = await import("./lib/cache");
    apiCache.delete('tournaments');

    return { success: true };
  },
);

export const getRegistrations = createServerFn({ method: "GET" }).handler(async () => {
  await getCurrentUser("admin");
  const { db } = await import("./lib/db");
  return db
    .prepare(
      `
      SELECT r.*, u.username, u.avatar_url
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `,
    )
    .all();
});

export const checkUserRegistration = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const caller = await getCurrentUser();
    const { db } = await import("./lib/db");
    const { userId: clientUserId, tournamentId } = data as any;
    const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;
    
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

const PROFILE_SELECT = `
  id, username, role, ign, uid, email, phone, avatar_url, banner_url, banner_preset,
  profile_animation, profile_frame, profile_effect, owned_cosmetics, showcase_achievements,
  created_at, deposit_balance, winning_balance, upi_id
`;

async function enrichProfile(db: any, profile: any, includePrivate = true) {
  if (!profile) return null;
  const { computeAchievements, parseJsonArray } = await import("./lib/profile-customization");

  let team = (await db.prepare("SELECT * FROM teams WHERE leader_id = ?").get(profile.id)) as any;
  if (!team) {
    const member = (await db
      .prepare("SELECT t.* FROM team_members tm JOIN teams t ON t.id = tm.team_id WHERE tm.user_id = ? LIMIT 1")
      .get(profile.id)) as any;
    team = member || null;
  }

  const stats = await getPlayerStatsHandler(profile.id, db);
  const isCaptain = team?.leader_id === profile.id;
  const achievements = computeAchievements({ ...stats, isCaptain });
  const showcase = parseJsonArray(profile.showcase_achievements);
  const owned = parseJsonArray(profile.owned_cosmetics);

  const out: any = {
    ...profile,
    owned_cosmetics: owned,
    showcase_achievements: showcase,
    team: team ? { id: team.id, name: team.name, logo: team.logo, leader_id: team.leader_id } : null,
    stats,
    achievements,
    showcase: achievements.filter((a) => showcase.includes(a.id)),
  };

  if (!includePrivate) {
    delete out.email;
    delete out.phone;
    delete out.upi_id;
    delete out.deposit_balance;
    delete out.winning_balance;
  }
  return out;
}

async function getPlayerStatsHandler(userId: number, db: any) {
  try {
    const matchesPlayedRes = (await db
      .prepare(
        `SELECT COUNT(*) as count FROM registrations r
         JOIN tournaments t ON r.tournament_id = t.id
         WHERE r.user_id = ? AND t.results_announced = true`,
      )
      .get(userId)) as any;
    const matchesPlayed = Number(matchesPlayedRes?.count || 0);

    const agg = (await db
      .prepare(
        `SELECT COALESCE(SUM(r.kills),0) as kills, COALESCE(SUM(r.awarded_prize),0) as earnings,
                SUM(CASE WHEN r.position = 1 THEN 1 ELSE 0 END) as firsts
         FROM registrations r JOIN tournaments t ON r.tournament_id = t.id
         WHERE r.user_id = ? AND t.results_announced = true`,
      )
      .get(userId)) as any;

    return {
      matchesPlayed,
      totalKills: Number(agg?.kills || 0),
      totalEarnings: Number(agg?.earnings || 0),
      firstPlaces: Number(agg?.firsts || 0),
      top3: 0,
      kdRatio: matchesPlayed > 0 ? (Number(agg?.kills || 0) / matchesPlayed).toFixed(2) : "0.00",
      winRate: matchesPlayed > 0 ? Math.round((Number(agg?.firsts || 0) / matchesPlayed) * 100) : 0,
      history: [],
    };
  } catch {
    return {
      matchesPlayed: 0,
      totalKills: 0,
      totalEarnings: 0,
      firstPlaces: 0,
      top3: 0,
      kdRatio: "0.00",
      winRate: 0,
      history: [],
    };
  }
}

export const updateProfile = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const {
    userId: clientUserId,
    ign,
    uid,
    email,
    phone,
    avatar_url,
    banner_url,
    banner_preset,
    profile_animation,
    profile_frame,
    profile_effect,
    showcase_achievements,
  } = data as any;

  const fields: string[] = [];
  const values: any[] = [];

  if (ign !== undefined) {
    fields.push("ign = ?");
    values.push(ign);
  }
  if (uid !== undefined) {
    fields.push("uid = ?");
    values.push(uid);
  }
  if (email !== undefined) {
    fields.push("email = ?");
    values.push(email);
  }
  if (phone !== undefined) {
    fields.push("phone = ?");
    values.push(phone);
  }

  if (avatar_url !== undefined) {
    fields.push("avatar_url = ?");
    values.push(avatar_url);
  }
  if (banner_url !== undefined) {
    fields.push("banner_url = ?");
    values.push(banner_url);
  }
  if (banner_preset !== undefined) {
    fields.push("banner_preset = ?");
    values.push(banner_preset);
  }
  if (profile_animation !== undefined) {
    fields.push("profile_animation = ?");
    values.push(profile_animation);
  }
  if (profile_frame !== undefined) {
    fields.push("profile_frame = ?");
    values.push(profile_frame);
  }
  if (profile_effect !== undefined) {
    fields.push("profile_effect = ?");
    values.push(profile_effect);
  }
  if (showcase_achievements !== undefined) {
    fields.push("showcase_achievements = ?");
    values.push(JSON.stringify(showcase_achievements));
  }

  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;
  if (fields.length > 0) {
    values.push(userId);
    await db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  }
  return { success: true };
});

export const getProfile = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const clientUserId = data as unknown as number;
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;
  const profile = (await db.prepare(`SELECT ${PROFILE_SELECT} FROM users WHERE id = ?`).get(userId)) as any;
  return enrichProfile(db, profile, true);
});

export const getPublicProfile = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const userId = data as unknown as number;
  try {
    const profile = (await db.prepare(`SELECT ${PROFILE_SELECT} FROM users WHERE id = ? AND COALESCE(banned, false) = false`).get(userId)) as any;
    if (!profile || profile.role === "admin") return null;
    return enrichProfile(db, profile, false);
  } catch (e) {
    console.error("getPublicProfile error:", e);
    return null;
  }
});

export const getPlayerStats = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const userId = data as unknown as number;

  try {
    const stats = await db.transaction(async (tx) => {
      // 1. Matches played
      const matchesPlayedRes = await tx
        .prepare(`
          SELECT COUNT(*) as count 
          FROM registrations r
          JOIN tournaments t ON r.tournament_id = t.id
          WHERE r.user_id = ? AND t.results_announced = true
        `)
        .get(userId) as any;
      const matchesPlayed = Number(matchesPlayedRes?.count || 0);

      // 2. Total Kills
      const totalKillsRes = await tx
        .prepare(`
          SELECT SUM(r.kills) as sum 
          FROM registrations r
          JOIN tournaments t ON r.tournament_id = t.id
          WHERE r.user_id = ? AND t.results_announced = true
        `)
        .get(userId) as any;
      const totalKills = Number(totalKillsRes?.sum || 0);

      // 3. Total Earnings
      const totalEarningsRes = await tx
        .prepare(`
          SELECT SUM(r.awarded_prize) as sum 
          FROM registrations r
          JOIN tournaments t ON r.tournament_id = t.id
          WHERE r.user_id = ? AND t.results_announced = true
        `)
        .get(userId) as any;
      const totalEarnings = Number(totalEarningsRes?.sum || 0);

      // 4. First place count
      const firstPlacesRes = await tx
        .prepare(`
          SELECT COUNT(*) as count 
          FROM registrations r
          JOIN tournaments t ON r.tournament_id = t.id
          WHERE r.user_id = ? AND r.position = 1 AND t.results_announced = true
        `)
        .get(userId) as any;
      const firstPlaces = Number(firstPlacesRes?.count || 0);

      // 5. Top 3 count
      const top3Res = await tx
        .prepare(`
          SELECT COUNT(*) as count 
          FROM registrations r
          JOIN tournaments t ON r.tournament_id = t.id
          WHERE r.user_id = ? AND r.position > 0 AND r.position <= 3 AND t.results_announced = true
        `)
        .get(userId) as any;
      const top3 = Number(top3Res?.count || 0);

      // 6. Win history (recent matches) for dynamic chart
      const history = await tx
        .prepare(`
          SELECT r.created_at, r.kills, r.position, r.awarded_prize, t.title as tournament_title 
          FROM registrations r
          JOIN tournaments t ON r.tournament_id = t.id
          WHERE r.user_id = ? AND t.results_announced = true
          ORDER BY r.created_at DESC 
          LIMIT 10
        `)
        .all(userId) as any[];

      return {
        matchesPlayed,
        totalKills,
        totalEarnings,
        firstPlaces,
        top3,
        kdRatio: matchesPlayed > 0 ? (totalKills / matchesPlayed).toFixed(2) : "0.00",
        winRate: matchesPlayed > 0 ? Math.round((firstPlaces / matchesPlayed) * 100) : 0,
        history: history ? history.reverse() : [], // reverse to make timeline chronological (left to right)
      };
    });

    return stats;
  } catch (err) {
    console.error("Failed to fetch player stats:", err);
    return {
      matchesPlayed: 0,
      totalKills: 0,
      totalEarnings: 0,
      firstPlaces: 0,
      top3: 0,
      kdRatio: "0.00",
      winRate: 0,
      history: [],
    };
  }
});

export const updateCoinBalance = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  await getCurrentUser("admin");
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
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const clientUserId = data as unknown as number;
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;
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
      SELECT tm.*, u.username, u.avatar_url
      FROM team_members tm
      LEFT JOIN users u ON u.id = tm.user_id
      WHERE tm.team_id = ?
    `,
    )
    .all(team.id);
  const leader = await db
    .prepare("SELECT username, ign, uid, avatar_url FROM users WHERE id = ?")
    .get(team.leader_id);
  return { ...team, members, leader };
});

export const saveMyTeam = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const { userId: clientUserId, teamName, logo, members } = data as any;
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;
  const removedMembers: number[] = [];
  const rosterMembers = Array.isArray(members) ? members : null;

  await db.transaction(async (tx) => {
    let team = (await tx.prepare("SELECT id FROM teams WHERE leader_id = ?").get(userId)) as any;
    let teamId;
    let existingMembers: any[] = [];

    if (team) {
      teamId = team.id;
      await tx
        .prepare("UPDATE teams SET name = ?, logo = ? WHERE id = ?")
        .run(teamName, logo || "", teamId);

      if (rosterMembers) {
        existingMembers = (await tx
          .prepare("SELECT uid, user_id FROM team_members WHERE team_id = ? AND user_id IS NOT NULL")
          .all(teamId)) as any[];
        await tx.prepare("DELETE FROM team_members WHERE team_id = ?").run(teamId);
      }
    } else {
      const res = await tx
        .prepare("INSERT INTO teams (name, leader_id, logo) VALUES (?, ?, ?)")
        .run(teamName, userId, logo || "");
      teamId = res.lastInsertRowid;
    }

    if (!rosterMembers) return;

    const insertMember = tx.prepare(
      "INSERT INTO team_members (team_id, user_id, ign, uid, role) VALUES (?, ?, ?, ?, ?)",
    );
    const newUids = new Set(rosterMembers.filter((m: any) => m.ign && m.uid).map((m: any) => m.uid));

    for (const m of rosterMembers) {
      if (m.ign && m.uid) {
        let memberUserId = existingMembers.find((ex) => ex.uid === m.uid)?.user_id;

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

    if (existingMembers.length > 0) {
      const insertNotif = tx.prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)");
      for (const ex of existingMembers) {
        if (!newUids.has(ex.uid)) {
          await insertNotif.run(ex.user_id, `❌ You have been removed from the team ${teamName}.`, "/my-team");
          if (ex.user_id) {
            removedMembers.push(ex.user_id);
          }
        }
      }
    }
  });

  try {
    const { triggerPushNotification } = await import("./lib/push-server");
    for (const memberId of removedMembers) {
      triggerPushNotification(
        memberId,
        "❌ Team Update",
        `❌ You have been removed from the team ${teamName}.`,
        "/teams"
      ).catch(e => console.error("Remove member push failed:", e));
    }
  } catch(e) {}

  return { success: true };
});

export const leaveTeam = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const { userId: clientUserId, teamId } = data as any;
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;
  let leaderId: number | null = null;
  let notifMsg = "";

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
    
    notifMsg = `⚠️ ${user.ign || user.username} has left your team ${team.name}.`;
    leaderId = team.leader_id;

    await tx
      .prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)")
      .run(team.leader_id, notifMsg, "/teams");
  });

  if (leaderId) {
    try {
      const { triggerPushNotification } = await import("./lib/push-server");
      triggerPushNotification(leaderId, "⚠️ Team Update", notifMsg, "/teams")
        .catch(e => console.error("Leave team push failed:", e));
    } catch(e) {}
  }

  return { success: true };
});

export const deleteTeam = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const { userId: clientUserId, teamId } = data as any;
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;
  const notifiedMembers: number[] = [];
  let teamName = "";

  await db.transaction(async (tx) => {
    const team = (await tx
      .prepare("SELECT name, leader_id FROM teams WHERE id = ?")
      .get(teamId)) as any;
    if (!team) throw new Error("Team not found");
    if (team.leader_id !== userId) throw new Error("Only the captain can delete the team");

    teamName = team.name;

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
        notifiedMembers.push(m.user_id);
      }
    }
  });

  try {
    const { triggerPushNotification } = await import("./lib/push-server");
    for (const mId of notifiedMembers) {
      triggerPushNotification(
        mId,
        "⚠️ Team Deleted",
        `⚠️ The team ${teamName} has been deleted by the captain.`,
        "/teams"
      ).catch(e => console.error("Delete team push failed:", e));
    }
  } catch(e) {}

  return { success: true };
});

async function loadTeamBundle(db: any, teamId: number) {
  const team = (await db.prepare("SELECT * FROM teams WHERE id = ?").get(teamId)) as any;
  if (!team) return null;

  const members = (await db
    .prepare(
      `
      SELECT tm.*, u.username, u.avatar_url
      FROM team_members tm
      LEFT JOIN users u ON u.id = tm.user_id
      WHERE tm.team_id = ?
      ORDER BY CASE WHEN tm.role = 'substitute' THEN 1 ELSE 0 END, tm.id ASC
    `,
    )
    .all(teamId)) as any[];

  const leader = (await db
    .prepare("SELECT id, username, ign, uid, avatar_url FROM users WHERE id = ?")
    .get(team.leader_id)) as any;

  return { ...team, members, leader };
}

export const getAllTeams = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./lib/db");
  const teams = (await db.prepare("SELECT * FROM teams ORDER BY created_at DESC").all()) as any[];
  const allMembers = (await db
    .prepare(
      `
      SELECT tm.*, u.username, u.avatar_url
      FROM team_members tm
      LEFT JOIN users u ON u.id = tm.user_id
    `,
    )
    .all()) as any[];
  const leaders = (await db
    .prepare("SELECT id, username, ign, uid, avatar_url FROM users")
    .all()) as any[];
  const leaderMap = new Map(leaders.map((l: any) => [l.id, l]));

  return teams.map((t) => ({
    ...t,
    members: allMembers.filter((m) => m.team_id === t.id),
    leader: leaderMap.get(t.leader_id) || null,
  }));
});

export const getTeamById = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const teamId = data as unknown as number;
  return loadTeamBundle(db, teamId);
});

export const requestJoinTeam = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const { teamId, userId: clientUserId, ign, uid } = data as any;
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;
  if (!ign || !uid) throw new Error("Please set your IGN and UID in your profile first.");

  const existing = await db
    .prepare(
      "SELECT id FROM team_requests WHERE team_id = ? AND user_id = ? AND status = 'pending'",
    )
    .get(teamId, userId);
  if (existing) throw new Error("You already have a pending request to this team.");

  const isCaptain = await db.prepare("SELECT id FROM teams WHERE leader_id = ?").get(userId);
  if (isCaptain) throw new Error("You are already the captain of a team. Leave or delete your team first.");

  const isMember = await db.prepare("SELECT team_id FROM team_members WHERE user_id = ?").get(userId);
  if (isMember) throw new Error("You are already in a team. Leave your current team first.");

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
        `📩 ${ign} has requested to join your team ${team.name}. Review on My Squad.`,
        "/my-team",
      );

    try {
      const { triggerPushNotification } = await import("./lib/push-server");
      triggerPushNotification(
        team.leader_id,
        "📩 Team Join Request",
        `📩 ${ign} requested to join your team ${team.name}.`,
        "/teams"
      ).catch(e => console.error("Join request push failed:", e));
    } catch(e) {}
  }

  return { success: true };
});

export const getTeamRequests = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const clientLeaderId = data as unknown as number;
  const leaderId = caller.role === 'admin' ? (clientLeaderId || caller.id) : caller.id;
  const team = (await db.prepare("SELECT id FROM teams WHERE leader_id = ?").get(leaderId)) as any;
  if (!team) return [];

  return db
    .prepare(
      `
      SELECT r.*, u.username 
      FROM team_requests r
      JOIN users u ON r.user_id = u.id
      WHERE r.team_id = ? AND r.status = 'pending' AND (r.initiated_by = 'player' OR r.initiated_by IS NULL)
      ORDER BY r.created_at DESC
    `,
    )
    .all(team.id);
});

export const getMyTeamRequest = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const clientUserId = data as unknown as number;
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;

  return db
    .prepare(
      `
      SELECT r.*, t.name AS team_name
      FROM team_requests r
      LEFT JOIN teams t ON r.team_id = t.id
      WHERE r.user_id = ? AND r.status = 'pending'
      ORDER BY r.created_at DESC
      LIMIT 1
    `,
    )
    .get(userId);
});

export const resolveTeamRequest = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const { requestId, status, userId: clientUserId } = data as any;
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;

  const req = (await db.prepare("SELECT * FROM team_requests WHERE id = ?").get(requestId)) as any;
  if (!req || req.status !== "pending") throw new Error("Request not found or already handled.");

  if (userId) {
    const team = (await db.prepare("SELECT leader_id FROM teams WHERE id = ?").get(req.team_id)) as any;
    if (!team) throw new Error("Team not found.");
    const initiatedBy = req.initiated_by || "player";
    if (initiatedBy === "team") {
      if (req.user_id !== userId) throw new Error("Only the invited player can respond.");
    } else if (team.leader_id !== userId) {
      throw new Error("Only the team captain can review join requests.");
    }
  }

  await db.transaction(async (tx) => {
    await tx.prepare("UPDATE team_requests SET status = ? WHERE id = ?").run(status, requestId);

    if (status === "approved") {
      const isCaptain = await tx.prepare("SELECT id FROM teams WHERE leader_id = ?").get(req.user_id);
      if (isCaptain) throw new Error("User is already a captain of another team.");

      const isMember = await tx.prepare("SELECT team_id FROM team_members WHERE user_id = ?").get(req.user_id);
      if (isMember) throw new Error("User has already joined another team.");

      const roster = (await tx
        .prepare("SELECT role FROM team_members WHERE team_id = ?")
        .all(req.team_id)) as any[];
      if (roster.length >= 4) {
        throw new Error("Team is full. Captain must remove a member before approving.");
      }

      const playerProfile = (await tx.prepare("SELECT username, ign, uid FROM users WHERE id = ?").get(req.user_id)) as any;
      if (!playerProfile?.ign || !playerProfile?.uid) {
        throw new Error("Please set your IGN and UID in your profile first.");
      }

      const playerCount = roster.filter((m: any) => m.role !== "substitute").length;
      const subCount = roster.filter((m: any) => m.role === "substitute").length;
      let nextRole = "player";
      if (playerCount >= 3) nextRole = "substitute";
      if (subCount >= 1 && playerCount >= 3) {
        throw new Error("Team roster is full (captain + 3 players + 1 substitute).");
      }

      await tx
        .prepare(
          "INSERT INTO team_members (team_id, user_id, ign, uid, role) VALUES (?, ?, ?, ?, ?)",
        )
        .run(req.team_id, req.user_id, playerProfile.ign, playerProfile.uid, nextRole);

      await tx
        .prepare("UPDATE team_requests SET status = 'rejected' WHERE user_id = ? AND status = 'pending' AND id != ?")
        .run(req.user_id, requestId);

      await tx
        .prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)")
        .run(req.user_id, "🎉 Your request/invitation to join the team has been approved! All other pending requests were cancelled.", "/teams");

      const team = (await tx.prepare("SELECT leader_id, name FROM teams WHERE id = ?").get(req.team_id)) as any;
      if (team) {
        await tx
          .prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)")
          .run(team.leader_id, `✅ ${playerProfile.ign} has joined ${team.name}!`, "/teams");
      }
    } else {
      await tx
        .prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)")
        .run(req.user_id, "❌ The request to join the team was declined.", "/teams");

      const team = (await tx.prepare("SELECT leader_id, name FROM teams WHERE id = ?").get(req.team_id)) as any;
      if (team) {
        const playerProfile = (await tx.prepare("SELECT ign, username FROM users WHERE id = ?").get(req.user_id)) as any;
        const nameToShow = playerProfile?.ign || playerProfile?.username || "A player";
        await tx
          .prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)")
          .run(team.leader_id, `❌ ${nameToShow} has declined the team invitation/request.`, "/teams");
      }
    }
  });

  // Fire push notification after transaction commits
  try {
    const { triggerPushNotification } = await import("./lib/push-server");
    if (status === "approved") {
      await triggerPushNotification(
        req.user_id,
        "🎮 ClutchGround",
        "🎉 Your request to join the team has been approved!",
        "/teams",
      );
    } else {
      await triggerPushNotification(
        req.user_id,
        "🎮 ClutchGround",
        "❌ Your request to join the team was declined.",
        "/teams",
      );
    }
  } catch (e) {
    console.error("[Push] Team request notification failed:", e);
  }

  return { success: true };
});

export const cancelTeamRequest = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const { userId: clientUserId, requestId } = data as any;
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;

  const req = (await db.prepare("SELECT * FROM team_requests WHERE id = ?").get(requestId)) as any;
  if (!req || req.status !== "pending") throw new Error("Request not found.");
  if (req.user_id !== userId) throw new Error("Not authorized.");

  await db.prepare("DELETE FROM team_requests WHERE id = ?").run(requestId);
  return { success: true };
});

export const removeTeamMember = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const { captainId: clientCaptainId, memberUserId } = data as any;
  const captainId = caller.role === 'admin' ? (clientCaptainId || caller.id) : caller.id;

  const team = (await db.prepare("SELECT id, name, leader_id FROM teams WHERE leader_id = ?").get(captainId)) as any;
  if (!team) throw new Error("You do not captain a team.");

  const member = (await db
    .prepare("SELECT ign, username FROM users WHERE id = ?")
    .get(memberUserId)) as any;

  await db.transaction(async (tx) => {
    const deleted = await tx
      .prepare("DELETE FROM team_members WHERE team_id = ? AND user_id = ?")
      .run(team.id, memberUserId);
    const removed = (deleted as any)?.changes ?? (deleted as any)?.rowCount ?? 0;
    if (!removed) throw new Error("Member not found on your roster.");

    // Only insert notification if user still exists in the system
    if (member) {
      try {
        await tx
          .prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)")
          .run(
            memberUserId,
            `❌ You were removed from ${team.name} by the captain.`,
            "/teams",
          );
      } catch (e) {
        // Silently fail if notification insert fails due to user not found
        console.error("Failed to insert notification:", e);
      }
    }
  });

  try {
    const { triggerPushNotification } = await import("./lib/push-server");
    await triggerPushNotification(
      memberUserId,
      "Team update",
      `You were removed from ${team.name}.`,
      "/teams",
    );
  } catch {}

  return { success: true };
});

export const getNotifications = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const clientUserId = data as unknown as number;
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;
  return await db
    .prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20")
    .all(userId);
});

export const markNotificationsRead = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const caller = await getCurrentUser();
    const { db } = await import("./lib/db");
    const clientUserId = data as unknown as number;
    const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;
    await db.prepare("UPDATE notifications SET is_read = true WHERE user_id = ?").run(userId);
    return { success: true };
  },
);
export const sendPushNotification = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  await getCurrentUser("admin");
  const { db } = await import("./lib/db");
  const { targetType, targetData, message, redirectUrl } = data as any;

  const notifyUrl = redirectUrl || null;
  const { sendNotificationHelper } = await import("./lib/push-server");

  if (targetType === "all") {
    const users = await db.prepare("SELECT id FROM users").all() as any[];
    for (const u of users) {
      await sendNotificationHelper(u.id, message, notifyUrl);
    }
  } else if (targetType === "users") {
    const usernames = targetData.split(",").map((s: string) => s.trim()).filter(Boolean);
    for (const username of usernames) {
      const user = await db.prepare("SELECT id FROM users WHERE username = ? OR uid = ?").get(username, username) as any;
      if (user) {
        await sendNotificationHelper(user.id, message, notifyUrl);
      }
    }
  } else if (targetType === "tournament") {
    // Notify all users registered in this tournament
    const regs = await db.prepare("SELECT user_id, players_json FROM registrations WHERE tournament_id = ?").all(targetData) as any[];
    const notifiedUsers = new Set<number>();
    
    // Notify the user who registered
    for (const reg of regs) {
      if (!notifiedUsers.has(reg.user_id)) {
        await sendNotificationHelper(reg.user_id, message, notifyUrl);
        notifiedUsers.add(reg.user_id);
      }
      // Notify teammates found in players_json
      if (reg.players_json) {
        try {
          const players = JSON.parse(reg.players_json);
          for (const p of players) {
            if (p.uid) {
              const u = await db.prepare("SELECT id FROM users WHERE uid = ?").get(p.uid) as any;
              if (u && !notifiedUsers.has(u.id)) {
                await sendNotificationHelper(u.id, message, notifyUrl);
                notifiedUsers.add(u.id);
              }
            }
          }
        } catch(e) {}
      }
    }
  }

  return { success: true };
});

export const getMyMatches = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const clientUserId = data as unknown as number;
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;

  const userProfile = (await db.prepare("SELECT uid FROM users WHERE id = ?").get(userId)) as any;
  const uidPattern = userProfile?.uid ? `%"uid":"${userProfile.uid}"%` : "NON_EXISTENT_UID_PATTERN";

  return db
    .prepare(
      `
      SELECT t.id, t.title as name, t.startsAt as date, t.status as match_status, t.prize, t.mode, t.format, t.room_id, t.room_pass, t.per_kill_coin, t.first_place_coin,
             t.slots, t.filled, t.entry, t.banner, t.tournament_type, t.entry_fee, t.prize_pool, r.kills, r.position, r.points, 'approved' as reg_status
      FROM registrations r
      JOIN tournaments t ON r.tournament_id = t.id
      WHERE r.user_id = ? OR r.players_json LIKE ?

      UNION ALL

      SELECT t.id, t.title as name, t.startsAt as date, t.status as match_status, t.prize, t.mode, t.format, null as room_id, null as room_pass, t.per_kill_coin, t.first_place_coin,
             t.slots, t.filled, t.entry, t.banner, t.tournament_type, t.entry_fee, t.prize_pool, 0 as kills, 0 as position, 0 as points, req.status as reg_status
      FROM tournament_requests req
      JOIN tournaments t ON req.tournament_id = t.id
      WHERE req.status = 'pending' AND (req.requested_by = ? OR req.players_json LIKE ?)

      ORDER BY date DESC
    `,
    )
    .all(userId, uidPattern, userId, uidPattern);
});

export const getTournamentResults = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const { db } = await import("./lib/db");
  const id = data as unknown as number;
  const results = (await db
    .prepare(
      `
      SELECT r.*, u.username, u.avatar_url, COALESCE(r.team_name, u.username) as display_name, t.mode as tourney_mode, tm.logo as team_logo
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN tournaments t ON r.tournament_id = t.id
      LEFT JOIN teams tm ON tm.name = r.team_name
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
    await getCurrentUser("admin");
    const { db } = await import("./lib/db");
    const { tournamentId, results } = data as any;
    const pushTargets: any[] = [];

    await db.transaction(async (tx) => {
      const tourney = (await tx
        .prepare(
          "SELECT title, prize, mode, per_kill_coin, first_place_coin, tournament_type, prize_pool FROM tournaments WHERE id = ?",
        )
        .get(tournamentId)) as any;
      if (!tourney) throw new Error("Tournament not found");

      // Determine prize pool and tournament type
      const prizePool = tourney.tournament_type === "clash_squad" || tourney.tournament_type === "lone_wolf" 
        ? (tourney.prize_pool || 0) 
        : (tourney.prize || 0);
      const isClashOrLone = tourney.tournament_type === "clash_squad" || tourney.tournament_type === "lone_wolf";

      const stmt = tx.prepare(
        "UPDATE registrations SET kills = ?, position = ?, points = ?, awarded_prize = ? WHERE id = ? AND tournament_id = ?",
      );
      const insertNotif = tx.prepare("INSERT INTO notifications (user_id, message) VALUES (?, ?)");
      const addPrize = tx.prepare(
        "UPDATE users SET winning_balance = winning_balance + ? WHERE id = ?",
      );

      const prize1 = isClashOrLone ? prizePool : Math.floor(prizePool * 0.5);
      const prize2 = isClashOrLone ? 0 : Math.floor(prizePool * 0.3);
      const prize3 = isClashOrLone ? 0 : Math.floor(prizePool * 0.2);

      // Calculate points for all modes
      for (const r of results) {
        let posPoints = 0;
        const pos = Number(r.position) || 0;

        // Only calculate points for Battle Royale Squad mode, NOT for Clash Squad/Lone Wolf/Duo/Solo
        if (!isClashOrLone && tourney.mode === "Squad") {
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

        if (!isClashOrLone && tourney.mode === "Squad") {
          r.calculatedPoints = useManualPoints ? manualPoints : Number(r.kills || 0) + posPoints;
        } else {
          r.calculatedPoints = 0;
        }
        r.matchPosition = pos;
        r.killsNum = Number(r.kills || 0);
      }

      // Sort results based on tournament type
      if (isClashOrLone) {
        // Clash Squad and Lone Wolf: sort by match position only
        results.sort((a: any, b: any) => {
          const posA = a.matchPosition > 0 ? a.matchPosition : 99999;
          const posB = b.matchPosition > 0 ? b.matchPosition : 99999;
          return posA - posB;
        });
      } else if (tourney.mode === "Duo" || tourney.mode === "Solo") {
        // Battle Royale Duo/Solo: sort by position then kills
        results.sort((a: any, b: any) => {
          const posA = a.matchPosition > 0 ? a.matchPosition : 99999;
          const posB = b.matchPosition > 0 ? b.matchPosition : 99999;
          if (posA !== posB) return posA - posB;
          return b.killsNum - a.killsNum;
        });
      } else {
        // Battle Royale Squad: sort by points then kills
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
        // For Clash Squad and Lone Wolf: use match position (1st, 2nd, 3rd from results)
        // For Battle Royale Solo: use match position from the match
        // For Battle Royale Duo: use match position (position-based only, no kills)
        // For Battle Royale Squad: use overall rank from sorting (based on points+kills)
        let rankForPrize = isClashOrLone 
          ? r.matchPosition 
          : (tourney.mode === "Solo" || tourney.mode === "Duo") && !isClashOrLone 
            ? r.matchPosition 
            : overallRank;

        if (isClashOrLone) {
          // Clash Squad and Lone Wolf: Full prize pool to 1st place only (match position 1)
          if (rankForPrize === 1 && prize1 > 0) awardedPrize = prize1;
          else awardedPrize = 0;
        } else if (tourney.mode === "Solo") {
          // Battle Royale Solo: kills + first place bonus
          awardedPrize =
            r.killsNum * (tourney.per_kill_coin || 0) +
            (rankForPrize === 1 ? tourney.first_place_coin || 0 : 0);
        } else {
          // Battle Royale Duo/Squad: split prizes
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
            pushTargets.push({
              userId: r.user_id,
              title: "💰 Prize Earned!",
              body: `💰 Prize earned for ${tourney.title}: ${awardedPrize} CG Coins awarded for finishing #${rankForPrize}.`,
              url: "/wallet",
            });
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
            pushTargets.push({
              userId: r.user_id,
              title: "💰 Prize Updated",
              body: `💰 Prize updated for ${tourney.title}: your prize increased to ${awardedPrize} CG Coins.`,
              url: "/wallet",
            });
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
            pushTargets.push({
              userId: r.user_id,
              title: "📉 Prize Adjusted",
              body: `📉 Prize adjusted for ${tourney.title}: your prize is now ${awardedPrize} CG Coins.`,
              url: "/wallet",
            });
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
          pushTargets.push({
            userId: r.user_id,
            title: "🏆 Match Scored!",
            body: `🏆 Match scored for ${tourney.title}: ${r.calculatedPoints} points earned! Final rank #${overallRank}.`,
            url: "/leaderboard",
          });
        } else if (pointsDiff !== 0) {
          const dir = pointsDiff > 0 ? "increased" : "decreased";
          await tx
            .prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)")
            .run(
              r.user_id,
              `📊 Score updated for ${tourney.title}: points ${dir} by ${Math.abs(pointsDiff)} to ${r.calculatedPoints}.`,
              "/leaderboard",
            );
          pushTargets.push({
            userId: r.user_id,
            title: "📊 Score Updated",
            body: `📊 Score updated for ${tourney.title}: points ${dir} to ${r.calculatedPoints}.`,
            url: "/leaderboard",
          });
        }
      }

      // Notify ALL participants that results have been announced
      const allParticipants = (await tx
        .prepare("SELECT DISTINCT user_id FROM registrations WHERE tournament_id = ?")
        .all(tournamentId)) as any[];
      
      const notifMsg = `📋 Results announced for ${tourney.title}! Check the tournament page to view rankings and prizes.`;
      for (const p of allParticipants) {
        await tx
          .prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)")
          .run(p.user_id, notifMsg, `/tournaments/${tournamentId}`);
        pushTargets.push({
          userId: p.user_id,
          title: "📋 Results Announced",
          body: `Results announced for ${tourney.title}! Check rankings and your rewards.`,
          url: `/tournaments/${tournamentId}`,
        });
      }

      // Optionally mark tournament as finished here if you want
      await tx
        .prepare("UPDATE tournaments SET status = 'completed', results_announced = true WHERE id = ?")
        .run(tournamentId);
    });

    try {
      const { triggerPushNotification } = await import("./lib/push-server");
      for (const t of pushTargets) {
        triggerPushNotification(t.userId, t.title, t.body, t.url).catch(e => console.error("Results push failed:", e));
      }
    } catch(e) {}

    // Clear tournaments cache to ensure updated data is fetched
    const { apiCache } = await import("./lib/cache");
    apiCache.delete('tournaments');

    return { success: true };
  },
);

export const rescheduleTournament = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  await getCurrentUser("admin");
  const { db } = await import("./lib/db");
  const id = data as unknown as number;
  const userIds: number[] = [];
  let tourneyTitle = "";

  await db.transaction(async (tx) => {
    const tourney = (await tx.prepare("SELECT title FROM tournaments WHERE id = ?").get(id)) as any;
    if (!tourney) throw new Error("Tournament not found");
    tourneyTitle = tourney.title;

    // Get all registrations with their old prizes BEFORE updating
    const registrations = (await tx
      .prepare("SELECT user_id, awarded_prize FROM registrations WHERE tournament_id = ?")
      .all(id)) as any[];

    // Deduct old prizes from wallets before resetting
    const deductPrize = tx.prepare(
      "UPDATE users SET winning_balance = winning_balance - ? WHERE id = ?",
    );
    const insertTxn = tx.prepare(
      "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
    );

    for (const r of registrations) {
      const oldPrize = r.awarded_prize || 0;
      if (oldPrize > 0) {
        // Deduct the old prize from wallet
        await deductPrize.run(oldPrize, r.user_id);
        // Log the deduction as a transaction
        await insertTxn.run(
          r.user_id,
          oldPrize,
          "prize_deducted",
          `Prize reversed (reschedule): ${tourney.title}`,
        );
      }
    }

    await tx.prepare("UPDATE tournaments SET status = 'rescheduled' WHERE id = ?").run(id);
    await tx
      .prepare(
        "UPDATE registrations SET kills = 0, position = 0, points = 0, awarded_prize = 0 WHERE tournament_id = ?",
      )
      .run(id);

    const insertNotif = tx.prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)");
    const notifMsg = `⚠️ The match ${tourney.title} has been RESCHEDULED. Please check your Upcoming Matches.`;

    for (const r of registrations) {
      await insertNotif.run(r.user_id, notifMsg, `/tournaments/${id}`);
      userIds.push(r.user_id);
    }
  });

  try {
    const { triggerPushNotification } = await import("./lib/push-server");
    for (const uId of userIds) {
      triggerPushNotification(
        uId,
        "⚠️ Match Rescheduled",
        `⚠️ The match ${tourneyTitle} has been RESCHEDULED.`,
        "/matches"
      ).catch(e => console.error("Reschedule push failed:", e));
    }
  } catch(e) {}

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
      WITH team_stats AS (
        SELECT 
          COALESCE(teams.name, r.team_name) as team_name_key,
          COALESCE(MAX(teams.leader_id), MIN(r.user_id)) as leader_user_id,
          MAX(teams.logo) as team_logo,
          COALESCE(SUM(r.kills), 0) as total_kills,
          COALESCE(SUM(r.points), 0) as total_points,
          SUM(CASE WHEN r.position = 1 THEN 1 ELSE 0 END) as total_wins
        FROM registrations r
        INNER JOIN tournaments t ON t.id = r.tournament_id AND t.mode = 'Squad'
        LEFT JOIN teams ON teams.name = r.team_name
        WHERE r.created_at >= date_trunc('week', CURRENT_TIMESTAMP)
        GROUP BY COALESCE(teams.name, r.team_name)
      )
      SELECT
        ts.leader_user_id as user_id,
        ts.team_name_key as ign,
        ts.team_name_key as team,
        ts.team_logo as logo,
        ts.total_kills as kills,
        COALESCE(lo.points, ts.total_points) as points,
        ts.total_wins as wins
      FROM team_stats ts
      LEFT JOIN leaderboard_overrides lo ON lo.user_id = ts.leader_user_id AND lo.week_start = date_trunc('week', CURRENT_TIMESTAMP)
      WHERE COALESCE(lo.points, ts.total_points) > 0
      ORDER BY points DESC, kills DESC
    `,
    )
    .all()) as any[];

  for (let i = 0; i < rows.length; i++) {
    // Get all user_ids belonging to this team so any team member can see their rank highlighted
    const members = (await db.prepare(`
      SELECT tm.user_id
      FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE t.name = ?
    `).all(rows[i].team)) as any[];

    const memberIds = new Set<number>();
    if (rows[i].user_id) memberIds.add(rows[i].user_id);
    members.forEach(m => {
      if (m.user_id) memberIds.add(m.user_id);
    });

    rows[i].member_ids = Array.from(memberIds);
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
    await getCurrentUser("admin");
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

    try {
      const { triggerPushNotification } = await import("./lib/push-server");
      triggerPushNotification(
        userId,
        "📊 Points Adjusted",
        `📊 Admin adjusted your leaderboard display points to ${targetPoints} for this week.`,
        "/leaderboard"
      ).catch(e => console.error("Adjust points push failed:", e));
    } catch(e) {}

    return { success: true };
  },
);

export const resolveTournamentRequest = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    await getCurrentUser("admin");
    const { db } = await import("./lib/db");
    const { requestId, status } = data as any;

    // Pre-fetch outside transaction so we can fire push after it commits
    const req = (await db.prepare("SELECT * FROM tournament_requests WHERE id = ?").get(requestId)) as any;
    if (!req) throw new Error("Request not found");
    if (req.status !== "pending") throw new Error("Request already resolved");
    const tourney = (await db.prepare("SELECT title, entry FROM tournaments WHERE id = ?").get(req.tournament_id)) as any;

    await db.transaction(async (tx) => {
      await tx
        .prepare("UPDATE tournament_requests SET status = ? WHERE id = ?")
        .run(status, requestId);
      await tx
        .prepare(
          "UPDATE notifications SET action_type = 'resolved' WHERE action_type = 'tournament_request' AND action_data = ?",
        )
        .run(requestId.toString());

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

    // Fire push notifications after transaction commits
    try {
      const { triggerPushNotification } = await import("./lib/push-server");
      if (status === "approved") {
        // Notify the person who requested registration
        await triggerPushNotification(
          req.requested_by,
          "🎮 ClutchGround",
          `🎉 Your Captain approved the team registration for ${tourney.title}!`,
          `/tournaments/${req.tournament_id}`,
        );
        // Notify all other team members
        const members = await db
          .prepare("SELECT user_id FROM team_members WHERE team_id = ? AND user_id IS NOT NULL")
          .all(req.team_id) as any[];
        for (const m of members) {
          if (m.user_id !== req.requested_by) {
            triggerPushNotification(
              m.user_id,
              "🎮 ClutchGround",
              `🏆 Your Captain registered the team for ${tourney.title}! Check your matches.`,
              "/matches",
            ).catch((e) => console.error("[Push] Team member notification failed:", e));
          }
        }
      } else {
        const msg =
          tourney.entry > 0
            ? `❌ Your Captain rejected the registration for ${tourney.title}. Entry fee refunded.`
            : `❌ Your Captain rejected the registration for ${tourney.title}.`;
        await triggerPushNotification(
          req.requested_by,
          "🎮 ClutchGround",
          msg,
          `/tournaments/${req.tournament_id}`,
        );
      }
    } catch (e) {
      console.error("[Push] Tournament request notification failed:", e);
    }

    return { success: true };
  },
);

export const processWithdrawal = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const { userId: clientUserId, amount, upiId, upiNumber } = data as unknown as {
    userId: number;
    amount: number;
    upiId: string;
    upiNumber: string;
  };
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;

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

  try {
    const { triggerPushNotification, notifyAllAdmins } = await import("./lib/push-server");
    triggerPushNotification(
      userId,
      "💸 Withdrawal Requested",
      `💸 Withdrawal requested: ${amount} CG Coins to UPI ${upiId}. Processing time 2-3 working days.`,
      "/wallet"
    ).catch(e => console.error("Withdrawal push error:", e));

    // Notify Admins
    const user = await db.prepare("SELECT username FROM users WHERE id = ?").get(userId) as any;
    const username = user?.username || "A user";
    await notifyAllAdmins(`💸 Withdrawal Requested: ${username} requested ₹${amount} (UPI: ${upiId})`, "/admin/payouts");
  } catch (e) {
    console.error("Error notifying admins about withdrawal:", e);
  }

  return { success: true };
});

export const getPayouts = createServerFn({ method: "GET" }).handler(async () => {
  await getCurrentUser("admin");
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
  await getCurrentUser("admin");
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

  try {
    const { triggerPushNotification } = await import("./lib/push-server");
    const msg = status === "completed"
      ? `✅ Withdrawal completed: ${amount} CG Coins has been sent to your UPI. Please check your bank statement.`
      : `❌ Your withdrawal of ${amount} CG Coins was rejected. The coins have been refunded to your wallet.`;
    triggerPushNotification(userId, status === "completed" ? "✅ Withdrawal Success" : "❌ Withdrawal Rejected", msg, "/wallet")
      .catch(e => console.error("Payout status push error:", e));
  } catch (e) {}

  return { success: true };
});

export const deleteUser = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  await getCurrentUser("admin");
  const { db } = await import("./lib/db");
  const { id } = data as unknown as { id: number };

  // First, clear any sessions for this user so they are immediately logged out
  await db.prepare("DELETE FROM sessions WHERE user_id = $1").run(id);

  // Then delete the user (cascade deletes will handle the rest)
  await db.prepare("DELETE FROM users WHERE id = $1").run(id);

  return { success: true };
});

export const banUser = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  await getCurrentUser("admin");
  const { db } = await import("./lib/db");
  const { id } = data as unknown as { id: number };

  // Set banned to true
  await db.prepare("UPDATE users SET banned = true WHERE id = $1").run(id);

  // Clear any sessions for this user so they are immediately logged out
  await db.prepare("DELETE FROM sessions WHERE user_id = $1").run(id);

  return { success: true };
});

export const deleteAllUsers = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  await getCurrentUser("admin");
  const { db } = await import("./lib/db");
  // Only keep admin (assuming role = 'admin')
  await db.prepare("DELETE FROM users WHERE role != 'admin'").run();
  return { success: true };
});

export const unbanUser = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  await getCurrentUser("admin");
  const { db } = await import("./lib/db");
  const { id } = data as unknown as { id: number };
  await db.prepare("UPDATE users SET banned = false WHERE id = ?").run(id);
  return { success: true };
});

export const updateUserRole = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  await getCurrentUser("admin");
  const { db } = await import("./lib/db");
  const { id, role } = data as unknown as { id: number; role: string };
  await db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
  return { success: true };
});

export const getAdminStats = createServerFn({ method: "GET" }).handler(async () => {
  await getCurrentUser("admin");
  const { db } = await import("./lib/db");
  const totalUsers = ((await db.prepare("SELECT COUNT(*) as c FROM users WHERE role != 'admin'").get()) as any)?.c || 0;
  const bannedUsers = ((await db.prepare("SELECT COUNT(*) as c FROM users WHERE banned = true").get()) as any)?.c || 0;
  const totalTournaments = ((await db.prepare("SELECT COUNT(*) as c FROM tournaments").get()) as any)?.c || 0;
  const liveTournaments = ((await db.prepare("SELECT COUNT(*) as c FROM tournaments WHERE status = 'live'").get()) as any)?.c || 0;
  const openTournaments = ((await db.prepare("SELECT COUNT(*) as c FROM tournaments WHERE status = 'open'").get()) as any)?.c || 0;
  const pendingDeposits = ((await db.prepare("SELECT COUNT(*) as c FROM upi_deposits WHERE status = 'submitted'").get()) as any)?.c || 0;
  const pendingPayouts = ((await db.prepare("SELECT COUNT(*) as c FROM withdrawals WHERE status = 'pending'").get()) as any)?.c || 0;
  const openTickets = ((await db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status = 'open'").get()) as any)?.c || 0;

  const getOffset = async (key: string) => {
    const row = await db.prepare("SELECT value FROM site_settings WHERE key = ?").get(key) as any;
    return row ? Number(row.value) || 0 : 0;
  };

  const revenueOffset = await getOffset("finance_revenue_offset");
  const payoutsOffset = await getOffset("finance_payouts_offset");
  const withdrawableOffset = await getOffset("finance_withdrawable_offset");

  const rawRevenue = ((await db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM upi_deposits WHERE status = 'approved'").get()) as any)?.s || 0;
  const rawPayouts = ((await db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM withdrawals WHERE status = 'completed'").get()) as any)?.s || 0;
  const rawWithdrawable = ((await db.prepare("SELECT COALESCE(SUM(winning_balance), 0) as s FROM users").get()) as any)?.s || 0;

  const totalRevenue = Math.max(0, rawRevenue - revenueOffset);
  const totalPayouts = Math.max(0, rawPayouts - payoutsOffset);
  const totalWithdrawable = Math.max(0, rawWithdrawable - withdrawableOffset);

  // Latest 3 tournaments for dashboard preview
  const latestTournaments = await db.prepare(
    "SELECT id, title, status, mode, game, filled, slots, startsat, tournament_code, tournament_type FROM tournaments ORDER BY id DESC LIMIT 3"
  ).all() as any[];

  return { totalUsers, bannedUsers, totalTournaments, liveTournaments, openTournaments, pendingDeposits, pendingPayouts, openTickets, totalRevenue, totalPayouts, totalWithdrawable, latestTournaments };
});

export const deleteAllTournaments = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  await getCurrentUser("admin");
  const { db } = await import("./lib/db");
  await db.prepare("DELETE FROM tournaments").run();
  return { success: true };
});

export const getSiteSettings = createServerFn({ method: "POST" }).handler(async () => {
  const { db } = await import("./lib/db");
  const rows = (await db.prepare("SELECT key, value FROM site_settings").all()) as any[];
  const settings: Record<string, string> = {};
  rows.forEach((r) => {
    settings[r.key] = r.value;
  });
  return settings;
});

export const saveSiteSetting = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  await getCurrentUser("admin");
  const { db } = await import("./lib/db");
  const { key, value } = data as unknown as { key: string; value: string };
  await db.prepare(`
    INSERT INTO site_settings (key, value)
    VALUES (?, ?)
    ON CONFLICT (key)
    DO UPDATE SET value = EXCLUDED.value
    RETURNING key
  `).run(key, value);
  return { success: true };
});

export const clearSiteSetting = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  await getCurrentUser("admin");
  const { db } = await import("./lib/db");
  const { key } = data as unknown as { key: string };
  await db.prepare("DELETE FROM site_settings WHERE key = ?").run(key);
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
  await getCurrentUser("admin");
  const { db } = await import("./lib/db");
  return await db.prepare("SELECT * FROM contact_messages ORDER BY created_at DESC").all();
});

export const getTransactions = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const clientUserId = data as unknown as number;
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;
  return await db
    .prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10")
    .all(userId);
});

export const addDepositUpi = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const caller = await getCurrentUser();
    const { db } = await import("./lib/db");
    const { userId: clientUserId, amount, utr } = data as any;
    const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;
    
    await db.transaction(async (tx: any) => {
      await tx.prepare('UPDATE users SET deposit_balance = deposit_balance + ? WHERE id = ?').run(amount, userId);
      await tx.prepare('INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)').run(userId, amount, 'deposit_added', `Added Cash via UPI (UTR: ${utr})`);
    });
    return { success: true };
  });

// --- TICKET SYSTEM ---

async function processTicketMessage(message: string): Promise<string> {
  if (!message) return message;
  
  if (message.startsWith("{") && message.endsWith("}")) {
    try {
      const parsed = JSON.parse(message);
      if (parsed.image && parsed.image.startsWith("data:image/")) {
        const { uploadToCloudinary } = await import("./lib/cloudinary");
        const folder = "clutchground/tickets";
        const cloudinaryUrl = await uploadToCloudinary(parsed.image, folder);
        parsed.image = cloudinaryUrl;
        return JSON.stringify(parsed);
      }
    } catch (e) {
      // Not valid JSON
    }
  } else if (message.startsWith("data:image/")) {
    try {
      const { uploadToCloudinary } = await import("./lib/cloudinary");
      const folder = "clutchground/tickets";
      const cloudinaryUrl = await uploadToCloudinary(message, folder);
      return cloudinaryUrl;
    } catch (e) {
      // Failed to upload
    }
  }
  return message;
}

async function deleteTicketImagesFromCloudinary(ticketId: number) {
  try {
    const { db } = await import("./lib/db");
    const { deleteFromCloudinary } = await import("./lib/cloudinary");
    
    const replies = await db.prepare("SELECT id, message FROM ticket_replies WHERE ticket_id = ?").all(ticketId) as any[];
    for (const reply of replies) {
      const msg = reply.message;
      if (!msg) continue;
      
      let imageUrl: string | null = null;
      
      if (msg.startsWith("{") && msg.endsWith("}")) {
        try {
          const parsed = JSON.parse(msg);
          if (parsed.image && parsed.image.startsWith("http")) {
            imageUrl = parsed.image;
          }
        } catch (e) {}
      } else if (msg.startsWith("http")) {
        imageUrl = msg;
      }
      
      if (imageUrl && imageUrl.includes("cloudinary.com")) {
        console.log(`[Cloudinary] Deleting image for resolved ticket: ${imageUrl}`);
        await deleteFromCloudinary(imageUrl);
      }
    }
    
    // Delete all replies for this ticket from Supabase database
    console.log(`[Database] Deleting replies for resolved ticket ${ticketId}`);
    await db.prepare("DELETE FROM ticket_replies WHERE ticket_id = ?").run(ticketId);
  } catch (error) {
    console.error("Failed to delete ticket images and replies:", error);
  }
}

export const createTicket = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const { userId: clientUserId, subject, message } = data as any;
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;
  const processedMessage = await processTicketMessage(message);
  const res = await db.prepare("INSERT INTO tickets (user_id, subject) VALUES (?, ?)").run(userId, subject);
  const ticketId = res.lastInsertRowid;
  await db.prepare("INSERT INTO ticket_replies (ticket_id, user_id, message, is_admin) VALUES (?, ?, ?, ?)").run(ticketId, userId, processedMessage, false);

  // Notify Admins
  try {
    const user = await db.prepare("SELECT username FROM users WHERE id = ?").get(userId) as any;
    const username = user?.username || "A user";
    const { notifyAllAdmins } = await import("./lib/push-server");
    await notifyAllAdmins(`🎫 New Support Ticket created by ${username}: ${subject}`, `/admin/tickets/${ticketId}`);
  } catch (err) {
    console.error("Error notifying admins about new ticket:", err);
  }

  return { success: true, ticketId };
});

export const getMyTickets = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const clientUserId = data as unknown as number;
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;
  return await db.prepare("SELECT * FROM tickets WHERE user_id = ? ORDER BY updated_at DESC").all(userId);
});

export const getTicket = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const { ticketId } = data as any;
  const ticket = await db.prepare("SELECT * FROM tickets WHERE id = ?").get(ticketId) as any;
  if (!ticket) return null;
  if (caller.role !== "admin" && ticket.user_id !== caller.id) {
    throw new Error("Access denied: Not your ticket");
  }
  const replies = await db.prepare(`
    SELECT r.*, u.username, u.ign, u.role
    FROM ticket_replies r
    JOIN users u ON r.user_id = u.id
    WHERE r.ticket_id = ?
    ORDER BY r.created_at ASC
  `).all(ticketId);
  return { ...ticket, replies };
});

export const replyTicket = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const { ticketId, userId: clientUserId, message, isAdmin } = data as any;
  
  if (isAdmin && caller.role !== "admin") {
    throw new Error("Unauthorized: Admin privilege required");
  }
  
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;
  
  // Verify ticket ownership for regular user
  if (caller.role !== "admin") {
    const ticket = await db.prepare("SELECT user_id FROM tickets WHERE id = ?").get(ticketId) as any;
    if (!ticket || ticket.user_id !== caller.id) {
      throw new Error("Access denied: Not your ticket");
    }
  }
  const tId = Number(ticketId);
  const processedMessage = await processTicketMessage(message);
  
  await db.transaction(async (tx: any) => {
    await tx.prepare("INSERT INTO ticket_replies (ticket_id, user_id, message, is_admin) VALUES (?, ?, ?, ?)").run(tId, userId, processedMessage, !!isAdmin);
    await tx.prepare("UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(tId);
    
    if (isAdmin) {
      const ticket = await tx.prepare("SELECT user_id, subject FROM tickets WHERE id = ?").get(tId);
      if (ticket) {
        const { sendNotificationHelper } = await import("./lib/push-server");
        await sendNotificationHelper(ticket.user_id, `📩 Support Agent replied to your ticket: ${ticket.subject}`, `/support/${tId}`);
      }
    }
  });
  return { success: true };
});

export const getAllTickets = createServerFn({ method: "GET" }).handler(async () => {
  await getCurrentUser("admin");
  const { db } = await import("./lib/db");
  return await db.prepare(`
    SELECT t.*, u.username, u.ign 
    FROM tickets t
    JOIN users u ON t.user_id = u.id
    ORDER BY t.updated_at DESC
  `).all();
});

export const updateTicketStatus = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  await getCurrentUser("admin");
  const { db } = await import("./lib/db");
  const { ticketId, status } = data as any;
  const tId = Number(ticketId);
  await db.prepare("UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, tId);
  
  if (status === "resolved") {
    deleteTicketImagesFromCloudinary(tId).catch((err) => {
      console.error("Failed to delete ticket images asynchronously:", err);
    });
  }
  
  return { success: true };
});

// --- CHAT & FRIENDS SYSTEM ---

export const searchUsers = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const { query, userId: clientUserId } = data as any;
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;
  const searchTerm = `%${query}%`;
  return await db.prepare(`
    SELECT id, username, ign, uid, avatar_url 
    FROM users 
    WHERE id != ? AND (username ILIKE ? OR ign ILIKE ? OR uid ILIKE ?)
    LIMIT 10
  `).all(userId, searchTerm, searchTerm, searchTerm);
});

export const sendFriendRequest = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const { fromUserId: clientFromUserId, toUserId } = data as any;
  const fromUserId = caller.role === 'admin' ? (clientFromUserId || caller.id) : caller.id;
  const existing = await db.prepare("SELECT * FROM friendships WHERE (user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)").get(fromUserId, toUserId, toUserId, fromUserId);
  if (existing) throw new Error("Friendship or request already exists.");
  await db.prepare("INSERT INTO friendships (user_id1, user_id2) VALUES (?, ?)").run(fromUserId, toUserId);
  
  // Insert friend request notification
  try {
    const sender = await db.prepare("SELECT ign, username FROM users WHERE id = ?").get(fromUserId) as any;
    const senderName = sender ? (sender.ign || sender.username) : "A player";
    await db.prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)")
      .run(toUserId, `👥 ${senderName} sent you a friend request!`, "/chat");

    const { triggerPushNotification } = await import("./lib/push-server");
    triggerPushNotification(toUserId, "👥 Friend Request", `👥 ${senderName} sent you a friend request!`, "/chat")
      .catch(e => console.error("Friend request push failed:", e));
  } catch (err) {
    console.error("Failed to notify user of friend request:", err);
  }

  return { success: true };
});

export const getFriendRequests = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const clientUserId = data as unknown as number;
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;
  return await db.prepare(`
    SELECT f.id, u.id as user_id, u.username, u.ign, u.uid, u.avatar_url 
    FROM friendships f 
    JOIN users u ON f.user_id1 = u.id 
    WHERE f.user_id2 = ? AND f.status = 'pending'
  `).all(userId);
});

export const resolveFriendRequest = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const { requestId, status } = data as any; // status can be 'accepted' or 'rejected'
  
  // Verify that the caller is indeed the receiver of this request (user_id2)
  const req = await db.prepare("SELECT user_id2 FROM friendships WHERE id = ?").get(requestId) as any;
  if (!req) throw new Error("Friend request not found.");
  if (caller.role !== "admin" && req.user_id2 !== caller.id) {
    throw new Error("Access denied: Not authorized to resolve this request.");
  }

  if (status === 'accepted') {
    const f = await db.prepare("SELECT user_id1, user_id2 FROM friendships WHERE id = ?").get(requestId) as any;
    await db.prepare("UPDATE friendships SET status = 'accepted' WHERE id = ?").run(requestId);
    
    // Insert accept notification
    if (f) {
      try {
        const accepter = await db.prepare("SELECT ign, username FROM users WHERE id = ?").get(f.user_id2) as any;
        const accepterName = accepter ? (accepter.ign || accepter.username) : "A player";
        await db.prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)")
          .run(f.user_id1, `🤝 ${accepterName} accepted your friend request!`, "/chat");

        const { triggerPushNotification } = await import("./lib/push-server");
        triggerPushNotification(f.user_id1, "🤝 Friend Request Accepted", `🤝 ${accepterName} accepted your friend request!`, "/chat")
          .catch(e => console.error("Friend request accepted push failed:", e));
      } catch (err) {
        console.error("Failed to notify user of accepted friend request:", err);
      }
    }
  } else {
    await db.prepare("DELETE FROM friendships WHERE id = ?").run(requestId);
  }
  return { success: true };
});

export const getFriends = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const clientUserId = data as unknown as number;
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;
  return await db.prepare(`
    SELECT 
      f.id as friendship_id,
      u.id as user_id, 
      u.username, u.ign, u.uid, u.avatar_url,
      (SELECT COUNT(*) FROM chat_messages WHERE sender_id = u.id AND receiver_id = ? AND is_read = false) as unread_count
    FROM friendships f
    JOIN users u ON (u.id = f.user_id1 OR u.id = f.user_id2) AND u.id != ?
    WHERE (f.user_id1 = ? OR f.user_id2 = ?) AND f.status = 'accepted'
  `).all(userId, userId, userId, userId);
});

export const getChatMessages = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const { userId: clientUserId, otherUserId, teamId, lastMessageId } = data as any;
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;
  
  // Verify team membership or friend chat participation
  if (teamId) {
    const member = await db.prepare("SELECT id FROM team_members WHERE team_id = ? AND user_id = ? LIMIT 1").get(teamId, userId);
    if (!member && caller.role !== "admin") {
      throw new Error("Access denied: Not a team member.");
    }
  } else {
    if (caller.role !== "admin" && userId !== caller.id) {
      throw new Error("Access denied: Cannot query other users' DMs.");
    }
  }
  
  let query = "";
  let params: any[] = [];
  
  if (teamId) {
    query = `
      SELECT m.*, u.username, u.ign, u.avatar_url 
      FROM chat_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.team_id = ? ${lastMessageId ? 'AND m.id > ?' : ''}
      ORDER BY m.created_at ASC
    `;
    params = lastMessageId ? [teamId, lastMessageId] : [teamId];
  } else {
    query = `
      SELECT m.*, u.username, u.ign, u.avatar_url 
      FROM chat_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)) 
      ${lastMessageId ? 'AND m.id > ?' : ''}
      ORDER BY m.created_at ASC
    `;
    params = lastMessageId ? [userId, otherUserId, otherUserId, userId, lastMessageId] : [userId, otherUserId, otherUserId, userId];
  }
  
  return await db.prepare(query).all(...params);
});

export const sendMessage = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const { senderId: clientSenderId, receiverId, teamId, message } = data as any;
  const senderId = caller.role === 'admin' ? (clientSenderId || caller.id) : caller.id;
  
  if (teamId) {
    const member = await db.prepare("SELECT id FROM team_members WHERE team_id = ? AND user_id = ? LIMIT 1").get(teamId, senderId);
    if (!member && caller.role !== "admin") {
      throw new Error("Access denied: Not a team member.");
    }
  }
  
  const res = await db.prepare(`
    INSERT INTO chat_messages (sender_id, receiver_id, team_id, message) 
    VALUES (?, ?, ?, ?)
  `).run(senderId, receiverId || null, teamId || null, message);
  
  return { success: true, messageId: res.lastInsertRowid };
});

export const getUnreadChatCount = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const clientUserId = data as unknown as number;
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;
  const res = (await db.prepare(`
    SELECT COUNT(*) as count 
    FROM chat_messages 
    WHERE receiver_id = ? AND is_read = false
  `).get(userId)) as any;
  return res ? Number(res.count) : 0;
});

export const markChatMessagesAsRead = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const { userId: clientUserId, otherUserId } = data as any;
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;
  await db.prepare(`
    UPDATE chat_messages 
    SET is_read = true 
    WHERE receiver_id = ? AND sender_id = ? AND is_read = false
  `).run(userId, otherUserId);
  return { success: true };
});

export const saveUpiId = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const { userId: clientUserId, upiId } = data as any;
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;
  await db.prepare("UPDATE users SET upi_id = ? WHERE id = ?").run(upiId, userId);
  return { success: true };
});

export const getHeroBanners = createServerFn({ method: "POST" }).handler(async () => {
  const { db } = await import("./lib/db");
  const row = await db.prepare("SELECT value FROM site_settings WHERE key = 'hero_banners'").get();
  if (row) {
    try {
      return JSON.parse((row as any).value) as string[];
    } catch {}
  }
  return ["https://res.cloudinary.com/dkjt9m4d0/image/upload/v1780319414/clutchground/placeholders/zvdpuk7j7e4dgxax5h2b.png"];
});

export const getSocialLinks = createServerFn({ method: "POST" }).handler(async () => {
  const { db } = await import("./lib/db");
  const row = await db.prepare("SELECT value FROM site_settings WHERE key = 'social_links'").get();
  const defaultLinks = {
    whatsapp: "https://whatsapp.com/channel/0029Vb8GIynDp2Q21617we1s",
    discord: "https://discord.gg/uYXFJswHdg",
    telegram: "https://t.me/clutchground",
    email: "clutchgroundofficial@gmail.com",
    instagram: "https://instagram.com/clutchground"
  };
  if (row) {
    try {
      return { ...defaultLinks, ...JSON.parse((row as any).value) };
    } catch {}
  }
  return defaultLinks;
});

export const savePushSubscription = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const { userId: clientUserId, subscription } = data as unknown as {
    userId: number;
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
  };
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;

  await db
    .prepare(`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id
    `)
    .run(userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth);

  return { success: true };
});

export const removePushSubscription = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  await getCurrentUser();
  const { db } = await import("./lib/db");
  const { endpoint } = data as unknown as { endpoint: string };
  await db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").run(endpoint);
  return { success: true };
});

export const getVapidPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  let key = getEnvVar("VITE_VAPID_PUBLIC_KEY");
  if (key) {
    key = key.replace(/['"]/g, "").trim();
  }
  return { publicKey: key || null };
});

export const resetFinanceStat = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  await getCurrentUser("admin");
  const { db } = await import("./lib/db");
  const { type } = data as unknown as { type: "revenue" | "payouts" | "withdrawable" };

  if (type === "revenue") {
    const rawRevenue = ((await db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM upi_deposits WHERE status = 'approved'").get()) as any)?.s || 0;
    await db.prepare("INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value RETURNING key").run("finance_revenue_offset", rawRevenue.toString());
  } else if (type === "payouts") {
    const rawPayouts = ((await db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM withdrawals WHERE status = 'completed'").get()) as any)?.s || 0;
    await db.prepare("INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value RETURNING key").run("finance_payouts_offset", rawPayouts.toString());
  } else if (type === "withdrawable") {
    const rawWithdrawable = ((await db.prepare("SELECT COALESCE(SUM(winning_balance), 0) as s FROM users").get()) as any)?.s || 0;
    await db.prepare("INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value RETURNING key").run("finance_withdrawable_offset", rawWithdrawable.toString());
  }

  return { success: true };
});

export const inviteTeamMember = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const { captainId: clientCaptainId, inviteKey } = data as any;
  const captainId = caller.role === 'admin' ? (clientCaptainId || caller.id) : caller.id;

  if (!inviteKey || !inviteKey.trim()) {
    throw new Error("Invitation key (username, IGN, or UID) is required.");
  }

  const cleanKey = inviteKey.trim();

  // 1. Find target user
  const targetUser = (await db
    .prepare(
      `
      SELECT id, username, ign, uid 
      FROM users 
      WHERE LOWER(username) = LOWER(?) OR LOWER(ign) = LOWER(?) OR uid = ?
      LIMIT 1
    `
    )
    .get(cleanKey, cleanKey, cleanKey)) as any;

  if (!targetUser) {
    throw new Error("Player not found. Please double check the username, IGN, or UID.");
  }

  if (targetUser.id === captainId) {
    throw new Error("You cannot invite yourself.");
  }

  // 2. Find captain's team
  const team = (await db.prepare("SELECT id, name FROM teams WHERE leader_id = ?").get(captainId)) as any;
  if (!team) {
    throw new Error("You do not have a team. Please create one first.");
  }

  await db.transaction(async (tx) => {
    // 3. Check if target user is captain of another team
    const isCaptain = await tx.prepare("SELECT id FROM teams WHERE leader_id = ?").get(targetUser.id);
    if (isCaptain) throw new Error("This player is already the captain of another team.");

    // 4. Check if target user is member of another team
    const isMember = await tx.prepare("SELECT team_id FROM team_members WHERE user_id = ?").get(targetUser.id);
    if (isMember) throw new Error("This player is already in a team.");

    // 5. Check if team is full
    const teamCount = (await tx
      .prepare("SELECT COUNT(*) as count FROM team_members WHERE team_id = ?")
      .get(team.id)) as any;
    if (teamCount.count >= 4) {
      throw new Error("Your team roster is full (3 players + 1 substitute).");
    }

    // 6. Check if a pending request/invite already exists
    const existing = await tx
      .prepare("SELECT id FROM team_requests WHERE team_id = ? AND user_id = ? AND status = 'pending'")
      .get(team.id, targetUser.id);
    if (existing) {
      throw new Error("A pending request or invitation already exists for this player.");
    }

    // 7. Insert the invitation
    await tx
      .prepare(
        "INSERT INTO team_requests (team_id, user_id, ign, uid, initiated_by) VALUES (?, ?, ?, ?, 'team')"
      )
      .run(team.id, targetUser.id, targetUser.ign || "", targetUser.uid || "");

    // 8. Add notification to player
    await tx
      .prepare("INSERT INTO notifications (user_id, message, redirect_url) VALUES (?, ?, ?)")
      .run(
        targetUser.id,
        `📣 Team ${team.name} has invited you to join their roster. Accept or decline on your Squad page.`,
        "/teams"
      );
  });

  // Fire push notification after transaction commits
  try {
    const { triggerPushNotification } = await import("./lib/push-server");
    await triggerPushNotification(
      targetUser.id,
      "📣 Team Invitation",
      `📣 Team ${team.name} has invited you to join their roster!`,
      "/teams"
    ).catch(() => {});
  } catch (e) {}

  return { success: true };
});

export const searchPlayers = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const { query, captainId: clientCaptainId } = data as any;
  const captainId = caller.role === 'admin' ? (clientCaptainId || caller.id) : caller.id;

  try {
    // Get all users except the captain themselves
    if (!query || query.trim().length === 0) {
      const results = (await db
        .prepare(
          `
          SELECT u.id, u.username, u.ign, u.uid, u.avatar_url
          FROM users u
          WHERE u.id != ?
          ORDER BY u.username ASC
          LIMIT 100
        `
        )
        .all(captainId)) as any[];

      console.log("Search players (all):", results?.length || 0, "found");
      return results || [];
    }

    const searchTerm = `%${query.trim().toLowerCase()}%`;

    // Search for players by username, IGN, or UID
    const results = (await db
      .prepare(
        `
        SELECT u.id, u.username, u.ign, u.uid, u.avatar_url
        FROM users u
        WHERE (LOWER(u.username) LIKE ? OR LOWER(u.ign) LIKE ? OR u.uid LIKE ?)
        AND u.id != ?
        ORDER BY u.username ASC
        LIMIT 100
      `
      )
      .all(searchTerm, searchTerm, searchTerm, captainId)) as any[];

    console.log("Search players (filtered):", results?.length || 0, "found");
    return results || [];
  } catch (err) {
    console.error("searchPlayers error:", err);
    return [];
  }
});

export const getMyTeamInvitations = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const clientUserId = data as unknown as number;
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;

  return db
    .prepare(
      `
      SELECT r.*, t.name AS team_name
      FROM team_requests r
      JOIN teams t ON r.team_id = t.id
      WHERE r.user_id = ? AND r.status = 'pending' AND r.initiated_by = 'team'
      ORDER BY r.created_at DESC
    `
    )
    .all(userId);
});

// ─── Spin Wheel ─────────────────────────────────────────────────────────────

async function loadSpinWheelConfig(db: any) {
  const {
    parseSpinWheelConfig,
    SPIN_WHEEL_SETTINGS_KEY,
    DEFAULT_SPIN_WHEEL_CONFIG,
  } = await import("./lib/spin-wheel");

  const row = (await db.prepare("SELECT value FROM site_settings WHERE key = ?").get(SPIN_WHEEL_SETTINGS_KEY)) as any;
  if (!row?.value) {
    const defaultJson = JSON.stringify(DEFAULT_SPIN_WHEEL_CONFIG);
    await db
      .prepare(
        `INSERT INTO site_settings (key, value) VALUES (?, ?)
         ON CONFLICT (key) DO NOTHING RETURNING key`,
      )
      .run(SPIN_WHEEL_SETTINGS_KEY, defaultJson);
    return parseSpinWheelConfig(defaultJson);
  }
  return parseSpinWheelConfig(row.value);
}

export const getSpinWheelConfig = createServerFn({ method: "POST" }).handler(async () => {
  const { db } = await import("./lib/db");
  const { buildWheelSlices } = await import("./lib/spin-wheel");
  const config = await loadSpinWheelConfig(db);
  const slices = buildWheelSlices(config.segments);
  return {
    segments: config.segments,
    activePrizeIds: config.activePrizeIds,
    minDeposit: config.minDeposit,
    spinPacks: config.spinPacks,
    totalSlices: slices.length,
  };
});

async function deductCgCoins(
  tx: any,
  userId: number,
  cost: number,
  description: string,
): Promise<{ fromDeposit: number; fromWinning: number }> {
  const user = (await tx
    .prepare("SELECT deposit_balance, winning_balance FROM users WHERE id = ?")
    .get(userId)) as any;
  if (!user) throw new Error("User not found");

  const deposit = user.deposit_balance || 0;
  const winning = user.winning_balance || 0;
  if (deposit + winning < cost) {
    throw new Error(`Insufficient CG coins. You need ${cost} CG.`);
  }

  let remaining = cost;
  let newDeposit = deposit;
  let newWinning = winning;
  const fromDeposit = Math.min(deposit, remaining);
  newDeposit -= fromDeposit;
  remaining -= fromDeposit;
  const fromWinning = remaining;
  newWinning -= fromWinning;

  await tx
    .prepare("UPDATE users SET deposit_balance = ?, winning_balance = ? WHERE id = ?")
    .run(newDeposit, newWinning, userId);

  if (fromDeposit > 0) {
    await tx
      .prepare("INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)")
      .run(userId, fromDeposit, "deposit_deducted", description);
  }
  if (fromWinning > 0) {
    await tx
      .prepare("INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)")
      .run(userId, fromWinning, "winnings_deducted", `${description} (withdrawable)`);
  }

  return { fromDeposit, fromWinning };
}

export const getSpinWheelStatus = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const { getTodayStartIST } = await import("./lib/spin-wheel");
  const clientUserId = data as unknown as number;
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;

  const config = await loadSpinWheelConfig(db);
  const user = (await db
    .prepare("SELECT deposit_balance, winning_balance, spin_credits FROM users WHERE id = ?")
    .get(userId)) as any;
  if (!user) throw new Error("User not found");

  const todayStart = getTodayStartIST();
  const freeSpinToday = await db
    .prepare(
      "SELECT id FROM spin_history WHERE user_id = ? AND spun_at >= ? AND is_free = true LIMIT 1",
    )
    .get(userId, todayStart);

  const depositBalance = user.deposit_balance || 0;
  const winningBalance = user.winning_balance || 0;
  const spinCredits = user.spin_credits || 0;
  const freeSpinAvailable = !freeSpinToday && depositBalance >= config.minDeposit;
  const canSpin = freeSpinAvailable || spinCredits > 0;

  const lastSpin = (await db
    .prepare("SELECT * FROM spin_history WHERE user_id = ? ORDER BY spun_at DESC LIMIT 1")
    .get(userId)) as any;

  return {
    canSpin,
    freeSpinAvailable,
    usedFreeToday: !!freeSpinToday,
    spinCredits,
    depositBalance,
    winningBalance,
    totalBalance: depositBalance + winningBalance,
    minDeposit: config.minDeposit,
    lastSpin: lastSpin
      ? {
          segmentId: lastSpin.segment_id,
          prizeAmount: lastSpin.prize_amount,
          prizeLabel: lastSpin.prize_label,
          spunAt: lastSpin.spun_at,
          isFree: !!lastSpin.is_free,
        }
      : null,
  };
});

export const purchaseSpinPack = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const { userId: clientUserId, packId } = data as any;
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;
  if (!userId || !packId) throw new Error("Invalid request");

  const config = await loadSpinWheelConfig(db);
  const pack = config.spinPacks.find((p) => p.id === packId);
  if (!pack) throw new Error("Spin pack not found");

  const result = await db.transaction(async (tx) => {
    const { fromWinning } = await deductCgCoins(
      tx,
      userId,
      pack.cost,
      `Spin pack: ${pack.label || pack.spins + " spins"}`,
    );
    await tx
      .prepare("UPDATE users SET spin_credits = COALESCE(spin_credits, 0) + ? WHERE id = ?")
      .run(pack.spins, userId);
    const updated = (await tx
      .prepare("SELECT deposit_balance, winning_balance, spin_credits FROM users WHERE id = ?")
      .get(userId)) as any;
    return {
      spinsAdded: pack.spins,
      cost: pack.cost,
      usedWinning: fromWinning > 0,
      fromWinning,
      spinCredits: updated?.spin_credits ?? 0,
      depositBalance: updated?.deposit_balance ?? 0,
      winningBalance: updated?.winning_balance ?? 0,
    };
  });

  return result;
});

export const performSpin = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const caller = await getCurrentUser();
  const { db } = await import("./lib/db");
  const {
    buildWheelSlices,
    getTodayStartIST,
    pickRandomSliceIndexForSegment,
  } = await import("./lib/spin-wheel");

  const clientUserId = data as unknown as number;
  const userId = caller.role === 'admin' ? (clientUserId || caller.id) : caller.id;

  const config = await loadSpinWheelConfig(db);
  const activeIds = config.activePrizeIds.filter((id) => config.segments.some((s) => s.id === id));
  if (activeIds.length === 0) throw new Error("Spin wheel is not configured");

  const result = await db.transaction(async (tx) => {
    const user = (await tx
      .prepare("SELECT deposit_balance, winning_balance, spin_credits FROM users WHERE id = ?")
      .get(userId)) as any;
    if (!user) throw new Error("User not found");

    const todayStart = getTodayStartIST();
    const freeSpinToday = await tx
      .prepare(
        "SELECT id FROM spin_history WHERE user_id = ? AND spun_at >= ? AND is_free = true LIMIT 1",
      )
      .get(userId, todayStart);

    const depositBalance = user.deposit_balance || 0;
    const spinCredits = user.spin_credits || 0;
    const freeAvailable = !freeSpinToday && depositBalance >= config.minDeposit;

    let isFree = false;
    if (freeAvailable) {
      isFree = true;
    } else if (spinCredits > 0) {
      await tx
        .prepare("UPDATE users SET spin_credits = spin_credits - 1 WHERE id = ?")
        .run(userId);
      isFree = false;
    } else {
      throw new Error("No spins left. Buy a spin pack below!");
    }

    const winningId = activeIds[Math.floor(Math.random() * activeIds.length)];
    const winningSegment = config.segments.find((s) => s.id === winningId)!;
    const slices = buildWheelSlices(config.segments);
    const sliceIndex = pickRandomSliceIndexForSegment(slices, winningId);

    if (winningSegment.amount > 0) {
      await tx
        .prepare("UPDATE users SET deposit_balance = deposit_balance + ? WHERE id = ?")
        .run(winningSegment.amount, userId);
      await tx
        .prepare("INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)")
        .run(
          userId,
          winningSegment.amount,
          "deposit_added",
          `Spin wheel reward: ${winningSegment.label}`,
        );
    }

    await tx
      .prepare(
        "INSERT INTO spin_history (user_id, segment_id, prize_amount, prize_label, is_free) VALUES (?, ?, ?, ?, ?)",
      )
      .run(userId, winningSegment.id, winningSegment.amount, winningSegment.label, isFree);

    const updated = (await tx
      .prepare("SELECT deposit_balance, winning_balance, spin_credits FROM users WHERE id = ?")
      .get(userId)) as any;

    return {
      segmentId: winningSegment.id,
      label: winningSegment.label,
      amount: winningSegment.amount,
      sliceIndex,
      totalSlices: slices.length,
      isFree,
      spinCredits: updated?.spin_credits ?? 0,
      newDepositBalance: updated?.deposit_balance ?? depositBalance,
      newWinningBalance: updated?.winning_balance ?? 0,
    };
  });

  return result;
});

export const getSpinWheelAdminConfig = createServerFn({ method: "POST" }).handler(async () => {
  await getCurrentUser("admin");
  const { db } = await import("./lib/db");
  return loadSpinWheelConfig(db);
});

export const saveSpinWheelAdminConfig = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  await getCurrentUser("admin");
  const { db } = await import("./lib/db");
  const { SPIN_WHEEL_SETTINGS_KEY, SPIN_MAX_ACTIVE_PRIZES } = await import("./lib/spin-wheel");

  const { config } = data as unknown as {
    config: {
      segments: Array<{ id: string; label: string; amount: number; quantity: number; color: string }>;
      activePrizeIds: string[];
      minDeposit: number;
      spinPacks: Array<{ id: string; spins: number; cost: number; label?: string }>;
    };
  };

  if (!config?.segments?.length) throw new Error("At least one wheel segment is required");

  const segments = config.segments.map((s, i) => ({
    id: s.id || `seg-${i}`,
    label: (s.label || `${s.amount} CG`).trim(),
    amount: Math.max(0, Number(s.amount) || 0),
    quantity: Math.max(1, Math.min(20, Number(s.quantity) || 1)),
    color: s.color || "#FF6B00",
  }));

  const activePrizeIds = (config.activePrizeIds || [])
    .filter((id) => segments.some((s) => s.id === id))
    .slice(0, SPIN_MAX_ACTIVE_PRIZES);

  if (activePrizeIds.length === 0) {
    throw new Error("Select at least one active prize");
  }

  const spinPacks = (config.spinPacks || []).map((p, i) => ({
    id: p.id || `pack-${i}`,
    spins: Math.max(1, Number(p.spins) || 1),
    cost: Math.max(1, Number(p.cost) || 9),
    label: p.label || `${p.spins || 1} Spin${(p.spins || 1) > 1 ? "s" : ""}`,
  }));

  if (spinPacks.length === 0) throw new Error("At least one spin pack is required");

  const payload = {
    segments,
    activePrizeIds,
    minDeposit: Math.max(0, Number(config.minDeposit) || 100),
    spinPacks,
  };

  await db
    .prepare(
      `INSERT INTO site_settings (key, value) VALUES (?, ?)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value RETURNING key`,
    )
    .run(SPIN_WHEEL_SETTINGS_KEY, JSON.stringify(payload));

  return { success: true, config: payload };
});

// ─── Profile customization shop ─────────────────────────────────────────────

async function loadProfileShopConfig(db: any) {
  const { parseProfileShopConfig, PROFILE_SHOP_SETTINGS_KEY, DEFAULT_PROFILE_SHOP } = await import(
    "./lib/profile-customization"
  );
  const row = (await db.prepare("SELECT value FROM site_settings WHERE key = ?").get(PROFILE_SHOP_SETTINGS_KEY)) as any;
  if (!row?.value) return DEFAULT_PROFILE_SHOP;
  return parseProfileShopConfig(row.value);
}

export const getProfileShop = createServerFn({ method: "POST" }).handler(async () => {
  await getCurrentUser();
  const { db } = await import("./lib/db");
  return loadProfileShopConfig(db);
});

export const purchaseProfileCosmetic = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const currentUser = await getCurrentUser();
  const userId = currentUser.id;

  const { db } = await import("./lib/db");
  const { parseJsonArray } = await import("./lib/profile-customization");
  const { itemId } = data as unknown as { itemId: string };
  if (!itemId) throw new Error("Invalid request");

  const shop = await loadProfileShopConfig(db);
  const allItems = [...(shop.frames || []), ...(shop.banners || []), ...(shop.effects || [])];
  const item = allItems.find((i) => i.id === itemId);
  if (!item) throw new Error("Item not found");

  const result = await db.transaction(async (tx) => {
    const user = (await tx
      .prepare(
        `SELECT deposit_balance, winning_balance, owned_cosmetics, profile_animation, profile_frame, profile_effect, banner_preset FROM users WHERE id = ?`,
      )
      .get(userId)) as any;
    if (!user) throw new Error("User not found");

    const owned = parseJsonArray(user.owned_cosmetics);
    if (!owned.includes(itemId)) {
      if (item.cost > 0) {
        await deductCgCoins(tx, userId, item.cost, `Profile cosmetic: ${item.label}`);
      }
      owned.push(itemId);
      await tx.prepare("UPDATE users SET owned_cosmetics = ? WHERE id = ?").run(JSON.stringify(owned), userId);
    }

    const patch: Record<string, string | null> = {};
    if (item.type === "animation") patch.profile_animation = item.value;
    if (item.type === "frame") patch.profile_frame = item.value;
    if (item.type === "effect") patch.profile_effect = item.value;
    if (item.type === "banner") {
      patch.banner_preset = item.value;
    }

    const sets = Object.entries(patch).map(([k]) => `${k} = ?`);
    if (sets.length) {
      await tx
        .prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`)
        .run(...Object.values(patch), userId);
    }

    const updated = (await tx
      .prepare(`SELECT ${PROFILE_SELECT} FROM users WHERE id = ?`)
      .get(userId)) as any;
    return { profile: await enrichProfile(db, updated, true), item };
  });

  return result;
});

export const getProfileShopAdminConfig = createServerFn({ method: "POST" }).handler(async () => {
  await getCurrentUser("admin");
  const { db } = await import("./lib/db");
  return loadProfileShopConfig(db);
});

export const saveProfileShopAdminConfig = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  await getCurrentUser("admin");
  const { db } = await import("./lib/db");
  const { PROFILE_SHOP_SETTINGS_KEY } = await import("./lib/profile-customization");
  const { config } = data as unknown as { config: any };
  await db
    .prepare(
      `INSERT INTO site_settings (key, value) VALUES (?, ?)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value RETURNING key`,
    )
    .run(PROFILE_SHOP_SETTINGS_KEY, JSON.stringify(config));
  return { success: true };
});

export const getRegistrationSquad = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  await getCurrentUser();
  const { db } = await import("./lib/db");
  const registrationId = data as unknown as number;
  const reg = (await db
    .prepare(
      `SELECT r.*, u.username, u.avatar_url, u.ign as leader_ign, tm.logo as team_logo
       FROM registrations r
       JOIN users u ON u.id = r.user_id
       LEFT JOIN teams tm ON tm.name = r.team_name
       WHERE r.id = ?`,
    )
    .get(registrationId)) as any;
  if (!reg) return null;

  let players: any[] = [];
  try {
    players = JSON.parse(reg.players_json || "[]");
  } catch {
    players = [];
  }

  const resolved = await Promise.all(
    players.map(async (p: any) => {
      const byUid = p.uid
        ? ((await db
            .prepare("SELECT id, username, avatar_url, ign FROM users WHERE uid = ? LIMIT 1")
            .get(p.uid)) as any)
        : null;
      return {
        ign: p.ign || byUid?.ign || p.name || "Player",
        uid: p.uid || "",
        userId: byUid?.id || null,
        avatar_url: byUid?.avatar_url || null,
        username: byUid?.username || null,
      };
    }),
  );

  return {
    registrationId: reg.id,
    teamName: reg.team_name || reg.username,
    teamLogo: reg.team_logo,
    leader: {
      userId: reg.user_id,
      username: reg.username,
      ign: reg.leader_ign,
      avatar_url: reg.avatar_url,
    },
    players: resolved,
    mode: reg.team_name ? "team" : "solo",
  };
});

// ─── Tournament Results Announcement ─────────────────────────────────────────

export const announceTournamentResult = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    await getCurrentUser("admin");
    const { db } = await import("./lib/db");
    const { tournamentId, results } = data as unknown as {
      tournamentId: number;
      results: Array<{
        rank: number;
        winnerId?: number;
        teamId?: number;
        prizeAmount: number;
      }>;
    };

    // Fetch tournament details
    const tournament = (await db
      .prepare("SELECT id, title, tournament_type FROM tournaments WHERE id = ?")
      .get(tournamentId)) as any;

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Collect push targets for notifications
    const pushTargets: Array<{ userId: number; title: string; body: string; url: string }> = [];

    // Process results in transaction
    await db.transaction(async (tx) => {
      for (const result of results) {
        if (result.prizeAmount <= 0) continue;

        let winnerUserId: number | null = null;

        // Determine winner user ID based on tournament type
        if (tournament.tournament_type === "battle_royale" || tournament.tournament_type === "lone_wolf") {
          // For solo modes, winnerId is the direct user ID
          winnerUserId = result.winnerId || null;
        } else if (tournament.tournament_type === "clash_squad") {
          // For Clash Squad, need to check if teamId or winnerId is provided
          // If winnerId, use it directly
          // If teamId, we'd need to distribute among team members (not implemented yet)
          winnerUserId = result.winnerId || null;
        }

        if (!winnerUserId) continue;

        // Verify user exists
        const user = (await tx.prepare("SELECT id, winning_balance FROM users WHERE id = ?").get(winnerUserId)) as any;
        if (!user) continue;

        // Update winning balance
        const newBalance = (user.winning_balance || 0) + result.prizeAmount;
        await tx
          .prepare("UPDATE users SET winning_balance = ? WHERE id = ?")
          .run(newBalance, winnerUserId);

        // Create transaction record
        await tx
          .prepare(
            "INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)",
          )
          .run(
            winnerUserId,
            result.prizeAmount,
            "tournament_prize",
            `${tournament.title} - Rank #${result.rank} Prize`,
          );

        // Add to push notification queue
        pushTargets.push({
          userId: winnerUserId,
          title: "🎉 Prize Won!",
          body: `You won ₹${result.prizeAmount} from ${tournament.title}!`,
          url: `/matches`,
        });
      }

      // Mark tournament as results announced
      await tx
        .prepare("UPDATE tournaments SET results_announced = true WHERE id = ?")
        .run(tournamentId);
    });

    // Send push notifications (after transaction completes to avoid DB locks)
    if (pushTargets.length > 0) {
      try {
        const { triggerPushNotification } = await import("./lib/push-server");
        for (const t of pushTargets) {
          triggerPushNotification(t.userId, t.title, t.body, t.url).catch(() => {});
        }
      } catch (e) {
        console.error("Failed to send push notifications:", e);
        // Don't fail the entire operation if push fails
      }
    }

    return { success: true, announcedCount: results.length };
  },
);
