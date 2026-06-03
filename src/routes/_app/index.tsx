import * as React from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { getTournaments, getGlobalLeaderboard, getMyMatches, getHeroBanners, getProfile, getPlayerStats } from "../../api";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Trophy, Users, Crown, Wallet, ChevronRight, Clock, Flame, Zap, Shield, Star, X, Gamepad2, Target, Swords, Activity } from "lucide-react";
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
      ])
        .then(([p, s]) => {
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
  const battles  = active.filter(t => !t.is_hero || t.is_hero === "0" || t.is_hero === "false"); // non-featured only

  const balance = user ? ((user as any).deposit_balance || 0) + ((user as any).winning_balance || 0) : 0;
  const top3    = ((lb as any[]) || []).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">

      {/* ── Gamer Profile HUD Card ── */}
      <div className="px-4 pt-4 pb-2">
        {user ? (
          <Link to="/stats" className="block press-effect active:scale-[0.98] transition-all group">
            <div className="relative bg-gradient-to-br from-[#0d1424] via-[#0e172a] to-[#14233f] border border-primary/20 rounded-[28px] p-5 overflow-hidden shadow-card hover:border-primary/50 hover:shadow-[0_0_24px_rgba(0,200,255,0.15)] transition-all duration-300">
              
              {/* Scanline Sweep Laser Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
              
              {/* Ambient neon back glows */}
              <div className="absolute -top-16 -right-16 w-36 h-36 bg-primary/10 rounded-full blur-[40px] pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-28 h-28 bg-purple-500/5 rounded-full blur-[30px] pointer-events-none" />

              {/* Top Row: Avatar + Info + Balance */}
              <div className="flex items-center gap-3.5">
                {/* Avatar with pulsing ring */}
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border-2 border-primary/50 shadow-primary group-hover:scale-105 transition-transform duration-300">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-display font-black text-xl text-white"
                         style={{ background: "var(--gradient-primary)" }}>
                      {(profile?.ign || user.username || "?")[0].toUpperCase()}
                    </div>
                  )}
                  {/* Active status pulse */}
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-[2.5px] border-[#0d1424] rounded-full shadow-lg" />
                </div>

                {/* Name & IGN */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded-md text-[6px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20">
                      ⚡ DIVISION I
                    </span>
                  </div>
                  <h1 className="font-display font-black text-base text-foreground leading-tight truncate mt-1">
                    {profile?.ign || user.username}
                  </h1>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-bold text-muted-foreground font-mono truncate">@{user.username}</span>
                    {profile?.uid && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span className="text-[9px] font-black text-primary/80 font-mono shrink-0">UID: {profile.uid}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Balance Pill */}
                <div 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.navigate({ to: "/wallet" }); }} 
                  className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-border/80 bg-secondary/80 hover:border-primary/40 press-effect active:scale-95 transition-all"
                >
                  <GodCoin className="w-4 h-4" />
                  <div className="flex flex-col items-end">
                    <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest leading-none">Coins</span>
                    <span className="font-display font-black text-xs text-foreground leading-tight tabular-nums mt-0.5">{balance}</span>
                  </div>
                </div>
              </div>

              {/* Middle Row: Tech HUD Stats Grid */}
              <div className="grid grid-cols-3 gap-2.5 mt-5">
                {[
                  { label: "Matches", value: stats.matchesPlayed, color: "text-sky-400", icon: Gamepad2, bg: "bg-sky-400/5" },
                  { label: "Total Kills", value: stats.totalKills, color: "text-amber-500", icon: Swords, bg: "bg-amber-500/5" },
                  { label: "Win Rate", value: `${stats.winRate}%`, color: "text-emerald-400", icon: Trophy, bg: "bg-emerald-400/5" },
                ].map((item) => (
                  <div key={item.label} className={`flex flex-col items-center justify-center p-3 rounded-2xl border border-border/40 ${item.bg} relative overflow-hidden`}>
                    <item.icon className="w-3.5 h-3.5 text-muted-foreground/45 mb-1.5" />
                    <span className="text-[7px] font-black uppercase tracking-wider text-muted-foreground">{item.label}</span>
                    <span className={`font-display font-black text-sm mt-0.5 ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Bottom Row: Immersive Analytics CTA Banner */}
              <div className="mt-4 pt-3.5 border-t border-border/50 flex items-center justify-between text-muted-foreground group-hover:text-primary transition-all duration-300">
                <span className="text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-primary animate-pulse shrink-0" />
                  Analyze detailed performance metrics
                </span>
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </Link>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-black text-xl text-foreground">CLUTCHGROUND</h1>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">India's #1 Free Fire Arena</p>
            </div>
            <Link to="/login">
              <button className="h-9 px-5 rounded-xl font-black text-xs text-white uppercase tracking-widest press-effect active:scale-95" style={{ background: "var(--gradient-cta)" }}>
                Login
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div className="px-4 mb-5">
        <div className="grid grid-cols-4 gap-2.5">
          {[
            { icon: Wallet,  label: "Wallet",  to: "/wallet",      clr: "#10b981", bg: "rgba(16,185,129,0.1)",  bd: "rgba(16,185,129,0.2)" },
            { icon: Trophy,  label: "Matches", to: "/matches",     clr: "var(--primary)", bg: "rgba(0,200,255,0.1)", bd: "rgba(0,200,255,0.2)" },
            { icon: Users,   label: "Teams",   to: "/teams",       clr: "#a78bfa", bg: "rgba(167,139,250,0.1)", bd: "rgba(167,139,250,0.2)" },
            { icon: Crown,   label: "Ranks",   to: "/leaderboard", clr: "#f59e0b", bg: "rgba(245,158,11,0.1)",  bd: "rgba(245,158,11,0.2)" },
          ].map(({ icon: Icon, label, to, clr, bg, bd }) => (
            <Link key={to} to={to} className="press-effect active:scale-90 transition-transform">
              <div className="flex flex-col items-center gap-2 py-3 px-1 rounded-2xl border"
                style={{ background: bg, borderColor: bd }}>
                <Icon className="w-5 h-5" style={{ color: clr }} />
                <span className="text-[9px] font-black uppercase tracking-wide text-muted-foreground leading-none">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Banner Carousel ── */}
      <div className="px-4 mb-5">
        <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-border shadow-card bg-black/10 cursor-pointer group"
             onClick={() => setLightboxImg(banners[currentBannerIdx])}>
          <AnimatePresence mode="popLayout">
            <motion.img
              key={banners[currentBannerIdx]}
              src={banners[currentBannerIdx]}
              alt="CLUTCHGROUND Banner"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://res.cloudinary.com/dkjt9m4d0/image/upload/v1780319417/clutchground/placeholders/mygshudhl9qltqroxrmi.png'; }}
            />
          </AnimatePresence>
          
          {/* Overlay to darken slightly for a premium feel */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />


        </div>
      </div>

      {/* ── Featured Carousel ── */}
      {featured.length > 0 && (
        <div className="mb-6">
          <div className="px-4 flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
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
        </div>
      )}

      {/* ── Active Battles Carousel ── */}
      {battles.length > 0 && (
        <div className="mb-6">
          <div className="px-4 flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
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
        </div>
      )}

      {/* ── Mini Leaderboard ── */}
      {top3.length > 0 && (
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <h2 className="font-display font-black text-sm text-foreground uppercase tracking-wide">Top Players</h2>
            </div>
            <Link to="/leaderboard" className="flex items-center gap-0.5 text-[11px] font-black" style={{ color: "var(--primary)" }}>
              See all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-card divide-y divide-border">
            {top3.map((p: any, i: number) => {
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <div key={p.user_id || i} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-lg w-6 text-center">{medals[i]}</span>
                  <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center font-display font-black text-xs text-foreground shrink-0 overflow-hidden">
                    {p.logo ? (
                      <img src={p.logo} className="w-full h-full object-cover" />
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
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="mx-4 mb-6 mt-2">
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
      </footer>

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
            {/* Close button */}
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Premium Image Container */}
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
    </div>
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
