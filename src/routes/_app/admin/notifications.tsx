import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Bell, ShieldAlert, Send } from "lucide-react";
import { motion } from "framer-motion";
import { sendPushNotification, getTournaments } from "../../../api";

export const Route = createFileRoute("/_app/admin/notifications")({
  head: () => ({ meta: [{ title: "Push Notifications — Admin Dashboard" }] }),
  component: AdminNotificationsPage,
});

function AdminNotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [targetType, setTargetType] = useState<"all" | "users" | "tournament">("all");
  const [targetData, setTargetData] = useState("");
  const [message, setMessage] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [tournaments, setTournaments] = useState<any[]>([]);

  useEffect(() => {
    if (user && user.role === "admin") {
      (getTournaments as any)().then(setTournaments).catch(console.error);
    }
  }, [user]);

  if (loading) return null;
  if (!user || user.role !== "admin") {
    router.navigate({ to: "/login" });
    return null;
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return toast.error("Message cannot be empty.");
    
    if (targetType === "users" && !targetData.trim()) {
      return toast.error("Please enter usernames to target.");
    }
    if (targetType === "tournament" && !targetData) {
      return toast.error("Please select a tournament.");
    }

    setIsSending(true);
    try {
      await (sendPushNotification as any)({
        data: {
          targetType,
          targetData: targetType === "all" ? "" : targetData,
          message,
          redirectUrl,
          adminId: user.id
        }
      });
      toast.success("Notifications broadcasted successfully!");
      setMessage("");
      setTargetData("");
      setRedirectUrl("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send notifications");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-background min-h-screen pb-24">
      <div className="bg-card rounded-b-[2rem] shadow-[0_4px_24px_oklch(0_0_0/0.04)] pt-6 pb-6 px-4 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-cta font-bold mb-2">
              <Bell className="w-5 h-5" /> Push Notifications
            </div>
            <h1 className="font-display text-2xl font-black text-foreground">Broadcast Center</h1>
          </div>
          <a href="/admin">
            <Button variant="outline" size="sm" className="rounded-xl font-bold h-9 bg-card shadow-sm">
              Back
            </Button>
          </a>
        </div>
      </div>

      <div className="px-4 mt-6 max-w-2xl mx-auto">
        <form onSubmit={handleSend} className="bg-card rounded-[1.5rem] border border-border shadow-sm p-6 space-y-6">
          
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Target Audience</label>
            <div className="grid grid-cols-3 gap-3">
              <div 
                onClick={() => setTargetType("all")}
                className={`p-3 rounded-xl border text-center font-bold cursor-pointer transition-colors ${targetType === "all" ? "bg-primary/10 border-primary/50 text-cta" : "bg-secondary text-muted-foreground border-transparent hover:bg-secondary/80"}`}
              >
                All Users
              </div>
              <div 
                onClick={() => setTargetType("users")}
                className={`p-3 rounded-xl border text-center font-bold cursor-pointer transition-colors ${targetType === "users" ? "bg-primary/10 border-primary/50 text-cta" : "bg-secondary text-muted-foreground border-transparent hover:bg-secondary/80"}`}
              >
                Specific Users
              </div>
              <div 
                onClick={() => setTargetType("tournament")}
                className={`p-3 rounded-xl border text-center font-bold cursor-pointer transition-colors ${targetType === "tournament" ? "bg-primary/10 border-primary/50 text-cta" : "bg-secondary text-muted-foreground border-transparent hover:bg-secondary/80"}`}
              >
                Tournament
              </div>
            </div>
          </div>

          {targetType === "users" && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Usernames (Comma Separated)</label>
              <Input
                value={targetData}
                onChange={(e) => setTargetData(e.target.value)}
                placeholder="e.g. player1, toxicguy, mvp2024"
                className="h-12 bg-secondary/50 border-transparent rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary/50 font-semibold"
              />
            </div>
          )}

          {targetType === "tournament" && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select Tournament</label>
              <select
                value={targetData}
                onChange={(e) => setTargetData(e.target.value)}
                className="w-full h-12 bg-secondary/50 border-transparent rounded-xl px-3 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">-- Choose a Tournament --</option>
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>{t.title} ({t.status})</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Notification Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter the push notification message here..."
              className="w-full min-h-[120px] bg-secondary/50 border-transparent rounded-xl p-4 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Action URL (Optional)</label>
            <Input
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
              placeholder="e.g. /tournaments/5"
              className="h-12 bg-secondary/50 border-transparent rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary/50 font-semibold"
            />
          </div>

          <Button 
            type="submit" 
            disabled={isSending}
            className="w-full h-14 rounded-xl font-display font-black tracking-wider text-lg bg-primary text-white shadow-primary group overflow-hidden relative"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> BROADCAST NOW</>
              )}
            </span>
            <div className="absolute inset-0 bg-card/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </Button>

        </form>
      </div>
    </div>
  );
}
