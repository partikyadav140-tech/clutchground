import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Trophy, Calendar, Crosshair, Download, Swords, Info, Clock, Zap, ListChecks, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth-client";
import { getMyMatches, getTournamentResults } from "../../api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
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
  const [standingsTournament, setStandingsTournament] = useState<any>(null);
  const [standings, setStandings] = useState<any[]>([]);
  const [loadingStandings, setLoadingStandings] = useState(false);
  const [tab, setTab] = useState<"upcoming" | "history">("upcoming");

  useEffect(() => {
    if (!authLoading && !user) { router.navigate({ to: "/login" }); return; }
    if (!user) return;
    (async () => {
      try {
        const m = await (getMyMatches as any)({ data: user.id });
        setMatches(m || []);
      } catch {}
      setLoading(false);
    })();
  }, [user, authLoading]);

  const openStandings = async (m: any) => {
    setStandingsTournament(m);
    setLoadingStandings(true);
    try {
      const data = await (getTournamentResults as any)({ data: m.id });
      setStandings(data || []);
    } catch (e: any) { toast.error(e.message); }
    setLoadingStandings(false);
  };

  const downloadCSV = () => {
    if (!standings.length) return;
    const csv = [["Rank","Team/Player","Kills","Position","Points"].join(","),
      ...standings.map((r: any, i: number) => [i+1, `"${(r.team_name||r.username).replace(/"/g,'""')}"`, r.kills||0, r.position||"-", r.points||0].join(","))
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${standingsTournament?.name?.replace(/\s+/g,"_")}_Standings.csv`;
    a.click();
  };

  if (!user || loading) return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const upcoming = matches.filter(m => m.match_status !== "completed");
  const history  = matches.filter(m => m.match_status === "completed");

  return (
    <div className="min-h-screen bg-background pb-[80px]">
      {/* ── Header ── */}
      <div className="px-4 pt-5 pb-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Activity</p>
        <h1 className="font-display font-black text-2xl text-foreground">My Matches</h1>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="px-4 mb-5">
        <div className="flex bg-secondary rounded-2xl p-1 gap-1">
          {(["upcoming","history"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all press-effect active:scale-95 ${
                tab === t ? "text-white shadow-sm" : "text-muted-foreground"
              }`}
              style={tab === t ? { background: "var(--gradient-primary)" } : {}}>
              {t === "upcoming" ? `Active (${upcoming.length})` : `History (${history.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 flex flex-col gap-3">
        <AnimatePresence mode="wait">
          {tab === "upcoming" ? (
            <motion.div key="upcoming" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.15 }}>
              {upcoming.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No Active Matches"
                  subtitle="You haven't joined any tournaments yet."
                  cta={{ label: "Find Tournaments", to: "/tournaments" }}
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {upcoming.map((m, i) => <MatchCard key={i} m={m} i={i} />)}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="history" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}>
              {history.length === 0 ? (
                <EmptyState icon={Trophy} title="No Match History" subtitle="Complete tournaments to see your results here." />
              ) : (
                <div className="flex flex-col gap-3">
                  {history.map((m, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-card">
                        {/* Top */}
                        <Link to={`/tournaments/${String(m.id)}` as any}
                          className="flex items-start justify-between p-4 border-b border-border active:bg-secondary/40 transition-colors">
                          <div className="flex-1 min-w-0 pr-3">
                            <h3 className="font-display font-black text-sm text-foreground leading-tight truncate">{m.name}</h3>
                            <div className="flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground font-semibold">
                                {new Date(m.date).toLocaleDateString([], { day: "numeric", month: "short" })}
                              </span>
                            </div>
                          </div>
                          <span className="text-[9px] font-black px-2.5 py-1 rounded-full border shrink-0 mt-0.5"
                            style={{ background: "rgba(100,116,139,0.1)", color: "#94a3b8", borderColor: "rgba(100,116,139,0.2)" }}>
                            Completed
                          </span>
                        </Link>

                        {/* Stats */}
                        <div className="flex items-stretch divide-x divide-border">
                          {[
                            { label: "Kills",    value: m.kills    || 0 },
                            { label: "Position", value: `#${m.position || "-"}` },
                            { label: "Points",   value: m.points   || 0, highlight: true },
                          ].map(({ label, value, highlight }) => (
                            <div key={label} className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5">
                              <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">{label}</span>
                              <span className={`font-display font-black text-base ${highlight ? "text-primary" : "text-foreground"}`}>{value}</span>
                            </div>
                          ))}
                          <button onClick={() => openStandings(m)}
                            className="px-4 flex flex-col items-center justify-center gap-0.5 active:bg-secondary/60 transition-colors press-effect">
                            <ListChecks className="w-4 h-4 text-muted-foreground" />
                            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Board</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Standings Sheet ── */}
      <Dialog open={!!standingsTournament} onOpenChange={v => !v && setStandingsTournament(null)}>
        <DialogContent className="max-h-[88vh] flex flex-col rounded-3xl border border-border bg-card p-0 overflow-hidden">
          {/* Sheet handle + header */}
          <div className="relative pt-3 pb-4 px-5 border-b border-border shrink-0">
            <div className="w-10 h-1 rounded-full bg-border mx-auto mb-3" />
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="font-display font-black text-base text-foreground leading-tight">
                  🏆 {standingsTournament?.name}
                </DialogTitle>
                <p className="text-[10px] font-black uppercase tracking-widest mt-0.5 text-primary">Tournament Standings</p>
              </div>
              {(user as any)?.role === "admin" && (
                <button onClick={downloadCSV}
                  className="w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground press-effect active:scale-90">
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loadingStandings ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : standings.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground font-semibold py-8">No standings data yet.</p>
            ) : (
              <div className="bg-background rounded-2xl border border-border overflow-hidden">
                {standings.map((r: any, idx: number) => {
                  const medals = ["🥇", "🥈", "🥉"];
                  return (
                    <div key={r.id} className={`flex items-center gap-3 px-4 py-3 ${idx < standings.length - 1 ? "border-b border-border" : ""} ${idx < 3 ? "bg-primary/3" : ""}`}>
                      <span className="w-7 text-center text-base">{idx < 3 ? medals[idx] : <span className="text-xs font-black text-muted-foreground">{idx+1}</span>}</span>
                      <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center font-display font-black text-xs text-foreground shrink-0">
                        {(r.team_name || r.username || "?")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">{r.team_name || r.username}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-0.5 text-[9px] font-black text-muted-foreground uppercase">
                            <Crosshair className="w-2.5 h-2.5" /> {r.kills || 0} kills
                          </span>
                        </div>
                      </div>
                      <span className="font-display font-black text-sm" style={{ color: "var(--primary)" }}>{r.points || 0}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MatchCard({ m, i }: { m: any; i: number }) {
  const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    live:        { label: "LIVE",        color: "#f87171", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.25)" },
    pending:     { label: "PENDING",     color: "#fbbf24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.25)" },
    rescheduled: { label: "RESCHEDULED", color: "#fb923c", bg: "rgba(251,146,60,0.1)", border: "rgba(251,146,60,0.25)" },
    upcoming:    { label: "UPCOMING",    color: "var(--primary)", bg: "rgba(0,200,255,0.08)", border: "rgba(0,200,255,0.2)" },
  };
  const s = statusConfig[m.match_status === "pending" ? "pending" : m.match_status === "rescheduled" ? "rescheduled" : m.match_status === "live" ? "live" : "upcoming"];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
      <Link to={`/tournaments/${String(m.id)}` as any}
        className="block bg-card rounded-2xl border border-border overflow-hidden shadow-card press-effect active:scale-[0.98] transition-transform">
        {/* Header */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-display font-black text-sm text-foreground leading-tight flex-1 truncate">{m.name}</h3>
            <span className="text-[9px] font-black px-2.5 py-1 rounded-full border shrink-0"
              style={{ color: s.color, background: s.bg, borderColor: s.border }}>
              {s.label === "LIVE" ? (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> {s.label}
                </span>
              ) : s.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-semibold text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(m.date).toLocaleDateString([], { dateStyle: "short" })}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(m.date).toLocaleTimeString([], { timeStyle: "short" })}</span>
            <span className="flex items-center gap-1"><Crosshair className="w-3 h-3" />{m.format}</span>
          </div>
        </div>

        {/* Room details */}
        {(m.room_id || m.room_pass) && m.reg_status !== "pending" && (
          <div className="px-4 pb-3">
            <div className="rounded-2xl p-3 border flex gap-3" style={{ background: "rgba(0,200,255,0.05)", borderColor: "rgba(0,200,255,0.15)" }}>
              <div className="flex items-center gap-1 mb-1">
                <Info className="w-3 h-3" style={{ color: "var(--primary)" }} />
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "var(--primary)" }}>Room Details</span>
              </div>
              <div className="flex gap-3">
                {m.room_id && (
                  <div>
                    <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mb-0.5">Room ID</p>
                    <p className="font-mono font-black text-sm text-foreground">{m.room_id}</p>
                  </div>
                )}
                {m.room_pass && (
                  <div>
                    <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mb-0.5">Password</p>
                    <p className="font-mono font-black text-sm text-foreground">{m.room_pass}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-secondary/30 border-t border-border">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{m.mode}</span>
          <span className="flex items-center gap-1 text-xs font-black" style={{ color: "var(--primary)" }}>
            <GodCoin className="w-3.5 h-3.5" />
            {m.mode === "Solo" ? `${m.per_kill_coin}/kill` : m.prize}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function EmptyState({ icon: Icon, title, subtitle, cta }: { icon: any; title: string; subtitle: string; cta?: { label: string; to: string } }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 bg-card rounded-2xl border border-border text-center">
      <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-muted-foreground opacity-40" />
      </div>
      <p className="font-display font-black text-base text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground font-medium max-w-[200px] mb-5">{subtitle}</p>
      {cta && (
        <Link to={cta.to as any}>
          <button className="h-10 px-6 rounded-xl text-xs font-black uppercase tracking-widest text-white press-effect active:scale-95"
            style={{ background: "var(--gradient-cta)" }}>
            {cta.label}
          </button>
        </Link>
      )}
    </div>
  );
}
