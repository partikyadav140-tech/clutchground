import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  LifeBuoy,
  Plus,
  MessageCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getMyTickets, createTicket } from "../../api";

export const Route = createFileRoute("/_app/support/")({
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
    if (user) loadTickets();
  }, [user, loading]);

  const loadTickets = async () => {
    try {
      const data = await (getMyTickets as any)({ data: user?.id });
      setTickets(data);
    } catch {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return toast.error("Please fill all fields.");
    setIsSubmitting(true);
    try {
      const res = await (createTicket as any)({ data: { userId: user?.id, subject, message } });
      toast.success("Ticket created!");
      setIsCreating(false);
      setSubject("");
      setMessage("");
      router.navigate({ to: `/support/${res.ticketId}` });
    } catch (err: any) {
      toast.error(err.message || "Failed to create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-full bg-background pb-6">
      {/* ── Header ── */}
      <div className="bg-card border-b border-border pt-safe px-4 pb-4">
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.history.back()}
              className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-90"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-cta font-bold mb-0.5">
                <LifeBuoy className="w-3.5 h-3.5" /> Help Center
              </div>
              <h1 className="font-display font-black text-xl text-foreground">Support Tickets</h1>
            </div>
          </div>
          {!isCreating && (
            <Button
              onClick={() => setIsCreating(true)}
              className="h-9 px-4 rounded-xl font-bold bg-primary text-white text-sm"
            >
              <Plus className="w-4 h-4 mr-1" /> New
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 mt-5 max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          {isCreating ? (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
                {/* Form header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <h2 className="font-display font-black text-lg text-foreground">New Ticket</h2>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleCreate} className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      Subject
                    </label>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Missing Prize / Report Hacker"
                      className="w-full h-12 bg-secondary/50 border border-border focus:border-primary/60 rounded-xl px-4 font-semibold text-sm text-foreground outline-none transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      Message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your issue in detail..."
                      className="w-full min-h-[120px] bg-secondary/50 border border-border focus:border-primary/60 rounded-xl p-4 font-semibold text-sm text-foreground outline-none resize-y transition-colors"
                      required
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreating(false)}
                      className="flex-1 h-12 rounded-xl font-bold"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 h-12 rounded-xl font-bold bg-primary text-white"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Ticket"}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              {tickets.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border shadow-card p-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4 mx-auto">
                    <LifeBuoy className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="font-display font-bold text-lg text-foreground">No Tickets Yet</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-6">
                    Need help? Create a ticket and our team will assist you.
                  </p>
                  <Button
                    onClick={() => setIsCreating(true)}
                    className="h-12 px-8 rounded-xl font-bold bg-primary text-white"
                  >
                    Open a Ticket
                  </Button>
                </div>
              ) : (
                tickets.map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link to={`/support/${t.id}` as any} className="block group">
                      <div className="bg-card rounded-2xl border border-border hover:border-primary/40 hover:shadow-card transition-all p-4 flex items-center gap-4">
                        {/* Icon */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            t.status === "open"
                              ? "bg-amber-500/10 border border-amber-500/25"
                              : "bg-emerald-500/10 border border-emerald-500/25"
                          }`}
                        >
                          {t.status === "open" ? (
                            <MessageCircle className="w-4 h-4 text-amber-500" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                t.status === "open"
                                  ? "bg-amber-500/10 text-amber-600"
                                  : "bg-emerald-500/10 text-emerald-600"
                              }`}
                            >
                              {t.status}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              #{t.id}
                            </span>
                          </div>
                          <h3 className="font-display font-black text-sm text-foreground line-clamp-1">
                            {t.subject}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(t.updated_at).toLocaleDateString()}
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                      </div>
                    </Link>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
