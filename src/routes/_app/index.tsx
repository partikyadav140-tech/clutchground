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
  
  // Calculate relative time for the "Reg. closes" pill
  const getDaysLeft = () => {
    try {
      const dateStr = t.startsAt || t.startsat;
      if (!dateStr) return "soon";
      const parts = dateStr.match(/(\d+)(st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})/);
      if (parts) {
        const [, day, , month, year] = parts;
        const d = new Date(`${month} ${day}, ${year}`);
        const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 3600 * 24));
        if (diff > 1) return `in ${diff} days`;
        if (diff === 1) return `in 1 day`;
      }
      return "soon";
    } catch {
      return "soon";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: i * 0.05 }}
      className="shrink-0 w-[85vw] max-w-[320px] snap-center group relative pt-2"
    >
      <div className="bg-[#be008c] rounded-2xl p-3 pb-0 flex flex-col relative border border-[#d6009f] shadow-[0_4px_20px_rgba(190,0,140,0.4)]">
        
        {/* Banner Image */}
        <div className="relative w-full h-[120px] rounded-xl overflow-hidden">
          <img src={poster} alt={t.title} className="w-full h-full object-cover" />
          
          {/* Top Right Prize Pill */}
          <div className="absolute top-2 right-2 bg-[#0e1015]/90 backdrop-blur rounded-lg px-2.5 py-1 flex items-center gap-1.5 border border-white/5 shadow-lg">
            <GodCoin className="w-4 h-4 text-blue-500" />
            <span className="text-white font-bold text-xs">{t.prize || 0}</span>
          </div>
        </div>

        {/* Overlapping Thumbnail & Game Name */}
        <div className="flex justify-between items-end mt-[-28px] px-1 relative z-10 h-16">
          <div className="w-[72px] h-[72px] rounded-xl overflow-hidden border-[3px] border-[#be008c] shadow-lg bg-[#1a1b26]">
             <img src={poster} className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center gap-1.5 text-white font-medium text-[11px] pb-1 bg-[#be008c]/80 px-2 py-0.5 rounded-full backdrop-blur-sm">
             <Gamepad2 className="w-3.5 h-3.5" /> {t.game || "Free Fire Max"}
          </div>
        </div>

        {/* Title & Organizer */}
        <div className="px-1 mt-2">
           <h4 className="font-bold text-white text-lg leading-tight line-clamp-1 drop-shadow-sm">{t.title}</h4>
           <div className="flex items-center gap-2 mt-2">
              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[8px] text-black font-black uppercase overflow-hidden">
                <img src="/logo.svg" className="w-full h-full object-contain p-0.5 opacity-50" />
              </div>
              <span className="text-white text-[13px] font-medium">{t.hosted_by || "God Esports"}</span>
           </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 px-1 mt-3 mb-5 text-white text-[12px] font-medium">
           <div className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4" /> 
              <span>{t.entry === 0 ? "Free" : t.entry}</span>
           </div>
           <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" /> 
              <span>{t.mode}</span>
           </div>
           <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> 
              <span>{t.startsAt || "TBA"}</span>
           </div>
        </div>

        {/* Bottom Action Bar overlapping the bottom */}
        <div className="absolute -bottom-4 left-3 right-3 h-[42px] flex rounded-xl overflow-hidden shadow-[0_8px_16px_rgba(0,0,0,0.3)]">
          {/* Left part */}
          <div className="bg-white flex-1 flex items-center pl-3">
            <span className="text-black text-[11px] font-semibold">
              Reg. closes <span className="text-red-500 ml-0.5">{getDaysLeft()}</span>
            </span>
          </div>
          {/* Right part (Blue Slanted) */}
          <Link to={`/tournaments/${t.id}` as any} className="block">
            <div 
              className="bg-[#3091f2] w-[130px] h-full flex items-center justify-center text-white text-[13px] font-bold cursor-pointer hover:bg-[#257dd4] transition-colors" 
              style={{ clipPath: "polygon(15px 0, 100% 0, 100% 100%, 0 100%)", marginLeft: "-10px" }}
            >
              <span className="ml-2">Register Now</span>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Spacer to account for the overlapping button */}
      <div className="h-6" />
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
