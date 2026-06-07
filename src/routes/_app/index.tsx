import * as React from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { getTournaments, getGlobalLeaderboard, getMyMatches, getHeroBanners, getProfile, getPlayerStats, getMyTeam, getTeamRequests } from "../../api";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Trophy, Users, Crown, Wallet, ChevronRight, Flame, Zap, Shield, Star, X, Gamepad2, Swords, Activity, Target, TrendingUp, BarChart3, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { JoinBattleDialog } from "@/components/JoinBattleDialog";
import { useAuth } from "../../lib/auth-client";
import { GodCoin } from "@/components/GodCoin";

export const Route = createFileRoute("/_app/")({
  head: () => ({ meta: [{ title: "Clutch Ground | Rule the Battleground" }] }),
  loader: async () => {
    const [ts, lb] = await Promise.allSettled([
      getTournaments(),
      (getGlobalLeaderboard as any)(),
    ]);
    return {
      ts: ts.status === "fulfilled" ? ts.value : [],
      lb: lb.status === "fulfilled" ? lb.value : [],
    };
  },
  component: HomePage,
  pendingComponent: () => (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

const POSTERS = [
  "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1780319133/clutchground/posters/axuescfjvf4ldjhzjah2.jpg",
  "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1780319134/clutchground/posters/jurlwo3f3ci0989sbron.jpg",
  "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1780319135/clutchground/posters/effl14r1d2hdj2ccvytp.jpg",
  "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1780319136/clutchground/posters/xt34djmrfhqqialfpyvw.jpg",
  "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1780319137/clutchground/posters/utsi9880syth0wggn6jk.jpg",
  "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1780319138/clutchground/posters/o19jvuwrbawybvm76fvg.jpg",
];

const MODE: Record<string, { color: string; glow: string; gradient: string; bg: string }> = {
  Solo:  { color: "#00c8ff", glow: "rgba(0,200,255,0.35)",   gradient: "linear-gradient(135deg,#00c8ff,#0080ff)", bg: "rgba(0,200,255,0.08)" },
  Duo:   { color: "#a78bfa", glow: "rgba(167,139,250,0.35)", gradient: "linear-gradient(135deg,#a78bfa,#7c3aed)", bg: "rgba(167,139,250,0.08)" },
  Squad: { color: "#ff6b00", glow: "rgba(255,107,0,0.35)",   gradient: "linear-gradient(135deg,#ff6b00,#ff0055)", bg: "rgba(255,107,0,0.08)" },
};

/* ── Staggered entrance animation wrapper ── */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

function HomePage() {
  const { ts: allT, lb } = Route.useLoaderData();
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = React.useState<any>(null);
  const [stats, setStats] = React.useState<any>({
    matchesPlayed: 0,
    totalKills: 0,
    totalEarnings: 0,
    firstPlaces: 0,
    top3: 0,
    kdRatio: "0.00",
    winRate: 0,
    history: [],
  });
  const [joinedMatches, setJoinedMatches] = React.useState<number[]>([]);
  const [myTeam, setMyTeam] = React.useState<any>(null);
  const [teamRequests, setTeamRequests] = React.useState<any[]>([]);
  const [banners, setBanners] = React.useState<string[]>(["https://res.cloudinary.com/dkjt9m4d0/image/upload/v1780319417/clutchground/placeholders/mygshudhl9qltqroxrmi.png"]);
  const [currentBannerIdx, setCurrentBannerIdx] = React.useState(0);
  const [lightboxImg, setLightboxImg] = React.useState<string | null>(null);

  React.useEffect(() => {
    getHeroBanners().then((res) => {
      if (res && res.length > 0) {
        setBanners(res);
      }
    });
  }, []);

  React.useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIdx((prev) => (prev + 1) % banners.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [banners]);

  React.useEffect(() => {
    if (user) {
      (getMyMatches as any)({ data: user.id })
        .then((matches: any[]) => setJoinedMatches(matches.map(m => m.id)))
        .catch(console.error);

      Promise.all([
        (getProfile as any)({ data: user.id }),
        (getPlayerStats as any)({ data: user.id }),
        (getMyTeam as any)({ data: user.id }),
      ])
        .then(([p, s, t]) => {
          setProfile(p);
          setStats(s || {
            matchesPlayed: 0,
            totalKills: 0,
            totalEarnings: 0,
            firstPlaces: 0,
            top3: 0,
            kdRatio: "0.00",
            winRate: 0,
            history: [],
          });
          setMyTeam(t);
          if (t && t.leader_id === user.id) {
            (getTeamRequests as any)({ data: user.id })
              .then((reqs: any[]) => setTeamRequests(reqs))
              .catch(console.error);
          }
        })
        .catch(console.error);
    }
  }, [user]);

  /* ── Carousels ── */
  const [featuredRef] = useEmblaCarousel(
    { loop: true, align: "center", containScroll: false },
    [Autoplay({ delay: 3000, stopOnInteraction: false })]
  );
  const [battlesRef] = useEmblaCarousel(
    { loop: true, align: "center", containScroll: false },
    [Autoplay({ delay: 3800, stopOnInteraction: false })]
  );

  const active   = (allT as any[]).filter(t => t.status !== "completed" && t.status !== "locked");
  const featured = active.filter(t => t.is_hero && t.is_hero !== "0" && t.is_hero !== "false");
  const battles  = active.filter(t => !t.is_hero || t.is_hero === "0" || t.is_hero === "false");

  const balance = user ? ((user as any).deposit_balance || 0) + ((user as any).winning_balance || 0) : 0;
  const top3    = ((lb as any[]) || []).slice(0, 3);

  const hasStats = stats.matchesPlayed > 0 || stats.totalKills > 0;

  return (
    <motion.div
      className="min-h-screen bg-background pb-[80px]"
      variants={stagger}
      initial="hidden"
      animate="show"
    >

      {/* ═══════════════════════════════════════════════
          SECTION 1: Player Welcome Card / Logged-out Hero
         ═══════════════════════════════════════════════ */}
      <motion.div variants={fadeUp} className="px-4 pt-4 pb-1">
        {user ? (
          /* ── Logged-in: Player Welcome Card ── */
          <div id="tutorial-player-card" className="hud-card p-5">
            {/* Ambient glow blobs — use CSS variable opacity so they adapt */}
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[40px] pointer-events-none"
                 style={{ background: "var(--primary)", opacity: 0.06 }} />

            {/* Top row: Avatar + Greeting + Balance */}
            <div className="relative flex items-center gap-3.5">
              {/* Avatar — round */}
              <Link to="/stats" className="relative w-13 h-13 rounded-full overflow-hidden shrink-0 border-2 shadow-lg press-effect active:scale-95 transition-transform"
                    style={{ borderColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-display font-black text-lg text-white"
                       style={{ background: "var(--gradient-primary)" }}>
                    {(profile?.ign || user.username || "?")[0].toUpperCase()}
                  </div>
                )}
                {/* Online indicator */}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 rounded-full"
                      style={{ borderColor: "var(--card)" }} />
              </Link>

              {/* Greeting & meta */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                  Welcome back
                </p>
                <h1 className="font-display font-black text-lg text-foreground leading-tight truncate mt-1">
                  {profile?.ign || user.username}
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-semibold text-muted-foreground font-mono truncate">@{user.username}</span>
                  {profile?.uid && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span className="text-[10px] font-bold font-mono" style={{ color: "var(--primary)" }}>UID: {profile.uid}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Balance pill */}
              <div
                id="tutorial-balance-pill"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.navigate({ to: "/wallet" }); }}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border border-border bg-secondary/60 hover:border-primary/40 press-effect active:scale-95 transition-all cursor-pointer"
              >
                <GodCoin className="w-4.5 h-4.5" />
                <div className="flex flex-col items-end">
                  <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest leading-none">Coins</span>
                  <span className="font-display font-black text-sm text-foreground leading-tight tabular-nums mt-0.5">{balance}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── Logged-out: Hero Card ── */
          <div className="hero-card p-6 text-center">
            {/* Radial glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full blur-[50px] pointer-events-none"
                 style={{ background: "var(--primary)", opacity: 0.08 }} />

            <div className="relative">
              <h1 className="font-display font-black text-2xl text-foreground uppercase tracking-wide leading-tight">
                CLUTCHGROUND
              </h1>
              <p className="text-xs text-muted-foreground font-semibold mt-1.5 mb-5">
                India's #1 Free Fire Esports Arena
              </p>

              {/* Social proof stats */}
              <div className="flex items-center justify-center gap-6 mb-5">
                {[
                  { label: "Players", value: "10K+" },
                  { label: "Matches", value: "2K+" },
                  { label: "Prize Pool", value: "₹50K+" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="font-display font-black text-base text-foreground">{s.value}</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              <Link to="/login">
                <button className="h-12 w-full max-w-[240px] rounded-2xl font-black text-xs text-white uppercase tracking-widest press-effect active:scale-95 flex items-center justify-center gap-2 mx-auto"
                        style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-cta)" }}>
                  <Zap className="w-4 h-4" />
                  Join the Arena
                </button>
              </Link>
            </div>
          </div>
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════════
          SECTION 2: Live Stats Strip (logged-in only)
         ═══════════════════════════════════════════════ */}
      {user && (
        <motion.div variants={fadeUp} className="px-4 py-2">
          {hasStats ? (
            <Link to="/stats" className="block">
              <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-1">
                {[
                  { label: "Matches", value: stats.matchesPlayed, icon: Gamepad2, color: "var(--primary)" },
                  { label: "Kills", value: stats.totalKills, icon: Swords, color: "#f59e0b" },
                  { label: "K/D", value: stats.kdRatio, icon: Target, color: "#a78bfa" },
                  { label: "Win Rate", value: `${stats.winRate}%`, icon: Trophy, color: "#10b981" },
                ].map((item) => (
                  <div key={item.label} className="stat-pill shrink-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                         style={{ background: `${item.color}15`, color: item.color }}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-wider leading-none">{item.label}</p>
                      <p className="font-display font-black text-sm text-foreground mt-0.5 leading-none">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* CTA to stats */}
              <div className="flex items-center justify-center gap-1.5 mt-2 text-muted-foreground hover:text-primary transition-colors">
                <Activity className="w-3 h-3" style={{ color: "var(--primary)" }} />
                <span className="text-[9px] font-black uppercase tracking-widest">View detailed analytics</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </Link>
          ) : (
            <Link to="/tournaments" className="block">
              <div className="hud-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                     style={{ background: "var(--gradient-cta)" }}>
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground">Start your journey!</p>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Join a tournament to track your stats</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </Link>
          )}
        </motion.div>
      )}



      {/* ═══════════════════════════════════════════════
          SECTION 4: Banner Carousel with Dot Indicators
         ═══════════════════════════════════════════════ */}
      <motion.div variants={fadeUp} className="px-4 mb-5">
        <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-border shadow-card cursor-pointer group"
             style={{ background: "var(--secondary)" }}
             onClick={() => setLightboxImg(banners[currentBannerIdx])}>
          <AnimatePresence mode="popLayout">
            <motion.img
              key={banners[currentBannerIdx]}
              src={banners[currentBannerIdx]}
              alt="CLUTCHGROUND Banner"
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://res.cloudinary.com/dkjt9m4d0/image/upload/v1780319417/clutchground/placeholders/mygshudhl9qltqroxrmi.png'; }}
            />
          </AnimatePresence>
          {/* Bottom gradient for premium depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
        </div>
        {/* Dot indicators */}
        {banners.length > 1 && (
          <div className="carousel-dots mt-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                className={`carousel-dot ${idx === currentBannerIdx ? "active" : ""}`}
                onClick={() => setCurrentBannerIdx(idx)}
                aria-label={`Go to banner ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════════
          SECTION 5: Featured Carousel
         ═══════════════════════════════════════════════ */}
      {featured.length > 0 && (
        <motion.div variants={fadeUp} className="mb-6">
          <div id="tutorial-featured" className="px-4 flex items-center justify-between mb-3">
            <div className="section-header">
              <Flame className="w-4 h-4" style={{ color: "var(--fire)" }} />
              <h2 className="font-display font-black text-sm text-foreground uppercase tracking-wide">Featured</h2>
            </div>
            <Link to="/tournaments" className="flex items-center gap-0.5 text-[11px] font-black" style={{ color: "var(--primary)" }}>
              See all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-hidden" ref={featuredRef}>
            <div className="flex gap-3">
              {featured.map((t: any, i: number) => (
                <div key={t.id} className="flex-[0_0_78%] min-w-0">
                  <TournamentCard t={t} i={i} isJoined={joinedMatches.includes(t.id)} />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════
          SECTION 6: Active Battles Carousel
         ═══════════════════════════════════════════════ */}
      {battles.length > 0 && (
        <motion.div variants={fadeUp} className="mb-6">
          <div id="tutorial-battles" className="px-4 flex items-center justify-between mb-3">
            <div className="section-header">
              <Zap className="w-4 h-4" style={{ color: "var(--primary)" }} />
              <h2 className="font-display font-black text-sm text-foreground uppercase tracking-wide">Active Battles</h2>
            </div>
            <Link to="/tournaments" className="flex items-center gap-0.5 text-[11px] font-black" style={{ color: "var(--primary)" }}>
              See all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-hidden" ref={battlesRef}>
            <div className="flex gap-3">
              {battles.map((t: any, i: number) => (
                <div key={t.id} className="flex-[0_0_78%] min-w-0">
                  <TournamentCard t={t} i={i} isJoined={joinedMatches.includes(t.id)} />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════
          SECTION 7: Mini Leaderboard with Rank Badges
         ═══════════════════════════════════════════════ */}
      {top3.length > 0 && (
        <motion.div id="tutorial-leaderboard" variants={fadeUp} className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="section-header">
              <Crown className="w-4 h-4 text-amber-400" />
              <h2 className="font-display font-black text-sm text-foreground uppercase tracking-wide">Top Players</h2>
            </div>
            <Link to="/leaderboard" className="flex items-center gap-0.5 text-[11px] font-black" style={{ color: "var(--primary)" }}>
              See all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-card">
            {top3.map((p: any, i: number) => {
              const rankStyles = [
                { bg: "linear-gradient(135deg, #f59e0b22, #f59e0b08)", color: "#f59e0b", label: "1st" },
                { bg: "linear-gradient(135deg, #94a3b822, #94a3b808)", color: "#94a3b8", label: "2nd" },
                { bg: "linear-gradient(135deg, #cd7f3222, #cd7f3208)", color: "#cd7f32", label: "3rd" },
              ][i];
              return (
                <div key={p.user_id || i} className={`flex items-center gap-3 px-4 py-3.5 ${i < 2 ? "border-b border-border" : ""}`}>
                  {/* Rank badge */}
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center font-display font-black text-[10px] shrink-0"
                       style={{ background: rankStyles.bg, color: rankStyles.color }}>
                    {rankStyles.label}
                  </div>
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center font-display font-black text-xs text-foreground shrink-0 overflow-hidden border border-border">
                    {p.logo ? (
                      <img src={p.logo} className="w-full h-full object-cover" alt="" />
                    ) : (
                      (p.team || "T")[0].toUpperCase()
                    )}
                  </div>
                  <p className="flex-1 font-bold text-sm text-foreground truncate">{p.team || "Unknown"}</p>
                  <span className="font-display font-black text-sm" style={{ color: "var(--primary)" }}>
                    {(p.points || 0).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════
          FIXED: My Team Floating Button (right side, above navbar)
         ═══════════════════════════════════════════════ */}
      {user && (
        <Link to="/teams" className="fixed right-3 z-40 no-underline" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 76px)" }}>          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 18, stiffness: 260, delay: 0.5 }}
            className="relative flex items-center gap-2 pl-3 pr-3.5 py-2.5 rounded-2xl border shadow-2xl press-effect active:scale-95 transition-transform cursor-pointer"
            style={{
              background: "linear-gradient(135deg, rgba(var(--card-rgb, 24,28,36), 0.92), rgba(var(--card-rgb, 24,28,36), 0.98))",
              backdropFilter: "blur(20px) saturate(1.5)",
              WebkitBackdropFilter: "blur(20px) saturate(1.5)",
              borderColor: "var(--border)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 20px rgba(var(--primary-rgb, 255,0,85), 0.12)",
            }}
          >
            {/* Icon container */}
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                 style={{ background: "var(--gradient-primary)" }}>
              <Users className="w-4 h-4 text-white" />
            </div>
            {/* Label */}
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-foreground uppercase tracking-widest leading-none">
                {myTeam ? "My Team" : "Squad"}
              </span>
              <span className="text-[8px] font-semibold text-muted-foreground leading-tight mt-0.5 max-w-[80px] truncate">
                {myTeam ? myTeam.name : "Join / Create"}
              </span>
            </div>
            {/* Notification dot for pending requests */}
            {myTeam && teamRequests?.length > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center">
                <span className="absolute w-4 h-4 rounded-full animate-ping opacity-40" style={{ background: "var(--primary)" }} />
                <span className="relative w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black text-white" style={{ background: "var(--primary)" }}>
                  {teamRequests.length}
                </span>
              </span>
            )}
          </motion.div>
        </Link>
      )}

      {/* ═══════════════════════════════════════════════
          FOOTER
         ═══════════════════════════════════════════════ */}
      <motion.footer variants={fadeUp} className="mx-4 mb-6 mt-2">
        <div className="bg-card rounded-2xl border border-border p-5 text-center shadow-card">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">CLUTCHGROUND</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed mb-3">
            © {new Date().getFullYear()} CLUTCHGROUND. All rights reserved.<br />
            India's premier Free Fire esports arena platform.
          </p>
          <div className="pt-3 border-t border-border">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Designed & Developed by</p>
            <p className="font-display font-black text-sm text-foreground">Pratikk Yadav</p>
            <a href="mailto:clutchgroundofficial@gmail.com"
              className="inline-flex items-center gap-1.5 mt-1.5 text-[10px] font-bold press-effect active:scale-95 transition-all"
              style={{ color: "var(--primary)" }}>
              📧 clutchgroundofficial@gmail.com
            </a>
          </div>
        </div>
      </motion.footer>

      <div className="h-2" />

      {/* ── Hero Image Lightbox ── */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImg(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-primary/10 bg-card"
            >
              <img
                src={lightboxImg}
                alt="Bigger preview"
                className="w-full h-full object-contain bg-black/60"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════
   SHARED TOURNAMENT CARD — identical to Arena page
════════════════════════════════════════════════ */
function TournamentCard({ t, i, isJoined }: { t: any; i: number; isJoined?: boolean }) {
  const poster  = (t.banner && t.banner.startsWith("http")) ? t.banner : POSTERS[t.id % POSTERS.length];
  const slots   = Number(t.slots) || 1;
  const filled  = Number(t.filled) || 0;
  const fillPct = Math.min(100, Math.round((filled / slots) * 100));
  const isFull  = filled >= slots;
  const isLive  = t.status === "live";
  const isFree  = t.entry === 0;
  const mc      = MODE[t.mode] || MODE.Solo;

  return (
    <div
      className="rounded-3xl p-[1.5px] group cursor-pointer"
      style={{ background: `linear-gradient(135deg, ${mc.color}44, transparent 60%, ${mc.color}22)` }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 28px ${mc.glow}, 0 8px 32px rgba(0,0,0,0.3)`)}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
    >
      <div className="rounded-[calc(1.5rem-1.5px)] overflow-hidden bg-card">

        {/* Banner */}
        <div className="relative overflow-hidden" style={{ height: 150 }}>
          <img src={poster} alt={t.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 60%, rgba(8,12,20,0.97) 100%)" }} />

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            {isLive && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase"
                style={{ background: "rgba(239,68,68,0.85)", backdropFilter: "blur(6px)", color: "#fff" }}>
                <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: "#fff" }} />LIVE
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase"
              style={{ color: mc.color, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", border: `1px solid ${mc.color}44` }}>
              {t.mode}
            </span>
          </div>
          {isFree && (
            <div className="absolute top-2.5 right-2.5">
              <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase"
                style={{ background: "rgba(16,185,129,0.85)", color: "#fff" }}>FREE</span>
            </div>
          )}

          {/* Title */}
          <div className="absolute bottom-2.5 left-3 right-3">
            <div className="flex items-center gap-1 mb-1 text-[8px] font-black uppercase tracking-widest" style={{ color: mc.color }}>
              <Star className="w-2.5 h-2.5" />Free Fire
            </div>
            <h3 className="font-display font-black text-base leading-tight line-clamp-1 drop-shadow-lg" style={{ color: "#fff" }}>{t.title}</h3>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-stretch divide-x divide-border">
          {[
            { label: "Entry", value: isFree ? "FREE" : t.entry, coin: !isFree, clr: isFree ? "#10b981" : mc.color },
            { label: "Prize", value: t.mode === "Solo" ? `${t.per_kill_coin}/kill` : t.prize, coin: true, clr: "#f59e0b" },
            { label: "Starts", value: t.startsAt || t.startsat || "TBD", coin: false, clr: mc.color },
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

        {/* Slots + Buttons */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="w-2.5 h-2.5" />{filled}/{slots}
            </span>
            <span className="text-[9px] font-black" style={{ color: isFull ? "#ef4444" : mc.color }}>{isFull ? "FULL" : `${fillPct}%`}</span>
          </div>

          <div className="flex gap-2">
            <Link to={`/tournaments/${t.id}` as any} className="flex-[0_0_auto]">
              <button className="h-10 px-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-border text-foreground bg-secondary press-effect active:scale-95 flex items-center gap-1">
                <Shield className="w-3 h-3" />Info
              </button>
            </Link>
            <div className="flex-1">
              {isJoined ? (
                <Link to={`/matches`} className="w-full h-10 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center bg-green-500/10 text-green-500 border border-green-500/20 press-effect">
                  Already Joined
                </Link>
              ) : isFull ? (
                <button disabled className="w-full h-10 rounded-2xl text-[10px] font-black uppercase bg-secondary text-muted-foreground border border-border cursor-not-allowed">Full</button>
              ) : (
                <JoinBattleDialog
                  tournamentId={t.id}
                  tournamentTitle={t.title}
                  mode={t.mode as any}
                  entryFee={t.entry}
                  trigger={
                    <button className="w-full h-10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 press-effect active:scale-95"
                      style={{ background: mc.gradient, boxShadow: `0 3px 14px ${mc.glow}`, color: "#fff" }}>
                      <Zap className="w-3 h-3" />Join
                    </button>
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
