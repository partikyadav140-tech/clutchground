import { Link, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  Home, Trophy, Crosshair, User, Bell, Wallet, MessageCircle, Crown, ChevronLeft
} from "lucide-react";
import { Logo } from "./Logo";
import { GodCoin } from "./GodCoin";
import { useAuth } from "../lib/auth-client";
import { getNotifications } from "../api";
import {
  requestBrowserNotificationPermission,
  showBrowserNotification,
  playNotificationTone,
  vibrateNotification,
} from "../lib/notification-utils";

const bottomNavItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/tournaments", label: "Arena", icon: Trophy },
  { to: "/matches", label: "Matches", icon: Crosshair },
  { to: "/leaderboard", label: "Ranks", icon: Crown },
  { to: "/profile", label: "Profile", icon: User },
] as const;

// Pages that should show the main global top header
const MAIN_TABS = ["/", "/tournaments", "/matches", "/leaderboard", "/profile", "/wallet"];

export function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const currentPath = router.state.location.pathname;
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const latestNotificationIdsRef = useRef<string[]>([]);

  const totalBalance = user
    ? ((user as any).deposit_balance || 0) + ((user as any).winning_balance || 0)
    : 0;

  useEffect(() => {
    // We bind to the main scroll container in _app.tsx instead of window
    const mainEl = document.getElementById("app-scroll-container");
    if (!mainEl) return;
    const handleScroll = () => setScrolled(mainEl.scrollTop > 10);
    mainEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => mainEl.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!user) return;
    requestBrowserNotificationPermission();

    async function load() {
      try {
        const notifs = await (getNotifications as any)({ data: user.id });
        setUnreadCount(notifs.filter((n: any) => !n.is_read).length);

        const currentIds = notifs.map((n: any) => n.id);
        const previousIds = latestNotificationIdsRef.current;
        const newlyAdded = notifs.filter(
          (n: any) => !previousIds.includes(n.id) && !n.is_read,
        );

        if (previousIds.length > 0 && newlyAdded.length > 0) {
          newlyAdded.slice(-3).forEach((notification: any) => {
            showBrowserNotification("CLUTCHGROUND Alert", notification.message || "You have a new notification.");
            playNotificationTone();
            vibrateNotification();
          });
        }
        latestNotificationIdsRef.current = currentIds;
      } catch {}
    }

    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [user]);

  const isMainTab = MAIN_TABS.includes(currentPath) || currentPath === "";
  const isDeepPage = !isMainTab;

  return (
    <>
      {/* ─── Dynamic Top Header ─── */}
      {isMainTab && (
        <header
          className={`absolute top-0 inset-x-0 z-50 transition-all duration-300 ${
            scrolled
              ? "bg-background/90 backdrop-blur-2xl border-b border-white/5"
              : "bg-background/80 backdrop-blur-md"
          }`}
        >
          <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Logo size={52} withText={false} />
              <span className="font-display font-black text-lg text-foreground uppercase tracking-widest hidden sm:inline-block">ClutchGround</span>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/wallet"
                className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-secondary border border-border hover:border-primary/50 transition-all active:scale-95"
              >
                <GodCoin className="w-4 h-4" />
                <span className="text-sm font-bold font-display text-white">{totalBalance}</span>
              </Link>

              <Link
                to={"/chat" as any}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary border border-border hover:border-primary/50 text-muted-foreground hover:text-white transition-all active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
              </Link>

              <Link
                to="/notifications"
                className="relative w-9 h-9 flex items-center justify-center rounded-full bg-secondary border border-border hover:border-primary/50 text-muted-foreground hover:text-white transition-all active:scale-95"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-black grid place-items-center shadow-md">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            </div>
          </nav>
        </header>
      )}

      {/* ─── iOS-Style Bottom Tab Bar ─── */}
      {/* On very deep pages (like chat), we can hide bottom tab too if wanted. For now, kept global */}
      <nav className="absolute bottom-0 inset-x-0 z-50 bg-background/80 backdrop-blur-2xl border-t border-white/10 pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.to || (item.to !== "/" && currentPath.startsWith(item.to));
            
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 active:scale-90 ${
                  isActive ? "text-cta" : "text-muted-foreground hover:text-white"
                }`}
              >
                <div className="relative">
                  <Icon className={`w-6 h-6 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
                  {isActive && <div className="absolute inset-0 bg-primary/40 blur-md rounded-full -z-10" />}
                </div>
                <span className={`text-[10px] font-bold tracking-wide transition-colors ${isActive ? "text-white" : ""}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
