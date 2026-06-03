import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import * as React from "react";
import {
  Trophy, ChevronLeft, Target, Gamepad2, Swords,
  Activity, Star, Flame, Award, Calendar, Coins,
} from "lucide-react";
import { useAuth } from "../../lib/auth-client";
import { getProfile, getPlayerStats } from "../../api";
import { GodCoin } from "@/components/GodCoin";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_app/stats")({
  head: () => ({ meta: [{ title: "Stats — CLUTCHGROUND" }] }),
  component: StatsPage,
});

function StatsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
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

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.navigate({ to: "/login" });
      return;
    }
    if (!user) return;
    
    (async () => {
      try {
        const [p, s] = await Promise.all([
          (getProfile as any)({ data: user.id }),
          (getPlayerStats as any)({ data: user.id }),
        ]);
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
      } catch (err) {
        console.error("Failed to load player stats page:", err);
      }
      setLoading(false);
    })();
  }, [user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const initials = profile?.ign?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-background pb-[80px]">
      {/* ── Top Header ── */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button
          onClick={() => router.history.back()}
          className="w-10 h-10 rounded-2xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all press-effect active:scale-90"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground leading-none">Performance</span>
          <h1 className="font-display font-black text-xl text-foreground mt-0.5 leading-tight">Player Stats</h1>
        </div>
      </div>

      {/* ── Gamer Header Panel ── */}
      <div className="px-4 py-3">
        <div className="relative bg-card border border-border/80 rounded-3xl p-5 shadow-card overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none" />
          
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 shrink-0 border-primary/50 shadow-primary">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-display font-black text-2xl text-white"
                     style={{ background: "var(--gradient-primary)" }}>{initials}</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="font-display font-black text-lg text-foreground leading-tight truncate">
                {profile?.ign || user.username}
              </h2>
              <p className="text-xs text-muted-foreground font-mono font-semibold mt-0.5">@{user.username}</p>
              {profile?.uid && (
                <span className="text-[10px] font-black font-mono text-primary mt-1 inline-block">UID: {profile.uid}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="px-4 grid grid-cols-2 gap-3 mb-6">
        {[
          { label: "Matches Played", value: stats.matchesPlayed, icon: Gamepad2, color: "text-sky-400", bg: "bg-sky-400/10" },
          { label: "Total Kills", value: stats.totalKills, icon: Swords, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Kill/Death Ratio", value: stats.kdRatio, icon: Target, color: "text-primary", bg: "bg-primary/10" },
          { label: "Win Rate", value: `${stats.winRate}%`, icon: Trophy, color: "text-emerald-400", bg: "bg-emerald-400/10" },
        ].map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-3 shadow-sm"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">{item.label}</p>
              <p className="text-lg font-display font-black text-foreground mt-0.5 leading-none">{item.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Placement Awards ── */}
      <div className="px-4 mb-6">
        <div className="bg-card border border-border/50 rounded-3xl p-4 grid grid-cols-2 divide-x divide-border">
          <div className="flex flex-col items-center justify-center py-1">
            <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              🥇 Booyah! (1st Place)
            </span>
            <span className="text-2xl font-display font-black text-amber-400 mt-1">{stats.firstPlaces}</span>
          </div>
          <div className="flex flex-col items-center justify-center py-1">
            <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              🏆 Podium (Top 3)
            </span>
            <span className="text-2xl font-display font-black text-primary mt-1">{stats.top3}</span>
          </div>
        </div>
      </div>

      {/* ── Recharts Chart ── */}
      <div className="px-4 mb-6">
        <div className="bg-card border border-border/50 rounded-3xl p-5 shadow-card overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-black text-xs uppercase tracking-wider text-foreground">
                Kills & Earnings Trend
              </h3>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                Last 10 Tournaments
              </p>
            </div>
            <Activity className="w-4 h-4 text-primary animate-pulse" />
          </div>

          {stats.history.length === 0 ? (
            <div className="h-[140px] flex flex-col items-center justify-center text-center">
              <p className="text-xs font-bold text-muted-foreground">No matches played yet.</p>
              <Link to="/tournaments" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline mt-2">
                Join a Battle Now &rarr;
              </Link>
            </div>
          ) : (
            <div className="h-[140px] w-full mt-2 font-mono text-[9px] font-bold">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats.history}
                  margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorKills" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorPrize" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--gold)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--gold)" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis 
                    dataKey="tournament_title" 
                    stroke="rgba(255,255,255,0.25)" 
                    tickLine={false}
                    tickFormatter={(val) => val?.substring(0, 8) + '...'}
                  />
                  <YAxis stroke="rgba(255,255,255,0.25)" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(13, 20, 32, 0.95)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "10px"
                    }}
                    labelFormatter={(label, items) => {
                      const item = items?.[0]?.payload;
                      return item ? `${item.tournament_title}` : label;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="kills"
                    name="Kills"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorKills)"
                  />
                  <Area
                    type="monotone"
                    dataKey="awarded_prize"
                    name="Won Coins"
                    stroke="var(--gold)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPrize)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── Match History Timeline ── */}
      <div className="px-4">
        <p className="text-[10px] font-black uppercase tracking-widest mb-3 ml-1 text-muted-foreground">
          Recent Match History
        </p>

        {stats.history.length === 0 ? (
          <div className="bg-card border border-border/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
            <Gamepad2 className="w-8 h-8 text-muted-foreground opacity-30 mb-2" />
            <p className="text-xs font-bold text-muted-foreground">No recent match registrations found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.history.map((match: any, index: number) => {
              const placedFirst = match.position === 1;
              const placedTop3 = match.position > 0 && match.position <= 3;
              
              return (
                <div
                  key={index}
                  className="bg-card border border-border/50 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden"
                >
                  {placedFirst && (
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-400" />
                  )}
                  
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Badge representing place */}
                    <div
                      className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center shrink-0 border font-display font-black text-xs ${
                        placedFirst
                          ? "bg-amber-400/10 border-amber-400/30 text-amber-400"
                          : placedTop3
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-secondary border-border text-muted-foreground"
                      }`}
                    >
                      {match.position > 0 ? `#${match.position}` : "TBD"}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-foreground leading-snug truncate">
                        {match.tournament_title}
                      </h4>
                      <p className="text-[9px] text-muted-foreground font-semibold flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(match.created_at).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 pl-2">
                    {/* Kills stats */}
                    <div className="flex flex-col items-end">
                      <span className="text-[7px] text-muted-foreground font-black uppercase tracking-wider">Kills</span>
                      <span className="text-xs font-display font-black text-foreground mt-0.5">{match.kills}</span>
                    </div>

                    {/* Prize earned */}
                    <div className="flex flex-col items-end">
                      <span className="text-[7px] text-muted-foreground font-black uppercase tracking-wider">Prize</span>
                      <span className="text-xs font-display font-black text-emerald-400 flex items-center gap-0.5 mt-0.5">
                        <GodCoin className="w-2.5 h-2.5 text-amber-400" />
                        {match.awarded_prize || 0}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
