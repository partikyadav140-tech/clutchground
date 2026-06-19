import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Info,
  TrendingUp,
  Phone,
  AtSign,
  ChevronLeft,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { GodCoin } from "@/components/GodCoin";
import { useAuth } from "../../lib/auth-client";
import { useState, useEffect, useMemo } from "react";
import { WalletDepositDialog } from "@/components/WalletDepositDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { processWithdrawal, getTransactionHistory, saveUpiId, getSiteSettings, checkPendingDeposit } from "../../api";
import { motion, AnimatePresence } from "framer-motion";

import { AnimatedCounter } from "@/components/AnimatedCounter";
import { SkeletonWallet } from "@/components/SkeletonPage";

export const Route = createFileRoute("/_app/wallet")({
  head: () => ({ meta: [{ title: "Wallet — CLUTCHGROUND" }] }),
  component: WalletPage,
});

function WalletPage() {
  const { user, loading: authLoading, setUser } = useAuth();
  const isTutorialActive = false;
  const router = useRouter();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [upiPhone, setUpiPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [upiSettingsOpen, setUpiSettingsOpen] = useState(false);
  const [primaryUpi, setPrimaryUpi] = useState("");
  const [savingUpi, setSavingUpi] = useState(false);

  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});

  const [pendingDeposit, setPendingDeposit] = useState<{ hasPending: boolean; deposit: any } | null>(null);

  const loadSettings = async () => {
    try {
      const settings = await getSiteSettings();
      setSiteSettings(settings);
    } catch {}
  };

  const depositBal = (user as any)?.deposit_balance || 0;
  const winBal = (user as any)?.winning_balance || 0;
  const totalBal = depositBal + winBal;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const loadTx = async () => {
    if (!user) return;
    try {
      const res = await (getTransactionHistory as any)({
        data: { userId: user.id, limit: 30, offset: 0 },
      });
      setTransactions(res.transactions || []);
    } catch {}
    setLoadingTx(false);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.navigate({ to: "/login" });
      return;
    }
    if (user) {
      loadTx();
      loadSettings();
      if ((user as any).upi_id) setPrimaryUpi((user as any).upi_id);
      // Check for pending deposits
      checkPendingDeposit()
        .then((result) => setPendingDeposit(result as any))
        .catch(() => {});
    }
  }, [user, authLoading]);

  const transactionsWithBalance = useMemo(() => {
    let runningBal = totalBal;
    return transactions.slice(0, 10).map((tx) => {
      const isCredit = ["deposit_added", "winnings_added", "tournament_prize", "refund"].includes(
        tx.type,
      );
      const balanceAfter = runningBal;
      if (isCredit) {
        runningBal -= tx.amount;
      } else {
        runningBal += tx.amount;
      }
      return { ...tx, balanceAfter, isCredit };
    });
  }, [transactions, totalBal]);

  const handleSaveUpi = async () => {
    if (!primaryUpi.trim()) return toast.error("Please enter a valid UPI ID");
    setSavingUpi(true);
    try {
      await (saveUpiId as any)({ data: { userId: user!.id, upiId: primaryUpi.trim() } });
      toast.success("Primary UPI ID saved!");
      setUser({ ...user, upi_id: primaryUpi.trim() });
      setUpiSettingsOpen(false);
    } catch (err: any) {
      toast.error("Failed to save UPI ID");
    } finally {
      setSavingUpi(false);
    }
  };

  const handleWithdraw = async () => {
    const amt = parseInt(amount, 10);
    if (!amount || !upiId || !upiPhone) return toast.error("Fill all fields");
    if (isNaN(amt) || amt <= 0) return toast.error("Invalid amount");
    if (amt > winBal) return toast.error("Insufficient winnings balance");
    setSubmitting(true);
    try {
      await (processWithdrawal as any)({
        data: { userId: user!.id, amount: amt, upiId, upiNumber: upiPhone },
      });
      toast.success("Withdrawal requested! You'll receive funds in 2-3 days.");
      setWithdrawOpen(false);
      setAmount("");
      setUpiId("");
      setUpiPhone("");
      await loadTx();
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Withdrawal failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted || authLoading || !user) {
    return (
      <div className="min-h-screen bg-background pb-[80px]">
        <div className="px-4 pt-5 pb-2">
          <div className="w-12 h-2 rounded-full bg-secondary animate-pulse mb-1" />
          <div className="w-28 h-6 rounded-full bg-secondary animate-pulse" />
        </div>
        <SkeletonWallet />
      </div>
    );
  }

  const startTime = siteSettings.deposit_start_time || "09:00";
  const endTime = siteSettings.deposit_end_time || "22:00";

  const isWithinDepositHours = (startStr: string, endStr: string) => {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });
      const [currentHours, currentMinutes] = formatter.format(new Date()).split(":").map(Number);
      const currentTotal = currentHours * 60 + currentMinutes;

      const [startH, startM] = startStr.split(":").map(Number);
      const [endH, endM] = endStr.split(":").map(Number);
      const startTotal = startH * 60 + startM;
      const endTotal = endH * 60 + endM;

      if (startTotal <= endTotal) {
        return currentTotal >= startTotal && currentTotal <= endTotal;
      } else {
        return currentTotal >= startTotal || currentTotal <= endTotal;
      }
    } catch {
      return true; // Fallback
    }
  };

  const formatTimeStr = (timeStr: string) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 || 12;
    return `${displayH}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const depositsAllowed = isWithinDepositHours(startTime, endTime);
  const addCashLocked = !depositsAllowed;

  return (
    <div className="min-h-screen bg-background pb-[80px]">
      {/* ── Header ── */}
      <div className="px-4 pt-5 pb-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
          Account
        </p>
        <h1 className="font-display font-black text-2xl text-foreground">My Wallet</h1>
      </div>

      {/* ── Balance Card with Actions ── */}
      <div className="px-4 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden"
          id="tutorial-wallet-balance"
          style={{ background: "linear-gradient(135deg, #0a1628 0%, #0d1f3c 50%, #0a1628 100%)" }}
        >
          {/* Decorative rings */}
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full border border-primary/10" />
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full border border-primary/8" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full border border-neon/10" />
          <div
            className="absolute top-0 left-0 w-full h-1 rounded-t-3xl"
            style={{ background: "var(--gradient-primary)" }}
          />

          {/* Balance */}
          <div className="px-5 pt-5 pb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-1.5">
              Total Balance
            </p>
            <div className="flex items-center gap-3 mb-4">
              <GodCoin className="w-8 h-8 text-white" />
              <span className="font-display font-black text-4xl text-white tabular-nums leading-none">
                <AnimatedCounter value={totalBal} />
              </span>
              <span className="text-sm font-bold text-white/40 self-end mb-0.5">Coins</span>
            </div>

            {/* Breakdown row */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div
                className="rounded-xl px-3 py-2 border"
                style={{ background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.2)" }}
              >
                <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">Winnings</p>
                <div className="flex items-center gap-1">
                  <GodCoin className="w-3 h-3 text-emerald-400" />
                  <span className="font-display font-black text-lg text-white tabular-nums">
                    <AnimatedCounter value={winBal} />
                  </span>
                </div>
              </div>
              <div
                className="rounded-xl px-3 py-2 border"
                style={{ background: "rgba(0,200,255,0.08)", borderColor: "rgba(0,200,255,0.2)" }}
              >
                <p className="text-[8px] font-black uppercase tracking-widest mb-0.5" style={{ color: "var(--primary)" }}>Deposited</p>
                <div className="flex items-center gap-1">
                  <GodCoin className="w-3 h-3 text-primary" />
                  <span className="font-display font-black text-lg text-white tabular-nums">
                    <AnimatedCounter value={depositBal} />
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons inside card */}
            <div id="tutorial-wallet-actions" className="grid grid-cols-2 gap-2">
              <div id="tutorial-wallet-addcash">
                <WalletDepositDialog
                  primaryUpi={primaryUpi}
                  locked={addCashLocked || !primaryUpi}
                  onLockedClick={() => {
                    if (!primaryUpi && !isTutorialActive) {
                      toast.error("Please set your Primary UPI ID first");
                      setUpiSettingsOpen(true);
                      return;
                    }
                    if (addCashLocked && !isTutorialActive) {
                      toast.error(
                        `Deposits closed. Timings: ${formatTimeStr(startTime)} - ${formatTimeStr(endTime)} IST`,
                      );
                      return;
                    }
                  }}
                  trigger={
                    <button
                      type="button"
                      className={`w-full h-12 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all press-effect active:scale-95 ${
                        (!primaryUpi || addCashLocked) && !isTutorialActive
                          ? "bg-white/5 text-white/30 border border-white/10"
                          : "text-white border border-primary/30"
                      }`}
                      style={
                        !(!primaryUpi || addCashLocked) || isTutorialActive
                          ? { background: "var(--gradient-primary)" }
                          : undefined
                      }
                    >
                      <ArrowDownToLine className="w-4 h-4" />
                      Add Cash
                    </button>
                  }
                  onSuccess={loadTx}
                />
              </div>
              <button
                id="tutorial-wallet-withdraw"
                onClick={() => {
                  if (!primaryUpi && !isTutorialActive) {
                    toast.error("Please set your Primary UPI ID first");
                    setUpiSettingsOpen(true);
                    return;
                  }
                  if (winBal <= 0 && !isTutorialActive) {
                    toast.error("No winnings to withdraw. Win tournaments first!");
                    return;
                  }
                  setUpiId(primaryUpi || "dummy@upi");
                  setWithdrawOpen(true);
                }}
                className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest text-white border border-emerald-500/30 press-effect active:scale-95 transition-all"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
              >
                <ArrowUpFromLine className="w-4 h-4" />
                Withdraw
              </button>
            </div>
          </div>

          {/* Deposit timing strip */}
          <div
            className="px-5 py-2 flex items-center justify-between"
            style={{ background: addCashLocked ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.06)", borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" style={{ color: addCashLocked ? "#f87171" : "#10b981" }} />
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: addCashLocked ? "#f87171" : "#10b981" }}>
                {addCashLocked ? "Deposits Closed" : "Deposits Open"}
              </span>
            </div>
            <span className="text-[9px] font-bold text-white/40">
              {formatTimeStr(startTime)} – {formatTimeStr(endTime)} IST
            </span>
          </div>
        </motion.div>
      </div>

      {/* ── Pending Deposit (compact) ── */}
      {pendingDeposit?.hasPending && (
        <div className="px-4 mb-3">
          <div className="flex items-center gap-2.5 p-3 rounded-2xl border bg-amber-500/8 border-amber-500/20">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
            <p className="text-xs font-bold text-muted-foreground flex-1">
              Deposit of <strong className="text-foreground">₹{pendingDeposit.deposit?.amount}</strong> awaiting review
            </p>
            <span className="text-[9px] font-black text-amber-500 uppercase shrink-0">
              {pendingDeposit.deposit?.status === "submitted" ? "Under Review" : "Pending"}
            </span>
          </div>
        </div>
      )}

      {/* ── UPI Row (compact) ── */}
      <div className="px-4 mb-4">
        <div
          id="tutorial-wallet-upi"
          className="flex items-center gap-3 p-3 bg-card border border-border rounded-2xl shadow-card"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
            <AtSign className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Primary UPI</p>
            {primaryUpi ? (
              <p className="font-mono text-xs font-bold text-foreground truncate">{primaryUpi}</p>
            ) : (
              <p className="text-xs font-bold text-red-500">Not set</p>
            )}
          </div>
          <button
            onClick={() => setUpiSettingsOpen(true)}
            className="shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border press-effect active:scale-95 transition-all"
            style={{
              color: primaryUpi ? "var(--primary)" : "#f87171",
              borderColor: primaryUpi ? "rgba(0,200,255,0.2)" : "rgba(248,113,113,0.3)",
              background: primaryUpi ? "rgba(0,200,255,0.08)" : "rgba(248,113,113,0.08)",
            }}
          >
            {primaryUpi ? "Edit" : "Set Now"}
          </button>
        </div>
      </div>

      {/* ── Info + Coin Rate ── */}
      <div className="px-4 mb-4">
        <div
          className="flex items-center gap-2.5 p-3 rounded-2xl border"
          style={{ background: "rgba(0,200,255,0.04)", borderColor: "rgba(0,200,255,0.12)" }}
        >
          <Info className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--primary)" }} />
          <p className="text-[10px] font-semibold leading-relaxed" style={{ color: "rgba(0,200,255,0.7)" }}>
            <span className="font-black text-primary">1 Coin = ₹1</span> · Deposits pay entry fees. Only <span className="font-black">Winnings</span> can be withdrawn.
          </p>
        </div>
      </div>

      {/* ── Transactions ── */}
      <div className="px-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full" style={{ background: "var(--gradient-primary)" }} />
          <h2 className="font-display font-black text-sm text-foreground uppercase tracking-wide">
            Recent Transactions (Last 10)
          </h2>
        </div>

        {loadingTx ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactionsWithBalance.length > 0 ? (
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-card">
            {transactionsWithBalance.map((tx, i) => {
              const { isCredit, balanceAfter } = tx;
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.4) }}
                  className={`flex items-center gap-3 px-4 py-3.5 ${i < transactionsWithBalance.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isCredit ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {isCredit ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{tx.description}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString([], {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`block font-display font-black text-sm tabular-nums ${isCredit ? "text-emerald-500" : "text-red-500"}`}
                    >
                      {isCredit ? "+" : "-"}
                      {tx.amount}
                      <GodCoin className="w-3 h-3 inline ml-1 mb-0.5" />
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground">
                      Bal: {balanceAfter}{" "}
                      <GodCoin className="w-2.5 h-2.5 inline opacity-50 mb-0.5" />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 bg-card rounded-2xl border border-border text-center shadow-card">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
              <History className="w-6 h-6 text-muted-foreground opacity-40" />
            </div>
            <p className="font-display font-black text-base text-foreground">No Transactions Yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add cash or win tournaments to get started.
            </p>
          </div>
        )}
      </div>

      {/* ── Withdraw Dialog ── */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent
          id="tutorial-withdraw-dialog"
          className="rounded-3xl border border-border bg-card max-h-[90vh] overflow-y-auto"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="font-display font-black text-xl text-foreground">
              Withdraw Winnings
            </DialogTitle>
          </DialogHeader>

          <div
            className="mb-3 p-3 rounded-2xl border"
            style={{ background: "rgba(16,185,129,0.06)", borderColor: "rgba(16,185,129,0.2)" }}
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">
              Available to Withdraw
            </p>
            <div className="flex items-center gap-1.5">
              <GodCoin className="w-4 h-4 text-emerald-400" />
              <span className="font-display font-black text-2xl text-foreground">{winBal}</span>
              <span className="text-sm text-muted-foreground">Coins</span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Amount */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">
                Amount (Coins)
              </label>
              <div className="relative">
                <GodCoin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                <input
                  type="number"
                  placeholder="e.g. 100"
                  value={amount}
                  max={winBal}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-14 bg-secondary border border-border focus:border-primary/60 rounded-2xl pl-12 pr-4 text-lg font-black text-foreground outline-none transition-all tabular-nums"
                />
              </div>
              {/* Quick amounts */}
              <div className="flex gap-2 mt-2">
                {[50, 100, 200, winBal].filter(Boolean).map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(String(v))}
                    className="flex-1 h-8 rounded-xl text-xs font-black border border-border bg-secondary text-foreground press-effect active:scale-95"
                  >
                    {v === winBal ? "Max" : v}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">
                UPI ID
              </label>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={primaryUpi}
                  disabled
                  className="w-full h-14 bg-secondary border border-border rounded-2xl pl-12 pr-4 text-sm font-semibold text-muted-foreground outline-none cursor-not-allowed"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">
                UPI Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="10-digit number"
                  value={upiPhone}
                  onChange={(e) => setUpiPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="w-full h-14 bg-secondary border border-border focus:border-primary/60 rounded-2xl pl-12 pr-4 text-sm font-semibold text-foreground outline-none transition-all"
                />
              </div>
            </div>

            <button
              onClick={handleWithdraw}
              disabled={submitting}
              className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest text-white flex items-center justify-center gap-2 mt-2 press-effect active:scale-95"
              style={{
                background: submitting
                  ? "var(--secondary)"
                  : "linear-gradient(135deg, #10b981, #059669)",
              }}
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                  Processing...
                </>
              ) : (
                "Confirm Withdrawal"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── UPI Settings Dialog ── */}
      <Dialog open={upiSettingsOpen} onOpenChange={setUpiSettingsOpen}>
        <DialogContent
          className="rounded-3xl border border-border bg-card"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="font-display font-black text-xl text-foreground">
              Payment Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">
                Primary UPI ID
              </label>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="e.g. phone@paytm"
                  value={primaryUpi}
                  onChange={(e) => setPrimaryUpi(e.target.value)}
                  className="w-full h-14 bg-secondary border border-border focus:border-primary/60 rounded-2xl pl-12 pr-4 text-sm font-semibold text-foreground outline-none transition-all"
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                Make sure you enter your correct active UPI ID. You must use this exact same UPI to
                add funds to your wallet.
              </p>
            </div>
            <button
              onClick={handleSaveUpi}
              disabled={savingUpi}
              className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest text-white flex items-center justify-center gap-2 press-effect active:scale-95"
              style={{ background: savingUpi ? "var(--secondary)" : "var(--gradient-primary)" }}
            >
              {savingUpi ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Save UPI ID"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
