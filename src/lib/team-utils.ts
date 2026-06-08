export const TEAM_ROSTER = {
  /** Captain + 3 players + 1 substitute */
  TOTAL_SQUAD: 5,
  /** Rows in team_members (excluding captain) */
  MAX_MEMBERS: 4,
  MAX_PLAYERS: 3,
  MAX_SUBSTITUTES: 1,
} as const;

export type TeamMemberRole = "player" | "substitute";

export type TeamMember = {
  id?: number;
  user_id?: number | null;
  ign: string;
  uid: string;
  username?: string;
  avatar_url?: string | null;
  role?: TeamMemberRole | string;
};

export type TeamLeader = {
  username?: string;
  ign?: string;
  uid?: string;
  avatar_url?: string | null;
};

export type Team = {
  id: number;
  name: string;
  logo?: string | null;
  leader_id: number;
  members?: TeamMember[];
  leader?: TeamLeader | null;
  created_at?: string;
};

export function countRosterSlots(members: TeamMember[] = []) {
  const players = members.filter((m) => m.role !== "substitute").length;
  const substitutes = members.filter((m) => m.role === "substitute").length;
  const memberCount = members.length;
  return {
    total: memberCount,
    players,
    substitutes,
    open: TEAM_ROSTER.MAX_MEMBERS - memberCount,
    isFull: memberCount >= TEAM_ROSTER.MAX_MEMBERS,
    /** Captain + filled member slots */
    squadFilled: 1 + memberCount,
    squadOpen: TEAM_ROSTER.TOTAL_SQUAD - (1 + memberCount),
  };
}

export function roleLabel(role?: string) {
  return role === "substitute" ? "Substitute" : "Player";
}

export function getInitials(name?: string) {
  if (!name) return "?";
  return name.slice(0, 2).toUpperCase();
}

export function nextMemberRole(members: TeamMember[]): TeamMemberRole {
  const { players, substitutes } = countRosterSlots(members);
  if (players < TEAM_ROSTER.MAX_PLAYERS) return "player";
  if (substitutes < TEAM_ROSTER.MAX_SUBSTITUTES) return "substitute";
  return "player";
}
