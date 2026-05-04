import { createFileRoute, useRouter, Link } from "@tanstack/react-router";

import { Trophy, ListChecks, Download, Calendar, Crosshair, Map, Swords, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth-client";
import { getMyMatches, getTournamentResults } from "../../api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { GodCoin } from "@/components/GodCoin";

export const Route = createFileRoute("/_app/matches")({
  head: () => ({ meta: [{ title: "My Matches — Professional Esports Arena" }] }),
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
      r.position || '-',
      r.points || 0
    ]);
    const csvContent = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${standingsModal.name.replace(/\s+/g, '_')}_Standings.csv`);
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

  if (!user || loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const upcomingMatches = matches.filter(m => m.match_status !== 'completed');
  const pastMatches = matches.filter(m => m.match_status === 'completed');

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* ─── Top Header (Mobile First) ─── */}
      <div className="bg-white rounded-b-[2rem] shadow-[0_4px_24px_oklch(0_0_0/0.04)] pt-6 pb-6 px-4 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-3">
            <Swords className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-black text-foreground">My Matches</h1>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">Track your tournament progress</p>
        </div>
      </div>

      <div className="px-4 mt-6">
        {/* Upcoming Matches */}
        <h2 className="text-lg font-display font-black tracking-wide text-foreground mb-3 px-1">Upcoming Battles</h2>
        <div className="space-y-4 mb-8">
          {upcomingMatches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border shadow-sm p-10 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="font-display font-bold text-lg text-foreground">No upcoming matches</p>
              <p className="text-sm text-muted-foreground mt-1 mb-6">You haven't joined any active tournaments.</p>
              <Link to="/tournaments" className="w-full">
                <Button className="w-full rounded-xl font-bold bg-primary text-white h-12 shadow-primary">Find Tournaments</Button>
              </Link>
            </div>
          ) : (
            upcomingMatches.map((m, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                key={i}
              >
                <Link to="/tournaments/$id" params={{ id: String(m.id) }} className="block bg-white rounded-2xl border border-border shadow-sm overflow-hidden active:scale-[0.99] transition-transform">
                  <div className={`p-4 border-b border-border/50 relative overflow-hidden ${m.reg_status === 'pending' ? 'bg-amber-50' : m.match_status === 'live' ? 'bg-red-50' : ''}`}>
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      {m.reg_status === 'pending' ? (
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-sm">Pending</span>
                      ) : m.match_status === 'live' ? (
                        <span className="bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded flex items-center gap-1 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
                        </span>
                      ) : (
                        <span className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-sm">Upcoming</span>
                      )}
                    </div>

                    <h3 className="font-display font-black text-lg pr-20 leading-tight text-foreground">{m.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mt-2 uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5 text-primary" /> {new Date(m.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </div>

                  {/* Room Details if available */}
                  {(m.room_id || m.room_pass) && m.reg_status !== 'pending' && (
                    <div className="bg-primary/5 p-4 border-b border-primary/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">Room Details</span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {m.room_id && (
                          <div className="bg-white rounded-lg px-3 py-2 border border-primary/20 shadow-sm flex-1">
                            <div className="text-[9px] font-bold text-muted-foreground uppercase">Room ID</div>
                            <div className="font-mono font-black text-sm text-foreground">{m.room_id}</div>
                          </div>
                        )}
                        {m.room_pass && (
                          <div className="bg-white rounded-lg px-3 py-2 border border-primary/20 shadow-sm flex-1">
                            <div className="text-[9px] font-bold text-muted-foreground uppercase">Password</div>
                            <div className="font-mono font-black text-sm text-foreground">{m.room_pass}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer Info */}
                  <div className="p-4 bg-secondary/10 flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1"><Crosshair className="w-3.5 h-3.5" /> {m.format}</span>
                    </div>
                    <span className="text-primary flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /> {m.mode === 'Solo' ? <>{m.per_kill_coin}/Kill | {m.first_place_coin} Win <GodCoin className="w-3.5 h-3.5" /></> : <><GodCoin className="w-3.5 h-3.5" /> {m.prize}</>}</span>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>

        {/* Past Matches */}
        <h2 className="text-lg font-display font-black tracking-wide text-foreground mb-3 px-1">Match History</h2>
        <div className="space-y-4">
          {pastMatches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center text-muted-foreground text-sm font-semibold">
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
                <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                  <Link to="/tournaments/$id" params={{ id: String(m.id) }} className="block p-4 border-b border-border/50 hover:bg-secondary/20 transition-colors active:bg-secondary/40">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-display font-black text-base text-foreground flex-1 pr-4">{m.name}</h3>
                      <span className="bg-muted text-muted-foreground text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm shrink-0">Completed</span>
                    </div>
                    <div className="text-xs font-semibold text-muted-foreground">{new Date(m.date).toLocaleDateString()}</div>
                  </Link>

                  {/* Results Section */}
                  <div className="p-4 bg-secondary/10 flex items-center justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="text-center">
                        <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Kills</div>
                        <div className="font-display font-black text-base text-foreground">{m.kills || 0}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Position</div>
                        <div className="font-display font-black text-base text-foreground">#{m.position || '-'}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Points</div>
                        <div className="font-display font-black text-base text-primary">{m.points || 0}</div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => openStandings(e, m)} 
                      className="rounded-xl text-xs font-bold h-9 bg-white shadow-sm border-primary/20 text-primary"
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

      {/* Standings Modal */}
      <Dialog open={!!standingsModal} onOpenChange={(v) => !v && setStandingsModal(null)}>
        <DialogContent className="w-[90vw] max-w-lg bg-white border-0 rounded-[1.5rem] p-0 overflow-hidden max-h-[85vh] flex flex-col">
          <div className="bg-primary p-5 text-white relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
            <DialogTitle className="font-display text-xl font-black tracking-tight leading-tight pr-10">
              Results: {standingsModal?.name}
            </DialogTitle>
            <Button 
              size="sm" 
              onClick={downloadExcel} 
              className="absolute top-4 right-4 h-8 w-8 p-0 rounded-lg bg-white/20 text-white hover:bg-white/30"
              title="Download Excel"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="overflow-y-auto flex-1 bg-secondary/10">
            {loadingStandings ? (
               <div className="p-10 flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : standingsData.length === 0 ? (
               <div className="p-10 text-center text-muted-foreground font-semibold text-sm">No standings published yet.</div>
            ) : (
              <div className="divide-y divide-border/50">
                {standingsData.map((r: any, idx: number) => (
                  <div key={r.id} className="p-4 flex items-center bg-white hover:bg-primary/5 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-display font-black text-sm text-muted-foreground mr-3">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-foreground truncate">{r.team_name || r.username}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex gap-3">
                        <span>Kills: {r.kills || 0}</span>
                        <span>Pos: #{r.position || '-'}</span>
                      </div>
                    </div>
                    <div className="ml-3 text-right">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Points</div>
                      <div className="font-display font-black text-primary text-xl leading-none">{r.points || 0}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
