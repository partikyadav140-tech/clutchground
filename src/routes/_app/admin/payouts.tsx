import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { PageHeader } from "../tournaments/index";
import { ArrowLeft, Banknote, CheckCircle, XCircle, Clock } from "lucide-react";
import { getPayouts, updatePayoutStatus } from "../../../api";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { GodCoin } from "@/components/GodCoin";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/payouts")({
  head: () => ({ meta: [{ title: "Payouts Admin — GOD ESPORTS" }] }),
  loader: async () => await getPayouts(),
  component: AdminPayoutsPage,
});

function AdminPayoutsPage() {
  const payouts = Route.useLoaderData();
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) return <div className="p-20 text-center">Loading...</div>;
  if (!user || user.role !== 'admin') {
    return <div className="p-20 text-center text-destructive font-bold">ACCESS DENIED</div>;
  }

  const handleStatusChange = async (payoutId: number, userId: number, amount: number, status: string) => {
    if (!confirm(`Are you sure you want to mark this payout as ${status.toUpperCase()}?`)) return;
    
    try {
      await (updatePayoutStatus as any)({ data: { payoutId, status, userId, amount } });
      toast.success(`Payout marked as ${status}!`);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to update payout status");
    }
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-16 space-y-8">
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-display uppercase tracking-widest text-muted-foreground hover:text-primary mb-2">
        <ArrowLeft className="w-4 h-4" /> Back to Admin
      </Link>
      <PageHeader title="Payout Requests" subtitle="Financials" />

      <div className="bg-card-gradient border border-border clip-notch p-5">
        <h3 className="font-display text-sm uppercase tracking-[0.25em] text-primary mb-4 flex items-center gap-2">
          <Banknote className="w-4 h-4" /> Withdrawal Queue ({payouts.length})
        </h3>
        
        {payouts.length === 0 ? (
          <div className="text-center p-10 text-muted-foreground bg-secondary/30 border border-border/50 clip-notch">
            No withdrawal requests pending.
          </div>
        ) : (
          <div className="space-y-4">
            {payouts.map((p: any) => (
              <div key={p.id} className="p-4 bg-secondary/60 border border-border flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-primary text-lg">{p.username}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full border ${p.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' : p.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs text-muted-foreground">
                    <div>Contact: <span className="text-foreground">{p.email || 'N/A'}</span> / <span className="text-foreground">{p.phone || 'N/A'}</span></div>
                    <div>Requested: <span className="text-foreground">{new Date(p.created_at).toLocaleString()}</span></div>
                    <div>UPI ID: <span className="text-foreground font-mono">{p.upi_id}</span></div>
                    <div>UPI Number: <span className="text-foreground font-mono">{p.upi_number}</span></div>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-4 shrink-0 bg-background/50 p-3 border border-border/50 rounded-md">
                  <div className="text-center md:text-right">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Amount to Transfer</div>
                    <div className="font-display text-2xl font-black text-fire-gradient flex items-center justify-center md:justify-end gap-1.5">
                      <GodCoin className="w-5 h-5" /> {p.amount} <span className="text-sm text-muted-foreground font-sans font-normal">(₹{p.amount})</span>
                    </div>
                  </div>
                  
                  {p.status === 'pending' && (
                    <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                      <Button variant="outline" size="sm" className="h-10 border-green-500/50 hover:bg-green-500/10 hover:text-green-500 text-xs w-full md:w-auto" onClick={() => handleStatusChange(p.id, p.user_id, p.amount, 'completed')}>
                        <CheckCircle className="w-4 h-4 mr-1.5" /> Mark Paid
                      </Button>
                      <Button variant="outline" size="sm" className="h-10 border-red-500/50 hover:bg-red-500/10 hover:text-red-500 text-xs w-full md:w-auto" onClick={() => handleStatusChange(p.id, p.user_id, p.amount, 'rejected')}>
                        <XCircle className="w-4 h-4 mr-1.5" /> Reject (Refund)
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
