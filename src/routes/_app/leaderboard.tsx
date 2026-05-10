import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "../../lib/auth-client";
import { getGlobalLeaderboard } from "../../api";
import { Crown, Skull, Trophy, TrendingUp, Medal } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/leaderboard")({
  head: () => ({
    meta: [{ title: "Weekly Leaderboard — CLUTCHGROUND" }],
  }),
  loader: async () => await (getGlobalLeaderboard as any)(),
  component: LeaderboardPage,
});

const tabs = ["Weekly"] as const;

function LeaderboardPage() {
  const leaderboard = Route.useLoaderData() as any[];
  const { user } = useAuth();
  const [tab, setTab] = useState<(typeof tabs)[number]>(tabs[0]);
  const currentUser = user ? leaderboard.find((p: any) => p.user_id === user.id) : null;


  return (
    <div className="bg-background min-h-screen pb-24">
      {/* ─── Top Header (Mobile First) ─── */}
      <div className="bg-card rounded-b-[2rem] border-b border-white/5 shadow-xl pt-6 pb-6 px-4 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-primary/10 text-cta rounded-2xl flex items-center justify-center mb-3">
            <Crown className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-black text-foreground">Hall of Fame</h1>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">Top players and squads</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mt-6 snap-x -mx-4 px-4 pb-2">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`snap-center px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-full border transition-all whitespace-nowrap ${
                tab === t
                  ? "bg-primary text-white border-primary shadow-[0_0_15px_oklch(0.65_0.22_45/0.4)]"
                  : "bg-background border-white/5 text-muted-foreground hover:border-primary/40 active:bg-secondary/60"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-6">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center mb-8 px-4 py-2 bg-secondary/20 rounded-xl border border-white/5">
          Squad Tournaments Only • Resets every Sunday 11:59 PM
        </div>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 ? (
          <div className="mb-10 px-2 relative z-0">
            <div className="flex items-end justify-center gap-3 sm:gap-6">
              <PodiumCard
                p={leaderboard[1]}
                rank={2}
                medal="🥈"
                height="h-28"
                colorClass="from-slate-400/20 to-transparent border-slate-400/30"
                textClass="text-slate-300"
              />
              <PodiumCard
                p={leaderboard[0]}
                rank={1}
                medal="🥇"
                height="h-36"
                featured
                colorClass="from-amber-500/20 to-transparent border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                textClass="text-amber-400"
              />
              <PodiumCard
                p={leaderboard[2]}
                rank={3}
                medal="🥉"
                height="h-24"
                colorClass="from-orange-500/20 to-transparent border-orange-500/30"
                textClass="text-orange-400"
              />
            </div>
          </div>
        ) : (
          <div className="mb-8 p-8 text-center text-muted-foreground bg-card rounded-[1.5rem] border border-white/5 shadow-sm font-semibold text-sm">
            More match data required to build the Hall of Fame.
          </div>
        )}

        {currentUser ? (
          <div className="mb-8 bg-slate-950/95 border border-slate-800 rounded-[1.75rem] p-5 text-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.8)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.35em] text-slate-400 font-semibold mb-2">
                  Your Hall of Fame Position
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amber-500/15 text-amber-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]">
                    #{currentUser.rank}
                  </span>
                  <span className="text-lg font-black tracking-tight">{currentUser.team || "Your Team"}</span>
                </div>
                <p className="text-sm text-slate-300 mt-2">
                  {currentUser.points.toLocaleString()} points
                </p>
              </div>
              <div className="rounded-3xl bg-white/10 px-4 py-3 text-right">
                <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-semibold">
                  Current Score
                </div>
        <div className="text-3xl font-sans font-semibold text-white mt-1 tabular-nums">
                  {currentUser.points.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Full leaderboard table */}
        <h3 className="font-display font-black text-lg text-foreground mb-3 px-1">Top Rankings</h3>
        <div className="bg-card rounded-[1.5rem] border border-white/5 shadow-lg overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-white/5 bg-secondary/10 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            <div className="col-span-2 sm:col-span-1 text-center">Rank</div>
            <div className="col-span-8 sm:col-span-9">Player / Team</div>
            <div className="col-span-2 text-right text-cta">Pts</div>
          </div>

          {leaderboard.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
              <Trophy className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-semibold">
                No rankings yet. Play matches to climb the ladder!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {leaderboard.map((p: any, i: number) => (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  key={p.user_id || i}
                  className="grid grid-cols-12 gap-2 px-4 py-3.5 hover:bg-primary/10 border-b border-white/5 last:border-0 transition-colors items-center"
                >
                  <div className="col-span-2 sm:col-span-1 flex justify-center">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                        p.rank === 1
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : p.rank === 2
                            ? "bg-slate-500/20 text-slate-300 border border-slate-500/30"
                            : p.rank === 3
                              ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {p.rank}
                    </span>
                  </div>

                  <div className="col-span-8 sm:col-span-9 flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary/10 grid place-items-center font-display font-black text-xs text-cta shrink-0">
                      {p.team ? p.team[0].toUpperCase() : "T"}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-foreground truncate flex items-center gap-1.5">
                        {p.team || "Unknown Team"}
                        {p.badge === "god" && (
                          <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        )}
                        {p.badge === "elite" && (
                          <Skull className="w-3.5 h-3.5 text-cta shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>

            <div className="col-span-2 text-right font-semibold text-cta text-sm sm:text-base leading-none">
              {p.points.toLocaleString()}
            </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PodiumCard({
  p,
  rank,
  medal,
  height,
  featured = false,
  colorClass,
  textClass,
}: {
  p: any;
  rank: number;
  medal: string;
  height: string;
  featured?: boolean;
  colorClass: string;
  textClass: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: rank * 0.1 }}
      className="flex-1 max-w-[110px] sm:max-w-[130px] flex flex-col items-center relative"
    >
      {/* Crown for #1 */}
      {featured && <Crown className="absolute -top-7 w-6 h-6 text-amber-400 drop-shadow-sm z-20" />}

      {/* Avatar */}
      <div
        className={`relative z-10 rounded-full bg-card border-2 flex items-center justify-center font-display font-black text-white shadow-lg mb-2 ${
          featured
            ? "w-14 h-14 text-2xl border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
            : rank === 2
              ? "w-11 h-11 text-lg border-slate-400/50"
              : "w-11 h-11 text-lg border-orange-400/50"
        }`}
      >
        {p.team ? p.team[0].toUpperCase() : "T"}
      </div>

      <div
        className={`font-bold text-xs sm:text-sm truncate w-full text-center px-1 mb-0.5 text-foreground`}
      >
        {p.team || "Unknown"}
      </div>

      {/* Podium bar */}
      <div
        className={`w-full rounded-t-xl bg-gradient-to-b border-t shadow-lg flex flex-col items-center pt-2 backdrop-blur-sm ${colorClass} ${height}`}
      >
        <span className="text-xl leading-none mb-1">{medal}</span>
        <div className={`font-sans font-semibold tabular-nums text-sm sm:text-base ${textClass}`}>
          {p.points.toLocaleString()}
        </div>
      </div>
    </motion.div>
  );
}
