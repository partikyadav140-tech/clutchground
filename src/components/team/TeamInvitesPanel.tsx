import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { resolveTeamRequest } from "@/api";

type TeamInvite = {
  id: number;
  team_id: number;
  team_name?: string;
  ign?: string;
  uid?: string;
};

type TeamInvitesPanelProps = {
  userId: number;
  invites: TeamInvite[];
  onUpdated: () => void;
};

export function TeamInvitesPanel({ userId, invites, onUpdated }: TeamInvitesPanelProps) {
  const [actingId, setActingId] = useState<number | null>(null);

  const handleRespond = async (requestId: number, status: "approved" | "rejected") => {
    setActingId(requestId);
    const toastId = toast.loading(status === "approved" ? "Joining team..." : "Declining invite...");
    try {
      await (resolveTeamRequest as any)({ data: { requestId, status, userId } });
      toast.success(status === "approved" ? "You joined the team!" : "Invitation declined", { id: toastId });
      onUpdated();
    } catch (err: any) {
      toast.error(err.message || "Action failed", { id: toastId });
    } finally {
      setActingId(null);
    }
  };

  if (invites.length === 0) return null;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-display font-bold text-sm text-foreground">Team invitations</h3>
        <p className="text-xs text-muted-foreground">Captains invited you to join their roster.</p>
      </div>
      {invites.map((invite) => (
        <div key={invite.id} className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <p className="font-bold text-foreground">{invite.team_name || "Squad invite"}</p>
          <p className="text-xs text-muted-foreground mt-1">Invitation from team captain</p>
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              disabled={actingId === invite.id}
              onClick={() => handleRespond(invite.id, "rejected")}
              className="flex-1 h-10 rounded-xl border border-border text-sm font-semibold flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4" /> Decline
            </button>
            <button
              type="button"
              disabled={actingId === invite.id}
              onClick={() => handleRespond(invite.id, "approved")}
              className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5"
            >
              {actingId === invite.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Accept
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
