import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Trophy, Calendar, Crosshair, Swords, Info, Clock, Zap, ListChecks, CheckCircle2, Star, Shield, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth-client";
import { getMyMatches, getTournamentResults } from "../../api";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { GodCoin } from "@/components/GodCoin";
import { StandingsCard } from "@/components/StandingsCard";

const POSTERS = [
  "/posters/poster1.jpg", "/posters/poster2.jpg", "/posters/poster3.jpg",
  "/posters/poster4.jpg", "/posters/poster5.jpg", "/posters/poster6.jpg",
];

const MODE: Record<string, { color: string; glow: string; gradient: string; bg: string }> = {
  Solo:  { color: "#00c8ff", glow: "rgba(0,200,255,0.35)",   gradient: "linear-gradient(135deg,#00c8ff,#0080ff)", bg: "rgba(0,200,255,0.08)" },
  Duo:   { color: "#a78bfa", glow: "rgba(167,139,250,0.35)", gradient: "linear-gradient(135deg,#a78bfa,#7c3aed)", bg: "rgba(167,139,250,0.08)" },
  Squad: { color: "#ff6b00", glow: "rgba(255,107,0,0.35)",   gradient: "linear-gradient(135deg,#ff6b00,#ff0055)", bg: "rgba(255,107,0,0.08)" },
};

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
                    <HistoryMatchCard key={i} m={m} i={i} openStandings={openStandings} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Standings Sheet ── */}
      <Dialog open={!!standingsTournament} onOpenChange={v => !v && setStandingsTournament(null)}>
        <DialogContent className="max-h-[92vh] flex flex-col rounded-3xl border border-border bg-card p-0 overflow-hidden">
          {/* Sheet handle + header */}
          <div className="relative pt-3 pb-4 px-5 border-b border-border shrink-0">
            <div className="w-10 h-1 rounded-full bg-border mx-auto mb-3" />
            <DialogTitle className="font-display font-black text-base text-foreground leading-tight">
              🏆 {standingsTournament?.name}
            </DialogTitle>
            <p className="text-[10px] font-black uppercase tracking-widest mt-0.5" style={{ color: "var(--primary)" }}>Final Standings</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loadingStandings ? (
              <div className="flex justify-center py-16">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <StandingsCard
                tournamentName={standingsTournament?.name || ""}
                mode={standingsTournament?.format || standingsTournament?.mode || "Solo"}
                results={standings}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MatchCard({ m, i }: { m: any; i: number }) {
  const poster  = (m.banner && m.banner.startsWith("http")) ? m.banner : POSTERS[m.id % POSTERS.length];
  const slots   = Number(m.slots) || 1;
  const filled  = Number(m.filled) || 0;
  const fillPct = Math.min(100, Math.round((filled / slots) * 100));
  const isFull  = filled >= slots;
  const isLive  = m.match_status === "live";
  const isFree  = m.entry === 0;
  const mc      = MODE[m.mode] || MODE.Solo;

  const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    live:        { label: "LIVE",        color: "#f87171", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.25)" },
    pending:     { label: "PENDING",     color: "#fbbf24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.25)" },
    rescheduled: { label: "RESCHEDULED", color: "#fb923c", bg: "rgba(251,146,60,0.1)", border: "rgba(251,146,60,0.25)" },
    upcoming:    { label: "UPCOMING",    color: "var(--primary)", bg: "rgba(0,200,255,0.08)", border: "rgba(0,200,255,0.2)" },
  };
  const s = statusConfig[m.match_status === "pending" ? "pending" : m.match_status === "rescheduled" ? "rescheduled" : m.match_status === "live" ? "live" : "upcoming"];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
      <div
        className="rounded-3xl p-[1.5px] group cursor-pointer"
        style={{ background: `linear-gradient(135deg, ${mc.color}44, transparent 60%, ${mc.color}22)` }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 28px ${mc.glow}, 0 8px 32px rgba(0,0,0,0.3)`)}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
      >
        <div className="rounded-[calc(1.5rem-1.5px)] overflow-hidden bg-card">

          {/* Banner */}
          <div className="relative overflow-hidden" style={{ height: 150 }}>
            <img src={poster} alt={m.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 60%, rgba(8,12,20,0.97) 100%)" }} />

            {/* Badges */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
              {isLive ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase text-white bg-red-500/90 backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />LIVE
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase backdrop-blur-md border"
                  style={{ color: s.color, background: s.bg, borderColor: s.border }}>
                  {s.label}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase text-white bg-black/55 backdrop-blur-md border border-white/10"
                style={{ borderColor: `${mc.color}44` }}>
                {m.mode}
              </span>
            </div>
            {isFree && (
              <div className="absolute top-2.5 right-2.5">
                <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-emerald-500/90 text-white">FREE</span>
              </div>
            )}

            {/* Title */}
            <div className="absolute bottom-2.5 left-3 right-3">
              <div className="flex items-center gap-1 mb-1 text-[8px] font-black uppercase tracking-widest" style={{ color: mc.color }}>
                <Star className="w-2.5 h-2.5" />Free Fire
              </div>
              <h3 className="font-display font-black text-base leading-tight line-clamp-1 drop-shadow-lg text-white">{m.name}</h3>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-stretch divide-x divide-border">
            {[
              { label: "Entry", value: isFree ? "FREE" : m.entry, coin: !isFree, clr: isFree ? "#10b981" : mc.color },
              { label: "Prize", value: m.mode === "Solo" ? `${m.per_kill_coin}/kill` : m.prize, coin: true, clr: "#f59e0b" },
              {
                label: "Starts",
                value: (() => {
                  if (!m.date) return "TBD";
                  const parsed = new Date(m.date);
                  return isNaN(parsed.getTime())
                    ? m.date
                    : parsed.toLocaleString([], { dateStyle: "short", timeStyle: "short" });
                })(),
                coin: false,
                clr: mc.color,
              },
            ].map(({ label, value, coin, clr }) => (
              <div key={label} className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5">
                <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
                <span className="font-display font-black text-xs text-foreground flex items-center gap-0.5">
                  {coin && <GodCoin className="w-2.5 h-2.5 text-amber-400" />}
                  <span style={{ color: clr }}>{value}</span>
                </span>
              </div>
            ))}
          </div>

          {/* Fill bar */}
          <div className="h-1.5 bg-secondary relative overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700 relative overflow-hidden" style={{ width: `${fillPct}%`, background: isFull ? "#ef4444" : mc.gradient }}>
              {!isFull && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer" />}
            </div>
          </div>

          {/* Slots + Room info & Action Button */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-semibold text-muted-foreground flex items-center gap-1">
                <Users className="w-2.5 h-2.5" />{filled}/{slots}
              </span>
              <span className="text-[9px] font-black" style={{ color: isFull ? "#ef4444" : mc.color }}>{isFull ? "FULL" : `${fillPct}%`}</span>
            </div>

            {/* Room details */}
            {(m.room_id || m.room_pass) && m.reg_status !== "pending" && (
              <div className="mb-3">
                <div className="rounded-2xl p-3 border flex flex-col gap-2 bg-sky-500/5 border-sky-500/15">
                  <div className="flex items-center gap-1">
                    <Info className="w-3 h-3 text-sky-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-sky-400">Room Details</span>
                  </div>
                  <div className="flex gap-4">
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

            <div className="flex gap-2">
              <Link to={`/tournaments/${m.id}` as any} className="flex-1">
                <button className="w-full h-10 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-border text-foreground bg-secondary press-effect active:scale-95 flex items-center justify-center gap-1">
                  <Shield className="w-3.5 h-3.5" />View Details
                </button>
              </Link>
              {m.reg_status === "pending" && (
                <div className="flex-[0_0_auto]">
                  <span className="h-10 px-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    Pending Approval
                  </span>
                </div>
              )}
              {m.reg_status === "approved" && (
                <div className="flex-[0_0_auto]">
                  <span className="h-10 px-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center bg-green-500/10 text-green-500 border border-green-500/20">
                    Registered
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}

function HistoryMatchCard({ m, i, openStandings }: { m: any; i: number; openStandings: (m: any) => void }) {
  const poster  = (m.banner && m.banner.startsWith("http")) ? m.banner : POSTERS[m.id % POSTERS.length];
  const mc      = MODE[m.mode] || MODE.Solo;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
      <div
        className="rounded-3xl p-[1.5px] group"
        style={{ background: `linear-gradient(135deg, rgba(100,116,139,0.2), transparent 60%, rgba(100,116,139,0.1))` }}
      >
        <div className="rounded-[calc(1.5rem-1.5px)] overflow-hidden bg-card">

          {/* Banner */}
          <div className="relative overflow-hidden" style={{ height: 120 }}>
            <img src={poster} alt={m.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 60%, rgba(8,12,20,0.97) 100%)" }} />

            {/* Badges */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-slate-500/60 text-white backdrop-blur-md">
                Completed
              </span>
              <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase text-white bg-black/55 backdrop-blur-md border border-white/10"
                style={{ borderColor: `${mc.color}44` }}>
                {m.mode}
              </span>
            </div>

            {/* Title */}
            <div className="absolute bottom-2.5 left-3 right-3">
              <div className="flex items-center gap-1 mb-1 text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                <Star className="w-2.5 h-2.5" />Free Fire
              </div>
              <h3 className="font-display font-black text-sm leading-tight line-clamp-1 drop-shadow-lg text-white">{m.name}</h3>
            </div>
          </div>

          {/* Stats strip */}
          <div className="flex items-stretch divide-x divide-border border-b border-border">
            {[
              { label: "Kills",    value: m.kills || 0, clr: "text-foreground" },
              { label: "Position", value: `#${m.position || "-"}`, clr: "text-foreground" },
              { label: "Points",   value: m.points || 0, clr: "text-primary" },
            ].map(({ label, value, clr }) => (
              <div key={label} className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5">
                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
                <span className={`font-display font-black text-sm ${clr}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Footer buttons */}
          <div className="p-3 flex gap-2">
            <Link to={`/tournaments/${m.id}` as any} className="flex-1">
              <button className="w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border border-border text-foreground bg-secondary press-effect active:scale-95 flex items-center justify-center gap-1">
                <Shield className="w-3.5 h-3.5" />Details
              </button>
            </Link>
            <button
              onClick={() => openStandings(m)}
              className="flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:opacity-95 press-effect active:scale-95 flex items-center justify-center gap-1.5"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-300 animate-pulse" />View Full Standings
            </button>
          </div>

        </div>
      </div>
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
