import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { getTournaments, getMyMatches } from "../../../api";
import { useAuth } from "../../../lib/auth-client";
import {
  Search, Filter, Zap, Clock, Users, ChevronRight,
  Star, Shield, Swords,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { JoinBattleDialog } from "@/components/JoinBattleDialog";
import { GodCoin } from "@/components/GodCoin";

export const Route = createFileRoute("/_app/tournaments/")({
  head: () => ({ meta: [{ title: "Arena — CLUTCHGROUND" }] }),
  loader: async () => await getTournaments(),
  component: TournamentsPage,
});

const POSTERS = [
  "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1780319133/clutchground/posters/axuescfjvf4ldjhzjah2.jpg",
  "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1780319134/clutchground/posters/jurlwo3f3ci0989sbron.jpg",
  "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1780319135/clutchground/posters/effl14r1d2hdj2ccvytp.jpg",
  "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1780319136/clutchground/posters/xt34djmrfhqqialfpyvw.jpg",
  "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1780319137/clutchground/posters/utsi9880syth0wggn6jk.jpg",
  "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1780319138/clutchground/posters/o19jvuwrbawybvm76fvg.jpg"
];

const FILTERS = ["All", "Solo", "Duo", "Squad", "Free"] as const;

const MODE: Record<string, { label: string; color: string; glow: string; gradient: string }> = {
  Solo:  { label: "Solo",  color: "#00c8ff", glow: "rgba(0,200,255,0.35)",  gradient: "linear-gradient(135deg,#00c8ff,#0080ff)" },
  Duo:   { label: "Duo",   color: "#a78bfa", glow: "rgba(167,139,250,0.35)", gradient: "linear-gradient(135deg,#a78bfa,#7c3aed)" },
  Squad: { label: "Squad", color: "#ff6b00", glow: "rgba(255,107,0,0.35)",  gradient: "linear-gradient(135deg,#ff6b00,#ff0055)" },
};

function TournamentsPage() {
  const tournaments = Route.useLoaderData();
  const { user } = useAuth();
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("All");
  const [q, setQ]           = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [joinedMatches, setJoinedMatches] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (user) {
      (getMyMatches as any)({ data: user.id })
        .then((matches: any[]) => setJoinedMatches(matches.map(m => m.id)))
        .catch(console.error);
    }
  }, [user]);

  const filtered = (tournaments as any[]).filter((t) => {
    if (t.status === "completed" || t.status === "locked") return false;
    if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "Solo")  return t.mode === "Solo";
    if (filter === "Duo")   return t.mode === "Duo";
    if (filter === "Squad") return t.mode === "Squad";
    if (filter === "Free")  return t.entry === 0;
    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-8">

      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
              <Swords className="w-3 h-3" /> The Arena
            </div>
            <h1 className="font-display font-black text-2xl text-foreground">Tournaments</h1>
          </div>
          <button
            onClick={() => setSearchOpen(p => !p)}
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all press-effect active:scale-90 ${
              searchOpen ? "border-primary/60 text-primary bg-primary/10" : "bg-card border-border text-muted-foreground"
            }`}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden mt-3"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  autoFocus
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Search tournaments..."
                  className="w-full h-11 bg-card border border-border focus:border-primary/60 rounded-2xl pl-11 pr-4 text-sm font-semibold text-foreground outline-none transition-all"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Filter Chips ── */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar px-4 pb-4">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="shrink-0 px-5 h-9 rounded-full text-[11px] font-black uppercase tracking-widest transition-all press-effect active:scale-95 border"
            style={filter === f
              ? { background: "var(--gradient-primary)", color: "white", borderColor: "transparent", boxShadow: "0 4px 16px rgba(0,200,255,0.25)" }
              : { background: "var(--card)", borderColor: "var(--border)", color: "var(--muted-foreground)" }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Count divider ── */}
      <div className="px-4 mb-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.15em]">
          {filtered.length} {filtered.length === 1 ? "battle" : "battles"}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* ── Cards Grid ── */}
      <div className="px-4 flex flex-col gap-5">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 bg-card rounded-3xl border border-border"
            >
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                <Filter className="w-6 h-6 text-muted-foreground opacity-30" />
              </div>
              <p className="font-display font-black text-base text-foreground mb-1">No Active Battles</p>
              <p className="text-sm text-muted-foreground mb-5 text-center max-w-[200px]">Try adjusting filters or check back soon.</p>
              <button
                onClick={() => { setFilter("All"); setQ(""); setSearchOpen(false); }}
                className="h-10 px-8 rounded-full text-xs font-black uppercase tracking-widest border border-border text-foreground bg-secondary press-effect active:scale-95"
              >
                Clear Filters
              </button>
            </motion.div>
          ) : (
            filtered.map((t: any, i: number) => <TournamentCard key={t.id} t={t} i={i} isJoined={joinedMatches.includes(t.id)} />)
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PREMIUM TOURNAMENT CARD — Full redesign
═══════════════════════════════════════════════════ */
function TournamentCard({ t, i, isJoined }: { t: any; i: number; isJoined?: boolean }) {
  const poster   = (t.banner && t.banner.startsWith("http")) ? t.banner : POSTERS[t.id % POSTERS.length];
  const slots    = Number(t.slots) || 1;
  const filled   = Number(t.filled) || 0;
  const fillPct  = Math.min(100, Math.round((filled / slots) * 100));
  const isFull   = filled >= slots;
  const isLive   = t.status === "live";
  const isFree   = t.entry === 0;
  const mc       = MODE[t.mode] || MODE.Solo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ delay: Math.min(i * 0.07, 0.35), duration: 0.32, ease: "easeOut" }}
    >
      {/* Outer wrapper — glow ring on hover */}
      <div
        className="rounded-3xl p-[1.5px] transition-all duration-300 group"
        style={{
          background: `linear-gradient(135deg, ${mc.color}44, transparent 60%, ${mc.color}22)`,
          boxShadow: `0 2px 0 0 transparent`,
        }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 28px ${mc.glow}, 0 8px 32px rgba(0,0,0,0.4)`)}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 0 0 transparent")}
      >
        <div className="rounded-[calc(1.5rem-1.5px)] overflow-hidden bg-card">

          {/* ── BANNER SECTION ── */}
          <div className="relative h-[180px] overflow-hidden">
            <img
              src={poster}
              alt={t.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Dark gradient overlay */}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 55%, rgba(8,12,20,0.98) 100%)" }}
            />

            {/* TOP-LEFT: LIVE or mode badge */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              {isLive && (
                <span
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
                  style={{ background: "rgba(239,68,68,0.85)", backdropFilter: "blur(8px)", color: "#fff" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#fff" }} />
                  LIVE
                </span>
              )}
              <span
                className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
                style={{
                  background: "rgba(0,0,0,0.55)",
                  backdropFilter: "blur(8px)",
                  color: mc.color,
                  border: `1px solid ${mc.color}55`,
                }}
              >
                {mc.label}
              </span>
            </div>

            {/* TOP-RIGHT: FREE badge */}
            {isFree && (
              <div className="absolute top-3 right-3">
                <span
                  className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
                  style={{ background: "rgba(16,185,129,0.85)", color: "white", backdropFilter: "blur(8px)" }}
                >
                  FREE
                </span>
              </div>
            )}

            {/* BOTTOM: Title overlay */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
              <div
                className="text-[9px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1"
                style={{ color: mc.color }}
              >
                <Star className="w-2.5 h-2.5" />
                Free Fire · Battle Royale
              </div>
              <h3 className="font-display font-black text-xl leading-tight line-clamp-1 drop-shadow-lg" style={{ color: "#fff" }}>
                {t.title}
              </h3>
            </div>
          </div>

          {/* ── STATS BAR ── */}
          <div
            className="flex items-stretch divide-x"
            style={{ borderColor: "var(--border)" }}
          >
            {/* Entry */}
            <div className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Entry</span>
              <span className="font-display font-black text-sm text-foreground flex items-center gap-1">
                {isFree
                  ? <span className="text-emerald-400 text-xs">FREE</span>
                  : <><GodCoin className="w-3.5 h-3.5 text-amber-400" />{t.entry}</>
                }
              </span>
            </div>

            {/* Prize */}
            <div className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 border-l border-border">
              <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: mc.color }}>Prize</span>
              <span className="font-display font-black text-sm text-foreground flex items-center gap-1">
                <GodCoin className="w-3.5 h-3.5 text-amber-400" />
                {t.mode === "Solo" ? `${t.per_kill_coin}/kill` : t.prize}
              </span>
            </div>

            {/* Time */}
            <div className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 border-l border-border">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Starts</span>
              <span className="font-black text-xs text-foreground flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                {t.startsAt || t.startsat || "TBD"}
              </span>
            </div>
          </div>

          {/* ── BODY ── */}
          <div className="px-4 pb-4 pt-3">

            {/* Slots progress */}
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
                <Users className="w-3 h-3" />
                <span><span className="font-black text-foreground">{filled}</span>/{slots} players</span>
              </div>
              <span
                className="text-[9px] font-black"
                style={{ color: isFull ? "#ef4444" : fillPct > 70 ? "#f59e0b" : mc.color }}
              >
                {isFull ? "FULL" : `${fillPct}%`}
              </span>
            </div>

            {/* Progress bar */}
            <div className="relative h-2 bg-secondary rounded-full overflow-hidden mb-4">
              <div
                className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
                style={{
                  width: `${fillPct}%`,
                  background: isFull
                    ? "linear-gradient(90deg,#ef4444,#b91c1c)"
                    : mc.gradient,
                }}
              >
                {/* Shine effect */}
                {!isFull && fillPct > 10 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Link to={`/tournaments/${t.id}` as any} className="flex-[0_0_auto]">
                <button className="h-12 px-5 rounded-2xl text-xs font-black uppercase tracking-widest border border-border text-foreground bg-secondary hover:bg-accent transition-all press-effect active:scale-95 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Info
                </button>
              </Link>

              <div className="flex-1">
                {isJoined ? (
                  <Link to={`/matches`} className="w-full h-12 rounded-2xl text-[12px] font-black uppercase flex items-center justify-center bg-green-500/10 text-green-500 border border-green-500/20 press-effect shadow-inner">
                    Already Joined
                  </Link>
                ) : isFull ? (
                  <button
                    disabled
                    className="w-full h-12 rounded-2xl text-xs font-black uppercase tracking-widest bg-secondary text-muted-foreground border border-border cursor-not-allowed"
                  >
                    Battle Full
                  </button>
                ) : (
                  <JoinBattleDialog
                    tournamentId={t.id}
                    tournamentTitle={t.title}
                    mode={t.mode as any}
                    entryFee={t.entry}
                    trigger={
                      <button
                        className="w-full h-12 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 press-effect active:scale-95 transition-all"
                        style={{
                          background: mc.gradient,
                          boxShadow: `0 4px 20px ${mc.glow}`,
                          color: "#fff",
                        }}
                      >
                        <Zap className="w-4 h-4" />
                        Join Battle
                      </button>
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
