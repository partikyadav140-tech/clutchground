import * as React from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  getTournaments,
  getGlobalLeaderboard,
  getMyMatches,
  getHeroBanners,
  getProfile,
} from "../../api";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import {
  Trophy,
  Crown,
  Wallet,
  ChevronRight,
  Flame,
  Zap,
  X,
  Gamepad2,
  Swords,
  Activity,
  Target,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../lib/auth-client";
import { GodCoin } from "@/components/GodCoin";
import { TournamentCard } from "@/components/TournamentCard";
import { SpinWheelFab } from "@/components/spin-wheel/SpinWheelFab";
import { SkeletonHome } from "@/components/SkeletonPage";

export const Route = createFileRoute("/_app/")({
  head: () => ({ meta: [{ title: "ClutchGround | Clutch Ground — Rule the Battleground" }] }),
  loader: async () => {
    const [ts, lb] = await Promise.allSettled([getTournaments(), (getGlobalLeaderboard as any)()]);
    return {
      ts: ts.status === "fulfilled" ? ts.value : [],
      lb: lb.status === "fulfilled" ? lb.value : [],
    };
  },
  component: HomePage,
  pendingComponent: () => (
    <div className="min-h-screen bg-background">
      <SkeletonHome />
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
  const [joinedMatches, setJoinedMatches] = React.useState<number[]>([]);

  const [banners, setBanners] = React.useState<string[]>([]);
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
        .then((matches: any[]) => setJoinedMatches(matches.map((m) => m.id)))
        .catch(console.error);

      (getProfile as any)({ data: user.id })
        .then((p: any) => setProfile(p))
        .catch(console.error);
    }
  }, [user]);

  /* ── Carousels ── */
  const [featuredRef] = useEmblaCarousel({ loop: true, align: "center", containScroll: false }, [
    Autoplay({ delay: 3000, stopOnInteraction: false }),
  ]);
  const [battlesRef] = useEmblaCarousel({ loop: true, align: "center", containScroll: false }, [
    Autoplay({ delay: 3800, stopOnInteraction: false }),
  ]);

  const active = (allT as any[]).filter((t) => t.status !== "completed" && t.status !== "locked");
  const featured = active.filter((t) => t.is_hero && t.is_hero !== "0" && t.is_hero !== "false");
  const battles = active.filter((t) => !t.is_hero || t.is_hero === "0" || t.is_hero === "false");

  const balance = user
    ? ((user as any).deposit_balance || 0) + ((user as any).winning_balance || 0)
    : 0;
  const top3 = ((lb as any[]) || []).slice(0, 3);

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
      <motion.div variants={fadeUp} className="px-4 pt-4 pb-4">
        {user ? (
          /* ── Logged-in: Player Welcome Card ── */
          <div id="tutorial-player-card" className="hud-card p-5 sm:p-6">
            {/* Ambient glow blobs — adapt to brand colors */}
            <div
              className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[40px] pointer-events-none"
              style={{ background: "var(--primary)", opacity: 0.08 }}
            />
            <div
              className="absolute -bottom-12 -left-12 w-24 h-24 rounded-full blur-[35px] pointer-events-none"
              style={{ background: "var(--neon)", opacity: 0.04 }}
            />

            {/* Responsive row: Avatar + Greeting & Details + Wallet */}
            <div className="relative flex items-center justify-between gap-3">
              {/* Left group: Avatar and User Details */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Avatar — circular with custom border styling */}
                <Link
                  to="/profile"
                  className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shrink-0 border-2 shadow-[0_0_12px_rgba(0,200,255,0.15)] press-effect active:scale-95 transition-transform"
                  style={{ borderColor: "var(--primary)" }}
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      className="w-full h-full object-cover"
                      alt="avatar"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center font-display font-black text-lg sm:text-xl text-white"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      {(profile?.ign || user.username || "?")[0].toUpperCase()}
                    </div>
                  )}
                  {/* Online indicator */}
                  <span
                    className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 rounded-full"
                    style={{ borderColor: "var(--card)" }}
                  />
                </Link>

                {/* Greeting & Meta details */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/80 leading-none">
                    Welcome back
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 min-w-0">
                    <h1 className="font-display font-black text-base sm:text-lg md:text-xl text-foreground leading-none truncate">
                      {profile?.ign || user.username}
                    </h1>
                    {user.role === "admin" ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20 leading-none shrink-0">
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 leading-none shrink-0">
                        Player
                      </span>
                    )}
                  </div>
                  {/* Metadata tags */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground/80 bg-secondary/30 px-1.5 py-0.5 rounded border border-white/5 font-mono truncate max-w-[90px] sm:max-w-none">
                      @{user.username}
                    </span>
                    {profile?.uid && (
                      <span className="text-[9px] sm:text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 font-mono shrink-0">
                        UID: {profile.uid}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Wallet shortcut: blue themed for currency, enlarged for visual balance */}
              <motion.div layoutId="shared-wallet-pill" className="shrink-0">
                <Link
                  id="tutorial-wallet-pill"
                  to="/wallet"
                  className="flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl border border-[#00c8ff]/25 bg-[#00c8ff]/10 hover:bg-[#00c8ff]/15 hover:border-[#00c8ff]/40 text-[#00c8ff] press-effect active:scale-95 transition-all shadow-sm"
                >
                  <Wallet className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider text-[#00c8ff]/95 hidden xs:inline shrink-0">
                    Wallet
                  </span>
                  <div className="flex items-center gap-1 bg-[#00c8ff]/20 px-2.5 py-1 rounded-xl text-foreground font-display font-black text-sm tabular-nums shrink-0">
                    <GodCoin className="w-3.5 h-3.5 text-[#00c8ff]" />
                    {balance}
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
                  <button
                    className="h-12 w-full rounded-2xl font-bold text-sm text-white press-effect flex items-center justify-center gap-2 relative overflow-hidden group shadow-lg"
                    style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-cta)" }}
                  >
                    {/* Animated sweep effect */}
                    <span className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
                    <Zap className="w-4 h-4 text-white animate-pulse" />
                    <span className="tracking-wide">Join the Arena</span>
                    <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <p className="text-[10px] text-muted-foreground font-semibold">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline font-bold">
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════════
          SECTION 4: Banner Carousel with Dot Indicators
         ═══════════════════════════════════════════════ */}
      {banners.length > 0 && (
        <motion.div variants={fadeUp} className="px-4 mb-5">
          <div
            className="relative w-full aspect-video rounded-3xl overflow-hidden border border-border shadow-card cursor-pointer group"
            style={{ background: "var(--secondary)" }}
            onClick={() => setLightboxImg(banners[currentBannerIdx])}
          >
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
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/logo-transparent.png";
                }}
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
      )}

      {/* ═══════════════════════════════════════════════
          SECTION 5: Featured Carousel
         ═══════════════════════════════════════════════ */}
      {featured.length > 0 && (
        <motion.div variants={fadeUp} className="mb-6">
          <div id="tutorial-featured" className="px-4 flex items-center justify-between mb-3">
            <div className="section-header">
              <Flame className="w-4 h-4" style={{ color: "var(--fire)" }} />
              <h2 className="font-display font-black text-sm text-foreground uppercase tracking-wide">
                Featured
              </h2>
            </div>
            <Link
              to="/tournaments"
              className="flex items-center gap-0.5 text-[11px] font-black"
              style={{ color: "var(--primary)" }}
            >
              See all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-hidden" ref={featuredRef}>
            <div className="flex -ml-4">
              {featured.map((t: any, i: number) => (
                <div key={t.id} className="flex-[0_0_78%] min-w-0 pl-4">
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
              <h2 className="font-display font-black text-sm text-foreground uppercase tracking-wide">
                Active Battles
              </h2>
            </div>
            <Link
              to="/tournaments"
              className="flex items-center gap-0.5 text-[11px] font-black"
              style={{ color: "var(--primary)" }}
            >
              See all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-hidden" ref={battlesRef}>
            <div className="flex -ml-4">
              {battles.map((t: any, i: number) => (
                <div key={t.id} className="flex-[0_0_78%] min-w-0 pl-4">
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
              <h2 className="font-display font-black text-sm text-foreground uppercase tracking-wide">
                Top Players
              </h2>
            </div>
            <Link
              to="/leaderboard"
              className="flex items-center gap-0.5 text-[11px] font-black"
              style={{ color: "var(--primary)" }}
            >
              See all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-card">
            {top3.map((p: any, i: number) => {
              const rankStyles = [
                {
                  bg: "linear-gradient(135deg, #f59e0b22, #f59e0b08)",
                  color: "#f59e0b",
                  label: "1st",
                },
                {
                  bg: "linear-gradient(135deg, #94a3b822, #94a3b808)",
                  color: "#94a3b8",
                  label: "2nd",
                },
                {
                  bg: "linear-gradient(135deg, #cd7f3222, #cd7f3208)",
                  color: "#cd7f32",
                  label: "3rd",
                },
              ][i];
              return (
                <div
                  key={p.user_id || i}
                  className={`flex items-center gap-3 px-4 py-3.5 ${i < 2 ? "border-b border-border" : ""}`}
                >
                  {/* Rank badge */}
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-display font-black text-[10px] shrink-0"
                    style={{ background: rankStyles.bg, color: rankStyles.color }}
                  >
                    {rankStyles.label}
                  </div>
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center font-display font-black text-xs text-foreground shrink-0 overflow-hidden border border-border">
                    {p.logo ? (
                      <img
                        src={p.logo}
                        className="w-full h-full object-cover"
                        alt={p.team || "Player"}
                        loading="lazy"
                      />
                    ) : (
                      (p.team || "T")[0].toUpperCase()
                    )}
                  </div>
                  <p className="flex-1 font-bold text-sm text-foreground truncate">
                    {p.team || "Unknown"}
                  </p>
                  <span
                    className="font-display font-black text-sm"
                    style={{ color: "var(--primary)" }}
                  >
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
