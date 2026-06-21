import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  createUpiDeposit,
  submitUpiUtr,
  getWalletBalance,
  getActiveUpiConfig,
  checkPendingDeposit,
} from "../api";
import { useAuth } from "../lib/auth-client";
import {
  CreditCard,
  Wallet,
  CheckCircle2,
  Copy,
  ExternalLink,
  Smartphone,
  ArrowRight,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  QrCode,
} from "lucide-react";

const predefinedAmounts = [10, 50, 100, 200, 500, 1000];

type Step = "amount" | "pay" | "upiid" | "done";

/* ── UPI App definitions with brand colors ── */
const UPI_APPS = [
  {
    name: "GPay",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/512px-Google_Pay_Logo.svg.png",
    bg: "#ffffff",
    border: "#4285F4",
  },
  {
    name: "PhonePe",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/PhonePe_Logo.svg/512px-PhonePe_Logo.svg.png",
    bg: "#5f259f",
    border: "#5f259f",
  },
  {
    name: "Paytm",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/512px-Paytm_Logo_%28standalone%29.svg.png",
    bg: "#ffffff",
    border: "#00B9F1",
  },
  {
    name: "CRED",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/CRED_app_logo.png/480px-CRED_app_logo.png",
    bg: "#1a1a1a",
    border: "#ffffff20",
  },
  {
    name: "Amazon",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/603px-Amazon_logo.svg.png",
    bg: "#232F3E",
    border: "#FF9900",
  },
  {
    name: "BHIM",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/480px-UPI-Logo-vector.svg.png",
    bg: "#ffffff",
    border: "#00838F",
  },
];

export function WalletDepositDialog({
  trigger,
  onSuccess,
  primaryUpi,
  locked = false,
  onLockedClick,
}: {
  trigger: React.ReactNode;
  onSuccess?: () => void;
  primaryUpi?: string;
  locked?: boolean;
  onLockedClick?: () => void;
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

  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    if (payData?.upiLink) {
      QRCode.toDataURL(payData.upiLink, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 256,
      })
        .then((url) => {
          setQrCodeUrl(url);
        })
        .catch((err) => {
          console.error("Error generating QR code:", err);
        });
    }
  }, [payData?.upiLink]);

  const [senderUpiId, setSenderUpiId] = useState("");
  const { user } = useAuth();

  const [upiConfig, setUpiConfig] = useState<{
    upiId: string;
    upiName: string;
    minDeposit: string;
    maxDeposit: string;
  } | null>(null);

  // Pending deposit state
  const [pendingDeposit, setPendingDeposit] = useState<{
    hasPending: boolean;
    deposit: any;
  } | null>(null);
  const [checkingPending, setCheckingPending] = useState(false);

  // Fallback section toggle
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (open) {
      // Check for pending deposits and load UPI config simultaneously
      setCheckingPending(true);
      Promise.all([getActiveUpiConfig(), checkPendingDeposit()])
        .then(([cfg, pendingResult]) => {
          setUpiConfig(cfg);
          const minVal = parseInt(cfg.minDeposit) || 50;
          if (amount < minVal) {
            setAmount(minVal);
          }
          setPendingDeposit(pendingResult as any);
        })
        .catch(() => {})
        .finally(() => setCheckingPending(false));
    }
  }, [open]);

  const finalAmount = customAmount ? parseInt(customAmount) : amount;

  /* ── Step 1: Create deposit request ── */
  const handleProceed = async () => {
    if (!user) return toast.error("Please log in first");
    if (!finalAmount || finalAmount < 1) {
      return toast.error("Please enter a valid amount");
    }

    if (upiConfig) {
      const minVal = parseInt(upiConfig.minDeposit) || 50;
      const maxVal = parseInt(upiConfig.maxDeposit) || 10000;
      if (finalAmount < minVal || finalAmount > maxVal) {
        return toast.error(`Deposit amount must be between ₹${minVal} and ₹${maxVal}`);
      }
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
    if (!primaryUpi)
      return toast.error("Primary UPI ID not found. Please set it in wallet settings.");
    setLoading(true);
    try {
      await (submitUpiUtr as any)({
        data: { txnRef: payData.txnRef, utr: primaryUpi },
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
    setShowFallback(false);
    setPendingDeposit(null);
    setOpen(false);
    onSuccess?.();
  };

  /* ── UPI QR via QR API (fallback) ── */
  // QR Code is now generated locally via qrcode package

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => toast.success(`${label} copied!`))
        .catch(() => fallbackCopy(text, label));
    } else {
      fallbackCopy(text, label);
    }
  };

  const fallbackCopy = (text: string, label: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (successful) {
        toast.success(`${label} copied!`);
      } else {
        toast.error(`Failed to copy ${label}`);
      }
    } catch (err) {
      toast.error(`Failed to copy ${label}`);
    }
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    if (locked) {
      e.preventDefault();
      e.stopPropagation();
      onLockedClick?.();
      return;
    }
    setOpen(true);
  };

  /* ── Open UPI Intent link ── */
  const openUpiApp = () => {
    if (!payData?.upiLink) return;
    window.location.href = payData.upiLink;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v && locked) return;
        setOpen(v);
        if (!v) resetDialog();
      }}
    >
      <div onClick={handleTriggerClick} className="w-full">
        {trigger}
      </div>

      <DialogContent
        id="tutorial-deposit-dialog"
        className="max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* accent bar */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-fire-gradient rounded-t-lg" />

        <DialogHeader>
          <DialogTitle className="font-display text-xl font-black">
            {step === "amount" && <span className="text-fire-gradient">ADD FUNDS</span>}
            {step === "pay" && <span className="text-fire-gradient">PAY VIA UPI</span>}
            {step === "upiid" && <span className="text-fire-gradient">CONFIRM PAYMENT</span>}
            {step === "done" && <span style={{ color: "#10b981" }}>PAYMENT SUBMITTED</span>}
          </DialogTitle>
        </DialogHeader>

        {/* ════════════ PENDING DEPOSIT BLOCKER ════════════ */}
        {checkingPending && (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground font-semibold">Checking status...</p>
          </div>
        )}

        {!checkingPending && pendingDeposit?.hasPending && step === "amount" && (
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(245,158,11,0.12)" }}
              >
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <p className="font-display font-black text-lg text-foreground mb-1">
                  Pending Deposit
                </p>
                <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                  You already have a deposit of{" "}
                  <strong className="text-foreground">₹{pendingDeposit.deposit?.amount}</strong>{" "}
                  awaiting admin review.
                </p>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-600">
                <AlertCircle className="w-3.5 h-3.5" />
                Deposit Details
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-foreground">
                    ₹{pendingDeposit.deposit?.amount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                      pendingDeposit.deposit?.status === "submitted"
                        ? "bg-blue-500/10 text-blue-500"
                        : "bg-amber-500/10 text-amber-600"
                    }`}
                  >
                    {pendingDeposit.deposit?.status === "submitted"
                      ? "Under Review"
                      : "Awaiting Confirmation"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ref</span>
                  <span className="font-mono text-[11px] font-semibold text-foreground">
                    {pendingDeposit.deposit?.txn_ref}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Please wait for admin to{" "}
              <strong className="text-foreground">approve or reject</strong> your existing deposit
              before making a new one.
            </p>

            <Button
              onClick={() => setOpen(false)}
              className="w-full bg-primary text-white font-display rounded-xl h-11"
            >
              Got it, Close
            </Button>
          </div>
        )}

        {/* ════════════ STEP 1: Amount ════════════ */}
        {!checkingPending && !pendingDeposit?.hasPending && step === "amount" && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-cta mb-1">
              <CreditCard className="w-4 h-4" />
              <span className="text-[10px] font-display uppercase tracking-widest font-bold">
                Quick Amounts
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {predefinedAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setAmount(amt);
                    setCustomAmount("");
                  }}
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
                min={upiConfig?.minDeposit || "50"}
                max={upiConfig?.maxDeposit || "10000"}
                step="1"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  if (e.target.value) setAmount(0);
                }}
                placeholder={`e.g. ${upiConfig?.minDeposit || "50"}`}
                className="w-full bg-background border border-border focus:border-primary outline-none px-4 h-11 rounded-xl text-sm"
              />
              <p className="text-[10px] text-muted-foreground font-semibold mt-1.5 pl-1">
                Limit: ₹{upiConfig?.minDeposit || "50"} to ₹{upiConfig?.maxDeposit || "10000"} per
                transaction
              </p>
            </div>

            {/* Summary */}
            <div className="bg-secondary/50 border border-border rounded-xl p-3 flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Wallet className="w-4 h-4" /> CG Coins credited:
              </span>
              <span className="font-black text-foreground">{customAmount || amount || "—"}</span>
            </div>

            {/* Trust badge */}
            <div className="bg-primary/8 border border-primary/20 rounded-xl p-3 text-xs text-foreground/70 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-cta shrink-0 mt-0.5" />
              <span>
                Pay securely via <strong className="text-foreground">any UPI app</strong>. Coins
                credited after admin verification (usually within 30 min).
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl"
              >
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
                  <>
                    Continue <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ════════════ STEP 2: Pay — UPI App Picker ════════════ */}
        {step === "pay" && payData && (
          <div className="space-y-4 py-2">
            {/* Amount pill */}
            <div className="text-center">
              <span className="inline-block bg-primary/10 border border-primary/30 text-primary font-display font-black text-2xl px-6 py-2 rounded-2xl">
                ₹{payData.amount}
              </span>
            </div>

            {/* Direct instructions note */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-foreground/80 flex items-start gap-2">
              <Smartphone className="w-4 h-4 text-cta shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground block mb-0.5">Using same phone?</strong>
                Take a screenshot of the QR to scan in your UPI app, or copy the UPI ID below to pay manually. Click <strong>"I've Paid"</strong> once done.
              </span>
            </div>

            {/* Primary CTA: Pay via UPI - Commented out for now until Merchant UPI is integrated
            <button
              type="button"
              onClick={openUpiApp}
              className="w-full h-14 rounded-2xl font-black text-base uppercase tracking-wider text-white flex items-center justify-center gap-3 press-effect active:scale-[0.97] transition-all shadow-lg relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
              }}
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background:
                    "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3), transparent 60%)",
                }}
              />
              <Smartphone className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Pay ₹{payData.amount} via UPI</span>
              <ExternalLink className="w-4 h-4 relative z-10 opacity-60" />
            </button>

            <p className="text-[10px] text-muted-foreground text-center font-semibold">
              Opens your UPI app with amount auto-filled • Just enter PIN & pay
            </p>
            */}

            {/* Paying to info */}
            <div className="bg-secondary/60 border border-border rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-0.5">
                    Paying to
                  </p>
                  <p className="font-mono font-bold text-foreground text-sm">{payData.upiId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(payData.upiId, "UPI ID")}
                  className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* QR Code (always visible) */}
            <div className="p-3 space-y-4 border border-border/50 rounded-xl bg-secondary/10">
              {/* QR Code */}
              <div className="flex flex-col items-center gap-2">
                <div className="bg-white rounded-xl p-2 shadow-sm border border-border">
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="UPI QR Code"
                      width={160}
                      height={160}
                      className="rounded-lg"
                    />
                  ) : (
                    <div className="w-[160px] h-[160px] flex items-center justify-center bg-muted rounded-lg">
                      <span className="text-xs text-muted-foreground">Generating QR...</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground font-semibold">
                  Scan QR code with any UPI app to pay
                </p>
              </div>
            </div>

            {/* ⚠️ Professional Warning Note */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5">
              <div className="shrink-0 mt-0.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-amber-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="text-xs leading-snug">
                <p className="font-black text-amber-600 uppercase tracking-wide text-[10px] mb-1">
                  Important Notice
                </p>
                <p className="text-foreground/80 font-semibold">
                  Click <strong className="text-foreground">"I've Paid"</strong>{" "}
                  <em>only after you have successfully completed the payment.</em> Clicking this
                  button without making the actual payment will result in your deposit request being{" "}
                  <strong className="text-red-500">automatically rejected</strong> by our admin
                  team.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setStep("upiid")}
                className="w-full bg-primary text-white font-display rounded-xl h-11 text-sm font-bold active:scale-95 transition-transform"
              >
                ✅ I've Paid — Submit Request
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
                <strong className="text-foreground block mb-0.5">
                  Why do we ask for your UPI ID?
                </strong>
                We use your UPI ID to match your payment with your account and prevent fraud. Your
                UPI ID is never shared with third parties.
              </span>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-display font-bold text-muted-foreground mb-2">
                Your Sender UPI ID
              </label>
              <input
                type="text"
                value={primaryUpi || ""}
                disabled
                className="w-full bg-secondary border border-border outline-none px-4 h-12 rounded-xl text-sm font-mono tracking-wide text-muted-foreground cursor-not-allowed"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">
                This is your Primary UPI ID configured in Wallet settings.
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
              <Button
                variant="outline"
                onClick={() => setStep("pay")}
                className="flex-1 rounded-xl"
              >
                ← Back
              </Button>
              <Button
                onClick={handleSubmitUpiId}
                disabled={loading || !primaryUpi}
                className="flex-1 bg-primary text-white font-display rounded-xl"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Confirm Payment"
                )}
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
              <p className="font-display font-black text-lg text-foreground mb-1">
                Payment Submitted!
              </p>
              <p className="text-sm text-muted-foreground">
                Your payment is under review. Coins will be credited to your wallet after admin
                verification — usually within{" "}
                <strong className="text-foreground">30 minutes</strong>.
              </p>
            </div>
            <div className="bg-secondary/50 border border-border rounded-xl p-3 w-full text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold">₹{payData?.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sender UPI ID:</span>
                <span className="font-mono font-bold">{primaryUpi}</span>
              </div>
            </div>
            <Button
              onClick={resetDialog}
              className="w-full bg-primary text-white font-display rounded-xl"
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
