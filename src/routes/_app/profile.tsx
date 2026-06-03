import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import Cropper from "react-easy-crop";
import {
  Trophy, Edit3, Share2, Users, Bell, User, ChevronRight,
  Wallet, LogOut, ShieldAlert, MessageCircle, Settings, Star, Gamepad2,
  Phone, FileText, Upload, Target, TrendingUp, Swords, Activity,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../lib/auth-client";
import { useState, useEffect } from "react";
import { getProfile, updateProfile, uploadImage, getPlayerStats } from "../../api";
import { GodCoin } from "@/components/GodCoin";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useTheme } from "../../lib/theme";
import { Sun, Moon } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — CLUTCHGROUND" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>({
    matchesPlayed: 0,
    totalKills: 0,
    totalEarnings: 0,
    firstPlaces: 0,
    top3: 0,
    kdRatio: "0.00",
    winRate: 0,
    history: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ ign: "", uid: "", email: "", phone: "", avatar_url: "" });

  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const balance = user
    ? ((user as any).deposit_balance || 0) + ((user as any).winning_balance || 0)
    : 0;
  const depositBal = (user as any)?.deposit_balance || 0;
  const winBal = (user as any)?.winning_balance || 0;

  useEffect(() => {
    if (!authLoading && !user) { router.navigate({ to: "/login" }); return; }
    if (!user) return;
    (async () => {
      try {
        const [p, s] = await Promise.all([
          (getProfile as any)({ data: user.id }),
          (getPlayerStats as any)({ data: user.id }),
        ]);
        setProfile(p);
        setStats(s || {
          matchesPlayed: 0,
          totalKills: 0,
          totalEarnings: 0,
          firstPlaces: 0,
          top3: 0,
          kdRatio: "0.00",
          winRate: 0,
          history: [],
        });
        setForm({ ign: p?.ign || "", uid: p?.uid || "", email: p?.email || "", phone: p?.phone || "", avatar_url: p?.avatar_url || "" });
      } catch (err) {
        console.error("Failed to load profile data:", err);
      }
      setLoading(false);
    })();
  }, [user, authLoading]);

  const handleSave = async () => {
    try {
      await (updateProfile as any)({ data: { userId: user.id, ...form } });
      setProfile({ ...profile, ...form });
      setIsEditing(false);
      toast.success("Profile updated!");
    } catch (err: any) { toast.error(err.message || "Failed to update"); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setCropSrc(ev.target?.result as string); setIsCropping(true); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const applyCrop = async () => {
    try {
      const image = new Image();
      image.src = cropSrc!;
      await new Promise(r => (image.onload = r));
      const canvas = document.createElement("canvas");
      canvas.width = 256; canvas.height = 256;
      canvas.getContext("2d")?.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, 256, 256);
      const base64 = canvas.toDataURL("image/jpeg", 0.7);
      setIsCropping(false); setCropSrc(null);
      // Upload to Cloudinary
      setUploadingAvatar(true);
      toast.loading("Uploading photo...", { id: "avatar-upload" });
      try {
        const result = await (uploadImage as any)({ data: { base64, folder: "clutchground/avatars" } });
        setForm(f => ({ ...f, avatar_url: result.url }));
        toast.success("Photo uploaded to Cloudinary!", { id: "avatar-upload" });
      } catch {
        // Cloudinary not configured yet — fall back to base64 preview
        setForm(f => ({ ...f, avatar_url: base64 }));
        toast.dismiss("avatar-upload");
      }
      setUploadingAvatar(false);
    } catch { toast.error("Failed to crop image"); }
  };

  if (loading || authLoading) {
    return <div className="h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>;
  }
  if (!user) return null;

  const initials = profile?.ign?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-background pb-[80px]">
      {/* ── Hero card ── */}
      <div className="relative px-4 pt-6 pb-4">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 blur-3xl rounded-full pointer-events-none opacity-20"
          style={{ background: "var(--primary)" }} />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-card rounded-3xl border border-border p-5 shadow-card"
        >
          {/* Edit button */}
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-4 right-4 w-9 h-9 rounded-2xl bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all press-effect active:scale-90"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 shrink-0"
              style={{ borderColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center font-display font-black text-2xl text-white"
                    style={{ background: "var(--gradient-primary)" }}>{initials}</div>
              }
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="font-display font-black text-lg text-foreground leading-tight truncate">
                {profile?.ign || user.username}
              </h1>
              <p className="text-xs text-muted-foreground font-mono font-semibold mt-0.5">@{user.username}</p>
              {profile?.uid && (
                <div className="flex items-center gap-1 mt-1">
                  <Gamepad2 className="w-3 h-3" style={{ color: "var(--primary)" }} />
                  <span className="text-[10px] font-black font-mono" style={{ color: "var(--primary)" }}>UID: {profile.uid}</span>
                </div>
              )}
            </div>
          </div>

          {/* Balance row */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Total</span>
              <span className="font-display font-black text-base text-foreground flex items-center gap-1">
                <GodCoin className="w-3.5 h-3.5" />{balance}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5 border-x border-border">
              <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Deposit</span>
              <span className="font-display font-black text-sm text-emerald-400">{depositBal}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Winnings</span>
              <span className="font-display font-black text-sm" style={{ color: "var(--primary)" }}>{winBal}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Gamer Statistics Dashboard ── */}
      <div className="px-4 mb-6">
        <p className="text-[10px] font-black uppercase tracking-widest mb-3 ml-1 text-muted-foreground">
          Gamer Statistics
        </p>
        
        {/* Stat Cards Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            {
              label: "Matches Played",
              value: stats.matchesPlayed,
              icon: Gamepad2,
              color: "text-sky-400",
              bg: "bg-sky-400/10",
            },
            {
              label: "Total Kills",
              value: stats.totalKills,
              icon: Swords,
              color: "text-amber-500",
              bg: "bg-amber-500/10",
            },
            {
              label: "Kill/Death Ratio",
              value: stats.kdRatio,
              icon: Target,
              color: "text-primary",
              bg: "bg-primary/10",
            },
            {
              label: "Win Rate",
              value: `${stats.winRate}%`,
              icon: Trophy,
              color: "text-emerald-400",
              bg: "bg-emerald-400/10",
            },
          ].map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-3 shadow-sm"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">{item.label}</p>
                <p className="text-lg font-display font-black text-foreground mt-0.5 leading-none">{item.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Performance Chart Panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border/50 rounded-3xl p-5 shadow-card overflow-hidden relative"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-black text-xs uppercase tracking-wider text-foreground">
                Kills & Earnings Trend
              </h3>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                Last 10 Tournaments
              </p>
            </div>
            <Activity className="w-4 h-4 text-primary animate-pulse" />
          </div>

          {stats.history.length === 0 ? (
            <div className="h-[140px] flex flex-col items-center justify-center text-center">
              <p className="text-xs font-bold text-muted-foreground">No matches played yet.</p>
              <Link to="/tournaments" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline mt-2">
                Join a Battle Now &rarr;
              </Link>
            </div>
          ) : (
            <div className="h-[140px] w-full mt-2 font-mono text-[9px] font-bold">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats.history}
                  margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorKills" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorPrize" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--gold)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--gold)" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis 
                    dataKey="tournament_title" 
                    stroke="rgba(255,255,255,0.25)" 
                    tickLine={false}
                    tickFormatter={(val) => val?.substring(0, 8) + '...'}
                  />
                  <YAxis stroke="rgba(255,255,255,0.25)" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(13, 20, 32, 0.95)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "10px"
                    }}
                    labelFormatter={(label, items) => {
                      const item = items?.[0]?.payload;
                      return item ? `${item.tournament_title}` : label;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="kills"
                    name="Kills"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorKills)"
                  />
                  <Area
                    type="monotone"
                    dataKey="awarded_prize"
                    name="Won Coins"
                    stroke="var(--gold)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPrize)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Menu Sections ── */}
      <div className="px-4 space-y-5 mt-2">
        {/* Account */}
        <MenuSection label="Account">
          <MenuItem icon={Wallet}  iconBg="rgba(16,185,129,0.12)"  iconColor="#10b981" label="Wallet & Balance" to="/wallet"
            right={<span className="text-xs font-black flex items-center gap-1" style={{ color: "var(--primary)" }}><GodCoin className="w-3 h-3" />{balance}</span>} />
          <MenuItem icon={Users}   iconBg="rgba(167,139,250,0.12)" iconColor="#a78bfa" label="Squad Management" to="/teams" />
          <MenuItem icon={Trophy}  iconBg="rgba(255,107,0,0.12)"   iconColor="var(--fire)" label="Match History" to="/matches" />
        </MenuSection>

        {/* Settings */}
        <MenuSection label="Settings">
          <MenuItem icon={Bell}    iconBg="rgba(139,92,246,0.12)"  iconColor="#8b5cf6" label="Notifications"   to="/notifications" />
          <MenuItem icon={MessageCircle} iconBg="rgba(236,72,153,0.12)" iconColor="#ec4899" label="Help & Support" to={"/support" as any} />
          <MenuItem icon={Phone}   iconBg="rgba(96,165,250,0.12)"  iconColor="#60a5fa" label="Contact Us"       to="/contact" />
          <MenuItem icon={FileText} iconBg="rgba(251,191,36,0.12)"  iconColor="#fbbf24" label="Terms & Conditions" to="/terms" />

          {/* Theme toggle as menu item */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-0 active:bg-secondary/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(0,200,255,0.12)", color: "var(--primary)" }}>
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </div>
            <span className="flex-1 text-sm font-bold text-foreground text-left">
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
            <span className="text-[10px] font-black px-2 py-1 rounded-full border"
              style={{ color: "var(--primary)", borderColor: "var(--primary)", background: "rgba(0,200,255,0.08)" }}>
              {theme === "dark" ? "OFF" : "ON"}
            </span>
          </button>

          <button
            onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success("Link copied!"); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-secondary/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(14,165,233,0.12)", color: "#0ea5e9" }}>
              <Share2 className="w-4 h-4" />
            </div>
            <span className="flex-1 text-sm font-bold text-foreground text-left">Share Profile</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </MenuSection>

        {/* Admin */}
        {(user as any).role === "admin" && (
          <MenuSection label="Administration" labelColor="var(--fire)">
            <MenuItem icon={ShieldAlert} iconBg="rgba(239,68,68,0.12)" iconColor="#ef4444" label="Admin Panel" to="/admin" />
          </MenuSection>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-black text-sm uppercase tracking-widest text-red-500 border border-red-500/20 bg-red-500/8 press-effect active:scale-95 transition-all"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* ── Edit Profile Dialog ── */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-xl text-foreground">Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Avatar picker */}
            <div className="flex justify-center">
              <label className="relative w-20 h-20 rounded-2xl overflow-hidden cursor-pointer border-2"
                style={{ borderColor: "var(--primary)" }}>
                {form.avatar_url
                  ? <img src={form.avatar_url} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
                    <User className="w-8 h-8 text-white" /></div>}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-white" />
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            {[
              { label: "IGN", key: "ign", placeholder: "In-Game Name" },
              { label: "Free Fire UID", key: "uid", placeholder: "Your UID" },
              { label: "Email", key: "email", placeholder: "Email address" },
              { label: "Phone", key: "phone", placeholder: "Phone number" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">{label}</label>
                <input
                  placeholder={placeholder}
                  value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full h-12 bg-secondary border border-border focus:border-primary/60 rounded-2xl px-4 text-sm font-semibold text-foreground outline-none transition-all"
                />
              </div>
            ))}
            <button onClick={handleSave}
              className="w-full h-12 rounded-2xl font-black text-sm uppercase tracking-widest text-white press-effect active:scale-95 mt-2"
              style={{ background: "var(--gradient-cta)" }}>
              Save Changes
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Crop dialog */}
      <Dialog open={isCropping} onOpenChange={setIsCropping}>
        <DialogContent className="max-w-[90vw] w-[400px] rounded-3xl border border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-lg text-foreground">Crop Photo</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-56 bg-black rounded-2xl overflow-hidden mt-2">
            {cropSrc && <Cropper image={cropSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false}
              onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, px) => setCroppedAreaPixels(px)} />}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs text-muted-foreground font-bold">1x</span>
            <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={e => setZoom(Number(e.target.value))}
              className="flex-1 accent-primary" />
            <span className="text-xs text-muted-foreground font-bold">3x</span>
          </div>
          <button onClick={applyCrop} disabled={uploadingAvatar}
            className="w-full h-12 rounded-2xl font-black text-sm text-white mt-3 press-effect active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "var(--gradient-cta)" }}>
            {uploadingAvatar ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Uploading...</> : <>Apply &amp; Upload</>}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MenuSection({ label, children, labelColor }: { label: string; children: React.ReactNode; labelColor?: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest mb-2 ml-1" style={{ color: labelColor || "var(--muted-foreground)" }}>{label}</p>
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-card divide-y divide-border">
        {children}
      </div>
    </div>
  );
}

function MenuItem({ icon: Icon, iconBg, iconColor, label, to, right }: {
  icon: any; iconBg: string; iconColor: string; label: string; to: string; right?: React.ReactNode;
}) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3.5 active:bg-secondary/50 transition-colors">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg, color: iconColor }}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="flex-1 text-sm font-bold text-foreground">{label}</span>
      {right || <ChevronRight className="w-4 h-4 text-muted-foreground" />}
    </Link>
  );
}
