import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "../tournaments/index";
import { Users, Trophy, ClipboardList, Banknote } from "lucide-react";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — GOD ESPORTS" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-20 text-center">Loading...</div>;
  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-display font-black text-destructive mb-4">ACCESS DENIED</h1>
        <p className="text-muted-foreground mb-8">You must be logged in as an admin to view this page.</p>
        <Link to="/login"><Button variant="hero">Go to Login</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-16 space-y-10">
      <PageHeader title="Admin Panel" subtitle="Command Center" />

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/admin/users" className="bg-card-gradient border border-border clip-notch p-8 flex flex-col items-center justify-center text-center hover:border-primary/60 hover:shadow-fire transition-all group">
          <Users className="w-12 h-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="font-display font-bold tracking-widest uppercase text-lg">Registered Users</h3>
          <p className="text-xs text-muted-foreground mt-2">View and manage all registered platform users.</p>
        </Link>
        
        <Link to="/admin/tournaments" className="bg-card-gradient border border-border clip-notch p-8 flex flex-col items-center justify-center text-center hover:border-primary/60 hover:shadow-fire transition-all group">
          <Trophy className="w-12 h-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="font-display font-bold tracking-widest uppercase text-lg">Manage Tournaments</h3>
          <p className="text-xs text-muted-foreground mt-2">Create, edit, and delete Free Fire tournaments.</p>
        </Link>

        <Link to="/admin/registrations" className="bg-card-gradient border border-border clip-notch p-8 flex flex-col items-center justify-center text-center hover:border-primary/60 hover:shadow-fire transition-all group">
          <ClipboardList className="w-12 h-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="font-display font-bold tracking-widest uppercase text-lg">Registrations</h3>
          <p className="text-xs text-muted-foreground mt-2">View registered squads and players per tournament.</p>
        </Link>

        <Link to="/admin/payouts" className="bg-card-gradient border border-border clip-notch p-8 flex flex-col items-center justify-center text-center hover:border-primary/60 hover:shadow-fire transition-all group">
          <Banknote className="w-12 h-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="font-display font-bold tracking-widest uppercase text-lg">Payouts</h3>
          <p className="text-xs text-muted-foreground mt-2">Process and manage player withdrawal requests.</p>
        </Link>
      </div>
    </div>
  );
}
