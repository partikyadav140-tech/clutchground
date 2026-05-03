import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { PageHeader } from "../tournaments/index";
import { Trophy, ArrowLeft, Plus, Edit, Trash, ListChecks, Download } from "lucide-react";
import { getTournaments, addTournament, deleteTournament, updateTournament, toggleHeroTournament, getTournamentResults, saveTournamentResults, rescheduleTournament, deleteAllTournaments } from "../../../api";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { confirmDialog } from "@/components/ConfirmDialog";

export const Route = createFileRoute("/_app/admin/tournaments")({
  head: () => ({ meta: [{ title: "Tournaments Admin — CLUTCHGROUND" }] }),
  loader: async () => await getTournaments(),
  component: AdminTournamentsPage,
});

function AdminTournamentsPage() {
  const tournaments = Route.useLoaderData();
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const [editingT, setEditingT] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  
  const [resultsTId, setResultsTId] = useState<any>(null);
  const [resultsData, setResultsData] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [isEditingResults, setIsEditingResults] = useState(false);

  const openResults = async (t: any) => {
    setResultsTId(t);
    setLoadingResults(true);
    try {
      const data = await (getTournamentResults as any)({ data: t.id });
      setResultsData(data || []);
      setIsEditingResults(t.status !== 'completed'); // Default to view if completed
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoadingResults(false);
  };

  const handleSaveResults = async () => {
    try {
      await (saveTournamentResults as any)({ data: { tournamentId: resultsTId.id, results: resultsData } });
      toast.success("Results saved and notifications sent!");
      setResultsTId(null);
      router.invalidate();
    } catch (err: any) {
      toast.error("Failed to save results: " + err.message);
    }
  };

  const downloadResultsExcel = () => {
    if (!resultsData || resultsData.length === 0) return;
    const headers = ["Rank", "Team / Player", "Kills", "Match Position", "Points"];
    const sortedData = [...resultsData].sort((a, b) => {
      if (b.points !== a.points) return (b.points || 0) - (a.points || 0);
      return (b.kills || 0) - (a.kills || 0);
    });
    
    const rows = sortedData.map((r: any, i: number) => [
      i + 1,
      `"${(r.team_name || r.username).replace(/"/g, '""')}"`,
      r.kills || 0,
      r.position || '-',
      r.points || 0
    ]);
    const csvContent = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${resultsTId.title.replace(/\s+/g, '_')}_Standings.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  
  const [formData, setFormData] = useState({
    title: "", game: "Free Fire", mode: "Squad", format: "Battle Royale",
    entry: 0, prize: 0, slots: 0, filled: 0, startsAt: "", status: "open", banner: "from-orange-600 to-red-700",
    room_id: "", room_pass: ""
  });

  if (loading) return <div className="p-20 text-center">Loading...</div>;
  if (!user || user.role !== 'admin') {
    return <div className="p-20 text-center text-destructive font-bold">ACCESS DENIED</div>;
  }

  const handleSaveTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingT) {
        await (updateTournament as any)({ data: { ...formData, id: editingT.id } });
        toast.success("Tournament updated!");
      } else {
        await (addTournament as any)({ data: formData });
        toast.success("Tournament added!");
      }
      setShowForm(false);
      setEditingT(null);
      router.invalidate();
    } catch (err: any) {
      toast.error("Failed: " + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    const yes = await confirmDialog({
      title: "Delete Tournament?",
      description: "Are you sure you want to delete this tournament?",
      confirmText: "Delete",
      isDestructive: true
    });
    if (yes) {
      try {
        await (deleteTournament as any)({ data: id });
        toast.success("Tournament deleted!");
        router.invalidate();
      } catch (err: any) {
        toast.error("Failed to delete.");
      }
    }
  };

  const handleDeleteAll = async () => {
    const yes = await confirmDialog({
      title: "Delete ALL Tournaments?",
      description: "CRITICAL WARNING: This will permanently delete ALL tournaments and their associated registrations and results! Are you absolutely sure?",
      confirmText: "DELETE ALL",
      isDestructive: true
    });
    if (yes) {
      try {
        await (deleteAllTournaments as any)({});
        toast.success("All tournaments deleted!");
        router.invalidate();
      } catch (err: any) {
        toast.error("Failed to delete all tournaments.");
      }
    }
  };

  const handleToggleHero = async (id: number) => {
    try {
      await (toggleHeroTournament as any)({ data: id });
      toast.success("Hero status updated!");
      router.invalidate();
    } catch (err: any) {
      toast.error("Failed to update hero status.");
    }
  };

  const handleReschedule = async (id: number) => {
    const yes = await confirmDialog({
      title: "Reschedule Match?",
      description: "Are you sure you want to reschedule this match? This will reset all points/kills and set it to upcoming.",
      confirmText: "Reschedule"
    });
    if (yes) {
      try {
        await (rescheduleTournament as any)({ data: id });
        toast.success("Tournament rescheduled!");
        router.invalidate();
      } catch (err: any) {
        toast.error("Failed to reschedule.");
      }
    }
  };

  const openEdit = (t: any) => {
    setEditingT(t);
    setFormData({ ...t, room_id: t.room_id || "", room_pass: t.room_pass || "" });
    setShowForm(true);
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-16 space-y-8">
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-display uppercase tracking-widest text-muted-foreground hover:text-primary mb-2">
        <ArrowLeft className="w-4 h-4" /> Back to Admin
      </Link>
      <PageHeader title="Manage Tournaments" subtitle="Database" />

      <div className="bg-card-gradient border border-border clip-notch p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h3 className="font-display text-sm uppercase tracking-[0.25em] text-primary flex items-center gap-2"><Trophy className="w-4 h-4" /> Operations</h3>
          {!showForm && (
            <div className="flex items-center gap-2">
              <Button variant="outlineFire" size="sm" onClick={handleDeleteAll} className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive">
                Delete All
              </Button>
              <Button onClick={() => { setEditingT(null); setFormData({ title: "", game: "Free Fire", mode: "Squad", format: "Battle Royale", entry: 0, prize: 0, slots: 0, filled: 0, startsAt: "", status: "open", banner: "from-orange-600 to-red-700", room_id: "", room_pass: "" }); setShowForm(true); }} className="flex items-center gap-2" variant="hero" size="sm">
                <Plus className="w-4 h-4" /> Create New
              </Button>
            </div>
          )}
        </div>

        {showForm ? (
          <form onSubmit={handleSaveTournament} className="space-y-4 bg-secondary/30 p-6 border border-primary/30 clip-notch">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-display font-bold text-lg text-primary">{editingT ? "Edit" : "Add"} Tournament</h4>
              <button type="button" onClick={() => setShowForm(false)} className="text-xs text-muted-foreground hover:text-white uppercase tracking-widest">Cancel</button>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Input label="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              <Input label="Game" value={formData.game} onChange={e => setFormData({...formData, game: e.target.value})} required />
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-display font-bold text-muted-foreground mb-1">Mode</label>
                <select value={formData.mode} onChange={e => setFormData({...formData, mode: e.target.value})} className="w-full bg-background border border-border px-3 py-2.5 text-sm outline-none focus:border-primary">
                  <option value="Solo">Solo</option>
                  <option value="Duo">Duo</option>
                  <option value="Squad">Squad</option>
                </select>
              </div>
              <Input label="Format" value={formData.format} onChange={e => setFormData({...formData, format: e.target.value})} />
              <Input label="Entry Fee" type="number" value={formData.entry} onChange={e => setFormData({...formData, entry: Number(e.target.value)})} />
              <Input label="Prize" type="number" value={formData.prize} onChange={e => setFormData({...formData, prize: Number(e.target.value)})} />
              <Input label="Slots" type="number" value={formData.slots} onChange={e => setFormData({...formData, slots: Number(e.target.value)})} />
              <Input label="Filled" type="number" value={formData.filled} onChange={e => setFormData({...formData, filled: Number(e.target.value)})} />
              <Input label="Starts At" value={formData.startsAt} onChange={e => setFormData({...formData, startsAt: e.target.value})} required />
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-display font-bold text-muted-foreground mb-1">Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-background border border-border px-3 py-2.5 text-sm outline-none focus:border-primary">
                  <option value="open">Open</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <Input label="Room ID" value={formData.room_id} onChange={e => setFormData({...formData, room_id: e.target.value})} />
              <Input label="Room Password" value={formData.room_pass} onChange={e => setFormData({...formData, room_pass: e.target.value})} />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" variant="hero">{editingT ? "Save Changes" : "Create Tournament"}</Button>
            </div>
          </form>
        ) : (
          <div className="grid gap-3">
            {tournaments.map((t: any) => (
              <div key={t.id} className="p-4 bg-secondary/60 border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:border-primary/50">
                <div className="min-w-0">
                  <div className="font-bold text-lg text-primary flex items-center gap-2">
                    {t.title}
                    {t.is_hero && <span className="bg-fire-gradient text-white text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider">Hero</span>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                    <span><strong className="text-foreground">Game:</strong> {t.game}</span>
                    <span><strong className="text-foreground">Mode:</strong> {t.mode}</span>
                    <span><strong className="text-foreground">Status:</strong> <span className="uppercase">{t.status}</span></span>
                    <span><strong className="text-foreground">Prize:</strong> ₹{t.prize}</span>
                    <span><strong className="text-foreground">Filled:</strong> {t.filled}/{t.slots}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 md:border-l border-border/60 pt-3 md:pt-0 md:pl-4">
                  <Button variant="ghost" size="sm" onClick={() => handleToggleHero(t.id)} className={t.is_hero ? 'text-fire-gradient' : 'text-muted-foreground'}>
                    ★ Hero
                  </Button>
                  {(t.status === 'live' || t.status === 'completed') && (
                    <>
                      <Button variant="outlineFire" size="sm" onClick={() => openResults(t)}>
                        <ListChecks className="w-4 h-4 mr-1" /> Results
                      </Button>
                      <Button variant="outlineFire" size="sm" onClick={() => handleReschedule(t.id)} className="text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/10 hover:text-yellow-400">
                        Reschedule
                      </Button>
                    </>
                  )}
                  <Button variant="outlineFire" size="sm" onClick={() => openEdit(t)}>
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)} className="text-destructive hover:bg-destructive/20 hover:text-destructive">
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results Dialog */}
      <Dialog open={!!resultsTId} onOpenChange={(v) => !v && setResultsTId(null)}>
        <DialogContent className="max-w-2xl bg-card border-primary/40 clip-notch p-6">
          <DialogHeader>
            <div className="flex justify-between items-center pr-4">
              <DialogTitle className="font-display text-xl font-black text-fire-gradient">Enter Results - {resultsTId?.title}</DialogTitle>
              {resultsTId?.status === 'completed' && (
                <Button variant="outlineFire" size="sm" onClick={downloadResultsExcel} className="h-8 text-xs py-0">
                  <Download className="w-3 h-3 mr-2" /> Download Excel
                </Button>
              )}
            </div>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {loadingResults ? (
               <div className="p-10 text-center">Loading teams...</div>
            ) : resultsData.length === 0 ? (
               <div className="p-10 text-center text-muted-foreground">No teams registered for this tournament.</div>
            ) : isEditingResults ? (
              <div className="space-y-2">
                <div className="flex justify-end mb-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingResults(false)} className="text-xs py-0 h-6">View Standings</Button>
                </div>
                <div className="grid grid-cols-12 gap-2 text-[10px] font-display uppercase tracking-widest text-muted-foreground px-2">
                  <div className="col-span-1 text-center">Rank</div>
                  <div className="col-span-5">Team / Player</div>
                  <div className="col-span-2 text-center">Kills</div>
                  <div className="col-span-2 text-center">Position</div>
                  <div className="col-span-2 text-center">Points</div>
                </div>
                {resultsData.map((r, i) => (
                  <div key={r.id} className="grid grid-cols-12 gap-2 items-center bg-secondary/30 p-2 border border-border">
                    <div className="col-span-1 text-center font-bold text-muted-foreground">#{i + 1}</div>
                    <div className="col-span-5 min-w-0">
                      <div className="font-bold text-primary truncate">{r.team_name || r.username}</div>
                    </div>
                    <div className="col-span-2">
                      <input type="number" min="0" className="w-full bg-background border border-border text-center px-1 py-1 text-sm outline-none" value={r.kills || 0} onChange={e => setResultsData(prev => prev.map(x => x.id === r.id ? {...x, kills: Number(e.target.value)} : x))} />
                    </div>
                    <div className="col-span-2">
                      <input type="number" min="0" className="w-full bg-background border border-border text-center px-1 py-1 text-sm outline-none" value={r.position || 0} onChange={e => setResultsData(prev => prev.map(x => x.id === r.id ? {...x, position: Number(e.target.value)} : x))} />
                    </div>
                    <div className="col-span-2 text-center font-bold text-fire-gradient">
                      {r.points || 0}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingResults(true)} className="text-xs py-0 h-6">Edit Results</Button>
                </div>
                <table className="w-full text-sm text-left border border-border">
                  <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-secondary/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 font-display">Rank</th>
                      <th className="px-4 py-3 font-display">Team / Player</th>
                      <th className="px-4 py-3 font-display text-center">Kills</th>
                      <th className="px-4 py-3 font-display text-center">Position</th>
                      <th className="px-4 py-3 font-display text-right text-primary">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultsData.map((r, i) => (
                      <tr key={r.id} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                        <td className="px-4 py-3 font-display font-black text-muted-foreground">#{i + 1}</td>
                        <td className="px-4 py-3 font-bold text-foreground">{r.team_name || r.username}</td>
                        <td className="px-4 py-3 text-center">{r.kills || 0}</td>
                        <td className="px-4 py-3 text-center">{r.position || '-'}</td>
                        <td className="px-4 py-3 text-right font-display font-black text-fire-gradient text-lg">{r.points || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/40">
            <Button variant="ghost" onClick={() => setResultsTId(null)}>Cancel</Button>
            {isEditingResults && <Button variant="hero" onClick={handleSaveResults}>Save Results</Button>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Input({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest font-display font-bold text-muted-foreground mb-1">{label}</label>
      <input {...rest} className="w-full bg-background border border-border px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
    </div>
  );
}
