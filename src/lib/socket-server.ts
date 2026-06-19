/**
 * Server-side WebSocket (Socket.io) manager.
 * Provides helper functions that API server functions call to emit real-time events.
 */

let io: any = null;

export function setSocketIO(instance: any) {
  io = instance;
}

export function getSocketIO() {
  if (io) return io;
  // Fallback: check globalThis.__socketIO (set in server.mjs)
  if (typeof globalThis !== "undefined" && (globalThis as any).__socketIO) {
    io = (globalThis as any).__socketIO;
    return io;
  }
  return null;
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
  const socketIo = getSocketIO();
  if (!socketIo) return;
  if (data.teamId) {
    socketIo.to(`team:${data.teamId}`).emit("new-message", data.message);
  }
  if (data.receiverId) {
    socketIo.to(`user:${data.receiverId}`).emit("new-message", data.message);
  }
}

/**
 * Emit unread chat count update to a user.
 */
export function emitUnreadCount(userId: number, count: number) {
  const socketIo = getSocketIO();
  if (!socketIo) return;
  socketIo.to(`user:${userId}`).emit("unread-count", { count });
}

/**
 * Emit team unread count update to a user.
 */
export function emitTeamUnreadCount(userId: number, teamId: number, count: number) {
  const socketIo = getSocketIO();
  if (!socketIo) return;
  socketIo.to(`user:${userId}`).emit("team-unread-count", { teamId, count });
}

/**
 * Emit new notification to a user.
 */
export function emitNotification(userId: number, notification: any) {
  const socketIo = getSocketIO();
  if (!socketIo) return;
  socketIo.to(`user:${userId}`).emit("new-notification", notification);
}

/**
 * Emit balance update to a user.
 */
export function emitBalanceUpdate(userId: number, balance?: { deposit: number; winning: number }) {
  const socketIo = getSocketIO();
  if (!socketIo) return;
  if (balance) {
    socketIo.to(`user:${userId}`).emit("balance-update", balance);
  } else {
    // Look up balance from DB
    import("./db").then(({ db }) => {
      db.prepare("SELECT deposit_balance, winning_balance FROM users WHERE id = ?")
        .get(userId)
        .then((user: any) => {
          if (user) {
            socketIo.to(`user:${userId}`).emit("balance-update", {
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
  const socketIo = getSocketIO();
  if (!socketIo) return;
  socketIo.to(`ticket:${ticketId}`).emit("ticket-reply", { ticketId, reply });
  // Also notify the user via their personal room
  socketIo.to(`user:${userId}`).emit("ticket-update", { ticketId });
}

/**
 * Emit friend request update.
 */
export function emitFriendUpdate(userId: number) {
  const socketIo = getSocketIO();
  if (!socketIo) return;
  socketIo.to(`user:${userId}`).emit("friends-update");
}
