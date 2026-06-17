import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Bell, Check, X, ShieldCheck, AlertTriangle, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth-client";
import { getNotifications, markNotificationsRead, resolveTournamentRequest } from "../../api";
import {
  requestBrowserNotificationPermission,
  subscribeUserToPush,
} from "../../lib/notification-utils";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — CLUTCHGROUND" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "denied",
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [checkingSub, setCheckingSub] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.navigate({ to: "/login" });
      return;
    }
    if (!user) return;
    (async () => {
      try {
        const notifs = await (getNotifications as any)({ data: user.id });
        setNotifications(notifs);
        setTimeout(() => (markNotificationsRead as any)({ data: user.id }).catch(() => {}), 2000);
      } catch {}
      setLoading(false);
    })();
  }, [user, authLoading]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setBrowserPerm(Notification.permission);
    }

    // Timeout fallback — resolve after 2s max so mobile doesn't hang
    const timeout = setTimeout(() => setCheckingSub(false), 2000);

    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      // Use getRegistration (non-blocking) instead of .ready which can hang
      navigator.serviceWorker
        .getRegistration("/")
        .then(async (reg) => {
          clearTimeout(timeout);
          if (reg) {
            const sub = await reg.pushManager.getSubscription();
            setIsSubscribed(!!sub);
          }
          setCheckingSub(false);
        })
        .catch(() => {
          clearTimeout(timeout);
          setCheckingSub(false);
        });
    } else {
      clearTimeout(timeout);
      setCheckingSub(false);
    }

    return () => clearTimeout(timeout);
  }, []);

  const enableAlerts = async () => {
    const p = await requestBrowserNotificationPermission();
    if ("Notification" in window) {
      const cur = p ?? Notification.permission;
      setBrowserPerm(cur);
      if (cur === "granted") {
        if (user) {
          toast.loading("Activating push notifications...", { id: "push-register" });
          try {
            const sub = await subscribeUserToPush(user.id);
            setIsSubscribed(!!sub);
            if (sub) {
              toast.success("Push notifications activated successfully!", { id: "push-register" });
            } else {
              toast.error("Failed to register device subscription. Check VAPID settings.", {
                id: "push-register",
              });
            }
          } catch (err: any) {
            console.error("Subscription error detail:", err);
            toast.error(`Subscription failed: ${err?.message || err}`, { id: "push-register" });
          }
        }
      } else {
        toast.error("Browser notification permission denied.");
      }
    }
  };

  const disableAlerts = async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    try {
      toast.loading("Deactivating push notifications...", { id: "push-unregister" });
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        const { removePushSubscription } = await import("../../api");
        await (removePushSubscription as any)({ data: { endpoint: sub.endpoint } });
      }
      setIsSubscribed(false);
      toast.success("Push notifications deactivated successfully.", { id: "push-unregister" });
    } catch (err) {
      console.error("Failed to deactivate push notifications:", err);
      toast.error("Failed to cleanly deactivate notifications.", { id: "push-unregister" });
    }
  };

  const handleResolve = async (reqId: string, status: string) => {
    try {
      await (resolveTournamentRequest as any)({ data: { requestId: reqId, status } });
      toast.success(status === "approved" ? "Registration approved!" : "Registration rejected.");
      const notifs = await (getNotifications as any)({ data: user!.id });
      setNotifications(notifs);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (!user || loading)
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const unread = notifications.filter((n) => !n.is_read);
  const read = notifications.filter((n) => n.is_read);

  return (
    <div className="min-h-screen bg-background pb-5">
      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
          Updates
        </p>
        <div className="flex items-center justify-between">
          <h1 className="font-display font-black text-2xl text-foreground">Notifications</h1>
          {unread.length > 0 && (
            <span
              className="px-2.5 py-1 rounded-full text-xs font-black text-white"
              style={{ background: "var(--fire)" }}
            >
              {unread.length} new
            </span>
          )}
        </div>
      </div>

      {/* ── Browser alerts card ── */}
      <div className="px-4 mb-5">
        <div className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between gap-3 shadow-card">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(0,200,255,0.1)", color: "var(--primary)" }}
            >
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-sm text-foreground">Push Alerts</p>
              <p className="text-[10px] text-muted-foreground font-semibold">
                Status:{" "}
                <span
                  className={
                    browserPerm === "granted" && isSubscribed
                      ? "text-emerald-400"
                      : "text-muted-foreground"
                  }
                >
                  {checkingSub
                    ? "checking..."
                    : browserPerm === "granted" && isSubscribed
                      ? "Active"
                      : "Inactive"}
                </span>
              </p>
            </div>
          </div>
          {checkingSub ? (
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3" />
          ) : browserPerm === "granted" && isSubscribed ? (
            <button
              onClick={disableAlerts}
              className="h-8 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 border border-red-500/20 bg-red-500/5 press-effect active:scale-95"
            >
              Disable
            </button>
          ) : (
            <button
              onClick={enableAlerts}
              className="h-8 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white press-effect active:scale-95"
              style={{ background: "var(--gradient-primary)" }}
            >
              Enable
            </button>
          )}
        </div>
      </div>

      {/* ── Notification list ── */}
      <div className="px-4 flex flex-col gap-3">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-3xl border border-border text-center">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <Bell className="w-6 h-6 text-muted-foreground opacity-30" />
            </div>
            <p className="font-display font-black text-base text-foreground mb-1">All Caught Up!</p>
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          </div>
        ) : (
          notifications.map((n, i) => {
            const isImportant =
              n.action_type === "tournament_request" ||
              n.message?.startsWith("❌") ||
              n.message?.startsWith("⚠️");
            const isNew = !n.is_read;

            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                onClick={() => {
                  if (n.redirect_url && n.redirect_url.startsWith("/") && !/[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(n.redirect_url)) {
                    router.navigate({ to: n.redirect_url });
                  }
                }}
                className={`bg-card rounded-2xl border shadow-card overflow-hidden ${n.redirect_url ? "cursor-pointer press-effect active:scale-[0.98]" : ""} ${isNew ? "border-primary/30" : "border-border"}`}
              >
                {/* New indicator stripe */}
                {isNew && (
                  <div className="h-0.5 w-full" style={{ background: "var(--gradient-primary)" }} />
                )}

                <div className="p-4 flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                    style={
                      isNew
                        ? {
                            background: isImportant
                              ? "rgba(239,68,68,0.12)"
                              : "rgba(0,200,255,0.12)",
                            color: isImportant ? "#f87171" : "var(--primary)",
                          }
                        : { background: "var(--secondary)", color: "var(--muted-foreground)" }
                    }
                  >
                    {isImportant ? (
                      <AlertTriangle className="w-4.5 h-4.5" />
                    ) : (
                      <ShieldCheck className="w-4.5 h-4.5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-relaxed ${isNew ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                    >
                      {n.message}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-1.5">
                      {new Date(n.created_at).toLocaleString([], {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                      {isNew && (
                        <span
                          className="ml-2 px-1.5 py-0.5 rounded-full text-white text-[8px]"
                          style={{ background: "var(--primary)" }}
                        >
                          NEW
                        </span>
                      )}
                    </p>

                    {/* Approve/Reject */}
                    {n.action_type === "tournament_request" && (
                      <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleResolve(n.action_data, "approved")}
                          className="flex-1 h-9 rounded-xl text-xs font-black text-white press-effect active:scale-95"
                          style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                        >
                          <Check className="w-3.5 h-3.5 inline mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleResolve(n.action_data, "rejected")}
                          className="flex-1 h-9 rounded-xl text-xs font-black border border-red-500/30 text-red-500 bg-red-500/8 press-effect active:scale-95"
                        >
                          <X className="w-3.5 h-3.5 inline mr-1" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
