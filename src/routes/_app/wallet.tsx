import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Wallet as WalletIcon,
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
  head: () => ({ meta: [{ title: "Wallet — CLUTCHGROUND" }] }),
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
      toast.error("You have no Earned Coins to withdraw! Win tournaments to earn withdrawable coins.");
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
    <div className="bg-background min-h-screen pt-2 pb-safe">
      {/* ─── Minimal App Header ─── */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2 text-cta font-bold mb-1">
          <WalletIcon className="w-5 h-5" /> Account
        </div>
        <h1 className="text-3xl font-display font-black text-white">Wallet</h1>
      </div>

      <div className="px-4 space-y-6">
        {/* ─── Main Balance Card ─── */}
        <div className="relative bg-gradient-to-br from-primary to-[#d95a00] rounded-[1.5rem] p-6 text-white shadow-[0_8px_30px_rgba(217,90,0,0.3)] overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-xl translate-y-1/3 -translate-x-1/3" />

          <div className="relative z-10">
            <span className="text-[11px] uppercase tracking-widest text-white/80 font-bold block mb-1">
              Total Balance
            </span>
            <div className="flex items-center gap-2">
              <GodCoin className="w-8 h-8 text-white drop-shadow-sm" />
              <div className="font-display text-5xl font-black drop-shadow-sm tabular-nums">
                {totalBalance}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[10px] font-bold text-white/80 bg-black/20 px-2.5 py-1 rounded-md border border-white/10 uppercase tracking-widest">
                1 Coin = 1 INR
              </span>
            </div>
          </div>
        </div>

        {/* ─── Action Buttons ─── */}
        <div className="flex gap-3">
          <WalletDepositDialog
            trigger={
              <button className="flex-1 flex flex-col items-center justify-center gap-2 bg-card border border-white/5 active:bg-white/5 transition-colors h-24 rounded-[1.25rem]">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-cta flex items-center justify-center">
                  <ArrowDownToLine className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">Add Cash</span>
              </button>
            }
            onSuccess={handleRefreshTransactions}
          />
          <button
            onClick={handleWithdrawClick}
            className="flex-1 flex flex-col items-center justify-center gap-2 bg-card border border-white/5 active:bg-white/5 transition-colors h-24 rounded-[1.25rem]"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <ArrowUpFromLine className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white uppercase tracking-wider">Withdraw</span>
          </button>
        </div>

        {/* ─── Balance Breakdown ─── */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 ml-4">Breakdown</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-white/5 rounded-[1.25rem] p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1 line-clamp-1">
                Winnings (Out)
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-white">
                <GodCoin className="w-4 h-4 text-emerald-500" />
                <span className="font-display text-xl font-bold tabular-nums">
                  {winningBalance}
                </span>
              </div>
            </div>

            <div className="bg-card border border-white/5 rounded-[1.25rem] p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1 line-clamp-1">
                Deposits (In)
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-white">
                <GodCoin className="w-4 h-4 text-blue-500" />
                <span className="font-display text-xl font-bold tabular-nums">
                  {depositBalance}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Info Box ─── */}
        <div className="flex items-start gap-3 p-4 rounded-[1.25rem] border border-blue-500/20 bg-blue-500/10 text-left">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-blue-400 mb-1">Important Note</p>
            <p className="text-xs leading-relaxed text-blue-400/80">
              Deposit Coins can only be used to pay tournament entry fees. Only Winnings (Earned
              Coins) can be withdrawn to your UPI account.
            </p>
          </div>
        </div>

        {/* ─── Recent Transactions ─── */}
        <div className="pb-4">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 ml-4">Transactions</div>
          
          {loadingTx ? (
            <div className="flex justify-center p-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length > 0 ? (
            <div className="bg-card border border-white/5 rounded-[1.25rem] overflow-hidden">
              {transactions.map((tx, i) => {
                const isPositive = ["deposit_added", "winnings_added", "tournament_prize", "refund"].includes(tx.type);
                return (
                  <div
                    key={tx.id}
                    className={`p-4 flex items-center justify-between ${i !== transactions.length - 1 ? 'border-b border-white/5' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isPositive ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"}`}>
                        {isPositive ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-white truncate pr-2">{tx.description}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 font-sans font-black tabular-nums shrink-0 ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
                      {isPositive ? "+" : "-"}{tx.amount} <GodCoin className="w-3 h-3" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-card border border-white/5 rounded-[1.25rem] p-8 text-center text-muted-foreground">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                <History className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-bold text-white">No transactions yet</p>
              <p className="text-xs mt-1">Play tournaments to start earning.</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Withdrawal Dialog ─── */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-3xl border-white/10 shadow-2xl rounded-[1.5rem]">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-black text-white text-glow">
              Withdraw Funds
            </DialogTitle>
            <DialogDescription className="text-cta text-xs uppercase tracking-widest font-black mt-1">
              Available Winnings: {winningBalance} Coins
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-black text-cta mb-1 ml-1 text-glow">
                Amount (Coins)
              </label>
              <div className="relative">
                <GodCoin className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 z-10 text-cta drop-shadow-[0_0_8px_rgba(255,0,85,0.8)]" />
                <input
                  type="number"
                  placeholder="0"
                  value={withdrawAmount}
                  max={winningBalance}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 focus:border-primary focus:bg-black/60 outline-none pl-12 pr-4 h-14 text-lg font-sans font-black text-white rounded-xl transition-colors tabular-nums shadow-inner placeholder:text-white/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-black text-cta mb-1 ml-1 text-glow">
                UPI ID
              </label>
              <input
                type="text"
                placeholder="Enter UPI ID"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-primary focus:bg-black/60 outline-none px-4 h-12 text-sm font-bold text-white rounded-xl transition-colors shadow-inner placeholder:text-white/20"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-black text-cta mb-1 ml-1 text-glow">
                UPI Mobile Number
              </label>
              <input
                type="tel"
                placeholder="Enter mobile number"
                value={upiNumber}
                onChange={(e) => setUpiNumber(e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-primary focus:bg-black/60 outline-none px-4 h-12 text-sm font-bold text-white rounded-xl transition-colors shadow-inner placeholder:text-white/20"
              />
            </div>

            <Button
              onClick={submitWithdrawal}
              disabled={isSubmitting}
              className="w-full h-14 rounded-xl font-display font-black tracking-widest text-base bg-cta-gradient text-cta-foreground shadow-cta mt-4 uppercase border border-cta/50 hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                "Confirm Withdrawal"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
