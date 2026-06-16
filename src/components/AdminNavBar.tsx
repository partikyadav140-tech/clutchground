import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Trophy,
  Users,
  IndianRupee,
  Banknote,
  Bell,
  LifeBuoy,
  ClipboardList,
  Mail,
  Settings,
  RefreshCw,
  Sparkles,
  Palette,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/admin", icon: LayoutDashboard, label: "Home", exact: true },
  { to: "/admin/tournaments", icon: Trophy, label: "Events" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/deposits", icon: IndianRupee, label: "Deposits" },
  { to: "/admin/payouts", icon: Banknote, label: "Payouts" },
];

const MORE_ITEMS = [
  { to: "/admin/registrations", icon: ClipboardList, label: "Registrations" },
  { to: "/admin/leaderboard", icon: RefreshCw, label: "Leaderboard" },
  { to: "/admin/notifications", icon: Bell, label: "Notify" },
  { to: "/admin/tickets", icon: LifeBuoy, label: "Tickets" },
  { to: "/admin/messages", icon: Mail, label: "Messages" },
  { to: "/admin/spin-wheel", icon: Sparkles, label: "Spin" },
  { to: "/admin/profile-shop", icon: Palette, label: "Profile" },
  { to: "/admin/site-settings", icon: Settings, label: "Settings" },
];

export function AdminNavBar({
  pendingDeposits = 0,
  pendingPayouts = 0,
  openTickets = 0,
}: {
  pendingDeposits?: number;
  pendingPayouts?: number;
  openTickets?: number;
}) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const isActive = (to: string, exact?: boolean) => {
    if (exact) return currentPath === to;
    return currentPath.startsWith(to) && to !== "/admin";
  };

  const getBadge = (to: string) => {
    if (to === "/admin/deposits" && pendingDeposits > 0) return pendingDeposits;
    if (to === "/admin/payouts" && pendingPayouts > 0) return pendingPayouts;
    if (to === "/admin/tickets" && openTickets > 0) return openTickets;
    return null;
  };

  return (
    <>
      {/* ─── Primary Bottom Nav (5 main items) ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.15)]">
        <div className="flex items-stretch h-16 max-w-lg mx-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => {
            const active = isActive(to, exact) || (exact && currentPath === "/admin");
            const badge = getBadge(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full bg-primary" />
                )}
                <div className="relative">
                  <Icon className={`w-5 h-5 ${active ? "fill-primary/10" : ""}`} />
                  {badge !== null && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-0.5 bg-destructive text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider ${active ? "text-primary" : ""}`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* safe area spacer for phones with home bar */}
        <div className="h-safe bg-transparent" />
      </div>

      {/* ─── Secondary "More" horizontal scroll strip ─── */}
      <div className="fixed bottom-16 left-0 right-0 z-40 overflow-x-auto hide-scrollbar">
        <div className="flex gap-1.5 px-3 py-1.5 bg-background/80 backdrop-blur border-t border-border/50 w-max min-w-full">
          {MORE_ITEMS.map(({ to, icon: Icon, label }) => {
            const active = currentPath.startsWith(to);
            const badge = getBadge(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all shrink-0 relative ${
                  active
                    ? "bg-primary text-white shadow-sm"
                    : "bg-card border border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
                {badge !== null && (
                  <span className="ml-1 min-w-[14px] h-3.5 px-0.5 bg-destructive text-white text-[8px] font-black rounded-full flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Spacer to prevent content being hidden behind bottom navs */}
      <div className="h-[104px]" />
    </>
  );
}
