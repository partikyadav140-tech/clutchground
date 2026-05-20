import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Settings, Bell, CreditCard, AlertTriangle, Save, X,
  Shield, Megaphone, ArrowLeft, ToggleLeft, ToggleRight, Trash2,
} from "lucide-react";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AdminNavBar } from "@/components/AdminNavBar";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/admin/site-settings")({
  head: () => ({ meta: [{ title: "Site Settings — Admin" }] }),
  component: AdminSiteSettingsPage,
});

function SectionCard({ title, icon: Icon, color, bg, children }: {
  title: string; icon: any; color: string; bg: string; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
    >
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b border-border/50">
        <div className={`w-8 h-8 ${bg} ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="font-display font-black text-sm text-foreground">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  );
}

function InputField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-[9px] uppercase tracking-widest font-black text-muted-foreground mb-1.5">{label}</label>
      <input
        {...props}
        className="w-full h-11 bg-secondary/50 border border-border focus:border-primary outline-none px-4 text-sm rounded-xl font-semibold transition-all"
      />
    </div>
  );
}

function AdminSiteSettingsPage() {
  const { user, loading } = useAuth();

  // Announcement
  const [announcement, setAnnouncement] = useState("");
  const [savedAnnouncement, setSavedAnnouncement] = useState("");

  // UPI config
  const [upiId, setUpiId] = useState("");
  const [upiName, setUpiName] = useState("");
  const [minDeposit, setMinDeposit] = useState("50");
  const [maxDeposit, setMaxDeposit] = useState("10000");

  // Maintenance
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    const ann = localStorage.getItem("admin_announcement") || "";
    setSavedAnnouncement(ann);
    setAnnouncement(ann);

    try {
      const upiCfg = JSON.parse(localStorage.getItem("admin_upi_config") || "{}");
      setUpiId(upiCfg.upiId || "");
      setUpiName(upiCfg.upiName || "");
      setMinDeposit(upiCfg.minDeposit || "50");
      setMaxDeposit(upiCfg.maxDeposit || "10000");
    } catch {}

    setMaintenance(localStorage.getItem("admin_maintenance_mode") === "true");
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <Shield className="w-10 h-10 text-destructive mb-4" />
        <h1 className="text-2xl font-display font-black text-foreground mb-4">Access Denied</h1>
        <Link to="/login"><Button className="bg-primary text-white rounded-xl font-bold h-12 px-8">Return to Login</Button></Link>
      </div>
    );
  }

  const saveAnnouncement = () => {
    localStorage.setItem("admin_announcement", announcement);
    setSavedAnnouncement(announcement);
    toast.success("Announcement saved!");
  };

  const clearAnnouncement = () => {
    localStorage.removeItem("admin_announcement");
    setAnnouncement("");
    setSavedAnnouncement("");
    toast.success("Announcement cleared.");
  };

  const saveUpiConfig = () => {
    if (!upiId.trim()) return toast.error("UPI ID is required.");
    localStorage.setItem("admin_upi_config", JSON.stringify({ upiId, upiName, minDeposit, maxDeposit }));
    toast.success("UPI config saved!");
  };

  const toggleMaintenance = () => {
    const newVal = !maintenance;
    setMaintenance(newVal);
    localStorage.setItem("admin_maintenance_mode", String(newVal));
    toast.success(newVal ? "Maintenance mode ON" : "Maintenance mode OFF");
  };

  return (
    <div className="bg-background min-h-screen pb-2">
      {/* Header */}
      <div className="bg-card border-b border-border pt-6 pb-5 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground mb-4 bg-secondary/50 px-3 py-1.5 rounded-full transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-black text-foreground">Site Settings</h1>
            <p className="text-xs text-muted-foreground font-semibold">Global platform configuration</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4 max-w-2xl mx-auto">

        {/* ─── Announcement Banner ─── */}
        <SectionCard title="Announcement Banner" icon={Megaphone} color="text-amber-500" bg="bg-amber-500/10">
          <div className="space-y-3">
            <div>
              <label className="block text-[9px] uppercase tracking-widest font-black text-muted-foreground mb-1.5">Banner Message</label>
              <textarea
                value={announcement}
                onChange={e => setAnnouncement(e.target.value)}
                placeholder="e.g. ⚠️ Server maintenance tonight at 11 PM IST"
                rows={3}
                className="w-full bg-secondary/50 border border-border focus:border-primary outline-none px-4 py-3 text-sm rounded-xl font-semibold transition-all resize-none"
              />
            </div>

            {savedAnnouncement && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5">
                <Bell className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-amber-600 mb-0.5">Live Banner</div>
                  <p className="text-xs font-semibold text-foreground">{savedAnnouncement}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button className="flex-1 h-10 rounded-xl font-bold text-xs bg-primary text-white" onClick={saveAnnouncement}>
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save Banner
              </Button>
              {savedAnnouncement && (
                <Button variant="outline" className="h-10 rounded-xl font-bold text-xs border-border text-muted-foreground" onClick={clearAnnouncement}>
                  <X className="w-3.5 h-3.5 mr-1" /> Clear
                </Button>
              )}
            </div>
          </div>
        </SectionCard>

        {/* ─── UPI Config ─── */}
        <SectionCard title="UPI Payment Details" icon={CreditCard} color="text-emerald-500" bg="bg-emerald-500/10">
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground font-semibold bg-secondary/40 rounded-xl p-3 border border-border">
              These values are stored locally and should match your UPI configuration set on the backend.
            </div>
            <InputField label="UPI ID" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="payments@clutchground" />
            <InputField label="Account / Business Name" value={upiName} onChange={e => setUpiName(e.target.value)} placeholder="CLUTCHGROUND Esports" />
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Min Deposit (₹)" type="number" value={minDeposit} onChange={e => setMinDeposit(e.target.value)} placeholder="50" />
              <InputField label="Max Deposit (₹)" type="number" value={maxDeposit} onChange={e => setMaxDeposit(e.target.value)} placeholder="10000" />
            </div>
            {upiId && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-xs font-semibold">
                <div className="text-[9px] uppercase tracking-widest font-black text-emerald-600 mb-1.5">Current Config Preview</div>
                <div className="space-y-1 text-muted-foreground">
                  <div><span className="text-foreground font-bold">UPI:</span> {upiId}</div>
                  {upiName && <div><span className="text-foreground font-bold">Name:</span> {upiName}</div>}
                  <div><span className="text-foreground font-bold">Range:</span> ₹{minDeposit} — ₹{maxDeposit}</div>
                </div>
              </div>
            )}
            <Button className="w-full h-10 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-white" onClick={saveUpiConfig}>
              <Save className="w-3.5 h-3.5 mr-1.5" /> Save UPI Config
            </Button>
          </div>
        </SectionCard>

        {/* ─── Maintenance Mode ─── */}
        <SectionCard title="Maintenance Mode" icon={Shield} color="text-purple-500" bg="bg-purple-500/10">
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-semibold">
              When ON, display a maintenance banner to users. The site remains accessible — this is a visual indicator only.
            </p>
            <button
              onClick={toggleMaintenance}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                maintenance
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-emerald-500/10 border-emerald-500/20"
              }`}
            >
              <div className="flex items-center gap-3">
                {maintenance
                  ? <AlertTriangle className="w-5 h-5 text-red-500" />
                  : <Shield className="w-5 h-5 text-emerald-500" />
                }
                <div className="text-left">
                  <div className={`font-display font-black text-sm ${maintenance ? "text-red-500" : "text-emerald-600"}`}>
                    {maintenance ? "Maintenance Mode: ON" : "Maintenance Mode: OFF"}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-semibold">
                    {maintenance ? "Users see a maintenance warning" : "Site is operating normally"}
                  </div>
                </div>
              </div>
              {maintenance
                ? <ToggleRight className="w-7 h-7 text-red-500" />
                : <ToggleLeft className="w-7 h-7 text-muted-foreground" />
              }
            </button>
          </div>
        </SectionCard>

        {/* ─── Danger Zone ─── */}
        <div className="bg-card rounded-2xl border border-destructive/30 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b border-destructive/20 bg-destructive/5">
            <div className="w-8 h-8 bg-destructive/10 text-destructive rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 className="font-display font-black text-sm text-destructive">Danger Zone</h2>
          </div>
          <div className="p-4 space-y-2.5">
            <p className="text-xs text-muted-foreground font-semibold">These actions affect the live site. Use with extreme caution.</p>
            <Button
              variant="outline"
              className="w-full h-10 rounded-xl font-bold text-xs border-destructive/20 text-destructive hover:bg-destructive/10"
              onClick={clearAnnouncement}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Clear All Announcements
            </Button>
            <div className="text-[9px] text-muted-foreground font-semibold px-1">
              Clearing announcements removes the banner from all pages immediately.
            </div>
          </div>
        </div>

      </div>
      <AdminNavBar />
    </div>
  );
}
