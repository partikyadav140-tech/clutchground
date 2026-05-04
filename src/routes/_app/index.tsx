import { createFileRoute, Link } from "@tanstack/react-router";
import { getTournaments, getGlobalLeaderboard } from "../../api";
import {
  Trophy, Users, Crown, Shield, Wallet, Bell, BarChart3, Smartphone,
  Flame, ChevronRight, Eye, Crosshair, Zap, Star, Radio, ArrowUpRight, ArrowDownToLine, Gamepad2
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { JoinBattleDialog } from "@/components/JoinBattleDialog";
import { useAuth } from "../../lib/auth-client";
import { GodCoin } from "@/components/GodCoin";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "CLUTCHGROUND — Professional Esports Arena" },
    ],
  }),
  loader: async () => {
    try {
      const ts = await getTournaments();
      const lb = await (getGlobalLeaderboard as any)();
      return { ts, lb };
    } catch (e: any) {
      return {
        ts: [],
        lb: [],
      };
    }
  },
  component: HomePage,
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
  const { ts: allTournaments, lb: leaderboard } = Route.useLoaderData();
  const { user } = useAuth();
  
  const displayTournaments = allTournaments
    .filter((t: any) => Boolean(t.is_hero) && t.is_hero !== "0" && t.is_hero !== 0 && t.is_hero !== "false" && t.is_hero !== "f")
    .slice(0, 5);

  const upcomingTournaments = allTournaments
    .filter((t: any) => t.status === "upcoming")
    .slice(0, 5);

  const totalBalance = user ? ((user as any).deposit_balance || 0) + ((user as any).winning_balance || 0) : 0;

  return (
    <div className="mb-safe pb-24 bg-background min-h-screen">
      {/* ─── Top Dashboard Area (Mobile First) ─── */}
      <div className="bg-white rounded-b-[2rem] shadow-[0_4px_24px_oklch(0_0_0/0.04)] pt-4 pb-6 px-4 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        {/* User Stats / Login Prompt */}
        <div className="relative z-10">
          {user ? (
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Welcome back,</p>
                <h1 className="text-xl font-display font-black text-foreground">{user.username}</h1>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Total Balance</p>
                <div className="flex items-center gap-1.5 justify-end">
                  <GodCoin className="w-5 h-5" />
                  <span className="text-xl font-display font-black text-primary">{totalBalance}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-display font-black text-foreground mb-1">Play. Win. Earn.</h1>
                <p className="text-sm text-muted-foreground">Join India's premium esports arena.</p>
              </div>
              <Link to="/login">
                <Button variant="hero" size="sm" className="font-display tracking-wider rounded-full px-6 shadow-fire">
                  LOGIN
                </Button>
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-3 mt-2">
            <QuickAction icon={Wallet} label="Add Cash" to="/wallet" color="bg-emerald-50 text-emerald-600 border-emerald-100" />
            <QuickAction icon={Trophy} label="Matches" to="/matches" color="bg-primary/10 text-primary border-primary/20" />
            <QuickAction icon={Users} label="Teams" to="/teams" color="bg-blue-50 text-blue-600 border-blue-100" />
            <QuickAction icon={Crown} label="Ranks" to="/leaderboard" color="bg-amber-50 text-amber-600 border-amber-100" />
          </div>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="px-4 mt-6 space-y-8">
        
        {/* Promotional Banner */}
        <div className="relative w-full h-32 rounded-2xl overflow-hidden shadow-lg border border-primary/20 block">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80" />
          <div className="absolute inset-0 bg-[url('/hero.mp4')] opacity-20 mix-blend-overlay object-cover" />
          <div className="relative z-10 h-full flex flex-col justify-center px-6">
            <span className="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-white text-primary w-max mb-2">Mega Event</span>
            <h2 className="text-xl font-display font-black text-white leading-tight">CHAMPIONS CUP</h2>
            <p className="text-white/90 text-xs mt-1 font-semibold">₹50,000 Prize Pool • Starts Tonight</p>
          </div>
          <Zap className="absolute right-4 bottom-0 text-white/10 w-24 h-24 translate-y-4" />
        </div>

        {/* Featured Tournaments (Horizontal Scroll) */}
        {displayTournaments.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-black text-lg text-foreground flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" /> Live & Featured
              </h3>
              <Link to="/tournaments" className="text-xs font-bold text-primary flex items-center">
                See All <ChevronRight className="w-3 h-3 ml-0.5" />
              </Link>
            </div>
            <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar -mx-4 px-4 pb-4 gap-4">
              {displayTournaments.map((t: any, i: number) => (
                <FeaturedTournamentCard key={t.id} t={t} i={i} />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Tournaments (Vertical List) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-black text-lg text-foreground flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-purple" /> Upcoming Battles
            </h3>
          </div>
          <div className="space-y-3">
            {upcomingTournaments.length > 0 ? (
              upcomingTournaments.map((t: any) => (
                <CompactTournamentCard key={t.id} t={t} />
              ))
            ) : (
              <div className="p-6 bg-white rounded-2xl border border-border text-center">
                <p className="text-sm text-muted-foreground font-semibold">No upcoming tournaments right now.</p>
              </div>
            )}
          </div>
          <div className="mt-4">
            <Link to="/tournaments">
              <Button variant="outline" className="w-full bg-white border-border text-foreground font-bold rounded-xl h-12 shadow-sm">
                Browse All Tournaments
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, to, color }: { icon: any, label: string, to: string, color: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${color} shadow-sm`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-[10px] font-bold text-foreground tracking-wide text-center">{label}</span>
    </Link>
  );
}

function FeaturedTournamentCard({ t, i }: { t: any; i: number }) {
  const poster = POSTERS[t.id % POSTERS.length];
  const fillPct = Math.min(100, (t.filled / t.slots) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: i * 0.1 }}
      className="shrink-0 w-[85vw] max-w-[320px] snap-center rounded-[1.25rem] bg-white border border-border shadow-[0_8px_24px_oklch(0_0_0/0.06)] overflow-hidden flex flex-col"
    >
      <div className="relative h-32 w-full overflow-hidden">
        <img src={poster} alt={t.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute top-2 left-2 flex gap-2">
          {t.status === "live" && (
            <span className="px-2 py-0.5 rounded bg-red-500 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
            </span>
          )}
          <span className="px-2 py-0.5 rounded bg-white/20 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest border border-white/20">
            {t.mode}
          </span>
        </div>
      </div>
      
      <div className="p-3.5 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h4 className="font-display font-black text-base leading-tight line-clamp-1">{t.title}</h4>
          <div className="bg-primary/10 text-primary px-2 py-1 rounded-md text-[10px] font-black whitespace-nowrap">
            {t.entry === 0 ? "FREE" : `₹${t.entry}`}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
          <div className="flex items-center gap-1"><Trophy className="w-3 h-3 text-primary" /> ₹{t.prize}</div>
          <div className="flex items-center gap-1"><Users className="w-3 h-3" /> {t.format}</div>
        </div>

        <div className="mt-auto">
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1.5">
            <span>{t.filled}/{t.slots} Joined</span>
            <span className="text-primary">{t.startsAt}</span>
          </div>
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mb-3">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${fillPct}%` }} />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Link to="/tournaments/$id" params={{ id: String(t.id) }} className="w-full">
              <Button variant="outline" className="w-full h-9 rounded-xl font-bold text-xs bg-white border-border">Details</Button>
            </Link>
            {t.filled >= t.slots ? (
              <Button disabled className="w-full h-9 rounded-xl font-bold text-xs bg-muted text-muted-foreground">Full</Button>
            ) : (
              <JoinBattleDialog
                tournamentId={t.id}
                tournamentTitle={t.title}
                mode={t.mode as any}
                entryFee={t.entry}
                trigger={
                  <Button className="w-full h-9 rounded-xl font-bold text-xs bg-primary text-white shadow-primary">Join</Button>
                }
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CompactTournamentCard({ t }: { t: any }) {
  const poster = POSTERS[t.id % POSTERS.length];
  const fillPct = Math.min(100, (t.filled / t.slots) * 100);

  return (
    <div className="bg-white rounded-[1rem] border border-border p-3 flex gap-3 items-center shadow-sm active:scale-[0.98] transition-transform">
      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 relative">
        <img src={poster} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span className="absolute bottom-1 left-1 text-white text-[8px] font-black uppercase bg-primary px-1.5 py-0.5 rounded">
          {t.entry === 0 ? "FREE" : `₹${t.entry}`}
        </span>
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-display font-black text-sm truncate leading-tight">{t.title}</h4>
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase mt-1 mb-2">
          <span>{t.mode}</span> • <span>{t.format}</span> • <span className="text-primary">{t.startsAt}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex justify-between text-[8px] font-bold text-muted-foreground mb-1">
              <span>{t.filled}/{t.slots}</span>
              <span className="text-primary">₹{t.prize}</span>
            </div>
            <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${fillPct}%` }} />
            </div>
          </div>
          <Link to="/tournaments/$id" params={{ id: String(t.id) }}>
            <Button size="icon" className="h-7 w-7 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 shrink-0">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

