import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Users,
  CheckCircle,
  ArrowLeft,
  Edit2,
  ShieldAlert,
  Trash2,
  Search,
  X,
  Shield,
  UserX,
  UserCheck,
  ChevronDown,
} from "lucide-react";
import {
  getUsers,
  updateCoinBalance,
  banUser,
  unbanUser,
  deleteUser,
  deleteAllUsers,
  updateUserRole,
} from "../../../api";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { GodCoin } from "@/components/GodCoin";
import { toast } from "sonner";
import { confirmDialog, promptDialog } from "@/components/ConfirmDialog";
import { motion, AnimatePresence } from "framer-motion";
import { AdminNavBar } from "@/components/AdminNavBar";
import { SkeletonAdminTable } from "@/components/SkeletonPage";

export const Route = createFileRoute("/_app/admin/users")({
  head: () => ({ meta: [{ title: "Users Admin — CLUTCHGROUND" }] }),
  loader: async () => {
    try {
      return await getUsers();
    } catch {
      return [];
    }
  },
  component: AdminUsersPage,
});

type FilterType = "all" | "active" | "banned" | "admin";

function AdminUsersPage() {
  const users = Route.useLoaderData() as any[];
  const { user, loading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});

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
        <Link to="/login">
          <Button className="h-12 px-8 rounded-xl font-bold bg-primary text-white">
            Return to Login
          </Button>
        </Link>
      </div>
    );
  }

  const filteredUsers = useMemo(() => {
    let list = users;
    if (filter === "banned") list = list.filter((u: any) => u.banned);
    else if (filter === "active") list = list.filter((u: any) => !u.banned && u.role !== "admin");
    else if (filter === "admin") list = list.filter((u: any) => u.role === "admin");

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u: any) =>
          u.username?.toLowerCase().includes(q) ||
          u.ign?.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [users, search, filter]);

  const stats = useMemo(
    () => ({
      total: users.filter((u: any) => u.role !== "admin").length,
      banned: users.filter((u: any) => u.banned).length,
      admins: users.filter((u: any) => u.role === "admin").length,
    }),
    [users],
  );

  const handleEditBalance = async (
    userId: number,
    username: string,
    type: "deposit_balance" | "winning_balance",
    current: number,
  ) => {
    const val = await promptDialog({
      title: "Edit Balance",
      description: `Edit ${type === "deposit_balance" ? "Deposit Coins" : "Earned Coins"} for ${username}:`,
      defaultValue: current.toString(),
    });
    if (val === null) return;
    const num = parseInt(val, 10);
    if (isNaN(num)) return toast.error("Invalid number");
    try {
      await (updateCoinBalance as any)({ data: { userId, type, amount: num } });
      toast.success(`${username}'s balance updated!`);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  const handleBan = async (userId: number, username: string) => {
    const yes = await confirmDialog({
      title: "Ban User",
      description: `Ban ${username}? They'll be logged out and cannot make withdrawals.`,
      confirmText: "Ban",
      isDestructive: true,
    });
    if (!yes) return;
    try {
      await (banUser as any)({ data: { id: userId } });
      toast.success(`${username} banned.`);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  const handleUnban = async (userId: number, username: string) => {
    const yes = await confirmDialog({
      title: "Unban User",
      description: `Lift the ban on ${username}? They'll regain full access.`,
      confirmText: "Unban",
      isDestructive: false,
    });
    if (!yes) return;
    try {
      await (unbanUser as any)({ data: { id: userId } });
      toast.success(`${username} unbanned.`);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  const handleDelete = async (userId: number, username: string) => {
    const yes = await confirmDialog({
      title: "Delete User",
      description: `Permanently delete ${username}? This cannot be undone.`,
      confirmText: "Delete",
      isDestructive: true,
    });
    if (!yes) return;
    try {
      await (deleteUser as any)({ data: { id: userId } });
      toast.success(`${username} deleted.`);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  const handleRoleToggle = async (userId: number, username: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const yes = await confirmDialog({
      title: `Make ${newRole === "admin" ? "Admin" : "Regular User"}?`,
      description: `${newRole === "admin" ? `Grant ${username} admin access to the command center?` : `Revoke ${username}'s admin privileges?`}`,
      confirmText: newRole === "admin" ? "Grant Admin" : "Revoke Admin",
      isDestructive: newRole !== "admin",
    });
    if (!yes) return;
    try {
      await (updateUserRole as any)({ data: { id: userId, role: newRole } });
      toast.success(`${username} is now a ${newRole}.`);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  const handleDeleteAll = async () => {
    const yes = await confirmDialog({
      title: "Delete ALL Users?",
      description:
        "CRITICAL: This permanently deletes ALL non-admin users including teams, registrations and wallets. Cannot be undone!",
      confirmText: "PURGE USERS",
      isDestructive: true,
    });
    if (!yes) return;
    try {
      await (deleteAllUsers as any)({});
      toast.success("All non-admin users purged.");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  const FILTER_TABS: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: "All", count: users.length },
    { key: "active", label: "Active", count: stats.total - stats.banned },
    { key: "banned", label: "Banned", count: stats.banned },
    { key: "admin", label: "Admins", count: stats.admins },
  ];

  return (
    <div className="bg-background min-h-screen pb-2">
      {/* Header */}
      <div className="bg-card border-b border-border pt-6 pb-5 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground mb-4 bg-secondary/50 px-3 py-1.5 rounded-full transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <h1 className="font-display text-2xl font-black text-foreground">Users</h1>
            </div>
            <p className="text-xs text-muted-foreground font-semibold">
              {stats.total} registered · {stats.banned} banned · {stats.admins} admins
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl font-bold border-destructive/20 text-destructive hover:bg-destructive/10 h-9 px-3 text-xs"
            onClick={handleDeleteAll}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Purge
          </Button>
        </div>

        {/* Stats row */}
        <div className="flex gap-2 mt-4">
          {[
            { label: "Users", val: stats.total, color: "text-foreground" },
            { label: "Banned", val: stats.banned, color: "text-red-500" },
            { label: "Admins", val: stats.admins, color: "text-cta" },
          ].map((s) => (
            <div key={s.label} className="flex-1 bg-secondary/40 rounded-xl p-2.5 text-center">
              <div className={`font-display font-black text-lg ${s.color}`}>{s.val}</div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Search bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username, IGN, email..."
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
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-full font-bold text-xs whitespace-nowrap flex items-center gap-1.5 transition-colors shrink-0 ${
                filter === tab.key
                  ? "bg-primary text-white"
                  : "bg-card border border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {tab.label}
              <span
                className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${filter === tab.key ? "bg-white/20" : "bg-secondary"}`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="text-xs font-bold text-muted-foreground mb-3">
          {filteredUsers.length} result{filteredUsers.length !== 1 ? "s" : ""}
          {search && ` for "${search}"`}
        </div>

        {/* User cards */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <Users className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
            <p className="font-semibold text-foreground">No users found</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filteredUsers.map((u: any, i: number) => {
                const isExpanded = expandedId === u.id;
                return (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: Math.min(i * 0.03, 0.3) }}
                    className={`bg-card rounded-2xl border overflow-hidden transition-all ${
                      u.banned
                        ? "border-red-500/20"
                        : u.role === "admin"
                          ? "border-cta/20"
                          : "border-border/50"
                    }`}
                  >
                    {/* Collapsed row */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : u.id)}
                      className="w-full flex items-center gap-3 p-3.5 text-left"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-display font-black text-lg ${
                          u.role === "admin"
                            ? "bg-cta/10 text-cta"
                            : u.banned
                              ? "bg-red-500/10 text-red-500"
                              : "bg-primary/10 text-primary"
                        }`}
                      >
                        {u.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-black text-foreground truncate">
                            {u.username}
                          </span>
                          {u.role === "admin" && (
                            <CheckCircle className="w-3.5 h-3.5 text-cta shrink-0" />
                          )}
                          {u.banned && (
                            <span className="text-[9px] font-black text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                              BANNED
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-semibold truncate">
                          {u.ign ? `IGN: ${u.ign}` : u.email || `ID: #${u.id}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-0.5 text-xs font-bold text-foreground">
                          <GodCoin className="w-3.5 h-3.5" />
                          <span>{(u.deposit_balance || 0) + (u.winning_balance || 0)}</span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </button>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden border-t border-border/50"
                        >
                          <div className="p-4 space-y-3">
                            {/* Info grid */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {[
                                { label: "User ID", val: `#${u.id}` },
                                { label: "Role", val: u.role },
                                {
                                  label: "Joined",
                                  val: new Date(u.created_at).toLocaleDateString("en-IN"),
                                },
                                { label: "Email", val: u.email || "—" },
                              ].map(({ label, val }) => (
                                <div key={label} className="bg-secondary/30 rounded-xl p-2.5">
                                  <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-0.5">
                                    {label}
                                  </div>
                                  <div className="font-semibold text-foreground truncate">
                                    {val}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Password (Show/Hide toggle for Admin only) */}
                            <div className="bg-secondary/30 rounded-xl p-2.5 flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-0.5">
                                  Password
                                </div>
                                <div className="font-mono text-sm font-bold text-foreground truncate">
                                  {showPasswords[u.id] ? u.password_plain || "—" : "••••••••"}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setShowPasswords((prev) => ({ ...prev, [u.id]: !prev[u.id] }))
                                }
                                className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 press-effect shrink-0 ml-2"
                              >
                                {showPasswords[u.id] ? "Hide" : "Show"}
                              </button>
                            </div>

                            {/* Wallet management */}
                            <div>
                              <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
                                Wallet
                              </div>
                              <div className="space-y-1.5">
                                {[
                                  {
                                    type: "deposit_balance" as const,
                                    label: "Deposit",
                                    val: u.deposit_balance || 0,
                                  },
                                  {
                                    type: "winning_balance" as const,
                                    label: "Earned",
                                    val: u.winning_balance || 0,
                                  },
                                ].map(({ type, label, val }) => (
                                  <div
                                    key={type}
                                    className="flex items-center justify-between bg-card border border-border/60 rounded-xl px-3 py-2"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-bold text-muted-foreground w-14">
                                        {label}
                                      </span>
                                      <GodCoin className="w-3.5 h-3.5" />
                                      <span className="font-display font-black text-sm text-foreground">
                                        {val}
                                      </span>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 rounded-lg text-[10px] font-bold px-2"
                                      onClick={() => handleEditBalance(u.id, u.username, type, val)}
                                    >
                                      <Edit2 className="w-3 h-3 mr-1" /> Edit
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Action buttons */}
                            {u.role !== "admin" || user.id !== u.id ? (
                              <div className="grid grid-cols-2 gap-1.5 pt-1">
                                {u.banned ? (
                                  <Button
                                    variant="outline"
                                    className="col-span-2 h-9 rounded-xl font-bold text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"
                                    onClick={() => handleUnban(u.id, u.username)}
                                  >
                                    <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Unban User
                                  </Button>
                                ) : (
                                  <>
                                    <Button
                                      variant="outline"
                                      className="h-9 rounded-xl font-bold text-xs border-orange-500/30 text-orange-600 hover:bg-orange-50"
                                      onClick={() => handleBan(u.id, u.username)}
                                    >
                                      <UserX className="w-3.5 h-3.5 mr-1" /> Ban
                                    </Button>
                                    <Button
                                      variant="outline"
                                      className={`h-9 rounded-xl font-bold text-xs ${u.role === "admin" ? "border-purple-500/30 text-purple-600 hover:bg-purple-50" : "border-primary/30 text-primary hover:bg-primary/5"}`}
                                      onClick={() => handleRoleToggle(u.id, u.username, u.role)}
                                    >
                                      <Shield className="w-3.5 h-3.5 mr-1" />
                                      {u.role === "admin" ? "Demote" : "Make Admin"}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      className="col-span-2 h-9 rounded-xl font-bold text-xs border-destructive/20 text-destructive hover:bg-destructive/10"
                                      onClick={() => handleDelete(u.id, u.username)}
                                    >
                                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Account
                                    </Button>
                                  </>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AdminNavBar />
    </div>
  );
}
