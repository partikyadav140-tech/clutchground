import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bell, ShieldAlert, Send, ArrowLeft, Clock, Users, Trophy, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { sendPushNotification, getTournaments } from "../../../api";
import { AdminNavBar } from "@/components/AdminNavBar";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/admin/notifications")({
  head: () => ({ meta: [{ title: "Push Notifications — Admin Dashboard" }] }),
  component: AdminNotificationsPage,
});

interface SentLog {
  id: number;
  title: string;
  message: string;
  targetType: string;
  targetData: string;
  sentAt: Date;
}

function AdminNotificationsPage() {
  const { user, loading } = useAuth();

  const [targetType, setTargetType] = useState<"all" | "users" | "tournament">("all");
  const [targetData, setTargetData] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [history, setHistory] = useState<SentLog[]>([]);

  useEffect(() => {
    if (user && user.role === "admin") {
      (getTournaments as any)().then(setTournaments).catch(console.error);
    }
  }, [user]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <ShieldAlert className="w-10 h-10 text-destructive mb-4" />
        <h1 className="text-2xl font-display font-black text-foreground mb-4">Access Denied</h1>
        <Link to="/login">
          <Button className="bg-primary text-white rounded-xl font-bold h-12 px-8">
            Return to Login
          </Button>
        </Link>
      </div>
    );
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return toast.error("Message cannot be empty.");
    if (targetType === "users" && !targetData.trim())
      return toast.error("Enter usernames to target.");
    if (targetType === "tournament" && !targetData) return toast.error("Select a tournament.");

    setIsSending(true);
    try {
      await (sendPushNotification as any)({
        data: {
          targetType,
          targetData: targetType === "all" ? "" : targetData,
          message: title ? `${title}: ${message}` : message,
          redirectUrl,
          adminId: user.id,
        },
      });
      toast.success("Notification broadcasted!");
      const log: SentLog = {
        id: Date.now(),
        title,
        message,
        targetType,
        targetData,
        sentAt: new Date(),
      };
      setHistory((prev) => [log, ...prev.slice(0, 9)]);
      setMessage("");
      setTitle("");
      setTargetData("");
      setRedirectUrl("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send");
    } finally {
      setIsSending(false);
    }
  };

  const TARGET_OPTIONS = [
    { key: "all" as const, icon: Users, label: "All Users", desc: "Every registered user" },
    { key: "users" as const, icon: Tag, label: "Specific Users", desc: "By username" },
    { key: "tournament" as const, icon: Trophy, label: "Tournament", desc: "All registrants" },
  ];

  return (
    <div className="bg-background min-h-screen pb-2">
      {/* Header */}
      <div className="bg-card border-b border-border pt-6 pb-5 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground mb-4 bg-secondary/50 px-3 py-1.5 rounded-full transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-500/10 text-pink-500 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-black text-foreground">Broadcast</h1>
            <p className="text-xs text-muted-foreground font-semibold">
              Push notifications to users
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4 max-w-2xl mx-auto">
        {/* Send form */}
        <form
          onSubmit={handleSend}
          className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-5"
        >
          {/* Target audience */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Target Audience
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TARGET_OPTIONS.map(({ key, icon: Icon, label, desc }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setTargetType(key);
                    setTargetData("");
                  }}
                  className={`p-3 rounded-xl border text-center transition-all active:scale-95 ${
                    targetType === key
                      ? "bg-primary/10 border-primary/40 text-primary shadow-sm"
                      : "bg-secondary border-transparent text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  <Icon className="w-4 h-4 mx-auto mb-1" />
                  <div className="text-[10px] font-black leading-tight">{label}</div>
                  <div className="text-[9px] text-muted-foreground leading-tight mt-0.5 hidden sm:block">
                    {desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Specific input for users/tournament */}
          {targetType === "users" && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Usernames (comma separated)
              </label>
              <input
                value={targetData}
                onChange={(e) => setTargetData(e.target.value)}
                placeholder="e.g. player1, toxicguy, mvp2024"
                className="w-full h-11 bg-secondary/50 border border-border focus:border-primary outline-none px-4 text-sm rounded-xl font-semibold transition-all"
              />
            </div>
          )}

          {targetType === "tournament" && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Select Tournament
              </label>
              <select
                value={targetData}
                onChange={(e) => setTargetData(e.target.value)}
                className="w-full h-11 bg-secondary/50 border border-border focus:border-primary outline-none px-4 text-sm rounded-xl font-semibold transition-all appearance-none"
              >
                <option value="">— Choose Tournament —</option>
                {tournaments.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Title{" "}
              <span className="text-muted-foreground/50 normal-case font-semibold">(optional)</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 🏆 Match Alert"
              className="w-full h-11 bg-secondary/50 border border-border focus:border-primary outline-none px-4 text-sm rounded-xl font-semibold transition-all"
            />
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter the notification message..."
              className="w-full min-h-[100px] bg-secondary/50 border border-border focus:border-primary outline-none px-4 py-3 text-sm rounded-xl font-semibold transition-all resize-y"
              required
            />
            {title && message && (
              <div className="bg-secondary/40 rounded-xl p-3 border border-border text-xs font-semibold text-muted-foreground">
                <span className="text-[9px] uppercase tracking-widest font-black block mb-1">
                  Preview
                </span>
                <span className="text-foreground font-black">{title}: </span>
                {message}
              </div>
            )}
          </div>

          {/* Action URL */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Action URL{" "}
              <span className="text-muted-foreground/50 normal-case font-semibold">(optional)</span>
            </label>
            <input
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
              placeholder="e.g. /tournaments/5"
              className="w-full h-11 bg-secondary/50 border border-border focus:border-primary outline-none px-4 text-sm rounded-xl font-semibold transition-all"
            />
          </div>

          <Button
            type="submit"
            disabled={isSending}
            className="w-full h-12 rounded-xl font-display font-black tracking-wider text-white relative overflow-hidden group"
            style={{
              background: isSending ? "var(--muted)" : "var(--gradient-cta, var(--primary))",
            }}
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                BROADCAST NOW
              </span>
            )}
          </Button>
        </form>

        {/* Broadcast history */}
        {history.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Recent Broadcasts (this session)
              </span>
              <div className="flex-1 h-px bg-border/50" />
            </div>
            {history.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border p-3.5"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        log.targetType === "all"
                          ? "bg-primary/10 text-primary"
                          : log.targetType === "tournament"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-blue-500/10 text-blue-500"
                      }`}
                    >
                      {log.targetType === "all"
                        ? "All Users"
                        : log.targetType === "tournament"
                          ? "Tournament"
                          : "Specific"}
                    </span>
                    {log.title && (
                      <span className="font-bold text-xs text-foreground">{log.title}</span>
                    )}
                  </div>
                  <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                    {log.sentAt.toLocaleTimeString("en-IN")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-semibold line-clamp-2">
                  {log.message}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AdminNavBar />
    </div>
  );
}
