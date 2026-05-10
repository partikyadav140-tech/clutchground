import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { getTournaments } from "../../../api";
import { Button } from "@/components/ui/button";
import { Search, Filter, Trophy, Clock, Users, ChevronRight, Gamepad2, Wallet } from "lucide-react";
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
      transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3), ease: "easeOut" }}
      className="group relative p-[1px] rounded-[2rem] overflow-hidden mt-1 mb-2 w-full"
    >
      {/* Animated Glowing Border */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-blue-500 opacity-40 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="relative h-full bg-[#0a0a0f]/95 backdrop-blur-3xl rounded-[2rem] flex flex-col overflow-hidden shadow-2xl w-full">
        
        {/* Banner Section */}
        <div className="relative h-[180px] sm:h-[200px] w-full overflow-hidden">
          <img src={poster} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out opacity-90" />
          
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
              {t.format}
            </span>
          </div>

          {/* Floating Game Name */}
          <div className="absolute bottom-3 left-5 flex items-center gap-1.5 text-primary text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-glow z-10">
             <Gamepad2 className="w-4 h-4" /> {t.game || "Free Fire"}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 flex flex-col flex-1 relative z-10 -mt-2">
          <h4 className="font-display font-black text-xl sm:text-2xl text-white leading-tight line-clamp-2 drop-shadow-md mb-4">
            {t.title}
          </h4>

          {/* Highlighted Prize & Entry Box */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-white/10 flex flex-col items-center justify-center transition-colors group-hover:bg-white/10">
              <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1.5">Entry</span>
              <span className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                {t.entry === 0 ? "FREE" : <><GodCoin className="w-4 sm:w-5 h-4 sm:h-5 text-primary"/> {t.entry}</>}
              </span>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-primary/30 flex flex-col items-center justify-center relative overflow-hidden shadow-[0_0_20px_rgba(255,0,85,0.1)] group-hover:shadow-[0_0_25px_rgba(255,0,85,0.2)] transition-shadow">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/20 blur-xl rounded-full translate-x-1/2 -translate-y-1/2" />
              <span className="text-[9px] sm:text-[10px] text-primary uppercase font-black tracking-widest mb-1.5 relative z-10">Prize Pool</span>
              <span className="text-sm sm:text-base font-black text-white flex items-center gap-1.5 relative z-10">
                <GodCoin className="w-4 sm:w-5 h-4 sm:h-5 text-amber-400"/> {t.mode === 'Solo' ? t.per_kill_coin || 0 : t.prize}
              </span>
            </div>
          </div>

          <div className="mt-auto">
             <div className="flex justify-between items-end mb-2.5">
                <div className="flex flex-col gap-1">
                   <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Starts In</span>
                   <span className="text-xs sm:text-sm font-bold text-white/90 flex items-center gap-1.5">
                     <Clock className="w-3.5 h-3.5 text-primary" /> {t.startsAt || t.startsat}
                   </span>
                </div>
                <div className="text-right">
                   <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Slots</span>
                   <span className="text-xs sm:text-sm font-black text-white/90">{t.filled} / <span className="text-muted-foreground">{t.slots}</span></span>
                </div>
             </div>

            {/* Premium Progress Bar */}
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-6 border border-white/5 shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-1000 relative ${isFull ? "bg-muted-foreground" : "bg-gradient-to-r from-primary to-purple-500 shadow-[0_0_15px_rgba(255,0,85,0.6)]"}`}
                style={{ width: `${fillPct}%` }}
              >
                {!isFull && fillPct < 100 && <div className="absolute right-0 top-0 bottom-0 w-8 bg-white/40 blur-[4px]" />}
              </div>
            </div>

            <div className="flex gap-3">
              <Link to={`/tournaments/${t.id}` as any} className="flex-1">
                <Button className="w-full rounded-2xl font-black uppercase tracking-widest text-xs sm:text-sm bg-white/5 border border-white/10 text-white hover:bg-white/10 h-12 transition-colors duration-300">
                  Details
                </Button>
              </Link>
              {isFull ? (
                 <Button disabled className="w-32 shrink-0 h-12 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest bg-black/40 text-muted-foreground border border-white/5 backdrop-blur">
                  Full
                </Button>
              ) : (
                <JoinBattleDialog
                  tournamentId={t.id}
                  tournamentTitle={t.title}
                  mode={t.mode as any}
                  entryFee={t.entry}
                  trigger={
                    <Button className="w-32 shrink-0 h-12 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-[1.02] transition-transform duration-300">
                      Join
                    </Button>
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
