import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { LifeBuoy, Clock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { getAllTickets } from "../../../api";
import { AdminNavBar } from "@/components/AdminNavBar";

export const Route = createFileRoute("/_app/admin/tickets/")({
  head: () => ({ meta: [{ title: "Support Tickets — Admin" }] }),
  component: AdminTicketsPage,
});

function AdminTicketsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.navigate({ to: "/login" });
      return;
    }
    if (user && user.role === "admin") {
      loadTickets();
    }
  }, [user, loading]);

  const loadTickets = async () => {
    try {
      const data = await (getAllTickets as any)();
      setTickets(data);
    } catch(e) {}
  };

  if (loading || !user) return null;

  return (
    <div className="bg-background min-h-screen pb-24">
      <div className="bg-card rounded-b-[2rem] shadow-[0_4px_24px_oklch(0_0_0/0.04)] pt-6 pb-6 px-4 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between max-w-4xl mx-auto">
          <div>
            <div className="flex items-center gap-2 text-cta font-bold mb-2">
              <LifeBuoy className="w-5 h-5" /> Help Desk
            </div>
            <h1 className="font-display text-2xl font-black text-foreground">Support Tickets</h1>
          </div>
          <Link to="/admin">
            <Button variant="outline" size="sm" className="rounded-xl font-bold h-9 bg-card shadow-sm">
              Back
            </Button>
          </Link>
        </div>
      </div>

      <div className="px-4 mt-6 max-w-4xl mx-auto">
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border shadow-sm p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mb-4 mx-auto">
                <LifeBuoy className="w-6 h-6" />
              </div>
              <p className="font-display font-bold text-lg text-foreground">No Tickets Found</p>
            </div>
          ) : (
            tickets.map((t) => (
              <Link key={t.id} to={`/admin/tickets/${t.id}` as any} className="block">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-[1.5rem] border border-border hover:border-primary/40 hover:shadow-md transition-all p-5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-mono text-muted-foreground font-bold">#{t.id}</span>
                      <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${t.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {t.status}
                      </div>
                    </div>
                    <h3 className="font-display font-black text-lg text-foreground mb-1 group-hover:text-cta transition-colors line-clamp-1">{t.subject}</h3>
                    <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                      <span>User: {t.ign || t.username}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(t.updated_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </motion.div>
              </Link>
            ))
          )}
        </div>
      </div>
      <AdminNavBar />
    </div>
  );
}
