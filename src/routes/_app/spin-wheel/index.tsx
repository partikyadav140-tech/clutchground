import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, Gift, Zap, Ticket, ShoppingCart, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { GodCoin } from "@/components/GodCoin";
import { SpinWheel } from "@/components/spin-wheel/SpinWheel";
import { useAuth } from "@/lib/auth-client";
import {
  getProfile,
  getSpinWheelConfig,
  getSpinWheelStatus,
  performSpin,
} from "@/api";
import { rotationDeltaForSlice, type SpinSegment } from "@/lib/spin-wheel";

export const Route = createFileRoute("/_app/spin-wheel/")({
  head: () => ({ meta: [{ title: "Spin Wheel — ClutchGround" }] }),
  component: SpinWheelPage,
});

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

function SpinWheelPage() {
  const { user, setUser } = useAuth();
  const [segments, setSegments] = useState<SpinSegment[]>([]);
  const [activePrizeIds, setActivePrizeIds] = useState<string[]>([]);
  const [status, setStatus] = useState<SpinStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
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
      setStatus(spinStatus);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load spin wheel");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

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
      10,
    );
    const nextRotation = rotationRef.current + delta;
    rotationRef.current = nextRotation;
    setRotation(nextRotation);

    setTimeout(() => {
      setSpinning(false);
      setTimeout(() => {
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
      }, 800);
    }, 7200);
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

  const spinCredits = status?.spinCredits ?? 0;
  const freeAvailable = status?.freeSpinAvailable ?? false;

  if (!user) {
    return (
      <div className="page-content min-h-[60vh] pb-8">
        <PageHeader eyebrow="Rewards" eyebrowIcon={Sparkles} title="Daily spin wheel" />
        <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground">Login to spin the wheel and win CG coins.</p>
          <Button asChild className="rounded-xl font-bold">
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content min-h-[60vh] pb-24">
      <PageHeader eyebrow="Rewards" eyebrowIcon={Sparkles} title="Daily spin wheel" />
      <p className="text-sm text-muted-foreground -mt-1 mb-4">
        Spin once per day with {">="} {status?.minDeposit || 100} CG deposit coins. Winnings go to deposit balance.
      </p>

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

          {/* Wheel */}
          <div className="relative rounded-3xl bg-gradient-to-b from-primary/5 via-card/50 to-card p-5 pt-8 flex flex-col items-center">
            <SpinWheel
              segments={segments}
              activePrizeIds={activePrizeIds}
              rotation={rotation}
              spinning={spinning}
              size={280}
            />

            <AnimatePresence>
              {result && !spinning && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 w-full rounded-2xl bg-card border border-primary/25 px-4 py-3 text-center"
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

          {/* Spin Button */}
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
            className="flex items-center justify-between w-full p-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-primary/5 hover:border-primary/40 transition-all group press-effect"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-display font-black text-sm text-foreground">Buy more spins</p>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Get bonus spins & exclusive offers</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        </div>
      )}
    </div>
  );
}
