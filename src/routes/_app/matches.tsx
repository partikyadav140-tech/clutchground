import { createFileRoute, useRouter, Link } from "@tanstack/react-router";

import { Trophy, ListChecks, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth-client";
import { getMyMatches, getTournamentResults } from "../../api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/matches")({
  head: () => ({ meta: [{ title: "My Matches — GOD ESPORTS" }] }),
  component: MatchesPage,
});

function MatchesPage() {
  const { user } = useAuth();
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
    if (!user) {
      if (!loading) router.navigate({ to: "/login" });
      return;
    }
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
  }, [user]);

  if (!user || loading) return <div className="p-20 text-center">Loading...</div>;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-16">
      <PageHeader title="My Matches" subtitle="Your Battlefield Journey" />
      
      <div className="mt-8 max-w-4xl mx-auto space-y-12">
        <div>
          <h2 className="text-xl font-display font-black tracking-widest uppercase mb-4 text-primary flex items-center gap-2"><Trophy className="w-5 h-5"/> Upcoming Matches</h2>
          <div className="space-y-6">
            {matches.filter(m => m.match_status !== 'completed').length === 0 ? (
              <div className="bg-secondary/40 border border-primary/20 shadow-md clip-notch p-12 text-center text-muted-foreground flex flex-col items-center">
                <Trophy className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm">No upcoming matches. Join a tournament!</p>
              </div>
            ) : (
              matches.filter(m => m.match_status !== 'completed').map((m, i) => (
                <Link key={i} to="/tournaments/$id" params={{ id: String(m.id) }} className={`bg-secondary/40 border border-primary/20 shadow-md clip-notch flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:border-primary/60 hover:shadow-fire/20 transition-all gap-4 ${m.reg_status === 'pending' ? 'border-l-4 border-l-yellow-500' : ''}`}>
                  <div>
                    <div className="font-display font-bold text-lg text-primary flex items-center flex-wrap gap-2">
                      {m.name}
                      {m.reg_status === 'pending' && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/50 uppercase tracking-widest">Waiting for Captain</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Starts: {new Date(m.date).toLocaleString()}</div>
                    {(m.room_id || m.room_pass) && (
                      <div className="mt-3 bg-secondary/50 border border-primary/30 p-2 rounded flex flex-wrap gap-4 text-sm font-mono text-primary shadow-fire max-w-fit clip-notch">
                        {m.room_id && <div><span className="text-muted-foreground text-[10px] uppercase tracking-widest mr-1 font-sans font-bold">Room ID:</span>{m.room_id}</div>}
                        {m.room_pass && <div><span className="text-muted-foreground text-[10px] uppercase tracking-widest mr-1 font-sans font-bold">Pass:</span>{m.room_pass}</div>}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-8 text-right bg-secondary/20 p-3 rounded-md border border-border/40">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Format</div>
                      <div className="font-display font-black text-sm">{m.format}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Prize Pool</div>
                      <div className="font-display font-black text-sm text-fire-gradient">₹{m.prize}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</div>
                      <div className={`font-display font-black text-sm uppercase px-2 py-0.5 rounded border ${m.reg_status === 'pending' ? 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10' : m.match_status === 'live' ? 'text-green-500 border-green-500/30 bg-green-500/10' : 'text-primary border-primary/30 bg-primary/10'}`}>
                        {m.reg_status === 'pending' ? 'Pending Approval' : m.match_status}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-display font-black tracking-widest uppercase mb-4 text-muted-foreground">Past Matches</h2>
          <div className="space-y-6">
            {matches.filter(m => m.match_status === 'completed').length === 0 ? (
              <div className="bg-secondary/30 border border-border/50 shadow-sm clip-notch p-8 text-center text-muted-foreground text-sm">
                No past match history available.
              </div>
            ) : (
              matches.filter(m => m.match_status === 'completed').map((m, i) => (
                <Link key={i} to="/tournaments/$id" params={{ id: String(m.id) }} className="bg-secondary/30 border border-border/50 shadow-sm clip-notch flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:border-primary/30 hover:bg-secondary/50 transition-all gap-4">
                  <div>
                    <div className="font-display font-bold text-lg text-primary">{m.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">Date: {new Date(m.date).toLocaleString()}</div>
                    {(m.points > 0 || m.position > 0) && (
                      <div className="mt-3 bg-secondary/50 border border-primary/30 p-2 rounded flex flex-wrap gap-4 text-sm font-mono text-primary shadow-fire max-w-fit clip-notch">
                        <div><span className="text-muted-foreground text-[10px] uppercase tracking-widest mr-1 font-sans font-bold">Kills:</span>{m.kills || 0}</div>
                        <div><span className="text-muted-foreground text-[10px] uppercase tracking-widest mr-1 font-sans font-bold">Match Position:</span>{m.position || 0}</div>
                        <div><span className="text-muted-foreground text-[10px] uppercase tracking-widest mr-1 font-sans font-bold">Points:</span>{m.points || 0}</div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-8 text-right bg-secondary/20 p-3 rounded-md border border-border/40">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Format</div>
                      <div className="font-display font-black text-sm">{m.format}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Prize Pool</div>
                      <div className="font-display font-black text-sm text-fire-gradient">₹{m.prize}</div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0 border-l border-border/40 pl-4 ml-2">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground text-center">Status</div>
                        <div className="font-display font-black text-sm uppercase px-2 py-0.5 rounded border text-muted-foreground border-muted-foreground/30 bg-muted-foreground/10 text-center">
                          {m.match_status}
                        </div>
                      </div>
                      <div className="mt-1">
                        <span onClick={(e) => openStandings(e, m)} className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-widest text-primary border border-primary/40 bg-primary/10 px-2 py-1 hover:bg-primary/20 transition-colors cursor-pointer">
                          <ListChecks className="w-3 h-3" /> Full Standings
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Standings Modal */}
      <Dialog open={!!standingsModal} onOpenChange={(v) => !v && setStandingsModal(null)}>
        <DialogContent className="max-w-3xl bg-card border-primary/40 clip-notch p-6 max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex justify-between items-center pr-4">
              <DialogTitle className="font-display text-xl font-black text-fire-gradient">Final Standings - {standingsModal?.name}</DialogTitle>
              <Button variant="outlineFire" size="sm" onClick={downloadExcel} className="h-8 text-xs py-0">
                <Download className="w-3 h-3 mr-2" /> Download Excel
              </Button>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto mt-4">
            {loadingStandings ? (
               <div className="p-10 text-center">Loading standings...</div>
            ) : standingsData.length === 0 ? (
               <div className="p-10 text-center text-muted-foreground">No final standings available yet.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-secondary/50 border-y border-border">
                  <tr>
                    <th className="px-4 py-3 font-display">Rank</th>
                    <th className="px-4 py-3 font-display">Team / Player</th>
                    <th className="px-4 py-3 font-display text-center">Kills</th>
                    <th className="px-4 py-3 font-display text-center">Position</th>
                    <th className="px-4 py-3 font-display text-right text-primary">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {standingsData.map((r: any, idx: number) => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                      <td className="px-4 py-3 font-display font-black text-muted-foreground">#{idx + 1}</td>
                      <td className="px-4 py-3 font-bold text-foreground">{r.team_name || r.username}</td>
                      <td className="px-4 py-3 text-center">{r.kills || 0}</td>
                      <td className="px-4 py-3 text-center">{r.position || '-'}</td>
                      <td className="px-4 py-3 text-right font-display font-black text-fire-gradient text-lg">{r.points || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <span className="w-8 h-px bg-primary" />
        <span className="text-xs font-display tracking-[0.3em] text-primary uppercase">{subtitle}</span>
      </div>
      <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground">{title}</h1>
    </div>
  );
}
