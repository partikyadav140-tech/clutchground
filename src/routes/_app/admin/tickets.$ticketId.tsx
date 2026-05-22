import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Send, User, Check, Lock, Clock, CheckCheck, RefreshCw, ImagePlus, X } from "lucide-react";
import { getTicket, replyTicket, updateTicketStatus } from "../../../api";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/admin/tickets/$ticketId")({
  head: () => ({ meta: [{ title: "Ticket Management — Admin" }] }),
  component: AdminTicketChatPage,
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
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}
function groupByDate(replies: any[]) {
  const groups: { date: string; items: any[] }[] = [];
  replies.forEach((r) => {
    const label = formatDate(r.created_at);
    const last = groups[groups.length - 1];
    if (last && last.date === label) last.items.push(r);
    else groups.push({ date: label, items: [r] });
  });
  return groups;
}

const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => resolve(base64Str);
  });
};

const parseMessage = (msgContent: string) => {
  let text = msgContent;
  let image: string | null = null;

  if (msgContent && msgContent.startsWith("{") && msgContent.endsWith("}")) {
    try {
      const parsed = JSON.parse(msgContent);
      if (parsed.text !== undefined || parsed.image !== undefined) {
        text = parsed.text || "";
        image = parsed.image || null;
      }
    } catch (e) {
      // Not valid JSON
    }
  } else if (msgContent && msgContent.startsWith("data:image/")) {
    image = msgContent;
    text = "";
  }

  return { text, image };
};

function AdminTicketChatPage() {
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

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior }), 60);
  }, []);

  const loadTicket = useCallback(async (silent = true) => {
    if (!silent) setIsRefreshing(true);
    try {
      const data = await (getTicket as any)({ data: { ticketId } });
      if (!data) return router.navigate({ to: "/admin/tickets" });
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
    if (!loading && (!user || (user as any).role !== "admin")) {
      router.navigate({ to: "/login" }); return;
    }
    if (user && (user as any).role === "admin") {
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const rawBase64 = ev.target?.result as string;
      try {
        const compressed = await compressImage(rawBase64);
        setSelectedImage(compressed);
      } catch (err) {
        setSelectedImage(rawBase64);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !selectedImage) || isSending) return;
    setIsSending(true);
    const optimisticMsg = message.trim();
    const imageToSend = selectedImage;
    setMessage("");
    setSelectedImage(null);

    let finalMessage = optimisticMsg;
    if (imageToSend) {
      finalMessage = JSON.stringify({
        text: optimisticMsg,
        image: imageToSend,
      });
    }

    try {
      await (replyTicket as any)({
        data: {
          ticketId,
          userId: user?.id,
          message: finalMessage,
          isAdmin: true,
        },
      });
      await loadTicket(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
      setMessage(optimisticMsg);
      setSelectedImage(imageToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = ticket.status === "open" ? "resolved" : "open";
    try {
      await (updateTicketStatus as any)({ data: { ticketId, status: newStatus } });
      toast.success(`Ticket marked as ${newStatus}`);
      await loadTicket(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  if (!ticket || loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const groups = groupByDate(ticket.replies || []);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="shrink-0 bg-card/95 backdrop-blur-xl border-b border-border z-10">
        <div className="flex items-center gap-3 px-3 py-3">
          <Button
            variant="ghost" size="icon"
            onClick={() => router.history.back()}
            className="rounded-full w-9 h-9 shrink-0 text-foreground hover:bg-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {/* User Avatar - Premium Neon Styling */}
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.15)]">
            <User className="w-4 h-4 text-purple-400" />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="font-display font-black text-sm text-foreground truncate leading-tight">
              {ticket.subject}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-muted-foreground font-mono">#{ticket.id}</span>
              <span className="text-muted-foreground text-[10px]">·</span>
              <span className={`text-[10px] font-black uppercase tracking-wider ${isResolved ? "text-emerald-500" : "text-amber-500"}`}>
                {ticket.status}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadTicket(false)}
              disabled={isRefreshing}
              className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
            <Button
              onClick={handleToggleStatus}
              size="sm"
              className={`h-8 px-3 rounded-xl font-bold text-xs shrink-0 ${
                isResolved
                  ? "bg-secondary text-foreground border border-border hover:bg-accent"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white"
              }`}
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              {isResolved ? "Reopen" : "Resolve"}
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-6 space-y-3 relative grid-bg">
        {/* Glow blobs for esports/gaming vibe */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-10 left-0 w-72 h-72 bg-neon/5 rounded-full blur-[90px] pointer-events-none" />

        {groups.map((group) => (
          <div key={group.date} className="relative z-10">
            {/* Date separator */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-border/40" />
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-2 bg-background">
                {group.date}
              </span>
              <div className="flex-1 h-px bg-border/40" />
            </div>

            <AnimatePresence initial={false}>
              {group.items.map((r: any, idx: number) => {
                const isAdmin = r.is_admin === 1 || r.is_admin === true || r.is_admin === "true";
                const nextIsAdmin = group.items[idx - 1] ? (group.items[idx - 1].is_admin === 1 || group.items[idx - 1].is_admin === true || group.items[idx - 1].is_admin === "true") : null;
                const showAvatar = !isAdmin && (idx === 0 || nextIsAdmin !== isAdmin);

                const parsed = parseMessage(r.message);

                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`flex mb-2 ${isAdmin ? "justify-end" : "justify-start"}`}
                  >
                    {/* Avatar */}
                    {!isAdmin && (
                      <div className="w-8 shrink-0 self-end mr-2">
                        {showAvatar && (
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.15)]">
                            <User className="w-4 h-4 text-purple-400" />
                          </div>
                        )}
                      </div>
                    )}

                    <div className={`max-w-[78%] flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                      {/* Sender label */}
                      {showAvatar && !isAdmin && (
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider mb-1 ml-1">
                          {ticket.ign || ticket.username || "User"}
                        </span>
                      )}

                      {/* Bubble */}
                      <div className={`relative px-4 py-2.5 text-sm leading-relaxed font-medium whitespace-pre-wrap break-words ${
                        isAdmin
                          ? "bg-gradient-to-r from-sky-500 to-primary text-white rounded-2xl rounded-tr-none shadow-[0_4px_16px_rgba(0,200,255,0.1)]"
                          : "glass-card border border-border/80 text-foreground rounded-2xl rounded-tl-none shadow-md"
                      }`}>
                        {parsed.image && (
                          <div
                            className="mb-2 max-w-full rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:scale-[1.01] transition-transform duration-200"
                            onClick={() => setZoomedImage(parsed.image)}
                          >
                            <img src={parsed.image} alt="Attached screenshot" className="max-h-64 w-full object-cover rounded-xl" />
                          </div>
                        )}
                        {parsed.text}
                      </div>

                      {/* Timestamp + read receipt */}
                      <div className={`flex items-center gap-1 mt-1 ${isAdmin ? "flex-row-reverse" : ""}`}>
                        <span className="text-[9px] text-muted-foreground font-semibold mx-1">
                          {formatTime(r.created_at)}
                        </span>
                        {isAdmin && <CheckCheck className="w-3.5 h-3.5 text-primary" />}
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

      {/* Input Area */}
      <div className="shrink-0 bg-card/80 backdrop-blur-xl border-t border-border/60 px-4 py-3.5 pb-safe">
        {isResolved ? (
          <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <Lock className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-bold text-emerald-600">Ticket resolved — reopen to reply</span>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Attachment Preview */}
            {selectedImage && (
              <div className="relative inline-flex items-center rounded-2xl bg-secondary/80 border border-border/80 p-2 pr-8 animate-scale-in">
                <img src={selectedImage} className="w-12 h-12 rounded-xl object-cover" />
                <span className="text-[10px] text-muted-foreground ml-2 max-w-[120px] truncate">photo_attached.jpg</span>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <form onSubmit={handleReply} className="flex items-end gap-2.5">
              {/* Attachment Trigger Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-11 h-11 rounded-2xl bg-secondary/80 border border-border/60 flex items-center justify-center shrink-0 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all press-effect active:scale-90"
              >
                <ImagePlus className="w-5 h-5" />
              </button>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageSelect}
                className="hidden"
              />

              <div className="flex-1 bg-secondary/50 border border-border/80 focus-within:border-primary/50 focus-within:bg-secondary/80 rounded-2xl transition-all overflow-hidden flex items-end">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type official reply..."
                  className="flex-1 bg-transparent px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none resize-none leading-relaxed min-h-[44px] max-h-[120px]"
                  rows={1}
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
                disabled={isSending || (!message.trim() && !selectedImage)}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-90 ${
                  (message.trim() || selectedImage) && !isSending
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
          </div>
        )}
      </div>

      {/* ── Zoom Modal ── */}
      <Dialog open={!!zoomedImage} onOpenChange={(v) => !v && setZoomedImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95 border border-white/10 flex items-center justify-center rounded-3xl">
          <DialogTitle className="sr-only">Attached Screenshot</DialogTitle>
          {zoomedImage && (
            <img src={zoomedImage} alt="Zoomed screenshot" className="w-full h-full max-h-[90vh] object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
