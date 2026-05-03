import { createFileRoute, useRouter } from "@tanstack/react-router";
import { PageHeader } from "./tournaments";
import { Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth-client";
import { getNotifications, markNotificationsRead, resolveTournamentRequest } from "../../api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — CLUTCHGROUND" }] }),
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
  }, [user]);

  const handleResolve = async (reqId: string, status: string) => {
    try {
      await (resolveTournamentRequest as any)({ data: { requestId: reqId, status } });
      toast.success(status === 'approved' ? "Registration approved!" : "Registration rejected.");
      const notifs = await (getNotifications as any)({ data: user!.id });
      setNotifications(notifs);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (!user || loading) return <div className="p-20 text-center">Loading...</div>;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-16">
      <PageHeader title="Notifications" subtitle="Stay Updated" />
      
      <div className="mt-8 max-w-2xl mx-auto space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground bg-card-gradient border border-border clip-notch">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>You have no notifications yet.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`p-5 bg-card-gradient border ${n.is_read ? 'border-border' : 'border-primary shadow-fire'} clip-notch flex gap-4 items-center transition-all`}>
              <div className={`w-10 h-10 rounded-full grid place-items-center shrink-0 ${n.is_read ? 'bg-secondary/60 text-muted-foreground' : 'bg-fire-gradient text-primary-foreground shadow-fire'}`}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm ${n.is_read ? 'text-muted-foreground' : 'text-foreground font-bold'}`}>{n.message}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1.5">{new Date(n.created_at).toLocaleString()}</div>
                {n.action_type === 'tournament_request' && (
                  <div className="mt-3 flex gap-2">
                    <Button variant="hero" size="sm" onClick={() => handleResolve(n.action_data, 'approved')}>Approve</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleResolve(n.action_data, 'rejected')}>Reject</Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
