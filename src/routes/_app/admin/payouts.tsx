import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Banknote, CheckCircle, XCircle, Clock, ShieldAlert } from "lucide-react";
import { getPayouts, updatePayoutStatus } from "../../../api";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { GodCoin } from "@/components/GodCoin";
import { toast } from "sonner";
import { confirmDialog } from "@/components/ConfirmDialog";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/admin/payouts")({
  head: () => ({ meta: [{ title: "Payouts Admin — Professional Esports Arena" }] }),
  loader: async () => await getPayouts(),
  component: AdminPayoutsPage,
});

function AdminPayoutsPage() {
  const payouts = Route.useLoaderData();
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-background">
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
        <p className="text-muted-foreground font-semibold mb-8 max-w-sm">
          You must be logged in as an administrator to view this page.
        </p>
        <Link to="/login">
          <Button className="h-12 px-8 rounded-xl font-bold bg-primary text-white shadow-primary">
            Return to Login
          </Button>
        </Link>
      </div>
    );
  }

  const handleResolve = async (
    payoutId: number,
    userId: number,
    amount: number,
    status: string,
  ) => {
    const yes = await confirmDialog({
      title: "Resolve Payout?",
      description: `Are you sure you want to mark this payout as ${status.toUpperCase()}?`,
      confirmText: status.toUpperCase(),
      isDestructive: status === "rejected",
    });
    if (!yes) return;

    try {
      await (updatePayoutStatus as any)({ data: { payoutId, status, userId, amount } });
      toast.success(`Payout marked as ${status}!`);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to update payout status");
    }
  };

  const pendingCount = payouts.filter((p: any) => p.status === "pending").length;

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* ─── Top Header (Mobile First) ─── */}
      <div className="bg-white rounded-b-[2rem] shadow-[0_4px_24px_oklch(0_0_0/0.04)] pt-6 pb-6 px-4 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary mb-4 relative z-10 transition-colors bg-secondary/50 px-3 py-1.5 rounded-full"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-3">
            <Banknote className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-black text-foreground">Payouts</h1>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">Financial Requests</p>
        </div>

        <div className="mt-6 flex items-center justify-center">
          <div className="bg-secondary/50 px-4 py-2 rounded-xl flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${pendingCount > 0 ? "bg-amber-500 animate-pulse" : "bg-green-500"}`}
            />
            <span className="text-sm font-bold text-foreground">
              {pendingCount} Pending Requests
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6">
        {payouts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-[1.5rem] border border-border shadow-sm">
            <Banknote className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-foreground font-semibold">No withdrawal requests found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payouts.map((p: any, i: number) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                key={p.id}
                className={`bg-white rounded-[1.5rem] border ${p.status === "pending" ? "border-amber-200 shadow-md" : "border-border shadow-sm"} overflow-hidden group`}
              >
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-display font-black text-xl text-foreground truncate">
                          {p.username}
                        </h3>
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${
                            p.status === "pending"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : p.status === "completed"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>

                      <div className="bg-secondary/30 rounded-xl p-4 border border-border space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:gap-6 gap-2.5 text-xs">
                          <div className="truncate">
                            <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px] block mb-0.5">
                              Contact
                            </span>
                            <span className="font-semibold text-foreground">
                              {p.phone || p.email || "N/A"}
                            </span>
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px] block mb-0.5">
                              Requested At
                            </span>
                            <span className="font-semibold text-foreground">
                              {new Date(p.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="h-px bg-border w-full" />
                        <div className="flex flex-col sm:flex-row sm:gap-6 gap-2.5 text-xs">
                          <div className="truncate">
                            <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px] block mb-0.5">
                              UPI ID
                            </span>
                            <span className="font-mono font-semibold text-primary bg-primary/5 px-1.5 py-0.5 rounded">
                              {p.upi_id}
                            </span>
                          </div>
                          {p.upi_number && (
                            <div className="truncate">
                              <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px] block mb-0.5">
                                UPI Number
                              </span>
                              <span className="font-mono font-semibold text-foreground">
                                {p.upi_number}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end justify-between min-w-[140px] shrink-0 border-t sm:border-t-0 border-border pt-4 sm:pt-0">
                      <div className="text-left sm:text-right mb-4">
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
                          Transfer Amount
                        </div>
                        <div className="font-display text-2xl font-black text-foreground flex items-center justify-start sm:justify-end gap-1.5">
                          <GodCoin className="w-5 h-5" /> {p.amount}
                        </div>
                        <div className="text-xs font-semibold text-muted-foreground mt-0.5">
                          ≈ {p.amount} INR
                        </div>
                      </div>

                      {p.status === "pending" && (
                        <div className="flex flex-col gap-2 w-full">
                          <Button
                            variant="outline"
                            className="rounded-xl font-bold h-11 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300 w-full"
                            onClick={() => handleResolve(p.id, p.user_id, p.amount, "completed")}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" /> Mark Paid
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-xl font-bold h-10 bg-white text-destructive border-destructive/20 hover:bg-destructive/10 w-full"
                            onClick={() => handleResolve(p.id, p.user_id, p.amount, "rejected")}
                          >
                            <XCircle className="w-4 h-4 mr-2" /> Reject & Refund
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
