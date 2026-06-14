import * as React from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { getTournaments, getGlobalLeaderboard, getMyMatches, getHeroBanners, getProfile, getPlayerStats, getMyTeam, getTeamRequests } from "../../api";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Trophy, Users, Crown, Wallet, ChevronRight, Flame, Zap, X, Gamepad2, Swords, Activity, Target, TrendingUp, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../lib/auth-client";
import { GodCoin } from "@/components/GodCoin";
import { TournamentCard } from "@/components/TournamentCard";
import { SpinWheelFab } from "@/components/spin-wheel/SpinWheelFab";

export const Route = createFileRoute("/_app/")({
  head: () => ({ meta: [{ title: "ClutchGround | Rule the Battleground" }] }),
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
      className="min-h-screen bg-background pb-4"
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
                <p className="text-label">
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

              {/* Wallet shortcut */}
              <motion.div layoutId="shared-wallet-pill" className="shrink-0">
                <Link
                  id="tutorial-wallet-pill"
                  to="/wallet"
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border border-primary/25 bg-primary/10 hover:bg-primary/15 hover:border-primary/40 press-effect active:scale-95 transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary leading-none">Wallet</span>
                    <span className="font-display font-black text-sm text-foreground leading-tight tabular-nums mt-0.5 flex items-center gap-1">
                      <GodCoin className="w-3.5 h-3.5" />
                      {balance}
                    </span>
                  </div>
                </Link>
              </motion.div>
            </div>
          </div>
        ) : (
          /* ── Logged-out: Hero Card ── */
          <div className="hero-card p-6 text-center border-border/80 bg-gradient-to-b from-[#0e1626] to-[#0a0f1d] shadow-2xl relative overflow-hidden">
            {/* Ambient glow blobs */}
            <div className="absolute -top-16 -left-16 w-36 h-36 rounded-full blur-[45px] pointer-events-none bg-primary/10" />
            <div className="absolute -bottom-16 -right-16 w-36 h-36 rounded-full blur-[45px] pointer-events-none bg-fire/10" />

            <div className="relative">
              {/* Premium Title */}
              <h1 className="font-display font-black text-3xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#7c3aed] to-fire drop-shadow-[0_0_12px_rgba(0,200,255,0.25)]">
                CLUTCHGROUND
              </h1>
              
              {/* Professional Subtitle Tag */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-wider text-primary mt-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                India&apos;s Free Fire Esports Arena
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-2.5 max-w-[280px] mx-auto w-full mt-6">
                <Link to="/login" className="w-full">
                  <button className="h-12 w-full rounded-2xl font-bold text-sm text-white press-effect flex items-center justify-center gap-2 relative overflow-hidden group shadow-lg"
                          style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-cta)" }}>
                    {/* Animated sweep effect */}
                    <span className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
                    <Zap className="w-4 h-4 text-white animate-pulse" />
                    <span className="tracking-wide">Join the Arena</span>
                    <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <p className="text-[10px] text-muted-foreground font-semibold">
                  Already have an account? <Link to="/login" className="text-primary hover:underline font-bold">Sign In</Link>
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════════
          SECTION 2: Live Stats Strip (logged-in) / Preview (logged-out)
         ═══════════════════════════════════════════════ */}
      {!user ? (
        /* ── Logged-out: Tracker Preview ── */
        <motion.div variants={fadeUp} className="px-4 py-2">
          <div className="relative rounded-2xl border border-border bg-card/45 backdrop-blur-md p-4 overflow-hidden group">
            {/* Soft decorative background glows */}
            <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none"
                 style={{ background: "var(--primary)" }} />
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Live Player Tracker</span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                Preview
              </span>
            </div>

            {/* Blurred Mock Stats row */}
            <div className="relative">
              <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-1 select-none pointer-events-none filter blur-[1.5px] opacity-40">
                {[
                  { label: "Matches", value: "42", icon: Gamepad2, color: "var(--primary)" },
                  { label: "Kills", value: "189", icon: Swords, color: "#f59e0b" },
                  { label: "K/D Ratio", value: "4.50", icon: Target, color: "#a78bfa" },
                  { label: "Win Rate", value: "68%", icon: Trophy, color: "#10b981" },
                ].map((item) => (
                  <div key={item.label} className="stat-pill shrink-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                         style={{ background: `${item.color}15`, color: item.color }}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-label leading-none">{item.label}</p>
                      <p className="font-display font-black text-sm text-foreground mt-0.5 leading-none">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Centered overlay with call-to-action */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-card/60 via-card/20 to-transparent">
                <Link to="/login" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background/90 hover:bg-background border border-border text-[11px] font-bold text-foreground press-effect shadow-md transition-all">
                  <Zap className="w-3 h-3 text-primary animate-pulse" />
                  <span>Sign up to track your stats</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        /* ── Logged-in: Live Stats Strip ── */
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
                      <p className="text-label leading-none">{item.label}</p>
                      <p className="font-display font-black text-sm text-foreground mt-0.5 leading-none">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* CTA to stats */}
              <div className="flex items-center justify-center gap-1.5 mt-2 text-muted-foreground hover:text-primary transition-colors">
                <Activity className="w-3 h-3" style={{ color: "var(--primary)" }} />
                <span className="text-xs font-semibold">View detailed analytics</span>
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
                  <TournamentCard t={t} index={i} isJoined={joinedMatches.includes(t.id)} compact />
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
                  <TournamentCard t={t} index={i} isJoined={joinedMatches.includes(t.id)} compact />
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

      {/* Daily spin wheel — above My Team */}
      <SpinWheelFab bottomOffset={152} />

      {/* ═══════════════════════════════════════════════
          FIXED: My Team Floating Button (right side, above navbar)
         ═══════════════════════════════════════════════ */}
      {user && (
        <Link to="/my-team" className="fixed right-3 z-40 no-underline" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 86px)" }}>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 18, stiffness: 260, delay: 0.5 }}
            className="relative flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-card press-effect active:scale-95 transition-transform cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-primary/15 text-primary border border-primary/20">
              <Users className="w-5 h-5" />
            </div>
            {/* Label */}
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground leading-none">
                {myTeam ? "My Team" : "Squad"}
              </span>
              <span className="text-label leading-tight mt-0.5 max-w-[80px] truncate">
                {myTeam ? myTeam.name : "Join / Create"}
              </span>
            </div>
            {/* Notification dot for pending requests */}
            {myTeam && teamRequests?.length > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center">
                <span className="absolute w-4 h-4 rounded-full animate-ping opacity-40" style={{ background: "var(--primary)" }} />
                <span className="relative w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: "var(--primary)" }}>
                  {teamRequests.length}
                </span>
              </span>
            )}
          </motion.div>
        </Link>
      )}

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
