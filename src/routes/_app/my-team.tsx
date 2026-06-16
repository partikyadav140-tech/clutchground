import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Edit3, LogOut, Trash, Users } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { TeamInvitesPanel } from "@/components/team/TeamInvitesPanel";
import { TeamRoster } from "@/components/team/TeamRoster";
import { confirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { SkeletonTeam } from "@/components/SkeletonPage";
import {
  cancelTeamRequest,
  deleteTeam,
  getMyTeam,
  getMyTeamInvitations,
  getMyTeamRequest,
  getTeamRequests,
  leaveTeam,
  removeTeamMember,
  saveMyTeam,
  uploadImage,
} from "../../api";
import { useAuth } from "../../lib/auth-client";
import { countRosterSlots, getInitials, TEAM_ROSTER, type Team } from "@/lib/team-utils";

type MyTeamSearch = { create?: string };

export const Route = createFileRoute("/_app/my-team")({
  head: () => ({ meta: [{ title: "My Squad — ClutchGround" }] }),
  validateSearch: (search: Record<string, unknown>): MyTeamSearch => ({
    create: typeof search.create === "string" ? search.create : undefined,
  }),
  component: MyTeamPage,
});

function SquadEmojiButton({
  to,
  emoji,
  label,
  badge,
}: {
  to: string;
  emoji: string;
  label: string;
  badge?: number;
}) {
  return (
    <Link
      to={to}
      title={label}
      className="relative flex flex-col items-center gap-1 press-effect active:scale-95"
    >
      <span className="w-12 h-12 rounded-2xl bg-secondary/80 border border-border flex items-center justify-center text-2xl hover:bg-secondary transition-colors">
        {emoji}
      </span>
      <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
      {badge != null && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
}

function MyTeamPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { create } = Route.useSearch();

  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [invites, setInvites] = useState<any[]>([]);
  const [joinRequestCount, setJoinRequestCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(create === "1");
  const [saving, setSaving] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: "", logo: "" });

  const isCaptain = myTeam?.leader_id === user?.id;
  const rosterSlots = countRosterSlots(myTeam?.members);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const team = await (getMyTeam as any)({ data: user.id });
      if (team) {
        setMyTeam(team);
        setPendingRequest(null);
        setInvites([]);
        setTeamForm({ name: team.name, logo: team.logo || "" });
        if (team.leader_id === user.id) {
          const requests = await (getTeamRequests as any)({ data: user.id });
          setJoinRequestCount((requests || []).length);
        } else {
          setJoinRequestCount(0);
        }
      } else {
        setMyTeam(null);
        setJoinRequestCount(0);
        const [request, playerInvites] = await Promise.all([
          (getMyTeamRequest as any)({ data: user.id }),
          (getMyTeamInvitations as any)({ data: user.id }),
        ]);
        setPendingRequest(request?.status === "pending" ? request : null);
        setInvites(playerInvites || []);
        setTeamForm({ name: "", logo: "" });
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
    if (user) refresh();
  }, [user, authLoading, router, refresh]);

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
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const result = await (uploadImage as any)({
          data: { base64: dataUrl, folder: "team-logos" },
        });
        setTeamForm((prev) => ({ ...prev, logo: result.url }));
        toast.success("Logo uploaded", { id: toastId });
      } catch (err: any) {
        toast.error(err.message || "Upload failed", { id: toastId });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSaveTeam = async () => {
    if (!teamForm.name.trim()) return toast.error("Squad name is required");
    setSaving(true);
    const toastId = toast.loading(myTeam ? "Saving..." : "Creating squad...");
    try {
      await (saveMyTeam as any)({
        data: {
          userId: user!.id,
          teamName: teamForm.name.trim(),
          logo: teamForm.logo,
        },
      });
      toast.success(myTeam ? "Squad updated" : "Squad created!", { id: toastId });
      setIsEditing(false);
      await refresh();
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to save squad", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!myTeam) return;
    const yes = await confirmDialog({
      title: "Leave squad?",
      description: `Leave ${myTeam.name}? You can join another team or create your own.`,
      confirmText: "Leave",
      isDestructive: true,
    });
    if (!yes) return;
    try {
      await (leaveTeam as any)({ data: { userId: user!.id, teamId: myTeam.id } });
      toast.success("You left the squad");
      await refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to leave squad");
    }
  };

  const handleDeleteTeam = async () => {
    if (!myTeam) return;
    const yes = await confirmDialog({
      title: "Delete squad?",
      description: "This removes all members and cannot be undone.",
      confirmText: "Delete",
      isDestructive: true,
    });
    if (!yes) return;
    try {
      await (deleteTeam as any)({ data: { userId: user!.id, teamId: myTeam.id } });
      toast.success("Squad deleted");
      setIsEditing(false);
      await refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete squad");
    }
  };

  const handleRemoveMember = async (memberUserId: number) => {
    const yes = await confirmDialog({
      title: "Remove player?",
      description: "They will be removed from your roster immediately.",
      confirmText: "Remove",
      isDestructive: true,
    });
    if (!yes) return;
    try {
      await (removeTeamMember as any)({ data: { captainId: user!.id, memberUserId } });
      toast.success("Player removed");
      await refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove player");
    }
  };

  const handleCancelRequest = async () => {
    if (!pendingRequest) return;
    try {
      await (cancelTeamRequest as any)({
        data: { userId: user!.id, requestId: pendingRequest.id },
      });
      toast.success("Join request cancelled");
      await refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel request");
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background pb-4 page-content">
        <PageHeader eyebrow="Squad HQ" eyebrowIcon={Users} title="My squad" />
        <SkeletonTeam />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-4 page-content">
      <PageHeader
        eyebrow="Squad HQ"
        eyebrowIcon={Users}
        title={myTeam ? myTeam.name : "My squad"}
      />

      {!myTeam && !isEditing && (
        <div className="space-y-4">
          <TeamInvitesPanel userId={user.id} invites={invites} onUpdated={refresh} />

          {pendingRequest ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">Join request pending</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Waiting for{" "}
                    <span className="font-semibold text-foreground">
                      {pendingRequest.team_name}
                    </span>{" "}
                    to accept you.
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" className="rounded-xl" onClick={handleCancelRequest}>
                      Cancel request
                    </Button>
                    <Link to="/teams">
                      <Button variant="secondary" className="rounded-xl">
                        Browse teams
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : invites.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-60" />
              <h3 className="font-display font-bold text-lg mb-1">No squad yet</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Create your team (captain + 3 players + 1 substitute) or browse squads recruiting
                players.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button onClick={() => setIsEditing(true)} className="rounded-xl font-bold">
                  Create squad
                </Button>
                <Link to="/teams">
                  <Button variant="outline" className="rounded-xl font-bold w-full">
                    Browse teams
                  </Button>
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {isEditing && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card overflow-hidden mb-5"
        >
          <div className="px-5 py-4 border-b border-border bg-secondary/20">
            <h2 className="font-display font-bold text-lg">
              {myTeam ? "Edit squad" : "Create your squad"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              1 captain + 3 players + 1 substitute. Invite members after creating.
            </p>
          </div>
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-black text-2xl text-primary">
                  {teamForm.logo ? (
                    <img src={teamForm.logo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(teamForm.name || "?")
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer shadow-md">
                  <Edit3 className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </label>
              </div>
              <div className="flex-1">
                <label className="text-label block mb-1.5">Squad name</label>
                <input
                  value={teamForm.name}
                  onChange={(e) => setTeamForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Phoenix Esports"
                  className="w-full h-11 bg-secondary border border-border rounded-xl px-4 text-sm font-semibold outline-none focus:border-primary/60"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => {
                  setIsEditing(false);
                  if (myTeam) setTeamForm({ name: myTeam.name, logo: myTeam.logo || "" });
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl font-bold"
                disabled={saving}
                onClick={handleSaveTeam}
              >
                {saving ? "Saving..." : myTeam ? "Save changes" : "Create squad"}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {myTeam && !isEditing && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-card">
            <div className="relative px-6 pt-8 pb-6 text-center bg-gradient-to-b from-primary/8 via-card to-card">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-24 bg-primary/10 blur-3xl pointer-events-none" />

              {isCaptain && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="w-9 h-9 rounded-xl border border-border bg-card/80 flex items-center justify-center text-muted-foreground hover:text-primary press-effect"
                    aria-label="Edit squad"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteTeam}
                    className="w-9 h-9 rounded-xl border border-destructive/30 bg-destructive/5 flex items-center justify-center text-destructive hover:bg-destructive/10 press-effect"
                    aria-label="Delete squad"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="relative mx-auto w-28 h-28 rounded-3xl overflow-hidden bg-primary/10 border-2 border-primary/25 flex items-center justify-center font-display font-black text-3xl text-primary shadow-primary mb-4">
                {myTeam.logo ? (
                  <img src={myTeam.logo} alt="" className="w-full h-full object-cover" />
                ) : (
                  getInitials(myTeam.name)
                )}
              </div>

              <h2 className="font-display font-black text-2xl text-foreground">{myTeam.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isCaptain ? "Captain" : "Squad member"} · {rosterSlots.squadFilled}/
                {TEAM_ROSTER.TOTAL_SQUAD} squad
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                1 captain + 3 players + 1 substitute
              </p>

              <div className="flex items-center justify-center gap-5 mt-6">
                <SquadEmojiButton to="/chat" emoji={"\u{1F4AC}"} label="Chat" />
                {isCaptain && (
                  <>
                    <SquadEmojiButton
                      to="/team-invite"
                      emoji={"\u{1F4E8}"}
                      label="Invite"
                      badge={rosterSlots.isFull ? undefined : rosterSlots.open}
                    />
                    <SquadEmojiButton
                      to="/team-requests"
                      emoji={"\u{1F4E5}"}
                      label="Requests"
                      badge={joinRequestCount}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="px-5 pb-6 pt-2">
              <TeamRoster
                team={myTeam}
                currentUserId={user.id}
                onRemoveMember={isCaptain ? handleRemoveMember : undefined}
                linkProfiles={true}
              />
            </div>
          </div>

          {!isCaptain && (
            <Button variant="outline" className="w-full rounded-xl h-11" onClick={handleLeaveTeam}>
              <LogOut className="w-4 h-4 mr-2" /> Leave squad
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
