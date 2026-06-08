import { Link } from "@tanstack/react-router";
import { Users, Crown, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getRegistrationSquad } from "@/api";
import { useEffect, useState } from "react";

type Props = {
  registrationId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: string;
};

export function TournamentSquadSheet({ registrationId, open, onOpenChange, mode }: Props) {
  const [squad, setSquad] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !registrationId) return;
    setLoading(true);
    (getRegistrationSquad as any)({ data: registrationId })
      .then(setSquad)
      .finally(() => setLoading(false));
  }, [open, registrationId]);

  const allMembers = squad
    ? [
        { ...squad.leader, ign: squad.leader.ign || squad.leader.username, role: "Captain" },
        ...squad.players.map((p: any) => ({ ...p, role: "Player" })),
      ]
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display font-black flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {squad?.teamName || "Squad"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : squad ? (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/30 border border-border">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-black text-xl text-primary shrink-0">
                {squad.teamLogo ? (
                  <img src={squad.teamLogo} alt="" className="w-full h-full object-cover" />
                ) : (
                  squad.teamName?.[0]
                )}
              </div>
              <div>
                <p className="font-display font-black text-lg">{squad.teamName}</p>
                <p className="text-xs text-muted-foreground">{mode} · {allMembers.length} player{allMembers.length !== 1 ? "s" : ""}</p>
              </div>
            </div>

            <div className="space-y-2">
              {allMembers.map((m: any, i: number) => {
                const content = (
                  <div className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-card">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (m.ign || "?")[0]
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate flex items-center gap-1">
                        {m.role === "Captain" && <Crown className="w-3 h-3 text-amber-500" />}
                        {m.ign}
                      </p>
                      {m.uid && <p className="text-[10px] text-muted-foreground font-mono">UID {m.uid}</p>}
                    </div>
                    {m.userId && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  </div>
                );

                if (m.userId) {
                  return (
                    <Link key={i} to="/users/$userId" params={{ userId: String(m.userId) }} onClick={() => onOpenChange(false)}>
                      {content}
                    </Link>
                  );
                }
                return <div key={i}>{content}</div>;
              })}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
