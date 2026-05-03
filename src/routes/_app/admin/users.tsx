import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { PageHeader } from "../tournaments/index";
import { Users, CheckCircle, ArrowLeft, Edit2 } from "lucide-react";
import { getUsers, updateCoinBalance, deleteUser, deleteAllUsers } from "../../../api";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { GodCoin } from "@/components/GodCoin";
import { toast } from "sonner";
import { confirmDialog, promptDialog } from "@/components/ConfirmDialog";

export const Route = createFileRoute("/_app/admin/users")({
  head: () => ({ meta: [{ title: "Users Admin — CLUTCHGROUND" }] }),
  loader: async () => await getUsers(),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const users = Route.useLoaderData();
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) return <div className="p-20 text-center">Loading...</div>;
  if (!user || user.role !== 'admin') {
    return <div className="p-20 text-center text-destructive font-bold">ACCESS DENIED</div>;
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
    <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-16 space-y-8">
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-display uppercase tracking-widest text-muted-foreground hover:text-primary mb-2">
        <ArrowLeft className="w-4 h-4" /> Back to Admin
      </Link>
      <PageHeader title="Registered Users" subtitle="Database" />

      <div className="bg-card-gradient border border-border clip-notch p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="font-display text-sm uppercase tracking-[0.25em] text-primary flex items-center gap-2">
            <Users className="w-4 h-4" /> User Directory ({users.length})
          </h3>
          <Button variant="outlineFire" size="sm" onClick={handleDeleteAllUsers} className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive">
            Delete All Users
          </Button>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {users.map((u: any) => (
            <div key={u.id} className="p-4 bg-secondary/60 border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-start gap-2 mb-2">
                  <div className="font-bold text-primary text-lg truncate">{u.username}</div>
                  {u.role === 'admin' && <span title="Admin User" className="mt-1.5"><CheckCircle className="w-4 h-4 text-primary shrink-0" /></span>}
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>Role: <span className="text-foreground uppercase">{u.role}</span></div>
                  <div>ID: <span className="text-foreground">{u.id}</span></div>
                  <div>Joined: <span className="text-foreground">{new Date(u.created_at).toLocaleDateString()}</span></div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 shrink-0 bg-background/50 p-3 border border-border/50 rounded-md">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Manage CG Coins</div>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-muted-foreground text-xs w-14">Deposit:</span>
                    <GodCoin className="w-3.5 h-3.5" /> <span className="font-bold">{u.deposit_balance || 0}</span>
                  </div>
                  <Button variant="outline" size="sm" className="h-6 px-2 py-0 text-[10px]" onClick={() => handleEditBalance(u.id, u.username, "deposit_balance", u.deposit_balance || 0)}>
                    <Edit2 className="w-3 h-3 mr-1" /> Edit
                  </Button>
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-muted-foreground text-xs w-14">Winnings:</span>
                    <GodCoin className="w-3.5 h-3.5" /> <span className="font-bold text-gold">{u.winning_balance || 0}</span>
                  </div>
                  <Button variant="outline" size="sm" className="h-6 px-2 py-0 text-[10px]" onClick={() => handleEditBalance(u.id, u.username, "winning_balance", u.winning_balance || 0)}>
                    <Edit2 className="w-3 h-3 mr-1" /> Edit
                  </Button>
                </div>
                
                {u.role !== 'admin' && (
                  <Button variant="outline" size="sm" className="h-6 mt-1 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground text-[10px] w-full" onClick={() => handleDeleteUser(u.id, u.username)}>
                    Delete User
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
