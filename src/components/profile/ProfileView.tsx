import { Link } from "@tanstack/react-router";
import Cropper from "react-easy-crop";
import { useState, useEffect, useRef } from "react";
import {
  Camera,
  Edit3,
  Gamepad2,
  Share2,
  Sparkles,
  ChevronRight,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { GodCoin } from "@/components/GodCoin";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
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
      },
    });
    toast.success("Profile saved");
    setEditOpen(false);
    onUpdated?.({ ...profile, ...form });
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
      canvas
        .getContext("2d")
        ?.drawImage(
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
      await (updateProfile as any)({
        data: {
          ...updatePayload,
          ign: profile.ign,
          uid: profile.uid,
          email: profile.email,
          phone: profile.phone,
        },
      });

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

  const shareProfile = () => {
    const url = `${window.location.origin}/users/${profile.id}`;
    navigator.clipboard?.writeText(url);
    toast.success("Profile link copied!");
  };



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
        <div className={`h-48 sm:h-56 w-full relative overflow-hidden ${bannerClass}`}>
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
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImagePick(e, "banner")}
              />
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
                  <div
                    className="w-full h-full flex items-center justify-center font-display font-black text-4xl text-white"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    {initials}
                  </div>
                )}
              </div>
              {isOwner && (
                <label
                  className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary flex items-center justify-center cursor-pointer border-[3px] shadow-lg hover:scale-110 transition-transform active:scale-95"
                  style={{ borderColor: "var(--background)" }}
                >
                  <Camera className="w-4 h-4 text-primary-foreground" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImagePick(e, "avatar")}
                  />
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
            <p className="text-xs text-muted-foreground font-mono mt-1 tracking-wider">
              @{profile?.username}
            </p>
            {profile?.uid && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.55, duration: 0.4 }}
                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20"
              >
                <Gamepad2 className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-black text-primary tracking-wider">
                  UID {profile.uid}
                </span>
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
                  <p className="font-display font-black text-xs text-foreground uppercase tracking-wider">
                    Animation Shop
                  </p>
                  <p className="text-[10px] text-muted-foreground font-semibold line-clamp-1">
                    Equip epic profile animations
                  </p>
                </div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest group-hover:translate-x-0.5 transition-transform shrink-0">
                  Shop ›
                </span>
              </Link>
            </motion.div>
          )}
        </div>
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
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0,200,255,0.03), rgba(124,58,237,0.03))",
                }}
              />

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
                  <p className="text-[9px] uppercase font-black tracking-[0.2em] text-muted-foreground">
                    Squad
                  </p>
                </div>
                <p className="font-display font-black text-lg text-foreground truncate mt-0.5">
                  {profile.team.name}
                </p>
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
                  <p className="text-[9px] uppercase font-black tracking-[0.2em] text-muted-foreground">
                    Squad
                  </p>
                </div>
                <p className="font-display font-black text-lg text-foreground truncate mt-0.5">
                  {profile.team.name}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

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
                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                  {label}
                </label>
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
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full mt-3"
          />
          <Button className="w-full mt-3 rounded-xl" disabled={uploading} onClick={applyCrop}>
            {uploading ? "Uploading..." : "Apply"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
