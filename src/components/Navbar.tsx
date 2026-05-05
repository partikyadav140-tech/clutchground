import { Link, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Home,
  Trophy,
  Crosshair,
  User,
  Bell,
  Wallet,
  Crown,
  Users,
  Shield,
  LogOut,
  Settings,
  ChevronRight,
  X,
  Menu,
  Search,
  MessageCircle,
} from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { JoinBattleDialog } from "./JoinBattleDialog";
import { toast } from "sonner";
import { useAuth } from "../lib/auth-client";
import { getNotifications } from "../api";
import { GodCoin } from "./GodCoin";

const bottomNavItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/tournaments", label: "Arena", icon: Trophy },
  { to: "/matches", label: "Matches", icon: Crosshair },
  { to: "/leaderboard", label: "Ranks", icon: Crown },
  { to: "/profile", label: "Profile", icon: User },
] as const;

const sideMenuSections = [
  {
    title: "Play",
    items: [
      { to: "/tournaments", label: "Tournaments", icon: Trophy },
      { to: "/matches", label: "My Matches", icon: Crosshair },
      { to: "/leaderboard", label: "Leaderboard", icon: Crown },
      { to: "/teams", label: "Teams", icon: Users },
    ],
  },
  {
    title: "Account",
    items: [
      { to: "/profile", label: "My Profile", icon: User },
      { to: "/wallet", label: "Wallet", icon: Wallet },
      { to: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    title: "Info",
    items: [
      { to: "/rules", label: "Rules", icon: Shield },
      { to: "/anti-cheat", label: "Anti-Cheat", icon: Shield },
      { to: "/contact", label: "Contact", icon: MessageCircle },
    ],
  },
] as const;

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  const totalBalance = user
    ? ((user as any).deposit_balance || 0) + ((user as any).winning_balance || 0)
    : 0;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      async function load() {
        try {
          const notifs = await (getNotifications as any)({ data: user?.id });
          setUnreadCount(notifs.filter((n: any) => !n.is_read).length);
        } catch {}
      }
      load();
      const id = setInterval(load, 5000);
      return () => clearInterval(id);
    }
  }, [user]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [router.state.location.pathname]);

  return (
    <>
      {/* ─── Top Header (Desktop + Mobile) ─── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/95 backdrop-blur-xl shadow-[0_1px_0_oklch(0.25_0.03_265/0.6)]"
            : "bg-background/80 backdrop-blur-md"
        }`}
      >
        {/* Desktop utility strip */}
        <div className="hidden lg:block border-b border-border/40 bg-background/40">
          <div className="container mx-auto px-4 lg:px-8 h-8 flex items-center justify-between text-[10px] uppercase tracking-widest font-display">
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                12,408 warriors online
              </span>
              <span className="text-primary/70">·</span>
              <span className="text-primary">Season 7 — Live Now</span>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <Link to="/rules" className="hover:text-primary transition-colors">
                Rules
              </Link>
              <Link to="/anti-cheat" className="hover:text-primary transition-colors">
                Anti-Cheat
              </Link>
              <Link to="/contact" className="hover:text-primary transition-colors">
                Support
              </Link>
            </div>
          </div>
        </div>

        <nav className="container mx-auto px-4 lg:px-8 h-16 lg:h-20 flex items-center justify-between gap-4">
          {/* Left: Hamburger (mobile) */}
          <button
            onClick={() => setMenuOpen(true)}
            className="lg:hidden w-10 h-10 flex flex-col justify-center items-center gap-1.5 -ml-1 active:scale-95 transition-transform"
            aria-label="Open menu"
          >
            <span
              className={`block w-6 h-0.5 bg-foreground transition-all duration-200 ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
            />
            <span
              className={`block w-5 h-0.5 bg-foreground transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block w-6 h-0.5 bg-foreground transition-all duration-200 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
            />
          </button>

          {/* Center/Left: Logo */}
          <div className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0">
            <Logo size={80} withText={false} />
          </div>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-1 ml-6">
            {bottomNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="px-4 py-2 text-sm font-semibold tracking-wide uppercase text-muted-foreground hover:text-primary transition-colors relative group"
                activeProps={{ className: "text-primary" }}
              >
                {item.label}
                <span className="absolute inset-x-4 bottom-1 h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </Link>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Wallet chip */}
            <Link
              to="/wallet"
              className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-secondary/80 border border-border hover:border-primary/50 transition-all active:scale-95 group"
            >
              <GodCoin className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold font-display">{totalBalance}</span>
            </Link>

            {/* Notifications */}
            <Link
              to="/notifications"
              className="relative w-9 h-9 flex items-center justify-center rounded-full bg-secondary/80 border border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-all active:scale-95"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-black grid place-items-center border-2 border-background">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Desktop: Profile pill / auth */}
            <div className="hidden lg:block">
              {!user ? (
                <Link to="/login">
                  <Button
                    variant="hero"
                    size="sm"
                    className="font-display uppercase tracking-wider h-9 px-5"
                  >
                    Login
                  </Button>
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 h-9 rounded-full bg-secondary/80 border border-border hover:border-primary/50 transition-all"
                  >
                    <div className="w-6 h-6 rounded-full bg-fire-gradient grid place-items-center text-[10px] font-display font-black text-white">
                      {user.username[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-bold max-w-[80px] truncate">{user.username}</span>
                  </Link>
                  {user.role === "admin" && (
                    <Link to="/admin">
                      <Button
                        variant="outlineFire"
                        size="sm"
                        className="h-9 px-3 font-display text-xs"
                      >
                        <Shield className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Desktop: Join Battle CTA */}
            <div className="hidden xl:block">
              {!user ? (
                <Link to="/login">
                  <Button
                    variant="hero"
                    size="sm"
                    className="font-display uppercase tracking-wider h-9"
                  >
                    Join Battle
                  </Button>
                </Link>
              ) : (
                <JoinBattleDialog
                  mode="Squad"
                  trigger={
                    <Button
                      variant="hero"
                      size="sm"
                      className="font-display uppercase tracking-wider h-9"
                    >
                      Join Battle
                    </Button>
                  }
                />
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* ─── Mobile Side Drawer ─── */}
      {/* Backdrop */}
      <div
        className={`lg:hidden fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Drawer panel */}
      <div
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-[70] w-80 max-w-[85vw] bg-card border-r border-border flex flex-col transition-transform duration-300 ease-out ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="relative flex items-center justify-between px-5 py-4 border-b border-border/60">
          <div className="absolute inset-x-0 bottom-0 h-px bg-fire-gradient opacity-50" />
          <Logo size={60} withText={false} />
          <button
            onClick={() => setMenuOpen(false)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary/80 border border-border text-muted-foreground hover:text-primary active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User card */}
        <div className="px-5 py-4 border-b border-border/40">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-fire-gradient grid place-items-center font-display font-black text-xl text-white shadow-fire shrink-0">
                {user.username[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-display font-bold text-base truncate">{user.username}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <GodCoin className="w-3.5 h-3.5" />
                  <span className="text-sm font-bold text-primary">{totalBalance} coins</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1">
                <Button variant="hero" className="w-full font-display tracking-wider text-sm h-10">
                  Login
                </Button>
              </Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)} className="flex-1">
                <Button
                  variant="outlineFire"
                  className="w-full font-display tracking-wider text-sm h-10"
                >
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Nav sections */}
        <div className="flex-1 overflow-y-auto py-2">
          {sideMenuSections.map((section) => (
            <div key={section.title} className="mb-1">
              <div className="px-5 py-2 text-[10px] font-display uppercase tracking-[0.25em] text-muted-foreground/60">
                {section.title}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between mx-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-secondary/60 hover:text-primary transition-all active:scale-[0.98]"
                    activeProps={{
                      className: "bg-primary/15 text-primary border border-primary/20",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="font-semibold text-base">{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-40" />
                  </Link>
                );
              })}
            </div>
          ))}

          {/* Admin link */}
          {user?.role === "admin" && (
            <div className="mb-1">
              <div className="px-5 py-2 text-[10px] font-display uppercase tracking-[0.25em] text-primary/60">
                Admin
              </div>
              <Link
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between mx-3 px-3 py-3 rounded-xl text-primary hover:bg-primary/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5" />
                  <span className="font-semibold text-base">Admin Panel</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-60" />
              </Link>
            </div>
          )}
        </div>

        {/* Drawer footer */}
        {user && (
          <div className="px-5 py-4 border-t border-border/40">
            <button
              onClick={() => {
                logout();
                setMenuOpen(false);
                toast.success("Logged out");
              }}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-destructive/40 text-destructive hover:bg-destructive/10 transition-all active:scale-[0.98] font-semibold text-sm"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        )}
      </div>

      {/* ─── Mobile Bottom Navigation ─── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur-2xl border-t border-border/60">
        <div className="flex items-center justify-around pb-safe pt-1 px-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isNotif = false; // notifications badge is on its own link in top bar
            return (
              <Link
                key={item.to}
                to={item.to}
                className="relative flex flex-col items-center justify-center gap-1 flex-1 py-2 text-muted-foreground transition-all duration-200 active:scale-90 group"
                activeProps={{ className: "text-primary" }}
              >
                {({ isActive }: { isActive: boolean }) => (
                  <>
                    {isActive && <span className="nav-active-bar" />}
                    <div
                      className={`relative w-12 h-9 flex items-center justify-center rounded-2xl transition-all duration-200 ${isActive ? "bg-primary/15" : "group-active:bg-secondary/60"}`}
                    >
                      <Icon
                        className={`w-5 h-5 transition-all duration-200 ${isActive ? "scale-110" : ""}`}
                      />
                      {isNotif && unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-black grid place-items-center border-2 border-card">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-display tracking-wider transition-colors duration-200 ${isActive ? "text-primary font-bold" : ""}`}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
