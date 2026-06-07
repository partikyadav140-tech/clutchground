import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { getAllTeams, getMyTeam, getMyTeamRequest, requestJoinTeam } from "../../api";
import { useAuth } from "../../lib/auth-client";

export const Route = createFileRoute("/_app/teams")({
  head: () => ({ meta: [{ title: "Join a Squad — CLUTCHGROUND" }] }),
  component: TeamsPage,
});

function TeamsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<any[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<any[]>([]);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!authLoading && !user) {
        router.navigate({ to: "/login" });
        return;
      }
      if (!user) return;

      try {
        const team = await (getMyTeam as any)({ data: user.id });
        if (team) {
          router.navigate({ to: "/my-team" });
          return;
        }

        const request = await (getMyTeamRequest as any)({ data: user.id });
        setPendingRequest(request?.status === "pending" ? request : null);

        const allTeams = await (getAllTeams as any)();
        setTeams(allTeams || []);
        setFilteredTeams(allTeams || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, authLoading, router]);

  useEffect(() => {
    const filtered = teams.filter((team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTeams(filtered);
  }, [searchQuery, teams]);

  const handleJoinRequest = async (teamId: number) => {
    if (!user) return;
    setSubmitting(teamId);
    const toastId = toast.loading("Sending join request...");

    try {
      await (requestJoinTeam as any)({
        data: {
          teamId,
          userId: user.id,
          ign: user.ign || user.username,
          uid: user.uid || String(user.id),
        },
      });

      toast.success("Join request sent!", { id: toastId });
      setPendingRequest({ team_id: teamId, status: "pending" });
    } catch (err: any) {
      toast.error(err.message || "Failed to send join request", { id: toastId });
    } finally {
      setSubmitting(null);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-[100px]">
      <div className="px-4 pt-4 pb-6 sticky top-0 z-40 bg-background border-b border-border/50">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                Join a Squad
              </p>
              <h1 className="font-display font-black text-3xl text-foreground">
                Browse Teams
              </h1>
            </div>
            <Link to="/my-team?create=1" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cta-gradient px-4 py-3 text-sm font-black text-cta-foreground shadow-cta border border-cta/50">
              <Plus className="w-4 h-4" /> Create Squad
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search teams by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary border border-border focus:border-primary/60 outline-none pl-10 pr-4 py-3 text-sm font-bold rounded-xl transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 space-y-5">
        {pendingRequest && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-amber-200 bg-amber-50 p-5"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-black text-amber-600 mb-1">
                  Pending Request
                </p>
                <p className="text-sm text-foreground">
                  Your request to join <span className="font-bold text-foreground">{pendingRequest.team_name || "this team"}</span> is still pending.
                </p>
              </div>
              <Link to="/my-team" className="text-xs font-black uppercase tracking-widest text-primary hover:text-primary/80">
                View status
              </Link>
            </div>
          </motion.div>
        )}

        {filteredTeams.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-8 text-center space-y-4"
          >
            <Users className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
            <div>
              <h3 className="font-display font-black text-lg text-foreground mb-1">
                {teams.length === 0 ? "No teams available yet" : "No teams found"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {teams.length === 0
                  ? "Create your own squad and be the first to recruit players."
                  : "Try adjusting your search query."}
              </p>
            </div>
            <Link to="/my-team?create=1">
              <Button className="h-11 rounded-xl bg-cta-gradient text-cta-foreground font-black uppercase tracking-widest text-xs shadow-cta border border-cta/50">
                <Plus className="w-4 h-4 mr-2" /> Create Squad
              </Button>
            </Link>
          </motion.div>
        ) : (
          <motion.div className="space-y-4">
            {filteredTeams.map((team, idx) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/50 transition-colors"
              >
                <div className="p-5 space-y-4">
                  {/* Team Header with Logo */}
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 shrink-0 rounded-xl bg-gradient-to-br from-primary to-[#d95a00] flex items-center justify-center font-display font-black text-2xl text-white shadow-lg overflow-hidden">
                      {team.logo ? (
                        <img src={team.logo} className="w-full h-full object-cover" alt={team.name} />
                      ) : (
                        team.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-display font-black text-xl text-foreground mb-1 truncate">
                        {team.name}
                      </h2>
                      <p className="text-sm text-muted-foreground mb-3">
                        {team.members?.length || 0} member{team.members?.length === 1 ? "" : "s"}
                      </p>
                      {team.leader && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">Captain:</span> {team.leader.ign || team.leader.username}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Team Members Preview */}
                  {team.members && team.members.length > 0 && (
                    <div className="border-t border-border/50 pt-4">
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">
                        Members
                      </p>
                      <div className="space-y-2">
                        {team.members.slice(0, 3).map((member: any, i: number) => (
                          <div key={i} className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">{member.ign || member.username || "Unknown"}</span>
                            {member.uid && <span className="text-muted-foreground ml-2 font-mono">({member.uid})</span>}
                          </div>
                        ))}
                        {team.members.length > 3 && (
                          <p className="text-xs text-muted-foreground italic">
                            +{team.members.length - 3} more member{team.members.length - 3 === 1 ? "" : "s"}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-border/50">
                    <Button
                      disabled={Boolean(pendingRequest) || submitting === team.id}
                      onClick={() => handleJoinRequest(team.id)}
                      className="w-full h-10 rounded-xl bg-primary text-white font-bold text-xs"
                    >
                      {submitting === team.id ? "Sending…" : "Request Join"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
