import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ClipboardList, ArrowLeft, Trophy, Search, ShieldAlert } from "lucide-react";
import { getTournaments, getRegistrations } from "../../../api";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion } from "framer-motion";
import { AdminNavBar } from "@/components/AdminNavBar";
import { SkeletonAdminTable } from "@/components/SkeletonPage";

export const Route = createFileRoute("/_app/admin/registrations")({
  head: () => ({ meta: [{ title: "Registrations Admin — Professional Esports Arena" }] }),
  loader: async () => {
    try {
      const t = await getTournaments();
      const r = await getRegistrations();
      return { tournaments: t, registrations: r };
    } catch {
      return { tournaments: [], registrations: [] };
    }
  },
  component: AdminRegistrationsPage,
});

function AdminRegistrationsPage() {
  const { tournaments, registrations } = Route.useLoaderData();
  const { user, loading } = useAuth();
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  if (loading)
    return (
      <div className="min-h-[60vh] bg-background pb-6">
        <SkeletonAdminTable />
      </div>
    );

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-3xl font-display font-black text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground font-semibold mb-8 max-w-sm">
          You must be logged in as an administrator to view this page.
        </p>
        <Link to="/login">
          <Button className="h-12 px-8 rounded-xl font-bold bg-primary text-white shadow-primary">
            Return to Login
          </Button>
        </Link>
      </div>
    );
  }

  const selectedTournament = tournaments.find((t: any) => t.id === selectedTournamentId);
  const filteredRegistrations = selectedTournamentId
    ? registrations.filter((r: any) => r.tournament_id === selectedTournamentId)
    : [];

  const displayedTournaments = tournaments.filter(
    (t: any) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.game.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* ─── Top Header (Mobile First) ─── */}
      <div className="bg-card rounded-b-[2rem] shadow-[0_4px_24px_oklch(0_0_0/0.04)] pt-6 pb-6 px-4 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-cta mb-4 relative z-10 transition-colors bg-secondary/50 px-3 py-1.5 rounded-full"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-black text-foreground">Registrations</h1>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">Tournament Rosters</p>
        </div>
      </div>

      <div className="px-4 mt-6">
        {!selectedTournamentId ? (
          <>
            <div className="relative mb-6">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tournaments..."
                className="w-full bg-card border border-border focus:border-primary outline-none pl-10 pr-4 h-12 text-sm rounded-xl transition-all shadow-sm font-semibold"
              />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedTournaments.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-card rounded-[1.5rem] border border-border shadow-sm">
                  <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-foreground font-semibold">No tournaments found.</p>
                </div>
              ) : (
                displayedTournaments.map((t: any, i: number) => {
                  const regCount = registrations.filter(
                    (r: any) => r.tournament_id === t.id,
                  ).length;
                  return (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.05 }}
                      key={t.id}
                      onClick={() => {
                        setSelectedTournamentId(t.id);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="bg-card rounded-[1.5rem] border border-border shadow-sm hover:shadow-md transition-all p-5 text-left group flex flex-col h-full active:scale-[0.98]"
                    >
                      <div className="font-display font-black text-lg text-foreground group-hover:text-cta transition-colors line-clamp-1 mb-1.5">
                        {t.title}
                      </div>

                      <div className="flex flex-wrap gap-2 text-[10px] font-bold mb-4">
                        <span className="bg-secondary px-2 py-1 rounded-md text-muted-foreground uppercase tracking-wider">
                          {t.game}
                        </span>
                        <span className="bg-secondary px-2 py-1 rounded-md text-muted-foreground uppercase tracking-wider">
                          {t.mode}
                        </span>
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50">
                        <span className="text-[10px] uppercase tracking-widest text-cta font-bold bg-primary/10 px-2.5 py-1 rounded-full">
                          {regCount} {regCount === 1 ? "Entry" : "Entries"}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-cta group-hover:translate-x-1 transition-all">
                          View &rarr;
                        </span>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="bg-card rounded-[1.5rem] border border-border shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-black text-foreground">
                  {selectedTournament?.title}
                </h2>
                <div className="text-sm text-muted-foreground mt-1 font-semibold">
                  Showing all confirmed registrations.
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedTournamentId(null)}
                className="rounded-xl font-bold border-border bg-secondary/50 text-foreground w-full sm:w-auto"
              >
                Change Event
              </Button>
            </div>

            <div className="space-y-4">
              {filteredRegistrations.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-[1.5rem] border border-border shadow-sm">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-foreground font-semibold">
                    No teams or players registered yet.
                  </p>
                </div>
              ) : (
                filteredRegistrations.map((r: any, i: number) => {
                  let players = [];
                  try {
                    players = JSON.parse(r.players_json);
                  } catch (e) {}

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.05 }}
                      key={r.id}
                      className="bg-card rounded-[1.5rem] border border-border shadow-sm overflow-hidden"
                    >
                      <div className="p-5 border-b border-border/50 bg-secondary/20">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                          <div>
                            <div className="font-display font-black text-xl text-cta uppercase tracking-wide">
                              {selectedTournament?.mode === "Squad"
                                ? r.team_name || r.username
                                : r.username}
                            </div>
                            <div className="text-[11px] font-bold text-muted-foreground mt-1 uppercase tracking-wider">
                              Registered by: <span className="text-foreground">{r.username}</span>
                            </div>
                          </div>
                          <div className="bg-card px-3 py-1.5 rounded-lg border border-border shadow-sm text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {new Date(r.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="p-5 grid sm:grid-cols-12 gap-6">
                        <div className="sm:col-span-4 space-y-4">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 ml-1">
                              Contact Details
                            </div>
                            <div className="bg-secondary/50 rounded-xl p-3 border border-border space-y-2">
                              <div className="truncate text-xs font-semibold text-muted-foreground">
                                Email:{" "}
                                <span className="text-foreground font-mono">{r.contact_email}</span>
                              </div>
                              <div className="truncate text-xs font-semibold text-muted-foreground">
                                Phone:{" "}
                                <span className="text-foreground font-mono">{r.contact_phone}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="sm:col-span-8">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 ml-1">
                            Squad Roster ({players.length} Players)
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {players.map((p: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex gap-3 items-center bg-card rounded-xl p-2.5 border border-border shadow-sm"
                              >
                                <span className="w-8 h-8 rounded-lg bg-primary/10 text-cta flex items-center justify-center font-display font-black text-xs shrink-0">
                                  P{idx + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-sm truncate text-foreground leading-tight">
                                    {p.ign}
                                  </div>
                                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate mt-0.5">
                                    UID: {p.uid} {p.name && `· ${p.name}`}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
      <AdminNavBar />
    </div>
  );
}
