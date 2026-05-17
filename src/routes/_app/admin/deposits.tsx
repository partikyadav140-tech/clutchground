import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  ArrowLeft, Wallet, CheckCircle, XCircle, Clock,
  ShieldAlert, IndianRupee, Hash, User, Phone, Copy,
} from "lucide-react";
import { getPendingUpiDeposits, approveUpiDeposit, rejectUpiDeposit } from "../../../api";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { GodCoin } from "@/components/GodCoin";
import { toast } from "sonner";
import { confirmDialog } from "@/components/ConfirmDialog";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/admin/deposits")({
  head: () => ({ meta: [{ title: "UPI Deposits — Admin" }] }),
  loader: async () => await getPendingUpiDeposits(),
  component: AdminDepositsPage,
});

const STATUS_STYLE: Record<string, string> = {
  pending:   "bg-amber-500/10 text-amber-600 border-amber-500/25",
  submitted: "bg-blue-500/10 text-blue-500 border-blue-500/25",
  approved:  "bg-emerald-500/10 text-emerald-500 border-emerald-500/25",
  rejected:  "bg-red-500/10 text-red-500 border-red-500/25",
};

function AdminDepositsPage() {
  const deposits = Route.useLoaderData() as any[];
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-3xl font-display font-black text-foreground mb-2">Access Denied</h1>
        <Link to="/login">
          <Button className="h-12 px-8 rounded-xl font-bold bg-primary text-white">Return to Login</Button>
        </Link>
      </div>
    );
  }

  const pendingCount = deposits.filter((d: any) => d.status === "submitted").length;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const handleApprove = async (depositId: number, amount: number) => {
    const yes = await confirmDialog({
      title: "Approve Deposit?",
      description: `Credit ₹${amount} to this user's wallet?`,
      confirmText: "APPROVE",
      isDestructive: false,
    });
    if (!yes) return;
    try {
      await (approveUpiDeposit as any)({ data: { depositId } });
      toast.success("Deposit approved! Wallet credited.");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to approve deposit");
    }
  };

  const handleReject = async (depositId: number) => {
    const yes = await confirmDialog({
      title: "Reject Deposit?",
      description: "This will mark the deposit as rejected. The user will be notified.",
      confirmText: "REJECT",
      isDestructive: true,
    });
    if (!yes) return;
    try {
      await (rejectUpiDeposit as any)({ data: { depositId, reason: "Payment not verified" } });
      toast.success("Deposit rejected.");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to reject deposit");
    }
  };

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* Header */}
      <div className="bg-card rounded-b-[2rem] shadow-sm pt-6 pb-6 px-4 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-cta mb-4 relative z-10 transition-colors bg-secondary/50 px-3 py-1.5 rounded-full"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-3">
            <IndianRupee className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-black text-foreground">UPI Deposits</h1>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">Review & credit pending payments</p>
        </div>

        <div className="mt-5 flex items-center justify-center">
          <div className="bg-secondary/50 px-4 py-2 rounded-xl flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${pendingCount > 0 ? "bg-blue-500 animate-pulse" : "bg-emerald-500"}`} />
            <span className="text-sm font-bold text-foreground">{pendingCount} Awaiting Review</span>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {deposits.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-[1.5rem] border border-border">
            <Wallet className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-semibold text-foreground">No deposit requests yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Pending UPI deposits will appear here.</p>
          </div>
        ) : (
          deposits.map((d: any, i: number) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              className={`bg-card rounded-[1.5rem] border overflow-hidden ${
                d.status === "submitted" ? "border-blue-500/30 shadow-md" : "border-border shadow-sm"
              }`}
            >
              <div className="p-5">
                {/* Top row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-display font-black text-foreground">{d.username}</p>
                      {d.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />{d.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${STATUS_STYLE[d.status] || ""}`}>
                      {d.status}
                    </span>
                    <div className="font-display text-xl font-black text-foreground flex items-center gap-1">
                      <GodCoin className="w-4 h-4" /> {d.amount}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="bg-secondary/40 rounded-xl p-3 space-y-2 text-xs mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5" />Txn Ref
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground">{d.txn_ref}</span>
                      <button onClick={() => copy(d.txn_ref, "Ref")} className="p-1 rounded bg-primary/10 text-primary">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {d.utr && (
                    <div className="flex items-center justify-between border-t border-border pt-2">
                      <span className="text-muted-foreground">UTR</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">{d.utr}</span>
                        <button onClick={() => copy(d.utr, "UTR")} className="p-1 rounded bg-primary/10 text-primary">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />Submitted
                    </span>
                    <span className="text-foreground font-semibold">
                      {d.submitted_at
                        ? new Date(d.submitted_at).toLocaleString("en-IN")
                        : new Date(d.created_at).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Action buttons — only for submitted */}
                {d.status === "submitted" && (
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 h-11 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white"
                      onClick={() => handleApprove(d.id, d.amount)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-11 rounded-xl font-bold text-destructive border-destructive/20 hover:bg-destructive/10"
                      onClick={() => handleReject(d.id)}
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
