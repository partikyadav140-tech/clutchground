import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { resolveTeamRequest } from "@/api";
import { getInitials } from "@/lib/team-utils";

type JoinRequest = {
  id: number;
  user_id: number;
  ign: string;
  uid: string;
  username?: string;
  created_at?: string;
};

type TeamRequestsPanelProps = {
  captainId: number;
  requests: JoinRequest[];
  onUpdated: () => void;
};

export function TeamRequestsPanel({ captainId, requests, onUpdated }: TeamRequestsPanelProps) {
  const [actingId, setActingId] = useState<number | null>(null);

  const handleResolve = async (requestId: number, status: "approved" | "rejected") => {
    setActingId(requestId);
    const toastId = toast.loading(status === "approved" ? "Approving..." : "Declining...");
    try {
      await (resolveTeamRequest as any)({ data: { requestId, status, userId: captainId } });
      toast.success(status === "approved" ? "Player added to roster" : "Request declined", {
        id: toastId,
      });
      onUpdated();
    } catch (err: any) {
      toast.error(err.message || "Action failed", { id: toastId });
    } finally {
      setActingId(null);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card/50 p-5 text-center">
        <p className="text-sm text-muted-foreground">No pending join requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <div key={req.id} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
              {getInitials(req.ign || req.username)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-foreground">{req.ign || req.username}</p>
              <p className="text-xs text-muted-foreground">
                @{req.username || "player"} · UID {req.uid}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">Wants to join your squad</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              disabled={actingId === req.id}
              onClick={() => handleResolve(req.id, "rejected")}
              className="flex-1 h-10 rounded-xl border border-border text-sm font-semibold flex items-center justify-center gap-1.5 press-effect"
            >
              {actingId === req.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
              Decline
            </button>
            <button
              type="button"
              disabled={actingId === req.id}
              onClick={() => handleResolve(req.id, "approved")}
              className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5 press-effect"
            >
              {actingId === req.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Accept
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
