import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { getGlobalLeaderboard } from "../../api";
import { PageHeader } from "./tournaments";
import { Crown, Skull } from "lucide-react";

export const Route = createFileRoute("/_app/leaderboard")({
  head: () => ({
    meta: [
      { title: "Global Leaderboard — CLUTCHGROUND" },
      { name: "description", content: "Top Free Fire players ranked by kills, wins, and ELO points." },
    ],
  }),
  loader: async () => await (getGlobalLeaderboard as any)(),
  component: LeaderboardPage,
});

const tabs = ["Global", "Weekly", "Monthly", "Teams"] as const;

function LeaderboardPage() {
  const leaderboard = Route.useLoaderData() as any[];
  const [tab, setTab] = useState<(typeof tabs)[number]>("Global");

  return (
    <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-16">
      <PageHeader title="Leaderboard" subtitle="Hall Of Fame" />

      <div className="mt-8 flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-xs font-display uppercase tracking-widest border transition-all whitespace-nowrap ${
              tab === t
                ? "bg-primary text-primary-foreground border-primary shadow-fire"
                : "bg-card border-border text-muted-foreground hover:border-primary/60 hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-3 text-xs text-muted-foreground"><span className="font-display tracking-widest uppercase">Showing:</span> {tab} rankings · resets {tab === "Weekly" ? "Sunday 11:59 PM" : tab === "Monthly" ? "1st of month" : "season end"}</div>

      {/* Top 3 podium */}
      {leaderboard.length >= 3 ? (
        <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-6 max-w-4xl mx-auto">
          {[leaderboard[1], leaderboard[0], leaderboard[2]].map((p, i) => {
            const podiumPos = [2, 1, 3][i];
            const heights = ["pt-12", "pt-4", "pt-16"];
            return (
              <div key={p.user_id} className={`text-center ${heights[i]}`}>
                <div className={`mx-auto rounded-full bg-fire-gradient grid place-items-center font-display font-black text-primary-foreground shadow-fire ${podiumPos === 1 ? "w-24 h-24 sm:w-32 sm:h-32 text-3xl sm:text-5xl" : "w-20 h-20 sm:w-24 sm:h-24 text-2xl sm:text-3xl"}`}>
                  {p.team ? p.team[0].toUpperCase() : 'T'}
                </div>
                {podiumPos === 1 && <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-gold mx-auto -mt-3 drop-shadow-[0_0_12px_oklch(0.85_0.16_85)]" />}
                <div className="mt-3 font-display font-black text-sm sm:text-lg truncate">{p.team || "Unknown Team"}</div>
                <div className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground truncate">{p.kills || 0} Kills</div>
                <div className={`mt-2 font-display font-black ${podiumPos === 1 ? "text-2xl sm:text-3xl text-fire-gradient" : "text-lg sm:text-xl text-primary"}`}>
                  {p.points.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-10 text-center text-muted-foreground p-10 bg-card-gradient border border-border clip-notch">
          More match data required to build the Hall of Fame.
        </div>
      )}

      {/* Full table */}
      <div className="mt-10 bg-card-gradient border border-border clip-notch overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 sm:px-6 py-3 border-b border-border/60 text-[10px] uppercase tracking-widest text-muted-foreground font-bold bg-secondary/40">
          <div className="col-span-1">Rank</div>
          <div className="col-span-6 sm:col-span-7">Team</div>
          <div className="col-span-2 sm:col-span-2 text-right">K/W</div>
          <div className="col-span-3 sm:col-span-2 text-right">Points</div>
        </div>
        {leaderboard.map((p) => (
          <div key={p.user_id} className="grid grid-cols-12 gap-2 px-4 sm:px-6 py-3.5 border-b border-border/30 last:border-0 hover:bg-primary/5 transition-colors items-center">
            <div className="col-span-1">
              <span className={`font-display font-black text-base sm:text-lg ${p.rank === 1 ? "text-fire-gradient" : p.rank <= 3 ? "text-primary" : "text-muted-foreground"}`}>
                {String(p.rank).padStart(2, "0")}
              </span>
            </div>
            <div className="col-span-6 sm:col-span-7 flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-fire-gradient grid place-items-center font-display font-black text-xs text-primary-foreground shrink-0">
                {p.team ? p.team[0].toUpperCase() : 'T'}
              </div>
              <div className="min-w-0">
                <div className="font-bold truncate flex items-center gap-1.5">
                  {p.team || "Unknown Team"}
                  {p.badge === "god" && <Crown className="w-3.5 h-3.5 text-gold shrink-0" />}
                  {p.badge === "elite" && <Skull className="w-3.5 h-3.5 text-primary shrink-0" />}
                </div>
              </div>
            </div>
            <div className="col-span-2 sm:col-span-2 text-right font-mono text-xs sm:text-sm">
              <div className="text-foreground">{p.kills || 0}</div>
              <div className="text-[10px] text-muted-foreground">{p.wins || 0}W</div>
            </div>
            <div className="col-span-3 sm:col-span-2 text-right font-display font-bold text-primary text-sm sm:text-base">{p.points.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
