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
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAllTeams,
  requestJoinTeam,
  getProfile,
  getMyTeam,
  getMyTeamRequest,
  saveMyTeam,
  leaveTeam,
  deleteTeam,
  getTeamRequests,
  resolveTeamRequest,
} from "../../api";
import { useAuth } from "../../lib/auth-client";
import { useState, useEffect, useCallback } from "react";
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
  const [myTeamRequest, setMyTeamRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [teamData, setTeamData] = useState({
    name: "",
    logo: "",
    members: Array(3).fill({ ign: "", uid: "", role: "player" }),
  });
  const [teamRequests, setTeamRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const filteredTeams = teams.filter((t) => {
    if (q && !t.name.toLowerCase().includes(q.toLowerCase())) return false;
    // Don't show user's own team in the available teams list
    if (myTeam && t.id === myTeam.id) return false;
    return true;
  });

  const loadTeamRequests = useCallback(async () => {
    if (!user) return;
    setRequestsLoading(true);
    try {
      const requests = await (getTeamRequests as any)({ data: user.id });
      setTeamRequests(requests);
    } catch (err) {
      console.error(err);
      setTeamRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  }, [user]);

  const refreshMyTeam = useCallback(async () => {
    if (!user) return;
    try {
      const t = await (getMyTeam as any)({ data: user.id });
      if (t) {
        setMyTeam(t);
        setMyTeamRequest(null);
        setTeamData({
          name: t.name,
          logo: t.logo || "",
          members: [
            ...t.members,
            ...Array(3 - t.members.length).fill({ ign: "", uid: "", role: "player" }),
          ].slice(0, 3),
        });
        if (t.leader_id === user.id) {
          await loadTeamRequests();
        } else {
          setTeamRequests([]);
          setRequestsLoading(false);
        }
      } else {
        setMyTeam(null);
        setMyTeamRequest(null);
        setTeamData({
          name: "",
          logo: "",
          members: Array(3).fill({ ign: "", uid: "", role: "player" }),
        });
        setTeamRequests([]);
        setRequestsLoading(false);

        try {
          const request = await (getMyTeamRequest as any)({ data: user.id });
          setMyTeamRequest(request);
        } catch (err) {
          console.error(err);
          setMyTeamRequest(null);
        }
      }
    } catch (err) {
      console.error(err);
      setTeamRequests([]);
      setRequestsLoading(false);
    } finally {
      setLoading(false);
    }
  }, [user, loadTeamRequests]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.navigate({ to: "/login" });
      return;
    }
    if (!user) return;

    refreshMyTeam();
  }, [user, authLoading, router, refreshMyTeam]);

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
      await refreshMyTeam();
      toast.dismiss(loadingToast);
      toast.success("Request sent to the Squad Captain!");
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.message || "Failed to send request.");
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 256;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setTeamData({ ...teamData, logo: dataUrl });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
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

  const handleResolveTeamRequest = async (requestId: number, status: "approved" | "rejected") => {
    const loadingToast = toast.loading(
      status === "approved" ? "Approving request..." : "Rejecting request...",
    );
    try {
      await (resolveTeamRequest as any)({ data: { requestId, status } });
      toast.dismiss(loadingToast);
      toast.success(status === "approved" ? "Request approved." : "Request rejected.");
      await refreshMyTeam();
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.message || "Failed to update request.");
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
    <div className="min-h-screen bg-background pb-[80px]">
      {/* ── App Header ── */}
      <div className="px-4 pt-4 pb-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Squads</p>
        <h1 className="font-display font-black text-2xl text-foreground">
          {myTeam ? myTeam.name : "My Squad"}
        </h1>
      </div>

      <div className="px-4 space-y-5">
        {/* ─── My Team Section / Create Team Form ─── */}
        {isEditingTeam || !myTeam ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-[1.5rem] border border-white/10 shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-border/50 flex items-center justify-between bg-secondary/10">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-cta" />
                <h3 className="font-display font-black text-lg text-foreground">
                  {myTeam ? "Edit Squad" : "Create Your Squad"}
                </h3>
              </div>
            </div>

            <div className="p-5">
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="relative w-24 h-24 shrink-0 rounded-[1rem] bg-gradient-to-br from-primary to-[#d95a00] flex items-center justify-center font-display font-black text-4xl text-white shadow-lg overflow-hidden group">
                    {teamData.logo ? (
                      <img src={teamData.logo} className="w-full h-full object-cover" />
                    ) : (
                      teamData.name ? teamData.name.slice(0, 2).toUpperCase() : "?"
                    )}
                    <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit3 className="w-6 h-6 text-white mb-1" />
                      <span className="text-[9px] font-bold uppercase text-white tracking-widest">Logo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
                      Squad Name
                    </label>
                    <input
                      className="w-full bg-secondary border border-border focus:border-primary/60 outline-none px-4 py-3 text-sm font-bold rounded-2xl transition-all"
                      value={teamData.name}
                      onChange={(e) => setTeamData({ ...teamData, name: e.target.value })}
                      placeholder="Enter squad name"
                    />
                  </div>
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
                        <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-[10px] font-black text-cta">
                          P{i + 2}
                        </div>
                        <input
                          className="flex-1 bg-secondary border border-border focus:border-primary/60 outline-none px-3 py-2 text-xs font-bold rounded-xl transition-all"
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
                          className="w-24 bg-secondary border border-border focus:border-primary/60 outline-none px-3 py-2 text-xs font-mono rounded-xl transition-all"
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
                    onClick={() => {
                      setIsEditingTeam(false);
                      if (!myTeam) {
                        setTeamData({
                          name: "",
                          logo: "",
                          members: Array(3).fill({ ign: "", uid: "", role: "player" }),
                        });
                      }
                    }}
                    className="flex-1 h-12 rounded-xl font-bold border-border shadow-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveTeam}
                    className="flex-1 h-12 rounded-xl font-black bg-cta-gradient text-cta-foreground shadow-cta border border-cta/50 uppercase tracking-widest text-xs"
                  >
                    <Save className="w-4 h-4 mr-2" /> {myTeam ? "Save Squad" : "Create Squad"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {/* My Team View */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-[1.5rem] border border-white/10 shadow-sm overflow-hidden"
            >
              <div className="p-5 border-b border-border/50 flex items-center justify-between bg-secondary/10">
                <div className="flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-cta" />
                  <h3 className="font-display font-black text-lg text-foreground">My Squad</h3>
                </div>
                <div className="flex gap-2">
                  {myTeam.leader_id === user.id && (
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
                  {myTeam.leader_id === user.id && (
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
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                    <div className="w-20 h-20 shrink-0 rounded-[1rem] bg-gradient-to-br from-primary to-[#d95a00] flex items-center justify-center font-display font-black text-3xl text-white shadow-lg overflow-hidden">
                      {myTeam.logo ? (
                        <img src={myTeam.logo} className="w-full h-full object-cover" />
                      ) : (
                        myTeam.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="font-display text-3xl font-black text-foreground flex-1">
                      {myTeam.name}
                      {myTeam.leader_id === user.id && teamRequests.length > 0 && (
                        <span className="block sm:inline-flex items-center gap-2 sm:ml-3 mt-2 sm:mt-0 px-3 py-1 rounded-full bg-primary/10 text-cta text-xs font-semibold uppercase tracking-[0.2em]">
                          <span>{teamRequests.length}</span>
                          Pending Request{teamRequests.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  {myTeam.leader_id === user.id && (
                    <div className="bg-secondary/50 border border-border rounded-[1.5rem] p-5">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div>
                          <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                            Pending Join Requests
                          </div>
                          <div className="font-display font-black text-lg text-foreground">
                            Review requests from players
                          </div>
                        </div>
                        {requestsLoading && (
                          <div className="text-sm text-muted-foreground">Loading requests…</div>
                        )}
                      </div>

                      {teamRequests.length === 0 ? (
                        <div className="rounded-2xl bg-card border border-white/10 p-6 text-sm text-muted-foreground text-center">
                          No pending join requests at the moment.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {teamRequests.map((req) => (
                            <div
                              key={req.id}
                              className="rounded-3xl border border-white/10 bg-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                            >
                              <div className="min-w-0">
                                <div className="font-bold text-sm text-foreground">
                                  {req.ign} {req.username ? `(@${req.username})` : ""}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-mono mt-1">
                                  UID: {req.uid}
                                </div>
                                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-2">
                                  Requested {new Date(req.created_at).toLocaleString()}
                                </div>
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                <Button
                                  onClick={() => handleResolveTeamRequest(req.id, "approved")}
                                  className="h-10 rounded-xl bg-primary text-white font-bold"
                                >
                                  <Check className="w-4 h-4 mr-1" /> Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => handleResolveTeamRequest(req.id, "rejected")}
                                  className="h-10 rounded-xl font-bold border-border"
                                >
                                  <X className="w-4 h-4 mr-1" /> Reject
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
                      Active Roster
                    </div>
                    <div className="space-y-2">
                      {/* Captain */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 border border-primary/20">
                            {myTeam.leader?.avatar_url ? (
                               <img src={myTeam.leader.avatar_url} className="w-full h-full object-cover" />
                            ) : (
                               <Crown className="w-5 h-5 text-cta" />
                            )}
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
                          className="flex items-center justify-between p-3.5 rounded-xl bg-card border border-white/10 shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-black text-xs overflow-hidden shrink-0 border border-white/5">
                              {m.avatar_url ? (
                                 <img src={m.avatar_url} className="w-full h-full object-cover" />
                              ) : (
                                 `P${i + 2}`
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-foreground">
                                {m.ign || m.username}
                              </div>
                              {m.username && m.ign && (
                                <div className="text-[10px] text-muted-foreground">
                                  @{m.username}
                                </div>
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
              </div>
            </motion.div>
          </>
        )}

        {!myTeam && myTeamRequest && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-[1.5rem] border border-white/10 shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-border/50 flex items-center gap-3 bg-secondary/10">
              <Shield className="w-5 h-5 text-cta" />
              <div>
                <h3 className="font-display font-black text-lg text-foreground">
                  Join Request Status
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your latest squad join request is being tracked here.
                </p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-sm text-muted-foreground">
                Squad:{" "}
                <span className="font-bold text-foreground">
                  {myTeamRequest.team_name || "Unknown team"}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Requested on:{" "}
                <span className="font-bold text-foreground">
                  {new Date(myTeamRequest.created_at).toLocaleString()}
                </span>
              </div>
              <div
                className={
                  "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-sm " +
                  (myTeamRequest.status === "approved"
                    ? "bg-primary"
                    : myTeamRequest.status === "rejected"
                    ? "bg-destructive"
                    : "bg-secondary")
                }
              >
                {myTeamRequest.status === "pending"
                  ? "Pending"
                  : myTeamRequest.status === "approved"
                  ? "Approved"
                  : "Rejected"}
              </div>
              {myTeamRequest.status === "rejected" && (
                <p className="text-sm text-muted-foreground">
                  Your join request was rejected. You can try another squad or create your own.
                </p>
              )}
            </div>
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
                  className="w-full bg-secondary border border-border focus:border-primary/60 focus:bg-card outline-none pl-10 pr-4 h-9 text-sm rounded-xl transition-all"
                />
              </div>
            </div>

            {filteredTeams.length === 0 ? (
              <div className="bg-secondary rounded-2xl border border-border p-10 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mb-4 mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <p className="font-display font-bold text-lg text-foreground">
                  No squads available
                </p>
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
                    className="bg-card rounded-[1.5rem] border border-white/10 hover:border-primary/40 hover:shadow-lg transition-all p-5 flex flex-col relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-4 font-display font-black text-xl text-secondary group-hover:text-cta/10 transition-colors z-0">
                      #{t.id}
                    </div>

                    <div className="relative z-10 flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 shrink-0 rounded-[1rem] bg-gradient-to-br from-primary to-[#d95a00] flex items-center justify-center font-display font-black text-2xl text-white shadow-md overflow-hidden">
                        {t.logo ? (
                          <img src={t.logo} className="w-full h-full object-cover" />
                        ) : (
                          t.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 className="font-display text-xl font-black text-foreground group-hover:text-cta transition-colors">
                          {t.name}
                        </h3>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                          Squad
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="bg-secondary/30 rounded-xl p-3 border border-border/50 flex flex-col items-center">
                        <Users className="w-4 h-4 text-cta mb-1" />
                        <div className="font-display font-black text-lg text-foreground leading-tight">
                          {t.members?.length + 1 || 1}/4
                        </div>
                        <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">
                          Roster
                        </div>
                      </div>
                      <div className="bg-secondary/30 rounded-xl p-3 border border-border/50 flex flex-col items-center">
                        <Calendar className="w-4 h-4 text-cta mb-1" />
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
                      className="w-full mt-auto rounded-xl font-bold bg-card shadow-sm border-white/10 hover:border-primary/30 hover:bg-primary/5 hover:text-cta"
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
