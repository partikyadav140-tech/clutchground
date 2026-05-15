import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft, Send, ShieldCheck, CheckCheck, Clock, Lock, RefreshCw,
} from "lucide-react";
import { getTicket, replyTicket } from "../../api";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_app/support/$ticketId")({
  head: () => ({ meta: [{ title: "Ticket Chat — CLUTCHGROUND" }] }),
  component: TicketChatPage,
});

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

function groupRepliesByDate(replies: any[]) {
  const groups: { date: string; items: any[] }[] = [];
  replies.forEach((r) => {
    const label = formatDate(r.created_at);
    const last = groups[groups.length - 1];
    if (last && last.date === label) last.items.push(r);
    else groups.push({ date: label, items: [r] });
  });
  return groups;
}

function TicketChatPage() {
  const { ticketId } = Route.useParams();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [ticket, setTicket] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isResolved = ticket?.status === "resolved";

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior }), 60);
  }, []);

  const loadTicket = useCallback(async (silent = true) => {
    if (!silent) setIsRefreshing(true);
    try {
      const data = await (getTicket as any)({ data: { ticketId } });
      if (!data) return router.navigate({ to: "/support" });
      setTicket((prev: any) => {
        if (!prev || prev.replies?.length !== data.replies?.length) {
          scrollToBottom(prev ? "smooth" : "instant");
        }
        return data;
      });
    } catch {}
    finally { setIsRefreshing(false); }
  }, [ticketId, scrollToBottom]);

  useEffect(() => {
    if (!loading && !user) { router.navigate({ to: "/login" }); return; }
    if (user) {
      loadTicket(false);
      const id = setInterval(() => loadTicket(true), 4000);
      return () => clearInterval(id);
    }
  }, [user, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [message]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;
    setIsSending(true);
    const optimisticMsg = message.trim();
    setMessage("");
    try {
      await (replyTicket as any)({ data: { ticketId, userId: user?.id, message: optimisticMsg, isAdmin: false } });
      await loadTicket(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
      setMessage(optimisticMsg);
    } finally {
      setIsSending(false);
    }
  };

  if (!ticket || loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const groups = groupRepliesByDate(ticket.replies || []);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ── Chat Header ── */}
      <div className="shrink-0 bg-card/95 backdrop-blur-xl border-b border-border z-10">
        <div className="flex items-center gap-3 px-3 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.history.back()}
            className="rounded-full w-9 h-9 shrink-0 text-foreground hover:bg-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-sm text-foreground truncate leading-tight">
                {ticket.subject}
              </h1>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-muted-foreground font-mono">#{ticket.id}</span>
              <span className="text-muted-foreground text-[10px]">·</span>
              <span className={`text-[10px] font-black uppercase tracking-wider ${
                isResolved ? "text-emerald-500" : "text-amber-500"
              }`}>
                {ticket.status}
              </span>
            </div>
          </div>

          <button
            onClick={() => loadTicket(false)}
            disabled={isRefreshing}
            className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Messages Area ── */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-3 py-4 space-y-1">
        {groups.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground">Start the conversation below</p>
          </div>
        )}

        {groups.map((group) => (
          <div key={group.date}>
            {/* Date separator */}
            <div className="flex items-center gap-2 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">
                {group.date}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <AnimatePresence initial={false}>
              {group.items.map((r: any, idx: number) => {
                const isMe = r.user_id === user?.id;
                const isAdmin = r.is_admin === 1 || r.is_admin === true || r.is_admin === "true";
                const showAvatar = !isMe && (idx === 0 || group.items[idx - 1]?.is_admin !== r.is_admin);

                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`flex mb-1 ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    {/* Admin avatar spacer */}
                    {!isMe && (
                      <div className="w-7 shrink-0 self-end mr-1.5">
                        {showAvatar && (
                          <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                            <ShieldCheck className="w-3 h-3 text-primary" />
                          </div>
                        )}
                      </div>
                    )}

                    <div className={`max-w-[78%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      {/* Sender label */}
                      {showAvatar && !isMe && (
                        <span className="text-[10px] font-black text-primary uppercase tracking-wider mb-1 ml-1">
                          Support Team
                        </span>
                      )}

                      {/* Bubble */}
                      <div className={`relative px-3.5 py-2.5 text-sm leading-relaxed font-medium whitespace-pre-wrap break-words ${
                        isMe
                          ? "bg-primary text-white rounded-2xl rounded-br-sm shadow-sm"
                          : isAdmin
                          ? "bg-card border border-primary/20 text-foreground rounded-2xl rounded-bl-sm shadow-sm"
                          : "bg-card border border-border text-foreground rounded-2xl rounded-bl-sm shadow-sm"
                      }`}>
                        {r.message}
                      </div>

                      {/* Timestamp + read receipt */}
                      <div className={`flex items-center gap-1 mt-0.5 ${isMe ? "flex-row-reverse" : ""}`}>
                        <span className="text-[10px] text-muted-foreground font-medium mx-1">
                          {formatTime(r.created_at)}
                        </span>
                        {isMe && <CheckCheck className="w-3 h-3 text-muted-foreground" />}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ))}

        <div ref={endRef} className="h-1" />
      </div>

      {/* ── Input Area ── */}
      <div className="shrink-0 bg-card/95 backdrop-blur-xl border-t border-border px-3 py-3 pb-safe">
        {isResolved ? (
          <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <Lock className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-bold text-emerald-600">This ticket has been resolved</span>
          </div>
        ) : (
          <form onSubmit={handleReply} className="flex items-end gap-2">
            <div className="flex-1 bg-secondary/60 border border-border focus-within:border-primary/60 rounded-2xl transition-colors overflow-hidden">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full bg-transparent px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none resize-none leading-relaxed"
                rows={1}
                style={{ minHeight: 48, maxHeight: 120 }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleReply(e);
                  }
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isSending || !message.trim()}
              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90 ${
                message.trim() && !isSending
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {isSending ? (
                <Clock className="w-4 h-4 animate-pulse" />
              ) : (
                <Send className="w-4 h-4 ml-0.5" />
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
