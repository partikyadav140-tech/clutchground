import { createFileRoute, Link } from "@tanstack/react-router";
import { getTournaments, getGlobalLeaderboard } from "../../api";
import {
  Trophy,
  Users,
  Crown,
  Wallet,
  ChevronRight,
  Clock,
  Gamepad2,
  Flame,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { JoinBattleDialog } from "@/components/JoinBattleDialog";
import { useAuth } from "../../lib/auth-client";
import { GodCoin } from "@/components/GodCoin";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [{ title: "CLUTCHGROUND — Professional Esports Arena" }],
  }),
  loader: async () => {
    const [ts, lb] = await Promise.allSettled([
      getTournaments(),
      (getGlobalLeaderboard as any)(),
    ]);
    return {
      ts: ts.status === 'fulfilled' ? ts.value : [],
      lb: lb.status === 'fulfilled' ? lb.value : [],
    };
  },
  component: HomePage,
  pendingComponent: () => (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  ),
  errorComponent: () => (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-destructive mb-4">Connection Failed</h2>
        <Button onClick={() => window.location.reload()}>Retry Connection</Button>
      </div>
    </div>
  ),
});

const POSTERS = [
  "/posters/poster1.jpg",
  "/posters/poster2.jpg",
  "/posters/poster3.jpg",
  "/posters/poster4.jpg",
  "/posters/poster5.jpg",
  "/posters/poster6.jpg",
];

function HomePage() {
  const { ts: allTournaments } = Route.useLoaderData();
  const { user } = useAuth();

  const isCompleted = (t: any) => String(t.status || "").trim().toLowerCase() === "completed";
  const isLocked = (t: any) => String(t.status || "").trim().toLowerCase() === "locked";

  const displayTournaments = allTournaments.filter(
    (t: any) => !isCompleted(t) && !isLocked(t) && Boolean(t.is_hero) && t.is_hero !== "0" && t.is_hero !== "false"
  );

  const upcomingTournaments = allTournaments.filter(
    (t: any) => !isCompleted(t) && !isLocked(t) && (!Boolean(t.is_hero) || t.is_hero === "0" || t.is_hero === "false")
  );

  return (
    <div className="min-h-screen bg-background pt-2 pb-safe">
      
      {/* ─── Greeting & Quick Actions (App Style) ─── */}
      <div className="px-4 mb-6">
        {user ? (
          <div className="mb-6">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
              Welcome back
            </p>
            <h1 className="text-2xl font-display font-black text-foreground">{user.username}</h1>
          </div>
        ) : (
          <div className="mb-6 bg-card border border-white/5 p-5 rounded-[1.5rem] shadow-lg flex items-center justify-between">
            <div>
              <h1 className="text-xl font-display font-black text-foreground mb-1">Play & Earn</h1>
              <p className="text-xs text-muted-foreground">Join India's top arena.</p>
            </div>
            <Link to="/login">
              <Button size="sm" className="rounded-full px-6 bg-primary text-white font-bold shadow-primary">
                LOGIN
              </Button>
            </Link>
          </div>
        )}

        {/* Action Grid */}
        <div className="grid grid-cols-4 gap-3">
          <QuickAction icon={Wallet} label="Add Cash" to="/wallet" color="text-emerald-400 bg-emerald-400/10" />
          <QuickAction icon={Trophy} label="Matches" to="/matches" color="text-cta bg-primary/10" />
          <QuickAction icon={Users} label="Teams" to="/teams" color="text-blue-400 bg-blue-400/10" />
          <QuickAction icon={Crown} label="Ranks" to="/leaderboard" color="text-amber-400 bg-amber-400/10" />
        </div>
      </div>

      {/* ─── Hero Banner Slider ─── */}
      <div className="px-4 mb-8">
        <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-[2rem] overflow-hidden border border-white/10 shadow-lg">
          <img src="/new-banner.png" alt="Hero Banner" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* ─── Featured Scroller ─── */}
      {displayTournaments.length > 0 && (
        <div className="mb-8">
          <div className="px-4 flex items-center justify-between mb-4">
            <h3 className="font-display font-black text-lg text-foreground flex items-center gap-2">
              <Flame className="w-5 h-5 text-cta" /> Featured
            </h3>
            <Link to="/tournaments" className="text-xs font-bold text-muted-foreground flex items-center">
              See All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar px-4 pb-4 gap-4 -mx-4 w-[calc(100%+2rem)] ml-0">
            {displayTournaments.map((t: any, i: number) => (
              <AppTournamentCard key={`hero-${t.id}-${i}`} t={t} i={i} />
            ))}
          </div>
        </div>
      )}

      {/* ─── Upcoming Matches ─── */}
      <div className="mb-8">
        <div className="px-4 flex items-center justify-between mb-4">
          <h3 className="font-display font-black text-lg text-foreground flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-purple-400" /> Upcoming
          </h3>
        </div>
        <div className="px-4 space-y-4">
          {upcomingTournaments.length > 0 ? (
            upcomingTournaments.map((t: any, i: number) => (
              <ListTournamentCard key={`upc-${t.id}-${i}`} t={t} i={i} />
            ))
          ) : (
            <div className="p-6 bg-card border border-white/5 rounded-3xl text-center">
              <p className="text-sm text-muted-foreground font-semibold">No upcoming matches right now.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, to, color }: { icon: any; label: string; to: string; color: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-2 active:scale-90 transition-transform">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} shadow-lg border border-white/5`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-[10px] font-bold text-muted-foreground tracking-wide text-center">
        {label}
      </span>
    </Link>
  );
}

// Mobile-first horizontal scroll card
function AppTournamentCard({ t, i }: { t: any; i: number }) {
  const poster = POSTERS[t.id % POSTERS.length];
  const fillPct = Math.min(100, (t.filled / t.slots) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: i * 0.05, ease: "easeOut" }}
      className="shrink-0 w-[85vw] max-w-[320px] snap-center group relative p-[1px] rounded-[2rem] overflow-hidden mt-2 mb-2"
    >
      {/* Animated Glowing Border */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-blue-500 opacity-40 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="relative h-full bg-[#0a0a0f]/95 backdrop-blur-3xl rounded-[2rem] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Banner Section */}
        <div className="relative h-[160px] w-full overflow-hidden">
          <img src={poster} alt={t.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out opacity-90" />
          
          {/* Gradient Overlay for smooth transition */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/30 to-transparent" />
          
          {/* Badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            {t.status === "live" && (
              <span className="px-3 py-1 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/50 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live
              </span>
            )}
            <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white/90 text-[10px] font-black uppercase tracking-widest border border-white/10">
              {t.mode}
            </span>
          </div>

          {/* Floating Game Name */}
          <div className="absolute bottom-3 left-5 flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-widest text-glow z-10">
             <Gamepad2 className="w-3.5 h-3.5" /> {t.game || "Free Fire"}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 flex flex-col flex-1 relative z-10 -mt-2">
          <h4 className="font-display font-black text-xl text-white leading-tight line-clamp-1 drop-shadow-md mb-4">
            {t.title}
          </h4>

          {/* Highlighted Prize & Entry Box */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10 flex flex-col items-center justify-center transition-colors group-hover:bg-white/10">
              <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-1.5">Entry</span>
              <span className="text-sm font-black text-white flex items-center gap-1.5">
                {t.entry === 0 ? "FREE" : <><GodCoin className="w-4 h-4 text-primary"/> {t.entry}</>}
              </span>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 backdrop-blur-sm rounded-2xl p-3 border border-primary/30 flex flex-col items-center justify-center relative overflow-hidden shadow-[0_0_20px_rgba(255,0,85,0.1)] group-hover:shadow-[0_0_25px_rgba(255,0,85,0.2)] transition-shadow">
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/20 blur-xl rounded-full translate-x-1/2 -translate-y-1/2" />
              <span className="text-[9px] text-primary uppercase font-black tracking-widest mb-1.5 relative z-10">Prize Pool</span>
              <span className="text-sm font-black text-white flex items-center gap-1.5 relative z-10">
                <GodCoin className="w-4 h-4 text-amber-400"/> {t.mode === 'Solo' ? t.per_kill_coin || 0 : t.prize}
              </span>
            </div>
          </div>

          <div className="mt-auto">
             <div className="flex justify-between items-end mb-2.5">
                <div className="flex flex-col gap-1">
                   <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Starts In</span>
                   <span className="text-xs font-bold text-white/90 flex items-center gap-1.5">
                     <Clock className="w-3 h-3 text-primary" /> {t.startsAt || t.startsat}
                   </span>
                </div>
                <div className="text-right">
                   <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Slots</span>
                   <span className="text-xs font-black text-white/90">{t.filled} / <span className="text-muted-foreground">{t.slots}</span></span>
                </div>
             </div>

            {/* Premium Progress Bar */}
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-5 border border-white/5 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full relative shadow-[0_0_15px_rgba(255,0,85,0.6)]" 
                style={{ width: `${fillPct}%` }}
              >
                {fillPct < 100 && <div className="absolute right-0 top-0 bottom-0 w-6 bg-white/40 blur-[3px]" />}
              </div>
            </div>

            <Link to={`/tournaments/${t.id}` as any} className="block">
              <Button className="w-full rounded-2xl font-black uppercase tracking-widest text-xs bg-white text-black hover:bg-gray-200 h-12 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-[1.02] transition-transform duration-300">
                View Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Vertical list card for Upcoming
function ListTournamentCard({ t, i }: { t: any; i: number }) {
  const poster = POSTERS[t.id % POSTERS.length];
  const fillPct = Math.min(100, (t.filled / t.slots) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: i * 0.05 }}
      className="group relative rounded-[1.25rem] p-[1px] overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative bg-card/80 backdrop-blur-xl border border-white/5 rounded-[1.25rem] p-3 flex gap-4 active:scale-95 transition-transform shadow-lg overflow-hidden">
        {/* Left thumbnail */}
        <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden relative shrink-0 border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <img src={poster} alt={t.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <span className="absolute bottom-1.5 left-1.5 text-[8px] font-black uppercase text-white bg-black/60 backdrop-blur px-1.5 py-0.5 rounded border border-white/10">
            {t.format}
          </span>
        </div>

        {/* Right content */}
        <div className="flex-1 flex flex-col justify-between py-0.5 pr-1 min-w-0">
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-cta text-glow">
                {t.mode}
              </span>
              <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> {t.startsAt || t.startsat}
              </span>
            </div>
            <h4 className="font-display font-black text-sm text-white line-clamp-1 drop-shadow-md">
              {t.title}
            </h4>
          </div>

          <div className="flex items-center gap-3 mt-2 mb-2">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-white">
              <span className="text-[9px] text-muted-foreground tracking-widest uppercase">Prize</span>
              <GodCoin className="w-3.5 h-3.5 text-cta" /> {t.mode === 'Solo' ? t.per_kill_coin || 0 : t.prize}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
              <div 
                className="h-full bg-primary-gradient rounded-full relative shadow-[0_0_10px_rgba(255,0,85,0.8)]" 
                style={{ width: `${fillPct}%` }}
              >
                {fillPct < 100 && <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/30 blur-[1px]" />}
              </div>
            </div>
            <Link to={`/tournaments/${t.id}` as any} className="shrink-0">
              <Button size="sm" className="h-8 text-[10px] uppercase font-black tracking-wider rounded-lg px-4 bg-cta-gradient shadow-cta text-cta-foreground border border-cta/50">
                Join
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
