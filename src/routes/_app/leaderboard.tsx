import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "../../lib/auth-client";
import { getGlobalLeaderboard } from "../../api";
import { Crown, Trophy, Star, Medal, Zap } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — CLUTCHGROUND" }] }),
  loader: async () => await (getGlobalLeaderboard as any)(),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const leaderboard = Route.useLoaderData() as any[];
  const { user } = useAuth();
  const myEntry = user ? leaderboard.find((p: any) => p.user_id === user.id) : null;

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const rankConfig: Record<number, { medal: string; color: string; glow: string; bg: string; size: string }> = {
    1: { medal: "🥇", color: "#f59e0b", glow: "0 0 24px rgba(245,158,11,0.4)", bg: "rgba(245,158,11,0.12)", size: "w-16 h-16" },
    2: { medal: "🥈", color: "#94a3b8", glow: "0 0 20px rgba(148,163,184,0.3)", bg: "rgba(148,163,184,0.1)", size: "w-13 h-13" },
    3: { medal: "🥉", color: "#f97316", glow: "0 0 20px rgba(249,115,22,0.3)", bg: "rgba(249,115,22,0.1)", size: "w-12 h-12" },
  };

  return (
    <div className="min-h-screen bg-background pb-[80px]">
      {/* ── Header ── */}
      <div className="relative overflow-hidden px-4 pt-5 pb-8">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(245,158,11,0.08)" }} />
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <Crown className="w-3 h-3" /> Hall of Fame
          </div>
          <h1 className="font-display font-black text-3xl text-foreground">Leaderboard</h1>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">Top warriors of the arena</p>
        </div>
      </div>

      {/* ── Podium ── */}
      {top3.length >= 3 && (
        <div className="px-4 mb-6">
          <div className="bg-card rounded-3xl border border-border p-5 shadow-card relative overflow-hidden">
            {/* Subtle glow bg */}
            <div className="absolute inset-0 grid-bg opacity-30" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 blur-3xl rounded-full" style={{ background: "rgba(245,158,11,0.06)" }} />

            <div className="relative flex items-end justify-center gap-4">
              {/* 2nd place */}
              <PodiumPillar p={top3[1]} rank={2} cfg={rankConfig[2]} height="h-24" />
              {/* 1st place */}
              <PodiumPillar p={top3[0]} rank={1} cfg={rankConfig[1]} height="h-32" featured />
              {/* 3rd place */}
              <PodiumPillar p={top3[2]} rank={3} cfg={rankConfig[3]} height="h-20" />
            </div>
          </div>
        </div>
      )}

      {/* ── My Position ── */}
      {myEntry && (
        <div className="mx-4 mb-5 rounded-2xl p-4 border"
          style={{ background: "linear-gradient(135deg, rgba(0,200,255,0.06), rgba(124,58,237,0.06))", borderColor: "rgba(0,200,255,0.2)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-display font-black text-sm text-foreground shrink-0"
              style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              <span className="font-display font-black text-lg" style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                #{myEntry.rank}
              </span>
            </div>
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">Your Position</div>
              <div className="font-display font-black text-base text-foreground">{myEntry.team || "Your Team"}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">Score</div>
              <div className="font-display font-black text-xl" style={{ color: "var(--primary)" }}>
                {myEntry.points.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Full Rankings ── */}
      <div className="px-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ background: "var(--gradient-primary)" }} />
          <h3 className="font-display font-black text-base text-foreground">Top Rankings</h3>
        </div>

        {leaderboard.length === 0 ? (
          <div className="py-16 text-center bg-card rounded-3xl border border-border">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold text-muted-foreground">No rankings yet. Play matches to climb!</p>
          </div>
        ) : (
          <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-card">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border bg-secondary/30 text-[9px] uppercase tracking-widest text-muted-foreground font-black">
              <div className="col-span-2 text-center">Rank</div>
              <div className="col-span-8">Player / Team</div>
              <div className="col-span-2 text-right" style={{ color: "var(--primary)" }}>Pts</div>
            </div>

            <div>
              {leaderboard.map((p: any, i: number) => {
                const isMe = user && p.user_id === user.id;
                return (
                  <motion.div
                    key={p.user_id || i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.4) }}
                    className={`grid grid-cols-12 gap-2 px-4 py-3.5 border-b border-border last:border-0 items-center transition-colors ${
                      isMe ? "bg-primary/5" : "hover:bg-secondary/30"
                    }`}
                  >
                    {/* Rank */}
                    <div className="col-span-2 flex justify-center">
                      {p.rank <= 3 ? (
                        <span className="text-lg">{rankConfig[p.rank].medal}</span>
                      ) : (
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                          isMe ? "text-white" : "bg-secondary text-muted-foreground"
                        }`} style={isMe ? { background: "var(--gradient-primary)" } : {}}>
                          {p.rank}
                        </span>
                      )}
                    </div>

                    {/* Player */}
                    <div className="col-span-8 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl flex items-center justify-center font-display font-black text-sm shrink-0"
                        style={{ background: isMe ? "var(--gradient-primary)" : "var(--secondary)", color: isMe ? "white" : "var(--muted-foreground)" }}>
                        {(p.team || "T")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-foreground truncate flex items-center gap-1.5">
                          {p.team || "Unknown Team"}
                          {isMe && <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: "var(--gradient-primary)" }}>YOU</span>}
                          {p.badge === "god" && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                          {p.badge === "elite" && <Zap className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--fire)" }} />}
                        </div>
                      </div>
                    </div>

                    {/* Points */}
                    <div className="col-span-2 text-right">
                      <span className="font-display font-black text-sm" style={{ color: isMe ? "var(--primary)" : "var(--cta)" }}>
                        {p.points.toLocaleString()}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-secondary/30 rounded-2xl text-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
          Squad Tournaments Only • Resets Every Sunday 11:59 PM
        </div>
      </div>
    </div>
  );
}

function PodiumPillar({ p, rank, cfg, height, featured = false }: {
  p: any; rank: number; cfg: any; height: string; featured?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1, duration: 0.4 }}
      className="flex-1 max-w-[110px] flex flex-col items-center"
    >
      {featured && <Crown className="w-5 h-5 text-amber-400 mb-1 animate-float" />}

      {/* Avatar */}
      <div
        className={`${cfg.size} rounded-2xl flex items-center justify-center font-display font-black text-foreground border-2 mb-2 transition-transform`}
        style={{ background: cfg.bg, borderColor: cfg.color, boxShadow: cfg.glow }}
      >
        {(p.team || "T")[0].toUpperCase()}
      </div>

      {/* Name */}
      <div className="text-xs font-black text-foreground truncate w-full text-center mb-1 px-1">{p.team || "Unknown"}</div>
      <div className="text-[10px] font-bold text-muted-foreground mb-2">{p.points.toLocaleString()} pts</div>

      {/* Podium bar */}
      <div
        className={`w-full ${height} rounded-t-2xl flex flex-col items-center justify-start pt-3 border-t-2`}
        style={{ background: cfg.bg, borderColor: cfg.color, boxShadow: `inset 0 4px 20px ${cfg.bg}` }}
      >
        <span className="text-2xl">{cfg.medal}</span>
      </div>
    </motion.div>
  );
}
