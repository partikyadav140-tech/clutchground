import { createFileRoute, useRouter } from "@tanstack/react-router";

import { Trophy, ListChecks, Download, Calendar, Crosshair, Map, Swords, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth-client";
import { getMyMatches, getTournamentResults } from "../../api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { GodCoin } from "@/components/GodCoin";

export const Route = createFileRoute("/_app/matches")({
  head: () => ({ meta: [{ title: "My Matches — CLUTCHGROUND" }] }),
  component: MatchesPage,
});

function MatchesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [standingsModal, setStandingsModal] = useState<any>(null);
  const [standingsData, setStandingsData] = useState<any[]>([]);
  const [loadingStandings, setLoadingStandings] = useState(false);

  const openStandings = async (e: React.MouseEvent, t: any) => {
    e.preventDefault();
    setStandingsModal(t);
    setLoadingStandings(true);
    try {
      const data = await (getTournamentResults as any)({ data: t.id });
      setStandingsData(data || []);
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoadingStandings(false);
  };

  const downloadExcel = () => {
    if (!standingsData || standingsData.length === 0) return;
    const headers = ["Rank", "Team / Player", "Kills", "Position", "Points"];
    const rows = standingsData.map((r: any, i: number) => [
      i + 1,
      `"${(r.team_name || r.username).replace(/"/g, '""')}"`,
      r.kills || 0,
      r.position || "-",
      r.points || 0,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${standingsModal.name.replace(/\s+/g, "_")}_Standings.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.navigate({ to: "/login" });
      return;
    }
    if (!user) return;
    async function load() {
      try {
        const m = await (getMyMatches as any)({ data: user.id });
        setMatches(m || []);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [user, authLoading, router]);

  if (!user || loading)
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const upcomingMatches = matches.filter((m) => m.match_status !== "completed" && m.match_status !== "rescheduled");
  const rescheduledMatches = matches.filter((m) => m.match_status === "rescheduled");
  const pastMatches = matches.filter((m) => m.match_status === "completed");

  return (
    <div className="bg-background min-h-screen pt-2 pb-safe">
      {/* ─── Minimal App Header ─── */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2 text-cta font-bold mb-1">
          <Swords className="w-5 h-5" /> Activity
        </div>
        <h1 className="text-3xl font-display font-black text-white">Matches</h1>
      </div>

      <div className="px-4 space-y-8">
        {/* Upcoming Matches */}
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 ml-2">
            Upcoming Battles
          </h2>
          <div className="space-y-4">
            {upcomingMatches.length === 0 ? (
              <div className="bg-card border border-white/5 rounded-[1.25rem] p-10 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-white/5 text-muted-foreground flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6" />
                </div>
                <p className="font-display font-black text-lg text-white">No upcoming matches</p>
                <p className="text-sm text-muted-foreground mt-1 mb-6">
                  You haven't joined any active tournaments.
                </p>
                <a href="/tournaments" className="w-full">
                  <Button className="w-full rounded-xl font-black bg-primary text-white h-12 shadow-primary uppercase tracking-widest text-sm">
                    Find Tournaments
                  </Button>
                </a>
              </div>
            ) : (
              upcomingMatches.map((m, i) => <MatchCard m={m} i={i} key={i} />)
            )}
          </div>
        </div>

        {/* Rescheduled Matches */}
        {rescheduledMatches.length > 0 && (
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-orange-500 mb-3 ml-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Rescheduled Battles
            </h2>
            <div className="space-y-4">
              {rescheduledMatches.map((m, i) => (
                <MatchCard m={m} i={i} key={i} />
              ))}
            </div>
          </div>
        )}

        {/* Past Matches */}
        <div className="pb-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 ml-2">
            Match History
          </h2>
          <div className="space-y-4">
            {pastMatches.length === 0 ? (
              <div className="bg-card border border-white/5 rounded-[1.25rem] p-8 text-center text-muted-foreground text-sm font-semibold">
                No match history available yet.
              </div>
            ) : (
              pastMatches.map((m, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  key={i}
                >
                  <div className="bg-card border border-white/5 rounded-[1.25rem] overflow-hidden shadow-lg">
                    <a
                      href={`/tournaments/${String(m.id)}`}
                      className="block p-4 border-b border-white/5 hover:bg-white/5 transition-colors active:bg-white/10"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-display font-black text-base text-white flex-1 pr-4 truncate">
                          {m.name}
                        </h3>
                        <span className="bg-white/10 text-white/70 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm shrink-0">
                          Completed
                        </span>
                      </div>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {new Date(m.date).toLocaleDateString()}
                      </div>
                    </a>

                    {/* Results Section */}
                    <div className="p-4 bg-white/5 flex items-center justify-between gap-4">
                      <div className="flex gap-4">
                        <div className="text-center">
                          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                            Kills
                          </div>
                          <div className="font-display font-black text-base text-white">
                            {m.kills || 0}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                            Position
                          </div>
                          <div className="font-display font-black text-base text-white">
                            #{m.position || "-"}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                            Points
                          </div>
                          <div className="font-display font-black text-base text-cta">
                            {m.points || 0}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={(e) => openStandings(e, m)}
                        className="rounded-lg text-xs font-bold h-9 bg-primary/20 text-cta hover:bg-primary/30"
                      >
                        Standings
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Standings Bottom Sheet */}
      <Dialog open={!!standingsModal} onOpenChange={(v) => !v && setStandingsModal(null)}>
        <DialogContent className="max-h-[85vh] overflow-hidden flex flex-col p-0 border-white/5">
          <div className="bg-primary/20 p-6 border-b border-primary/20 relative shrink-0">
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-white/20" />
            <DialogTitle className="font-display text-xl mt-4 font-black tracking-tight leading-tight pr-10 text-white">
              🏆 {standingsModal?.name}
            </DialogTitle>
            <DialogDescription className="text-cta text-xs uppercase tracking-widest font-bold mt-1">
              Tournament Standings
            </DialogDescription>
            {user?.role === "admin" && (
              <Button
                size="sm"
                onClick={downloadExcel}
                className="absolute bottom-6 right-6 h-8 w-8 p-0 rounded-md bg-primary text-white shadow-primary"
                title="Download CSV"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 bg-background p-4">
            {loadingStandings ? (
              <div className="flex justify-center p-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : standingsData.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground text-sm font-bold">
                No standings data available yet.
              </div>
            ) : (
              <div className="bg-card border border-white/5 rounded-[1.25rem] overflow-hidden shadow-lg">
                <div className="bg-white/5 p-3 border-b border-white/5">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 ml-1">
                    <ListChecks className="w-3.5 h-3.5" />
                    Leaderboard
                  </h3>
                </div>
                <div className="divide-y divide-white/5">
                  {standingsData.map((r: any, idx: number) => (
                    <div
                      key={r.id}
                      className={`p-4 flex items-center transition-colors ${
                        idx < 3 ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex-shrink-0 mr-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-black text-sm border ${
                          idx === 0 ? 'bg-amber-500/20 text-amber-500 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]' :
                          idx === 1 ? 'bg-gray-300/20 text-gray-300 border-gray-300/50' :
                          idx === 2 ? 'bg-orange-700/20 text-orange-500 border-orange-700/50' :
                          'bg-white/5 text-muted-foreground border-white/10'
                        }`}>
                          {idx + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white truncate text-sm">
                          {r.team_name || r.username}
                        </div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 tracking-wider">
                            <Crosshair className="w-3 h-3 text-cta/70" />
                            {r.kills || 0} KILLS
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-3 text-right">
                        <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                          Points
                        </div>
                        <div className="font-display font-black text-cta text-lg">
                          {r.points || 0}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MatchCard({ m, i }: { m: any; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: i * 0.05 }}
      className="group relative rounded-[1.25rem] p-[1px] overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <a
        href={`/tournaments/${String(m.id)}`}
        className="block bg-card/80 backdrop-blur-xl rounded-[1.25rem] border border-white/5 shadow-lg overflow-hidden active:scale-[0.98] transition-transform relative z-10"
      >
        <div className={`p-4 border-b border-white/5 relative overflow-hidden ${
            m.reg_status === "pending" ? "bg-amber-500/5" : 
            m.match_status === "live" ? "bg-red-500/5" : 
            m.match_status === "rescheduled" ? "bg-orange-500/5" : "bg-black/20"
          }`}
        >
          {/* Status Badge */}
          <div className="absolute top-4 right-4 z-10">
            {m.reg_status === "pending" ? (
              <span className="bg-amber-500/20 border border-amber-500/30 text-amber-500 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                Pending
              </span>
            ) : m.match_status === "live" ? (
              <span className="bg-red-500/20 border border-red-500/30 text-red-500 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded flex items-center gap-1 shadow-[0_0_10px_rgba(239,68,68,0.4)]">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live
              </span>
            ) : m.match_status === "rescheduled" ? (
              <span className="bg-orange-500/20 border border-orange-500/30 text-orange-500 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-[0_0_10px_rgba(249,115,22,0.3)]">
                Rescheduled
              </span>
            ) : (
              <span className="bg-primary/20 border border-primary/30 text-cta text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-[0_0_10px_rgba(255,0,85,0.4)] text-glow">
                Upcoming
              </span>
            )}
          </div>

          <h3 className="font-display font-black text-lg pr-24 leading-tight text-white relative z-10 drop-shadow-md">
            {m.name}
          </h3>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground mt-2 uppercase tracking-wider relative z-10">
            <Calendar className="w-3.5 h-3.5 text-cta" />{" "}
            {new Date(m.date).toLocaleString([], {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </div>
        </div>

        {/* Room Details if available */}
        {(m.room_id || m.room_pass) && m.reg_status !== "pending" && (
          <div className="bg-primary/10 p-4 border-b border-primary/10 shadow-inner">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-3.5 h-3.5 text-cta" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-cta text-glow">
                Room Details
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {m.room_id && (
                <div className="bg-black/40 rounded-lg px-3 py-2 border border-white/5 flex-1 min-w-[100px] shadow-inner">
                  <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Room ID
                  </div>
                  <div className="font-mono font-bold text-sm text-white">
                    {m.room_id}
                  </div>
                </div>
              )}
              {m.room_pass && (
                <div className="bg-black/40 rounded-lg px-3 py-2 border border-white/5 flex-1 min-w-[100px] shadow-inner">
                  <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Password
                  </div>
                  <div className="font-mono font-bold text-sm text-white">
                    {m.room_pass}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="p-4 bg-black/40 flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Crosshair className="w-3 h-3 text-cta/70" /> {m.format}
            </span>
          </div>
          <span className="text-white flex items-center gap-1">
            <Trophy className="w-3 h-3 text-cta text-glow" />{" "}
            {m.mode === "Solo" ? (
              <>
                {m.per_kill_coin}/Kill | {m.first_place_coin} Pts <GodCoin className="w-3.5 h-3.5 text-cta" />
              </>
            ) : (
              <>
                <GodCoin className="w-3.5 h-3.5 text-cta" /> {m.prize}
              </>
            )}
          </span>
        </div>
      </a>
    </motion.div>
  );
}
