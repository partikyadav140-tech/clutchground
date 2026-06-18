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
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Users,
  Trophy,
  Check,
  Download,
  Search,
  X,
} from "lucide-react";
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
  const [step, setStep] = useState<"mode-select" | "team-setup" | "confirm">("mode-select");
  const [teamSetupMode, setTeamSetupMode] = useState<"registered" | "manual" | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const teamCount = teamSizeFor(mode);
  const { user } = useAuth();
  const router = useRouter();

  // For Solo tournaments, skip to confirm step
  useEffect(() => {
    if (mode === "Solo") {
      setStep("confirm");
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
    Array.from({ length: 3 }, () => ({ name: "", ign: "", uid: "" })),
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

  const loadRegisteredTeam = async () => {
    if (mode === "Solo") {
      toast.error("Solo tournaments don't require team selection.");
      return;
    }

    setLoadingTeam(true);
    try {
      const myTeam = await (getMyTeam as any)({ data: user?.id });

      if (!myTeam) {
        setLoadingTeam(false);
        toast.error("You don't have a registered team. Please create or join one first.");
        router.navigate({ to: "/my-team" });
        return;
      }

      // Set team name
      setLeader((l) => ({ ...l, teamName: myTeam.name }));

      // Collect all available team members including captain
      let activeMembers: any[] = [];

      // Add team captain first
      if (myTeam.leader && myTeam.leader.ign && myTeam.leader.uid) {
        activeMembers.push({ ...myTeam.leader, isCaptain: true });
      }

      // Add team members
      if (myTeam.members && Array.isArray(myTeam.members)) {
        const members = myTeam.members.filter((m: any) => m.ign && m.uid);
        activeMembers = activeMembers.concat(members);
      }

      // Need captain + teamCount players total
      const totalNeeded = teamCount + 1;
      if (activeMembers.length < totalNeeded) {
        setLoadingTeam(false);
        toast.error(
          `Your team has ${activeMembers.length} available member${activeMembers.length !== 1 ? "s" : ""}, but you need ${totalNeeded} total (captain + ${teamCount} players) for ${mode} mode.`,
        );
        return;
      }

      // If exactly enough members, auto-select them
      if (activeMembers.length === totalNeeded) {
        const newSelected = new Set(Array.from({ length: totalNeeded }, (_, i) => i));
        setSelectedPlayers(newSelected);
        fillTeammatesFromSelection(activeMembers, newSelected);
        toast.success("Team loaded! All players selected.");
        setStep("confirm");
      } else {
        // Show selection UI if more members than needed
        setAvailableMembers(activeMembers);
        setSelectedPlayers(new Set(Array.from({ length: totalNeeded }, (_, i) => i)));
        setStep("team-setup");
        toast.success(`Select ${totalNeeded} players (including captain)!`);
      }
    } catch (e: any) {
      console.error("Failed to fetch team", e);
      toast.error(e.message || "Failed to load team");
    } finally {
      setLoadingTeam(false);
    }
  };

  const fillTeammatesFromSelection = (members: any[], selected: Set<number>) => {
    const selectedArray = Array.from(selected).sort((a, b) => a - b);
    const selectedMembers = selectedArray.map((idx) => members[idx]);

    // Find captain (if any is marked as captain)
    const captainMember = selectedMembers.find((m: any) => m.isCaptain);
    if (captainMember) {
      setLeader((l) => ({
        ...l,
        name: captainMember.username || captainMember.ign,
        ign: captainMember.ign,
        uid: captainMember.uid,
      }));
    }

    // Set teammates (all selected except captain)
    setTeammates((current) => {
      const newT = [...current];
      let tmIdx = 0;
      selectedMembers.forEach((m: any) => {
        if (!m.isCaptain && tmIdx < teamCount) {
          newT[tmIdx] = { name: m.username || m.ign, ign: m.ign, uid: m.uid };
          tmIdx++;
        }
      });
      return newT;
    });
  };

  const confirmPlayerSelection = () => {
    if (selectedPlayers.size !== teamCount) {
      toast.error(`Please select exactly ${teamCount} player${teamCount !== 1 ? "s" : ""}`);
      return;
    }
    fillTeammatesFromSelection(availableMembers, selectedPlayers);
    setStep("confirm");
    toast.success("Players selected!");
  };

  const reset = () => {
    setLeader({ name: "", email: "", phone: "", ign: "", uid: "", teamName: "" });
    setTeammates(Array.from({ length: 3 }, () => ({ name: "", ign: "", uid: "" })));
    setAgree(false);
    setStep(mode === "Solo" ? "confirm" : "mode-select");
    setTeamSetupMode(null);
    setAvailableMembers([]);
    setSelectedPlayers(new Set());
    setSearchQuery("");
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
        description: "Room ID will be sent to your in-app inbox 10 minutes before start.",
      });
      setOpen(false);
      setTimeout(reset, 300);
      router.navigate({ to: "/matches" });
    } catch (err: any) {
      toast.dismiss();
      if (err?.message?.includes("w.delete is not a function")) {
        try {
          const result = await (checkUserRegistration as any)({
            data: { userId: user.id, tournamentId },
          });
          if (result?.isRegistered) {
            toast.success(`🔥 Slot reserved for ${leader.ign} in ${tournamentTitle}!`, {
              description:
                "Room ID will be sent to your in-app inbox 10 minutes before start.",
            });
            setOpen(false);
            setTimeout(reset, 300);
            router.navigate({ to: "/matches" });
            return;
          }
        } catch (_err) {
          console.error("Fallback verification failed", _err);
        }
      }
      toast.error(err.message || "Failed to register");
    }
  };

  const handleNextStep = () => {
    if (step === "mode-select") {
      if (teamSetupMode === "registered") {
        loadRegisteredTeam();
      } else if (teamSetupMode === "manual") {
        setStep("team-setup");
      }
    } else if (step === "team-setup") {
      // Only validate manual entry if using manual mode
      if (teamSetupMode === "manual") {
        const requiredFields = [leader.ign, leader.uid];
        if (requiredFields.some((f) => !f || f.trim() === "")) {
          toast.error("Please fill in your IGN and UID");
          return;
        }
        for (let i = 0; i < teamCount; i++) {
          const t = teammates[i];
          if (!t.ign?.trim() || !t.uid?.trim()) {
            toast.error(`Please fill in Player ${i + 2}'s IGN and UID`);
            return;
          }
        }
      }
      // For registered team, check player selection count and fill teammates
      if (teamSetupMode === "registered") {
        if (selectedPlayers.size !== teamCount + 1) {
          toast.error(
            `Please select exactly ${teamCount + 1} players (captain + ${teamCount} teammates)`,
          );
          return;
        }
        // Fill teammates from selected players
        fillTeammatesFromSelection(availableMembers, selectedPlayers);
      }
      setStep("confirm");
    }
  };

  const handlePreviousStep = () => {
    if (step === "team-setup") {
      setStep("mode-select");
      setTeamSetupMode(null);
    } else if (step === "confirm" && availableMembers.length > 0) {
      setStep("mode-select");
      setTeamSetupMode(null);
      setAvailableMembers([]);
      setSelectedPlayers(new Set());
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
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-card border border-border shadow-2xl rounded-3xl">
        <div
          className="h-1 w-full rounded-t-3xl -mt-1 mb-2"
          style={{ background: "var(--gradient-primary)" }}
        />
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-black text-foreground">
            JOIN BATTLE
          </DialogTitle>
          <DialogDescription className="text-xs uppercase tracking-[0.2em] font-display text-muted-foreground font-bold mt-1">
            {tournamentTitle} · {mode}
            {step !== "confirm" && (
              <span className="ml-2 text-primary">
                ({step === "mode-select" ? "Step 1" : "Step 2"} of 2)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: Mode Selection */}
        {step === "mode-select" && mode !== "Solo" && (
          <div className="space-y-4 py-4">
            <div className="text-xs uppercase tracking-widest font-black text-muted-foreground mb-3">
              How do you want to join?
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Choose the fastest way to register your {mode} team
            </p>

            {/* Option 1: Use Registered Team */}
            <button
              onClick={() => setTeamSetupMode("registered")}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                teamSetupMode === "registered"
                  ? "bg-primary/10 border-primary"
                  : "bg-slate-50 dark:bg-slate-900 border-border hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-primary/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                    teamSetupMode === "registered" ? "bg-primary border-primary" : "border-border"
                  }`}
                >
                  {teamSetupMode === "registered" && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-foreground mb-1">Use Registered Team ⚡</div>
                  <div className="text-xs text-muted-foreground">
                    Auto-fill from your active squad. Fast and easy!
                  </div>
                </div>
              </div>
            </button>

            {/* Option 2: Manual Entry */}
            <button
              onClick={() => setTeamSetupMode("manual")}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                teamSetupMode === "manual"
                  ? "bg-primary/10 border-primary"
                  : "bg-slate-50 dark:bg-slate-900 border-border hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-primary/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                    teamSetupMode === "manual" ? "bg-primary border-primary" : "border-border"
                  }`}
                >
                  {teamSetupMode === "manual" && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-foreground mb-1">Manual Entry ✏️</div>
                  <div className="text-xs text-muted-foreground">
                    Manually enter each player's details
                  </div>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* STEP 2A: Select Players from Registered Team */}
        {step === "team-setup" && teamSetupMode === "registered" && availableMembers.length > 0 && (
          <div className="space-y-4 py-4">
            <div className="text-xs uppercase tracking-widest font-black text-muted-foreground mb-2">
              Step 2: Select Players
            </div>
            <p className="text-sm text-muted-foreground">
              Your team "<span className="font-bold text-foreground">{leader.teamName}</span>" has{" "}
              {availableMembers.length} members
            </p>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
              <p className="text-xs font-semibold text-blue-400">
                Select {teamCount + 1} players total (1 captain + {teamCount} teammate
                {teamCount !== 1 ? "s" : ""})
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search player..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:border-primary outline-none"
              />
            </div>

            {/* Player List */}
            <div className="bg-secondary/50 border border-border rounded-xl max-h-72 overflow-y-auto p-2 space-y-2">
              {(() => {
                const filtered = availableMembers.filter((m) => {
                  const q = searchQuery.toLowerCase();
                  return (
                    !q ||
                    m.ign?.toLowerCase().includes(q) ||
                    m.username?.toLowerCase().includes(q) ||
                    m.uid?.toLowerCase().includes(q)
                  );
                });

                return filtered.map((m) => {
                  const actualIdx = availableMembers.indexOf(m);
                  return (
                    <button
                      key={actualIdx}
                      onClick={() => {
                        const newSet = new Set(selectedPlayers);
                        const totalNeeded = teamCount + 1;
                        if (newSet.has(actualIdx)) {
                          newSet.delete(actualIdx);
                        } else if (newSet.size < totalNeeded) {
                          newSet.add(actualIdx);
                        } else {
                          toast.error(`Select only ${totalNeeded} players`);
                          return;
                        }
                        setSelectedPlayers(newSet);
                      }}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                        selectedPlayers.has(actualIdx)
                          ? "bg-primary/20 border-primary"
                          : "bg-background border-border hover:bg-secondary"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          selectedPlayers.has(actualIdx)
                            ? "bg-primary border-primary"
                            : "border-border"
                        }`}
                      >
                        {selectedPlayers.has(actualIdx) && (
                          <Check className="w-2.5 h-2.5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-bold text-sm text-foreground">
                          {m.ign}{" "}
                          {m.isCaptain && (
                            <span className="text-xs text-amber-400 font-black">(Captain)</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{m.uid}</div>
                      </div>
                    </button>
                  );
                });
              })()}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">
              <p className="text-xs font-semibold text-amber-400">
                {selectedPlayers.size}/{teamCount + 1} selected
              </p>
            </div>
          </div>
        )}

        {/* STEP 2B: Manual Team Entry */}
        {step === "team-setup" && teamSetupMode === "manual" && (
          <div className="space-y-4 py-4">
            <div className="text-xs uppercase tracking-widest font-black text-muted-foreground mb-2">
              Step 2: Enter Player Details
            </div>

            {/* Captain Details */}
            <div className="bg-secondary/50 border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black text-foreground uppercase tracking-widest">
                  You (Captain)
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

            {/* Teammates */}
            {teammates.slice(0, teamCount).map((t, i) => (
              <div
                key={i}
                className="bg-secondary/50 border border-border rounded-xl p-4 space-y-3"
              >
                <div className="text-xs font-black text-foreground uppercase tracking-widest">
                  Player {i + 2}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field
                    label="IGN"
                    value={t.ign}
                    onChange={(v) => {
                      const newT = [...teammates];
                      newT[i] = { ...t, ign: v };
                      setTeammates(newT);
                    }}
                    placeholder="In-game name"
                    compact
                  />
                  <Field
                    label="UID"
                    value={t.uid}
                    onChange={(v) => {
                      const newT = [...teammates];
                      newT[i] = { ...t, uid: v };
                      setTeammates(newT);
                    }}
                    placeholder="UID"
                    compact
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 3: Confirm Entry */}
        {step === "confirm" && (
          <div className="space-y-4 py-4">
            <div className="text-xs uppercase tracking-widest font-black text-muted-foreground mb-2">
              Review & Confirm
            </div>

            {/* Summary */}
            <div className="bg-secondary/50 border border-border rounded-xl p-4 space-y-2">
              <Row k="Tournament" v={tournamentTitle} />
              <Row k="Mode" v={mode} />
              {mode !== "Solo" && <Row k="Team" v={leader.teamName} />}
              <Row k="Your IGN" v={leader.ign} />
              <Row k="Your UID" v={leader.uid} />

              {mode !== "Solo" && teammates.slice(0, teamCount).length > 0 && (
                <div className="pt-2 mt-2 border-t border-border">
                  <div className="text-xs font-black uppercase tracking-widest text-cta mb-2">
                    Roster
                  </div>
                  {teammates.slice(0, teamCount).map((t, i) => (
                    <div key={i} className="text-xs py-1">
                      <span className="text-muted-foreground">P{i + 2}:</span>
                      <span className="font-bold text-foreground ml-2">{t.ign}</span>
                      <span className="text-muted-foreground ml-1">({t.uid})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Checkbox */}
            <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="accent-primary mt-0.5 shrink-0 w-3.5 h-3.5 rounded bg-secondary border border-border"
              />
              <span className="font-semibold leading-relaxed">
                I confirm all details are accurate. I accept the rules and anti-cheat policy.
              </span>
            </label>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-border">
          {(step === "team-setup" || step === "confirm") && (
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              className="rounded-xl border-border bg-transparent text-foreground font-bold hover:bg-secondary text-xs uppercase tracking-widest"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
          <div className="flex-1" />

          {step === "confirm" ? (
            <Button
              onClick={submit}
              disabled={!agree}
              className="rounded-xl font-black bg-cta-gradient text-cta-foreground h-11 shadow-cta border border-cta/50 text-xs uppercase tracking-widest disabled:opacity-50"
            >
              <Trophy className="w-4 h-4 mr-2" /> LOCK SLOT
            </Button>
          ) : (
            <Button
              onClick={handleNextStep}
              disabled={
                !teamSetupMode ||
                loadingTeam ||
                (step === "team-setup" &&
                  teamSetupMode === "registered" &&
                  selectedPlayers.size !== teamCount + 1)
              }
              className="rounded-xl font-black bg-cta-gradient text-cta-foreground h-11 shadow-cta border border-cta/50 text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {loadingTeam ? "Loading..." : "Next"} <ChevronRight className="w-4 h-4 ml-1" />
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
        className={`block text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-1`}
      >
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        maxLength={maxLength}
        className={`w-full bg-secondary border border-border focus:border-primary/60 outline-none px-3 font-bold text-foreground transition-colors placeholder:text-muted-foreground ${compact ? "h-10 rounded-xl text-sm" : "h-12 rounded-xl text-sm"}`}
      />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 text-xs py-0.5">
      <span className="text-muted-foreground uppercase tracking-widest text-[9px] font-black">
        {k}
      </span>
      <span className="font-bold text-foreground text-right truncate">{v}</span>
    </div>
  );
}
