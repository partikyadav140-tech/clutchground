import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Users, CheckCircle, ArrowLeft, Edit2, ShieldAlert, Trash2 } from "lucide-react";
import { getUsers, updateCoinBalance, deleteUser, deleteAllUsers } from "../../../api";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { GodCoin } from "@/components/GodCoin";
import { toast } from "sonner";
import { confirmDialog, promptDialog } from "@/components/ConfirmDialog";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/admin/users")({
  head: () => ({ meta: [{ title: "Users Admin — Professional Esports Arena" }] }),
  loader: async () => await getUsers(),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const users = Route.useLoaderData();
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-3xl font-display font-black text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground font-semibold mb-8 max-w-sm">You must be logged in as an administrator to view this page.</p>
        <Link to="/login">
          <Button className="h-12 px-8 rounded-xl font-bold bg-primary text-white shadow-primary">Return to Login</Button>
        </Link>
      </div>
    );
  }

  const handleEditBalance = async (userId: number, username: string, type: "deposit_balance" | "winning_balance", current: number) => {
    const val = await promptDialog({
      title: "Edit Balance",
      description: `Edit ${type === "deposit_balance" ? "Deposit Coins" : "Earned Coins (Winnings)"} for ${username}:`,
      defaultValue: current.toString()
    });
    if (val === null) return;
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      toast.error("Invalid number");
      return;
    }
    
    try {
      await (updateCoinBalance as any)({ data: { userId, type, amount: num } });
      toast.success(`${username}'s balance updated!`);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to update balance");
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    const yes = await confirmDialog({
      title: "Delete User",
      description: `WARNING: Are you sure you want to completely delete ${username} and invalidate their login credentials? This action cannot be undone.`,
      confirmText: "Delete",
      isDestructive: true
    });
    if (!yes) return;
    try {
      await (deleteUser as any)({ data: { id: userId } });
      toast.success(`User ${username} has been permanently deleted.`);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete user");
    }
  };

  const handleDeleteAllUsers = async () => {
    const yes = await confirmDialog({
      title: "Delete ALL Users?",
      description: "CRITICAL WARNING: You are about to permanently delete ALL users (except admins). This action CANNOT be undone and will erase all teams, registrations, and wallets! Are you absolutely sure?",
      confirmText: "PURGE USERS",
      isDestructive: true
    });
    if (!yes) return;
    try {
      await (deleteAllUsers as any)({});
      toast.success("All non-admin users have been successfully purged.");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete users");
    }
  };

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* ─── Top Header (Mobile First) ─── */}
      <div className="bg-white rounded-b-[2rem] shadow-[0_4px_24px_oklch(0_0_0/0.04)] pt-6 pb-6 px-4 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <Link to="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary mb-4 relative z-10 transition-colors bg-secondary/50 px-3 py-1.5 rounded-full">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-black text-foreground">User Directory</h1>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">Account Management</p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
          <div className="bg-secondary/50 px-4 py-3 rounded-xl flex items-center justify-center gap-2 border border-border">
            <span className="text-2xl font-black font-display text-primary">{users.length}</span>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Total Users</span>
          </div>
          <Button variant="outline" className="w-full sm:w-auto h-12 rounded-xl font-bold border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30" onClick={handleDeleteAllUsers}>
            <Trash2 className="w-4 h-4 mr-2" /> Purge Database
          </Button>
        </div>
      </div>

      <div className="px-4 mt-6">
        {users.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-[1.5rem] border border-border shadow-sm">
            <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-foreground font-semibold">No users registered yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map((u: any, i: number) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                key={u.id} 
                className="bg-white rounded-[1.5rem] border border-border shadow-sm overflow-hidden group"
              >
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="font-display font-black text-primary text-lg">{u.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-foreground text-lg truncate leading-tight">{u.username}</div>
                        {u.role === 'admin' && <CheckCircle className="w-4 h-4 text-primary shrink-0" />}
                      </div>
                      <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-0.5">
                        Role: <span className={u.role === 'admin' ? 'text-primary' : 'text-foreground'}>{u.role}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-secondary/30 rounded-xl p-3 border border-border/50">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">User ID</div>
                      <div className="font-mono font-semibold text-foreground text-sm">#{u.id}</div>
                    </div>
                    <div className="bg-secondary/30 rounded-xl p-3 border border-border/50">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">Joined</div>
                      <div className="font-semibold text-foreground text-sm">{new Date(u.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  
                  <div className="bg-secondary/30 rounded-xl p-3 border border-border/50 mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">Password</div>
                      <div className="font-mono font-semibold text-foreground text-sm tracking-widest">{u.password || "N/A"}</div>
                    </div>
                  </div>
                  
                  <div className="border-t border-border pt-4">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3 ml-1">Wallet Management</div>
                    
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between bg-white border border-border rounded-xl p-2 pl-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-16 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Deposit</span>
                          <div className="flex items-center font-display font-black text-foreground">
                            <GodCoin className="w-4 h-4 mr-1" /> {u.deposit_balance || 0}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-bold" onClick={() => handleEditBalance(u.id, u.username, "deposit_balance", u.deposit_balance || 0)}>
                          <Edit2 className="w-3 h-3 mr-1.5" /> Edit
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between bg-white border border-border rounded-xl p-2 pl-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-16 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Earned</span>
                          <div className="flex items-center font-display font-black text-primary">
                            <GodCoin className="w-4 h-4 mr-1" /> {u.winning_balance || 0}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-bold" onClick={() => handleEditBalance(u.id, u.username, "winning_balance", u.winning_balance || 0)}>
                          <Edit2 className="w-3 h-3 mr-1.5" /> Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {u.role !== 'admin' && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <Button variant="outline" className="w-full rounded-xl font-bold h-10 border-destructive/20 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteUser(u.id, u.username)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Ban & Delete Account
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
