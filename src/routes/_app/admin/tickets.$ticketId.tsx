import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Send, ShieldAlert, Check } from "lucide-react";
import { getTicket, replyTicket, updateTicketStatus } from "../../../api";

export const Route = createFileRoute("/_app/admin/tickets/$ticketId")({
  head: () => ({ meta: [{ title: "Ticket Management — Admin" }] }),
  component: AdminTicketChatPage,
});

function AdminTicketChatPage() {
  const { ticketId } = Route.useParams();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [ticket, setTicket] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) return router.navigate({ to: "/login" });
    if (user && user.role === "admin") loadTicket();
  }, [user, loading, ticketId]);

  const loadTicket = async () => {
    try {
      const data = await (getTicket as any)({ data: { ticketId } });
      if (!data) return router.navigate({ to: "/admin/tickets" });
      setTicket(data);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch(e) {}
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsSending(true);
    try {
      await (replyTicket as any)({ data: { ticketId, userId: user?.id, message, isAdmin: true } });
      setMessage("");
      await loadTicket();
    } catch(err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = ticket.status === 'open' ? 'resolved' : 'open';
    try {
      await (updateTicketStatus as any)({ data: { ticketId, status: newStatus } });
      toast.success(`Ticket marked as ${newStatus}`);
      await loadTicket();
    } catch(err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  if (!ticket || loading) return null;

  return (
    <div className="bg-background min-h-screen pb-24 flex flex-col">
      <div className="bg-card border-b border-border p-4 sticky top-0 z-20 flex items-center gap-3">
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
        <Button 
          onClick={handleToggleStatus} 
          variant={ticket.status === 'open' ? 'default' : 'outline'}
          size="sm" 
          className={`shrink-0 rounded-xl font-bold h-9 ${ticket.status === 'open' ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm' : ''}`}
        >
          <Check className="w-4 h-4 mr-1" />
          {ticket.status === 'open' ? 'Mark Resolved' : 'Reopen'}
        </Button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 max-w-4xl mx-auto w-full">
        {ticket.replies?.map((r: any) => {
          const isAdmin = r.is_admin === 1;

          return (
            <div key={r.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1.5 mb-1 mx-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {isAdmin ? 'YOU (ADMIN)' : r.ign || r.username}
                </span>
                {isAdmin && <ShieldAlert className="w-3 h-3 text-cta" />}
              </div>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm font-semibold whitespace-pre-wrap ${
                isAdmin ? 'bg-primary text-white rounded-tr-sm' : 'bg-card border border-border text-foreground rounded-tl-sm'
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

      <div className="fixed bottom-0 sm:bottom-0 left-0 sm:left-64 right-0 bg-card border-t border-border p-3 z-20 pb-safe">
        <form onSubmit={handleReply} className="flex items-end gap-2 max-w-4xl mx-auto w-full">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your official reply..."
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
      </div>
    </div>
  );
}
