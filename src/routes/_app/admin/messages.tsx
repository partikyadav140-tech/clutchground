import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Mail, ShieldAlert } from "lucide-react";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { getContactMessages } from "../../../api";
import { motion } from "framer-motion";
import { AdminNavBar } from "@/components/AdminNavBar";

export const Route = createFileRoute("/_app/admin/messages")({
  head: () => ({ meta: [{ title: "Admin: Messages — Professional Esports Arena" }] }),
  loader: async () => {
    try {
      return await getContactMessages();
    } catch {
      return [];
    }
  },
  component: AdminMessages,
});

function AdminMessages() {
  const messages = Route.useLoaderData() as any[];
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
          You must be logged in as an administrator to view this page.
        </p>
        <Link to="/login">
          <Button className="h-12 px-8 rounded-xl font-bold bg-primary text-white shadow-primary">
            Return to Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* ─── Top Header (Mobile First) ─── */}
      <div className="bg-card rounded-b-[2rem] shadow-[0_4px_24px_oklch(0_0_0/0.04)] pt-6 pb-6 px-4 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-cta mb-4 relative z-10 transition-colors bg-secondary/50 px-3 py-1.5 rounded-full"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center mb-3">
            <Mail className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-black text-foreground">Inbox</h1>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">Support & Inquiries</p>
        </div>
      </div>

      <div className="px-4 mt-6">
        {messages.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-[1.5rem] border border-border shadow-sm">
            <Mail className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-foreground font-semibold">No contact messages received yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m: any, i: number) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                key={m.id}
                className="bg-card rounded-[1.5rem] border border-border shadow-sm overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-4 mb-4">
                    <div>
                      <h3 className="font-display font-black text-foreground text-lg mb-1">
                        {m.name}
                      </h3>
                      <p className="text-xs font-semibold text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-md inline-block">
                        {m.email}
                      </p>
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest self-start sm:self-center bg-card border border-border px-2.5 py-1 rounded-md shadow-sm">
                      {new Date(m.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {m.message}
                    </p>
                  </div>

                  <div className="mt-5 flex justify-end">
                    <Button
                      asChild
                      variant="outline"
                      className="rounded-xl font-bold border-primary/20 text-cta hover:bg-primary/5 h-10 px-5"
                    >
                      <a href={`mailto:${m.email}`}>
                        <Mail className="w-4 h-4 mr-2" /> Reply via Email
                      </a>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <AdminNavBar />
    </div>
  );
}
