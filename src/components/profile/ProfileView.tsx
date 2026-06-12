import { Link } from "@tanstack/react-router";
import Cropper from "react-easy-crop";
import { useState, useEffect, useRef } from "react";
import {
  Camera, Edit3, Gamepad2, Share2, Sparkles, Trophy, Users, Upload,
  Target, Flame, ChevronRight, Check, Swords, Award, Shield, Crown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { GodCoin } from "@/components/GodCoin";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ACHIEVEMENT_DEFS,
  ANIMATION_CLASS,
  BANNER_GRADIENTS,
  FRAME_CLASS,
  type ProfileShopConfig,
} from "@/lib/profile-customization";
import { updateProfile, uploadImage } from "@/api";
import { ProfileEffectRenderer } from "@/components/profile/ProfileEffectRenderer";

type ProfileViewProps = {
  profile: any;
  isOwner: boolean;
  onUpdated?: (profile: any) => void;
};

/* ── Animated number counter ── */
function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    if (diff === 0) { setDisplay(value); return; }
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = Math.round(start + diff * eased);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(tick);
      else ref.current = value;
    };
    requestAnimationFrame(tick);
  }, [value, duration]);

  return <>{display}</>;
}

/* ── Stagger container variants ── */
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.6 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};
const achievementContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.9 } },
};
const achievementItem = {
  hidden: { opacity: 0, scale: 0.5, rotate: -8 },
  show: { opacity: 1, scale: 1, rotate: 0, transition: { type: "spring" as const, stiffness: 400, damping: 20 } },
};

export function ProfileView({ profile, isOwner, onUpdated }: ProfileViewProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    ign: profile?.ign || "",
    uid: profile?.uid || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    avatar_url: profile?.avatar_url || "",
    banner_url: profile?.banner_url || "",
  });
  const [showcase, setShowcase] = useState<string[]>(profile?.showcase_achievements || []);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [cropTarget, setCropTarget] = useState<"avatar" | "banner">("avatar");
  const [uploading, setUploading] = useState(false);

  const initials = profile?.ign?.[0]?.toUpperCase() || profile?.username?.[0]?.toUpperCase() || "?";

  // Banner display logic — preset runs in the background of custom URL banner
  const bannerPreset = profile?.banner_preset || "default";
  const bannerClass = `profile-banner-${bannerPreset}`;

  const animClass = ANIMATION_CLASS[profile?.profile_frame || "none"] || "";
  const frameClass = FRAME_CLASS[profile?.profile_frame || "none"] || "";

  const handleSaveInfo = async () => {
    await (updateProfile as any)({
      data: {
        userId: profile.id,
        ...form,
        showcase_achievements: showcase,
      },
    });
    toast.success("Profile saved");
    setEditOpen(false);
    onUpdated?.({ ...profile, ...form, showcase_achievements: showcase });
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>, target: "avatar" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropSrc(ev.target?.result as string);
      setCropTarget(target);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const applyCrop = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const image = new Image();
      image.src = cropSrc;
      await new Promise((r) => (image.onload = r));
      const size = cropTarget === "avatar" ? 256 : 800;
      const h = cropTarget === "avatar" ? 256 : 320;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = h;
      canvas.getContext("2d")?.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        size,
        h,
      );
      const base64 = canvas.toDataURL("image/jpeg", 0.82);
      const folder = cropTarget === "avatar" ? "clutchground/avatars" : "clutchground/banners";
      const result = await (uploadImage as any)({ data: { base64, folder } });

      // Build update payload
      const updatePayload: Record<string, any> = { userId: profile.id };
      const profilePatch: Record<string, any> = {};

      if (cropTarget === "avatar") {
        updatePayload.avatar_url = result.url;
        profilePatch.avatar_url = result.url;
        setForm((f) => ({ ...f, avatar_url: result.url }));
      } else {
        // Custom banner upload — keep currently equipped preset animation in the background
        updatePayload.banner_url = result.url;
        profilePatch.banner_url = result.url;
        setForm((f) => ({ ...f, banner_url: result.url }));
      }

      // Auto-save to server immediately
      await (updateProfile as any)({ data: { ...updatePayload, ign: profile.ign, uid: profile.uid, email: profile.email, phone: profile.phone } });

      // Update parent profile state so the banner/avatar shows right away
      onUpdated?.({ ...profile, ...profilePatch });

      setCropSrc(null);
      toast.success("Image saved!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };



  const toggleShowcase = (id: string) => {
    setShowcase((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) {
        toast.error("Max 4 achievements on profile");
        return prev;
      }
      return [...prev, id];
    });
  };

  const shareProfile = () => {
    const url = `${window.location.origin}/users/${profile.id}`;
    navigator.clipboard?.writeText(url);
    toast.success("Profile link copied!");
  };

  const statItems = [
    { label: "Matches", value: profile?.stats?.matchesPlayed ?? 0, icon: Gamepad2, color: "text-sky-400" },
    { label: "Kills", value: profile?.stats?.totalKills ?? 0, icon: Swords, color: "text-amber-500" },
    { label: "Wins", value: profile?.stats?.firstPlaces ?? 0, icon: Trophy, color: "text-emerald-400" },
    { label: "Earned", value: profile?.stats?.totalEarnings ?? 0, icon: Award, color: "text-primary", coin: true },
  ];

  return (
    <div className="pb-6">
      {/* ════════════ HERO BANNER — Full-bleed ════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 1.02 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden"
      >
        <ProfileEffectRenderer value={profile?.profile_effect} />
        {/* Banner image/gradient */}
        <div
          className={`h-48 sm:h-56 w-full relative overflow-hidden ${bannerClass}`}
        >
          {/* Custom banner image layer: slightly semi-transparent so preset animation in background shows through */}
          {profile?.banner_url && (
            <div
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-300"
              style={{
                backgroundImage: `url(${profile.banner_url})`,
                opacity: 0.85, // allow animated background gradient to shine through
              }}
            />
          )}

          {/* Gradient overlay fading to background */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, transparent 40%, var(--background) 100%)",
            }}
          />
          {/* Subtle noise texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />

          {isOwner && (
            <label className="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-black/50 backdrop-blur-md flex items-center justify-center cursor-pointer border border-white/15 hover:bg-black/70 transition-all hover:scale-105 active:scale-95 z-10">
              <Camera className="w-4.5 h-4.5 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImagePick(e, "banner")} />
            </label>
          )}
        </div>

        {/* ════════════ AVATAR — Overlapping banner ════════════ */}
        <div className="relative px-4 -mt-16 z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8, type: "spring", stiffness: 200, damping: 15 }}
            className="flex justify-center"
          >
            <div className={`relative w-28 h-28 rounded-full ${animClass}`}>
              <div
                className={`w-full h-full rounded-full overflow-hidden border-[5px] bg-card shadow-xl ${frameClass}`}
                style={{ borderColor: "var(--background)" }}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-display font-black text-4xl text-white" style={{ background: "var(--gradient-primary)" }}>
                    {initials}
                  </div>
                )}
              </div>
              {isOwner && (
                <label className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary flex items-center justify-center cursor-pointer border-[3px] shadow-lg hover:scale-110 transition-transform active:scale-95" style={{ borderColor: "var(--background)" }}>
                  <Camera className="w-4 h-4 text-primary-foreground" />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImagePick(e, "avatar")} />
                </label>
              )}
            </div>
          </motion.div>

          {/* ════════════ USERNAME + UID ════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mt-4"
          >
            <h1 className="font-display font-black text-2xl text-foreground profile-name-glow tracking-wide">
              {profile?.ign || profile?.username}
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-1 tracking-wider">@{profile?.username}</p>
            {profile?.uid && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.55, duration: 0.4 }}
                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20"
              >
                <Gamepad2 className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-black text-primary tracking-wider">UID {profile.uid}</span>
              </motion.div>
            )}
          </motion.div>

          {/* ════════════ ACTION BUTTONS ════════════ */}
          {isOwner && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="flex justify-center gap-2.5 mt-5"
            >
              {[
                { label: "Edit", icon: Edit3, onClick: () => setEditOpen(true) },
                { label: "Share", icon: Share2, onClick: shareProfile },
              ].map((btn) => (
                <Button
                  key={btn.label}
                  size="sm"
                  variant="outline"
                  className="rounded-full h-9 px-4 border-border/50 bg-card/50 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all duration-300 active:scale-95"
                  onClick={btn.onClick}
                >
                  <btn.icon className="w-3.5 h-3.5 mr-1.5" /> {btn.label}
                </Button>
              ))}
            </motion.div>
          )}

          {/* ════════════ ANIMATION SHOP CTA ════════════ */}
          {isOwner && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.4 }}
              className="mt-5 max-w-sm mx-auto"
            >
              <Link
                to="/profile-shop"
                className="flex items-center gap-3 w-full p-3 py-2.5 px-3.5 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-primary/5 hover:border-primary/40 transition-all press-effect group"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-display font-black text-xs text-foreground uppercase tracking-wider">Animation Shop</p>
                  <p className="text-[10px] text-muted-foreground font-semibold line-clamp-1">Equip epic profile animations</p>
                </div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest group-hover:translate-x-0.5 transition-transform shrink-0">Shop ›</span>
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ════════════ STATS STRIP — Glassmorphism ════════════ */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-4 gap-2 px-4 mt-6"
      >
        {statItems.map((s, idx) => (
          <motion.div
            key={s.label}
            variants={staggerItem}
            className="profile-stat-glass rounded-2xl p-3 text-center group cursor-default"
          >
            <s.icon className={`w-4 h-4 mx-auto mb-1.5 ${s.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
            <p className="text-[8px] uppercase font-black tracking-[0.15em] text-muted-foreground">{s.label}</p>
            <p className="font-display font-black text-base mt-0.5 flex items-center justify-center gap-0.5 text-foreground">
              {s.coin && <GodCoin className="w-3 h-3" />}
              <AnimatedNumber value={s.value} duration={1000 + idx * 200} />
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* ════════════ TEAM CARD ════════════ */}
      {profile?.team && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
          className="px-4 mt-5"
        >
          {isOwner ? (
            <Link
              to="/my-team"
              className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm press-effect group hover:border-primary/20 transition-all duration-300 relative overflow-hidden"
            >
              {/* Subtle gradient accent */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "linear-gradient(135deg, rgba(0,200,255,0.03), rgba(124,58,237,0.03))" }} />

              <div className="w-14 h-14 rounded-xl overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-black text-xl text-primary shrink-0 relative">
                {profile.team.logo ? (
                  <img src={profile.team.logo} alt="" className="w-full h-full object-cover" />
                ) : (
                  profile.team.name?.[0]
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-primary" />
                  <p className="text-[9px] uppercase font-black tracking-[0.2em] text-muted-foreground">Squad</p>
                </div>
                <p className="font-display font-black text-lg text-foreground truncate mt-0.5">{profile.team.name}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          ) : (
            <div className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm relative overflow-hidden">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-black text-xl text-primary shrink-0">
                {profile.team.logo ? (
                  <img src={profile.team.logo} alt="" className="w-full h-full object-cover" />
                ) : (
                  profile.team.name?.[0]
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-primary" />
                  <p className="text-[9px] uppercase font-black tracking-[0.2em] text-muted-foreground">Squad</p>
                </div>
                <p className="font-display font-black text-lg text-foreground truncate mt-0.5">{profile.team.name}</p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ════════════ ACHIEVEMENTS — Staggered pop-in ════════════ */}
      <div className="px-4 mt-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          className="flex items-center justify-between mb-3"
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Achievements</p>
          </div>
          {isOwner && <span className="text-[10px] text-muted-foreground font-semibold">Tap to showcase (max 4)</span>}
        </motion.div>
        <motion.div
          variants={achievementContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-2.5"
        >
          {(isOwner ? (profile?.achievements || []) : (profile?.showcase || [])).map((a: any, idx: number) => {
            const selected = showcase.includes(a.id);
            return (
              <motion.button
                key={a.id}
                variants={achievementItem}
                type="button"
                disabled={!isOwner}
                onClick={() => isOwner && toggleShowcase(a.id)}
                className={`text-left p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                  selected
                    ? "border-primary/40 bg-primary/8 shadow-[0_0_16px_rgba(0,200,255,0.08)]"
                    : "border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/20"
                } ${!isOwner ? "cursor-default" : "active:scale-[0.97]"}`}
              >
                {/* Subtle selected glow */}
                {selected && (
                  <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 30% 30%, rgba(0,200,255,0.15), transparent 70%)" }} />
                )}
                <span className="text-2xl block profile-emoji-pop">{a.emoji}</span>
                <p className="font-bold text-xs text-foreground mt-1.5 leading-tight">{a.label}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{a.description}</p>
                {isOwner && selected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
          {!(isOwner ? profile?.achievements : profile?.showcase)?.length && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="col-span-2 text-sm text-muted-foreground text-center py-8 font-semibold"
            >
              {isOwner ? "No achievements yet — play tournaments!" : "No showcased achievements"}
            </motion.p>
          )}
        </motion.div>
        {isOwner && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            <Button className="w-full mt-4 rounded-xl h-11 font-bold" variant="outline" onClick={handleSaveInfo}>
              <Check className="w-4 h-4 mr-2" /> Save showcased achievements
            </Button>
          </motion.div>
        )}
      </div>

      {/* ════════════ EDIT DIALOG ════════════ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-black">Edit profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {[
              { label: "IGN", key: "ign" },
              { label: "UID", key: "uid" },
              { label: "Email", key: "email" },
              { label: "Phone", key: "phone" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="text-[10px] font-bold uppercase text-muted-foreground">{label}</label>
                <input
                  className="w-full h-11 mt-1 rounded-xl border border-border bg-secondary/40 px-3 text-sm font-semibold"
                  value={(form as any)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
            <Button className="w-full rounded-xl font-bold" onClick={handleSaveInfo}>
              Save changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* ════════════ CROP DIALOG ════════════ */}
      <Dialog open={!!cropSrc} onOpenChange={() => setCropSrc(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Crop {cropTarget}</DialogTitle>
          </DialogHeader>
          <div className="relative h-56 bg-black rounded-xl overflow-hidden">
            {cropSrc && (
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={cropTarget === "avatar" ? 1 : 2.5}
                cropShape={cropTarget === "avatar" ? "round" : "rect"}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, px) => setCroppedAreaPixels(px)}
              />
            )}
          </div>
          <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full mt-3" />
          <Button className="w-full mt-3 rounded-xl" disabled={uploading} onClick={applyCrop}>
            {uploading ? "Uploading..." : "Apply"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
