import { useEffect, useState } from "react";
import { Search, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { inviteTeamMember, searchPlayers } from "@/api";
import { getInitials } from "@/lib/team-utils";

type Player = {
  id: number;
  username: string;
  ign?: string;
  uid?: string;
  avatar_url?: string | null;
};

type PlayerSearchInviteProps = {
  captainId: number;
  disabled?: boolean;
  onInvited?: () => void;
};

export function PlayerSearchInvite({ captainId, disabled, onInvited }: PlayerSearchInviteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [invitingId, setInvitingId] = useState<number | null>(null);

  useEffect(() => {
    if (disabled) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await (searchPlayers as any)({ data: { query, captainId } });
        setResults(data || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, captainId, disabled]);

  const handleInvite = async (player: Player) => {
    setInvitingId(player.id);
    const toastId = toast.loading(`Inviting ${player.ign || player.username}...`);
    try {
      await (inviteTeamMember as any)({
        data: { captainId, inviteKey: player.username },
      });
      toast.success("Invitation sent!", { id: toastId });
      onInvited?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to send invite", { id: toastId });
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-display font-bold text-sm text-foreground mb-1">Invite players</h3>
        <p className="text-xs text-muted-foreground">
          Search by username, in-game name (IGN), or UID.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
          placeholder="Search username, IGN, or UID..."
          className="w-full h-11 bg-secondary border border-border focus:border-primary/60 outline-none pl-10 pr-4 text-sm font-medium rounded-xl transition-all"
        />
      </div>

      <div className="max-h-64 overflow-y-auto space-y-2 rounded-2xl border border-border p-2 bg-card/40">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Searching...
          </div>
        ) : results.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {query ? "No players found." : "Type to search registered players."}
          </p>
        ) : (
          results.map((player) => (
            <div
              key={player.id}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/60 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                {player.avatar_url ? (
                  <img src={player.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  getInitials(player.ign || player.username)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{player.ign || player.username}</p>
                <p className="text-xs text-muted-foreground truncate">
                  @{player.username}
                  {player.uid ? ` · UID ${player.uid}` : ""}
                </p>
              </div>
              <button
                type="button"
                disabled={disabled || invitingId === player.id}
                onClick={() => handleInvite(player)}
                className="h-9 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 press-effect"
              >
                {invitingId === player.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                Invite
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
