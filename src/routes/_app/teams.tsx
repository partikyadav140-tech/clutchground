import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, Plus, Search, Users, X } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { TeamDetailSheet } from "@/components/team/TeamDetailSheet";
import { TeamInvitesPanel } from "@/components/team/TeamInvitesPanel";
import {
  getAllTeams,
  getMyTeam,
  getMyTeamInvitations,
  getMyTeamRequest,
  getProfile,
} from "../../api";
import { useAuth } from "../../lib/auth-client";
import { countRosterSlots, getInitials, TEAM_ROSTER, type Team } from "@/lib/team-utils";

export const Route = createFileRoute("/_app/teams")({
  head: () => ({ meta: [{ title: "Find a Squad — ClutchGround" }] }),
  component: TeamsPage,
});

function TeamsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [invites, setInvites] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const existingTeam = await (getMyTeam as any)({ data: user.id });
      if (existingTeam) {
        router.navigate({ to: "/my-team" });
        return;
      }

      const [allTeams, request, playerInvites, playerProfile] = await Promise.all([
        (getAllTeams as any)(),
        (getMyTeamRequest as any)({ data: user.id }),
        (getMyTeamInvitations as any)({ data: user.id }),
        (getProfile as any)({ data: user.id }),
      ]);

      setTeams(allTeams || []);
      setPendingRequest(request?.status === "pending" ? request : null);
      setInvites(playerInvites || []);
      setProfile(playerProfile);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.navigate({ to: "/login" });
      return;
    }
    if (user) load();
  }, [user, authLoading, router, load]);

  const filteredTeams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((team) => {
      const haystack = [
        team.name,
        team.leader?.username,
        team.leader?.ign,
        team.leader?.uid,
        ...(team.members || []).map((m) => `${m.ign} ${m.username} ${m.uid}`),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [teams, searchQuery]);

  const openTeam = (teamId: number) => {
    setSelectedTeamId(teamId);
    setSheetOpen(true);
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-4 page-content">
      <PageHeader
        eyebrow="Squads"
        eyebrowIcon={Users}
        title="Find a team"
        action={
          <Link
            to="/my-team"
            search={{ create: "1" }}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-cta-gradient text-white text-xs font-bold shadow-cta press-effect"
          >
            <Plus className="w-4 h-4" /> Create
          </Link>
        }
      />

      <p className="text-sm text-muted-foreground -mt-1 mb-4">
        Browse squads recruiting players. Tap a team to view the full roster and send a join
        request.
      </p>

      {invites.length > 0 && (
        <div className="mb-5">
          <TeamInvitesPanel userId={user!.id} invites={invites} onUpdated={load} />
        </div>
      )}

      {pendingRequest && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4"
        >
          <p className="text-label text-amber-600 mb-1">Pending request</p>
          <p className="text-sm text-foreground">
            Waiting for <span className="font-bold">{pendingRequest.team_name || "a team"}</span> to
            accept your request.
          </p>
          <Link
            to="/my-team"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary mt-2"
          >
            View status <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search team name, captain, IGN, UID..."
          className="w-full h-11 bg-card border border-border focus:border-primary/60 outline-none pl-10 pr-10 text-sm font-medium rounded-xl"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {filteredTeams.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="font-display font-bold text-lg mb-1">
              {teams.length === 0 ? "No squads yet" : "No matches"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {teams.length === 0
                ? "Be the first captain and build your roster."
                : "Try a different search term."}
            </p>
            <Link
              to="/my-team"
              search={{ create: "1" }}
              className="inline-flex h-11 items-center px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
            >
              Create squad
            </Link>
          </div>
        ) : (
          filteredTeams.map((team, idx) => {
            const slots = countRosterSlots(team.members);
            return (
              <motion.button
                key={team.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => openTeam(team.id)}
                className="w-full text-left rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition-colors press-effect"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-primary/10 border border-primary/15 flex items-center justify-center font-display font-black text-lg text-primary shrink-0">
                    {team.logo ? (
                      <img src={team.logo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(team.name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display font-bold text-lg text-foreground truncate">
                      {team.name}
                    </h2>
                    <p className="text-xs text-muted-foreground truncate">
                      Captain: {team.leader?.ign || team.leader?.username || "—"}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        {slots.squadFilled}/{TEAM_ROSTER.TOTAL_SQUAD} squad
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          slots.isFull
                            ? "bg-destructive/10 text-destructive"
                            : "bg-emerald-500/10 text-emerald-500"
                        }`}
                      >
                        {slots.isFull ? "Full" : "Recruiting"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </div>
              </motion.button>
            );
          })
        )}
      </div>

      <TeamDetailSheet
        teamId={selectedTeamId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        user={
          user
            ? {
                id: user.id,
                username: (user as any).username,
                ign: profile?.ign || (user as any).ign,
                uid: profile?.uid || (user as any).uid,
              }
            : null
        }
        pendingTeamId={pendingRequest?.team_id}
        onRequestSent={load}
      />
    </div>
  );
}
