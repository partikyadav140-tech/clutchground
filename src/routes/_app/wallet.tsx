import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Wallet as WalletIcon,
  ShieldAlert,
  TrendingUp,
  Info,
  History,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { GodCoin } from "@/components/GodCoin";
import { useAuth } from "../../lib/auth-client";
import { useState, useEffect } from "react";
import { WalletDepositDialog } from "@/components/WalletDepositDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { processWithdrawal, getTransactionHistory } from "../../api";

export const Route = createFileRoute("/_app/wallet")({
  head: () => ({ meta: [{ title: "Wallet — Professional Esports Arena" }] }),
  component: WalletPage,
});

function WalletPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.navigate({ to: "/login" });
    } else if (user) {
      (getTransactionHistory as any)({ data: { userId: user.id, limit: 20, offset: 0 } })
        .then((res: any) => {
          setTransactions(res.transactions || []);
          setLoadingTx(false);
        })
        .catch((err: any) => {
          console.error(err);
          setLoadingTx(false);
        });
    }
  }, [user, authLoading, router]);

  const depositBalance = user?.deposit_balance || 0;
  const winningBalance = user?.winning_balance || 0;
  const totalBalance = depositBalance + winningBalance;

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [upiNumber, setUpiNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRefreshTransactions = () => {
    if (user) {
      (getTransactionHistory as any)({ data: { userId: user.id, limit: 20, offset: 0 } })
        .then((res: any) => {
          setTransactions(res.transactions || []);
        })
        .catch((err: any) => console.error(err));
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleWithdrawClick = () => {
    if (winningBalance <= 0) {
      toast.error(
        "You have no Earned Coins to withdraw! Win tournaments to earn withdrawable coins.",
      );
      return;
    }
    setWithdrawOpen(true);
  };

  const submitWithdrawal = async () => {
    if (!withdrawAmount || !upiId || !upiNumber) {
      toast.error("Please fill in all fields.");
      return;
    }
    const amount = parseInt(withdrawAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Invalid amount.");
      return;
    }
    if (amount > winningBalance) {
      toast.error("You cannot withdraw more than your Earned Coins balance.");
      return;
    }
    setIsSubmitting(true);
    try {
      await (processWithdrawal as any)({ data: { userId: user.id, amount, upiId, upiNumber } });
      toast.success("Withdrawal Requested!", {
        description: "You will receive your money within 2-3 working days.",
      });
      setWithdrawOpen(false);
      setWithdrawAmount("");
      setUpiId("");
      setUpiNumber("");

      const newTxs = await (getTransactionHistory as any)({ data: { userId: user.id, limit: 20, offset: 0 } });
      setTransactions(newTxs.transactions || []);

      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to process withdrawal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* ─── Top Header (Mobile First) ─── */}
      <div className="bg-white rounded-b-[2rem] shadow-[0_4px_24px_oklch(0_0_0/0.04)] pt-6 pb-8 px-4 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-3">
            <WalletIcon className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-black text-foreground">Wallet</h1>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">
            Manage your funds securely
          </p>
        </div>

        {/* Main Balance Card */}
        <div className="relative mt-6 z-10 bg-gradient-to-br from-primary to-[#d95a00] rounded-[1.25rem] p-6 text-white shadow-lg overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl translate-y-1/3 -translate-x-1/3" />

          <div className="relative z-10 text-center">
            <span className="text-xs uppercase tracking-widest text-white/80 font-bold">
              Total Balance
            </span>
            <div className="flex items-center justify-center gap-2 mt-2 mb-1">
              <GodCoin className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-sm" />
              <div className="font-sans text-5xl sm:text-6xl font-semibold drop-shadow-sm tabular-nums">
                {totalBalance}
              </div>
            </div>
            <span className="text-xs font-semibold text-white/90 bg-black/20 px-3 py-1 rounded-full inline-block mt-2">
              1 Coin = 1 INR
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 relative z-10">
          <WalletDepositDialog
            trigger={
              <Button className="flex-1 bg-white border border-primary text-primary hover:bg-primary/5 h-12 rounded-xl font-bold text-sm shadow-sm">
                <ArrowDownToLine className="w-4 h-4 mr-2" /> Add Cash
              </Button>
            }
            onSuccess={handleRefreshTransactions}
          />
          <Button
            className="flex-1 bg-primary text-white hover:bg-primary/90 h-12 rounded-xl font-bold text-sm shadow-md"
            onClick={handleWithdrawClick}
          >
            <ArrowUpFromLine className="w-4 h-4 mr-2" /> Withdraw
          </Button>
        </div>
      </div>

      <div className="px-4 mt-6">
        {/* Balance Breakdown */}
        <h3 className="font-display font-black text-lg text-foreground mb-3 px-1">
          Balance Breakdown
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-[1rem] border border-border p-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
              Winnings (Withdrawable)
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <GodCoin className="w-5 h-5" />
              <span className="font-sans text-2xl font-semibold text-emerald-600 tabular-nums">
                {winningBalance}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-[1rem] border border-border p-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
              Deposits (Entry Only)
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <GodCoin className="w-5 h-5" />
              <span className="font-sans text-2xl font-semibold text-blue-600 tabular-nums">
                {depositBalance}
              </span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-100 bg-blue-50 mb-8 shadow-sm">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-bold font-display tracking-wide mb-1">Important Note</p>
            <p className="text-xs leading-relaxed text-blue-700/80">
              Deposit Coins can only be used to pay tournament entry fees. Only Winnings (Earned
              Coins) can be withdrawn to your UPI account.
            </p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-display font-black text-lg text-foreground">Transactions</h3>
        </div>

        {loadingTx ? (
          <div className="flex justify-center p-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const isPositive = [
                "deposit_added",
                "winnings_added",
                "tournament_prize",
                "refund",
              ].includes(tx.type);
              return (
                <div
                  key={tx.id}
                  className="bg-white rounded-[1rem] border border-border p-4 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}
                    >
                      {isPositive ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{tx.description}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-1 font-sans font-semibold tabular-nums ${isPositive ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {isPositive ? "+" : "-"} <GodCoin className="w-3 h-3" /> {tx.amount}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-[1.25rem] border border-border p-8 text-center text-muted-foreground shadow-sm">
            <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3">
              <History className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-bold text-foreground">No transactions yet</p>
            <p className="text-xs mt-1">Play tournaments to start earning.</p>
          </div>
        )}
      </div>

      {/* Withdrawal Dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="w-[90vw] max-w-md bg-white border-0 rounded-[1.5rem] p-0 overflow-hidden">
          <div className="bg-primary p-6 text-white text-center relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
            <DialogTitle className="font-display text-2xl font-black tracking-tight">
              Withdraw Funds
            </DialogTitle>
            <DialogDescription className="text-white/80 text-xs uppercase tracking-widest font-bold mt-2">
              Available Winnings: {winningBalance} Coins
            </DialogDescription>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
                Amount (Coins) *
              </label>
              <div className="relative">
                <GodCoin className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 z-10" />
                <input
                  type="number"
                  placeholder="0"
                  value={withdrawAmount}
                  max={winningBalance}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-secondary/30 border border-border focus:border-primary focus:bg-white outline-none pl-12 pr-4 h-14 text-lg font-sans font-semibold rounded-xl transition-all shadow-sm tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
                UPI ID *
              </label>
              <input
                type="text"
                placeholder="Enter UPI ID"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full bg-secondary/30 border border-border focus:border-primary focus:bg-white outline-none px-4 h-12 text-sm font-semibold rounded-xl transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
                UPI Mobile Number *
              </label>
              <input
                type="tel"
                placeholder="Enter mobile number"
                value={upiNumber}
                onChange={(e) => setUpiNumber(e.target.value)}
                className="w-full bg-secondary/30 border border-border focus:border-primary focus:bg-white outline-none px-4 h-12 text-sm font-semibold rounded-xl transition-all shadow-sm"
              />
            </div>

            <Button
              onClick={submitWithdrawal}
              disabled={isSubmitting}
              className="w-full h-14 rounded-xl font-display font-bold tracking-wider text-base bg-primary text-white shadow-lg mt-2"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                "CONFIRM WITHDRAWAL"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
