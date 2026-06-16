import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Trophy, RefreshCw, Edit, Check, X } from "lucide-react";
import { getGlobalLeaderboard, updateLeaderboardPoints } from "../../../api";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { motion } from "framer-motion";
import { GodCoin } from "@/components/GodCoin";
import { AdminNavBar } from "@/components/AdminNavBar";

export const Route = createFileRoute("/_app/admin/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard Admin — Professional Esports Arena" }] }),
  loader: async () => {
    try {
      return await getGlobalLeaderboard();
    } catch {
      return [];
    }
  },
  component: AdminLeaderboardPage,
});

function AdminLeaderboardPage() {
  const leaderboard = Route.useLoaderData();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedPoints, setEditedPoints] = useState<string>("");
  const [savingId, setSavingId] = useState<number | null>(null);

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
          <Trophy className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-3xl font-display font-black text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground font-semibold mb-8 max-w-sm">
          You must be logged in as an administrator to view leaderboard controls.
        </p>
        <Link to="/login">
          <Button className="h-12 px-8 rounded-xl font-bold bg-primary text-white shadow-primary">
            Return to Login
          </Button>
        </Link>
      </div>
    );
  }

  const handleStartEdit = (row: any) => {
    setEditingId(row.user_id);
    setEditedPoints(String(row.points || 0));
  };

  const handleSave = async (row: any) => {
    const pointsValue = Number(editedPoints);
    if (Number.isNaN(pointsValue) || pointsValue < 0) {
      toast.error("Enter a valid non-negative points value.");
      return;
    }

    setSavingId(row.user_id);
    try {
      await (updateLeaderboardPoints as any)({
        data: { userId: row.user_id, points: pointsValue },
      });
      toast.success("Leaderboard points updated successfully.");
      setEditingId(null);
      setEditedPoints("");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Unable to update leaderboard points.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="bg-background min-h-screen pb-24">
      <div className="bg-card rounded-b-[2rem] shadow-[0_4px_24px_oklch(0_0_0/0.04)] pt-6 pb-6 px-4 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-3">
            <Trophy className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-black text-foreground">
            Leaderboard Standings
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">
            Live point standings and admin adjustments.
          </p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/admin"
            className="inline-flex items-center justify-center h-12 rounded-xl border border-border text-sm font-bold text-foreground bg-secondary/50 px-4 hover:bg-secondary transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="h-12 rounded-xl border-primary text-cta hover:bg-primary/5"
            onClick={() => router.invalidate()}
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {leaderboard.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-[1.5rem] border border-border shadow-sm">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-foreground font-semibold">
              No leaderboard records found for this week.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {leaderboard.map((row: any) => (
              <motion.div
                key={row.user_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="bg-card rounded-[1.5rem] border border-border shadow-sm overflow-hidden"
              >
                <div className="p-5 sm:p-6 grid gap-3 sm:grid-cols-[auto_1fr_auto] items-center">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-3xl flex items-center justify-center ${row.badge === "god" ? "bg-amber-100 text-amber-700" : row.badge === "elite" ? "bg-slate-100 text-slate-700" : "bg-secondary text-muted-foreground"}`}
                    >
                      <span className="font-display font-black">#{row.rank}</span>
                    </div>
                    <div>
                      <p className="font-black text-foreground">{row.ign}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">
                        {row.team}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3 sm:items-center text-sm text-muted-foreground">
                    <div className="rounded-2xl bg-secondary/50 p-3">
                      <p className="text-[10px] uppercase tracking-widest font-bold">Wins</p>
                      <p className="font-black text-foreground text-base">{row.wins || 0}</p>
                    </div>
                    <div className="rounded-2xl bg-secondary/50 p-3">
                      <p className="text-[10px] uppercase tracking-widest font-bold">Kills</p>
                      <p className="font-black text-foreground text-base">{row.kills || 0}</p>
                    </div>
                    <div className="rounded-2xl bg-secondary/50 p-3">
                      <p className="text-[10px] uppercase tracking-widest font-bold">Points</p>
                      <p className="font-black text-foreground text-base flex items-center gap-1">
                        <GodCoin className="w-4 h-4" /> {row.points || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end">
                    {editingId === row.user_id ? (
                      <div className="grid gap-2 w-full sm:w-48">
                        <input
                          type="number"
                          min="0"
                          value={editedPoints}
                          onChange={(e) => setEditedPoints(e.target.value)}
                          className="w-full bg-secondary/50 border border-border focus:border-primary outline-none px-4 h-12 text-sm rounded-xl"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="w-full rounded-xl bg-primary text-white"
                            onClick={() => handleSave(row)}
                            disabled={savingId === row.user_id}
                          >
                            <Check className="w-4 h-4 mr-1" /> Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-xl"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="w-4 h-4 mr-1" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl h-12 w-full sm:w-auto"
                        onClick={() => handleStartEdit(row)}
                      >
                        <Edit className="w-4 h-4 mr-2" /> Adjust Points
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <AdminNavBar />
    </div>
  );
}
