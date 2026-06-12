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
  ImageOff,
  Copy,
  Clock,
  Filter,
} from "lucide-react";
import { CountdownTimer } from "@/components/CountdownTimer";
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
  uploadImage,
  deleteImage,
} from "../../../api";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { confirmDialog } from "@/components/ConfirmDialog";
import { motion } from "framer-motion";
import { GodCoin } from "@/components/GodCoin";
import { StandingsCard } from "@/components/StandingsCard";
import { ClashSquadResults } from "@/components/tournament/results/ClashSquadResults";
import { LoneWolfResults } from "@/components/tournament/results/LoneWolfResults";

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
  const [completedSubTab, setCompletedSubTab] = useState<"all" | "pending" | "announced">("all");
  const [hostFilter, setHostFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");

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

  // Get unique hosts for filter dropdown
  const uniqueHosts = [...new Set(tournaments.map((t: any) => t.hosted_by).filter(Boolean))] as string[];

  // Sort latest first (by id DESC)
  const sortedTournaments = [...tournaments].sort((a: any, b: any) => b.id - a.id);

  const filteredTournaments = sortedTournaments.filter((t: any) => {
    const matchesMainTab =
      activeTab === "all" ||
      (activeTab === "open"
        ? (t.status === "open" || t.status === "locked")
        : t.status === activeTab);

    if (!matchesMainTab) return false;

    if (activeTab === "completed") {
      if (completedSubTab === "pending") {
        if (t.results_announced) return false;
      }
      if (completedSubTab === "announced") {
        if (!t.results_announced) return false;
      }
    }

    // Host filter
    if (hostFilter && t.hosted_by !== hostFilter) return false;

    // Date filter
    if (dateFilter !== "all") {
      const startDate = new Date(t.startsAt || t.startsat || "");
      const now = new Date();
      if (dateFilter === "today") {
        if (startDate.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 86400000);
        if (startDate < weekAgo) return false;
      } else if (dateFilter === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 86400000);
        if (startDate < monthAgo) return false;
      }
    }

    // Search by title, game, tournament code, host
    if (q) {
      const query = q.toLowerCase();
      return (
        t.title.toLowerCase().includes(query) ||
        t.game.toLowerCase().includes(query) ||
        (t.tournament_code || "").toLowerCase().includes(query) ||
        (t.hosted_by || "").toLowerCase().includes(query)
      );
    }

    return true;
  });

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

  const downloadResultsImage = () => {
    if (!resultsData || resultsData.length === 0) return;
    const mode = resultsTId?.mode || "Squad";
    const showPoints = !["solo", "duo"].includes(mode?.toLowerCase() || "");

    const sortedData = [...resultsData].sort((a, b) => {
      if (b.points !== a.points) return (b.points || 0) - (a.points || 0);
      return (b.kills || 0) - (a.kills || 0);
    });

    const SCALE = 2;
    const W = 900;
    const HEADER_H = 160;
    const ROW_H = 56;
    const FOOTER_H = 60;
    const PADDING = 32;
    const H = HEADER_H + sortedData.length * ROW_H + FOOTER_H + PADDING;

    const canvas = document.createElement("canvas");
    canvas.width = W * SCALE;
    canvas.height = H * SCALE;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(SCALE, SCALE);

    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#0f0c1a");
    bg.addColorStop(0.5, "#16102a");
    bg.addColorStop(1, "#0a0a14");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Header gradient bar
    const headerGrad = ctx.createLinearGradient(0, 0, W, 0);
    headerGrad.addColorStop(0, "#ff6b00");
    headerGrad.addColorStop(0.5, "#ff4d6d");
    headerGrad.addColorStop(1, "#7c3aed");
    ctx.fillStyle = headerGrad;
    ctx.fillRect(0, 0, W, 6);

    // Glow under top bar
    const glowGrad = ctx.createLinearGradient(0, 6, 0, 80);
    glowGrad.addColorStop(0, "rgba(255,107,0,0.18)");
    glowGrad.addColorStop(1, "transparent");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 6, W, 74);

    // Logo / Brand
    ctx.font = "bold 13px 'Arial', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.textAlign = "left";
    ctx.fillText("CLUTCHGROUND", PADDING, 36);

    // Trophy icon area (decorative circle)
    ctx.beginPath();
    ctx.arc(W - PADDING - 20, 44, 24, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,107,0,0.15)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,107,0,0.4)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff6b00";
    ctx.fillText("🏆", W - PADDING - 20, 50);

    // Tournament title
    ctx.textAlign = "left";
    ctx.font = "bold 28px 'Arial Black', Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(resultsTId?.title || "Tournament Results", PADDING, 76);

    // Sub-info
    ctx.font = "14px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    const modeLabel = `${mode} • ${resultsTId?.game || "Free Fire"} • Final Standings`;
    ctx.fillText(modeLabel, PADDING, 100);

    // Divider
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(PADDING, 114, W - PADDING * 2, 1);

    // Column config
    const cols = showPoints
      ? [
          { label: "RANK",  x: PADDING,       w: 60,  align: "center" as CanvasTextAlign },
          { label: "SQUAD / PLAYER", x: PADDING + 70, w: 340, align: "left" as CanvasTextAlign },
          { label: "KILLS", x: PADDING + 430, w: 100, align: "center" as CanvasTextAlign },
          { label: "POSITION", x: PADDING + 550, w: 110, align: "center" as CanvasTextAlign },
          { label: "POINTS", x: W - PADDING - 90, w: 90, align: "right" as CanvasTextAlign },
        ]
      : [
          { label: "RANK",  x: PADDING,       w: 60,  align: "center" as CanvasTextAlign },
          { label: "SQUAD / PLAYER", x: PADDING + 70, w: 430, align: "left" as CanvasTextAlign },
          { label: "KILLS", x: PADDING + 530, w: 140, align: "center" as CanvasTextAlign },
          { label: "POSITION", x: W - PADDING - 120, w: 120, align: "center" as CanvasTextAlign },
        ];

    // Column headers
    const tableTop = 126;
    ctx.font = "bold 10px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.letterSpacing = "2px";
    cols.forEach((col) => {
      ctx.textAlign = col.align;
      const tx = col.align === "right" ? col.x + col.w : col.align === "center" ? col.x + col.w / 2 : col.x;
      ctx.fillText(col.label, tx, tableTop);
    });
    ctx.letterSpacing = "0px";

    // Rows
    const rowStart = tableTop + 16;
    sortedData.forEach((r: any, i: number) => {
      const rowY = rowStart + i * ROW_H;
      const isTop3 = i < 3;

      // Row background
      if (i % 2 === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.03)";
        ctx.beginPath();
        ctx.roundRect(PADDING - 8, rowY - 2, W - PADDING * 2 + 16, ROW_H - 4, 10);
        ctx.fill();
      }

      // Top-3 accent left border
      if (isTop3) {
        const rankColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
        ctx.fillStyle = rankColors[i];
        ctx.beginPath();
        ctx.roundRect(PADDING - 8, rowY - 2, 3, ROW_H - 4, 2);
        ctx.fill();
      }

      const cellMidY = rowY + ROW_H / 2 - 4;

      // RANK
      const rankColors3 = ["#FFD700", "#C0C0C0", "#CD7F32"];
      ctx.textAlign = "center";
      if (isTop3) {
        ctx.font = "bold 18px Arial";
        ctx.fillStyle = rankColors3[i];
        const rankEmojis = ["🥇", "🥈", "🥉"];
        ctx.fillText(rankEmojis[i], PADDING + 30, cellMidY + 8);
      } else {
        ctx.font = "bold 15px Arial";
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillText(`#${i + 1}`, PADDING + 30, cellMidY + 6);
      }

      // Squad / Player name
      const name = r.display_name || r.team_name || r.username || "Unknown";
      ctx.textAlign = "left";
      ctx.font = isTop3 ? "bold 15px Arial" : "600 14px Arial";
      ctx.fillStyle = isTop3 ? "#ffffff" : "rgba(255,255,255,0.8)";
      // Truncate long names
      let displayName = name;
      const maxNameW = cols[1].w - 10;
      while (ctx.measureText(displayName).width > maxNameW && displayName.length > 4) {
        displayName = displayName.slice(0, -4) + "...";
      }
      ctx.fillText(displayName, cols[1].x, cellMidY + 6);

      // Kills
      const killsCol = cols[2];
      ctx.textAlign = "center";
      ctx.font = "bold 14px 'Courier New', monospace";
      ctx.fillStyle = "#f97316";
      ctx.fillText(String(r.kills || 0), killsCol.x + killsCol.w / 2, cellMidY + 6);

      // Position
      const posCol = cols[3];
      ctx.textAlign = "center";
      ctx.font = "14px Arial";
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText(r.position ? `#${r.position}` : "—", posCol.x + posCol.w / 2, cellMidY + 6);

      // Points (Squad only)
      if (showPoints) {
        const ptsCol = cols[4];
        const pts = r.points || 0;
        ctx.textAlign = "right";
        ctx.font = "bold 16px Arial";
        ctx.fillStyle = "#a78bfa";
        ctx.fillText(String(pts), ptsCol.x + ptsCol.w, cellMidY + 6);
      }

      // Row divider
      if (i < sortedData.length - 1) {
        ctx.fillStyle = "rgba(255,255,255,0.05)";
        ctx.fillRect(PADDING, rowY + ROW_H - 6, W - PADDING * 2, 1);
      }
    });

    // Footer
    const footerY = rowStart + sortedData.length * ROW_H + 16;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(PADDING, footerY, W - PADDING * 2, 1);
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillText(
      `clutchground.onrender.com  •  Generated ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
      W / 2,
      footerY + 28,
    );

    // Bottom gradient bar
    const bottomGrad = ctx.createLinearGradient(0, 0, W, 0);
    bottomGrad.addColorStop(0, "#7c3aed");
    bottomGrad.addColorStop(0.5, "#ff4d6d");
    bottomGrad.addColorStop(1, "#ff6b00");
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, H - 4, W, 4);

    // Download
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${(resultsTId?.title || "Results").replace(/\s+/g, "_")}_Standings.png`;
    a.click();
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
    tournament_type: "battle_royale",
    entry_fee: 0,
    prize_pool: 0,
    open_slots: 2,
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
                  tournament_type: "battle_royale",
                  entry_fee: 0,
                  prize_pool: 0,
                  open_slots: 2,
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
                    Format
                  </label>
                  <select
                    value={formData.tournament_type}
                    onChange={(e) => {
                      const type = e.target.value;
                      let newMode = "Squad";
                      let newFormat = "Battle Royale";
                      if (type === "clash_squad") {
                        newMode = "Squad";
                        newFormat = "Clash Squad";
                      }
                      if (type === "lone_wolf") {
                        newMode = "Solo";
                        newFormat = "Lone Wolf";
                      }
                      setFormData({ ...formData, tournament_type: type, mode: newMode, format: newFormat });
                    }}
                    className="w-full bg-secondary/50 border border-border focus:border-primary focus:bg-card outline-none px-4 h-12 text-sm rounded-xl transition-all font-bold"
                  >
                    <option value="battle_royale">Battle Royale</option>
                    <option value="clash_squad">Clash Squad</option>
                    <option value="lone_wolf">Lone Wolf</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5 ml-1">
                    Mode
                  </label>
                  <select
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                    disabled={formData.tournament_type !== "battle_royale"}
                    className="w-full bg-secondary/50 border border-border focus:border-primary focus:bg-card outline-none px-4 h-12 text-sm rounded-xl transition-all font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {formData.tournament_type === "battle_royale" && (
                      <>
                        <option value="Solo">Solo</option>
                        <option value="Duo">Duo</option>
                        <option value="Squad">Squad</option>
                      </>
                    )}
                    {formData.tournament_type === "clash_squad" && (
                      <option value="Squad">Squad (4 Players)</option>
                    )}
                    {formData.tournament_type === "lone_wolf" && (
                      <option value="Solo">Solo (1 Player)</option>
                    )}
                  </select>
                </div>
                {formData.tournament_type === "battle_royale" && (
                  <>
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
                  </>
                )}
                {formData.tournament_type === "clash_squad" && (
                  <>
                    <Input
                      label="Entry Fees (Clash Squad)"
                      type="number"
                      value={formData.entry_fee}
                      onChange={(e) => setFormData({ ...formData, entry_fee: Number(e.target.value) })}
                    />
                    <Input
                      label="Prize Pool (Clash Squad)"
                      type="number"
                      value={formData.prize_pool}
                      onChange={(e) => setFormData({ ...formData, prize_pool: Number(e.target.value) })}
                    />
                    <Input
                      label="Total Slots"
                      type="number"
                      value={formData.open_slots}
                      onChange={(e) => setFormData({ ...formData, open_slots: Number(e.target.value) })}
                    />
                  </>
                )}
                {formData.tournament_type === "lone_wolf" && (
                  <>
                    <Input
                      label="Entry Fees (Lone Wolf)"
                      type="number"
                      value={formData.entry_fee}
                      onChange={(e) => setFormData({ ...formData, entry_fee: Number(e.target.value) })}
                    />
                    <Input
                      label="Prize Pool (Lone Wolf)"
                      type="number"
                      value={formData.prize_pool}
                      onChange={(e) => setFormData({ ...formData, prize_pool: Number(e.target.value) })}
                    />
                    <Input
                      label="Total Slots"
                      type="number"
                      value={formData.open_slots}
                      onChange={(e) => setFormData({ ...formData, open_slots: Number(e.target.value) })}
                    />
                  </>
                )}
                {formData.mode === "Solo" && formData.tournament_type === "battle_royale" && (
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
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5 ml-1">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startsAt ? formData.startsAt.slice(0, 16) : ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, startsAt: val ? val + ":00" : "" });
                    }}
                    required
                    className="w-full bg-secondary/50 border border-border focus:border-primary focus:bg-card outline-none px-4 h-12 text-sm rounded-xl transition-all font-bold"
                  />
                </div>
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
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5 ml-1">
                    Event Card Banner
                  </label>
                  <div className="flex gap-3 items-center flex-wrap">
                    <label className="flex items-center justify-center gap-2 h-12 px-4 rounded-xl border border-dashed border-border hover:border-primary/60 bg-secondary/40 cursor-pointer text-xs font-bold text-muted-foreground hover:text-foreground transition-all">
                      <span>Choose Banner Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          const toastId = toast.loading("Processing image...");
                          try {
                            const reader = new FileReader();
                            reader.onload = async (ev) => {
                              const img = new window.Image();
                              img.src = ev.target?.result as string;
                              img.onload = () => {
                                const canvas = document.createElement("canvas");
                                const MAX_WIDTH = 1200;
                                let width = img.width;
                                let height = img.height;
                                if (width > MAX_WIDTH) {
                                  height = Math.round((height * MAX_WIDTH) / width);
                                  width = MAX_WIDTH;
                                }
                                canvas.width = width;
                                canvas.height = height;
                                
                                const context = canvas.getContext("2d");
                                context?.drawImage(img, 0, 0, width, height);
                                const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.75);
                                
                                (uploadImage as any)({ data: { base64: compressedDataUrl, folder: "clutchground/events" } })
                                  .then((res: any) => {
                                    setFormData((prev) => ({ ...prev, banner: res.url }));
                                    toast.success("Event banner uploaded to Cloudinary!", { id: toastId });
                                  })
                                  .catch((err: any) => {
                                    toast.error(err.message || "Failed to upload to Cloudinary", { id: toastId });
                                  });
                              };
                            };
                            reader.readAsDataURL(file);
                          } catch {
                            toast.error("Failed to process image.", { id: toastId });
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {formData.banner && formData.banner.startsWith("http") ? (
                      <div className="flex items-center gap-2">
                        <img src={formData.banner} className="w-16 h-10 object-cover rounded-xl border border-border" />
                        <button
                          type="button"
                          onClick={async () => {
                            const toastId = toast.loading("Removing banner from Cloudinary...");
                            try {
                              await (deleteImage as any)({ data: { url: formData.banner } });
                              toast.success("Banner removed from Cloudinary!", { id: toastId });
                            } catch {
                              toast.dismiss(toastId);
                            }
                            setFormData((prev) => ({ ...prev, banner: "" }));
                          }}
                          className="flex items-center gap-1.5 h-10 px-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 text-[10px] font-bold uppercase tracking-wider transition-all press-effect active:scale-95"
                        >
                          <Trash className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <ImageOff className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">No banner — will use default poster</span>
                      </div>
                    )}
                  </div>
                </div>
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
                  onClick={() => {
                    setActiveTab(tab);
                    if (tab !== "completed") setCompletedSubTab("all");
                  }}
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

            {activeTab === "completed" && (
              <div className="flex bg-secondary/40 p-1 rounded-xl mb-6 max-w-md gap-1">
                {[
                  { id: "all", label: "All Completed" },
                  { id: "pending", label: "Pending Results ⏳" },
                  { id: "announced", label: "Results Announced 🏆" }
                ].map((subTab) => (
                  <button
                    key={subTab.id}
                    onClick={() => setCompletedSubTab(subTab.id as any)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      completedSubTab === subTab.id
                        ? "bg-primary/20 text-foreground shadow-sm font-black"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {subTab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Search + Filters */}
            <div className="space-y-2 mb-5">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by title, code, host..."
                  className="w-full bg-card border border-border focus:border-primary outline-none pl-10 pr-4 h-11 text-sm rounded-xl transition-all shadow-sm font-semibold"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                {/* Host filter */}
                {uniqueHosts.length > 0 && (
                  <select
                    value={hostFilter}
                    onChange={(e) => setHostFilter(e.target.value)}
                    className="shrink-0 bg-card border border-border rounded-xl px-3 h-9 text-xs font-bold text-foreground outline-none"
                  >
                    <option value="">All Hosts</option>
                    {uniqueHosts.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                )}
                {/* Date filter */}
                {["all", "today", "week", "month"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDateFilter(d as any)}
                    className={`shrink-0 px-3 h-9 rounded-xl text-xs font-bold border transition-all ${
                      dateFilter === d
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-card text-muted-foreground border-border"
                    }`}
                  >
                    {d === "all" ? "All dates" : d === "today" ? "Today" : d === "week" ? "This week" : "This month"}
                  </button>
                ))}
              </div>
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
                    transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                    key={t.id}
                    className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden group"
                  >
                    <div className="p-4">
                      <div className="flex flex-col gap-3">
                        <div className="min-w-0 flex-1">
                          {/* Title + Code row */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-display font-black text-base text-foreground truncate">
                                  {t.title}
                                </h3>
                                {t.is_hero && (
                                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                                )}
                              </div>
                              {/* Tournament Code */}
                              {t.tournament_code && (
                                <button
                                  type="button"
                                  onClick={() => { navigator.clipboard.writeText(t.tournament_code); toast.success("Code copied!"); }}
                                  className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md hover:bg-primary/20 transition-colors"
                                >
                                  {t.tournament_code}
                                  <Copy className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                            {/* Countdown */}
                            <div className="shrink-0">
                              <CountdownTimer targetDate={t.startsAt || t.startsat || ""} status={t.status} compact />
                            </div>
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                            <span className="bg-secondary px-2 py-0.5 rounded-md text-muted-foreground uppercase tracking-wider">
                              {t.mode}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                t.tournament_type === "clash_squad"
                                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                  : t.tournament_type === "lone_wolf"
                                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              }`}
                            >
                              {t.tournament_type === "clash_squad" ? "CS" : t.tournament_type === "lone_wolf" ? "LW" : "BR"}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                t.status === "open" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : t.status === "upcoming" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                : t.status === "live" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : t.status === "rescheduled" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                : "bg-secondary text-muted-foreground"
                              }`}
                            >
                              {t.status}
                            </span>
                            <span className="bg-secondary px-2 py-0.5 rounded-md text-muted-foreground">
                              {t.filled}/{t.slots} slots
                            </span>
                            {t.hosted_by && (
                              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                                {t.hosted_by}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="bg-secondary/30 rounded-xl p-3 border border-border/50">
                              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">
                                Prize Pool
                              </div>
                              <div className="font-display font-black text-cta text-base flex items-center gap-1 flex-wrap">
                                {t.tournament_type === "clash_squad" || t.tournament_type === "lone_wolf" ? (
                                  <>
                                    <GodCoin className="w-4 h-4" /> {t.prize_pool || 0}
                                  </>
                                ) : t.mode === "Solo" ? (
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
              <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadResultsImage}
                  className="h-9 rounded-xl font-bold bg-card shadow-sm"
                  disabled={resultsData.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" /> Download Image
                </Button>
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
                {/* Results Display based on Tournament Type */}
                {resultsTId?.tournament_type === "clash_squad" ? (
                  <ClashSquadResults
                    tournamentName={resultsTId?.title}
                    results={resultsData}
                  />
                ) : resultsTId?.tournament_type === "lone_wolf" ? (
                  <LoneWolfResults
                    tournamentName={resultsTId?.title}
                    results={resultsData}
                  />
                ) : (
                  <StandingsCard
                    tournamentName={resultsTId?.title}
                    mode={resultsTId?.mode || "Squad"}
                    results={resultsData}
                  />
                )}
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
