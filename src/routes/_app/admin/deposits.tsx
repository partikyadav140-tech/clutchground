import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  ArrowLeft, Wallet, CheckCircle, XCircle, Clock,
  ShieldAlert, IndianRupee, Hash, User, Phone, Copy, Filter,
} from "lucide-react";
import { getPendingUpiDeposits, approveUpiDeposit, rejectUpiDeposit } from "../../../api";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { GodCoin } from "@/components/GodCoin";
import { toast } from "sonner";
import { confirmDialog } from "@/components/ConfirmDialog";
import { motion, AnimatePresence } from "framer-motion";
import { AdminNavBar } from "@/components/AdminNavBar";

export const Route = createFileRoute("/_app/admin/deposits")({
  head: () => ({ meta: [{ title: "UPI Deposits — Admin" }] }),
  loader: async () => await getPendingUpiDeposits(),
  component: AdminDepositsPage,
});

type StatusFilter = "all" | "submitted" | "approved" | "rejected" | "pending";

const STATUS_STYLE: Record<string, { pill: string; label: string }> = {
  pending:   { pill: "bg-amber-500/10 text-amber-600 border-amber-500/30",   label: "Pending" },
  submitted: { pill: "bg-blue-500/10 text-blue-500 border-blue-500/30",      label: "Awaiting" },
  approved:  { pill: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", label: "Approved" },
  rejected:  { pill: "bg-red-500/10 text-red-500 border-red-500/30",         label: "Rejected" },
};

function AdminDepositsPage() {
  const deposits = Route.useLoaderData() as any[];
  const { user, loading } = useAuth();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <ShieldAlert className="w-10 h-10 text-destructive mb-4" />
        <h1 className="text-2xl font-display font-black text-foreground mb-4">Access Denied</h1>
        <Link to="/login"><Button className="bg-primary text-white rounded-xl font-bold h-12 px-8">Return to Login</Button></Link>
      </div>
    );
  }

  const copy = (text: string, label: string) => { navigator.clipboard.writeText(text); toast.success(`${label} copied!`); };

  const handleApprove = async (depositId: number, amount: number) => {
    const yes = await confirmDialog({ title: "Approve Deposit?", description: `Credit ₹${amount} to this user's wallet?`, confirmText: "APPROVE", isDestructive: false });
    if (!yes) return;
    try { await (approveUpiDeposit as any)({ data: { depositId } }); toast.success("Deposit approved! Wallet credited."); router.invalidate(); }
    catch (e: any) { toast.error(e.message || "Failed to approve"); }
  };

  const handleReject = async (depositId: number) => {
    const yes = await confirmDialog({ title: "Reject Deposit?", description: "Mark this deposit as rejected. User will be notified.", confirmText: "REJECT", isDestructive: true });
    if (!yes) return;
    try { await (rejectUpiDeposit as any)({ data: { depositId, reason: "Payment not verified" } }); toast.success("Deposit rejected."); router.invalidate(); }
    catch (e: any) { toast.error(e.message || "Failed to reject"); }
  };

  const pendingCount = deposits.filter((d: any) => d.status === "submitted" || d.status === "pending").length;
  const totalSubmitted = deposits.reduce((s: number, d: any) => s + ((d.status === "submitted" || d.status === "pending") ? d.amount : 0), 0);
  const totalApproved = deposits.reduce((s: number, d: any) => s + (d.status === "approved" ? d.amount : 0), 0);

  const TABS: { key: StatusFilter; label: string; count: number }[] = [
    { key: "pending", label: "Pending", count: pendingCount },
    { key: "approved", label: "Approved", count: deposits.filter((d: any) => d.status === "approved").length },
    { key: "rejected", label: "Rejected", count: deposits.filter((d: any) => d.status === "rejected").length },
    { key: "all", label: "All", count: deposits.length },
  ];

  const filtered = useMemo(() => {
    if (statusFilter === "all") return deposits;
    if (statusFilter === "pending") return deposits.filter((d: any) => d.status === "pending" || d.status === "submitted");
    return deposits.filter((d: any) => d.status === statusFilter);
  }, [deposits, statusFilter]);

  return (
    <div className="bg-background min-h-screen pb-2">
      {/* Header */}
      <div className="bg-card border-b border-border pt-6 pb-5 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground mb-4 bg-secondary/50 px-3 py-1.5 rounded-full transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-black text-foreground">UPI Deposits</h1>
            <p className="text-xs text-muted-foreground font-semibold">Review & approve payments</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-secondary/40 rounded-xl p-2.5 text-center">
            <div className={`font-display font-black text-lg ${pendingCount > 0 ? "text-blue-500" : "text-foreground"}`}>{pendingCount}</div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Awaiting</div>
            {pendingCount > 0 && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse mx-auto mt-1" />}
          </div>
          <div className="bg-secondary/40 rounded-xl p-2.5 text-center">
            <div className="font-display font-black text-lg text-amber-500">₹{totalSubmitted}</div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Pending ₹</div>
          </div>
          <div className="bg-secondary/40 rounded-xl p-2.5 text-center">
            <div className="font-display font-black text-lg text-emerald-500">₹{totalApproved}</div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Approved ₹</div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Filter tabs */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto hide-scrollbar pb-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-full font-bold text-xs whitespace-nowrap flex items-center gap-1.5 transition-colors shrink-0 ${
                statusFilter === tab.key ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${statusFilter === tab.key ? "bg-white/20 text-white" : "bg-secondary text-muted-foreground"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <Wallet className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
            <p className="font-semibold text-foreground">No {statusFilter === "all" ? "" : statusFilter} deposits</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((d: any, i: number) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: Math.min(i * 0.04, 0.3) }}
                  className={`bg-card rounded-2xl border overflow-hidden ${d.status === "submitted" ? "border-blue-500/30 shadow-blue-500/5 shadow-md" : "border-border/50 shadow-sm"}`}
                >
                  <div className="p-4">
                    {/* Top row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-display font-black text-foreground text-sm">{d.username}</p>
                          {d.phone && <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{d.phone}</p>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full border ${STATUS_STYLE[d.status]?.pill || ""}`}>
                          {STATUS_STYLE[d.status]?.label || d.status}
                        </span>
                        <div className="font-display text-lg font-black text-foreground flex items-center gap-1">
                          <GodCoin className="w-4 h-4" /> {d.amount}
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="bg-secondary/40 rounded-xl p-3 space-y-2 text-xs mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1"><Hash className="w-3 h-3" />Txn Ref</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-foreground">{d.txn_ref}</span>
                          <button onClick={() => copy(d.txn_ref, "Ref")} className="p-1 rounded bg-primary/10 text-primary"><Copy className="w-2.5 h-2.5" /></button>
                        </div>
                      </div>
                      {d.utr && (
                        <div className="flex items-center justify-between border-t border-border pt-2">
                          <span className="text-muted-foreground">Sender UPI</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-foreground">{d.utr}</span>
                            <button onClick={() => copy(d.utr, "UPI ID")} className="p-1 rounded bg-primary/10 text-primary"><Copy className="w-2.5 h-2.5" /></button>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between border-t border-border pt-2">
                        <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />Submitted</span>
                        <span className="text-foreground font-semibold">{new Date(d.submitted_at || d.created_at).toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {(d.status === "submitted" || d.status === "pending") && (
                      <div className="flex gap-2">
                        <Button className="flex-1 h-10 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => handleApprove(d.id, d.amount)}>
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Approve
                        </Button>
                        <Button variant="outline" className="flex-1 h-10 rounded-xl font-bold text-xs text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => handleReject(d.id)}>
                          <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      <AdminNavBar pendingDeposits={pendingCount} />
    </div>
  );
}
