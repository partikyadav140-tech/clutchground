import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  ShieldAlert,
  IndianRupee,
  Hash,
  User,
  Mail,
  Copy,
  Filter,
  Search,
  X,
  CheckSquare,
  Square,
} from "lucide-react";
import {
  getPendingUpiDeposits,
  approveUpiDeposit,
  rejectUpiDeposit,
  bulkApproveUpiDeposits,
  bulkRejectUpiDeposits,
} from "../../../api";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { GodCoin } from "@/components/GodCoin";
import { toast } from "sonner";
import { confirmDialog } from "@/components/ConfirmDialog";
import { motion, AnimatePresence } from "framer-motion";
import { AdminNavBar } from "@/components/AdminNavBar";
import { SkeletonAdminTable } from "@/components/SkeletonPage";

export const Route = createFileRoute("/_app/admin/deposits")({
  head: () => ({ meta: [{ title: "UPI Deposits — Admin" }] }),
  loader: async () => {
    try {
      return await getPendingUpiDeposits();
    } catch {
      return [];
    }
  },
  component: AdminDepositsPage,
});

type StatusFilter = "all" | "submitted" | "approved" | "rejected" | "pending";

const STATUS_STYLE: Record<string, { pill: string; label: string }> = {
  pending: { pill: "bg-amber-500/10 text-amber-600 border-amber-500/30", label: "Pending" },
  submitted: { pill: "bg-blue-500/10 text-blue-500 border-blue-500/30", label: "Awaiting" },
  approved: { pill: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", label: "Approved" },
  rejected: { pill: "bg-red-500/10 text-red-500 border-red-500/30", label: "Rejected" },
};

function AdminDepositsPage() {
  const deposits = Route.useLoaderData() as any[];
  const { user, loading } = useAuth();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { on: socketOn } = useSocket();
  useEffect(() => {
    if (!socketOn) return;
    const cleanup = socketOn("new-notification", (notif: any) => {
      router.invalidate();
      if (notif.message && notif.message.includes("Deposit")) {
        toast.info(notif.message, {
          description: "Real-time sync completed.",
        });
      }
    });
    return () => cleanup();
  }, [socketOn, router]);

  if (loading)
    return (
      <div className="min-h-[60vh] bg-background pb-6">
        <SkeletonAdminTable />
      </div>
    );

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <ShieldAlert className="w-10 h-10 text-destructive mb-4" />
        <h1 className="text-2xl font-display font-black text-foreground mb-4">Access Denied</h1>
        <Link to="/login">
          <Button className="bg-primary text-white rounded-xl font-bold h-12 px-8">
            Return to Login
          </Button>
        </Link>
      </div>
    );
  }

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
      toast.error(e.message || "Failed to approve");
    }
  };

  const handleReject = async (depositId: number) => {
    const yes = await confirmDialog({
      title: "Reject Deposit?",
      description: "Mark this deposit as rejected. User will be notified.",
      confirmText: "REJECT",
      isDestructive: true,
    });
    if (!yes) return;
    try {
      await (rejectUpiDeposit as any)({ data: { depositId, reason: "Payment not verified" } });
      toast.success("Deposit rejected.");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to reject");
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    const yes = await confirmDialog({
      title: "Bulk Approve Deposits?",
      description: `Credit wallet balance for ${selectedIds.length} selected deposits?`,
      confirmText: "APPROVE ALL",
      isDestructive: false,
    });
    if (!yes) return;
    const toastId = toast.loading(`Approving ${selectedIds.length} deposits...`);
    try {
      await (bulkApproveUpiDeposits as any)({ data: { depositIds: selectedIds } });
      toast.success(`Successfully approved ${selectedIds.length} deposits!`, { id: toastId });
      setSelectedIds([]);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to bulk approve", { id: toastId });
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    const yes = await confirmDialog({
      title: "Bulk Reject Deposits?",
      description: `Reject ${selectedIds.length} selected deposits? Users will be notified.`,
      confirmText: "REJECT ALL",
      isDestructive: true,
    });
    if (!yes) return;
    const toastId = toast.loading(`Rejecting ${selectedIds.length} deposits...`);
    try {
      await (bulkRejectUpiDeposits as any)({ data: { depositIds: selectedIds, reason: "Payment not verified" } });
      toast.success(`Successfully rejected ${selectedIds.length} deposits!`, { id: toastId });
      setSelectedIds([]);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to bulk reject", { id: toastId });
    }
  };

  const pendingCount = deposits.filter(
    (d: any) => d.status === "submitted" || d.status === "pending",
  ).length;
  const totalSubmitted = deposits.reduce(
    (s: number, d: any) => s + (d.status === "submitted" || d.status === "pending" ? d.amount : 0),
    0,
  );
  const totalApproved = deposits.reduce(
    (s: number, d: any) => s + (d.status === "approved" ? d.amount : 0),
    0,
  );

  const TABS: { key: StatusFilter; label: string; count: number }[] = [
    { key: "pending", label: "Pending", count: pendingCount },
    {
      key: "approved",
      label: "Approved",
      count: deposits.filter((d: any) => d.status === "approved").length,
    },
    {
      key: "rejected",
      label: "Rejected",
      count: deposits.filter((d: any) => d.status === "rejected").length,
    },
    { key: "all", label: "All", count: deposits.length },
  ];

  const filtered = useMemo(() => {
    let list = deposits;
    if (statusFilter === "pending") {
      list = list.filter((d: any) => d.status === "pending" || d.status === "submitted");
    } else if (statusFilter !== "all") {
      list = list.filter((d: any) => d.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d: any) =>
          d.username?.toLowerCase().includes(q) ||
          d.email?.toLowerCase().includes(q) ||
          d.txn_ref?.toLowerCase().includes(q) ||
          d.utr?.toLowerCase().includes(q) ||
          d.user_upi_id?.toLowerCase().includes(q) ||
          String(d.amount).includes(q)
      );
    }
    return list;
  }, [deposits, statusFilter, search]);

  return (
    <div className="bg-background min-h-screen pb-2">
      {/* Header */}
      <div className="bg-card border-b border-border pt-6 pb-5 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground mb-4 bg-secondary/50 px-3 py-1.5 rounded-full transition-colors"
        >
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
            <div
              className={`font-display font-black text-lg ${pendingCount > 0 ? "text-blue-500" : "text-foreground"}`}
            >
              {pendingCount}
            </div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Awaiting
            </div>
            {pendingCount > 0 && (
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse mx-auto mt-1" />
            )}
          </div>
          <div className="bg-secondary/40 rounded-xl p-2.5 text-center">
            <div className="font-display font-black text-lg text-amber-500">₹{totalSubmitted}</div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Pending ₹
            </div>
          </div>
          <div className="bg-secondary/40 rounded-xl p-2.5 text-center">
            <div className="font-display font-black text-lg text-emerald-500">₹{totalApproved}</div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Approved ₹
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Search bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username, email, Txn ref, amount..."
            className="w-full h-11 bg-card border border-border focus:border-primary outline-none pl-10 pr-10 text-sm rounded-xl transition-all font-semibold shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto hide-scrollbar pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
                setSelectedIds([]);
              }}
              className={`px-3 py-1.5 rounded-full font-bold text-xs whitespace-nowrap flex items-center gap-1.5 transition-colors shrink-0 ${
                statusFilter === tab.key
                  ? "bg-primary text-white"
                  : "bg-card border border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {tab.label}
              <span
                className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${statusFilter === tab.key ? "bg-white/20 text-white" : "bg-secondary text-muted-foreground"}`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Bulk Action Panel */}
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-primary/30 rounded-2xl p-3.5 mb-4 shadow-md flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <span className="bg-primary text-white text-[11px] font-black px-2.5 py-1 rounded-full">
                {selectedIds.length} selected
              </span>
              <button
                onClick={() => setSelectedIds([])}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold underline"
              >
                Clear
              </button>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs h-9 rounded-xl"
                onClick={handleBulkApprove}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-destructive/20 text-destructive hover:bg-destructive/10 font-bold text-xs h-9 rounded-xl"
                onClick={handleBulkReject}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
              </Button>
            </div>
          </motion.div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <Wallet className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
            <p className="font-semibold text-foreground">
              No {statusFilter === "all" ? "" : statusFilter} deposits
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((d: any, i: number) => {
                const isSelected = selectedIds.includes(d.id);
                const canSelect = d.status === "submitted" || d.status === "pending";
                return (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: Math.min(i * 0.04, 0.3) }}
                    className={`bg-card rounded-2xl border overflow-hidden transition-all ${isSelected ? "border-primary/60 bg-primary/5" : d.status === "submitted" ? "border-blue-500/30 shadow-blue-500/5 shadow-md" : "border-border/50 shadow-sm"}`}
                  >
                    <div className="flex items-stretch">
                      {canSelect && (
                        <button
                          onClick={() => {
                            if (isSelected) {
                              setSelectedIds(selectedIds.filter((id) => id !== d.id));
                            } else {
                              setSelectedIds([...selectedIds, d.id]);
                            }
                          }}
                          className="px-3 border-r border-border/40 flex items-center justify-center hover:bg-secondary/20 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4 text-muted-foreground/30" />
                          )}
                        </button>
                      )}
                      <div className="flex-1 p-4">
                        {/* Top row */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                              <User className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-display font-black text-foreground text-sm truncate">
                                {d.username}
                              </p>
                              {d.email && (
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                                  <Mail className="w-2.5 h-2.5" />
                                  {d.email}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full border ${STATUS_STYLE[d.status]?.pill || ""}`}
                            >
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
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              Txn Ref
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-foreground">{d.txn_ref}</span>
                              <button
                                onClick={() => copy(d.txn_ref, "Ref")}
                                className="p-1 rounded bg-primary/10 text-primary"
                              >
                                <Copy className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                          {d.utr && (
                            <div className="flex items-center justify-between border-t border-border pt-2">
                              <span className="text-muted-foreground">Sender UPI</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-foreground">{d.utr}</span>
                                <button
                                  onClick={() => copy(d.utr, "UPI ID")}
                                  className="p-1 rounded bg-primary/10 text-primary"
                                >
                                  <Copy className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          )}
                          {d.user_upi_id && d.user_upi_id !== d.utr && (
                            <div className="flex items-center justify-between border-t border-border pt-2">
                              <span className="text-muted-foreground">Registered UPI</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-foreground">{d.user_upi_id}</span>
                                <button
                                  onClick={() => copy(d.user_upi_id, "Registered UPI")}
                                  className="p-1 rounded bg-primary/10 text-primary"
                                >
                                  <Copy className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center justify-between border-t border-border pt-2">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Submitted
                            </span>
                            <span className="text-foreground font-semibold">
                              {new Date(d.submitted_at || d.created_at).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>

                        {(d.status === "submitted" || d.status === "pending") && (
                          <div className="space-y-2">
                            {d.status === "pending" && (
                              <div className="text-center text-[10px] font-bold text-amber-500 bg-amber-500/10 py-1.5 rounded-xl border border-amber-500/20">
                                ⚠️ User has not confirmed payment yet
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button
                                className="flex-1 h-10 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
                                onClick={() => handleApprove(d.id, d.amount)}
                              >
                                <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Approve
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 h-10 rounded-xl font-bold text-xs text-destructive border-destructive/20 hover:bg-destructive/10"
                                onClick={() => handleReject(d.id)}
                              >
                                <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
      <AdminNavBar pendingDeposits={pendingCount} />
    </div>
  );
}
