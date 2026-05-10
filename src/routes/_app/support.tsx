import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LifeBuoy, Plus, MessageCircle, Clock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { getMyTickets, createTicket } from "../../api";

export const Route = createFileRoute("/_app/support")({
  head: () => ({ meta: [{ title: "Help & Support — CLUTCHGROUND" }] }),
  component: SupportPage,
});

function SupportPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [tickets, setTickets] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.navigate({ to: "/login" });
      return;
    }
    if (user) {
      loadTickets();
    }
  }, [user, loading]);

  const loadTickets = async () => {
    try {
      const data = await (getMyTickets as any)({ data: user?.id });
      setTickets(data);
    } catch(e) {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return toast.error("Please fill all fields.");
    setIsSubmitting(true);
    try {
      const res = await (createTicket as any)({ data: { userId: user?.id, subject, message } });
      toast.success("Ticket created successfully!");
      setIsCreating(false);
      setSubject("");
      setMessage("");
      router.navigate({ to: `/support/${res.ticketId}` });
    } catch(err: any) {
      toast.error(err.message || "Failed to create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="bg-background min-h-screen pb-24">
      <div className="bg-white rounded-b-[2rem] shadow-[0_4px_24px_oklch(0_0_0/0.04)] pt-6 pb-6 px-4 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold mb-2">
              <LifeBuoy className="w-5 h-5" /> Help Center
            </div>
            <h1 className="font-display text-2xl font-black text-foreground">Support Tickets</h1>
          </div>
          {!isCreating && (
            <Button onClick={() => setIsCreating(true)} className="h-10 rounded-xl font-bold shadow-sm bg-primary text-white">
              <Plus className="w-4 h-4 mr-1" /> New Ticket
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 mt-6 max-w-3xl mx-auto">
        {isCreating ? (
          <motion.form 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            onSubmit={handleCreate} 
            className="bg-white rounded-[1.5rem] border border-border shadow-sm p-6 space-y-4"
          >
            <h2 className="font-display font-black text-xl text-foreground mb-2">Create New Ticket</h2>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Subject</label>
              <input
                value={subject} onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Missing Prize Money / Report Hacker"
                className="w-full h-12 bg-secondary/50 border-transparent rounded-xl px-4 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Message</label>
              <textarea
                value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Describe your issue in detail..."
                className="w-full min-h-[120px] bg-secondary/50 border-transparent rounded-xl p-4 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreating(false)} className="flex-1 h-12 rounded-xl font-bold border-border">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 h-12 rounded-xl font-bold bg-primary text-white shadow-primary">
                {isSubmitting ? "Submitting..." : "Submit Ticket"}
              </Button>
            </div>
          </motion.form>
        ) : (
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <div className="bg-white rounded-2xl border border-border shadow-sm p-10 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mb-4 mx-auto">
                  <LifeBuoy className="w-6 h-6" />
                </div>
                <p className="font-display font-bold text-lg text-foreground">No Support Tickets</p>
                <p className="text-sm text-muted-foreground mt-1 mb-6">Need help? Create a ticket and an admin will assist you.</p>
                <Button onClick={() => setIsCreating(true)} className="h-12 px-8 rounded-xl font-bold bg-primary text-white shadow-primary">
                  Open a Ticket
                </Button>
              </div>
            ) : (
              tickets.map((t) => (
                <Link key={t.id} to={`/support/${t.id}`} className="block">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[1.5rem] border border-border hover:border-primary/40 hover:shadow-md transition-all p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-muted-foreground font-bold">#{t.id}</span>
                        <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${t.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {t.status}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(t.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    <h3 className="font-display font-black text-lg text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">{t.subject}</h3>
                    <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                      <MessageCircle className="w-4 h-4" /> View Chat
                    </div>
                  </motion.div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
