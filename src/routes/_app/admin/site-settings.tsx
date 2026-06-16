import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Settings,
  Bell,
  CreditCard,
  AlertTriangle,
  Save,
  X,
  Shield,
  Megaphone,
  ArrowLeft,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Image,
  Plus,
  Edit,
  Send,
  Instagram,
  Trophy,
  Clock,
} from "lucide-react";
import { useAuth } from "../../../lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AdminNavBar } from "@/components/AdminNavBar";
import { motion } from "framer-motion";
import { getSiteSettings, saveSiteSetting, clearSiteSetting, uploadImage } from "../../../api";

export const Route = createFileRoute("/_app/admin/site-settings")({
  head: () => ({ meta: [{ title: "Site Settings — Admin" }] }),
  loader: async () => {
    try {
      return await getSiteSettings();
    } catch {
      return {};
    }
  },
  component: AdminSiteSettingsPage,
});

function SectionCard({
  title,
  icon: Icon,
  color,
  bg,
  children,
}: {
  title: string;
  icon: any;
  color: string;
  bg: string;
  children: React.ReactNode;
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

function InputField({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-[9px] uppercase tracking-widest font-black text-muted-foreground mb-1.5">
        {label}
      </label>
      <input
        {...props}
        className="w-full h-11 bg-secondary/50 border border-border focus:border-primary outline-none px-4 text-sm rounded-xl font-semibold transition-all"
      />
    </div>
  );
}

function AdminSiteSettingsPage() {
  const initialSettings = Route.useLoaderData() as Record<string, string>;
  const { user, loading } = useAuth();
  const router = useRouter();

  // Announcement
  const [announcement, setAnnouncement] = useState(initialSettings.announcement || "");
  const [savedAnnouncement, setSavedAnnouncement] = useState(initialSettings.announcement || "");

  // Leaderboard Config
  const [leaderboardPrize, setLeaderboardPrize] = useState(
    initialSettings.leaderboard_prize || "500",
  );

  // UPI config
  const [upiId, setUpiId] = useState(() => {
    try {
      const upiCfg = JSON.parse(initialSettings.upi_config || "{}");
      return upiCfg.upiId || "";
    } catch {
      return "";
    }
  });
  const [upiName, setUpiName] = useState(() => {
    try {
      const upiCfg = JSON.parse(initialSettings.upi_config || "{}");
      return upiCfg.upiName || "";
    } catch {
      return "";
    }
  });
  const [minDeposit, setMinDeposit] = useState(() => {
    try {
      const upiCfg = JSON.parse(initialSettings.upi_config || "{}");
      return upiCfg.minDeposit || "50";
    } catch {
      return "50";
    }
  });
  const [maxDeposit, setMaxDeposit] = useState(() => {
    try {
      const upiCfg = JSON.parse(initialSettings.upi_config || "{}");
      return upiCfg.maxDeposit || "10000";
    } catch {
      return "10000";
    }
  });

  // Maintenance
  const [maintenance, setMaintenance] = useState(initialSettings.maintenance_mode === "true");

  // Deposit Timings
  const [depositStartTime, setDepositStartTime] = useState(
    initialSettings.deposit_start_time || "09:00",
  );
  const [depositEndTime, setDepositEndTime] = useState(initialSettings.deposit_end_time || "22:00");

  // Hero Banners
  const [heroBanners, setHeroBanners] = useState<string[]>(() => {
    try {
      if (initialSettings.hero_banners) {
        return JSON.parse(initialSettings.hero_banners);
      }
    } catch {}
    return [
      "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1780319414/clutchground/placeholders/zvdpuk7j7e4dgxax5h2b.png",
    ];
  });
  const [newBannerUrl, setNewBannerUrl] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingUrl, setEditingUrl] = useState("");

  // Social Links
  const [socialWhatsapp, setSocialWhatsapp] = useState(() => {
    try {
      const socialCfg = JSON.parse(initialSettings.social_links || "{}");
      return socialCfg.whatsapp || "https://whatsapp.com/channel/0029Vb8GIynDp2Q21617we1s";
    } catch {
      return "https://whatsapp.com/channel/0029Vb8GIynDp2Q21617we1s";
    }
  });
  const [socialDiscord, setSocialDiscord] = useState(() => {
    try {
      const socialCfg = JSON.parse(initialSettings.social_links || "{}");
      return socialCfg.discord || "https://discord.gg/uYXFJswHdg";
    } catch {
      return "https://discord.gg/uYXFJswHdg";
    }
  });
  const [socialTelegram, setSocialTelegram] = useState(() => {
    try {
      const socialCfg = JSON.parse(initialSettings.social_links || "{}");
      return socialCfg.telegram || "https://t.me/clutchground";
    } catch {
      return "https://t.me/clutchground";
    }
  });
  const [socialEmail, setSocialEmail] = useState(() => {
    try {
      const socialCfg = JSON.parse(initialSettings.social_links || "{}");
      return socialCfg.email || "clutchgroundofficial@gmail.com";
    } catch {
      return "clutchgroundofficial@gmail.com";
    }
  });
  const [socialInstagram, setSocialInstagram] = useState(() => {
    try {
      const socialCfg = JSON.parse(initialSettings.social_links || "{}");
      return socialCfg.instagram || "https://instagram.com/clutchground";
    } catch {
      return "https://instagram.com/clutchground";
    }
  });

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <Shield className="w-10 h-10 text-destructive mb-4" />
        <h1 className="text-2xl font-display font-black text-foreground mb-4">Access Denied</h1>
        <Link to="/login">
          <Button className="bg-primary text-white rounded-xl font-bold h-12 px-8">
            Return to Login
          </Button>
        </Link>
      </div>
    );
  }

  const saveAnnouncement = async () => {
    try {
      await (saveSiteSetting as any)({ data: { key: "announcement", value: announcement } });
      setSavedAnnouncement(announcement);
      toast.success("Announcement saved to database!");
      await router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to save announcement");
    }
  };

  const clearAnnouncement = async () => {
    try {
      await (clearSiteSetting as any)({ data: { key: "announcement" } });
      setAnnouncement("");
      setSavedAnnouncement("");
      toast.success("Announcement cleared from database.");
      await router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to clear announcement");
    }
  };

  const saveUpiConfig = async () => {
    if (!upiId.trim()) return toast.error("UPI ID is required.");
    try {
      await (saveSiteSetting as any)({
        data: {
          key: "upi_config",
          value: JSON.stringify({ upiId, upiName, minDeposit, maxDeposit }),
        },
      });
      toast.success("UPI config saved to database!");
      await router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to save UPI config");
    }
  };

  const saveLeaderboardConfig = async () => {
    const prizeVal = Number(leaderboardPrize);
    if (Number.isNaN(prizeVal) || prizeVal < 0) {
      return toast.error("Please enter a valid reward amount.");
    }
    try {
      await (saveSiteSetting as any)({
        data: {
          key: "leaderboard_prize",
          value: String(prizeVal),
        },
      });
      toast.success("Leaderboard settings saved successfully!");
      await router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to save leaderboard settings");
    }
  };

  const saveDepositHours = async () => {
    try {
      await Promise.all([
        (saveSiteSetting as any)({ data: { key: "deposit_start_time", value: depositStartTime } }),
        (saveSiteSetting as any)({ data: { key: "deposit_end_time", value: depositEndTime } }),
      ]);
      toast.success("Deposit timings saved successfully!");
      await router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to save deposit timings");
    }
  };

  const toggleMaintenance = async () => {
    const newVal = !maintenance;
    try {
      await (saveSiteSetting as any)({
        data: { key: "maintenance_mode", value: String(newVal) },
      });
      setMaintenance(newVal);
      toast.success(newVal ? "Maintenance mode ON" : "Maintenance mode OFF");
      await router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to toggle maintenance mode");
    }
  };

  const addHeroBanner = () => {
    if (!newBannerUrl.trim()) return toast.error("Please enter a valid banner URL.");
    setHeroBanners([...heroBanners, newBannerUrl.trim()]);
    setNewBannerUrl("");
    toast.success("Banner added to list. Remember to save changes!");
  };

  const removeHeroBanner = (index: number) => {
    const updated = heroBanners.filter((_, idx) => idx !== index);
    setHeroBanners(updated);
    toast.success("Banner removed from list. Remember to save changes!");
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingUrl(heroBanners[index]);
  };

  const saveEdit = (index: number) => {
    if (!editingUrl.trim()) return toast.error("URL cannot be empty.");
    const updated = [...heroBanners];
    updated[index] = editingUrl.trim();
    setHeroBanners(updated);
    setEditingIndex(null);
    setEditingUrl("");
    toast.success("Banner URL updated in list. Remember to save changes!");
  };

  const saveHeroBanners = async () => {
    try {
      await (saveSiteSetting as any)({
        data: {
          key: "hero_banners",
          value: JSON.stringify(heroBanners),
        },
      });
      toast.success("Hero banners successfully saved to database!");
      await router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to save hero banners");
    }
  };

  const saveSocialLinksConfig = async () => {
    try {
      await (saveSiteSetting as any)({
        data: {
          key: "social_links",
          value: JSON.stringify({
            whatsapp: socialWhatsapp,
            discord: socialDiscord,
            telegram: socialTelegram,
            email: socialEmail,
            instagram: socialInstagram,
          }),
        },
      });
      toast.success("Social & Contact links saved to database!");
      await router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Failed to save links");
    }
  };

  return (
    <div className="bg-background min-h-screen pb-2">
      {/* Header */}
      <div className="bg-card border-b border-border pt-6 pb-5 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground mb-4 bg-secondary/50 px-3 py-1.5 rounded-full transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-black text-foreground">Site Settings</h1>
            <p className="text-xs text-muted-foreground font-semibold">
              Global platform configuration
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4 max-w-2xl mx-auto">
        {/* ─── Announcement Banner ─── */}
        <SectionCard
          title="Announcement Banner"
          icon={Megaphone}
          color="text-amber-500"
          bg="bg-amber-500/10"
        >
          <div className="space-y-3">
            <div>
              <label className="block text-[9px] uppercase tracking-widest font-black text-muted-foreground mb-1.5">
                Banner Message
              </label>
              <textarea
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="e.g. ⚠️ Server maintenance tonight at 11 PM IST"
                rows={3}
                className="w-full bg-secondary/50 border border-border focus:border-primary outline-none px-4 py-3 text-sm rounded-xl font-semibold transition-all resize-none"
              />
            </div>

            {savedAnnouncement && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5">
                <Bell className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-amber-600 mb-0.5">
                    Live Banner
                  </div>
                  <p className="text-xs font-semibold text-foreground">{savedAnnouncement}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1 h-10 rounded-xl font-bold text-xs bg-primary text-white"
                onClick={saveAnnouncement}
              >
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save Banner
              </Button>
              {savedAnnouncement && (
                <Button
                  variant="outline"
                  className="h-10 rounded-xl font-bold text-xs border-border text-muted-foreground"
                  onClick={clearAnnouncement}
                >
                  <X className="w-3.5 h-3.5 mr-1" /> Clear
                </Button>
              )}
            </div>
          </div>
        </SectionCard>

        {/* ─── UPI Config ─── */}
        <SectionCard
          title="UPI Payment Details"
          icon={CreditCard}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        >
          <div className="space-y-3">
            <div className="text-xs text-emerald-600 font-semibold bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 flex items-center gap-2">
              ✅ Changes save directly to <strong>Supabase database</strong> and apply instantly to
              all users.
            </div>
            <InputField
              label="UPI ID"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="payments@clutchground"
            />
            <InputField
              label="Account / Business Name"
              value={upiName}
              onChange={(e) => setUpiName(e.target.value)}
              placeholder="CLUTCHGROUND Esports"
            />
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Min Deposit (₹)"
                type="number"
                value={minDeposit}
                onChange={(e) => setMinDeposit(e.target.value)}
                placeholder="50"
              />
              <InputField
                label="Max Deposit (₹)"
                type="number"
                value={maxDeposit}
                onChange={(e) => setMaxDeposit(e.target.value)}
                placeholder="10000"
              />
            </div>
            {upiId && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-xs font-semibold">
                <div className="text-[9px] uppercase tracking-widest font-black text-emerald-600 mb-1.5">
                  Current Config Preview
                </div>
                <div className="space-y-1 text-muted-foreground">
                  <div>
                    <span className="text-foreground font-bold">UPI:</span> {upiId}
                  </div>
                  {upiName && (
                    <div>
                      <span className="text-foreground font-bold">Name:</span> {upiName}
                    </div>
                  )}
                  <div>
                    <span className="text-foreground font-bold">Range:</span> ₹{minDeposit} — ₹
                    {maxDeposit}
                  </div>
                </div>
              </div>
            )}
            <Button
              className="w-full h-10 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={saveUpiConfig}
            >
              <Save className="w-3.5 h-3.5 mr-1.5" /> Save UPI Config
            </Button>
          </div>
        </SectionCard>

        {/* ─── Deposit Hours Timing ─── */}
        <SectionCard
          title="Deposit Timing Hours"
          icon={Clock}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        >
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground font-semibold">
              Set the timings during which users are allowed to deposit money (IST hours).
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] uppercase tracking-widest font-black text-muted-foreground mb-1.5">
                  Start Time
                </label>
                <input
                  type="time"
                  value={depositStartTime}
                  onChange={(e) => setDepositStartTime(e.target.value)}
                  className="w-full h-11 bg-secondary/50 border border-border focus:border-primary outline-none px-4 text-sm rounded-xl font-semibold transition-all"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-widest font-black text-muted-foreground mb-1.5">
                  End Time
                </label>
                <input
                  type="time"
                  value={depositEndTime}
                  onChange={(e) => setDepositEndTime(e.target.value)}
                  className="w-full h-11 bg-secondary/50 border border-border focus:border-primary outline-none px-4 text-sm rounded-xl font-semibold transition-all"
                />
              </div>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-xs font-semibold">
              <div className="text-[9px] uppercase tracking-widest font-black text-emerald-600 mb-1.5">
                Allowed Window
              </div>
              <div className="text-muted-foreground">
                Users can deposit from{" "}
                <strong className="text-foreground">
                  {(() => {
                    const [h, m] = depositStartTime.split(":").map(Number);
                    const ampm = h >= 12 ? "PM" : "AM";
                    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
                  })()}
                </strong>{" "}
                to{" "}
                <strong className="text-foreground">
                  {(() => {
                    const [h, m] = depositEndTime.split(":").map(Number);
                    const ampm = h >= 12 ? "PM" : "AM";
                    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
                  })()}
                </strong>{" "}
                IST.
              </div>
            </div>
            <Button
              className="w-full h-10 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={saveDepositHours}
            >
              <Save className="w-3.5 h-3.5 mr-1.5" /> Save Deposit Hours
            </Button>
          </div>
        </SectionCard>

        {/* ─── Leaderboard Config ─── */}
        <SectionCard
          title="Leaderboard Championship Reward"
          icon={Trophy}
          color="text-amber-500"
          bg="bg-amber-500/10"
        >
          <div className="space-y-3">
            <div className="text-xs text-amber-600 font-semibold bg-amber-500/10 rounded-xl p-3 border border-amber-500/20 flex items-center gap-2">
              🏆 Modify the reward coins paid to the weekly #1 leader.
            </div>
            <InputField
              label="Championship Reward (CG Coins)"
              type="number"
              min="0"
              value={leaderboardPrize}
              onChange={(e) => setLeaderboardPrize(e.target.value)}
              placeholder="500"
            />
            <Button
              className="w-full h-10 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white"
              onClick={saveLeaderboardConfig}
            >
              <Save className="w-3.5 h-3.5 mr-1.5" /> Save Leaderboard Settings
            </Button>
          </div>
        </SectionCard>

        {/* ─── Hero Banners ─── */}
        <SectionCard title="Hero Banners" icon={Image} color="text-blue-500" bg="bg-blue-500/10">
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground font-semibold">
              Manage the background images displayed in the main homepage hero section. If multiple
              banners exist, they will automatically cycle every 3 seconds.
            </p>

            {/* List of current banners */}
            <div className="space-y-2">
              <label className="block text-[9px] uppercase tracking-widest font-black text-muted-foreground">
                Active Banners ({heroBanners.length})
              </label>
              {heroBanners.length === 0 ? (
                <div className="text-center py-6 bg-secondary/20 rounded-xl border border-border/50 text-xs text-muted-foreground font-semibold">
                  No active banners. Click add below.
                </div>
              ) : (
                <div className="space-y-2">
                  {heroBanners.map((url, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col gap-2 p-3 bg-secondary/35 rounded-xl border border-border/50"
                    >
                      {editingIndex === idx ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editingUrl}
                            onChange={(e) => setEditingUrl(e.target.value)}
                            className="flex-1 bg-background/50 border border-border focus:border-primary outline-none px-3 py-1.5 text-xs rounded-lg font-semibold"
                            placeholder="Image URL"
                          />
                          <Button
                            className="h-8 px-3 rounded-lg font-bold text-xs bg-emerald-500 text-white"
                            onClick={() => saveEdit(idx)}
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            className="h-8 px-3 rounded-lg font-bold text-xs border-border"
                            onClick={() => setEditingIndex(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <img
                              src={url}
                              alt={`Banner ${idx}`}
                              className="w-16 h-10 rounded-lg object-cover shrink-0 bg-black/40 border border-border"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://res.cloudinary.com/dkjt9m4d0/image/upload/v1780319414/clutchground/placeholders/zvdpuk7j7e4dgxax5h2b.png";
                              }}
                            />
                            <span className="text-xs font-mono font-semibold text-foreground truncate">
                              {url}
                            </span>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => startEditing(idx)}
                              className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => removeHeroBanner(idx)}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add new banner */}
            <div className="bg-secondary/20 rounded-xl p-3 border border-border/50 space-y-3">
              <label className="block text-[9px] uppercase tracking-widest font-black text-muted-foreground">
                Add New Banner
              </label>

              <div className="flex flex-col gap-2">
                {/* File Upload Button */}
                <label className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-dashed border-border hover:border-primary/60 bg-secondary/40 cursor-pointer text-xs font-bold text-muted-foreground hover:text-foreground transition-all">
                  <Plus className="w-4 h-4 text-primary" />
                  <span>Choose Photo from Device</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const toastId = toast.loading("Processing image...");
                      try {
                        const reader = new FileReader();
                        reader.onload = async (ev) => {
                          const img = new window.Image();
                          img.src = ev.target?.result as string;
                          img.onload = () => {
                            const canvas = document.createElement("canvas");
                            // Scale down to max 1200 width to keep size small
                            const MAX_WIDTH = 1200;
                            let width = img.width;
                            let height = img.height;
                            if (width > MAX_WIDTH) {
                              height = Math.round((height * MAX_WIDTH) / width);
                              width = MAX_WIDTH;
                            }
                            canvas.width = width;
                            canvas.height = height;

                            const context = canvas.getContext("2d");
                            context?.drawImage(img, 0, 0, width, height);
                            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.75);

                            (uploadImage as any)({
                              data: { base64: compressedDataUrl, folder: "clutchground/banners" },
                            })
                              .then((res: any) => {
                                setHeroBanners([...heroBanners, res.url]);
                                toast.success(
                                  "Photo uploaded to Cloudinary! Click save below to persist.",
                                  { id: toastId },
                                );
                              })
                              .catch((err: any) => {
                                toast.error(err.message || "Failed to upload to Cloudinary", {
                                  id: toastId,
                                });
                              });
                          };
                        };
                        reader.readAsDataURL(file);
                      } catch {
                        toast.error("Failed to process image.", { id: toastId });
                      }
                      e.target.value = "";
                    }}
                  />
                </label>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-border/40"></div>
                  <span className="flex-shrink mx-3 text-[8px] font-black uppercase text-muted-foreground/60 tracking-wider">
                    or enter URL
                  </span>
                  <div className="flex-grow border-t border-border/40"></div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBannerUrl}
                    onChange={(e) => setNewBannerUrl(e.target.value)}
                    className="flex-1 bg-background/50 border border-border focus:border-primary outline-none px-3 py-2 text-xs rounded-lg font-semibold"
                    placeholder="e.g. /my-banner.jpg or https://image-url.png"
                  />
                  <Button
                    className="h-9 px-3 rounded-lg font-bold text-xs bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={addHeroBanner}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add URL
                  </Button>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <Button
              className="w-full h-10 rounded-xl font-bold text-xs bg-primary text-white"
              onClick={saveHeroBanners}
            >
              <Save className="w-3.5 h-3.5 mr-1.5" /> Save Banners to DB
            </Button>
          </div>
        </SectionCard>

        {/* ─── Social & Contact Links ─── */}
        <SectionCard
          title="Social & Contact Links"
          icon={Send}
          color="text-sky-500"
          bg="bg-sky-500/10"
        >
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-semibold">
              Manage redirect links for WhatsApp, Discord, Telegram, and Email contact points.
            </p>
            <InputField
              label="WhatsApp URL"
              value={socialWhatsapp}
              onChange={(e) => setSocialWhatsapp(e.target.value)}
              placeholder="https://whatsapp.com/channel/..."
            />
            <InputField
              label="Discord Invite URL"
              value={socialDiscord}
              onChange={(e) => setSocialDiscord(e.target.value)}
              placeholder="https://discord.gg/..."
            />
            <InputField
              label="Telegram URL / Username"
              value={socialTelegram}
              onChange={(e) => setSocialTelegram(e.target.value)}
              placeholder="https://t.me/... or @username"
            />
            <InputField
              label="Contact Email Address"
              value={socialEmail}
              onChange={(e) => setSocialEmail(e.target.value)}
              placeholder="support@clutchground.com"
            />
            <InputField
              label="Instagram URL / Username"
              value={socialInstagram}
              onChange={(e) => setSocialInstagram(e.target.value)}
              placeholder="https://instagram.com/... or username"
            />

            <Button
              className="w-full h-10 rounded-xl font-bold text-xs bg-sky-500 hover:bg-sky-600 text-white"
              onClick={saveSocialLinksConfig}
            >
              <Save className="w-3.5 h-3.5 mr-1.5" /> Save Social Links
            </Button>
          </div>
        </SectionCard>

        {/* ─── Maintenance Mode ─── */}
        <SectionCard
          title="Maintenance Mode"
          icon={Shield}
          color="text-purple-500"
          bg="bg-purple-500/10"
        >
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-semibold">
              When ON, display a maintenance banner to users. The site remains accessible — this is
              a visual indicator only.
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
                {maintenance ? (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                ) : (
                  <Shield className="w-5 h-5 text-emerald-500" />
                )}
                <div className="text-left">
                  <div
                    className={`font-display font-black text-sm ${maintenance ? "text-red-500" : "text-emerald-600"}`}
                  >
                    {maintenance ? "Maintenance Mode: ON" : "Maintenance Mode: OFF"}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-semibold">
                    {maintenance ? "Users see a maintenance warning" : "Site is operating normally"}
                  </div>
                </div>
              </div>
              {maintenance ? (
                <ToggleRight className="w-7 h-7 text-red-500" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-muted-foreground" />
              )}
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
            <p className="text-xs text-muted-foreground font-semibold">
              These actions affect the live site. Use with extreme caution.
            </p>
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
