import { Link } from "@tanstack/react-router";
import Cropper from "react-easy-crop";
import { useState } from "react";
import {
  Camera, Edit3, Gamepad2, Share2, Sparkles, Trophy, Users, Upload,
  Target, Flame, ChevronRight, Check,
} from "lucide-react";
import { motion } from "framer-motion";
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
import { getProfileShop, purchaseProfileCosmetic, updateProfile, uploadImage } from "@/api";

type ProfileViewProps = {
  profile: any;
  isOwner: boolean;
  onUpdated?: (profile: any) => void;
};

export function ProfileView({ profile, isOwner, onUpdated }: ProfileViewProps) {
  const [shop, setShop] = useState<ProfileShopConfig | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
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
  const bannerStyle = profile?.banner_url
    ? { backgroundImage: `url(${profile.banner_url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: BANNER_GRADIENTS[profile?.banner_preset || "default"] || BANNER_GRADIENTS.default };

  const animClass = ANIMATION_CLASS[profile?.profile_animation || "none"] || "";
  const frameClass = FRAME_CLASS[profile?.profile_frame || "none"] || "";
  const owned: string[] = profile?.owned_cosmetics || [];

  const openShop = async () => {
    const s = await getProfileShop();
    setShop(s as ProfileShopConfig);
    setShopOpen(true);
  };

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
      if (cropTarget === "avatar") setForm((f) => ({ ...f, avatar_url: result.url }));
      else setForm((f) => ({ ...f, banner_url: result.url }));
      setCropSrc(null);
      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const buyCosmetic = async (itemId: string) => {
    try {
      const res = await (purchaseProfileCosmetic as any)({ data: { userId: profile.id, itemId } });
      toast.success(`Equipped ${res.item.label}`);
      onUpdated?.(res.profile);
      setShopOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "Purchase failed");
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

  return (
    <div className="pb-6">
      {/* Banner + avatar hero */}
      <div className="relative mx-4 mt-4 rounded-3xl overflow-hidden border border-border shadow-card">
        <div className="h-36 sm:h-40 relative" style={bannerStyle}>
          {isOwner && (
            <label className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-black/40 backdrop-blur flex items-center justify-center cursor-pointer border border-white/20">
              <Camera className="w-4 h-4 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImagePick(e, "banner")} />
            </label>
          )}
        </div>

        <div className="relative px-4 pb-5 -mt-12">
          <div className={`relative w-24 h-24 mx-auto ${animClass}`}>
            <div
              className={`w-full h-full rounded-2xl overflow-hidden border-4 bg-card ${frameClass}`}
              style={{ borderColor: "var(--card)" }}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-display font-black text-3xl text-white bg-primary">
                  {initials}
                </div>
              )}
            </div>
            {isOwner && (
              <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer border-2 border-card shadow-lg">
                <Camera className="w-3.5 h-3.5 text-primary-foreground" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImagePick(e, "avatar")} />
              </label>
            )}
          </div>

          <div className="text-center mt-3">
            <h1 className="font-display font-black text-xl text-foreground">{profile?.ign || profile?.username}</h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">@{profile?.username}</p>
            {profile?.uid && (
              <p className="text-[10px] font-bold text-primary mt-1 flex items-center justify-center gap-1">
                <Gamepad2 className="w-3 h-3" /> UID {profile.uid}
              </p>
            )}
          </div>

          {isOwner && (
            <div className="flex justify-center gap-2 mt-4">
              <Button size="sm" variant="outline" className="rounded-xl h-9" onClick={() => setEditOpen(true)}>
                <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Edit
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl h-9" onClick={openShop}>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Style
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl h-9" onClick={shareProfile}>
                <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-2 px-4 mt-4">
        {[
          { label: "Matches", value: profile?.stats?.matchesPlayed ?? 0 },
          { label: "Kills", value: profile?.stats?.totalKills ?? 0 },
          { label: "Wins", value: profile?.stats?.firstPlaces ?? 0 },
          { label: "Earned", value: profile?.stats?.totalEarnings ?? 0, coin: true },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-2.5 text-center">
            <p className="text-[9px] uppercase font-bold text-muted-foreground">{s.label}</p>
            <p className="font-display font-black text-sm mt-0.5 flex items-center justify-center gap-0.5">
              {s.coin && <GodCoin className="w-3 h-3" />}
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Team card */}
      {profile?.team && (isOwner ? (
        <Link
          to="/my-team"
          className="mx-4 mt-4 flex items-center gap-3 p-4 rounded-2xl border border-border bg-card press-effect"
        >
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-black text-primary shrink-0">
            {profile.team.logo ? (
              <img src={profile.team.logo} alt="" className="w-full h-full object-cover" />
            ) : (
              profile.team.name?.[0]
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Squad</p>
            <p className="font-display font-black text-foreground truncate">{profile.team.name}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>
      ) : (
        <div className="mx-4 mt-4 flex items-center gap-3 p-4 rounded-2xl border border-border bg-card">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-black text-primary shrink-0">
            {profile.team.logo ? (
              <img src={profile.team.logo} alt="" className="w-full h-full object-cover" />
            ) : (
              profile.team.name?.[0]
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Squad</p>
            <p className="font-display font-black text-foreground truncate">{profile.team.name}</p>
          </div>
        </div>
      ))}

      {/* Achievements */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Achievements</p>
          {isOwner && <span className="text-[10px] text-muted-foreground">Tap to showcase (max 4)</span>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(isOwner ? (profile?.achievements || []) : (profile?.showcase || [])).map((a: any) => {
            const selected = showcase.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                disabled={!isOwner}
                onClick={() => isOwner && toggleShowcase(a.id)}
                className={`text-left p-3 rounded-2xl border transition-all ${
                  selected ? "border-primary/50 bg-primary/10" : "border-border bg-card"
                } ${!isOwner ? "cursor-default" : ""}`}
              >
                <span className="text-xl">{a.emoji}</span>
                <p className="font-bold text-xs text-foreground mt-1">{a.label}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-1">{a.description}</p>
                {isOwner && selected && <Check className="w-3.5 h-3.5 text-primary mt-1" />}
              </button>
            );
          })}
          {!(isOwner ? profile?.achievements : profile?.showcase)?.length && (
            <p className="col-span-2 text-sm text-muted-foreground text-center py-6">
              {isOwner ? "No achievements yet — play tournaments!" : "No showcased achievements"}
            </p>
          )}
        </div>
        {isOwner && (
          <Button className="w-full mt-3 rounded-xl" variant="outline" onClick={handleSaveInfo}>
            Save showcased achievements
          </Button>
        )}
      </div>

      {/* Edit dialog */}
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

      {/* Shop dialog */}
      <Dialog open={shopOpen} onOpenChange={setShopOpen}>
        <DialogContent className="rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-black flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Profile style shop
            </DialogTitle>
          </DialogHeader>
          {shop && (
            <div className="space-y-4 pt-2">
              {(["banners", "animations", "frames"] as const).map((cat) => (
                <div key={cat}>
                  <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">{cat}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {shop[cat].map((item) => {
                      const has = item.cost === 0 || owned.includes(item.id);
                      const active =
                        (cat === "banners" && profile.banner_preset === item.value) ||
                        (cat === "animations" && profile.profile_animation === item.value) ||
                        (cat === "frames" && profile.profile_frame === item.value);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => buyCosmetic(item.id)}
                          className={`p-3 rounded-xl border text-left ${active ? "border-primary bg-primary/10" : "border-border bg-card"}`}
                        >
                          <p className="font-bold text-sm">{item.label}</p>
                          <p className="text-xs text-primary mt-1 flex items-center gap-1">
                            {item.cost > 0 ? (
                              <>
                                <GodCoin className="w-3 h-3" /> {item.cost} CG
                              </>
                            ) : (
                              "Free"
                            )}
                          </p>
                          {!has && item.cost > 0 && (
                            <p className="text-[9px] text-muted-foreground mt-0.5">Tap to buy & equip</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Crop */}
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
