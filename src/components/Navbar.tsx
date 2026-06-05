import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Home,
  Trophy,
  Crosshair,
  User,
  Crown,
  Bell,
  MessageCircle,
  Sun,
  Moon,
  Wallet,
} from "lucide-react";
import { Logo } from "./Logo";
import { GodCoin } from "./GodCoin";
import { TicketIcon } from "./TicketIcon";
import { useAuth } from "../lib/auth-client";
import { useTheme } from "../lib/theme";
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

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/tournaments", label: "Arena", icon: Trophy },
  { to: "/matches", label: "Matches", icon: Crosshair },
  { to: "/leaderboard", label: "Ranks", icon: Crown },
  { to: "/profile", label: "Profile", icon: User },
] as const;

const MAIN_TABS = ["/", "/tournaments", "/matches", "/leaderboard", "/profile", "/wallet"];

export function Navbar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const path = router.state.location.pathname;
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
        <div className="flex items-center justify-between px-4 h-20 lg:h-16 max-w-[480px] lg:max-w-5xl mx-auto w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center active:opacity-80 transition-opacity">
            <Logo withText={false} className="w-[76px] h-[76px] lg:w-[44px] lg:h-[44px]" />
          </Link>

          {/* ── Desktop horizontal nav (lg+ only) ── */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
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

            {/* Chat */}
            <Link
              id="tutorial-header-chat"
              to="/chat"
              className="relative w-10 h-10 lg:w-8 lg:h-8 flex items-center justify-center rounded-full bg-card border border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-all active:scale-95 press-effect"
            >
              <MessageCircle className="w-[22px] h-[22px] lg:w-4 lg:h-4" />
              {unreadChats > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 lg:w-4 lg:h-4 rounded-full text-[9px] lg:text-[8px] font-black grid place-items-center"
                  style={{ background: "var(--primary)", color: "#fff" }}
                >
                  {unreadChats > 9 ? "9+" : unreadChats}
                </span>
              )}
            </Link>

            {/* Notifications */}
            <Link
              id="tutorial-header-bell"
              to="/notifications"
              className="relative w-10 h-10 lg:w-8 lg:h-8 flex items-center justify-center rounded-full bg-card border border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-all active:scale-95 press-effect"
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

            {/* Theme toggle */}
            <button
              id="tutorial-header-theme"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-10 h-10 lg:w-8 lg:h-8 flex items-center justify-center rounded-full bg-card border border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-all active:scale-95 press-effect"
            >
              {theme === "dark" ? (
                <Sun className="w-[20px] h-[20px] lg:w-3.5 lg:h-3.5" />
              ) : (
                <Moon className="w-[20px] h-[20px] lg:w-3.5 lg:h-3.5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          BOTTOM TAB BAR
          • Mobile  → always visible (unchanged)
          • Desktop → hidden (navigation is in the top header)
         ══════════════════════════════════════════════════════ */}
      <nav
        className={`fixed bottom-0 inset-x-0 z-50 border-t border-border lg:hidden ${isTicketChat ? "hidden" : ""}`}
        style={{
          background: theme === "dark" ? "rgba(8,12,20,0.97)" : "rgba(255,255,255,0.97)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        <div className="flex items-center justify-around h-[60px] px-2 max-w-[480px] mx-auto pb-[env(safe-area-inset-bottom,0px)]">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const isActive = to === "/" ? path === "/" : path.startsWith(to);
            return (
              <Link
                key={to}
                id={`tutorial-nav-${label.toLowerCase()}`}
                to={to}
                className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full press-effect active:scale-90 transition-all duration-150"
              >
                <div
                  className={`relative flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200 ${
                    isActive ? "bg-primary/15" : ""
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-all duration-200 ${
                      isActive ? "text-primary scale-110" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <span
                  className={`text-[9px] font-bold tracking-wide transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                    style={{ background: "var(--primary)" }}
                  />
                )}
              </Link>
            );
          })}
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
                  className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest text-white flex items-center justify-center gap-2 press-effect shadow-cta animate-pulse-glow"
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
