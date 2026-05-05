import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Trophy, ClipboardList, Banknote, Mail, ShieldAlert, RefreshCw } from "lucide-react";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Professional Esports Arena" }] }),
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
      bg: "bg-amber-50",
    },
    {
      to: "/admin/leaderboard",
      icon: RefreshCw,
      title: "Leaderboard Standings",
      desc: "Review and adjust weekly leaderboard points.",
      color: "text-violet-500",
      bg: "bg-violet-50",
    },
    {
      to: "/admin/registrations",
      icon: ClipboardList,
      title: "Registrations",
      desc: "View registered squads and players.",
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      to: "/admin/payouts",
      icon: Banknote,
      title: "Payouts",
      desc: "Process player withdrawal requests.",
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      to: "/admin/users",
      icon: Users,
      title: "Registered Users",
      desc: "View and manage all platform users.",
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
    {
      to: "/admin/messages",
      icon: Mail,
      title: "Messages",
      desc: "View contact messages from users.",
      color: "text-sky-500",
      bg: "bg-sky-50",
    },
  ];

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* ─── Top Header (Mobile First) ─── */}
      <div className="bg-white rounded-b-[2rem] shadow-[0_4px_24px_oklch(0_0_0/0.04)] pt-6 pb-6 px-4 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-black text-foreground">Command Center</h1>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">Admin Dashboard</p>
        </div>
      </div>

      <div className="px-4 mt-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminLinks.map((link, i) => (
            <Link key={link.to} to={link.to} className="block">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="bg-white rounded-[1.5rem] border border-border shadow-sm hover:shadow-md transition-all p-5 flex flex-col h-full group active:scale-[0.98]"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${link.bg} ${link.color} group-hover:scale-110 transition-transform`}
                >
                  <link.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-black text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                  {link.title}
                </h3>
                <p className="text-xs font-semibold text-muted-foreground">{link.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
