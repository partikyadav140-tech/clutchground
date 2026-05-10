import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Send, ShieldAlert, CheckCircle2 } from "lucide-react";
import { getTicket, replyTicket } from "../../api";

export const Route = createFileRoute("/_app/support/$ticketId")({
  head: () => ({ meta: [{ title: "Ticket Chat — CLUTCHGROUND" }] }),
  component: TicketChatPage,
});

function TicketChatPage() {
  const { ticketId } = Route.useParams();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [ticket, setTicket] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.navigate({ to: "/login" });
      return;
    }
    if (user) {
      loadTicket();
      const interval = setInterval(loadTicket, 3000); // Poll every 3 seconds for real-time feel
      return () => clearInterval(interval);
    }
  }, [user, loading, ticketId]);

  const loadTicket = async () => {
    try {
      const data = await (getTicket as any)({ data: { ticketId } });
      if (!data) return router.navigate({ to: "/support" });
      setTicket((prev: any) => {
        if (!prev || prev.replies?.length !== data.replies?.length) {
          setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }
        return data;
      });
    } catch(e) {}
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsSending(true);
    try {
      await (replyTicket as any)({ data: { ticketId, userId: user?.id, message, isAdmin: false } });
      setMessage("");
      await loadTicket();
    } catch(err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  if (!ticket || loading) return null;

  return (
    <div className="bg-background min-h-screen pb-24 flex flex-col">
      <div className="bg-card border-b border-white/5 p-4 sticky top-0 z-20 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.history.back()} className="rounded-full w-10 h-10 shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-display font-black text-lg text-foreground truncate">{ticket.subject}</h1>
            <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 ${ticket.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {ticket.status}
            </div>
          </div>
          <div className="text-xs text-muted-foreground font-mono font-bold mt-0.5">Ticket #{ticket.id}</div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 pb-36">
        {ticket.replies?.map((r: any) => {
          const isMe = r.user_id === user?.id;
          const isAdmin = r.is_admin === 1 || r.is_admin === true || r.is_admin === 'true';

          return (
            <div key={r.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1.5 mb-1 mx-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {isAdmin ? 'SUPPORT ADMIN' : r.ign || r.username}
                </span>
                {isAdmin && <ShieldAlert className="w-3 h-3 text-cta" />}
              </div>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm font-semibold whitespace-pre-wrap ${
                isAdmin ? 'bg-primary/10 text-cta border border-primary/20 rounded-tl-sm' : 
                isMe ? 'bg-foreground text-background rounded-tr-sm' : 'bg-card border border-white/10 text-foreground rounded-tl-sm'
              }`}>
                {r.message}
              </div>
              <div className="text-[9px] text-muted-foreground font-bold mt-1 mx-1">
                {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 bg-card border-t border-white/5 p-3 z-20 pb-safe sm:left-64">
        {ticket.status === 'resolved' ? (
          <div className="bg-emerald-50 text-emerald-600 rounded-xl p-3 flex items-center justify-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" /> This ticket has been resolved
          </div>
        ) : (
          <form onSubmit={handleReply} className="flex items-end gap-2 max-w-4xl mx-auto w-full">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your reply..."
              className="flex-1 bg-secondary/50 border border-border focus:border-primary outline-none rounded-[1.5rem] px-4 py-3 text-sm font-semibold resize-none max-h-32 min-h-[48px]"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleReply(e);
                }
              }}
            />
            <Button type="submit" disabled={isSending || !message.trim()} className="w-12 h-12 rounded-full bg-primary text-white shrink-0 shadow-sm p-0 flex items-center justify-center">
              <Send className="w-5 h-5 ml-1" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
