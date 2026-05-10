import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { createRazorpayOrder, verifyRazorpayPayment, getWalletBalance } from "../api";
import { useAuth } from "../lib/auth-client";
import { CreditCard, Wallet, Check } from "lucide-react";

const predefinedAmounts = [100, 500, 1000, 2000, 5000];

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function WalletDepositDialog({ trigger, onSuccess }: { trigger: React.ReactNode; onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleDeposit = async () => {
    if (!user) {
      toast.error("Please log in first");
      return;
    }

    const finalAmount = customAmount ? parseInt(customAmount) : amount;

    if (!finalAmount || finalAmount < 100) {
      toast.error("Minimum deposit amount is ₹100");
      return;
    }

    setLoading(true);
    try {
      // Create order
      const orderData = await (createRazorpayOrder as any)({
        data: {
          userId: user.id,
          amount: finalAmount,
          description: `Wallet Deposit - ${finalAmount} CG Coins`,
        },
      });

      // Load Razorpay script if not loaded
      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      // Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount * 100,
        currency: orderData.currency,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            // Verify payment
            await (verifyRazorpayPayment as any)({
              data: {
                userId: user.id,
                orderId: orderData.orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              },
            });

            toast.success(`✅ Deposit successful! ${finalAmount} CG Coins added to your wallet`);
            setOpen(false);
            setCustomAmount("");
            setAmount(500);
            onSuccess?.();
          } catch (err: any) {
            toast.error(err.message || "Payment verification failed");
          }
        },
        prefill: {
          name: user.username || "",
          email: (user as any)?.email || "",
          contact: (user as any)?.phone || "",
        },
        theme: {
          color: "#FF6B6B",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      toast.error(err.message || "Failed to create payment order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="">
        <div className="absolute inset-x-0 top-0 h-px bg-fire-gradient" />
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-black">
            <span className="text-fire-gradient">ADD FUNDS</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 text-cta mb-4">
            <CreditCard className="w-5 h-5" />
            <span className="text-sm font-display uppercase tracking-widest font-bold">Quick Amounts</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {predefinedAmounts.map((amt) => (
              <Button
                key={amt}
                onClick={() => {
                  setAmount(amt);
                  setCustomAmount("");
                }}
                variant={amount === amt && !customAmount ? "hero" : "outline"}
                className={`w-full rounded-lg font-display font-bold text-sm ${
                  amount === amt && !customAmount ? "bg-primary text-white" : ""
                }`}
              >
                ₹{amt}
              </Button>
            ))}
          </div>

          <div className="relative">
            <label className="block text-[10px] uppercase tracking-widest font-display font-bold text-muted-foreground mb-2">
              Custom Amount (Optional)
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
              placeholder="Enter custom amount (min ₹100)"
              className="w-full bg-background border border-border focus:border-primary outline-none px-4 h-12 rounded-lg text-sm"
            />
          </div>

          <div className="bg-secondary/60 border border-border rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-bold text-foreground">₹{customAmount || amount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">CG Coins:</span>
              <span className="font-bold text-foreground">
                <Wallet className="w-4 h-4 inline mr-1" />
                {customAmount || amount}
              </span>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-xs text-foreground/80">
            <Check className="w-3 h-3 inline mr-2 text-cta" />
            Secure payment via Razorpay. Your wallet will be credited immediately after successful payment.
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="flex-1 rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeposit}
            disabled={loading || (!amount && !customAmount)}
            className="flex-1 bg-primary text-white font-display rounded-lg"
          >
            {loading ? "Processing..." : "Proceed to Payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
