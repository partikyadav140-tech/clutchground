import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Crown, Shield, UserRound } from "lucide-react";
import {
  countRosterSlots,
  getInitials,
  roleLabel,
  TEAM_ROSTER,
  type Team,
  type TeamMember,
} from "@/lib/team-utils";

type TeamRosterProps = {
  team: Team;
  currentUserId?: number;
  onRemoveMember?: (userId: number) => void;
  showCaptain?: boolean;
  linkProfiles?: boolean;
};

function MemberAvatar({
  name,
  avatarUrl,
  accent = "var(--primary)",
}: {
  name?: string;
  avatarUrl?: string | null;
  accent?: string;
}) {
  return (
    <div
      className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border flex items-center justify-center font-display font-bold text-sm"
      style={{ borderColor: `${accent}44`, background: `${accent}14`, color: accent }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={name || "Player"} className="w-full h-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}

function RosterRow({
  title,
  subtitle,
  badge,
  avatarUrl,
  accent,
  trailing,
  userId,
  linkProfiles,
}: {
  title: string;
  subtitle: string;
  badge: string;
  avatarUrl?: string | null;
  accent?: string;
  trailing?: ReactNode;
  userId?: number | null;
  linkProfiles?: boolean;
}) {
  const inner = (
    <>
      <MemberAvatar name={title} avatarUrl={avatarUrl} accent={accent} />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-foreground truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg bg-secondary text-muted-foreground">
          {badge}
        </span>
        {trailing}
        {linkProfiles && userId && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </div>
    </>
  );

  if (linkProfiles && userId) {
    return (
      <Link
        to="/users/$userId"
        params={{ userId: String(userId) }}
        className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-card/60 press-effect active:bg-secondary/40"
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-card/60">
      {inner}
    </div>
  );
}

function EmptySlot({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl border border-dashed border-border/80 bg-secondary/20">
      <div className="w-11 h-11 rounded-xl border border-dashed border-border flex items-center justify-center text-muted-foreground">
        <UserRound className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-muted-foreground">Open slot</p>
        <p className="text-xs text-muted-foreground/80">{label}</p>
      </div>
    </div>
  );
}

export function TeamRoster({
  team,
  currentUserId,
  onRemoveMember,
  showCaptain = true,
  linkProfiles = false,
}: TeamRosterProps) {
  const members = team.members || [];
  const slots = countRosterSlots(members);
  const players = members.filter((m) => m.role !== "substitute");
  const substitutes = members.filter((m) => m.role === "substitute");
  const isCaptain = currentUserId === team.leader_id;

  const renderMember = (member: TeamMember, badge: string) => (
    <RosterRow
      key={`${member.uid}-${member.id}`}
      title={member.ign || member.username || "Player"}
      subtitle={member.uid ? `UID ${member.uid}` : member.username ? `@${member.username}` : "—"}
      badge={badge}
      avatarUrl={member.avatar_url}
      accent={badge === "Sub" ? "var(--neon)" : "var(--primary)"}
      userId={member.user_id}
      linkProfiles={linkProfiles}
      trailing={
        isCaptain && onRemoveMember && member.user_id ? (
          <button
            type="button"
            onClick={() => onRemoveMember(member.user_id!)}
            className="text-xs font-semibold text-destructive hover:underline"
          >
            Remove
          </button>
        ) : null
      }
    />
  );

  const emptyPlayerSlots = Math.max(0, TEAM_ROSTER.MAX_PLAYERS - players.length);
  const emptySubSlots = Math.max(0, TEAM_ROSTER.MAX_SUBSTITUTES - substitutes.length);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <h3 className="font-display font-bold text-sm text-foreground">Roster</h3>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          {slots.squadFilled}/{TEAM_ROSTER.TOTAL_SQUAD} squad
        </span>
      </div>

      {showCaptain && team.leader && (
        <RosterRow
          title={team.leader.ign || team.leader.username || "Captain"}
          subtitle={team.leader.uid ? `UID ${team.leader.uid}` : `@${team.leader.username}`}
          badge="Captain"
          avatarUrl={team.leader.avatar_url}
          accent="var(--fire)"
          userId={team.leader_id}
          linkProfiles={linkProfiles}
          trailing={<Crown className="w-4 h-4 text-amber-400" />}
        />
      )}

      <div className="space-y-2">
        <p className="text-label px-1">
          Players ({players.length}/{TEAM_ROSTER.MAX_PLAYERS})
        </p>
        {players.map((m, i) => renderMember(m, `P${i + 1}`))}
        {Array.from({ length: emptyPlayerSlots }).map((_, i) => (
          <EmptySlot key={`player-empty-${i}`} label="Player slot available" />
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-label px-1">
          Substitute ({substitutes.length}/{TEAM_ROSTER.MAX_SUBSTITUTES})
        </p>
        {substitutes.map((m) => renderMember(m, "Sub"))}
        {Array.from({ length: emptySubSlots }).map((_, i) => (
          <EmptySlot key={`sub-empty-${i}`} label="Substitute slot available" />
        ))}
      </div>

      {!slots.isFull && (
        <p className="text-xs text-muted-foreground text-center pt-1">
          {slots.open} open {slots.open === 1 ? "slot" : "slots"} · {roleLabel("player")} or
          substitute
        </p>
      )}
    </div>
  );
}
