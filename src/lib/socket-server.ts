/**
 * Server-side WebSocket (Socket.io) manager.
 * Provides helper functions that API server functions call to emit real-time events.
 */

let io: any = null;

export function setSocketIO(instance: any) {
  io = instance;
}

export function getSocketIO() {
  return io;
}

/**
 * Emit a new chat message to team members or DM recipient.
 */
export function emitChatMessage(data: {
  teamId?: number;
  receiverId?: number;
  message: {
    id: number;
    sender_id: number;
    team_id: number | null;
    receiver_id: number | null;
    message: string;
    created_at: string;
    ign?: string;
    username?: string;
    avatar_url?: string;
  };
}) {
  if (!io) return;
  if (data.teamId) {
    io.to(`team:${data.teamId}`).emit("new-message", data.message);
  }
  if (data.receiverId) {
    io.to(`user:${data.receiverId}`).emit("new-message", data.message);
  }
}

/**
 * Emit unread chat count update to a user.
 */
export function emitUnreadCount(userId: number, count: number) {
  if (!io) return;
  io.to(`user:${userId}`).emit("unread-count", { count });
}

/**
 * Emit team unread count update to a user.
 */
export function emitTeamUnreadCount(userId: number, teamId: number, count: number) {
  if (!io) return;
  io.to(`user:${userId}`).emit("team-unread-count", { teamId, count });
}

/**
 * Emit new notification to a user.
 */
export function emitNotification(userId: number, notification: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit("new-notification", notification);
}

/**
 * Emit balance update to a user.
 */
export function emitBalanceUpdate(userId: number, balance?: { deposit: number; winning: number }) {
  if (!io) return;
  if (balance) {
    io.to(`user:${userId}`).emit("balance-update", balance);
  } else {
    // Look up balance from DB
    import("./db").then(({ db }) => {
      db.prepare("SELECT deposit_balance, winning_balance FROM users WHERE id = ?")
        .get(userId)
        .then((user: any) => {
          if (user) {
            io.to(`user:${userId}`).emit("balance-update", {
              deposit: user.deposit_balance || 0,
              winning: user.winning_balance || 0,
            });
          }
        })
        .catch(() => {});
    }).catch(() => {});
  }
}

/**
 * Emit ticket reply to ticket participants.
 */
export function emitTicketReply(ticketId: number, userId: number, reply: any) {
  if (!io) return;
  io.to(`ticket:${ticketId}`).emit("ticket-reply", { ticketId, reply });
  // Also notify the user via their personal room
  io.to(`user:${userId}`).emit("ticket-update", { ticketId });
}

/**
 * Emit friend request update.
 */
export function emitFriendUpdate(userId: number) {
  if (!io) return;
  io.to(`user:${userId}`).emit("friends-update");
}
