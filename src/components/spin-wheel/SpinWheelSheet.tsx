import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Gift, Zap, Ticket, ShoppingCart, ChevronRight, Lock, Trophy, CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GodCoin } from "@/components/GodCoin";
import { SpinWheel } from "./SpinWheel";
import { RewardCelebration } from "./RewardCelebration";
import { getProfile, getSpinWheelConfig, getSpinWheelStatus, performSpin } from "@/api";
import { type SpinSegment } from "@/lib/spin-wheel";
import { useAuth } from "@/lib/auth-client";

type SpinWheelSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type SpinStatus = {
  canSpin: boolean;
  freeSpinAvailable: boolean;
  usedFreeToday: boolean;
  spinCredits: number;
  depositBalance: number;
  winningBalance: number;
  totalBalance: number;
  minDeposit: number;
  joinedTournamentCount: number;
  lastSpin: { prizeLabel: string; prizeAmount: number } | null;
};

export function SpinWheelSheet({ open, onOpenChange }: SpinWheelSheetProps) {
  const { user, setUser } = useAuth();
  const [segments, setSegments] = useState<SpinSegment[]>([]);
  const [activePrizeIds, setActivePrizeIds] = useState<string[]>([]);
  const [status, setStatus] = useState<SpinStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [targetSliceIndex, setTargetSliceIndex] = useState<number | null>(null);
  const [result, setResult] = useState<{ label: string; amount: number } | null>(null);
  const [celebrationOpen, setCelebrationOpen] = useState(false);

  const syncUserBalances = useCallback(
    (p: { deposit_balance?: number; winning_balance?: number }) => {
      if (user && p) {
        setUser({
          ...user,
          deposit_balance: p.deposit_balance,
          winning_balance: p.winning_balance,
        });
      }
    },
    [user, setUser],
  );

  const refresh = useCallback(
    async (silent = false) => {
      if (!user) return;
      if (!silent) setLoading(true);
      try {
        const [config, spinStatus] = await Promise.all([
          getSpinWheelConfig(),
          (getSpinWheelStatus as any)({ data: user.id }),
        ]);
        setSegments(config.segments);
        setActivePrizeIds(config.activePrizeIds || []);
        setStatus(spinStatus);
      } catch (e: any) {
        toast.error(e?.message || "Failed to load spin wheel");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    if (open && user) refresh();
  }, [open, user, refresh]);

  const handleSpin = async () => {
    if (!user || spinning || !status?.canSpin) return;

    setSpinning(true);
    setTargetSliceIndex(null);
    setResult(null);

    try {
      const spinResult = await (performSpin as any)({ data: user.id });
      setTargetSliceIndex(spinResult.sliceIndex);
      setResult({ label: spinResult.label, amount: spinResult.amount });
    } catch (e: any) {
      setSpinning(false);
      setTargetSliceIndex(null);
      toast.error(e?.message || "Spin failed");
    }
  };

  const handleSpinFinished = useCallback(
    (winningSegment: SpinSegment) => {
      setSpinning(false);
      setTargetSliceIndex(null);
      setCelebrationOpen(true);
      refresh(true); // silent refresh
      if (user) {
        (getProfile as any)({ data: user.id }).then((p: any) => syncUserBalances(p));
      }
    },
    [user, refresh, syncUserBalances],
  );

  const spinCredits = status?.spinCredits ?? 0;
  const freeAvailable = status?.freeSpinAvailable ?? false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md px-4 pb-6 border-border bg-background">
        <DialogHeader className="pt-2">
          <DialogTitle className="font-display font-black text-xl flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Spin Wheel
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground">
            Free daily spin + buy extra chances with CG coins.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {status?.joinedTournamentCount === 0 && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-bold text-amber-300">Daily Free Spin Locked</p>
                    <p className="text-[10px] text-amber-200/70">Join a tournament to unlock</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-amber-200/90 leading-relaxed font-semibold">
                    Follow these steps to unlock your free daily spin:
                  </p>
                  <div className="space-y-2">
                    {[
                      { step: 1, text: "Go to the Tournament Arena", icon: Trophy },
                      { step: 2, text: "Pick a tournament & tap Join", icon: CheckCircle2 },
                      { step: 3, text: "Fill in your game details", icon: CheckCircle2 },
                      { step: 4, text: "Come back here — free spin unlocked!", icon: Gift },
                    ].map(({ step, text, icon: Icon }) => (
                      <div key={step} className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-black text-amber-400">{step}</span>
                        </div>
                        <Icon className="w-3 h-3 text-amber-400/60 shrink-0" />
                        <span className="text-xs text-amber-200/80">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-amber-200/60 italic">
                  This applies to all users — new or existing. Join once, unlock forever!
                </p>
                <Button
                  asChild
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg mt-1 w-full"
                  onClick={() => onOpenChange(false)}
                >
                  <Link to="/tournaments">Browse Tournaments</Link>
                </Button>
              </div>
            )}

            {/* Credits strip */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {freeAvailable && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                  <Gift className="w-3 h-3" /> Free spin ready
                </span>
              )}
              {spinCredits > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-[11px] font-bold">
                  <Ticket className="w-3 h-3" /> {spinCredits} paid spin{spinCredits > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="relative rounded-3xl bg-gradient-to-b from-primary/5 via-card/50 to-card p-5 pt-8">
              <SpinWheel
                segments={segments}
                activePrizeIds={activePrizeIds}
                isSpinning={spinning}
                targetSliceIndex={targetSliceIndex}
                onFinished={handleSpinFinished}
                size={300}
              />
            </div>

            <Button
              className="w-full h-12 rounded-2xl font-display font-black text-base"
              disabled={!status?.canSpin || spinning || !user}
              onClick={handleSpin}
            >
              {spinning ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Spinning...
                </span>
              ) : status?.joinedTournamentCount === 0 ? (
                <span className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Join a tournament to unlock
                </span>
              ) : !status?.canSpin ? (
                "No spins — buy more below"
              ) : freeAvailable ? (
                <span className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Spin free
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Spin ({spinCredits} left)
                </span>
              )}
            </Button>

            {/* Buy more spins CTA */}
            <Link
              to="/spin-wheel/buy"
              onClick={() => onOpenChange(false)}
              className="flex items-center justify-between w-full p-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-primary/5 hover:border-primary/40 transition-all group press-effect"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-display font-black text-sm text-foreground">Buy more spins</p>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                    Get bonus spins & exclusive offers
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </div>
        )}

        <RewardCelebration
          open={celebrationOpen}
          onClose={() => setCelebrationOpen(false)}
          prize={result}
        />
      </DialogContent>
    </Dialog>
  );
}
