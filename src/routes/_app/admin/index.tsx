import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Trophy, ClipboardList, Banknote, Mail, ShieldAlert, RefreshCw, Bell, LifeBuoy, IndianRupee } from "lucide-react";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/admin/")({
  head: () => ({ meta: [{ title: "Command Center — CLUTCHGROUND" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-3xl font-display font-black text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground font-semibold mb-8 max-w-sm">
          You must be logged in as an administrator to view the command center.
        </p>
        <Link to="/login">
          <Button className="h-12 px-8 rounded-xl font-bold bg-primary text-white shadow-primary">
            Return to Login
          </Button>
        </Link>
      </div>
    );
  }

  const adminLinks = [
    {
      to: "/admin/tournaments",
      icon: Trophy,
      title: "Manage Tournaments",
      desc: "Create, edit, and delete events.",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      to: "/admin/leaderboard",
      icon: RefreshCw,
      title: "Leaderboard Standings",
      desc: "Review and adjust weekly points.",
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      to: "/admin/registrations",
      icon: ClipboardList,
      title: "Registrations",
      desc: "View registered squads and players.",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      to: "/admin/payouts",
      icon: Banknote,
      title: "Payouts",
      desc: "Process player withdrawal requests.",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      to: "/admin/users",
      icon: Users,
      title: "Registered Users",
      desc: "View and manage all platform users.",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      to: "/admin/messages",
      icon: Mail,
      title: "Messages",
      desc: "View contact messages from users.",
      color: "text-sky-500",
      bg: "bg-sky-500/10",
    },
    {
      to: "/admin/notifications",
      icon: Bell,
      title: "Push Notifications",
      desc: "Broadcast alerts to users.",
      color: "text-pink-500",
      bg: "bg-pink-500/10",
    },
    {
      to: "/admin/tickets",
      icon: LifeBuoy,
      title: "Support Tickets",
      desc: "Manage user help requests.",
      color: "text-teal-500",
      bg: "bg-teal-500/10",
    },
    {
      to: "/admin/deposits",
      icon: IndianRupee,
      title: "UPI Deposits",
      desc: "Approve or reject user deposit requests.",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
  ];

  return (
    <div className="bg-background min-h-screen pt-2 pb-safe">
      {/* ─── Minimal App Header ─── */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2 text-cta font-bold mb-1">
          <ShieldAlert className="w-5 h-5" /> Admin
        </div>
        <h1 className="text-2xl font-display font-black text-foreground">Command Center</h1>
      </div>

      <div className="px-4">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {adminLinks.map((link, i) => (
            <Link key={link.to} to={link.to} className="block">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="bg-card rounded-[1.25rem] border border-white/5 shadow-lg hover:shadow-xl hover:border-white/10 transition-all p-4 flex flex-col h-full group active:scale-95"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${link.bg} ${link.color}`}
                >
                  <link.icon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-black text-[13px] text-white leading-tight mb-1">
                  {link.title}
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground leading-snug">
                  {link.desc}
                </p>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
