import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Users,
  Edit3,
  Save,
  Trash,
  LogOut,
  MessageSquare,
  UserPlus,
  AlertCircle,
  Check,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  getMyTeam,
  saveMyTeam,
  leaveTeam,
  deleteTeam,
  uploadImage,
  getMyTeamRequest,
} from "../../api";
import { useAuth } from "../../lib/auth-client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { confirmDialog } from "@/components/ConfirmDialog";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/my-team")({
  head: () => ({ meta: [{ title: "My Squad — CLUTCHGROUND" }] }),
  component: MyTeamPage,
});

function MyTeamPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [myTeam, setMyTeam] = useState<any>(null);
  const [myTeamRequest, setMyTeamRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [showAcceptedBanner, setShowAcceptedBanner] = useState(false);
  const [teamData, setTeamData] = useState({
    name: "",
    logo: "",
    members: [...Array(3).fill({ ign: "", uid: "", role: "player" }), { ign: "", uid: "", role: "substitute" }],
  });

  const refreshMyTeam = useCallback(async () => {
    if (!user) return;
    try {
      const t = await (getMyTeam as any)({ data: user.id });
      if (t) {
        setMyTeam(t);
        setMyTeamRequest(null);
        const filledMembers = [...t.members];
        while (filledMembers.length < 4) {
          filledMembers.push({
            ign: "",
            uid: "",
            role: filledMembers.length === 3 ? "substitute" : "player",
          });
        }
        setTeamData({
          name: t.name,
          logo: t.logo || "",
          members: filledMembers.slice(0, 4),
        });
        const ackKey = `acknowledged_approved_team_${t.id}`;
        if (localStorage.getItem(ackKey) !== "true" && t.leader_id !== user.id) {
          setShowAcceptedBanner(true);
        }
      } else {
        setMyTeam(null);
        setMyTeamRequest(null);
        setTeamData({
          name: "",
          logo: "",
          members: [...Array(3).fill({ ign: "", uid: "", role: "player" }), { ign: "", uid: "", role: "substitute" }],
        });
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
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.navigate({ to: "/login" });
      return;
    }
    if (!user) return;
    refreshMyTeam();
  }, [user, authLoading, router, refreshMyTeam]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading("Uploading logo...");
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const img = new Image();
        img.src = event.target?.result as string;
        await new Promise((res) => {
          img.onload = res;
        });
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 256;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        const result = await (uploadImage as any)({ data: { base64: dataUrl, folder: "team-logos" } });
        setTeamData((prev) => ({ ...prev, logo: result.url }));
        toast.success("Logo uploaded!", { id: toastId });
      } catch (err: any) {
        toast.error(err.message || "Failed to upload logo", { id: toastId });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSaveTeam = async () => {
    try {
      if (!teamData.name) return toast.error("Squad Name is required");
      const validMembers = teamData.members
        .filter((m) => m.ign && m.uid)
        .map((m, idx) => ({ ...m, role: idx === 3 ? "substitute" : "player" }));

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
      const filledMembers = [...t.members];
      while (filledMembers.length < 4) {
        filledMembers.push({
          ign: "",
          uid: "",
          role: filledMembers.length === 3 ? "substitute" : "player",
        });
      }
      setTeamData({
        name: t.name,
        logo: t.logo || "",
        members: filledMembers.slice(0, 4),
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

  const handleDismissAcceptedBanner = () => {
    if (myTeam) {
      localStorage.setItem(`acknowledged_approved_team_${myTeam.id}`, "true");
      setShowAcceptedBanner(false);
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
    <div className="min-h-screen bg-background pb-[100px]">
      <div className="px-4 pt-4 pb-6 sticky top-0 z-40 bg-background border-b border-border/50">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
            Team Management
          </p>
          <h1 className="font-display font-black text-3xl text-foreground">
            {myTeam ? myTeam.name : "My Squad"}
          </h1>
        </div>
      </div>

      <div className="px-4 space-y-5">
        {showAcceptedBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-3 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none bg-emerald-500/10" />
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 text-emerald-500">
              <Check className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h4 className="font-display font-black text-xs text-emerald-500 uppercase tracking-widest mb-0.5">
                Request Approved!
              </h4>
              <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                Your request to join <span className="text-emerald-400 font-bold">{myTeam?.name}</span> has been accepted!
              </p>
              <button
                onClick={handleDismissAcceptedBanner}
                className="mt-3 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                Let's Go
              </button>
            </div>
          </motion.div>
        )}

        {isEditingTeam || (!myTeam && !myTeamRequest) ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-border/50 flex items-center gap-3 bg-secondary/10">
              <Users className="w-5 h-5 text-cta" />
              <h3 className="font-display font-black text-lg text-foreground">
                {myTeam ? "Edit Squad" : "Create Your Squad"}
              </h3>
            </div>

            <div className="p-5 space-y-5">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="relative shrink-0 group">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-[#d95a00] flex items-center justify-center font-display font-black text-4xl text-white shadow-lg overflow-hidden">
                    {teamData.logo ? (
                      <img src={teamData.logo} className="w-full h-full object-cover" />
                    ) : (
                      teamData.name ? teamData.name.slice(0, 2).toUpperCase() : "?"
                    )}
                  </div>
                  <label className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-primary border-2 border-card flex items-center justify-center cursor-pointer shadow-md text-white hover:bg-primary/90 transition-all z-10">
                    <Edit3 className="w-3.5 h-3.5" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
                    Squad Name
                  </label>
                  <input
                    className="w-full bg-secondary border border-border focus:border-primary/60 outline-none px-4 py-3 text-sm font-bold rounded-xl transition-all"
                    value={teamData.name}
                    onChange={(e) => setTeamData({ ...teamData, name: e.target.value })}
                    placeholder="Enter squad name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3">
                  Roster (4 Players: 3 Main + 1 Substitute)
                </label>
                <div className="space-y-3">
                  {teamData.members.map((m, i) => (
                    <div
                      key={i}
                      className="flex gap-2 items-center p-3 rounded-xl border border-border/50 bg-secondary/20"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-cta shrink-0">
                        {i === 3 ? "SUB" : `P${i + 1}`}
                      </div>
                      <input
                        className="flex-1 bg-background border border-border focus:border-primary/60 outline-none px-3 py-2 text-xs font-bold rounded-lg transition-all"
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
                        className="w-20 bg-background border border-border focus:border-primary/60 outline-none px-3 py-2 text-xs font-mono rounded-lg transition-all"
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
                              j === i ? { ign: "", uid: "", role: j === 3 ? "substitute" : "player" } : x,
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
                        members: [...Array(3).fill({ ign: "", uid: "", role: "player" }), { ign: "", uid: "", role: "substitute" }],
                      });
                    }
                  }}
                  className="flex-1 h-12 rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveTeam}
                  className="flex-1 h-12 rounded-xl font-black bg-cta-gradient text-cta-foreground shadow-cta border border-cta/50 uppercase tracking-widest text-xs"
                >
                  <Save className="w-4 h-4 mr-2" /> Save
                </Button>
              </div>
            </div>
          </motion.div>
        ) : myTeam ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
            >
              <div className="p-5 border-b border-border/50 bg-secondary/10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 shrink-0 rounded-2xl bg-gradient-to-br from-primary to-[#d95a00] flex items-center justify-center font-display font-black text-3xl text-white shadow-lg overflow-hidden">
                        {myTeam.logo ? (
                          <img src={myTeam.logo} className="w-full h-full object-cover" />
                        ) : (
                          myTeam.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h2 className="font-display font-black text-2xl text-foreground mb-1">
                          {myTeam.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {myTeam.members.length} members
                        </p>
                        {myTeam.leader_id === user.id && (
                          <span className="inline-block mt-2 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-primary/10 text-primary rounded-lg">
                            Captain
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-3">
                    Active Roster
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-white font-bold shrink-0 border border-primary/20">
                          C
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-foreground">{user.username || user.ign || "Captain"}</div>
                          <div className="text-xs text-muted-foreground">Leader</div>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">CAPTAIN</span>
                    </div>
                    {myTeam.members.map((member: any, idx: number) => (
                      <div key={member.uid || idx} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-secondary/10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                            {member.ign?.slice(0, 2).toUpperCase() || `P${idx + 1}`}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-foreground">{member.ign || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">{member.role === "substitute" ? "Substitute" : "Player"}</div>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{member.uid || "UID"}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button onClick={() => setIsEditingTeam(true)} className="flex-1 h-12 rounded-xl font-black bg-cta-gradient text-cta-foreground shadow-cta border border-cta/50 uppercase tracking-widest text-xs">
                    <Edit3 className="w-4 h-4 mr-2" /> Edit Squad
                  </Button>
                  <Button variant="outline" onClick={handleLeaveTeam} className="flex-1 h-12 rounded-xl font-bold">
                    <LogOut className="w-4 h-4 mr-2" /> Leave Squad
                  </Button>
                  {myTeam.leader_id === user.id && (
                    <Button variant="destructive" onClick={handleDeleteTeam} className="flex-1 h-12 rounded-xl font-bold">
                      <Trash className="w-4 h-4 mr-2" /> Delete Squad
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        ) : myTeamRequest ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-border/50 bg-secondary/10 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h3 className="font-display font-black text-lg text-foreground">Pending Request</h3>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                Your request to join a squad is currently pending. We will notify you once it is accepted or declined.
              </p>
              <div className="flex gap-3">
                <Button onClick={() => router.navigate({ to: "/team-requests" })} className="flex-1 h-12 rounded-xl font-bold">
                  View Requests
                </Button>
                <Button variant="outline" onClick={() => router.navigate({ to: "/" })} className="flex-1 h-12 rounded-xl font-bold">
                  Back Home
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-border/50 bg-secondary/10 flex items-center gap-3">
              <Users className="w-5 h-5 text-cta" />
              <h3 className="font-display font-black text-lg text-foreground">Create Your Squad</h3>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                You are not part of a squad yet. Start by creating your team or waiting for an invite.
              </p>
              <div className="flex gap-3">
                <Button onClick={() => setIsEditingTeam(true)} className="flex-1 h-12 rounded-xl font-black bg-cta-gradient text-cta-foreground shadow-cta border border-cta/50 uppercase tracking-widest text-xs">
                  Create Squad
                </Button>
                <Button variant="outline" onClick={() => router.navigate({ to: "/team-invite" })} className="flex-1 h-12 rounded-xl font-bold">
                  Team Invites
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
