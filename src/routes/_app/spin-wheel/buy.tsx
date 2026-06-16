import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ShoppingCart,
  Sparkles,
  Zap,
  Gift,
  Crown,
  Ticket,
  Star,
  TrendingUp,
  Flame,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GodCoin } from "@/components/GodCoin";
import { useAuth } from "@/lib/auth-client";
import { confirmDialog } from "@/components/ConfirmDialog";
import { getProfile, getSpinWheelConfig, getSpinWheelStatus, purchaseSpinPack } from "@/api";
import type { SpinPack } from "@/lib/spin-wheel";

export const Route = createFileRoute("/_app/spin-wheel/buy")({
  head: () => ({ meta: [{ title: "Buy Spins — ClutchGround" }] }),
  component: BuySpinsPage,
});

/* ── Pack tier styling ── */
const packTiers = [
  {
    icon: Ticket,
    accent: "text-sky-400",
    bg: "bg-sky-400/10",
    border: "border-sky-400/20",
    badge: null,
  },
  {
    icon: Zap,
    accent: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    badge: null,
  },
  {
    icon: Star,
    accent: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    badge: "Popular",
  },
  {
    icon: TrendingUp,
    accent: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    badge: "Best Value",
  },
  {
    icon: Crown,
    accent: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/20",
    badge: "Premium",
  },
  {
    icon: Flame,
    accent: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-400/20",
    badge: "Mega Pack",
  },
];

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

type SpinStatus = {
  canSpin: boolean;
  freeSpinAvailable: boolean;
  spinCredits: number;
  depositBalance: number;
  winningBalance: number;
  totalBalance: number;
};

function BuySpinsPage() {
  const { user, setUser } = useAuth();
  const [spinPacks, setSpinPacks] = useState<SpinPack[]>([]);
  const [status, setStatus] = useState<SpinStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyingPackId, setBuyingPackId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [config, spinStatus] = await Promise.all([
        getSpinWheelConfig(),
        (getSpinWheelStatus as any)({ data: user.id }),
      ]);
      setSpinPacks(config.spinPacks || []);
      setStatus(spinStatus);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  const syncUserBalances = (p: { deposit_balance?: number; winning_balance?: number }) => {
    if (user && p) {
      setUser({
        ...user,
        deposit_balance: p.deposit_balance,
        winning_balance: p.winning_balance,
      });
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

  const deposit = status?.depositBalance ?? 0;
  const winning = status?.winningBalance ?? 0;
  const totalBalance = deposit + winning;
  const spinCredits = status?.spinCredits ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background page-content flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background page-content pb-28">
      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Link
          to="/spin-wheel"
          className="w-10 h-10 rounded-2xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all press-effect active:scale-90"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground leading-none">
            Spin Wheel
          </span>
          <h1 className="font-display font-black text-xl text-foreground mt-0.5 leading-tight">
            Buy Spins
          </h1>
        </div>
      </div>

      {/* ── Balance & Credits strip ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-4 mt-2"
      >
        <div className="bg-card border border-border/60 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <GodCoin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[9px] uppercase font-black tracking-wider text-muted-foreground">
                Your balance
              </p>
              <p className="font-display font-black text-lg text-foreground flex items-center gap-1">
                {totalBalance}{" "}
                <span className="text-xs font-semibold text-muted-foreground">CG</span>
              </p>
            </div>
          </div>
          {spinCredits > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/25">
              <Ticket className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-primary">
                {spinCredits} spin{spinCredits > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Hero banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="px-4 mt-4"
      >
        <div
          className="relative rounded-2xl overflow-hidden p-5 border border-primary/20"
          style={{
            background: "linear-gradient(135deg, rgba(0,200,255,0.08), rgba(124,58,237,0.08))",
          }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-[50px] pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <p className="font-display font-black text-sm text-foreground">Spin & Win CG Coins</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Buy spin packs to get more chances at winning. Bigger packs = better value per spin.
              Winnings are instantly added to your deposit balance!
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Spin Packs Grid ── */}
      <div className="px-4 mt-5">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 ml-1">
          Available Packs
        </p>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {spinPacks.map((pack, idx) => {
            const tier = packTiers[Math.min(idx, packTiers.length - 1)];
            const TierIcon = tier.icon;
            const canAfford = totalBalance >= pack.cost;
            const needsWinning = pack.cost > deposit;
            const perSpin = (pack.cost / pack.spins).toFixed(1);
            const savingsPercent =
              idx > 0 && spinPacks[0]?.cost
                ? Math.round(
                    (1 - pack.cost / pack.spins / (spinPacks[0].cost / spinPacks[0].spins)) * 100,
                  )
                : 0;

            return (
              <motion.div
                key={pack.id}
                variants={staggerItem}
                className={`relative rounded-2xl border p-4 transition-all ${
                  canAfford
                    ? `${tier.border} bg-card hover:border-opacity-60`
                    : "border-border/30 bg-card/50 opacity-60"
                }`}
              >
                {/* Badge */}
                {tier.badge && (
                  <div
                    className={`absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[9px] font-black ${tier.bg} ${tier.accent} border ${tier.border}`}
                  >
                    {tier.badge}
                  </div>
                )}

                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div
                    className={`w-14 h-14 rounded-2xl ${tier.bg} flex items-center justify-center shrink-0`}
                  >
                    <TierIcon className={`w-7 h-7 ${tier.accent}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-black text-base text-foreground">
                      {pack.label || `${pack.spins} Spin${pack.spins > 1 ? "s" : ""}`}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {perSpin} CG/spin
                      </span>
                      {savingsPercent > 0 && (
                        <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                          Save {savingsPercent}%
                        </span>
                      )}
                    </div>
                    {needsWinning && canAfford && (
                      <p className="text-[9px] text-amber-500 font-semibold mt-1">
                        ⚠ Uses withdrawable balance
                      </p>
                    )}
                  </div>

                  {/* Price + Buy button */}
                  <div className="text-right shrink-0">
                    <p className="flex items-center justify-end gap-1 font-display font-black text-lg text-foreground">
                      <GodCoin className="w-4 h-4" /> {pack.cost}
                    </p>
                    <Button
                      size="sm"
                      disabled={!canAfford || buyingPackId !== null}
                      onClick={() => handleBuyPack(pack)}
                      className="mt-1.5 rounded-xl h-8 px-4 text-xs font-bold relative"
                    >
                      {buyingPackId === pack.id ? (
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : canAfford ? (
                        "Buy"
                      ) : (
                        "Not enough"
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ── Info section ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="px-4 mt-6"
      >
        <div className="rounded-2xl bg-card/50 border border-border/30 p-4 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            How it works
          </p>
          <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
            <li className="flex items-start gap-2">
              <Gift className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                You get <strong className="text-foreground">1 free spin daily</strong> when you join
                at least one tournament
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ShoppingCart className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span>
                Buy spin packs for <strong className="text-foreground">extra spins any time</strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Bigger packs give <strong className="text-foreground">better value per spin</strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
              <span>
                Winnings are <strong className="text-foreground">instantly credited</strong> to your
                deposit balance
              </span>
            </li>
          </ul>
        </div>
      </motion.div>

      {/* ── Back to spin button ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="px-4 mt-5"
      >
        <Button asChild variant="outline" className="w-full h-12 rounded-2xl font-bold">
          <Link to="/spin-wheel">
            <Sparkles className="w-4 h-4 mr-2" /> Back to Spin Wheel
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
