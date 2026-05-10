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
  const isFull = t.filled >= t.slots;

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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
      className="group relative pt-2"
    >
      <div className="bg-[#be008c] rounded-2xl p-3 pb-0 flex flex-col relative border border-[#d6009f] shadow-[0_4px_20px_rgba(190,0,140,0.4)] overflow-visible w-full">
        
        {/* Banner Image */}
        <div className="relative w-full h-[120px] sm:h-[160px] rounded-xl overflow-hidden">
          <img src={poster} className="w-full h-full object-cover" />
          
          {/* Top Right Prize Pill */}
          <div className="absolute top-2 right-2 bg-[#0e1015]/90 backdrop-blur rounded-lg px-2.5 py-1 flex items-center gap-1.5 border border-white/5 shadow-lg">
            <GodCoin className="w-4 h-4 text-blue-500" />
            <span className="text-white font-bold text-xs">{t.prize || 0}</span>
          </div>

          {/* Live Badge */}
          {t.status === "live" && (
            <div className="absolute top-2 left-2 bg-red-500/90 text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-[0_0_10px_rgba(239,68,68,0.8)]">
              Live
            </div>
          )}
        </div>

        {/* Overlapping Thumbnail & Game Name */}
        <div className="flex justify-between items-end mt-[-28px] px-1 relative z-10 h-16">
          <div className="w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] rounded-xl overflow-hidden border-[3px] border-[#be008c] shadow-lg bg-[#1a1b26]">
             <img src={poster} className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center gap-1.5 text-white font-medium text-[11px] sm:text-xs pb-1 bg-[#be008c]/80 px-2 sm:px-3 py-0.5 rounded-full backdrop-blur-sm">
             <Gamepad2 className="w-3.5 h-3.5" /> {t.game || "Free Fire Max"}
          </div>
        </div>

        {/* Title & Organizer */}
        <div className="px-1 mt-2">
           <h4 className="font-bold text-white text-lg sm:text-xl leading-tight line-clamp-1 drop-shadow-sm">{t.title}</h4>
           <div className="flex items-center gap-2 mt-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white flex items-center justify-center text-[8px] text-black font-black uppercase overflow-hidden">
                <img src="/logo.svg" className="w-full h-full object-contain p-0.5 opacity-50" />
              </div>
              <span className="text-white text-[13px] sm:text-sm font-medium">{t.hosted_by || "God Esports"}</span>
           </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 px-1 mt-3 mb-5 text-white text-[12px] sm:text-[13px] font-medium">
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
        <div className="absolute -bottom-4 left-3 right-3 h-[42px] sm:h-[46px] flex rounded-xl overflow-hidden shadow-[0_8px_16px_rgba(0,0,0,0.3)]">
          {/* Left part */}
          <div className="bg-white flex-1 flex items-center pl-3 sm:pl-4">
            <span className="text-black text-[11px] sm:text-xs font-semibold">
              Reg. closes <span className="text-red-500 ml-0.5">{getDaysLeft()}</span>
            </span>
          </div>
          {/* Right part (Blue Slanted) */}
          {isFull ? (
            <div 
              className="bg-gray-500 w-[130px] sm:w-[150px] h-full flex items-center justify-center text-white text-[13px] sm:text-sm font-bold opacity-80" 
              style={{ clipPath: "polygon(15px 0, 100% 0, 100% 100%, 0 100%)", marginLeft: "-10px" }}
            >
              <span className="ml-2">Full</span>
            </div>
          ) : (
            <Link to={`/tournaments/${t.id}` as any} className="block">
              <div 
                className="bg-[#3091f2] w-[130px] sm:w-[150px] h-full flex items-center justify-center text-white text-[13px] sm:text-sm font-bold cursor-pointer hover:bg-[#257dd4] transition-colors" 
                style={{ clipPath: "polygon(15px 0, 100% 0, 100% 100%, 0 100%)", marginLeft: "-10px" }}
              >
                <span className="ml-2">Register Now</span>
              </div>
            </Link>
          )}
        </div>
      </div>
      
      {/* Spacer to account for the overlapping button */}
      <div className="h-6" />
    </motion.div>
  );
}
