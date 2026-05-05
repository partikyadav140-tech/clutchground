import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Bell, Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth-client";
import { getNotifications, markNotificationsRead, resolveTournamentRequest } from "../../api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Professional Esports Arena" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.navigate({ to: "/login" });
      return;
    }
    if (!user) return;
    async function load() {
      try {
        const notifs = await (getNotifications as any)({ data: user.id });
        setNotifications(notifs);

        // Mark as read so the bell counter resets
        setTimeout(() => {
          (markNotificationsRead as any)({ data: user.id }).catch(() => {});
        }, 2000);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [user, authLoading, router]);

  const handleResolve = async (reqId: string, status: string) => {
    try {
      await (resolveTournamentRequest as any)({ data: { requestId: reqId, status } });
      toast.success(status === "approved" ? "Registration approved!" : "Registration rejected.");
      const notifs = await (getNotifications as any)({ data: user!.id });
      setNotifications(notifs);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (!user || loading)
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* ─── Top Header (Mobile First) ─── */}
      <div className="bg-white rounded-b-[2rem] shadow-[0_4px_24px_oklch(0_0_0/0.04)] pt-6 pb-6 px-4 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-3">
            <Bell className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-black text-foreground">Inbox</h1>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">
            Stay updated on your matches
          </p>
        </div>
      </div>

      <div className="px-4 mt-6">
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[1.5rem] border border-border shadow-sm">
              <div className="w-16 h-16 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8" />
              </div>
              <p className="text-foreground font-display font-bold text-lg">All caught up!</p>
              <p className="text-sm text-muted-foreground mt-1">You have no new notifications.</p>
            </div>
          ) : (
            notifications.map((n, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                key={n.id}
                className={`p-5 rounded-[1.5rem] border ${n.is_read ? "bg-white border-border shadow-sm" : "bg-primary/5 border-primary/30 shadow-md"} flex flex-col sm:flex-row gap-4 items-start sm:items-center transition-all`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm ${n.is_read ? "bg-secondary text-muted-foreground" : "bg-gradient-to-br from-primary to-[#d95a00] text-white"}`}
                >
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <div
                    className={`text-sm ${n.is_read ? "text-muted-foreground" : "text-foreground font-bold"}`}
                  >
                    {n.message}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2 font-bold">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                  {n.action_type === "tournament_request" && (
                    <div className="mt-4 flex gap-2 w-full sm:w-auto">
                      <Button
                        onClick={() => handleResolve(n.action_data, "approved")}
                        className="flex-1 sm:flex-none h-10 rounded-xl font-bold bg-primary text-white shadow-primary"
                      >
                        <Check className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleResolve(n.action_data, "rejected")}
                        className="flex-1 sm:flex-none h-10 rounded-xl font-bold border-border shadow-sm hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                      >
                        <X className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
