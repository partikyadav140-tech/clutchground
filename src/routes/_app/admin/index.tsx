import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Users,
  Trophy,
  ClipboardList,
  Banknote,
  Mail,
  ShieldAlert,
  RefreshCw,
  Bell,
  LifeBuoy,
  IndianRupee,
  Settings,
  TrendingUp,
  AlertCircle,
  Activity,
  Zap,
  Crown,
  Coins,
  RotateCcw,
  ChevronRight,
  Clock,
  Eye,
  Sparkles,
  Store,
} from "lucide-react";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { getAdminStats, resetFinanceStat } from "../../../api";
import { AdminNavBar } from "@/components/AdminNavBar";
import { toast } from "sonner";
import { CountdownTimer } from "@/components/CountdownTimer";
import { GodCoin } from "@/components/GodCoin";
import { SkeletonAdminTable } from "@/components/SkeletonPage";
import { useSocket } from "@/hooks/useSocket";

export const Route = createFileRoute("/_app/admin/")({
  head: () => ({ meta: [{ title: "Command Center — CLUTCHGROUND" }] }),
  loader: async () => {
    try {
      return await (getAdminStats as any)();
    } catch {
      return null;
    }
  },
  component: AdminDashboard,
} as any);

/* ── Stat Strip ── */
function StatStrip({
  icon: Icon,
  label,
  value,
  color,
  bg,
  urgent = false,
  to,
}: {
  icon: any;
  label: string;
  value: number | string;
  color: string;
  bg: string;
  urgent?: boolean;
  to?: string;
}) {
  const inner = (
    <div
      className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl border transition-all active:scale-[0.98] ${
        urgent && Number(value) > 0
          ? "border-amber-400/40 bg-amber-500/5 shadow-sm"
          : "border-border/40 bg-card shadow-sm"
      }`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground leading-none">
          {label}
        </p>
        <p
          className={`font-display font-black text-lg leading-tight mt-0.5 ${
            urgent && Number(value) > 0 ? "text-amber-500" : "text-foreground"
          }`}
        >
          {value}
        </p>
      </div>
      {urgent && Number(value) > 0 && (
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
      )}
      {to && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
    </div>
  );
  if (to)
    return (
      <Link to={to} className="block">
        {inner}
      </Link>
    );
  return inner;
}

/* ── Section Header ── */
function SectionHeader({ label, icon: Icon, color }: { label: string; icon: any; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-2.5 mt-5">
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </span>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  );
}

/* ── Quick Action Link ── */
function QuickAction({
  to,
  icon: Icon,
  title,
  desc,
  color,
  bg,
  badge,
}: {
  to: string;
  icon: any;
  title: string;
  desc: string;
  color: string;
  bg: string;
  badge?: number;
}) {
  return (
    <Link to={to} className="block">
      <div className="flex items-center gap-3 px-3.5 py-3 rounded-2xl border border-border/40 bg-card shadow-sm transition-all active:scale-[0.98] hover:border-border">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-black text-[13px] text-foreground leading-tight">
            {title}
          </h3>
          <p className="text-[10px] font-semibold text-muted-foreground mt-0.5 leading-snug">
            {desc}
          </p>
        </div>
        {badge !== undefined && badge > 0 && (
          <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full min-w-[22px] text-center">
            {badge}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
      </div>
    </Link>
  );
}

function AdminDashboard() {
  const { user, loading } = useAuth();
  const stats = Route.useLoaderData() as any;
  const router = useRouter();

  const { on: socketOn } = useSocket();
  useEffect(() => {
    if (!socketOn) return;
    const cleanup = socketOn("new-notification", (notif: any) => {
      router.invalidate();
      if (notif.message) {
        toast.info(notif.message, {
          description: "Dashboard updated in real-time.",
        });
      }
    });
    return () => cleanup();
  }, [socketOn, router]);

  const handleResetFinance = async (type: "revenue" | "payouts" | "withdrawable") => {
    const ok = window.confirm(
      `Are you sure you want to reset this calculation to zero? This won't affect any user's real balance.`,
    );
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
      <div className="min-h-[60vh] bg-background pb-6">
        <SkeletonAdminTable />
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

  const pendingTotal =
    (stats?.pendingDeposits || 0) + (stats?.pendingPayouts || 0) + (stats?.openTickets || 0);
  const latestTournaments = (stats?.latestTournaments || []).slice(0, 3);

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* ─── Hero Header ─── */}
      <div className="relative overflow-hidden bg-card border-b border-border/50 pt-5 pb-5 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-15"
            style={{ background: "var(--neon)" }}
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-primary font-black text-[10px] uppercase tracking-[0.2em] mb-1">
                <Crown className="w-3.5 h-3.5" /> Admin Panel
              </div>
              <h1 className="text-2xl font-display font-black text-foreground leading-tight">
                Command Center
              </h1>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground font-bold">Welcome</p>
              <p className="text-sm font-black text-foreground">{user.username}</p>
            </div>
          </div>

          {/* Pending actions banner */}
          {pendingTotal > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3.5 py-2.5 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex-1">
                {[
                  stats?.pendingDeposits > 0 &&
                    `${stats.pendingDeposits} deposit${stats.pendingDeposits > 1 ? "s" : ""}`,
                  stats?.pendingPayouts > 0 &&
                    `${stats.pendingPayouts} payout${stats.pendingPayouts > 1 ? "s" : ""}`,
                  stats?.openTickets > 0 &&
                    `${stats.openTickets} ticket${stats.openTickets > 1 ? "s" : ""}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}{" "}
                pending
              </span>
            </motion.div>
          )}
        </div>
      </div>

      <div className="px-4">
        {/* ─── Urgent Actions ─── */}
        <SectionHeader label="Needs Attention" icon={AlertCircle} color="text-amber-500" />
        <div className="space-y-2">
          <StatStrip
            icon={IndianRupee}
            label="Pending Deposits"
            value={stats?.pendingDeposits ?? 0}
            color="text-blue-500"
            bg="bg-blue-500/10"
            urgent
            to="/admin/deposits"
          />
          <StatStrip
            icon={Banknote}
            label="Pending Payouts"
            value={stats?.pendingPayouts ?? 0}
            color="text-emerald-500"
            bg="bg-emerald-500/10"
            urgent
            to="/admin/payouts"
          />
          <StatStrip
            icon={LifeBuoy}
            label="Open Tickets"
            value={stats?.openTickets ?? 0}
            color="text-teal-500"
            bg="bg-teal-500/10"
            urgent
            to="/admin/tickets"
          />
        </div>

        {/* ─── Latest Tournaments ─── */}
        {latestTournaments.length > 0 && (
          <>
            <SectionHeader label="Latest Tournaments" icon={Trophy} color="text-amber-500" />
            <div className="space-y-2">
              {latestTournaments.map((t: any) => (
                <Link key={t.id} to="/admin/tournaments" className="block">
                  <div className="flex items-center gap-3 px-3.5 py-3 rounded-2xl border border-border/40 bg-card shadow-sm transition-all active:scale-[0.98]">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Trophy className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-black text-[13px] text-foreground truncate">
                          {t.title}
                        </h4>
                        {t.tournament_code && (
                          <span className="text-[9px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                            {t.tournament_code}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            t.status === "open"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : t.status === "live"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : t.status === "upcoming"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                  : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {t.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {t.mode} · {t.filled}/{t.slots}
                        </span>
                      </div>
                    </div>
                    {t.startsat && (
                      <div className="shrink-0">
                        <CountdownTimer targetDate={t.startsat} status={t.status} compact />
                      </div>
                    )}
                  </div>
                </Link>
              ))}
              <Link to="/admin/tournaments" className="block">
                <div className="flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                  View all tournaments <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            </div>
          </>
        )}

        {/* ─── Platform Overview ─── */}
        <SectionHeader label="Platform" icon={Activity} color="text-primary" />
        <div className="grid grid-cols-2 gap-2">
          <StatStrip
            icon={Users}
            label="Users"
            value={stats?.totalUsers ?? 0}
            color="text-purple-500"
            bg="bg-purple-500/10"
            to="/admin/users"
          />
          <StatStrip
            icon={ShieldAlert}
            label="Banned"
            value={stats?.bannedUsers ?? 0}
            color="text-red-500"
            bg="bg-red-500/10"
            to="/admin/users"
          />
          <StatStrip
            icon={Trophy}
            label="Live"
            value={stats?.liveTournaments ?? 0}
            color="text-amber-500"
            bg="bg-amber-500/10"
            to="/admin/tournaments"
          />
          <StatStrip
            icon={Zap}
            label="Open"
            value={stats?.openTournaments ?? 0}
            color="text-sky-500"
            bg="bg-sky-500/10"
            to="/admin/tournaments"
          />
        </div>

        {/* ─── Finance ─── */}
        <SectionHeader label="Finance" icon={TrendingUp} color="text-emerald-500" />
        <div className="space-y-2">
          {[
            {
              icon: IndianRupee,
              label: "Total Deposited",
              value: `₹${stats?.totalRevenue ?? 0}`,
              color: "text-emerald-500",
              bg: "bg-emerald-500/10",
              type: "revenue" as const,
              to: "/admin/deposits",
            },
            {
              icon: Banknote,
              label: "Total Paid Out",
              value: `₹${stats?.totalPayouts ?? 0}`,
              color: "text-rose-500",
              bg: "bg-rose-500/10",
              type: "payouts" as const,
              to: "/admin/payouts",
            },
            {
              icon: Coins,
              label: "Total Withdrawable",
              value: `₹${stats?.totalWithdrawable ?? 0}`,
              color: "text-amber-500",
              bg: "bg-amber-500/10",
              type: "withdrawable" as const,
              to: "/admin/users",
            },
          ].map((item) => (
            <div key={item.type} className="relative">
              <StatStrip
                icon={item.icon}
                label={item.label}
                value={item.value}
                color={item.color}
                bg={item.bg}
                to={item.to}
              />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleResetFinance(item.type);
                }}
                className="absolute top-3 right-10 p-1.5 rounded-lg bg-secondary/80 hover:bg-muted-foreground/15 text-muted-foreground transition-colors cursor-pointer z-10"
                title="Reset calculation to zero"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* ─── Quick Actions ─── */}
        <SectionHeader label="Quick Actions" icon={Zap} color="text-violet-500" />
        <div className="space-y-2 mb-4">
          <QuickAction
            to="/admin/tournaments"
            icon={Trophy}
            title="Manage Tournaments"
            desc="Create, edit & delete events"
            color="text-amber-500"
            bg="bg-amber-500/10"
          />
          <QuickAction
            to="/admin/registrations"
            icon={ClipboardList}
            title="Registrations"
            desc="View player rosters"
            color="text-blue-500"
            bg="bg-blue-500/10"
          />
          <QuickAction
            to="/admin/leaderboard"
            icon={RefreshCw}
            title="Leaderboard"
            desc="Adjust weekly standings"
            color="text-violet-500"
            bg="bg-violet-500/10"
          />
          <QuickAction
            to="/admin/notifications"
            icon={Bell}
            title="Broadcast"
            desc="Push alerts to users"
            color="text-pink-500"
            bg="bg-pink-500/10"
          />
          <QuickAction
            to="/admin/messages"
            icon={Mail}
            title="Messages"
            desc="User contact inbox"
            color="text-sky-500"
            bg="bg-sky-500/10"
          />
          <QuickAction
            to="/admin/spin-wheel"
            icon={Sparkles}
            title="Spin Wheel"
            desc="Manage wheel & prizes"
            color="text-primary"
            bg="bg-primary/10"
          />
          <QuickAction
            to="/admin/profile-shop"
            icon={Store}
            title="Profile Shop"
            desc="Cosmetics & banners"
            color="text-orange-500"
            bg="bg-orange-500/10"
          />
          <QuickAction
            to="/admin/site-settings"
            icon={Settings}
            title="Site Settings"
            desc="UPI, announcements, etc."
            color="text-orange-500"
            bg="bg-orange-500/10"
          />
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
