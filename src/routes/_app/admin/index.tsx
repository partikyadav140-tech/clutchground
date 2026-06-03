import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  Users, Trophy, ClipboardList, Banknote, Mail, ShieldAlert,
  RefreshCw, Bell, LifeBuoy, IndianRupee, Settings, TrendingUp,
  AlertCircle, Activity, Zap, Crown, Coins, RotateCcw,
} from "lucide-react";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { getAdminStats, resetFinanceStat } from "../../../api";
import { AdminNavBar } from "@/components/AdminNavBar";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/")({
  head: () => ({ meta: [{ title: "Command Center — CLUTCHGROUND" }] }),
  loader: async () => await (getAdminStats as any)(),
  component: AdminDashboard,
} as any);

function StatCard({
  icon: Icon, label, value, color, bg, urgent = false, to, action,
}: {
  icon: any; label: string; value: number | string; color: string; bg: string;
  urgent?: boolean; to?: string; action?: React.ReactNode;
}) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-card rounded-2xl border overflow-hidden p-4 transition-all active:scale-95 ${urgent && Number(value) > 0 ? "border-amber-400/40 shadow-amber-500/10 shadow-lg" : "border-border/50 shadow-sm"}`}
    >
      {urgent && Number(value) > 0 && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      )}
      {action && (
        <div className="absolute top-2 right-2 z-30" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
          {action}
        </div>
      )}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bg} ${color}`}>
        <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
      </div>
      <div className={`font-display font-black text-2xl leading-none mb-1 ${urgent && Number(value) > 0 ? "text-amber-500" : "text-foreground"}`}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground leading-tight">
        {label}
      </div>
    </motion.div>
  );

  if (to) return <Link to={to} className="block">{inner}</Link>;
  return inner;
}

function SectionHeader({ label, icon: Icon, color }: { label: string; icon: any; color: string }) {
  return (
    <div className={`flex items-center gap-2 mb-3 mt-6`}>
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="flex-1 h-px bg-border/50" />
    </div>
  );
}

function AdminDashboard() {
  const { user, loading } = useAuth();
  const stats = Route.useLoaderData() as any;
  const router = useRouter();

  const handleResetFinance = async (type: "revenue" | "payouts" | "withdrawable") => {
    const ok = window.confirm(`Are you sure you want to reset this calculation to zero? This won't affect any user's real balance.`);
    if (!ok) return;

    try {
      await (resetFinanceStat as any)({ data: { type } });
      toast.success("Calculation refreshed to zero!");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to reset calculation");
    }
  };

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
          You must be logged in as an administrator to view the command center.
        </p>
        <Link to="/login">
          <Button className="h-12 px-8 rounded-xl font-bold bg-primary text-white shadow-primary">
            Return to Login
          </Button>
        </Link>
      </div>
    );
  }

  const hasPendingActions = (stats?.pendingDeposits || 0) + (stats?.pendingPayouts || 0) + (stats?.openTickets || 0) > 0;

  return (
    <div className="bg-background min-h-screen pb-2">
      {/* ─── Hero Header ─── */}
      <div className="relative overflow-hidden bg-card border-b border-border pt-6 pb-6 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20" style={{ background: "var(--neon)" }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-2xl opacity-10" style={{ background: "var(--primary)" }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-cta font-black text-xs uppercase tracking-widest mb-2">
            <Crown className="w-4 h-4" /> Admin Panel
          </div>
          <h1 className="text-3xl font-display font-black text-foreground">Command Center</h1>
          <p className="text-sm text-muted-foreground font-semibold mt-1">Full platform control. Welcome, {user.username}.</p>

          {hasPendingActions && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-xs font-bold text-amber-600">
                {[
                  stats?.pendingDeposits > 0 && `${stats.pendingDeposits} pending deposit${stats.pendingDeposits > 1 ? "s" : ""}`,
                  stats?.pendingPayouts > 0 && `${stats.pendingPayouts} pending payout${stats.pendingPayouts > 1 ? "s" : ""}`,
                  stats?.openTickets > 0 && `${stats.openTickets} open ticket${stats.openTickets > 1 ? "s" : ""}`,
                ].filter(Boolean).join(" • ")} — action needed
              </span>
            </motion.div>
          )}
        </div>
      </div>

      <div className="px-4 pt-4">

        {/* ─── Urgent Actions ─── */}
        <SectionHeader label="Needs Attention" icon={AlertCircle} color="text-amber-500" />
        <div className="grid grid-cols-3 gap-2.5">
          <StatCard icon={IndianRupee} label="Deposits" value={stats?.pendingDeposits ?? 0} color="text-blue-500" bg="bg-blue-500/10" urgent to="/admin/deposits" />
          <StatCard icon={Banknote} label="Payouts" value={stats?.pendingPayouts ?? 0} color="text-emerald-500" bg="bg-emerald-500/10" urgent to="/admin/payouts" />
          <StatCard icon={LifeBuoy} label="Tickets" value={stats?.openTickets ?? 0} color="text-teal-500" bg="bg-teal-500/10" urgent to="/admin/tickets" />
        </div>

        {/* ─── Platform Overview ─── */}
        <SectionHeader label="Platform Overview" icon={Activity} color="text-primary" />
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard icon={Users} label="Total Users" value={stats?.totalUsers ?? 0} color="text-purple-500" bg="bg-purple-500/10" to="/admin/users" />
          <StatCard icon={ShieldAlert} label="Banned" value={stats?.bannedUsers ?? 0} color="text-red-500" bg="bg-red-500/10" to="/admin/users" />
          <StatCard icon={Trophy} label="Live Events" value={stats?.liveTournaments ?? 0} color="text-amber-500" bg="bg-amber-500/10" to="/admin/tournaments" />
          <StatCard icon={Zap} label="Open Slots" value={stats?.openTournaments ?? 0} color="text-sky-500" bg="bg-sky-500/10" to="/admin/tournaments" />
        </div>

        {/* ─── Finance ─── */}
        <SectionHeader label="Finance" icon={TrendingUp} color="text-emerald-500" />
        <div className="grid grid-cols-3 gap-2.5">
          <StatCard
            icon={IndianRupee}
            label="Total Deposited"
            value={`₹${stats?.totalRevenue ?? 0}`}
            color="text-emerald-500"
            bg="bg-emerald-500/10"
            to="/admin/deposits"
            action={
              <button
                onClick={() => handleResetFinance("revenue")}
                className="p-1 rounded-lg bg-secondary hover:bg-muted-foreground/15 text-muted-foreground transition-colors cursor-pointer"
                title="Reset calculation to zero"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            }
          />
          <StatCard
            icon={Banknote}
            label="Total Paid Out"
            value={`₹${stats?.totalPayouts ?? 0}`}
            color="text-rose-500"
            bg="bg-rose-500/10"
            to="/admin/payouts"
            action={
              <button
                onClick={() => handleResetFinance("payouts")}
                className="p-1 rounded-lg bg-secondary hover:bg-muted-foreground/15 text-muted-foreground transition-colors cursor-pointer"
                title="Reset calculation to zero"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            }
          />
          <StatCard
            icon={Coins}
            label="Total Withdrawable"
            value={`₹${stats?.totalWithdrawable ?? 0}`}
            color="text-amber-500"
            bg="bg-amber-500/10"
            to="/admin/users"
            action={
              <button
                onClick={() => handleResetFinance("withdrawable")}
                className="p-1 rounded-lg bg-secondary hover:bg-muted-foreground/15 text-muted-foreground transition-colors cursor-pointer"
                title="Reset calculation to zero"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            }
          />
        </div>

        {/* ─── Quick Actions Grid ─── */}
        <SectionHeader label="Quick Actions" icon={Zap} color="text-violet-500" />
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {[
            { to: "/admin/tournaments", icon: Trophy, title: "Manage Tournaments", desc: "Create, edit & delete events", color: "text-amber-500", bg: "bg-amber-500/10" },
            { to: "/admin/registrations", icon: ClipboardList, title: "Registrations", desc: "View player rosters", color: "text-blue-500", bg: "bg-blue-500/10" },
            { to: "/admin/leaderboard", icon: RefreshCw, title: "Leaderboard", desc: "Adjust weekly standings", color: "text-violet-500", bg: "bg-violet-500/10" },
            { to: "/admin/notifications", icon: Bell, title: "Broadcast", desc: "Push alerts to users", color: "text-pink-500", bg: "bg-pink-500/10" },
            { to: "/admin/messages", icon: Mail, title: "Messages", desc: "User contact inbox", color: "text-sky-500", bg: "bg-sky-500/10" },
            { to: "/admin/site-settings", icon: Settings, title: "Site Settings", desc: "UPI, announcements, etc.", color: "text-orange-500", bg: "bg-orange-500/10" },
          ].map((link, i) => (
            <Link key={link.to} to={link.to} className="block">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-md hover:border-border transition-all p-4 flex flex-col h-full group active:scale-95"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${link.bg} ${link.color}`}>
                  <link.icon className="w-[18px] h-[18px]" />
                </div>
                <h3 className="font-display font-black text-[13px] text-foreground leading-tight mb-1">{link.title}</h3>
                <p className="text-[10px] font-bold text-muted-foreground leading-snug">{link.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      <AdminNavBar
        pendingDeposits={stats?.pendingDeposits ?? 0}
        pendingPayouts={stats?.pendingPayouts ?? 0}
        openTickets={stats?.openTickets ?? 0}
      />
    </div>
  );
}
