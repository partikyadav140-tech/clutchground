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

const predefinedAmounts = [10, 50, 100, 200, 500, 1000];

type Step = "amount" | "pay" | "upiid" | "done";

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

  const [senderUpiId, setSenderUpiId] = useState("");
  const { user } = useAuth();

  const finalAmount = customAmount ? parseInt(customAmount) : amount;

  /* ── Step 1: Create deposit request ── */
  const handleProceed = async () => {
    if (!user) return toast.error("Please log in first");
    if (!finalAmount || finalAmount < 1) {
      return toast.error("Please enter a valid amount");
    }

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

  /* ── Step 2: Submit Sender UPI ID ── */
  const handleSubmitUpiId = async () => {
    if (!payData) return;
    const upiIdRegex = /^[a-zA-Z0-9._\-]+@[a-zA-Z0-9]+$/;
    if (!senderUpiId.trim() || !upiIdRegex.test(senderUpiId.trim())) {
      return toast.error("Please enter a valid UPI ID (e.g. name@upi)");
    }
    setLoading(true);
    try {
      await (submitUpiUtr as any)({
        data: { txnRef: payData.txnRef, utr: senderUpiId.trim() },
      });
      setStep("done");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit UPI ID");
    } finally {
      setLoading(false);
    }
  };

  const resetDialog = () => {
    setStep("amount");
    setAmount(500);
    setCustomAmount("");
    setPayData(null);
    setSenderUpiId("");
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
            {step === "upiid"  && <span className="text-fire-gradient">CONFIRM PAYMENT</span>}
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
                min="1"
                step="1"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  if (e.target.value) setAmount(0);
                }}
                placeholder="Enter custom amount"
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
                onClick={() => setStep("upiid")}
                className="flex-1 bg-primary text-white font-display rounded-xl"
              >
                I've Paid →
              </Button>
            </div>
          </div>
        )}

        {/* ════════════ STEP 3: Sender UPI ID ════════════ */}
        {step === "upiid" && payData && (
          <div className="space-y-4 py-2">
            {/* Why we ask banner */}
            <div className="bg-blue-500/10 border border-blue-500/25 rounded-xl p-3 text-xs text-foreground/80 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground block mb-0.5">Why do we ask for your UPI ID?</strong>
                We use your UPI ID to match your payment with your account and prevent fraud. Your UPI ID is never shared with third parties.
              </span>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-display font-bold text-muted-foreground mb-2">
                Your Sender UPI ID
              </label>
              <input
                type="text"
                value={senderUpiId}
                onChange={(e) => setSenderUpiId(e.target.value.trim())}
                placeholder="e.g. yourname@upi or 9876543210@paytm"
                maxLength={50}
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full bg-background border border-border focus:border-primary outline-none px-4 h-12 rounded-xl text-sm font-mono tracking-wide"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">
                Find in: UPI App → Profile / Settings → Your UPI ID
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
                onClick={handleSubmitUpiId}
                disabled={loading || !senderUpiId.trim().includes("@")}
                className="flex-1 bg-primary text-white font-display rounded-xl"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : "Confirm Payment"}
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
                Your payment is under review. Coins will be credited to your wallet after admin verification — usually within <strong className="text-foreground">30 minutes</strong>.
              </p>
            </div>
            <div className="bg-secondary/50 border border-border rounded-xl p-3 w-full text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold">₹{payData?.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sender UPI ID:</span>
                <span className="font-mono font-bold">{senderUpiId}</span>
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
