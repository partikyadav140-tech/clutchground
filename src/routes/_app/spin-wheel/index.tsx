import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, Gift, Zap, Ticket, ShoppingCart, ChevronRight, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { GodCoin } from "@/components/GodCoin";
import { SpinWheel } from "@/components/spin-wheel/SpinWheel";
import { SkeletonSpinWheel } from "@/components/SkeletonPage";
import { RewardCelebration } from "@/components/spin-wheel/RewardCelebration";
import { useAuth } from "@/lib/auth-client";
import { getProfile, getSpinWheelConfig, getSpinWheelStatus, performSpin } from "@/api";
import { type SpinSegment } from "@/lib/spin-wheel";

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
  joinedTournamentCount: number;
  lastSpin: { prizeLabel: string; prizeAmount: number } | null;
};

function SpinWheelPage() {
  const { user, setUser } = useAuth();
  const [segments, setSegments] = useState<SpinSegment[]>([]);
  const [activePrizeIds, setActivePrizeIds] = useState<string[]>([]);
  const [status, setStatus] = useState<SpinStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [targetSliceIndex, setTargetSliceIndex] = useState<number | null>(null);
  const [result, setResult] = useState<{ label: string; amount: number } | null>(null);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const navigate = useNavigate();

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
    if (user) refresh();
  }, [user, refresh]);

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
        Spin once per day for free if you have joined at least one tournament. Winnings go to
        deposit balance.
      </p>

      {loading ? (
        <SkeletonSpinWheel />
      ) : (
        <div className="space-y-4">
          {status?.joinedTournamentCount === 0 && (
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-primary/5 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-display font-black text-sm text-foreground">Unlock Your Daily Free Spin</p>
                  <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                    Complete the steps below to start winning
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40 border border-border/60">
                  <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[11px] font-black text-primary">1</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Join a Tournament</p>
                    <p className="text-[11px] text-muted-foreground font-semibold mt-0.5 leading-relaxed">
                      Browse upcoming Free Fire tournaments and register your team. Entry is instant.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40 border border-border/60">
                  <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[11px] font-black text-primary">2</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Come Back Daily</p>
                    <p className="text-[11px] text-muted-foreground font-semibold mt-0.5 leading-relaxed">
                      Once unlocked, you get one free spin every day. Winnings go straight to your deposit balance.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40 border border-border/60">
                  <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[11px] font-black text-primary">3</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Win CG Coins</p>
                    <p className="text-[11px] text-muted-foreground font-semibold mt-0.5 leading-relaxed">
                      Each spin rewards real coins. Use them for tournament entries or withdraw your winnings.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                asChild
                className="w-full h-11 rounded-xl font-display font-black text-xs uppercase tracking-wider"
                style={{ background: "var(--gradient-cta)" }}
              >
                <Link to="/tournaments">
                  <span className="flex items-center gap-2">Join a Tournament to Unlock</span>
                </Link>
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

          {/* Wheel */}
          <div className="relative rounded-3xl bg-gradient-to-b from-primary/5 via-card/50 to-card p-5 pt-8 flex flex-col items-center">
            <SpinWheel
              segments={segments}
              activePrizeIds={activePrizeIds}
              isSpinning={spinning}
              targetSliceIndex={targetSliceIndex}
              onFinished={handleSpinFinished}
              size={280}
            />
          </div>

          {/* Spin Button */}
          <Button
            className="w-full h-12 rounded-2xl font-display font-black text-base"
            disabled={spinning || !user}
            onClick={() => {
              if (status?.joinedTournamentCount === 0) {
                navigate({ to: "/tournaments" });
                return;
              }
              handleSpin();
            }}
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
    </div>
  );
}
