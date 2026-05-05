import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { getTournaments } from "../../../api";
import { Button } from "@/components/ui/button";
import { Search, Filter, Eye, Trophy, Crosshair, Zap, Users, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { JoinBattleDialog } from "@/components/JoinBattleDialog";
import { GodCoin } from "@/components/GodCoin";

export const Route = createFileRoute("/_app/tournaments/")({
  head: () => ({
    meta: [{ title: "Tournaments — Professional Esports Arena" }],
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
    if (t.status === "completed") return false;
    if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "Solo") return t.mode === "Solo";
    if (filter === "Duo") return t.mode === "Duo";
    if (filter === "Squad") return t.mode === "Squad";
    if (filter === "Free") return t.entry === 0;
    return true;
  });

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* ─── Top Header (Mobile First) ─── */}
      <div className="bg-white rounded-b-[2rem] shadow-[0_4px_24px_oklch(0_0_0/0.04)] pt-6 pb-6 px-4 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-3">
            <Trophy className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-black text-foreground">Arena Battles</h1>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">
            Find your match. Secure the bag.
          </p>
        </div>

        {/* Search */}
        <div className="relative mt-6 z-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tournaments..."
            className="w-full bg-secondary/50 border border-border/80 focus:border-primary focus:bg-white outline-none pl-12 pr-4 h-14 text-sm font-semibold rounded-[1rem] transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="px-4 mt-6">
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4 snap-x">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`snap-center px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-full border transition-all whitespace-nowrap ${
                filter === f
                  ? "bg-primary text-white border-primary shadow-[0_4px_12px_oklch(0.65_0.22_45/0.3)]"
                  : "bg-white border-border text-muted-foreground hover:border-primary/40 active:bg-secondary/60"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="mt-4 flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 mb-4">
          <span>{filtered.length} Matches Found</span>
          <div className="h-px bg-border flex-1 ml-4" />
        </div>

        {/* Cards list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((t: any, i: number) => (
            <TournamentCard key={t.id} t={t} i={i} />
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-border mt-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mb-3">
              <Filter className="w-6 h-6" />
            </div>
            <p className="text-foreground font-display font-black text-lg">No matches found</p>
            <p className="text-sm text-muted-foreground mt-1 text-center px-4">
              Try adjusting your search or filters to find more tournaments.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setFilter("All");
                setQ("");
              }}
              className="mt-6 rounded-full font-bold"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function TournamentCard({ t, i }: { t: any; i: number }) {
  const poster = POSTERS[t.id % POSTERS.length];
  const fillPct = Math.min(100, (t.filled / t.slots) * 100);
  const isFull = t.filled >= t.slots;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
      className="rounded-[1.25rem] bg-white border border-border shadow-[0_8px_24px_oklch(0_0_0/0.04)] overflow-hidden flex flex-col active:scale-[0.99] transition-transform"
    >
      <div className="relative h-40 w-full overflow-hidden">
        <img src={poster} alt={t.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute top-3 left-3 flex gap-2">
          {t.status === "live" && (
            <span className="px-2 py-0.5 rounded bg-red-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
            </span>
          )}
          {t.entry === 0 && (
            <span className="px-2 py-0.5 rounded bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-sm">
              FREE
            </span>
          )}
        </div>

        {isFull && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="text-xs font-display font-black text-muted-foreground bg-white px-4 py-1.5 rounded-full border border-border shadow-sm">
              SLOTS FULL
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 relative">
        <div className="absolute right-4 -top-6 bg-white rounded-xl shadow-md border border-border px-3 py-1.5 flex flex-col items-center">
          <span className="text-[9px] font-bold uppercase text-muted-foreground">Entry</span>
          <span className="font-display font-black text-primary text-sm leading-none mt-0.5 flex items-center gap-1">
            {t.entry === 0 ? (
              "FREE"
            ) : (
              <>
                <GodCoin className="w-3.5 h-3.5" /> {t.entry}
              </>
            )}
          </span>
        </div>

        <div className="flex justify-between items-start gap-2 mb-2 pr-16">
          <h4 className="font-display font-black text-base sm:text-lg leading-tight line-clamp-2">
            {t.title}
          </h4>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4">
          <div className="flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-primary" /> <GodCoin className="w-3.5 h-3.5" />{" "}
            {t.prize}
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {t.format}
          </div>
          <div className="flex items-center gap-1">
            <Crosshair className="w-3.5 h-3.5" /> {t.mode}
          </div>
        </div>

        <div className="mt-auto">
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1.5">
            <span>
              {t.filled}/{t.slots} Joined
            </span>
            <span className="text-primary">{t.startsAt}</span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all ${isFull ? "bg-muted-foreground" : "bg-primary"}`}
              style={{ width: `${fillPct}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link to="/tournaments/$id" params={{ id: String(t.id) }} className="w-full">
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl font-bold text-xs bg-white border-border shadow-sm"
              >
                Details
              </Button>
            </Link>
            {isFull ? (
              <Button
                disabled
                className="w-full h-11 rounded-xl font-bold text-xs bg-muted text-muted-foreground"
              >
                Full
              </Button>
            ) : (
              <JoinBattleDialog
                tournamentId={t.id}
                tournamentTitle={t.title}
                mode={t.mode as any}
                entryFee={t.entry}
                trigger={
                  <Button className="w-full h-11 rounded-xl font-bold text-xs bg-primary text-white shadow-primary">
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

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="bg-white rounded-b-[2rem] shadow-[0_4px_24px_oklch(0_0_0/0.04)] pt-6 pb-6 px-4 relative overflow-hidden z-10 mb-6">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center text-center">
        <h1 className="font-display text-3xl font-black text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1 font-semibold">{subtitle}</p>
      </div>
    </div>
  );
}
