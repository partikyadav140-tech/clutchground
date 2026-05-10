import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { getTournaments } from "../../../api";
import { Button } from "@/components/ui/button";
import { Search, Filter, Trophy, Clock, Users, ChevronRight, Gamepad2 } from "lucide-react";
import { motion } from "framer-motion";
import { JoinBattleDialog } from "@/components/JoinBattleDialog";
import { GodCoin } from "@/components/GodCoin";

export const Route = createFileRoute("/_app/tournaments/")({
  head: () => ({
    meta: [{ title: "Arena — CLUTCHGROUND" }],
  }),
  loader: async () => await getTournaments(),
  component: TournamentsPage,
});

const POSTERS = [
  "/posters/poster1.jpg",
  "/posters/poster2.jpg",
  "/posters/poster3.jpg",
  "/posters/poster4.jpg",
  "/posters/poster5.jpg",
  "/posters/poster6.jpg",
];

const filters = ["All", "Solo", "Duo", "Squad", "Free"] as const;

function TournamentsPage() {
  const tournaments = Route.useLoaderData();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [q, setQ] = useState("");

  const filtered = tournaments.filter((t: any) => {
    if (t.status === "completed" || t.status === "locked") return false;
    if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "Solo") return t.mode === "Solo";
    if (filter === "Duo") return t.mode === "Duo";
    if (filter === "Squad") return t.mode === "Squad";
    if (filter === "Free") return t.entry === 0;
    return true;
  });

  return (
    <div className="bg-background min-h-screen pt-2 pb-safe">
      
      {/* ─── Minimal App Header ─── */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2 text-cta font-bold mb-1">
          <Trophy className="w-5 h-5" /> The Arena
        </div>
        <h1 className="text-2xl font-display font-black text-foreground">Find Your Match</h1>
      </div>

      {/* ─── Search Bar ─── */}
      <div className="px-4 mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search battles..."
            className="w-full bg-card border border-white/5 focus:border-primary outline-none pl-12 pr-4 h-12 text-sm font-bold text-white rounded-[1.25rem] transition-all shadow-lg"
          />
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4 w-[calc(100%+2rem)] ml-0">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 px-5 py-2 text-xs font-black uppercase tracking-widest rounded-full transition-all border ${
                filter === f
                  ? "bg-primary text-white border-primary shadow-[0_0_15px_oklch(0.65_0.22_45/0.4)]"
                  : "bg-card border-white/5 text-muted-foreground hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-4">
        <div className="flex items-center justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
          <span>{filtered.length} BATTLES FOUND</span>
        </div>

        {/* ─── Matches List ─── */}
        <div className="flex flex-col gap-4">
          {filtered.map((t: any, i: number) => (
            <ArenaTournamentCard key={t.id} t={t} i={i} />
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-card rounded-[2rem] border border-white/5 mt-4 shadow-lg text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 text-muted-foreground flex items-center justify-center mb-4">
              <Filter className="w-6 h-6" />
            </div>
            <p className="text-white font-display font-black text-lg mb-2">No active battles</p>
            <p className="text-xs text-muted-foreground max-w-[200px] mb-6">
              Change your filters to discover more events.
            </p>
            <Button
              size="sm"
              onClick={() => { setFilter("All"); setQ(""); }}
              className="rounded-full font-black px-6 border border-white/10"
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ArenaTournamentCard({ t, i }: { t: any; i: number }) {
  const poster = POSTERS[t.id % POSTERS.length];
  const fillPct = Math.min(100, (t.filled / t.slots) * 100);
  const isFull = t.filled >= t.slots;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
      className="group relative rounded-[1.5rem] p-[1px] overflow-hidden"
    >
      {/* Cyberpunk Animated Border Gradient Underlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-blue-500/30 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative h-full bg-card/80 backdrop-blur-xl border border-white/5 rounded-[1.5rem] p-3 flex flex-col gap-3 shadow-card overflow-hidden">
        <div className="flex gap-4">
          {/* Poster */}
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden shrink-0 relative border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <img src={poster} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {t.status === "live" && (
                <span className="bg-red-500/20 border border-red-500/50 text-red-500 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(239,68,68,0.4)]">
                  Live
                </span>
              )}
            </div>
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-[9px] text-white px-2 py-0.5 rounded font-black uppercase border border-white/10 shadow-sm">
              {t.format}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col min-w-0 py-1">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-black text-cta uppercase tracking-widest text-glow">{t.mode}</span>
            </div>
            <h4 className="font-display font-black text-sm sm:text-base text-white line-clamp-2 leading-tight mb-2 drop-shadow-md">
              {t.title}
            </h4>
            
            <div className="text-[10px] text-muted-foreground font-bold flex items-center gap-1.5 mt-auto">
              <Clock className="w-3 h-3 text-cta/50" /> <span className="text-white/80">{t.startsAt || t.startsat}</span>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="bg-black/40 rounded-xl p-2.5 flex items-center justify-between border border-white/5 shadow-inner">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Entry</span>
            <span className="text-xs font-black text-cta flex items-center gap-1 text-glow">
              {t.entry === 0 ? "FREE" : <><GodCoin className="w-3 h-3"/> {t.entry}</>}
            </span>
          </div>
          <div className="bg-black/40 rounded-xl p-2.5 flex items-center justify-between border border-white/5 shadow-inner">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Prize</span>
            <span className="text-xs font-black text-white flex items-center gap-1">
              <GodCoin className="w-3 h-3 text-cta"/> {t.mode === 'Solo' ? t.per_kill_coin || 0 : t.prize}
            </span>
          </div>
        </div>

        {/* Progress & Action */}
        <div className="mt-1">
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1.5 px-1">
            <span>{t.filled}/{t.slots} Joined</span>
            <span className="text-cta/80">{fillPct.toFixed(0)}% Filled</span>
          </div>
          <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden border border-white/5 mb-3 shadow-inner">
            <div 
              className={`h-full rounded-full transition-all duration-1000 relative ${isFull ? "bg-muted-foreground" : "bg-primary-gradient shadow-[0_0_10px_rgba(255,0,85,0.8)]"}`} 
              style={{ width: `${fillPct}%` }} 
            >
              {!isFull && <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/30 blur-[2px]" />}
            </div>
          </div>

          <div className="flex gap-2">
            <Link to={`/tournaments/${t.id}` as any} className="flex-1">
              <Button variant="outline" className="w-full h-10 rounded-xl font-black text-[11px] uppercase tracking-widest bg-transparent border-white/10 text-white hover:bg-white/5">
                Details
              </Button>
            </Link>
            {isFull ? (
               <Button disabled className="w-24 shrink-0 h-10 rounded-xl font-black text-[11px] uppercase tracking-widest bg-white/5 text-muted-foreground border border-white/5">
                Full
              </Button>
            ) : (
              <JoinBattleDialog
                tournamentId={t.id}
                tournamentTitle={t.title}
                mode={t.mode as any}
                entryFee={t.entry}
                trigger={
                  <Button className="w-24 shrink-0 h-10 rounded-xl font-black text-[11px] uppercase tracking-widest bg-cta-gradient text-cta-foreground shadow-cta border border-cta/50 hover:scale-105 transition-transform">
                    Join
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
