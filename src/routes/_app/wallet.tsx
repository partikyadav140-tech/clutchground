import { createFileRoute, useRouter } from "@tanstack/react-router";
import { PageHeader } from "./tournaments";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine, ArrowUpFromLine, Wallet as WalletIcon, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { GodCoin } from "@/components/GodCoin";
import { useAuth } from "../../lib/auth-client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { processWithdrawal } from "../../api";

export const Route = createFileRoute("/_app/wallet")({
  head: () => ({ meta: [{ title: "Wallet — GOD ESPORTS" }] }),
  component: WalletPage,
});

function WalletPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const depositBalance = user?.deposit_balance || 0;
  const winningBalance = user?.winning_balance || 0;
  const totalBalance = depositBalance + winningBalance;

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [upiNumber, setUpiNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWithdrawClick = () => {
    if (winningBalance <= 0) {
      toast.error("You have no Earned Coins to withdraw! Win tournaments to earn withdrawable coins.");
      return;
    }
    setWithdrawOpen(true);
  };

  const submitWithdrawal = async () => {
    if (!withdrawAmount || !upiId || !upiNumber) {
      toast.error("Please fill in all fields (Amount, UPI ID, and UPI Number).");
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
      await (processWithdrawal as any)({
        data: {
          userId: user.id,
          amount,
          upiId,
          upiNumber
        }
      });
      toast.success("Withdrawal Requested!", {
        description: "You will receive your money within 2-3 working days."
      });
      setWithdrawOpen(false);
      setWithdrawAmount("");
      setUpiId("");
      setUpiNumber("");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to process withdrawal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-16 max-w-5xl">
      <PageHeader title="Wallet" subtitle="War Chest" />

      <div className="grid lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 relative overflow-hidden bg-card-gradient border border-primary/60 clip-notch p-6 sm:p-10 shadow-fire">
          <div className="absolute inset-0 grid-bg opacity-20" />
          <div className="absolute -right-10 -bottom-10 opacity-20"><WalletIcon className="w-64 h-64 text-primary" /></div>
          
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                Total Balance
              </div>
              <div className="font-display text-5xl sm:text-7xl font-black text-fire-gradient mt-2 flex items-center gap-3">
                <GodCoin className="w-12 h-12 sm:w-16 sm:h-16" /> {totalBalance}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="hero" size="lg" className="font-display tracking-wider" onClick={() => toast.info("Payment gateway integration pending.")}>
                <ArrowDownToLine className="w-5 h-5 mr-2" /> Deposit Coins
              </Button>
              <Button variant="outlineFire" size="lg" className="font-display tracking-wider" onClick={handleWithdrawClick}>
                <ArrowUpFromLine className="w-5 h-5 mr-2" /> Withdraw Earnings
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card-gradient border border-border clip-notch p-6 relative overflow-hidden">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Earned Coins (Winnings)</div>
            <div className="font-display text-3xl font-black text-gold flex items-center gap-2">
              <GodCoin className="w-6 h-6" /> {winningBalance}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">Available to Withdraw</p>
          </div>
          
          <div className="bg-card-gradient border border-border clip-notch p-6 relative overflow-hidden">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Deposit Coins</div>
            <div className="font-display text-3xl font-black text-white flex items-center gap-2">
              <GodCoin className="w-6 h-6" /> {depositBalance}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">Entry fees only. Cannot be withdrawn.</p>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-secondary/30 border border-primary/30 p-4 rounded-md flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-primary shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p><strong className="text-primary font-display tracking-wider">1 CG COIN = ₹1 (INR)</strong></p>
          <p className="mt-1">All tournament entry fees and prizes are processed in CG Coins. Coins you add to your wallet (Deposit Coins) can only be used to pay entry fees. Only coins you win from tournaments (Earned Coins) can be withdrawn to your bank account.</p>
        </div>
      </div>

      <h3 className="mt-12 mb-4 font-display text-sm uppercase tracking-[0.3em] text-primary">Transactions</h3>
      <div className="bg-card-gradient border border-border clip-notch p-12 text-center text-muted-foreground">
        <WalletIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>No transactions yet. Win a tournament to see your earnings here.</p>
      </div>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-md bg-card border-primary/40 clip-notch">
          <div className="absolute inset-x-0 top-0 h-px bg-fire-gradient" />
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-black tracking-tight flex items-center gap-2">
              <ArrowUpFromLine className="w-5 h-5 text-primary" /> WITHDRAW EARNINGS
            </DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
              Available to withdraw: {winningBalance} GC
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-display font-bold text-muted-foreground mb-1">UPI ID *</label>
              <input
                type="text"
                placeholder="you@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full bg-background border border-border focus:border-primary outline-none px-3 h-10 text-sm transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-display font-bold text-muted-foreground mb-1">UPI Number (Mobile) *</label>
              <input
                type="text"
                placeholder="9876543210"
                value={upiNumber}
                onChange={(e) => setUpiNumber(e.target.value)}
                className="w-full bg-background border border-border focus:border-primary outline-none px-3 h-10 text-sm transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-display font-bold text-muted-foreground mb-1">Withdraw Amount (CG Coins) *</label>
              <div className="relative">
                <GodCoin className="w-5 h-5 absolute left-3 top-2.5" />
                <input
                  type="number"
                  placeholder="0"
                  value={withdrawAmount}
                  max={winningBalance}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary outline-none pl-10 pr-3 h-10 text-sm transition-colors font-bold font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-border/60">
            <Button variant="hero" onClick={submitWithdrawal} disabled={isSubmitting} className="font-display tracking-wider w-full">
              {isSubmitting ? "PROCESSING..." : "CONFIRM WITHDRAWAL"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
