import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { getTournaments, getMyMatches } from "../../../api";
import { useAuth } from "../../../lib/auth-client";
import { Search, Filter, Swords } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { TournamentCard } from "@/components/TournamentCard";
import { SkeletonPage } from "@/components/SkeletonPage";

export const Route = createFileRoute("/_app/tournaments/")({
  head: () => ({ meta: [{ title: "Free Fire Tournaments Arena — CLUTCHGROUND" }] }),
  loader: async () => await getTournaments(),
  component: TournamentsPage,
  pendingComponent: () => (
    <div className="min-h-screen bg-background pb-24">
      <SkeletonPage />
    </div>
  ),
});

const FILTERS = ["All", "Solo", "Duo", "Squad", "Free"] as const;

function TournamentsPage() {
  const tournaments = Route.useLoaderData();
  const { user } = useAuth();
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("All");
  const [q, setQ] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [joinedMatches, setJoinedMatches] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (user) {
      (getMyMatches as any)({ data: user.id })
        .then((matches: any[]) => setJoinedMatches(matches.map((m) => m.id)))
        .catch(console.error);
    }
  }, [user]);

  const filtered = (tournaments as any[]).filter((t) => {
    if (t.status === "completed" || t.status === "locked") return false;
    if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "Solo") return t.mode === "Solo";
    if (filter === "Duo") return t.mode === "Duo";
    if (filter === "Squad") return t.mode === "Squad";
    if (filter === "Free") {
      const entryAmount =
        t.tournament_type === "clash_squad" || t.tournament_type === "lone_wolf"
          ? t.entry_fee || 0
          : t.entry;
      return entryAmount === 0;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-4 page-content">
      <PageHeader
        eyebrow="The Arena"
        eyebrowIcon={Swords}
        title="Tournaments"
        action={
          <button
            onClick={() => setSearchOpen((p) => !p)}
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all press-effect active:scale-90 ${
              searchOpen
                ? "border-primary/60 text-primary bg-primary/10"
                : "bg-card border-border text-muted-foreground"
            }`}
          >
            <Search className="w-4 h-4" />
          </button>
        }
      />

      <div className="pb-3">
        {/* Search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden mt-3"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search tournaments..."
                  className="w-full h-11 bg-card border border-border focus:border-primary/60 rounded-2xl pl-11 pr-4 text-sm font-semibold text-foreground outline-none transition-all"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Filter Chips ── */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="shrink-0 px-5 h-9 rounded-full text-xs font-bold transition-all press-effect active:scale-95 border"
            style={
              filter === f
                ? {
                    background: "var(--gradient-primary)",
                    color: "white",
                    borderColor: "transparent",
                    boxShadow: "0 4px 16px rgba(0,200,255,0.25)",
                  }
                : {
                    background: "var(--card)",
                    borderColor: "var(--border)",
                    color: "var(--muted-foreground)",
                  }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Count divider ── */}
      <div className="mb-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-label">
          {filtered.length} {filtered.length === 1 ? "tournament" : "tournaments"}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* ── Cards Grid ── */}
      <div className="flex flex-col gap-5">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 bg-card rounded-3xl border border-border"
            >
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                <Filter className="w-6 h-6 text-muted-foreground opacity-30" />
              </div>
              <p className="font-display font-black text-base text-foreground mb-1">
                No Active Battles
              </p>
              <p className="text-sm text-muted-foreground mb-5 text-center max-w-[200px]">
                Try adjusting filters or check back soon.
              </p>
              <button
                onClick={() => {
                  setFilter("All");
                  setQ("");
                  setSearchOpen(false);
                }}
                className="h-10 px-8 rounded-full text-xs font-black uppercase tracking-widest border border-border text-foreground bg-secondary press-effect active:scale-95"
              >
                Clear Filters
              </button>
            </motion.div>
          ) : (
            filtered.map((t: any, i: number) => (
              <TournamentCard
                key={t.id}
                t={t}
                index={i}
                isJoined={joinedMatches.includes(t.id)}
                animated
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
