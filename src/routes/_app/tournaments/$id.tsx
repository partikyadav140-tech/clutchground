import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getTournaments, getTournamentResults, getMyMatches } from "../../../api";
import {
  Calendar, Trophy, Users, Target, Shield, ArrowLeft,
  Crosshair, Share2, Lock, CheckCircle2, Zap,
  Star, Clock, ChevronRight, Swords,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { JoinBattleDialog } from "@/components/JoinBattleDialog";
import { GodCoin } from "@/components/GodCoin";
import { useAuth } from "../../../lib/auth-client";
import { StandingsCard } from "@/components/StandingsCard";

export const Route = createFileRoute("/_app/tournaments/$id")({
  component: TournamentDetailPage,
  notFoundComponent: () => (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-2">
        <Swords className="w-7 h-7 text-muted-foreground opacity-40" />
      </div>
      <h1 className="font-display font-black text-xl text-foreground">Tournament Not Found</h1>
      <Link to="/tournaments">
        <button className="h-11 px-6 rounded-2xl text-xs font-black uppercase tracking-widest text-white press-effect active:scale-95" style={{ background: "var(--gradient-cta)" }}>
          Back to Arena
        </button>
      </Link>
    </div>
  ),
  loader: async ({ params }) => {
    const ts = await getTournaments();
    const t  = ts.find((x: any) => String(x.id) === params.id);
    if (!t) throw notFound();
    const allRegistrations = await (getTournamentResults as any)({ data: t.id });
    const results = t.status === "completed" ? allRegistrations : [];
    return { t, results, allRegistrations };
  },
});

const POSTERS = [
  "/posters/poster1.jpg", "/posters/poster2.jpg", "/posters/poster3.jpg",
  "/posters/poster4.jpg", "/posters/poster5.jpg", "/posters/poster6.jpg",
];

const MODE_CONFIG: Record<string, { color: string; glow: string; gradient: string; bg: string }> = {
  Solo:  { color: "#00c8ff", glow: "rgba(0,200,255,0.3)",  gradient: "linear-gradient(135deg,#00c8ff,#0080ff)", bg: "rgba(0,200,255,0.08)" },
  Duo:   { color: "#a78bfa", glow: "rgba(167,139,250,0.3)", gradient: "linear-gradient(135deg,#a78bfa,#7c3aed)", bg: "rgba(167,139,250,0.08)" },
  Squad: { color: "#ff6b00", glow: "rgba(255,107,0,0.3)",  gradient: "linear-gradient(135deg,#ff6b00,#ff0055)", bg: "rgba(255,107,0,0.08)" },
};

type Tab = "info" | "registered" | "prizes" | "standings";

function TournamentDetailPage() {
  const { t, results, allRegistrations } = Route.useLoaderData();
  const { user } = useAuth();
  const [isJoined, setIsJoined]   = useState(false);
  const [tab, setTab]             = useState<Tab>("info");
  const mc = MODE_CONFIG[t.mode] || MODE_CONFIG.Solo;

  useEffect(() => {
    window.scrollTo(0, 0);
    const sc = document.getElementById("app-scroll-container");
    if (sc) sc.scrollTo(0, 0);
    if (user) {
      (getMyMatches as any)({ data: user.id })
        .then((m: any[]) => { if (m.some((x: any) => x.id === t.id)) setIsJoined(true); })
        .catch(() => {});
    }
  }, [user, t.id]);

  const fillPct  = Math.min(100, Math.round((t.filled / t.slots) * 100));
  const isFull   = t.filled >= t.slots;
  const isFree   = t.entry === 0;
  const isLive   = t.status === "live";
  const isComp   = t.status === "completed";

  const tabs: { key: Tab; label: string }[] = [
    { key: "info",       label: "Info" },
    { key: "registered", label: `Teams (${allRegistrations?.length || 0})` },
    { key: "prizes",     label: "Prizes" },
    ...(isComp && results?.length ? [{ key: "standings" as Tab, label: "Standings" }] : []),
  ];

  return (
    <div className="min-h-screen bg-background pb-[88px]">

      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden" style={{ height: 220 }}>
        <img
          src={POSTERS[t.id % POSTERS.length]}
          alt={t.title}
          className="w-full h-full object-cover"
        />
        {/* Dark readability layer — always dark so image text is visible */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.62) 60%, rgba(0,0,0,0.82) 100%)"
        }} />
        {/* Fade to page background at very bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-10" style={{
          background: "linear-gradient(to bottom, transparent, var(--background))"
        }} />

        {/* Back button */}
        <div className="absolute top-4 left-4">
          <Link to="/tournaments"
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-black uppercase tracking-widest press-effect active:scale-95"
            style={{ background: "rgba(0,0,0,0.52)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)", color: "#ffffff" }}>
            <ArrowLeft className="w-3.5 h-3.5" style={{ color: "#ffffff" }} /> Back
          </Link>
        </div>

        {/* Live badge */}
        {isLive && (
          <div className="absolute top-4 right-4">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase" style={{ background: "rgba(239,68,68,0.85)", backdropFilter: "blur(8px)", color: "#ffffff" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#ffffff" }} />LIVE
            </span>
          </div>
        )}

        {/* Title on image — always white: on dark overlay, inline style bypasses .light .text-white override */}
        <div className="absolute bottom-5 left-4 right-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", color: mc.color, border: `1px solid ${mc.color}44` }}>
              {t.mode}
            </span>
            {isFree && (
              <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider"
                style={{ background: "rgba(16,185,129,0.85)", color: "#ffffff" }}>FREE</span>
            )}
          </div>
          <h1 className="font-display font-black text-2xl leading-tight drop-shadow-lg line-clamp-2" style={{ color: "#ffffff" }}>{t.title}</h1>
        </div>
      </div>

      {/* ── QUICK STATS ROW ── */}
      <div className="mx-4 -mt-2 bg-card rounded-2xl border border-border overflow-hidden shadow-card">
        <div className="flex items-stretch divide-x divide-border">
          {[
            { label: "Entry",  value: isFree ? "FREE" : t.entry, coin: !isFree, accent: isFree ? "#10b981" : mc.color },
            { label: "Prize",  value: t.mode === "Solo" ? `${t.per_kill_coin}/kill` : t.prize, coin: true, accent: "#f59e0b" },
            { label: "Starts", value: t.startsAt || t.startsat || "TBD", coin: false, accent: mc.color },
            { label: "Slots",  value: `${t.filled}/${t.slots}`, coin: false, accent: mc.color },
          ].map(({ label, value, coin, accent }) => (
            <div key={label} className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
              <span className="font-display font-black text-sm text-foreground flex items-center gap-0.5">
                {coin && <GodCoin className="w-3 h-3 text-amber-400" />}
                <span style={{ color: accent }}>{value}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Fill bar */}
        <div className="h-1.5 bg-secondary relative overflow-hidden">
          <div className="h-full transition-all duration-700 relative overflow-hidden"
            style={{ width: `${fillPct}%`, background: isFull ? "#ef4444" : mc.gradient }}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>

      {/* ── ROOM CARD (if joined) ── */}
      {isJoined && (
        <div className="mx-4 mt-3 rounded-2xl border overflow-hidden"
          style={{ background: mc.bg, borderColor: `${mc.color}30` }}>
          <div className="px-4 py-2 border-b flex items-center gap-2" style={{ borderColor: `${mc.color}20` }}>
            <Lock className="w-3.5 h-3.5" style={{ color: mc.color }} />
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: mc.color }}>Match Room</span>
          </div>
          <div className="flex divide-x" style={{ borderColor: `${mc.color}20` }}>
            {[
              { label: "Room ID",  value: t.room_id  || null },
              { label: "Password", value: t.room_pass || null },
            ].map(({ label, value }) => (
              <div key={label} className="flex-1 px-4 py-3">
                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
                {value
                  ? <p className="font-mono font-black text-lg text-foreground">{value}</p>
                  : <p className="font-mono text-sm text-muted-foreground blur-sm select-none">●●●●●</p>
                }
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── JOIN ACTION CARD ── */}
      <div className="mx-4 mt-3">
        {isJoined ? (
          <div className="h-12 rounded-2xl flex items-center justify-center gap-2 border"
            style={{ background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.25)", color: "#10b981" }}>
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-black text-sm uppercase tracking-widest">You're Registered</span>
          </div>
        ) : isFull ? (
          <div className="h-12 rounded-2xl flex items-center justify-center gap-2 bg-secondary border border-border text-muted-foreground font-black text-sm uppercase tracking-widest cursor-not-allowed">
            Battle Full
          </div>
        ) : (
          <JoinBattleDialog
            tournamentId={t.id}
            tournamentTitle={t.title}
            mode={t.mode}
            entryFee={t.entry}
            trigger={
              <button
                className="w-full h-12 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 press-effect active:scale-95 transition-all"
                style={{ background: mc.gradient, boxShadow: `0 4px 20px ${mc.glow}`, color: "#fff" }}>
                <Zap className="w-4 h-4" />
                {isFree ? "Book Free Slot" : `Pay ${t.entry} & Join`}
              </button>
            }
          />
        )}

        {/* Share */}
        <button
          onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success("Link copied!"); }}
          className="w-full mt-2 h-10 rounded-2xl text-xs font-black uppercase tracking-widest border border-border text-muted-foreground bg-card flex items-center justify-center gap-2 press-effect active:scale-95 transition-all"
        >
          <Share2 className="w-3.5 h-3.5" /> Share Tournament
        </button>
      </div>

      {/* ── TABS ── */}
      <div className="px-4 mt-5">
        <div className="flex bg-secondary rounded-2xl p-1 gap-1 overflow-x-auto hide-scrollbar">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex-1 shrink-0 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all press-effect active:scale-95 whitespace-nowrap"
              style={tab === key
                ? { background: "var(--card)", color: "var(--foreground)", boxShadow: "var(--shadow-card)" }
                : { color: "var(--muted-foreground)" }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="px-4 mt-4">
        <AnimatePresence mode="wait">

          {/* INFO TAB */}
          {tab === "info" && (
            <motion.div key="info" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">

              {/* Stat grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Crosshair, label: "Format",    value: t.format },
                  { icon: Users,     label: "Mode",      value: t.mode },
                  { icon: Calendar,  label: "Date",      value: t.startsAt || t.startsat || "TBD" },
                  { icon: Shield,    label: "Slots",     value: `${t.filled} / ${t.slots}` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-card rounded-2xl border border-border p-3.5 flex items-center gap-3 shadow-card">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: mc.bg }}>
                      <Icon className="w-4 h-4" style={{ color: mc.color }} />
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
                      <p className="font-black text-sm text-foreground mt-0.5">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* About */}
              <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-3.5 h-3.5" style={{ color: mc.color }} />
                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: mc.color }}>About</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">{t.title}</strong> is a high-stakes {t.game} tournament.
                  Join, fight and prove your skills. Slots are limited — first come, first served.
                  Room ID & password will be shared 10 mins before match start.
                </p>
              </div>

              {/* Rules */}
              <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-3.5 h-3.5" style={{ color: mc.color }} />
                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: mc.color }}>Rules</span>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {[
                    "Verify your Free Fire UID before registering.",
                    "Room ID & password released 10 minutes before match start.",
                    "Submit kill & placement screenshots after the match.",
                    "Hacking, teaming, or stream sniping = permanent ban.",
                    "Admin verdicts are final. No disputes accepted after 24h.",
                    "Prizes credited to wallet within 24h of verification.",
                  ].map((r, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="font-display font-black text-xs shrink-0 w-5 h-5 rounded-lg flex items-center justify-center mt-0.5"
                        style={{ background: mc.bg, color: mc.color }}>
                        {i + 1}
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}

          {/* REGISTERED TAB */}
          {tab === "registered" && (
            <motion.div key="reg" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-card">
                {!allRegistrations?.length ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <Users className="w-8 h-8 text-muted-foreground opacity-30 mb-3" />
                    <p className="font-black text-sm text-foreground mb-1">No Teams Yet</p>
                    <p className="text-xs text-muted-foreground">Be the first to register!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {allRegistrations.map((r: any, idx: number) => (
                      <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                        <span className="w-7 text-center font-display font-black text-sm text-muted-foreground shrink-0">
                          {idx + 1}
                        </span>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-black text-xs text-white shrink-0 overflow-hidden"
                          style={{ background: mc.gradient }}>
                          {r.team_logo || r.avatar_url
                            ? <img src={r.team_logo || r.avatar_url} className="w-full h-full object-cover" />
                            : (t.mode === "Squad" ? r.team_name || r.username : r.username)?.[0]?.toUpperCase()
                          }
                        </div>
                        <p className="flex-1 font-bold text-sm text-foreground truncate">
                          {t.mode === "Squad" ? r.team_name || r.username : r.username}
                        </p>
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-30" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* PRIZES TAB */}
          {tab === "prizes" && (
            <motion.div key="prizes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
              {/* How prizes work */}
              <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">How Prizes Work</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t.mode === "Solo"
                    ? "Solo mode rewards kills directly. Earn coins per kill + bonus for Booyah placement."
                    : `${t.mode} mode: earn placement points + kill points. Top 3 teams split the prize pool.`
                  }
                </p>
              </div>

              {/* Prize breakdown */}
              {t.mode === "Solo" ? (
                <div className="flex flex-col gap-2">
                  {[
                    { label: "🥇 Booyah Points", value: t.first_place_coin, color: "#f59e0b" },
                    { label: "⚔️ Per Kill",      value: t.per_kill_coin,    color: "#10b981" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between shadow-card">
                      <span className="font-black text-sm text-foreground">{label}</span>
                      <span className="font-display font-black text-lg flex items-center gap-1" style={{ color }}>
                        <GodCoin className="w-4 h-4 text-amber-400" />{value}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {[
                    { medal: "🥇", label: "1st Place", pct: 50, color: "#f59e0b" },
                    { medal: "🥈", label: "2nd Place", pct: 30, color: "#94a3b8" },
                    { medal: "🥉", label: "3rd Place", pct: 20, color: "#b45309" },
                  ].map(({ medal, label, pct, color }) => (
                    <div key={label} className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between shadow-card">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{medal}</span>
                        <div>
                          <p className="font-black text-sm text-foreground">{label}</p>
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{pct}% of pool</p>
                        </div>
                      </div>
                      <span className="font-display font-black text-lg flex items-center gap-1" style={{ color }}>
                        <GodCoin className="w-4 h-4 text-amber-400" />
                        {Math.round((t.prize * pct) / 100).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* STANDINGS TAB */}
          {tab === "standings" && results?.length > 0 && (
            <motion.div key="standings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <StandingsCard
                tournamentName={t.title}
                mode={t.mode}
                results={results}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
