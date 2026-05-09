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
import { ChevronLeft, ChevronRight, Crown, Users, Trophy, Check, Download } from "lucide-react";
import { toast } from "sonner";
import { confirmDialog } from "./ConfirmDialog";
import { useAuth } from "../lib/auth-client";
import { useRouter } from "@tanstack/react-router";
import { registerForTournament, getProfile, getMyTeam, checkUserRegistration } from "../api";
import { useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const [step, setStep] = useState<"team-input" | "team-preview" | "confirm">("team-input");
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [teamFetched, setTeamFetched] = useState(false);
  const [showPlayerSelection, setShowPlayerSelection] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<number>>(new Set());
  const teamCount = teamSizeFor(mode);
  const { user } = useAuth();
  const router = useRouter();

  // For Solo tournaments, start at confirm step
  useEffect(() => {
    if (mode === "Solo") {
      setStep("confirm");
    } else {
      setStep("team-input");
    }
  }, [mode]);

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

          if (profile) {
            setLeader((l) => ({
              ...l,
              email: profile.email || "N/A",
              phone: profile.phone || "N/A",
              ign: profile.ign || "",
              uid: profile.uid || "",
              name: profile.username || "",
            }));
          }
        } catch (e) {
          console.error("Failed to auto-fill", e);
        }
      }
      fetchProfileData();
    }
  }, [open, user, teamCount, mode]);

  const fetchTeamDetails = async () => {
    if (mode === "Solo") {
      toast.error("Solo tournaments don't require team details.");
      return;
    }

    setLoadingTeam(true);
    try {
      const myTeam = await (getMyTeam as any)({ data: user?.id });

      if (!myTeam) {
        setLoadingTeam(false);
        toast.error("You don't have a team. Please create or join one first.");
        router.navigate({ to: "/teams" });
        return;
      }

      setLeader((l) => ({
        ...l,
        teamName: myTeam.name,
        name: myTeam.leader.username || myTeam.leader.ign || "",
        ign: myTeam.leader.ign || "",
        uid: myTeam.leader.uid || "",
      }));

      // Get valid members (with ign and uid)
      let activeMembers = [];

      if (myTeam.members && Array.isArray(myTeam.members)) {
        activeMembers = myTeam.members
          .filter((m: any) => {
            // Include if has ign and uid
            if (!m.ign || !m.uid) return false;
            return true;
          })
          .sort((a: any, b: any) => {
            const priority = (role: string) => (role === "caption" || role === "captain" ? 0 : 1);
            return priority(a.role) - priority(b.role);
          });
      }

      console.log("Team name:", myTeam.name);
      console.log("Team leader:", myTeam.leader);
      console.log("Team members count:", activeMembers.length);
      console.log("Members needed:", teamCount);
      console.log("Full members list:", activeMembers);

      if (activeMembers.length < teamCount) {
        setLoadingTeam(false);
        toast.error(
          `Your team has ${activeMembers.length} available member${activeMembers.length !== 1 ? "s" : ""}, but you need ${teamCount} teammate${teamCount !== 1 ? "s" : ""} for ${mode} mode.`,
        );
        return;
      }

      // If the team has more available members than needed, ask which players should play
      if (activeMembers.length > teamCount) {
        setAvailableMembers(activeMembers);
        setSelectedPlayers(new Set(Array.from({ length: teamCount }, (_, i) => i)));
        setShowPlayerSelection(true);
        setLoadingTeam(false);
        return;
      }

      // Auto-fill when there are exactly enough members available
      setTeammates((current) => {
        const newT = [...current];
        activeMembers.slice(0, teamCount).forEach((m: any, i: number) => {
          newT[i] = { name: m.username || m.ign, ign: m.ign, uid: m.uid };
        });
        return newT;
      });

      setTeamFetched(true);
      toast.success("Team details loaded successfully!");
    } catch (e: any) {
      console.error("Failed to fetch team", e);
      toast.error(e.message || "Failed to fetch team details");
    } finally {
      setLoadingTeam(false);
    }
  };

  const handleSelectPlayers = () => {
    if (selectedPlayers.size !== teamCount) {
      toast.error(
        `Please select exactly ${teamCount} player${teamCount !== 1 ? "s" : ""} for ${mode} mode.`,
      );
      return;
    }

    const selected = Array.from(selectedPlayers).sort((a, b) => a - b);
    setTeammates((current) => {
      const newT = [...current];
      selected.forEach((idx: number, i: number) => {
        const m = availableMembers[idx];
        newT[i] = { name: m.username || m.ign, ign: m.ign, uid: m.uid };
      });
      return newT;
    });

    setShowPlayerSelection(false);
    setTeamFetched(true);
    toast.success("Players selected successfully!");
  };

  const togglePlayerSelection = (idx: number) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(idx)) {
      newSelected.delete(idx);
    } else if (newSelected.size < teamCount) {
      newSelected.add(idx);
    } else {
      toast.error(
        `You can only select ${teamCount} player${teamCount !== 1 ? "s" : ""} for ${mode} mode.`,
      );
      return;
    }
    setSelectedPlayers(newSelected);
  };

  const reset = () => {
    setLeader({ name: "", email: "", phone: "", ign: "", uid: "", teamName: "" });
    setTeammates(Array.from({ length: teamCount }, () => ({ name: "", ign: "", uid: "" })));
    setAgree(false);
    setStep("team-input");
    setTeamFetched(false);
    setShowPlayerSelection(false);
    setAvailableMembers([]);
    setSelectedPlayers(new Set());
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

  const handleNextStep = () => {
    if (step === "team-input") {
      // Validate all player details are filled
      if (mode === "Solo") {
        setStep("confirm");
        return;
      }

      const requiredFields = [leader.ign, leader.uid];
      const missingLeader = requiredFields.some((f) => !f || f.trim() === "");

      if (missingLeader) {
        toast.error("Please fill in Captain's IGN and UID");
        return;
      }

      for (let i = 0; i < teamCount; i++) {
        const t = teammates[i];
        if (!t.ign?.trim() || !t.uid?.trim()) {
          toast.error(`Please fill in Player ${i + 2}'s IGN and UID`);
          return;
        }
      }

      setStep("team-preview");
    } else if (step === "team-preview") {
      setStep("confirm");
    }
  };

  const handlePreviousStep = () => {
    if (step === "team-input") {
      return;
    } else if (step === "team-preview") {
      setStep("team-input");
      setTeamFetched(false);
    } else if (step === "confirm") {
      setStep("team-preview");
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

        {/* Player Selection from registered team */}
        {showPlayerSelection && mode !== "Solo" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-primary">
              <Users className="w-4 h-4" />
              <span className="text-xs font-display uppercase tracking-widest">
                {mode === "Duo"
                  ? "Select your Duo partner"
                  : `Select ${teamCount} players for ${mode}`}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your team has {availableMembers.length} member
              {availableMembers.length !== 1 ? "s" : ""}. Please select {teamCount} player
              {teamCount !== 1 ? "s" : ""} for this {mode} match.
            </p>
            <div className="bg-secondary/60 border border-border clip-notch p-4 space-y-2 max-h-64 overflow-y-auto">
              {availableMembers.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => togglePlayerSelection(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                    selectedPlayers.has(idx)
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-white border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedPlayers.has(idx) ? "bg-primary border-primary" : "border-border"
                      }`}
                    >
                      {selectedPlayers.has(idx) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground">{m.ign}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        UID: {m.uid}
                      </div>
                    </div>
                  </div>
                  {selectedPlayers.has(idx) && (
                    <span className="text-[10px] font-bold uppercase px-2 py-1 bg-primary text-white rounded">
                      Selected
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPlayerSelection(false);
                  setAvailableMembers([]);
                  setSelectedPlayers(new Set());
                }}
                className="flex-1 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSelectPlayers}
                className="flex-1 bg-primary text-white rounded-lg font-bold"
              >
                <Check className="w-4 h-4 mr-2" /> Confirm Selection
              </Button>
            </div>
          </div>
        )}

        {/* Team Input Step */}
        {step === "team-input" && mode !== "Solo" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-primary">
              <Users className="w-4 h-4" />
              <span className="text-xs font-display uppercase tracking-widest">Team Details</span>
            </div>

            {/* Team Name */}
            <div className="bg-secondary/60 border border-border clip-notch p-4 space-y-3">
              <div className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest mb-3">
                Team Information
              </div>
              <Field
                label="Team Name"
                value={leader.teamName}
                onChange={(v) => setLeader((l) => ({ ...l, teamName: v }))}
                placeholder="Enter your team name"
                compact
              />
            </div>

            {/* Captain Details */}
            <div className="bg-secondary/60 border border-border clip-notch p-4 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">
                  Captain (You)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field
                  label="IGN"
                  value={leader.ign}
                  onChange={(v) => setLeader((l) => ({ ...l, ign: v }))}
                  placeholder="In-game name"
                  compact
                />
                <Field
                  label="UID"
                  value={leader.uid}
                  onChange={(v) => setLeader((l) => ({ ...l, uid: v }))}
                  placeholder="UID"
                  compact
                />
              </div>
            </div>

            {/* Teammates Details */}
            <div className="bg-secondary/60 border border-border clip-notch p-4 space-y-3">
              <div className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest mb-3">
                Team Members
              </div>
              {teammates.slice(0, teamCount).map((t, i) => (
                <div key={i} className="pb-3 border-b border-border/40 last:border-b-0 last:pb-0">
                  <div className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    Player {i + 2}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Field
                      label="IGN"
                      value={t.ign}
                      onChange={(v) => {
                        setTeammates((curr) => {
                          const newT = [...curr];
                          newT[i] = { ...t, ign: v };
                          return newT;
                        });
                      }}
                      placeholder="In-game name"
                      compact
                    />
                    <Field
                      label="UID"
                      value={t.uid}
                      onChange={(v) => {
                        setTeammates((curr) => {
                          const newT = [...curr];
                          newT[i] = { ...t, uid: v };
                          return newT;
                        });
                      }}
                      placeholder="UID"
                      compact
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Fetch Team Details Button */}
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
              <Button
                onClick={fetchTeamDetails}
                disabled={loadingTeam}
                className="w-full bg-primary text-white font-display"
              >
                <Download className="w-4 h-4 mr-2" />
                {loadingTeam ? "Fetching..." : "Auto-fill From Registered Team"}
              </Button>
              <p className="text-[10px] text-muted-foreground mt-2">
                Click to automatically fill all player details from your registered team
              </p>
            </div>
          </div>
        )}

        {/* Team Preview Step */}
        {step === "team-preview" && mode !== "Solo" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-primary">
              <Users className="w-4 h-4" />
              <span className="text-xs font-display uppercase tracking-widest">Team Roster</span>
            </div>
            <div className="bg-secondary/60 border border-border clip-notch overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-secondary/40">
                    <TableHead className="text-[10px] uppercase font-display font-bold">
                      Position
                    </TableHead>
                    <TableHead className="text-[10px] uppercase font-display font-bold">
                      IGN
                    </TableHead>
                    <TableHead className="text-[10px] uppercase font-display font-bold">
                      UID
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-border/60 hover:bg-secondary/40">
                    <TableCell className="text-xs font-display font-bold">
                      <Crown className="w-4 h-4 inline mr-2 text-amber-500" />
                      Captain
                    </TableCell>
                    <TableCell className="text-xs">{leader.ign}</TableCell>
                    <TableCell className="text-xs font-mono">{leader.uid}</TableCell>
                  </TableRow>
                  {teammates.slice(0, teamCount).map((t, i) => (
                    <TableRow key={i} className="border-border/60 hover:bg-secondary/40">
                      <TableCell className="text-xs font-display font-bold">
                        Player {i + 2}
                      </TableCell>
                      <TableCell className="text-xs">{t.ign}</TableCell>
                      <TableCell className="text-xs font-mono">{t.uid}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
              <p className="text-xs text-foreground/80">
                <Check className="w-3 h-3 inline mr-2 text-primary" />
                Review your team roster. Click "Next" to confirm registration details.
              </p>
            </div>
          </div>
        )}

        {/* Confirm Step */}
        {step === "confirm" && (
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
                  {teammates.slice(0, teamCount).map((t, i) => (
                    <Row key={i} k={`P${i + 2}`} v={`${t.ign} · ${t.uid}`} />
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
                I confirm all UIDs are accurate. I accept the rules, anti-cheat policy, and consent
                to screenshot verification.
              </span>
            </label>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-border/60">
          {(step === "team-preview" || step === "confirm") && (
            <Button variant="outline" onClick={handlePreviousStep} className="rounded-lg">
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          )}
          <div className="flex-1" />
          {step === "confirm" ? (
            <Button variant="hero" onClick={submit} className="font-display tracking-wider">
              <Trophy className="w-4 h-4 mr-2" /> LOCK MY SLOT
            </Button>
          ) : (
            <Button
              variant="hero"
              onClick={handleNextStep}
              className="font-display tracking-wider"
              disabled={step === "team-input" && mode === "Solo"}
            >
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
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
