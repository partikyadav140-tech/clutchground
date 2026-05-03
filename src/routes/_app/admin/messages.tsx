import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { PageHeader } from "../tournaments/index";
import { ArrowLeft, Mail } from "lucide-react";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { getContactMessages } from "../../../api";

export const Route = createFileRoute("/_app/admin/messages")({
  head: () => ({ meta: [{ title: "Admin: Messages — CLUTCHGROUND" }] }),
  loader: async () => await getContactMessages(),
  component: AdminMessages,
});

function AdminMessages() {
  const messages = Route.useLoaderData() as any[];
  const { user, loading } = useAuth();
  const router = useRouter();

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
    <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-16">
      <Button variant="outlineFire" size="sm" asChild className="mb-6">
        <Link to="/admin"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard</Link>
      </Button>

      <PageHeader title="Contact Messages" subtitle="User Support" />

      <div className="mt-8 space-y-4">
        {messages.length === 0 ? (
          <div className="bg-card-gradient border border-border clip-notch p-12 text-center text-muted-foreground flex flex-col items-center">
            <Mail className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">No contact messages received yet.</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="bg-card-gradient border border-primary/20 hover:border-primary/60 shadow-md clip-notch p-5 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3 mb-3">
                <div>
                  <h3 className="font-display font-bold text-primary text-lg">{m.name}</h3>
                  <p className="text-xs text-muted-foreground tracking-widest">{m.email}</p>
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest bg-secondary/50 px-2 py-1 border border-border/50">
                  {new Date(m.created_at).toLocaleString()}
                </div>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{m.message}</p>
              <div className="mt-4 flex justify-end">
                <a href={`mailto:${m.email}`} className="text-xs text-primary hover:underline uppercase tracking-widest font-bold font-display">Reply via Email →</a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
