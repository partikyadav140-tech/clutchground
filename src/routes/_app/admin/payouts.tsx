import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  Banknote,
  CheckCircle,
  XCircle,
  ShieldAlert,
  IndianRupee,
  Search,
  X,
  CheckSquare,
  Square,
} from "lucide-react";
import { getPayouts, updatePayoutStatus, bulkUpdatePayoutStatus } from "../../../api";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { GodCoin } from "@/components/GodCoin";
import { toast } from "sonner";
import { confirmDialog } from "@/components/ConfirmDialog";
import { motion, AnimatePresence } from "framer-motion";
import { AdminNavBar } from "@/components/AdminNavBar";
import { SkeletonAdminTable } from "@/components/SkeletonPage";

export const Route = createFileRoute("/_app/admin/payouts")({
  head: () => ({ meta: [{ title: "Payouts Admin — CLUTCHGROUND" }] }),
  loader: async () => {
    try {
      return await getPayouts();
    } catch {
      return [];
    }
  },
  component: AdminPayoutsPage,
});

type FilterTab = "pending" | "completed" | "rejected" | "all";

const STATUS_PILL: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  rejected: "bg-red-500/10 text-red-500 border-red-500/30",
};

function AdminPayoutsPage() {
  const payouts = Route.useLoaderData() as any[];
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<FilterTab>("pending");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { on: socketOn } = useSocket();
  useEffect(() => {
    if (!socketOn) return;
    const cleanup = socketOn("new-notification", (notif: any) => {
      router.invalidate();
      if (notif.message && (notif.message.includes("Withdrawal") || notif.message.includes("payout"))) {
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

  const handleResolve = async (
    payoutId: number,
    userId: number,
    amount: number,
    status: string,
  ) => {
    const yes = await confirmDialog({
      title: `Mark as ${status === "completed" ? "Paid" : "Rejected"}?`,
      description:
        status === "completed"
          ? `Confirm payment of ₹${amount} was sent to this user's UPI?`
          : `Reject this withdrawal of ₹${amount}? Coins will be refunded.`,
      confirmText: status === "completed" ? "Mark Paid" : "Reject & Refund",
      isDestructive: status === "rejected",
    });
    if (!yes) return;
    try {
      await (updatePayoutStatus as any)({ data: { payoutId, status, userId, amount } });
      toast.success(status === "completed" ? "Payout marked as paid!" : "Rejected & refunded.");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    const yes = await confirmDialog({
      title: "Bulk Approve Payouts?",
      description: `Mark ${selectedIds.length} selected payouts as Paid?`,
      confirmText: "MARK PAID ALL",
      isDestructive: false,
    });
    if (!yes) return;
    const toastId = toast.loading(`Processing bulk payouts...`);
    try {
      await (bulkUpdatePayoutStatus as any)({ data: { payoutIds: selectedIds, status: "completed" } });
      toast.success(`Successfully approved ${selectedIds.length} payouts!`, { id: toastId });
      setSelectedIds([]);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to bulk approve", { id: toastId });
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    const yes = await confirmDialog({
      title: "Bulk Reject Payouts?",
      description: `Reject ${selectedIds.length} selected payouts? Coins will be refunded to users.`,
      confirmText: "REJECT ALL",
      isDestructive: true,
    });
    if (!yes) return;
    const toastId = toast.loading(`Rejecting bulk payouts...`);
    try {
      await (bulkUpdatePayoutStatus as any)({ data: { payoutIds: selectedIds, status: "rejected" } });
      toast.success(`Successfully rejected ${selectedIds.length} payouts!`, { id: toastId });
      setSelectedIds([]);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to bulk reject", { id: toastId });
    }
  };

  const pendingCount = payouts.filter((p: any) => p.status === "pending").length;
  const pendingTotal = payouts.reduce(
    (s: number, p: any) => s + (p.status === "pending" ? p.amount : 0),
    0,
  );
  const paidTotal = payouts.reduce(
    (s: number, p: any) => s + (p.status === "completed" ? p.amount : 0),
    0,
  );

  const TABS: { key: FilterTab; label: string; count: number }[] = [
    {
      key: "pending",
      label: "Pending",
      count: payouts.filter((p: any) => p.status === "pending").length,
    },
    {
      key: "completed",
      label: "Completed",
      count: payouts.filter((p: any) => p.status === "completed").length,
    },
    {
      key: "rejected",
      label: "Rejected",
      count: payouts.filter((p: any) => p.status === "rejected").length,
    },
    { key: "all", label: "All", count: payouts.length },
  ];

  const filtered = useMemo(() => {
    let list = payouts;
    if (tab !== "all") {
      list = list.filter((p: any) => p.status === tab);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p: any) =>
          p.username?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.phone?.toLowerCase().includes(q) ||
          p.upi_id?.toLowerCase().includes(q) ||
          p.upi_number?.toLowerCase().includes(q) ||
          String(p.amount).includes(q)
      );
    }
    return list;
  }, [payouts, tab, search]);

  return (
    <div className="bg-background min-h-screen pb-2">
      {/* Header */}
      <div className="bg-card border-b border-border pt-6 pb-5 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground mb-4 bg-secondary/50 px-3 py-1.5 rounded-full transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-black text-foreground">Payouts</h1>
            <p className="text-xs text-muted-foreground font-semibold">Withdrawal requests</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-secondary/40 rounded-xl p-2.5 text-center">
            <div
              className={`font-display font-black text-lg ${pendingCount > 0 ? "text-amber-500" : "text-foreground"}`}
            >
              {pendingCount}
            </div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Pending
            </div>
            {pendingCount > 0 && (
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse mx-auto mt-1" />
            )}
          </div>
          <div className="bg-secondary/40 rounded-xl p-2.5 text-center">
            <div className="font-display font-black text-lg text-amber-500 text-sm">
              ₹{pendingTotal}
            </div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Pending ₹
            </div>
          </div>
          <div className="bg-secondary/40 rounded-xl p-2.5 text-center">
            <div className="font-display font-black text-lg text-emerald-500 text-sm">
              ₹{paidTotal}
            </div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Paid Out
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
            placeholder="Search username, email, UPI ID, amount..."
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

        {/* Tabs */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto hide-scrollbar pb-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setSelectedIds([]);
              }}
              className={`px-3 py-1.5 rounded-full font-bold text-xs whitespace-nowrap flex items-center gap-1.5 transition-colors shrink-0 ${
                tab === t.key
                  ? "bg-primary text-white"
                  : "bg-card border border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {t.label}
              <span
                className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${tab === t.key ? "bg-white/20" : "bg-secondary"}`}
              >
                {t.count}
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
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark Paid
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
            <Banknote className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
            <p className="font-semibold text-foreground">No {tab === "all" ? "" : tab} payouts</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((p: any, i: number) => {
                const isSelected = selectedIds.includes(p.id);
                const canSelect = p.status === "pending";
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: Math.min(i * 0.04, 0.3) }}
                    className={`bg-card rounded-2xl border overflow-hidden transition-all ${isSelected ? "border-primary/60 bg-primary/5" : p.status === "pending" ? "border-amber-400/30 shadow-md" : "border-border/50 shadow-sm"}`}
                  >
                    <div className="flex items-stretch">
                      {canSelect && (
                        <button
                          onClick={() => {
                            if (isSelected) {
                              setSelectedIds(selectedIds.filter((id) => id !== p.id));
                            } else {
                              setSelectedIds([...selectedIds, p.id]);
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
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="font-display font-black text-foreground">{p.username}</h3>
                              <span
                                className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full border ${STATUS_PILL[p.status] || ""}`}
                              >
                                {p.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-semibold">
                              {p.email || p.phone || "—"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 font-display font-black text-xl text-foreground">
                            <GodCoin className="w-5 h-5" /> {p.amount}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="bg-secondary/35 rounded-xl p-3 space-y-2 text-xs mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                              UPI ID
                            </span>
                            <span className="font-mono font-bold text-cta bg-primary/5 px-2 py-0.5 rounded">
                              {p.upi_id}
                            </span>
                          </div>
                          {p.upi_number && (
                            <div className="flex items-center justify-between border-t border-border pt-2">
                              <span className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                                UPI Phone
                              </span>
                              <span className="font-mono font-bold text-foreground">
                                {p.upi_number}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between border-t border-border pt-2">
                            <span className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                              Requested
                            </span>
                            <span className="text-foreground font-semibold">
                              {new Date(p.created_at).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>

                        {p.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              className="flex-1 h-10 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
                              onClick={() => handleResolve(p.id, p.user_id, p.amount, "completed")}
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Mark Paid
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 h-10 rounded-xl font-bold text-xs text-destructive border-destructive/20 hover:bg-destructive/10"
                              onClick={() => handleResolve(p.id, p.user_id, p.amount, "rejected")}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject
                            </Button>
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
      <AdminNavBar pendingPayouts={pendingCount} />
    </div>
  );
}
