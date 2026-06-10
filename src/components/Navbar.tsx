import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Home,
  Trophy,
  User,
  Crown,
  Bell,
  MessageCircle,
  Wallet,
  Crosshair,
  Settings,
} from "lucide-react";
import { Logo } from "./Logo";
import { GodCoin } from "./GodCoin";
import { TicketIcon } from "./TicketIcon";
import { useAuth } from "../lib/auth-client";
import { useTutorialStore } from "../lib/tutorial-store";
import { getNotifications, getUnreadChatCount } from "../api";
import {
  requestBrowserNotificationPermission,
  showBrowserNotification,
  playNotificationTone,
  vibrateNotification,
  subscribeUserToPush,
} from "../lib/notification-utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const DESKTOP_NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/tournaments", label: "Arena", icon: Trophy },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/leaderboard", label: "Ranks", icon: Crown },
  { to: "/profile", label: "Profile", icon: User },
] as const;

const MOBILE_NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/tournaments", label: "Arena", icon: Trophy },
  { to: "/matches", label: "Matches", icon: Crosshair },
  { to: "/leaderboard", label: "Ranks", icon: Crown },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function Navbar() {
  const { user } = useAuth();
  const routerState = useRouterState();
  const path = routerState.location.pathname;
  const [unread, setUnread] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const [showPromo, setShowPromo] = useState(false);
  const notifsRef = useRef<string[]>([]);
  const { isActive: isTutorialActive, isCompleted: isTutorialCompleted } = useTutorialStore();
  const prevActiveRef = useRef(isTutorialActive);

  const balance = user
    ? ((user as { deposit_balance?: number }).deposit_balance || 0) +
      ((user as { winning_balance?: number }).winning_balance || 0)
    : 0;

  const handleEnableNotifications = async () => {
    setShowPromo(false);
    if (typeof window === "undefined" || !("Notification" in window)) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        if (user) {
          await subscribeUserToPush(user.id);
          toast.success("Notifications enabled successfully! 🔔");
        }
      } else {
        toast.error("Notifications are blocked or denied. Please enable them manually in your browser/app settings.");
      }
    } catch (err) {
      toast.error("Failed to enable notifications.");
    }
  };

  // Effect 1: Detect transition from active -> inactive tutorial (completed or skipped)
  useEffect(() => {
    if (!user) return;

    if (prevActiveRef.current && !isTutorialActive && isTutorialCompleted) {
      const timer = setTimeout(() => {
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission !== "granted") {
          const sessionPrompt = sessionStorage.getItem("notif_prompt_shown_session");
          if (!sessionPrompt) {
            setShowPromo(true);
            sessionStorage.setItem("notif_prompt_shown_session", "true");
          }
        }
      }, 10000); // 10 seconds delay after tutorial ends
      return () => clearTimeout(timer);
    }

    prevActiveRef.current = isTutorialActive;
  }, [isTutorialActive, isTutorialCompleted, user]);

  // Effect 2: Show notification prompt for returning users who have already completed the tutorial
  useEffect(() => {
    if (!user) return;
    if (isTutorialActive) return;

    const isCompletedNow = localStorage.getItem("clutchground_live_tutorial_completed") === "true" ||
                           localStorage.getItem("god_esports_tutorial_driver_seen") === "true";

    if (isCompletedNow) {
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission !== "granted") {
        const sessionPrompt = sessionStorage.getItem("notif_prompt_shown_session");
        if (!sessionPrompt) {
          const timer = setTimeout(() => {
            setShowPromo(true);
            sessionStorage.setItem("notif_prompt_shown_session", "true");
          }, 5000); // 5 seconds delay for returning users
          return () => clearTimeout(timer);
        }
      }
    }
  }, [user, isTutorialActive]);

  useEffect(() => {
    if (!user) return;
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        subscribeUserToPush(user.id);
      }
    }

    async function poll() {
      try {
        const notifsFetch = getNotifications as unknown as (args: { data: number }) => Promise<
          {
            id: string;
            is_read: boolean;
            message?: string;
            action_type?: string;
            redirect_url?: string;
          }[]
        >;
        const unreadChatsFetch = getUnreadChatCount as unknown as (args: {
          data: number;
        }) => Promise<number>;

        const notifs = await notifsFetch({ data: user.id });
        setUnread(notifs.filter((n) => !n.is_read).length);

        const chatUnread = await unreadChatsFetch({ data: user.id });
        setUnreadChats(chatUnread);

        const ids = notifs.map((n) => n.id);
        const prev = notifsRef.current;
        const newOnes = notifs.filter((n) => !prev.includes(n.id) && !n.is_read);

        if (prev.length > 0 && newOnes.length > 0) {
          newOnes.slice(-3).forEach((n) => {
            const important =
              n.action_type === "tournament_request" ||
              (n.message &&
                (n.message.startsWith("❌") ||
                  n.message.startsWith("⚠️") ||
                  n.message.startsWith("🏆")));

            showBrowserNotification("🎮 ClutchGround", {
              body: n.message || "You have a new notification",
              url: n.redirect_url || "/notifications",
              tag: `cg-notif-${n.id}`,
              important: !!important,
            });
            playNotificationTone(!!important);
            vibrateNotification(!!important);
          });
        }
        notifsRef.current = ids;
      } catch {
        // Ignore polling errors
      }
    }

    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [user]);

  const cleanPath = path === "/" ? "/" : path.replace(/\/$/, "");
  const isAuth = ["/login", "/signup"].includes(cleanPath);
  // Hide bottom nav on ticket/chat detail pages (like WhatsApp)
  const isTicketChat = /^\/support\/[^/]+/.test(cleanPath);
  const isChatPage = cleanPath.startsWith("/support/") || cleanPath.startsWith("/admin/tickets/") || cleanPath === "/chat";

  if (isAuth) return null;

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          TOP HEADER
          • Mobile  → visible on all standard pages
          • Desktop → always visible on non-auth pages
         ══════════════════════════════════════════════════════ */}
      <header
        className={`absolute top-0 inset-x-0 z-50 app-header ${
          isChatPage ? "hidden lg:block" : "block"
        }`}
      >
        {/* Inner content — constrained to max-w-5xl on desktop */}
        <div className="flex items-center justify-between px-3 h-[60px] max-w-[480px] lg:max-w-5xl mx-auto w-full">
          {/* Logo — larger mark in compact header */}
          <Link to="/" className="flex items-center active:opacity-80 transition-opacity -ml-1 shrink-0">
            <Logo withText={false} className="w-[72px] h-[72px] lg:w-[52px] lg:h-[52px] -my-2" />
          </Link>

          {/* ── Desktop horizontal nav (lg+ only) ── */}
          <nav className="hidden lg:flex items-center gap-1">
            {DESKTOP_NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const isActive = to === "/" ? path === "/" : path.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-4 h-9 rounded-xl text-sm font-bold transition-all press-effect ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Support Tickets button with premium ticket icon */}
            {user && (
              <Link
                id="header-support-tickets"
                to="/support"
                className="relative w-10 h-10 lg:w-8 lg:h-8 flex items-center justify-center rounded-full bg-card border border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-all active:scale-95 press-effect"
                title="Support Tickets"
              >
                <TicketIcon className="w-[22px] h-[22px] lg:w-4 lg:h-4" />
              </Link>
            )}

            {/* Notifications */}
            <Link
              id="tutorial-header-bell"
              to="/notifications"
              className="relative w-10 h-10 lg:w-8 lg:h-8 flex items-center justify-center rounded-full bg-card border border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-all active:scale-95 press-effect"
              title="Notifications"
            >
              <Bell className="w-[22px] h-[22px] lg:w-4 lg:h-4" />
              {unread > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 lg:w-4 lg:h-4 rounded-full text-[9px] lg:text-[8px] font-black grid place-items-center"
                  style={{ background: "var(--fire)", color: "#fff" }}
                >
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>

            <Link
              id="tutorial-header-settings"
              to="/settings"
              className="relative w-9 h-9 lg:w-8 lg:h-8 flex items-center justify-center rounded-full bg-card border border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-all active:scale-95 press-effect"
              title="Settings"
            >
              <Settings className="w-[20px] h-[20px] lg:w-4 lg:h-4" />
            </Link>

            {/* Chat — desktop header only */}
            <Link
              id="tutorial-header-chat"
              to="/chat"
              className="relative hidden lg:flex w-8 h-8 items-center justify-center rounded-full bg-card border border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-all active:scale-95 press-effect"
            >
              <MessageCircle className="w-4 h-4" />
              {unreadChats > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[8px] font-black grid place-items-center"
                  style={{ background: "var(--primary)", color: "#fff" }}
                >
                  {unreadChats > 9 ? "9+" : unreadChats}
                </span>
              )}
            </Link>

          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          BOTTOM TAB BAR
          • Mobile  → always visible (unchanged)
          • Desktop → hidden (navigation is in the top header)
         ══════════════════════════════════════════════════════ */}
      <nav
        className={`app-bottom-nav fixed bottom-0 inset-x-0 z-50 lg:hidden pointer-events-none ${isTicketChat ? "hidden" : ""}`}
        aria-label="Main navigation"
      >
        <div className="px-4 mb-[max(10px,env(safe-area-inset-bottom))] max-w-[480px] mx-auto w-full pointer-events-auto">
          <div className="app-bottom-nav-inner relative flex items-center justify-around h-[66px] px-2 rounded-[18px] border border-border/80 bg-card/98 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] overflow-hidden">
            {MOBILE_NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const isActive = to === "/" ? path === "/" : path.startsWith(to);
              return (
                <Link
                  key={to}
                  id={`tutorial-nav-${label.toLowerCase()}`}
                  to={to}
                  className="relative flex flex-col items-center justify-center flex-1 min-w-0 h-full gap-1.5 py-1 press-effect active:scale-95 transition-transform"
                >
                  <Icon
                    className={`w-6 h-6 transition-colors duration-200 ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide leading-none transition-colors truncate max-w-[72px] ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* App-style Notification Promotion Modal */}
      <AnimatePresence>
        {showPromo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full max-w-[360px] bg-card border border-border/80 rounded-[28px] p-6 shadow-2xl relative overflow-hidden text-center"
            >
              {/* Accent top gradient line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary-gradient" />

              {/* Icon */}
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 text-primary shadow-primary">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>

              {/* Title & Description */}
              <h3 className="font-display font-black text-base text-foreground mb-1.5 uppercase tracking-wider">
                Enable Notifications
              </h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold mb-6 px-1">
                Stay updated with real-time tournament alerts, match starting times, prize payouts, and chat messages in the arena.
              </p>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleEnableNotifications}
                  className="w-full h-12 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 press-effect shadow-cta"
                  style={{ background: "var(--gradient-cta)" }}
                >
                  Allow Notifications
                </button>
                <button
                  onClick={() => {
                    setShowPromo(false);
                    sessionStorage.setItem("notif_prompt_shown_session", "true");
                  }}
                  className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest border border-border bg-secondary/50 text-muted-foreground hover:text-foreground press-effect transition-all"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
