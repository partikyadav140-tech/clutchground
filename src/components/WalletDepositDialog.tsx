import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { createUpiDeposit, submitUpiUtr, getWalletBalance } from "../api";
import { useAuth } from "../lib/auth-client";
import {
  CreditCard, Wallet, CheckCircle2, Copy, ExternalLink,
  Smartphone, ArrowRight, Clock, ShieldCheck,
} from "lucide-react";

const predefinedAmounts = [100, 200, 500, 1000, 2000, 5000];

type Step = "amount" | "pay" | "utr" | "done";

export function WalletDepositDialog({
  trigger,
  onSuccess,
}: {
  trigger: React.ReactNode;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // Payment data returned from server
  const [payData, setPayData] = useState<{
    txnRef: string;
    upiId: string;
    platformName: string;
    upiLink: string;
    amount: number;
  } | null>(null);

  const [utr, setUtr] = useState("");
  const { user } = useAuth();

  const finalAmount = customAmount ? parseInt(customAmount) : amount;

  /* ── Step 1: Create deposit request ── */
  const handleProceed = async () => {
    if (!user) return toast.error("Please log in first");
    if (!finalAmount || finalAmount < 100) return toast.error("Minimum deposit is ₹100");

    setLoading(true);
    try {
      const data = await (createUpiDeposit as any)({
        data: {
          userId: user.id,
          amount: finalAmount,
          description: `Wallet Deposit — ${finalAmount} CG Coins`,
        },
      });
      setPayData(data);
      setStep("pay");
    } catch (err: any) {
      toast.error(err.message || "Failed to create deposit request");
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: Submit UTR ── */
  const handleSubmitUtr = async () => {
    if (!payData) return;
    if (!utr.trim() || utr.trim().length < 6) {
      return toast.error("Please enter a valid UTR / Transaction ID");
    }
    setLoading(true);
    try {
      await (submitUpiUtr as any)({
        data: { txnRef: payData.txnRef, utr: utr.trim() },
      });
      setStep("done");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit UTR");
    } finally {
      setLoading(false);
    }
  };

  const resetDialog = () => {
    setStep("amount");
    setAmount(500);
    setCustomAmount("");
    setPayData(null);
    setUtr("");
    setOpen(false);
    onSuccess?.();
  };

  /* ── UPI QR via Google Charts (no extra dep) ── */
  const qrUrl = payData
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(payData.upiLink)}&bgcolor=ffffff&color=1a1a2e&margin=8`
    : "";

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetDialog(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="">
        {/* accent bar */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-fire-gradient rounded-t-lg" />

        <DialogHeader>
          <DialogTitle className="font-display text-xl font-black">
            {step === "amount" && <span className="text-fire-gradient">ADD FUNDS</span>}
            {step === "pay"    && <span className="text-fire-gradient">PAY VIA UPI</span>}
            {step === "utr"    && <span className="text-fire-gradient">CONFIRM PAYMENT</span>}
            {step === "done"   && <span style={{ color: "#10b981" }}>PAYMENT SUBMITTED</span>}
          </DialogTitle>
        </DialogHeader>

        {/* ════════════ STEP 1: Amount ════════════ */}
        {step === "amount" && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-cta mb-1">
              <CreditCard className="w-4 h-4" />
              <span className="text-[10px] font-display uppercase tracking-widest font-bold">Quick Amounts</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {predefinedAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => { setAmount(amt); setCustomAmount(""); }}
                  className={`h-11 rounded-xl font-display font-bold text-sm border transition-all ${
                    amount === amt && !customAmount
                      ? "bg-primary text-white border-primary shadow-[0_0_12px_var(--primary)/30]"
                      : "bg-secondary/60 text-foreground border-border hover:border-primary/40"
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-display font-bold text-muted-foreground mb-1.5">
                Custom Amount
              </label>
              <input
                type="number"
                min="100"
                step="10"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  if (e.target.value) setAmount(0);
                }}
                placeholder="Enter amount (min ₹100)"
                className="w-full bg-background border border-border focus:border-primary outline-none px-4 h-11 rounded-xl text-sm"
              />
            </div>

            {/* Summary */}
            <div className="bg-secondary/50 border border-border rounded-xl p-3 flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Wallet className="w-4 h-4" /> CG Coins credited:
              </span>
              <span className="font-black text-foreground">
                {customAmount || amount || "—"}
              </span>
            </div>

            {/* Trust badge */}
            <div className="bg-primary/8 border border-primary/20 rounded-xl p-3 text-xs text-foreground/70 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-cta shrink-0 mt-0.5" />
              <span>Pay securely via <strong className="text-foreground">Bharat UPI</strong>. Coins credited after admin verification (usually within 30 min).</span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={handleProceed}
                disabled={loading || (!amount && !customAmount)}
                className="flex-1 bg-primary text-white font-display rounded-xl"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Continue <ArrowRight className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ════════════ STEP 2: Pay ════════════ */}
        {step === "pay" && payData && (
          <div className="space-y-4 py-2">
            {/* Amount pill */}
            <div className="text-center">
              <span className="inline-block bg-primary/10 border border-primary/30 text-primary font-display font-black text-2xl px-6 py-2 rounded-2xl">
                ₹{payData.amount}
              </span>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white rounded-2xl p-2 shadow-md border border-border">
                <img
                  src={qrUrl}
                  alt="UPI QR Code"
                  width={180}
                  height={180}
                  className="rounded-xl"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                Scan with any UPI app
              </p>
            </div>

            {/* UPI ID to copy */}
            <div className="bg-secondary/60 border border-border rounded-xl p-3">
              <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Pay to UPI ID</p>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-foreground text-sm">{payData.upiId}</span>
                <button
                  onClick={() => copyToClipboard(payData.upiId, "UPI ID")}
                  className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Ref */}
            <div className="bg-secondary/60 border border-border rounded-xl p-3">
              <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Transaction Ref (add as note)</p>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-foreground">{payData.txnRef}</span>
                <button
                  onClick={() => copyToClipboard(payData.txnRef, "Reference")}
                  className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              {/* Open UPI app directly */}
              <a
                href={payData.upiLink}
                className="flex-1 h-11 rounded-xl font-display font-bold text-sm flex items-center justify-center gap-2 text-white"
                style={{ background: "linear-gradient(135deg, #6B48FF, #FF6B6B)" }}
              >
                <Smartphone className="w-4 h-4" />
                Open UPI App
                <ExternalLink className="w-3 h-3" />
              </a>
              <Button
                onClick={() => setStep("utr")}
                className="flex-1 bg-primary text-white font-display rounded-xl"
              >
                I've Paid →
              </Button>
            </div>
          </div>
        )}

        {/* ════════════ STEP 3: UTR ════════════ */}
        {step === "utr" && payData && (
          <div className="space-y-4 py-2">
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 text-xs text-foreground/80 flex items-start gap-2">
              <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>After paying, enter the <strong className="text-foreground">UTR / Transaction ID</strong> from your UPI app's payment receipt.</span>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-display font-bold text-muted-foreground mb-2">
                UTR / Transaction ID
              </label>
              <input
                type="text"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder="e.g. 416123456789"
                maxLength={24}
                className="w-full bg-background border border-border focus:border-primary outline-none px-4 h-12 rounded-xl text-sm font-mono tracking-wide"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">
                Find in: UPI App → Transactions → Payment Details → UTR Number
              </p>
            </div>

            <div className="bg-secondary/50 border border-border rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount paid:</span>
                <span className="font-bold">₹{payData.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coins to credit:</span>
                <span className="font-bold text-cta">{payData.amount} CG Coins</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("pay")} className="flex-1 rounded-xl">
                ← Back
              </Button>
              <Button
                onClick={handleSubmitUtr}
                disabled={loading || utr.trim().length < 6}
                className="flex-1 bg-primary text-white font-display rounded-xl"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : "Submit UTR"}
              </Button>
            </div>
          </div>
        )}

        {/* ════════════ STEP 4: Done ════════════ */}
        {step === "done" && (
          <div className="flex flex-col items-center text-center py-4 space-y-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}
            >
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <p className="font-display font-black text-lg text-foreground mb-1">Payment Submitted!</p>
              <p className="text-sm text-muted-foreground">
                Your UTR has been received. Coins will be credited to your wallet after admin verification — usually within <strong className="text-foreground">30 minutes</strong>.
              </p>
            </div>
            <div className="bg-secondary/50 border border-border rounded-xl p-3 w-full text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold">₹{payData?.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">UTR:</span>
                <span className="font-mono font-bold">{utr}</span>
              </div>
            </div>
            <Button onClick={resetDialog} className="w-full bg-primary text-white font-display rounded-xl">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
