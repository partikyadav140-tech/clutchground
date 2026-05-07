import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  Trophy,
  Edit3,
  Share2,
  Save,
  Users,
  Crown,
  Trash,
  LogOut,
  Bell,
  User,
  ChevronRight,
  Wallet,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "../../lib/auth-client";
import { useState, useEffect } from "react";
import { confirmDialog } from "@/components/ConfirmDialog";
import {
  getProfile,
  updateProfile,
  getMyTeam,
  saveMyTeam,
  getTeamRequests,
  resolveTeamRequest,
  leaveTeam,
  deleteTeam,
} from "../../api";
import { GodCoin } from "@/components/GodCoin";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "My Profile — Professional Esports Arena" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [formData, setFormData] = useState({ ign: "", uid: "", email: "", phone: "" });

  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [teamData, setTeamData] = useState({
    name: "",
    logo: "",
    members: Array(3).fill({ ign: "", uid: "", role: "player" }),
  });

  const totalBalance = user
    ? ((user as any).deposit_balance || 0) + ((user as any).winning_balance || 0)
    : 0;

  useEffect(() => {
    if (!authLoading && !user) {
      router.navigate({ to: "/login" });
      return;
    }
    if (!user) return;
    async function load() {
      try {
        const p = await (getProfile as any)({ data: user.id });
        setProfile(p);
        setFormData({
          ign: p?.ign || "",
          uid: p?.uid || "",
          email: p?.email || "",
          phone: p?.phone || "",
        });

        const t = await (getMyTeam as any)({ data: user.id });
        if (t) {
          setTeam(t);
          setTeamData({
            name: t.name,
            logo: t.logo || "",
            members: [
              ...t.members,
              ...Array(3 - t.members.length).fill({ ign: "", uid: "", role: "player" }),
            ].slice(0, 3),
          });
        }
        const reqs = await (getTeamRequests as any)({ data: user.id });
        setRequests(reqs);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [user, authLoading, router]);

  const handleSaveProfile = async () => {
    try {
      await (updateProfile as any)({ data: { userId: user.id, ...formData } });
      setProfile({ ...profile, ...formData });
      setIsEditingProfile(false);
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    }
  };

  const handleSaveTeam = async () => {
    try {
      if (!teamData.name) return toast.error("Team Name is required");
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
      setTeam(t);
      setTeamData({
        name: t.name,
        logo: t.logo || "",
        members: [
          ...t.members,
          ...Array(3 - t.members.length).fill({ ign: "", uid: "", role: "player" }),
        ].slice(0, 3),
      });
      setIsEditingTeam(false);
      toast.success("Team saved!");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to save team");
    }
  };

  const handleResolveRequest = async (requestId: number, status: "approved" | "rejected") => {
    try {
      await (resolveTeamRequest as any)({ data: { requestId, status } });
      setRequests(requests.filter((r) => r.id !== requestId));
      if (status === "approved") {
        const t = await (getMyTeam as any)({ data: user.id });
        setTeam(t);
      }
      toast.success(`Request ${status}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to resolve request");
    }
  };

  const handleLeaveTeam = async () => {
    const yes = await confirmDialog({
      title: "Leave Team?",
      description: "Are you sure?",
      confirmText: "Leave",
      isDestructive: true,
    });
    if (!yes) return;
    try {
      await (leaveTeam as any)({ data: { userId: user.id, teamId: team.id } });
      setTeam(null);
      toast.success("You have left the team");
    } catch (err: any) {
      toast.error(err.message || "Failed to leave team");
    }
  };

  const handleDeleteTeam = async () => {
    const yes = await confirmDialog({
      title: "Delete Team?",
      description: "This cannot be undone.",
      confirmText: "Delete",
      isDestructive: true,
    });
    if (!yes) return;
    try {
      await (deleteTeam as any)({ data: { userId: user.id, teamId: team.id } });
      setTeam(null);
      setIsEditingTeam(false);
      toast.success("Team deleted");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete team");
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
            <User className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-black text-foreground">My Profile</h1>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">
            Manage your identity and team
          </p>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-6">
        {/* ─── Profile Card ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-[1.5rem] border border-border shadow-sm p-5 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary/20 to-primary/5" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-24 h-24 rounded-[1rem] bg-gradient-to-br from-primary to-[#d95a00] flex items-center justify-center font-display font-black text-4xl text-white shadow-lg border-4 border-white mt-4 sm:mt-0">
              {profile?.ign ? profile.ign[0].toUpperCase() : user.username[0].toUpperCase()}
            </div>

            <div className="flex-1 text-center sm:text-left mt-2 sm:mt-8 w-full">
              {isEditingProfile ? (
                <div className="space-y-3 mt-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1 text-left">
                      IGN (In-Game Name)
                    </label>
                    <input
                      className="w-full bg-secondary/50 border border-border focus:border-primary outline-none px-4 py-2.5 text-sm rounded-xl font-bold"
                      placeholder="IGN"
                      value={formData.ign}
                      onChange={(e) => setFormData({ ...formData, ign: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1 text-left">
                      Free Fire UID
                    </label>
                    <input
                      className="w-full bg-secondary/50 border border-border focus:border-primary outline-none px-4 py-2.5 text-sm rounded-xl font-mono"
                      placeholder="Free Fire UID"
                      value={formData.uid}
                      onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1 text-left">
                      Email Address
                    </label>
                    <input
                      className="w-full bg-secondary/50 border border-border focus:border-primary outline-none px-4 py-2.5 text-sm rounded-xl"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1 text-left">
                      Phone Number
                    </label>
                    <input
                      className="w-full bg-secondary/50 border border-border focus:border-primary outline-none px-4 py-2.5 text-sm rounded-xl"
                      placeholder="Phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="font-display text-2xl font-black text-foreground">
                      {profile?.ign || user.username}
                    </div>
                    {profile?.ign && (
                      <div className="text-sm text-muted-foreground font-semibold">
                        @{user.username} • IGN: {profile.ign}
                      </div>
                    )}
                    {!profile?.ign && (
                      <div className="text-sm text-muted-foreground font-semibold">
                        @{user.username}
                      </div>
                    )}
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-xs font-mono font-bold text-muted-foreground mt-2 border border-border">
                    UID: {profile?.uid || "Not set"}
                  </div>
                  {(profile?.email || profile?.phone) && (
                    <div className="text-xs font-semibold text-muted-foreground mt-3 space-y-1">
                      {profile.email && (
                        <div className="flex items-center justify-center sm:justify-start gap-1.5">
                          <Shield className="w-3.5 h-3.5" /> {profile.email}
                        </div>
                      )}
                      {profile.phone && (
                        <div className="flex items-center justify-center sm:justify-start gap-1.5">
                          <User className="w-3.5 h-3.5" /> {profile.phone}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {isEditingProfile ? (
              <>
                <Button
                  onClick={handleSaveProfile}
                  className="flex-1 h-12 rounded-xl font-bold bg-primary text-white shadow-primary"
                >
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 h-12 rounded-xl font-bold border-border"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditingProfile(true)}
                  className="flex-1 h-12 rounded-xl font-bold border-border shadow-sm bg-white hover:bg-secondary/20"
                >
                  <Edit3 className="w-4 h-4 mr-2" /> Edit Profile
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      toast.success("Link copied!");
                    }}
                    className="flex-1 sm:flex-none w-12 h-12 p-0 rounded-xl border-border shadow-sm"
                  >
                    <Share2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={logout}
                    className="flex-1 sm:flex-none w-12 h-12 p-0 rounded-xl border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* ─── Wallet Quick Link ─── */}
        <a href="/wallet" className="block">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-gradient-to-r from-primary to-[#d95a00] rounded-2xl p-4 shadow-lg text-white flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <GodCoin className="w-6 h-6 drop-shadow-sm text-white" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-white/80">
                  Wallet Balance
                </div>
                <div className="font-display font-black text-xl">{totalBalance} Coins</div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <ChevronRight className="w-5 h-5" />
            </div>
          </motion.div>
        </a>

        {/* ─── Team Panel ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-[1.5rem] border border-border shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-border/50 flex items-center justify-between bg-secondary/10">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-display font-black text-lg text-foreground">My Squad</h3>
            </div>
            <div className="flex gap-2">
              {team && team.leader_id === user.id && !isEditingTeam && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteTeam}
                  className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive text-xs font-bold rounded-lg"
                >
                  <Trash className="w-4 h-4 mr-1" /> Delete
                </Button>
              )}
              {team && team.leader_id !== user.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLeaveTeam}
                  className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive text-xs font-bold rounded-lg"
                >
                  <LogOut className="w-4 h-4 mr-1" /> Leave
                </Button>
              )}
              {(!team || team.leader_id === user.id) && !isEditingTeam && (
                <Button
                  size="sm"
                  onClick={() => setIsEditingTeam(true)}
                  className="h-8 text-xs font-bold bg-primary text-white rounded-lg px-3 shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1" /> {team ? "Edit Squad" : "Create Squad"}
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
            ) : team ? (
              <div className="space-y-4">
                <div className="font-display text-2xl font-black text-foreground mb-4">
                  {team.name}
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
                            {team.leader?.ign ? team.leader.ign : team.leader?.username}
                          </div>
                          {team.leader?.username && team.leader?.ign && (
                            <div className="text-[10px] text-muted-foreground">
                              @{team.leader.username}
                            </div>
                          )}
                          {team.leader?.uid && (
                            <div className="text-[10px] font-mono text-muted-foreground">
                              UID: {team.leader.uid}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-primary text-white rounded-md shadow-sm">
                        Captain
                      </span>
                    </div>

                    {/* Members */}
                    {team.members.map((m: any, i: number) => (
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

                {/* Join requests */}
                {requests.length > 0 && (
                  <div className="pt-6 mt-4 border-t border-border">
                    <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                      <Bell className="w-4 h-4" /> Pending Requests ({requests.length})
                    </div>
                    <div className="space-y-3">
                      {requests.map((r) => (
                        <div
                          key={r.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white border border-primary/20 shadow-sm gap-4"
                        >
                          <div>
                            <div className="font-bold text-base text-foreground">{r.ign}</div>
                            <div className="text-xs text-muted-foreground font-semibold mt-0.5">
                              UID: <span className="font-mono">{r.uid}</span> · @{r.username}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResolveRequest(r.id, "rejected")}
                              className="flex-1 sm:flex-none h-10 rounded-lg text-xs font-bold border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleResolveRequest(r.id, "approved")}
                              className="flex-1 sm:flex-none h-10 rounded-lg text-xs font-bold bg-primary text-white shadow-sm"
                            >
                              Approve
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 px-4">
                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h3 className="font-display font-black text-xl text-foreground mb-2">
                  No Squad Found
                </h3>
                <p className="text-muted-foreground text-sm font-semibold mb-6 max-w-xs mx-auto">
                  Create a squad to participate in Duo and Squad tournaments.
                </p>
                <Button
                  onClick={() => setIsEditingTeam(true)}
                  className="h-12 px-6 rounded-xl font-bold bg-primary text-white shadow-primary"
                >
                  Create Your Squad
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
