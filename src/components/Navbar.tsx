import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Trophy, Users, Crown, User, Shield, Home, Radio, Wallet, Bell, Search, ChevronDown, LogOut, Settings, MessageCircle, Crosshair } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { JoinBattleDialog } from "./JoinBattleDialog";
import { toast } from "sonner";
import { useAuth } from "../lib/auth-client";
import { getNotifications } from "../api";
import { useEffect } from "react";
import { GodCoin } from "./GodCoin";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/tournaments", label: "Tournaments", icon: Trophy },
  { to: "/matches", label: "Matches", icon: Trophy },
  { to: "/leaderboard", label: "Leaderboard", icon: Crown },
  { to: "/teams", label: "Teams", icon: Users },
  { to: "/community", label: "Community", icon: MessageCircle },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  const totalBalance = user ? ((user as any).deposit_balance || 0) + ((user as any).winning_balance || 0) : 0;

  useEffect(() => {
    if (user) {
      async function load() {
        try {
          const notifs = await (getNotifications as any)({ data: user?.id });
          setUnreadCount(notifs.filter((n: any) => !n.is_read).length);
        } catch {}
      }
      load();
      const id = setInterval(load, 30000);
      return () => clearInterval(id);
    }
  }, [user]);

  return (
    <>
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/75 border-b border-border/60">
      <div className="absolute inset-x-0 -bottom-px h-px bg-fire-gradient opacity-60" />

      {/* Top utility strip — desktop only */}
      <div className="hidden lg:block border-b border-border/40 bg-background/40">
        <div className="container mx-auto px-4 lg:px-8 h-8 flex items-center justify-between text-[10px] uppercase tracking-widest font-display">
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> 12,408 warriors online</span>
            <span>·</span>
            <span className="text-primary">Season 7 ends in 14d 06h</span>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <Link to="/rules" className="hover:text-primary">Rules</Link>
            <Link to="/anti-cheat" className="hover:text-primary">Anti-Cheat</Link>
            <Link to="/contact" className="hover:text-primary">Support</Link>
          </div>
        </div>
      </div>

      <nav className="container mx-auto px-4 lg:px-8 h-20 lg:h-20 flex items-center justify-between relative">
        {/* Mobile Left: Hamburger Menu */}
        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden p-2 -ml-2 text-foreground relative z-10 transition-transform active:scale-95"
          aria-label="Menu"
        >
          {open ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
        </button>

        {/* Center: Logo (Mobile & Desktop) */}
        <div className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 z-10">
          <div className="lg:hidden"><Logo size={100} withText={false} /></div>
          <div className="hidden lg:block"><Logo size={120} withText={false} /></div>
        </div>

        {/* Desktop Links (Hidden on Mobile) */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="px-3.5 py-2 text-sm font-semibold tracking-wide uppercase text-muted-foreground hover:text-primary transition-colors relative group"
              activeProps={{ className: "text-primary" }}
            >
              <span className="relative z-10">{item.label}</span>
              <span className="absolute inset-x-3 bottom-1 h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </Link>
          ))}
        </div>

        {/* Right side icons & CTAs */}
        <div className="flex items-center gap-3 lg:gap-4 relative z-10">
          <Link
            to="/tournaments"
            className="hidden md:grid w-9 h-9 place-items-center rounded-md bg-secondary/80 border border-border hover:border-primary/60 text-muted-foreground hover:text-primary transition-colors"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </Link>

          {/* Wallet - Visible on Mobile & Desktop */}
          <Link to="/wallet" className="flex items-center gap-2 px-3 h-10 lg:h-9 rounded-full lg:rounded-md bg-secondary/80 border border-border hover:border-primary/60 transition-colors active:scale-95">
            <GodCoin className="w-5 h-5 lg:w-4 lg:h-4" />
            <span className="text-sm font-bold text-white">{totalBalance}</span>
          </Link>

          {/* Notifications - Visible on Mobile & Desktop */}
          <Link
            to="/notifications"
            className="relative w-10 h-10 lg:w-9 lg:h-9 grid place-items-center rounded-full lg:rounded-md bg-secondary/80 border border-border hover:border-primary/60 text-muted-foreground hover:text-primary transition-colors active:scale-95"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 lg:w-4 lg:h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold grid place-items-center border border-background">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* Profile dropdown - Desktop only */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 h-9 px-2 rounded-md bg-secondary/80 border border-border hover:border-primary/60 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-fire-gradient grid place-items-center text-[10px] font-display font-black text-primary-foreground">
                {user ? user.username[0].toUpperCase() : 'G'}
              </div>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-11 w-56 bg-card border border-border clip-notch shadow-fire overflow-hidden" onMouseLeave={() => setProfileOpen(false)}>
                <div className="p-3 border-b border-border/60">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{user ? user.role : 'Guest'}</div>
                  <div className="font-display font-bold">{user ? user.username : 'Not signed in'}</div>
                </div>
                {!user ? (
                  <>
                    <Link to="/login" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary/10 hover:text-primary"><User className="w-4 h-4" /> Login</Link>
                    <Link to="/signup" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary/10 hover:text-primary"><Crown className="w-4 h-4" /> Sign Up</Link>
                  </>
                ) : (
                  <>
                    <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary/10 hover:text-primary"><Settings className="w-4 h-4" /> My Profile</Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary/10 hover:text-primary"><Shield className="w-4 h-4" /> Admin</Link>
                    )}
                    <button onClick={() => { logout(); setProfileOpen(false); toast.success("Logged out"); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-destructive/10 hover:text-destructive border-t border-border/60"><LogOut className="w-4 h-4" /> Logout</button>
                  </>
                )}
              </div>
            )}
          </div>

          {!user ? (
            <Link to="/login" className="hidden lg:block">
              <Button variant="hero" size="sm" className="font-display uppercase tracking-wider" onClick={() => toast.error("You must be logged in to join battles.")}>
                Join Battle
              </Button>
            </Link>
          ) : (
            <div className="hidden lg:block">
              <JoinBattleDialog
                mode="Squad"
                trigger={
                  <Button variant="hero" size="sm" className="font-display uppercase tracking-wider">
                    Join Battle
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
            <Link to="/wallet" onClick={() => setOpen(false)} className="flex items-center justify-between px-4 py-3 rounded-md bg-secondary/60 border border-border mb-2">
              <span className="flex items-center gap-3"><Wallet className="w-5 h-5 text-primary" /><span className="font-semibold uppercase tracking-wide text-sm">Wallet</span></span>
              <span className="font-display font-bold text-white flex items-center gap-1.5"><GodCoin className="w-4 h-4" /> {totalBalance}</span>
            </Link>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-secondary/60 text-foreground"
                  activeProps={{ className: "bg-secondary text-primary" }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold uppercase tracking-wide">{item.label}</span>
                </Link>
              );
            })}
            <div className="border-t border-border/60 my-2" />
            {!user ? (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-secondary/60">
                  <User className="w-5 h-5" /><span className="font-semibold uppercase tracking-wide">Login / Signup</span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-secondary/60">
                  <User className="w-5 h-5" /><span className="font-semibold uppercase tracking-wide">Profile</span>
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-secondary/60">
                    <Shield className="w-5 h-5" /><span className="font-semibold uppercase tracking-wide">Admin</span>
                  </Link>
                )}
                <button onClick={() => { logout(); setOpen(false); toast.success("Logged out"); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-secondary/60 text-left">
                  <LogOut className="w-5 h-5" /><span className="font-semibold uppercase tracking-wide">Logout</span>
                </button>
              </>
            )}
            <Link to="/rules" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-secondary/60">
              <Shield className="w-5 h-5" /><span className="font-semibold uppercase tracking-wide">Rules</span>
            </Link>
          </div>
        </div>
      )}
    </header>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-background/80 backdrop-blur-2xl border-t border-primary/20 pb-safe shadow-[0_-10px_40px_rgba(255,0,255,0.15)]">
        <div className="flex items-center justify-around h-20 px-2 pb-1">
          <Link to="/" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary transition-colors" activeProps={{ className: "text-primary" }}>
            <Home className="w-6 h-6 mb-1.5" />
            <span className="text-[11px] uppercase font-display tracking-wider">Home</span>
          </Link>
          <Link to="/tournaments" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary transition-colors" activeProps={{ className: "text-primary" }}>
            <Trophy className="w-6 h-6 mb-1.5" />
            <span className="text-[11px] uppercase font-display tracking-wider">Tournaments</span>
          </Link>
          <Link to="/matches" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary transition-colors" activeProps={{ className: "text-primary" }}>
            <Crosshair className="w-6 h-6 mb-1.5" />
            <span className="text-[11px] uppercase font-display tracking-wider">Matches</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary transition-colors" activeProps={{ className: "text-primary" }}>
            <User className="w-6 h-6 mb-1.5" />
            <span className="text-[11px] uppercase font-display tracking-wider">Profile</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
