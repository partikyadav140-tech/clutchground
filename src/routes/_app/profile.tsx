import { createFileRoute, useRouter } from "@tanstack/react-router";
import Cropper from "react-easy-crop";
import {
  Trophy,
  Edit3,
  Share2,
  Users,
  Bell,
  User,
  ChevronRight,
  Wallet,
  LogOut,
  ShieldAlert,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "../../lib/auth-client";
import { useState, useEffect } from "react";
import { getProfile, updateProfile } from "../../api";
import { GodCoin } from "@/components/GodCoin";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — CLUTCHGROUND" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [formData, setFormData] = useState({ ign: "", uid: "", email: "", phone: "", avatar_url: "" });

  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  const totalBalance = user
    ? ((user as any).deposit_balance || 0) + ((user as any).winning_balance || 0)
    : 0;

  useEffect(() => {
    if (!authLoading && !user) {
      router.navigate({ to: "/login" });
      return;
    }
    if (!user) return;
    async function load() {
      try {
        const p = await (getProfile as any)({ data: user.id });
        setProfile(p);
        setFormData({
          ign: p?.ign || "",
          uid: p?.uid || "",
          email: p?.email || "",
          phone: p?.phone || "",
          avatar_url: p?.avatar_url || "",
        });
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [user, authLoading, router]);

  const handleSaveProfile = async () => {
    try {
      await (updateProfile as any)({ data: { userId: user.id, ...formData } });
      setProfile({ ...profile, ...formData });
      setIsEditingProfile(false);
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCropSrc(event.target?.result as string);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // Reset input
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const createCroppedImage = async () => {
    try {
      const image = new Image();
      image.src = cropSrc!;
      await new Promise((resolve) => (image.onload = resolve));

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const MAX_WIDTH = 256;
      canvas.width = MAX_WIDTH;
      canvas.height = MAX_WIDTH;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        MAX_WIDTH,
        MAX_WIDTH
      );

      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      setFormData({ ...formData, avatar_url: dataUrl });
      setIsCropModalOpen(false);
      setCropSrc(null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to crop image");
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="bg-background min-h-screen pt-2 pb-safe">
      {/* ─── Minimal App Header ─── */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2 text-cta font-bold mb-1">
          <User className="w-5 h-5" /> Settings
        </div>
        <h1 className="text-3xl font-display font-black text-white">Profile</h1>
      </div>

      <div className="px-4 space-y-6">
        {/* ─── Avatar Header Card ─── */}
        <div className="bg-card border border-white/5 rounded-[1.5rem] p-4 flex items-center gap-4 shadow-lg active:scale-[0.98] transition-transform">
          <div className="w-16 h-16 rounded-full bg-primary/20 text-cta border border-primary/30 flex items-center justify-center text-xl font-display font-black shrink-0 overflow-hidden">
            {profile?.avatar_url ? (
               <img src={profile.avatar_url} className="w-full h-full object-cover" />
            ) : (
               profile?.ign ? profile.ign[0].toUpperCase() : user?.username?.[0]?.toUpperCase() || "?"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-black text-xl text-white truncate leading-tight">
              {profile?.ign || user.username}
            </h2>
            <p className="text-[11px] font-bold text-muted-foreground truncate uppercase tracking-widest mt-0.5">
              UID: {profile?.uid || "NOT SET"}
            </p>
          </div>
          
          {/* Edit Profile Trigger */}
          <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
            <DialogTrigger asChild>
              <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white shrink-0 active:bg-white/10 transition-colors">
                <Edit3 className="w-5 h-5" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-3xl border-white/10 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl font-black text-white text-glow">Edit Profile</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="flex justify-center mb-6">
                  <label className="relative w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer overflow-hidden border-2 border-primary/50 shadow-[0_0_15px_rgba(255,0,85,0.4)]">
                    {formData.avatar_url ? (
                      <img src={formData.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-cta" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center backdrop-blur-[2px]">
                      <Edit3 className="w-6 h-6 text-white mb-1 drop-shadow-md" />
                      <span className="text-[9px] font-black uppercase text-white tracking-widest drop-shadow-md">Edit</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-black text-cta mb-1 ml-1 text-glow">IGN (In-Game Name)</label>
                    <input
                      className="w-full bg-black/40 border border-white/10 focus:border-primary focus:bg-black/60 outline-none px-4 h-12 text-sm rounded-xl font-bold text-white transition-colors shadow-inner placeholder:text-white/20"
                      placeholder="Enter IGN"
                      value={formData.ign}
                      onChange={(e) => setFormData({ ...formData, ign: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-black text-cta mb-1 ml-1 text-glow">Free Fire UID</label>
                    <input
                      className="w-full bg-black/40 border border-white/10 focus:border-primary focus:bg-black/60 outline-none px-4 h-12 text-sm rounded-xl font-mono text-white transition-colors shadow-inner placeholder:text-white/20"
                      placeholder="Enter UID"
                      value={formData.uid}
                      onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-black text-cta mb-1 ml-1 text-glow">Email Address</label>
                    <input
                      className="w-full bg-black/40 border border-white/10 focus:border-primary focus:bg-black/60 outline-none px-4 h-12 text-sm rounded-xl text-white font-bold transition-colors shadow-inner placeholder:text-white/20"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-black text-cta mb-1 ml-1 text-glow">Phone Number</label>
                    <input
                      className="w-full bg-black/40 border border-white/10 focus:border-primary focus:bg-black/60 outline-none px-4 h-12 text-sm rounded-xl text-white font-bold transition-colors shadow-inner placeholder:text-white/20"
                      placeholder="Phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                
                <Button onClick={handleSaveProfile} className="w-full h-12 rounded-xl font-black bg-cta-gradient text-cta-foreground mt-4 shadow-cta text-sm uppercase tracking-widest border border-cta/50 hover:scale-105 transition-transform">
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* ─── iOS Style Settings Group 1 ─── */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 ml-4">Account</div>
          <div className="bg-card border border-white/5 rounded-[1.25rem] overflow-hidden">
            <Link to="/wallet" className="flex items-center gap-3 p-4 border-b border-white/5 active:bg-white/5 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="flex-1 font-bold text-sm text-white">Wallet & Balance</div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-cta flex items-center gap-1"><GodCoin className="w-3 h-3"/> {totalBalance}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
            
            <Link to="/teams" className="flex items-center gap-3 p-4 border-b border-white/5 active:bg-white/5 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex-1 font-bold text-sm text-white">Squad Management</div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>

            <Link to="/matches" className="flex items-center gap-3 p-4 active:bg-white/5 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-500 flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="flex-1 font-bold text-sm text-white">Match History</div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </div>

        {/* ─── iOS Style Settings Group 2 ─── */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 ml-4">Preferences</div>
          <div className="bg-card border border-white/5 rounded-[1.25rem] overflow-hidden">
            <Link to="/notifications" className="flex items-center gap-3 p-4 border-b border-white/5 active:bg-white/5 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-500 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 font-bold text-sm text-white">Notifications</div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            
            <Link to="/support" className="flex items-center gap-3 p-4 border-b border-white/5 active:bg-white/5 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-500 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 font-bold text-sm text-white">Help & Support</div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            
            <button 
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                toast.success("Profile link copied!");
              }}
              className="w-full flex items-center gap-3 p-4 active:bg-white/5 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-500 flex items-center justify-center shrink-0">
                <Share2 className="w-4 h-4" />
              </div>
              <div className="flex-1 font-bold text-sm text-white">Share Profile</div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        
        {/* ─── Admin Group (If Admin) ─── */}
        {user.role === "admin" && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-cta mb-2 ml-4">Administration</div>
            <div className="bg-card border border-primary/20 rounded-[1.25rem] overflow-hidden">
              <Link to="/admin" className="flex items-center gap-3 p-4 active:bg-white/5 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="flex-1 font-bold text-sm text-red-500">Admin Command Center</div>
                <ChevronRight className="w-4 h-4 text-red-500/50" />
              </Link>
            </div>
          </div>
        )}

        {/* ─── Logout ─── */}
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 text-red-500 font-black rounded-[1.25rem] border border-red-500/20 active:scale-95 transition-all mt-4 uppercase tracking-widest text-sm"
        >
          <LogOut className="w-4 h-4" /> Log Out
        </button>

      </div>

      {/* Crop Modal */}
      <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
        <DialogContent className="max-w-[90vw] w-[400px] bg-card/95 backdrop-blur-3xl border-white/10 shadow-2xl z-[100]">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-black text-white text-glow">Crop Photo</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-64 bg-black/50 rounded-xl overflow-hidden mt-4">
            {cropSrc && (
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="mt-4 px-2 flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">1x</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <span className="text-xs font-bold text-muted-foreground">3x</span>
          </div>
          <Button onClick={createCroppedImage} className="w-full mt-4 font-black bg-cta-gradient text-cta-foreground h-12 rounded-xl text-sm uppercase tracking-widest shadow-cta border border-cta/50 hover:scale-105 transition-transform">
            Apply Crop
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
