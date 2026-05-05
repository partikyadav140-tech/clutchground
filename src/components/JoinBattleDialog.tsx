import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Crown, Users, Trophy, Check } from "lucide-react";
import { toast } from "sonner";
import { confirmDialog } from "./ConfirmDialog";
import { useAuth } from "../lib/auth-client";
import { useRouter } from "@tanstack/react-router";
import { registerForTournament, getProfile, getMyTeam, checkUserRegistration } from "../api";
import { useEffect } from "react";

type Teammate = { name: string; ign: string; uid: string };

interface Props {
  trigger: ReactNode;
  tournamentId?: number;
  tournamentTitle?: string;
  mode?: "Solo" | "Duo" | "Squad";
  entryFee?: number;
}

const teamSizeFor = (mode: Props["mode"]) => (mode === "Solo" ? 0 : mode === "Duo" ? 1 : 3);

export function JoinBattleDialog({
  trigger,
  tournamentId,
  tournamentTitle = "CLUTCHGROUND",
  mode = "Squad",
  entryFee = 0,
}: Props) {
  const [open, setOpen] = useState(false);
  const teamCount = teamSizeFor(mode);
  const { user } = useAuth();
  const router = useRouter();

  // leader
  const [leader, setLeader] = useState({
    name: "",
    email: "",
    phone: "",
    ign: "",
    uid: "",
    teamName: "",
  });
  const [teammates, setTeammates] = useState<Teammate[]>(
    Array.from({ length: Math.max(3, teamCount) }, () => ({ name: "", ign: "", uid: "" })),
  );
  const [agree, setAgree] = useState(false);

  useEffect(() => {
    if (open && user) {
      // Auto-fill from profile and team
      async function fetchProfileData() {
        try {
          const profile = await (getProfile as any)({ data: user?.id });
          const myTeam = await (getMyTeam as any)({ data: user?.id });

          let profileReady = false;
          if (profile) {
            setLeader((l) => ({
              ...l,
              email: profile.email || "N/A",
              phone: profile.phone || "N/A",
              ign: profile.ign || "",
              uid: profile.uid || "",
              name: profile.username || "",
            }));
            profileReady = !!(profile.ign && profile.uid);
          }

          let teamReady = false;
          if (myTeam) {
            setLeader((l) => ({ ...l, teamName: myTeam.name }));
            teamReady = !!myTeam.name;
            // Fill teammates in role-priority order: caption/captain first, then players
            const activeMembers = myTeam.members
              .filter((m: any) => (m.role === "player" || m.role === "caption" || m.role === "captain") && m.user_id !== user.id)
              .sort((a: any, b: any) => {
                const priority = (role: string) => (role === "caption" || role === "captain" ? 0 : 1);
                return priority(a.role) - priority(b.role);
              })
              .slice(0, teamCount);
            setTeammates((current) => {
              const newT = [...current];
              activeMembers.forEach((m: any, i: number) => {
                if (i < newT.length) {
                  newT[i] = { name: m.ign, ign: m.ign, uid: m.uid };
                }
              });
              return newT;
            });
          }

          if (!profileReady || (mode !== "Solo" && !teamReady)) {
            toast.error(
              `Please complete your Profile ${mode !== "Solo" ? "and Team Roster" : ""} before joining.`,
            );
            setOpen(false);
            router.navigate({ to: "/profile" });
          }
        } catch (e) {
          console.error("Failed to auto-fill", e);
        }
      }
      fetchProfileData();
    }
  }, [open, user, teamCount, mode]);

  const reset = () => {
    setLeader({ name: "", email: "", phone: "", ign: "", uid: "", teamName: "" });
    setTeammates(Array.from({ length: teamCount }, () => ({ name: "", ign: "", uid: "" })));
    setAgree(false);
  };

  const submit = async () => {
    if (!agree) return toast.error("You must accept the rules to enter the arena.");

    // We need the tournament ID. Assuming it's passed as a prop, wait! It wasn't passed.
    // I need to update Props to include tournamentId.
    if (!tournamentId) return toast.error("Invalid tournament.");

    // Check if user is already registered
    try {
      const { isRegistered } = await (checkUserRegistration as any)({
        data: { userId: user.id, tournamentId },
      });
      if (isRegistered) {
        return toast.error("You are already registered for this tournament.");
      }
    } catch (e) {
      console.error("Failed to check registration", e);
      return toast.error("Failed to check registration status.");
    }

    if (entryFee > 0) {
      const dbBalance = (user as any)?.deposit_balance || 0;
      const winBalance = (user as any)?.winning_balance || 0;

      if (dbBalance + winBalance < entryFee) {
        return toast.error(`Insufficient funds. You need ${entryFee} CG Coins to enter.`);
      }

      if (dbBalance < entryFee) {
        const diff = entryFee - dbBalance;
        const yes = await confirmDialog({
          title: "Mixed Funds",
          description: `⚠️ You don't have enough Deposit Coins. This will deduct ${dbBalance} from Deposit Coins and ${diff} from your Earned Coins (Winnings). Proceed?`,
          confirmText: "Proceed",
        });
        if (!yes) {
          return;
        }
      }
    }

    try {
      const loadingToast = toast.loading("Reserving your slot...");

      const allPlayers = [
        { name: leader.name, ign: leader.ign, uid: leader.uid },
        ...(mode !== "Solo"
          ? teammates.map((t) => ({ name: t.name, ign: t.ign, uid: t.uid }))
          : []),
      ];

      await (registerForTournament as any)({
        data: {
          userId: user.id,
          tournamentId: tournamentId,
          teamName: mode === "Solo" ? leader.ign : leader.teamName,
          players: allPlayers,
          contactEmail: leader.email,
          contactPhone: leader.phone,
        },
      });

      toast.dismiss(loadingToast);
      toast.success(`🔥 Slot reserved for ${leader.ign} in ${tournamentTitle}!`, {
        description: "Room ID will be sent to your email & in-app inbox 10 minutes before start.",
      });
      setOpen(false);
      setTimeout(reset, 300);
      router.navigate({ to: "/matches" });
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Failed to register");
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (v && !user) {
      toast.error("You must be logged in to join battles.");
      router.navigate({ to: "/login" });
      return;
    }
    setOpen(v);
    if (!v) setTimeout(reset, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-primary/40 clip-notch">
        <div className="absolute inset-x-0 top-0 h-px bg-fire-gradient" />
        <DialogHeader>
          <DialogTitle className="font-display text-2xl sm:text-3xl font-black tracking-tight">
            <span className="text-fire-gradient">JOIN BATTLE</span>
          </DialogTitle>
          <DialogDescription className="text-xs uppercase tracking-[0.2em] font-display">
            {tournamentTitle} · {mode}
          </DialogDescription>
        </DialogHeader>

        {/* Confirm Step */}
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 text-primary">
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-display uppercase tracking-widest">Confirm Entry</span>
          </div>
          <div className="bg-secondary/60 border border-border clip-notch p-4 space-y-2 text-sm">
            <Row k="Tournament" v={tournamentTitle} />
            <Row k="Mode" v={mode} />
            {mode !== "Solo" && <Row k="Team" v={leader.teamName} />}
            <Row k="Captain" v={`${leader.ign} (UID ${leader.uid})`} />
            <Row k="Contact" v={`${leader.email} · ${leader.phone}`} />
            {mode !== "Solo" && (
              <div className="pt-2 mt-2 border-t border-border/60">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  Roster
                </div>
                {teammates.map((t, i) => (
                  <Row key={i} k={`P${i + 2}`} v={`${t.ign} · ${t.name} · ${t.uid}`} />
                ))}
              </div>
            )}
          </div>
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="accent-primary mt-0.5"
            />
            <span>
              I confirm all UIDs are accurate. I accept the rules, anti-cheat policy, and consent to
              screenshot verification.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 mt-2 border-t border-border/60">
          <Button variant="hero" onClick={submit} className="font-display tracking-wider">
            <Trophy className="w-4 h-4" /> LOCK MY SLOT
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
  className = "",
  compact = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={className}>
      <label
        className={`block text-[10px] uppercase tracking-widest font-display font-bold text-muted-foreground mb-1 ${compact ? "" : ""}`}
      >
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        maxLength={maxLength}
        className={`w-full bg-background border border-border focus:border-primary outline-none px-3 ${compact ? "h-9 text-sm" : "h-10 text-sm"} transition-colors`}
      />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 text-xs">
      <span className="text-muted-foreground uppercase tracking-widest text-[10px]">{k}</span>
      <span className="font-bold text-foreground text-right truncate">{v}</span>
    </div>
  );
}
