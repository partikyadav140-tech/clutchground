import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { PageHeader } from "../tournaments/index";
import { ClipboardList, ArrowLeft, Trophy, Search } from "lucide-react";
import { getTournaments, getRegistrations } from "../../../api";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const Route = createFileRoute("/_app/admin/registrations")({
  head: () => ({ meta: [{ title: "Registrations Admin — GOD ESPORTS" }] }),
  loader: async () => {
    const t = await getTournaments();
    const r = await getRegistrations();
    return { tournaments: t, registrations: r };
  },
  component: AdminRegistrationsPage,
});

function AdminRegistrationsPage() {
  const { tournaments, registrations } = Route.useLoaderData();
  const { user, loading } = useAuth();
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  if (loading) return <div className="p-20 text-center">Loading...</div>;
  if (!user || user.role !== 'admin') {
    return <div className="p-20 text-center text-destructive font-bold">ACCESS DENIED</div>;
  }

  const selectedTournament = tournaments.find((t: any) => t.id === selectedTournamentId);
  const filteredRegistrations = selectedTournamentId 
    ? registrations.filter((r: any) => r.tournament_id === selectedTournamentId)
    : [];

  const displayedTournaments = tournaments.filter((t: any) => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.game.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-16 space-y-8">
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-display uppercase tracking-widest text-muted-foreground hover:text-primary mb-2">
        <ArrowLeft className="w-4 h-4" /> Back to Admin
      </Link>
      <PageHeader title="Tournament Registrations" subtitle="Database" />

      {!selectedTournamentId ? (
        <div className="bg-card-gradient border border-border clip-notch p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="font-display text-sm uppercase tracking-[0.25em] text-primary flex items-center gap-2"><Trophy className="w-4 h-4" /> Select Tournament</h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tournaments..."
                className="w-full bg-secondary border border-border focus:border-primary outline-none pl-9 pr-4 py-2 text-sm transition-colors"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedTournaments.map((t: any) => {
              const regCount = registrations.filter((r: any) => r.tournament_id === t.id).length;
              return (
                <button 
                  key={t.id} 
                  onClick={() => setSelectedTournamentId(t.id)}
                  className="p-4 bg-secondary/60 border border-border hover:border-primary/60 hover:shadow-fire transition-all text-left group flex flex-col"
                >
                  <div className="font-bold text-lg text-primary group-hover:text-fire-gradient transition-colors line-clamp-1">{t.title}</div>
                  <div className="text-xs text-muted-foreground mt-1 mb-4">{t.game} · {t.mode}</div>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold bg-background px-2 py-1 border border-border">
                      {regCount} {regCount === 1 ? 'Registration' : 'Registrations'}
                    </span>
                    <span className="text-xs font-display tracking-wider text-primary group-hover:translate-x-1 transition-transform">VIEW &rarr;</span>
                  </div>
                </button>
              );
            })}
            {displayedTournaments.length === 0 && (
              <div className="col-span-full py-8 text-center text-muted-foreground">
                No tournaments found matching your search.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-foreground">{selectedTournament?.title}</h2>
              <div className="text-sm text-muted-foreground mt-1">Showing all confirmed registrations for this tournament.</div>
            </div>
            <Button variant="outlineFire" onClick={() => setSelectedTournamentId(null)}>
              Change Tournament
            </Button>
          </div>

          <div className="bg-card-gradient border border-border clip-notch p-5">
            <h3 className="font-display text-sm uppercase tracking-[0.25em] text-primary flex items-center gap-2 mb-6">
              <ClipboardList className="w-4 h-4" /> Roster Directory ({filteredRegistrations.length})
            </h3>
            
            {filteredRegistrations.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground bg-secondary/30 border border-border/50">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No teams or players have registered for this tournament yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredRegistrations.map((r: any) => {
                  let players = [];
                  try { players = JSON.parse(r.players_json); } catch(e){}
                  
                  return (
                    <div key={r.id} className="bg-secondary/60 border border-border p-5 clip-notch text-sm transition-colors hover:border-primary/40">
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-4 border-b border-border/60 pb-3 gap-2">
                        <div>
                          <div className="font-display font-black text-xl text-fire-gradient uppercase tracking-wide">
                            {r.team_name || r.username}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Registered by account: <span className="text-primary font-semibold">{r.username}</span>
                          </div>
                        </div>
                        <div className="sm:text-right text-xs">
                          <div className="bg-background px-3 py-1 border border-border inline-block mb-1">
                            {new Date(r.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid sm:grid-cols-12 gap-6">
                        <div className="sm:col-span-4 bg-background/50 p-3 border border-border/50">
                          <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-2">Contact Details</div>
                          <div className="space-y-1">
                            <div className="truncate">Email: <span className="text-foreground font-mono text-xs">{r.contact_email}</span></div>
                            <div className="truncate">Phone: <span className="text-foreground font-mono text-xs">{r.contact_phone}</span></div>
                          </div>
                        </div>
                        
                        <div className="sm:col-span-8 bg-background/50 p-3 border border-border/50">
                          <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-2">Squad Roster ({players.length} Players)</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {players.map((p: any, idx: number) => (
                              <div key={idx} className="flex gap-3 items-center bg-secondary/80 p-2 border border-border/40">
                                <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 font-bold">P{idx+1}</span>
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-xs truncate text-foreground">{p.ign}</div>
                                  <div className="text-[10px] text-muted-foreground font-mono truncate">UID: {p.uid} {p.name && `· ${p.name}`}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
