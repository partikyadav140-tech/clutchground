import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { getTeamById, requestJoinTeam } from "@/api";
import { TeamRoster } from "@/components/team/TeamRoster";
import { countRosterSlots, getInitials, TEAM_ROSTER, type Team } from "@/lib/team-utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type TeamDetailSheetProps = {
  teamId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: { id: number; username?: string; ign?: string; uid?: string } | null;
  pendingTeamId?: number | null;
  onRequestSent?: () => void;
};

export function TeamDetailSheet({
  teamId,
  open,
  onOpenChange,
  user,
  pendingTeamId,
  onRequestSent,
}: TeamDetailSheetProps) {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !teamId) {
      setTeam(null);
      return;
    }
    setLoading(true);
    (getTeamById as any)({ data: teamId })
      .then((data: Team) => setTeam(data))
      .catch(() => setTeam(null))
      .finally(() => setLoading(false));
  }, [open, teamId]);

  const slots = countRosterSlots(team?.members);

  const handleJoinRequest = async () => {
    if (!user || !team) return;
    setSubmitting(true);
    const toastId = toast.loading("Sending join request...");
    try {
      await (requestJoinTeam as any)({
        data: {
          teamId: team.id,
          userId: user.id,
          ign: user.ign || user.username,
          uid: user.uid || String(user.id),
        },
      });
      toast.success("Join request sent to captain!", { id: toastId });
      onRequestSent?.();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Could not send request", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const hasPendingForThisTeam = pendingTeamId === teamId;
  const canRequest =
    user && team && !slots.isFull && !hasPendingForThisTeam && user.id !== team.leader_id;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto px-4 pb-8">
        {loading || !team ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <SheetHeader className="text-left space-y-3 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-primary/15 border border-primary/20 flex items-center justify-center font-display font-black text-xl text-primary shrink-0">
                  {team.logo ? (
                    <img
                      src={team.logo}
                      alt={team.name || "Team logo"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(team.name)
                  )}
                </div>
                <div className="min-w-0">
                  <SheetTitle className="font-display text-xl">{team.name}</SheetTitle>
                  <SheetDescription className="text-sm">
                    Captain: {team.leader?.ign || team.leader?.username || "—"}
                  </SheetDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">
                  {slots.squadFilled}/{TEAM_ROSTER.TOTAL_SQUAD} squad
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    slots.isFull
                      ? "bg-destructive/10 text-destructive"
                      : "bg-emerald-500/10 text-emerald-500"
                  }`}
                >
                  {slots.isFull
                    ? "Roster full"
                    : `${slots.open} open ${slots.open === 1 ? "slot" : "slots"}`}
                </span>
              </div>
            </SheetHeader>

            <TeamRoster team={team} currentUserId={user?.id} linkProfiles />

            <div className="pt-5">
              {hasPendingForThisTeam ? (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-muted-foreground">
                  Your join request is pending. The captain will review it soon.
                </div>
              ) : slots.isFull ? (
                <div className="rounded-2xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground text-center">
                  This team has a full roster right now.
                </div>
              ) : canRequest ? (
                <Button
                  onClick={handleJoinRequest}
                  disabled={submitting}
                  className="w-full h-12 rounded-2xl font-bold text-sm"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" /> Request to join
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
