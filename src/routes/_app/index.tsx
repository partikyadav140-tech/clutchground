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
          <QuickAction icon={Trophy} label="Matches" to="/matches" color="text-primary bg-primary/10" />
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
              <Flame className="w-5 h-5 text-primary" /> Featured
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
      transition={{ duration: 0.3, delay: i * 0.05 }}
      className="shrink-0 w-[80vw] max-w-[300px] snap-center rounded-[1.5rem] bg-card border border-white/5 shadow-xl overflow-hidden flex flex-col relative"
    >
      <div className="relative h-32 w-full overflow-hidden">
        <img src={poster} alt={t.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
        
        <div className="absolute top-3 left-3 flex gap-2">
          {t.status === "live" && (
            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest border border-white/10">
            {t.mode}
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1 relative z-10 -mt-6">
        <div className="flex justify-between items-start gap-2 mb-3">
          <h4 className="font-display font-black text-base text-white leading-tight line-clamp-1 drop-shadow-md">
            {t.title}
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 bg-background/50 rounded-xl p-2 border border-white/5">
          <div className="flex flex-col items-center justify-center">
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Entry</span>
            <span className="text-xs font-black text-primary flex items-center gap-1">
              {t.entry === 0 ? "FREE" : <><GodCoin className="w-3 h-3"/> {t.entry}</>}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center border-l border-white/5">
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Prize</span>
            <span className="text-xs font-black text-white flex items-center gap-1">
              <GodCoin className="w-3 h-3"/> {t.mode === 'Solo' ? t.per_kill_coin || 0 : t.prize}
            </span>
          </div>
        </div>

        <div className="mt-auto">
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1.5">
            <span>{t.filled}/{t.slots} Joined</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {t.startsAt || t.startsat}</span>
          </div>
          <div className="h-1.5 w-full bg-background rounded-full overflow-hidden mb-4 border border-white/5">
            <div className="h-full bg-primary rounded-full" style={{ width: `${fillPct}%` }} />
          </div>

          <Link to={`/tournaments/${t.id}` as any}>
            <Button className="w-full rounded-xl font-black bg-primary text-white h-10 shadow-primary">
              View details
            </Button>
          </Link>
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
      className="bg-card border border-white/5 rounded-[1.25rem] p-3 flex gap-4 active:scale-95 transition-transform shadow-lg relative overflow-hidden"
    >
      <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 relative">
        <img src={poster} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur text-[8px] text-white px-1.5 py-0.5 rounded font-black uppercase border border-white/10">
          {t.mode}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center min-w-0">
        <h4 className="font-display font-black text-sm text-white line-clamp-1 mb-1">{t.title}</h4>
        <div className="text-[10px] text-muted-foreground font-bold flex items-center gap-2 mb-2">
          <span className="flex items-center gap-1 text-primary"><Clock className="w-3 h-3"/> {t.startsAt || t.startsat}</span>
        </div>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2 text-[10px] font-black">
            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md border border-primary/20">
              {t.entry === 0 ? 'FREE' : <span className="flex items-center gap-1"><GodCoin className="w-3 h-3"/>{t.entry}</span>}
            </span>
            <span className="px-2 py-1 bg-secondary text-white rounded-md border border-white/5 flex items-center gap-1">
              <GodCoin className="w-3 h-3"/> {t.mode === 'Solo' ? t.per_kill_coin || 0 : t.prize}
            </span>
          </div>
          <Link to={`/tournaments/${t.id}` as any}>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-primary">
              <ChevronRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
