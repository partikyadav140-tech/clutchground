import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { getTournaments } from "../../../api";
import { Button } from "@/components/ui/button";
import { Search, Filter, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { JoinBattleDialog } from "@/components/JoinBattleDialog";

export const Route = createFileRoute("/_app/tournaments/")({
  head: () => ({
    meta: [
      { title: "Tournaments — CLUTCHGROUND" },
      { name: "description", content: "Browse and join Free Fire tournaments. Solo, duo, squad. Battle Royale, knockout, league formats." },
    ],
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

const filters = ["All", "Open", "Live", "Upcoming", "Free", "Paid"] as const;

function TournamentsPage() {
  const tournaments = Route.useLoaderData();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [q, setQ] = useState("");

  const filtered = tournaments.filter((t: any) => {
    if (t.status === 'completed') return false;
    if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "Open") return t.status === "open";
    if (filter === "Live") return t.status === "live";
    if (filter === "Upcoming") return t.status === "upcoming";
    if (filter === "Free") return t.entry === 0;
    if (filter === "Paid") return t.entry > 0;
    return true;
  });

  return (
    <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-16">
      <PageHeader title="Tournaments" subtitle="Choose Your Battlefield" />

      <div className="mt-8 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tournaments..."
            className="w-full bg-card border border-border focus:border-primary outline-none pl-10 pr-4 h-11 text-sm clip-notch transition-colors"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-xs font-display uppercase tracking-widest border transition-all whitespace-nowrap ${
                filter === f
                  ? "bg-primary text-primary-foreground border-primary shadow-fire"
                  : "bg-card border-border text-muted-foreground hover:border-primary/60 hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {filtered.map((t: any, i: number) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            className="bg-card-gradient border border-border hover:border-primary/60 transition-all clip-notch overflow-hidden flex flex-col"
          >
            <div 
              className="h-28 relative overflow-hidden bg-cover bg-center"
              style={{ backgroundImage: `url(${POSTERS[t.id % POSTERS.length]})` }}
            >
              <div className="absolute inset-0 grid-bg opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
              {t.status === "live" && (
                <span className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-destructive text-destructive-foreground text-[10px] font-display font-bold uppercase tracking-widest z-10">
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" /> Live
                </span>
              )}
              <span className="absolute bottom-2 left-4 font-display text-xs uppercase tracking-[0.2em] text-white/90 drop-shadow-md z-10">{t.game}</span>
            </div>
            <div className="p-4 flex-1 flex flex-col gap-3">
              <h3 className="font-display text-base font-black tracking-wide text-foreground">{t.title}</h3>
              <div className="flex flex-wrap gap-1.5 text-[10px] uppercase tracking-widest font-bold">
                <span className="px-2 py-0.5 bg-secondary border border-border">{t.mode}</span>
                <span className="px-2 py-0.5 bg-secondary border border-border">{t.format}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><div className="text-muted-foreground text-[10px] uppercase tracking-wider">Prize</div><div className="font-display font-black text-fire-gradient">₹{t.prize.toLocaleString()}</div></div>
                <div><div className="text-muted-foreground text-[10px] uppercase tracking-wider">Entry</div><div className="font-display font-black">{t.entry === 0 ? "FREE" : `₹${t.entry}`}</div></div>
              </div>
              <div className="mt-auto space-y-2">
                <div className="h-1 bg-secondary"><div className="h-full bg-fire-gradient" style={{ width: `${(t.filled / t.slots) * 100}%` }} /></div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex justify-between">
                  <span>{t.filled}/{t.slots}</span><span className="text-primary">{t.startsAt}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button asChild variant="outlineFire" size="sm" className="w-full">
                    <Link to="/tournaments/$id" params={{ id: String(t.id) }}>
                      <Eye className="w-3.5 h-3.5 mr-1" /> View
                    </Link>
                  </Button>
                  {t.filled >= t.slots ? (
                    <Button variant="outlineFire" size="sm" className="w-full" disabled>Full</Button>
                  ) : (
                    <JoinBattleDialog
                      tournamentId={t.id}
                      tournamentTitle={t.title}
                      mode={t.mode as any}
                      entryFee={t.entry}
                      trigger={<Button variant="hero" size="sm" className="w-full">Join</Button>}
                    />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Filter className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p>No tournaments match your filters.</p>
        </div>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <span className="w-8 h-px bg-primary" />
        <span className="text-xs font-display tracking-[0.3em] text-primary uppercase">{subtitle}</span>
      </div>
      <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground">{title}</h1>
    </div>
  );
}
