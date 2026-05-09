import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  Trophy,
  Edit3,
  Share2,
  Save,
  Users,
  Bell,
  User,
  ChevronRight,
  Wallet,
  Shield,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "../../lib/auth-client";
import { useState, useEffect } from "react";
import { confirmDialog } from "@/components/ConfirmDialog";
import {
  getProfile,
  updateProfile,
} from "../../api";
import { GodCoin } from "@/components/GodCoin";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "My Profile — Professional Esports Arena" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [formData, setFormData] = useState({ ign: "", uid: "", email: "", phone: "" });

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
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
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
    <div className="bg-background min-h-screen pb-24">
      {/* ─── Top Header (Mobile First) ─── */}
      <div className="bg-white rounded-b-[2rem] shadow-[0_4px_24px_oklch(0_0_0/0.04)] pt-6 pb-6 px-4 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-3">
            <User className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-black text-foreground">My Profile</h1>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">
            Manage your identity
          </p>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-6">
        {/* ─── Profile Card ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-[1.5rem] border border-border shadow-sm p-5 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary/20 to-primary/5" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-24 h-24 rounded-[1rem] bg-gradient-to-br from-primary to-[#d95a00] flex items-center justify-center font-display font-black text-4xl text-white shadow-lg border-4 border-white mt-4 sm:mt-0">
              {profile?.ign ? profile.ign[0].toUpperCase() : user.username[0].toUpperCase()}
            </div>

            <div className="flex-1 text-center sm:text-left mt-2 sm:mt-8 w-full">
              {isEditingProfile ? (
                <div className="space-y-3 mt-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1 text-left">
                      IGN (In-Game Name)
                    </label>
                    <input
                      className="w-full bg-secondary/50 border border-border focus:border-primary outline-none px-4 py-2.5 text-sm rounded-xl font-bold"
                      placeholder="IGN"
                      value={formData.ign}
                      onChange={(e) => setFormData({ ...formData, ign: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1 text-left">
                      Free Fire UID
                    </label>
                    <input
                      className="w-full bg-secondary/50 border border-border focus:border-primary outline-none px-4 py-2.5 text-sm rounded-xl font-mono"
                      placeholder="Free Fire UID"
                      value={formData.uid}
                      onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1 text-left">
                      Email Address
                    </label>
                    <input
                      className="w-full bg-secondary/50 border border-border focus:border-primary outline-none px-4 py-2.5 text-sm rounded-xl"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1 text-left">
                      Phone Number
                    </label>
                    <input
                      className="w-full bg-secondary/50 border border-border focus:border-primary outline-none px-4 py-2.5 text-sm rounded-xl"
                      placeholder="Phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="font-display text-2xl font-black text-foreground">
                      {profile?.ign || user.username}
                    </div>
                    {profile?.ign && (
                      <div className="text-sm text-muted-foreground font-semibold">
                        @{user.username} • IGN: {profile.ign}
                      </div>
                    )}
                    {!profile?.ign && (
                      <div className="text-sm text-muted-foreground font-semibold">
                        @{user.username}
                      </div>
                    )}
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-xs font-mono font-bold text-muted-foreground mt-2 border border-border">
                    UID: {profile?.uid || "Not set"}
                  </div>
                  {(profile?.email || profile?.phone) && (
                    <div className="text-xs font-semibold text-muted-foreground mt-3 space-y-1">
                      {profile.email && (
                        <div className="flex items-center justify-center sm:justify-start gap-1.5">
                          <Shield className="w-3.5 h-3.5" /> {profile.email}
                        </div>
                      )}
                      {profile.phone && (
                        <div className="flex items-center justify-center sm:justify-start gap-1.5">
                          <User className="w-3.5 h-3.5" /> {profile.phone}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {isEditingProfile ? (
              <>
                <Button
                  onClick={handleSaveProfile}
                  className="flex-1 h-12 rounded-xl font-bold bg-primary text-white shadow-primary"
                >
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 h-12 rounded-xl font-bold border-border"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditingProfile(true)}
                  className="flex-1 h-12 rounded-xl font-bold border-border shadow-sm bg-white hover:bg-secondary/20"
                >
                  <Edit3 className="w-4 h-4 mr-2" /> Edit Profile
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      toast.success("Link copied!");
                    }}
                    className="flex-1 sm:flex-none w-12 h-12 p-0 rounded-xl border-border shadow-sm"
                  >
                    <Share2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={logout}
                    className="flex-1 sm:flex-none w-12 h-12 p-0 rounded-xl border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* ─── Wallet Quick Link ─── */}
        <a href="/wallet" className="block">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-gradient-to-r from-primary to-[#d95a00] rounded-2xl p-4 shadow-lg text-white flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <GodCoin className="w-6 h-6 drop-shadow-sm text-white" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-white/80">
                  Wallet Balance
                </div>
                <div className="font-display font-black text-xl">{totalBalance} Coins</div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <ChevronRight className="w-5 h-5" />
            </div>
          </motion.div>
        </a>

        {/* ─── Teams Quick Link ─── */}
        <Link to="/teams" className="block">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-4 shadow-sm border border-primary/20 flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-primary">
                  Squad Management
                </div>
                <div className="font-display font-black text-lg text-foreground">Manage Your Squad</div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-primary" />
            </div>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
