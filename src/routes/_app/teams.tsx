import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Users,
  Trophy,
  Calendar,
  Check,
  Search,
  Shield,
  Crown,
  Edit3,
  Save,
  Trash,
  LogOut,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAllTeams,
  requestJoinTeam,
  getProfile,
  getMyTeam,
  saveMyTeam,
  leaveTeam,
  deleteTeam
} from "../../api";
import { useAuth } from "../../lib/auth-client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { confirmDialog } from "@/components/ConfirmDialog";

export const Route = createFileRoute("/_app/teams")({
  head: () => ({ meta: [{ title: "My Squad — CLUTCHGROUND" }] }),
  loader: async () => await getAllTeams(),
  component: TeamsPage,
});

function TeamsPage() {
  const teams = Route.useLoaderData() as any[];
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [q, setQ] = useState("");
  const [myTeam, setMyTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [teamData, setTeamData] = useState({
    name: "",
    logo: "",
    members: Array(3).fill({ ign: "", uid: "", role: "player" }),
  });

  const filteredTeams = teams.filter((t) => {
    if (q && !t.name.toLowerCase().includes(q.toLowerCase())) return false;
    // Don't show user's own team in the available teams list
    if (myTeam && t.id === myTeam.id) return false;
    return true;
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.navigate({ to: "/login" });
      return;
    }
    if (!user) return;

    async function loadMyTeam() {
      try {
        const t = await (getMyTeam as any)({ data: user.id });
        if (t) {
          setMyTeam(t);
          setTeamData({
            name: t.name,
            logo: t.logo || "",
            members: [
              ...t.members,
              ...Array(3 - t.members.length).fill({ ign: "", uid: "", role: "player" }),
            ].slice(0, 3),
          });
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    loadMyTeam();
  }, [user, authLoading, router]);

  const handleOpenJoin = async (tId: number) => {
    if (!user) {
      toast.error("Please login to join a squad.");
      return router.navigate({ to: "/login" });
    }
    const loadingToast = toast.loading("Sending request...");
    try {
      const p = await (getProfile as any)({ data: user.id });
      if (!p?.ign || !p?.uid) {
        toast.dismiss(loadingToast);
        toast.error("Please set your IGN and UID in your profile first.");
        return router.navigate({ to: "/profile" });
      }
      await (requestJoinTeam as any)({
        data: { teamId: tId, userId: user.id, ign: p.ign, uid: p.uid },
      });
      toast.dismiss(loadingToast);
      toast.success("Request sent to the Squad Captain!");
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.message || "Failed to send request.");
    }
  };

  const handleSaveTeam = async () => {
    try {
      if (!teamData.name) return toast.error("Squad Name is required");
      const validMembers = teamData.members.filter((m) => m.ign && m.uid);
      await (saveMyTeam as any)({
        data: {
          userId: user.id,
          teamName: teamData.name,
          logo: teamData.logo,
          members: validMembers,
        },
      });
      const t = await (getMyTeam as any)({ data: user.id });
      setMyTeam(t);
      setTeamData({
        name: t.name,
        logo: t.logo || "",
        members: [
          ...t.members,
          ...Array(3 - t.members.length).fill({ ign: "", uid: "", role: "player" }),
        ].slice(0, 3),
      });
      setIsEditingTeam(false);
      toast.success("Squad saved!");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to save squad");
    }
  };

  const handleLeaveTeam = async () => {
    const yes = await confirmDialog({
      title: "Leave Squad?",
      description: "Are you sure you want to leave this squad?",
      confirmText: "Leave",
      isDestructive: true,
    });
    if (!yes) return;
    try {
      await (leaveTeam as any)({ data: { userId: user.id, teamId: myTeam.id } });
      setMyTeam(null);
      toast.success("You have left the squad");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to leave squad");
    }
  };

  const handleDeleteTeam = async () => {
    const yes = await confirmDialog({
      title: "Delete Squad?",
      description: "This cannot be undone. All members will be removed.",
      confirmText: "Delete",
      isDestructive: true,
    });
    if (!yes) return;
    try {
      await (deleteTeam as any)({ data: { userId: user.id, teamId: myTeam.id } });
      setMyTeam(null);
      setIsEditingTeam(false);
      toast.success("Squad deleted");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete squad");
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* ─── Top Header (Mobile First) ─── */}
      <div className="bg-white rounded-b-[2rem] shadow-[0_4px_24px_oklch(0_0_0/0.04)] pt-6 pb-6 px-4 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-black text-foreground">My Squad</h1>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">
            {myTeam ? "Manage your squad" : "Join forces and conquer"}
          </p>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-6">
        {/* ─── My Team Section ─── */}
        {myTeam ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[1.5rem] border border-border shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-border/50 flex items-center justify-between bg-secondary/10">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="font-display font-black text-lg text-foreground">My Squad</h3>
              </div>
              <div className="flex gap-2">
                {myTeam.leader_id === user.id && !isEditingTeam && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteTeam}
                    className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive text-xs font-bold rounded-lg"
                  >
                    <Trash className="w-4 h-4 mr-1" /> Delete
                  </Button>
                )}
                {myTeam.leader_id !== user.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLeaveTeam}
                    className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive text-xs font-bold rounded-lg"
                  >
                    <LogOut className="w-4 h-4 mr-1" /> Leave
                  </Button>
                )}
                {(myTeam.leader_id === user.id) && !isEditingTeam && (
                  <Button
                    size="sm"
                    onClick={() => setIsEditingTeam(true)}
                    className="h-8 text-xs font-bold bg-primary text-white rounded-lg px-3 shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit Squad
                  </Button>
                )}
              </div>
            </div>

            <div className="p-5">
              {isEditingTeam ? (
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
                      Squad Name
                    </label>
                    <input
                      className="w-full bg-secondary/50 border border-border focus:border-primary outline-none px-4 py-3 text-sm font-bold rounded-xl shadow-sm"
                      value={teamData.name}
                      onChange={(e) => setTeamData({ ...teamData, name: e.target.value })}
                      placeholder="Enter squad name"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
                      Roster (up to 3 teammates + You)
                    </label>
                    <div className="space-y-3">
                      {teamData.members.map((m, i) => (
                        <div
                          key={i}
                          className="flex gap-2 items-center p-3 rounded-xl border border-border/50 bg-secondary/20"
                        >
                          <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                            P{i + 2}
                          </div>
                          <input
                            className="flex-1 bg-white border border-border focus:border-primary outline-none px-3 py-2 text-xs font-bold rounded-lg shadow-sm"
                            placeholder="IGN"
                            value={m.ign}
                            onChange={(e) =>
                              setTeamData({
                                ...teamData,
                                members: teamData.members.map((x, j) =>
                                  j === i ? { ...x, ign: e.target.value } : x,
                                ),
                              })
                            }
                          />
                          <input
                            className="w-24 bg-white border border-border focus:border-primary outline-none px-3 py-2 text-xs font-mono rounded-lg shadow-sm"
                            placeholder="UID"
                            value={m.uid}
                            onChange={(e) =>
                              setTeamData({
                                ...teamData,
                                members: teamData.members.map((x, j) =>
                                  j === i ? { ...x, uid: e.target.value } : x,
                                ),
                              })
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setTeamData({
                                ...teamData,
                                members: teamData.members.map((x, j) =>
                                  j === i ? { ign: "", uid: "", role: "player" } : x,
                                ),
                              })
                            }
                            className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingTeam(false)}
                      className="flex-1 h-12 rounded-xl font-bold border-border shadow-sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveTeam}
                      className="flex-1 h-12 rounded-xl font-bold bg-primary text-white shadow-primary"
                    >
                      <Save className="w-4 h-4 mr-2" /> Save Squad
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="font-display text-2xl font-black text-foreground mb-4">
                    {myTeam.name}
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
                      Active Roster
                    </div>
                    <div className="space-y-2">
                      {/* Captain */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Crown className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-foreground">
                              {myTeam.leader?.ign ? myTeam.leader.ign : myTeam.leader?.username}
                            </div>
                            {myTeam.leader?.username && myTeam.leader?.ign && (
                              <div className="text-[10px] text-muted-foreground">
                                @{myTeam.leader.username}
                              </div>
                            )}
                            {myTeam.leader?.uid && (
                              <div className="text-[10px] font-mono text-muted-foreground">
                                UID: {myTeam.leader.uid}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-primary text-white rounded-md shadow-sm">
                          Captain
                        </span>
                      </div>

                      {/* Members */}
                      {myTeam.members.map((m: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-border shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-black text-xs">
                              P{i + 2}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-foreground">{m.ign || m.username}</div>
                              {m.username && m.ign && (
                                <div className="text-[10px] text-muted-foreground">@{m.username}</div>
                              )}
                              <div className="text-[10px] font-mono text-muted-foreground">
                                UID: {m.uid}
                              </div>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 bg-secondary text-muted-foreground border border-border rounded-md">
                            {m.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* Create Team CTA */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-primary to-[#d95a00] rounded-2xl p-6 shadow-lg text-white"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display text-xl font-black">Create Your Squad</h3>
                <p className="text-orange-100 text-sm">Build a team and dominate tournaments</p>
              </div>
            </div>
            <Button
              className="w-full h-12 rounded-xl font-bold bg-white text-primary shadow-lg hover:bg-orange-50"
              onClick={() => setIsEditingTeam(true)}
            >
              <Plus className="w-5 h-5 mr-2" /> Create Squad
            </Button>
          </motion.div>
        )}

        {/* ─── Available Teams Section ─── */}
        {!myTeam && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-black tracking-wide text-foreground">
                Available Squads
              </h2>
              <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search squads..."
                  className="w-full bg-secondary/50 border border-border focus:border-primary focus:bg-white outline-none pl-10 pr-4 h-9 text-sm rounded-lg transition-all"
                />
              </div>
            </div>

            {filteredTeams.length === 0 ? (
              <div className="bg-white rounded-2xl border border-border shadow-sm p-10 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mb-4 mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <p className="font-display font-bold text-lg text-foreground">No squads available</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {q ? "Try adjusting your search" : "Check back later for new squads"}
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeams.map((t, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    key={t.id}
                    className="bg-white rounded-[1.5rem] border border-border hover:border-primary/40 hover:shadow-lg transition-all p-5 flex flex-col relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-4 font-display font-black text-xl text-secondary group-hover:text-primary/10 transition-colors z-0">
                      #{t.id}
                    </div>

                    <div className="relative z-10 flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-[1rem] bg-gradient-to-br from-primary to-[#d95a00] flex items-center justify-center font-display font-black text-2xl text-white shadow-md">
                        {t.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-display text-xl font-black text-foreground group-hover:text-primary transition-colors">
                          {t.name}
                        </h3>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                          Squad
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="bg-secondary/30 rounded-xl p-3 border border-border/50 flex flex-col items-center">
                        <Users className="w-4 h-4 text-primary mb-1" />
                        <div className="font-display font-black text-lg text-foreground leading-tight">
                          {t.members?.length + 1 || 1}/4
                        </div>
                        <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">
                          Roster
                        </div>
                      </div>
                      <div className="bg-secondary/30 rounded-xl p-3 border border-border/50 flex flex-col items-center">
                        <Calendar className="w-4 h-4 text-primary mb-1" />
                        <div className="font-display font-black text-sm text-foreground mt-0.5 leading-tight">
                          {new Date(t.created_at).toLocaleDateString([], {
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">
                          Founded
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full mt-auto rounded-xl font-bold bg-white shadow-sm border-border hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                      onClick={() => handleOpenJoin(t.id)}
                    >
                      Request to Join
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
