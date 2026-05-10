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
        ...(mode === "Squad" ? {
          name: myTeam.leader.username || myTeam.leader.ign || "",
          ign: myTeam.leader.ign || "",
          uid: myTeam.leader.uid || "",
        } : {})
      }));

      let activeMembers: any[] = [];

      if (mode === "Duo") {
        const allTeamPlayers: any[] = [];
        if (myTeam.leader?.ign && myTeam.leader?.uid && myTeam.leader_id !== user?.id) {
          allTeamPlayers.push({ ...myTeam.leader, role: "captain" });
        }
        if (myTeam.members && Array.isArray(myTeam.members)) {
          myTeam.members.forEach((m: any) => {
            if (m.ign && m.uid && m.user_id !== user?.id) {
              allTeamPlayers.push(m);
            }
          });
        }
        activeMembers = allTeamPlayers;
      } else {
        if (myTeam.members && Array.isArray(myTeam.members)) {
          activeMembers = myTeam.members
            .filter((m: any) => m.ign && m.uid)
            .sort((a: any, b: any) => {
              const priority = (role: string) => (role === "caption" || role === "captain" ? 0 : 1);
              return priority(a.role) - priority(b.role);
            });
        }
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
      if (err?.message?.includes("w.delete is not a function")) {
        try {
          const result = await (checkUserRegistration as any)({
            data: { userId: user.id, tournamentId },
          });
          if (result?.isRegistered) {
            toast.success(`🔥 Slot reserved for ${leader.ign} in ${tournamentTitle}!`, {
              description: "Room ID will be sent to your email & in-app inbox 10 minutes before start.",
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
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-3xl border-white/10 shadow-2xl rounded-[1.5rem]">
        <div className="absolute inset-x-0 top-0 h-px bg-primary-gradient shadow-[0_0_15px_rgba(255,0,85,0.8)]" />
        <DialogHeader>
          <DialogTitle className="font-display text-2xl sm:text-3xl font-black tracking-tight">
            <span className="text-transparent bg-clip-text bg-primary-gradient drop-shadow-[0_0_8px_rgba(255,0,85,0.6)]">JOIN BATTLE</span>
          </DialogTitle>
          <DialogDescription className="text-xs uppercase tracking-[0.2em] font-display text-muted-foreground font-bold">
            {tournamentTitle} · {mode}
          </DialogDescription>
        </DialogHeader>

        {/* Player Selection from registered team */}
        {showPlayerSelection && mode !== "Solo" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-cta">
              <Users className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest text-glow">
                {mode === "Duo"
                  ? "Select your Duo partner"
                  : `Select ${teamCount} players for ${mode}`}
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-semibold">
              Your team has {availableMembers.length} member
              {availableMembers.length !== 1 ? "s" : ""}. Please select {teamCount} player
              {teamCount !== 1 ? "s" : ""} for this {mode} match.
            </p>
            <div className="bg-black/40 border border-white/5 rounded-[1.25rem] p-4 space-y-2 max-h-64 overflow-y-auto shadow-inner">
              {availableMembers.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => togglePlayerSelection(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    selectedPlayers.has(idx)
                      ? "bg-primary/20 border-primary text-cta shadow-[0_0_10px_rgba(255,0,85,0.3)]"
                      : "bg-black/30 border-white/5 hover:border-white/20 hover:bg-black/50"
                  }`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        selectedPlayers.has(idx) ? "bg-primary border-primary" : "border-white/20"
                      }`}
                    >
                      {selectedPlayers.has(idx) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{m.ign}</div>
                      <div className="text-[10px] text-muted-foreground font-mono font-semibold">
                        UID: {m.uid}
                      </div>
                    </div>
                  </div>
                  {selectedPlayers.has(idx) && (
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-primary text-white rounded">
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
                className="flex-1 rounded-xl border-white/10 text-white font-bold bg-transparent hover:bg-white/5 uppercase tracking-widest text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSelectPlayers}
                className="flex-1 bg-cta-gradient text-cta-foreground rounded-xl font-black shadow-cta border border-cta/50 uppercase tracking-widest text-xs"
              >
                <Check className="w-4 h-4 mr-2" /> Confirm
              </Button>
            </div>
          </div>
        )}

        {/* Team Input Step */}
        {step === "team-input" && mode !== "Solo" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-cta">
              <Users className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest text-glow">Team Details</span>
            </div>

            {/* Team Name */}
            <div className="bg-black/40 border border-white/5 rounded-[1.25rem] p-4 space-y-3 shadow-inner">
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">
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
            <div className="bg-black/40 border border-white/5 rounded-[1.25rem] p-4 space-y-3 shadow-inner">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">
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
            <div className="bg-black/40 border border-white/5 rounded-[1.25rem] p-4 space-y-3 shadow-inner">
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">
                Team Members
              </div>
              {teammates.slice(0, teamCount).map((t, i) => (
                <div key={i} className="pb-3 border-b border-white/5 last:border-b-0 last:pb-0">
                  <div className="text-[10px] font-black text-white uppercase tracking-widest mb-2">
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
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-[1.25rem] p-3 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <Button
                onClick={fetchTeamDetails}
                disabled={loadingTeam}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black uppercase tracking-widest text-xs h-11 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-blue-400/50"
              >
                <Download className="w-4 h-4 mr-2" />
                {loadingTeam ? "Fetching..." : "Auto-fill From Team"}
              </Button>
              <p className="text-[10px] font-semibold text-muted-foreground mt-2 text-center">
                Automatically fill player details from your registered squad
              </p>
            </div>
          </div>
        )}

        {/* Team Preview Step */}
        {step === "team-preview" && mode !== "Solo" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-cta">
              <Users className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest text-glow">Team Roster</span>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-[1.25rem] overflow-hidden shadow-inner">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-black/20">
                    <TableHead className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">
                      Position
                    </TableHead>
                    <TableHead className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">
                      IGN
                    </TableHead>
                    <TableHead className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">
                      UID
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-white/5 hover:bg-black/20">
                    <TableCell className="text-xs font-black text-white">
                      <Crown className="w-4 h-4 inline mr-2 text-amber-500" />
                      Captain
                    </TableCell>
                    <TableCell className="text-xs font-bold text-white">{leader.ign}</TableCell>
                    <TableCell className="text-xs font-mono font-bold text-white">{leader.uid}</TableCell>
                  </TableRow>
                  {teammates.slice(0, teamCount).map((t, i) => (
                    <TableRow key={i} className="border-white/5 hover:bg-black/20">
                      <TableCell className="text-xs font-black text-white">
                        Player {i + 2}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-white">{t.ign}</TableCell>
                      <TableCell className="text-xs font-mono font-bold text-white">{t.uid}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 shadow-[0_0_10px_rgba(255,0,85,0.1)]">
              <p className="text-xs font-semibold text-white/80">
                <Check className="w-3 h-3 inline mr-2 text-cta" />
                Review your team roster. Click "Next" to confirm registration details.
              </p>
            </div>
          </div>
        )}

        {/* Confirm Step */}
        {step === "confirm" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-cta">
              <Trophy className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest text-glow">Confirm Entry</span>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-[1.25rem] p-4 space-y-2 text-sm shadow-inner">
              <Row k="Tournament" v={tournamentTitle} />
              <Row k="Mode" v={mode} />
              {mode !== "Solo" && <Row k="Team" v={leader.teamName} />}
              <Row k="Captain" v={`${leader.ign} (UID ${leader.uid})`} />
              <Row k="Contact" v={`${leader.email} · ${leader.phone}`} />
              {mode !== "Solo" && (
                <div className="pt-2 mt-2 border-t border-white/5">
                  <div className="text-[9px] font-black uppercase tracking-widest text-cta mb-1 text-glow">
                    Roster
                  </div>
                  {teammates.slice(0, teamCount).map((t, i) => (
                    <Row key={i} k={`P${i + 2}`} v={`${t.ign} · ${t.uid}`} />
                  ))}
                </div>
              )}
            </div>
            <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer px-1">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="accent-primary mt-0.5 shrink-0 w-3.5 h-3.5 rounded bg-black/40 border-white/10"
              />
              <span className="font-semibold leading-relaxed">
                I confirm all UIDs are accurate. I accept the <span className="text-cta font-bold">rules</span>, <span className="text-cta font-bold">anti-cheat policy</span>, and consent
                to screenshot verification.
              </span>
            </label>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/5">
          {(step === "team-preview" || step === "confirm") && (
            <Button variant="outline" onClick={handlePreviousStep} className="rounded-xl border-white/10 bg-transparent text-white font-bold hover:bg-white/5 text-xs uppercase tracking-widest">
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          )}
          <div className="flex-1" />
          {step === "confirm" ? (
            <Button onClick={submit} className="rounded-xl font-black bg-cta-gradient text-cta-foreground h-11 shadow-cta border border-cta/50 text-xs uppercase tracking-widest hover:scale-105 transition-transform">
              <Trophy className="w-4 h-4 mr-2" /> LOCK MY SLOT
            </Button>
          ) : (
            <Button
              onClick={handleNextStep}
              className="rounded-xl font-black bg-cta-gradient text-cta-foreground h-11 shadow-cta border border-cta/50 text-xs uppercase tracking-widest hover:scale-105 transition-transform"
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
        className={`w-full bg-black/40 border border-white/10 focus:border-primary focus:bg-black/60 outline-none px-3 font-bold text-white transition-colors shadow-inner placeholder:text-white/20 ${compact ? "h-10 rounded-xl text-sm" : "h-12 rounded-xl text-sm"}`}
      />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 text-xs py-0.5">
      <span className="text-muted-foreground uppercase tracking-widest text-[9px] font-black">{k}</span>
      <span className="font-bold text-white text-right truncate">{v}</span>
    </div>
  );
}
