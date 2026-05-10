import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  Trophy,
  ArrowLeft,
  Plus,
  Edit,
  Trash,
  ListChecks,
  Download,
  Search,
  ShieldAlert,
  Star,
  Settings,
} from "lucide-react";
import {
  getTournaments,
  addTournament,
  deleteTournament,
  updateTournament,
  toggleHeroTournament,
  getTournamentResults,
  saveTournamentResults,
  rescheduleTournament,
  deleteAllTournaments,
} from "../../../api";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { confirmDialog } from "@/components/ConfirmDialog";
import { motion } from "framer-motion";
import { GodCoin } from "@/components/GodCoin";

export const Route = createFileRoute("/_app/admin/tournaments")({
  head: () => ({ meta: [{ title: "Tournaments Admin — Professional Esports Arena" }] }),
  loader: async () => await getTournaments(),
  component: AdminTournamentsPage,
});

function AdminTournamentsPage() {
  const initialTournaments = Route.useLoaderData() ?? [];
  const [tournaments, setTournaments] = useState<any[]>(initialTournaments);
  const router = useRouter();
  const { user, loading } = useAuth();

  const [editingT, setEditingT] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const [resultsTId, setResultsTId] = useState<any>(null);
  const [resultsData, setResultsData] = useState<any[]>([]);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [isEditingResults, setIsEditingResults] = useState(false);
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    setTournaments(initialTournaments);
  }, [initialTournaments]);

  const refreshTournaments = async () => {
    try {
      const fresh = await getTournaments();
      setTournaments(fresh);
      return fresh;
    } catch (err: any) {
      console.error("Failed to refresh tournaments:", err);
      return tournaments;
    }
  };

  const isFalsePositiveServerFnError = (err: any) =>
    err?.message?.includes("w.delete is not a function") ||
    err?.message?.includes("delete is not a function") ||
    err?.message?.includes("w.delete");

  const attemptTourneyAction = async (
    action: () => Promise<any>,
    verify: (fresh: any[]) => boolean,
  ) => {
    try {
      await action();
      return true;
    } catch (err: any) {
      if (isFalsePositiveServerFnError(err)) {
        const fresh = await refreshTournaments();
        if (verify(fresh)) {
          return true;
        }
      }
      throw err;
    }
  };

  const filteredTournaments = tournaments.filter(
    (t: any) =>
      (activeTab === "all" || t.status === activeTab) &&
      (t.title.toLowerCase().includes(q.toLowerCase()) ||
       t.game.toLowerCase().includes(q.toLowerCase())),
  );

  const openResults = async (t: any) => {
    setResultsTId(t);
    setResultsData([]);
    setResultsError(null);
    setLoadingResults(true);
    try {
      const data = await (getTournamentResults as any)({ data: t.id });
      setResultsData(data || []);
      setIsEditingResults(t.status !== "completed"); // Default to view if completed
    } catch (err: any) {
      setResultsError(err.message || "Failed to load tournament results.");
      toast.error(err.message || "Failed to load tournament results.");
    }
    setLoadingResults(false);
  };

  const handleSaveResults = async () => {
    try {
      await (saveTournamentResults as any)({
        data: { tournamentId: resultsTId.id, results: resultsData },
      });
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
      r.position || "-",
      r.points || 0,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${resultsTId.title.replace(/\s+/g, "_")}_Standings.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [formData, setFormData] = useState({
    title: "",
    game: "Free Fire",
    mode: "Squad",
    format: "Battle Royale",
    entry: 0,
    prize: 0,
    slots: 0,
    filled: 0,
    startsAt: "",
    status: "open",
    banner: "from-orange-600 to-red-700",
    room_id: "",
    room_pass: "",
    hosted_by: "",
    per_kill_coin: 0,
    first_place_coin: 0,
  });

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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

  const handleSaveTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await attemptTourneyAction(
        async () => {
          if (editingT) {
            await (updateTournament as any)({ data: { ...formData, id: editingT.id } });
          } else {
            await (addTournament as any)({ data: formData });
          }
        },
        (fresh) => {
          if (editingT) {
            return fresh.some((t: any) => t.id === editingT.id && t.title === formData.title);
          }
          return fresh.some(
            (t: any) =>
              t.title === formData.title &&
              t.game === formData.game &&
              t.mode === formData.mode,
          );
        },
      );
      toast.success(editingT ? "Tournament updated!" : "Tournament added!");
      setShowForm(false);
      setEditingT(null);
      await refreshTournaments();
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
      isDestructive: true,
    });
    if (yes) {
      try {
        await attemptTourneyAction(
          async () => {
            await (deleteTournament as any)({ data: id });
          },
          (fresh) => !fresh.some((t: any) => t.id === id),
        );
        toast.success("Tournament deleted!");
        await refreshTournaments();
        router.invalidate();
      } catch (err: any) {
        toast.error("Failed to delete.");
      }
    }
  };

  const handleDeleteAll = async () => {
    const yes = await confirmDialog({
      title: "Delete ALL Tournaments?",
      description:
        "CRITICAL WARNING: This will permanently delete ALL tournaments and their associated registrations and results! Are you absolutely sure?",
      confirmText: "DELETE ALL",
      isDestructive: true,
    });
    if (yes) {
      try {
        await attemptTourneyAction(
          async () => {
            await (deleteAllTournaments as any)({});
          },
          (fresh) => fresh.length === 0,
        );
        toast.success("All tournaments deleted!");
        await refreshTournaments();
        router.invalidate();
      } catch (err: any) {
        toast.error("Failed to delete all tournaments.");
      }
    }
  };

  const handleToggleHero = async (id: number) => {
    try {
      await attemptTourneyAction(
        async () => {
          await (toggleHeroTournament as any)({ data: id });
        },
        (fresh) => fresh.some((t: any) => t.id === id),
      );
      toast.success("Hero status updated!");
      await refreshTournaments();
      router.invalidate();
    } catch (err: any) {
      toast.error("Failed to update hero status.");
    }
  };

  const handleReschedule = async (id: number) => {
    const yes = await confirmDialog({
      title: "Reschedule Match?",
      description:
        "Are you sure you want to reschedule this match? This will reset all points/kills and set it to upcoming.",
      confirmText: "Reschedule",
    });
    if (yes) {
      try {
        await attemptTourneyAction(
          async () => {
            await (rescheduleTournament as any)({ data: id });
          },
          (fresh) => fresh.some((t: any) => t.id === id && t.status === "rescheduled"),
        );
        toast.success("Tournament rescheduled!");
        await refreshTournaments();
        router.invalidate();
      } catch (err: any) {
        toast.error("Failed to reschedule.");
      }
    }
  };

  const openEdit = (t: any) => {
    setEditingT(t);
    setFormData({
      ...t,
      startsAt: t.startsAt || t.startsat || "",
      room_id: t.room_id || "",
      room_pass: t.room_pass || "",
      hosted_by: t.hosted_by || "",
      per_kill_coin: t.per_kill_coin || 0,
      first_place_coin: t.first_place_coin || 0,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-3">
            <Trophy className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-black text-foreground">Tournaments</h1>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">Event Management</p>
        </div>

        {!showForm && (
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button
              className="w-full h-12 rounded-xl font-bold bg-primary text-white shadow-primary"
              onClick={() => {
                setEditingT(null);
                setFormData({
                  title: "",
                  game: "Free Fire",
                  mode: "Squad",
                  format: "Battle Royale",
                  entry: 0,
                  prize: 0,
                  slots: 0,
                  filled: 0,
                  startsAt: "",
                  status: "open",
                  banner: "from-orange-600 to-red-700",
                  room_id: "",
                  room_pass: "",
                  hosted_by: "",
                  per_kill_coin: 0,
                  first_place_coin: 0,
                });
                setShowForm(true);
              }}
            >
              <Plus className="w-5 h-5 mr-2" /> Create New Event
            </Button>
            <Link
              to="/admin/leaderboard"
              className="w-full sm:w-auto h-12 rounded-xl font-bold inline-flex items-center justify-center bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-all"
            >
              <Trophy className="w-4 h-4 mr-2" /> Leaderboard Standings
            </Link>
            <Button
              variant="outline"
              className="w-full sm:w-auto h-12 rounded-xl font-bold border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              onClick={handleDeleteAll}
            >
              <Trash className="w-4 h-4 mr-2" /> Delete All
            </Button>
          </div>
        )}
      </div>

      <div className="px-4 mt-6">
        {showForm ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-[1.5rem] border border-border shadow-md p-5 sm:p-6 mb-8"
          >
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-border/50">
              <h4 className="font-display font-black text-xl text-foreground flex items-center gap-2">
                {editingT ? (
                  <Edit className="w-5 h-5 text-cta" />
                ) : (
                  <Plus className="w-5 h-5 text-cta" />
                )}
                {editingT ? "Edit" : "Create"} Tournament
              </h4>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest bg-secondary/50 px-3 py-1.5 rounded-full transition-colors"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveTournament} className="space-y-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g. Weekly Scrims"
                />
                <Input
                  label="Game"
                  value={formData.game}
                  onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5 ml-1">
                    Mode
                  </label>
                  <select
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                    className="w-full bg-secondary/50 border border-border focus:border-primary focus:bg-card outline-none px-4 h-12 text-sm rounded-xl transition-all font-bold"
                  >
                    <option value="Solo">Solo</option>
                    <option value="Duo">Duo</option>
                    <option value="Squad">Squad</option>
                  </select>
                </div>
                <Input
                  label="Format"
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  placeholder="e.g. Battle Royale"
                />
                <Input
                  label="Entry Fee (Coins)"
                  type="number"
                  value={formData.entry}
                  onChange={(e) => setFormData({ ...formData, entry: Number(e.target.value) })}
                />
                <Input
                  label="Prize Pool (Coins)"
                  type="number"
                  value={formData.prize}
                  onChange={(e) => setFormData({ ...formData, prize: Number(e.target.value) })}
                />
                {formData.mode === "Solo" && (
                  <>
                    <Input
                      label="Coins Per Kill"
                      type="number"
                      value={formData.per_kill_coin}
                      onChange={(e) =>
                        setFormData({ ...formData, per_kill_coin: Number(e.target.value) })
                      }
                    />
                    <Input
                      label="Booyah Points"
                      type="number"
                      value={formData.first_place_coin}
                      onChange={(e) =>
                        setFormData({ ...formData, first_place_coin: Number(e.target.value) })
                      }
                    />
                  </>
                )}
                <Input
                  label="Total Slots"
                  type="number"
                  value={formData.slots}
                  onChange={(e) => setFormData({ ...formData, slots: Number(e.target.value) })}
                />
                <Input
                  label="Filled Slots"
                  type="number"
                  value={formData.filled}
                  onChange={(e) => setFormData({ ...formData, filled: Number(e.target.value) })}
                />
                <Input
                  label="Starts At (ISO Date)"
                  value={formData.startsAt}
                  onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                  required
                  placeholder="YYYY-MM-DD HH:MM:SS"
                />
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5 ml-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-secondary/50 border border-border focus:border-primary focus:bg-card outline-none px-4 h-12 text-sm rounded-xl transition-all font-bold"
                  >
                    <option value="open">Open</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live</option>
                    <option value="completed">Completed</option>
                    <option value="rescheduled">Rescheduled</option>
                  </select>
                </div>
                <Input
                  label="Room ID (Optional)"
                  value={formData.room_id}
                  onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                  placeholder="Will be hidden until 10m before"
                />
                <Input
                  label="Room Password (Optional)"
                  value={formData.room_pass}
                  onChange={(e) => setFormData({ ...formData, room_pass: e.target.value })}
                  placeholder="Will be hidden until 10m before"
                />
                <Input
                  label="Hosted By"
                  value={formData.hosted_by}
                  onChange={(e) => setFormData({ ...formData, hosted_by: e.target.value })}
                  placeholder="Host Name"
                />
              </div>

              <div className="pt-4 mt-4 border-t border-border/50">
                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl font-bold bg-primary text-white shadow-primary"
                >
                  {editingT ? "Save Changes" : "Create Tournament"}
                </Button>
              </div>
            </form>
          </motion.div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex overflow-x-auto gap-2 mb-6 pb-2 hide-scrollbar">
              {["all", "open", "upcoming", "live", "rescheduled", "completed"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? "bg-primary text-white"
                      : "bg-card text-muted-foreground hover:bg-secondary border border-border shadow-sm"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search tournaments..."
                className="w-full bg-card border border-border focus:border-primary outline-none pl-10 pr-4 h-12 text-sm rounded-xl transition-all shadow-sm font-semibold"
              />
            </div>

            <div className="space-y-4">
              {filteredTournaments.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-[1.5rem] border border-border shadow-sm">
                  <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-foreground font-semibold">No tournaments found.</p>
                </div>
              ) : (
                filteredTournaments.map((t: any, i: number) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                    key={t.id}
                    className="bg-card rounded-[1.5rem] border border-border shadow-sm overflow-hidden group"
                  >
                    <div className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="font-display font-black text-lg text-foreground truncate group-hover:text-cta transition-colors">
                              {t.title}
                            </h3>
                            {t.is_hero && (
                              <span className="bg-amber-100 text-amber-600 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold border border-amber-200">
                                Featured
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                            <span className="bg-secondary px-2 py-1 rounded-md text-muted-foreground uppercase tracking-wider">
                              {t.game}
                            </span>
                            <span className="bg-secondary px-2 py-1 rounded-md text-muted-foreground uppercase tracking-wider">
                              {t.mode}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-md uppercase tracking-wider ${
                                t.status === "open"
                                  ? "bg-green-100 text-green-700"
                                  : t.status === "upcoming"
                                    ? "bg-amber-100 text-amber-700"
                                    : t.status === "live"
                                      ? "bg-red-100 text-red-700"
                                      : t.status === "rescheduled"
                                        ? "bg-orange-100 text-orange-700"
                                        : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {t.status}
                            </span>
                            {t.hosted_by && (
                              <span className="bg-primary/10 text-cta px-2 py-1 rounded-md uppercase tracking-wider">
                                Host: {t.hosted_by}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="bg-secondary/30 rounded-xl p-3 border border-border/50">
                              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">
                                Prize Pool
                              </div>
                              <div className="font-display font-black text-cta text-base flex items-center gap-1 flex-wrap">
                                {t.mode === "Solo" ? (
                                  <>
                                    <GodCoin className="w-4 h-4" /> {t.per_kill_coin}/Kill |{" "}
                                    <GodCoin className="w-4 h-4" /> {t.first_place_coin} Booyah Points
                                  </>
                                ) : (
                                  <>
                                    <GodCoin className="w-4 h-4" /> {t.prize}
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="bg-secondary/30 rounded-xl p-3 border border-border/50">
                              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">
                                Slots Filled
                              </div>
                              <div className="font-display font-black text-foreground text-base">
                                {t.filled}/{t.slots}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-row sm:flex-col items-center sm:items-stretch gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-4 w-full sm:w-auto overflow-x-auto hide-scrollbar">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleHero(t.id)}
                            className={`rounded-xl font-bold h-9 whitespace-nowrap ${t.is_hero ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-card text-muted-foreground border-border"}`}
                          >
                            <Star
                              className={`w-4 h-4 mr-1.5 ${t.is_hero ? "fill-amber-500" : ""}`}
                            />{" "}
                            {t.is_hero ? "Unfeature" : "Feature"}
                          </Button>

                          {(t.status === "live" || t.status === "completed") && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openResults(t)}
                                className="rounded-xl font-bold h-9 border-primary/20 text-cta hover:bg-primary/5 whitespace-nowrap"
                              >
                                <ListChecks className="w-4 h-4 mr-1.5" /> Results
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReschedule(t.id)}
                                className="rounded-xl font-bold h-9 text-orange-600 border-orange-200 hover:bg-orange-50 whitespace-nowrap"
                              >
                                Reschedule
                              </Button>
                            </>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(t)}
                            className="rounded-xl font-bold h-9 bg-card border-border text-foreground hover:bg-secondary whitespace-nowrap"
                          >
                            <Settings className="w-4 h-4 mr-1.5" /> Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(t.id)}
                            className="rounded-xl font-bold h-9 text-destructive border-destructive/20 hover:bg-destructive/10 whitespace-nowrap"
                          >
                            <Trash className="w-4 h-4 mr-1.5" /> Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Results Dialog */}
      <Dialog open={!!resultsTId} onOpenChange={(v) => !v && setResultsTId(null)}>
        <DialogContent className="p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <DialogHeader className="p-6 pb-4 border-b border-border bg-secondary/20">
            <div className="flex justify-between items-center pr-4">
              <DialogTitle className="font-display text-xl font-black text-foreground">
                Match Results
                <span className="block text-sm font-semibold text-muted-foreground mt-1 font-sans">
                  {resultsTId?.title}
                </span>
              </DialogTitle>
              {resultsTId?.status === "completed" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadResultsExcel}
                  className="h-9 rounded-xl font-bold bg-card shadow-sm"
                >
                  <Download className="w-4 h-4 mr-2" /> Export
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto bg-background/50">
            {loadingResults ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-muted-foreground font-semibold">Loading team data...</p>
              </div>
            ) : resultsError ? (
              <div className="py-12 text-center text-destructive font-semibold bg-card rounded-xl border border-destructive/20 shadow-sm">
                {resultsError}
              </div>
            ) : resultsData.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground font-semibold bg-card rounded-xl border border-border shadow-sm">
                No confirmed registrations found for this tournament.
              </div>
            ) : isEditingResults ? (
              <div className="space-y-3">
                <div className="flex justify-end mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingResults(false)}
                    className="rounded-lg h-8 text-xs font-bold"
                  >
                    Preview Standings
                  </Button>
                </div>

                {/* Desktop Header */}
                <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 mb-2">
                  <div className="col-span-1 text-center">Rnk</div>
                  <div className="col-span-5">Squad</div>
                  <div className="col-span-2 text-center">Kills</div>
                  <div className="col-span-2 text-center">Pos</div>
                  <div className="col-span-2 text-center">Pts</div>
                </div>

                {resultsData.map((r, i) => (
                  <div
                    key={r.id}
                    className="grid grid-cols-2 sm:grid-cols-12 gap-3 sm:gap-2 items-center bg-card p-4 sm:p-3 rounded-xl border border-border shadow-sm"
                  >
                    <div className="hidden sm:block col-span-1 text-center font-black text-muted-foreground">
                      #{i + 1}
                    </div>

                    <div className="col-span-2 sm:col-span-5 min-w-0">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold sm:hidden mb-1">
                        Squad
                      </div>
                      <div className="font-bold text-foreground truncate">
                        {r.display_name || r.team_name || r.username}
                      </div>
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1 sm:hidden">
                        Kills
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full bg-secondary/50 border border-border rounded-lg text-center px-2 py-1.5 text-sm outline-none focus:border-primary font-bold"
                        value={r.kills || 0}
                        onChange={(e) =>
                          setResultsData((prev) =>
                            prev.map((x) =>
                              x.id === r.id ? { ...x, kills: Number(e.target.value) } : x,
                            ),
                          )
                        }
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1 sm:hidden">
                        Position
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full bg-secondary/50 border border-border rounded-lg text-center px-2 py-1.5 text-sm outline-none focus:border-primary font-bold"
                        value={r.position || 0}
                        onChange={(e) =>
                          setResultsData((prev) =>
                            prev.map((x) =>
                              x.id === r.id ? { ...x, position: Number(e.target.value) } : x,
                            ),
                          )
                        }
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1 sm:hidden">
                        Manual Points
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full bg-secondary/50 border border-border rounded-lg text-center px-2 py-1.5 text-sm outline-none focus:border-primary font-bold"
                        value={typeof r.manualPoints !== "undefined" && r.manualPoints !== null ? r.manualPoints : ""}
                        placeholder="Auto"
                        onChange={(e) =>
                          setResultsData((prev) =>
                            prev.map((x) =>
                              x.id === r.id
                                ? {
                                    ...x,
                                    manualPoints:
                                      e.target.value === "" ? undefined : Number(e.target.value),
                                  }
                                : x,
                            ),
                          )
                        }
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-2 text-center border-t border-border pt-3 mt-1 sm:border-0 sm:pt-0 sm:mt-0">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold sm:hidden mb-0.5">
                        Total Points
                      </div>
                      <div className="font-display font-black text-cta text-lg leading-none">
                        {r.points || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingResults(true)}
                    className="rounded-lg h-8 text-xs font-bold border-primary text-cta hover:bg-primary/5"
                  >
                    <Edit className="w-3 h-3 mr-1" /> Edit Mode
                  </Button>
                </div>
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-secondary/50 border-b border-border">
                        <tr>
                          <th className="px-4 py-3 font-bold text-center">#</th>
                          <th className="px-4 py-3 font-bold">Squad</th>
                          <th className="px-4 py-3 font-bold text-center">Kills</th>
                          <th className="px-4 py-3 font-bold text-center">Pos</th>
                          <th className="px-4 py-3 font-bold text-center">Manual Pts</th>
                          <th className="px-4 py-3 font-bold text-right text-cta">Points</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {resultsData.map((r, i) => (
                          <tr key={r.id} className="hover:bg-secondary/30 transition-colors">
                            <td className="px-4 py-3.5 font-display font-black text-muted-foreground text-center">
                              {i + 1}
                            </td>
                            <td className="px-4 py-3.5 font-bold text-foreground">
                              {r.display_name || r.team_name || r.username}
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono font-semibold">
                              {r.kills || 0}
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono font-semibold">
                              {r.position || "-"}
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono font-semibold">
                              {typeof r.manualPoints !== "undefined" && r.manualPoints !== null
                                ? r.manualPoints
                                : "—"}
                            </td>
                            <td className="px-4 py-3.5 text-right font-display font-black text-cta text-lg">
                              {r.points || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-border bg-card">
            <Button
              variant="outline"
              className="rounded-xl font-bold h-11 px-6 bg-card shadow-sm"
              onClick={() => setResultsTId(null)}
            >
              Cancel
            </Button>
            {isEditingResults && (
              <Button
                className="rounded-xl font-bold h-11 px-6 bg-primary text-white shadow-primary"
                onClick={handleSaveResults}
              >
                Save & Publish Results
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Input({
  label,
  ...rest
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5 ml-1">
        {label}
      </label>
      <input
        {...rest}
        className="w-full bg-secondary/50 border border-border focus:border-primary focus:bg-card outline-none px-4 h-12 text-sm rounded-xl transition-all font-bold placeholder:font-semibold"
      />
    </div>
  );
}
