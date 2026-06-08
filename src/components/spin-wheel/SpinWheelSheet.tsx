import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Gift, Zap, Ticket } from "lucide-react";
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
import { confirmDialog } from "@/components/ConfirmDialog";
import {
  getProfile,
  getSpinWheelConfig,
  getSpinWheelStatus,
  performSpin,
  purchaseSpinPack,
} from "@/api";
import { rotationDeltaForSlice, type SpinPack, type SpinSegment } from "@/lib/spin-wheel";
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
  lastSpin: { prizeLabel: string; prizeAmount: number } | null;
};

export function SpinWheelSheet({ open, onOpenChange }: SpinWheelSheetProps) {
  const { user, setUser } = useAuth();
  const [segments, setSegments] = useState<SpinSegment[]>([]);
  const [activePrizeIds, setActivePrizeIds] = useState<string[]>([]);
  const [spinPacks, setSpinPacks] = useState<SpinPack[]>([]);
  const [status, setStatus] = useState<SpinStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [buyingPackId, setBuyingPackId] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const [result, setResult] = useState<{ label: string; amount: number } | null>(null);

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

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [config, spinStatus] = await Promise.all([
        getSpinWheelConfig(),
        (getSpinWheelStatus as any)({ data: user.id }),
      ]);
      setSegments(config.segments);
      setActivePrizeIds(config.activePrizeIds || []);
      setSpinPacks(config.spinPacks || []);
      setStatus(spinStatus);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load spin wheel");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (open && user) refresh();
  }, [open, user, refresh]);

  const runSpinAnimation = (spinResult: {
    sliceIndex: number;
    totalSlices: number;
    label: string;
    amount: number;
  }) => {
    const delta = rotationDeltaForSlice(
      spinResult.sliceIndex,
      spinResult.totalSlices,
      rotationRef.current,
      8,
    );
    const nextRotation = rotationRef.current + delta;
    rotationRef.current = nextRotation;
    setRotation(nextRotation);

    setTimeout(() => {
      setSpinning(false);
      setResult({ label: spinResult.label, amount: spinResult.amount });
      if (spinResult.amount > 0) {
        toast.success(`You won ${spinResult.amount} CG coins!`, {
          description: "Added to your deposit balance",
        });
      } else {
        toast.info("No luck this time!", { description: spinResult.label });
      }
      refresh();
      if (user) {
        (getProfile as any)({ data: user.id }).then((p: any) => syncUserBalances(p));
      }
    }, 5300);
  };

  const handleSpin = async () => {
    if (!user || spinning || !status?.canSpin) return;

    setSpinning(true);
    setResult(null);

    try {
      const spinResult = await (performSpin as any)({ data: user.id });
      runSpinAnimation(spinResult);
    } catch (e: any) {
      setSpinning(false);
      toast.error(e?.message || "Spin failed");
    }
  };

  const handleBuyPack = async (pack: SpinPack) => {
    if (!user || buyingPackId) return;

    const deposit = status?.depositBalance ?? 0;
    const winning = status?.winningBalance ?? 0;
    const total = deposit + winning;

    if (total < pack.cost) {
      toast.error(`You need ${pack.cost} CG coins for this pack`);
      return;
    }

    const shortfall = pack.cost - deposit;
    if (shortfall > 0) {
      const yes = await confirmDialog({
        title: "Use withdrawable coins?",
        description: `Your deposit balance (${deposit} CG) is not enough. ${shortfall} CG will be taken from your withdrawable winnings. Continue?`,
        confirmText: "Yes, buy spins",
        cancelText: "Cancel",
      });
      if (!yes) return;
    }

    setBuyingPackId(pack.id);
    try {
      const res = await (purchaseSpinPack as any)({ data: { userId: user.id, packId: pack.id } });
      toast.success(`+${res.spinsAdded} spin${res.spinsAdded > 1 ? "s" : ""} added!`, {
        description: res.usedWinning
          ? `${res.cost} CG paid (included withdrawable coins)`
          : `${res.cost} CG paid from deposit`,
      });
      syncUserBalances({
        deposit_balance: res.depositBalance,
        winning_balance: res.winningBalance,
      });
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Purchase failed");
    } finally {
      setBuyingPackId(null);
    }
  };

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
                rotation={rotation}
                spinning={spinning}
                size={300}
              />

              <AnimatePresence>
                {result && !spinning && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-2xl bg-card border border-primary/25 px-4 py-3 text-center"
                  >
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                      You won
                    </p>
                    <p className="font-display font-black text-xl text-foreground mt-1 flex items-center justify-center gap-2">
                      {result.amount > 0 ? (
                        <>
                          <GodCoin className="w-6 h-6" />
                          +{result.amount} CG
                        </>
                      ) : (
                        result.label
                      )}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
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
              ) : !status?.canSpin ? (
                "Buy spins below"
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

            {/* Spin packs */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground text-center">
                Buy more spins
              </p>
              <div className="grid grid-cols-2 gap-2">
                {spinPacks.map((pack) => {
                  const deposit = status?.depositBalance ?? 0;
                  const total = status?.totalBalance ?? 0;
                  const needsWinning = pack.cost > deposit;
                  const canAfford = total >= pack.cost;
                  const perSpin = (pack.cost / pack.spins).toFixed(1);

                  return (
                    <button
                      key={pack.id}
                      type="button"
                      disabled={!canAfford || buyingPackId !== null}
                      onClick={() => handleBuyPack(pack)}
                      className={`relative rounded-2xl border p-3 text-left transition-all press-effect active:scale-[0.98] ${
                        canAfford
                          ? "border-border bg-card hover:border-primary/40"
                          : "border-border/50 bg-secondary/20 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      {buyingPackId === pack.id && (
                        <span className="absolute inset-0 flex items-center justify-center bg-card/80 rounded-2xl">
                          <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </span>
                      )}
                      <p className="font-display font-black text-sm text-foreground">
                        {pack.label || `${pack.spins} Spin${pack.spins > 1 ? "s" : ""}`}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {perSpin} CG / spin
                      </p>
                      <p className="flex items-center gap-1 font-bold text-primary text-sm mt-2">
                        <GodCoin className="w-3.5 h-3.5" />
                        {pack.cost} CG
                      </p>
                      {needsWinning && canAfford && (
                        <p className="text-[9px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">
                          Uses withdrawable
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
