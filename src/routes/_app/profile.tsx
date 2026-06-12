import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { ShieldAlert, BarChart3, Swords, Sparkles } from "lucide-react";
import { useAuth } from "../../lib/auth-client";
import { useEffect, useState } from "react";
import { getProfile } from "../../api";
import { ProfileView } from "@/components/profile/ProfileView";

import { SkeletonProfile } from "@/components/SkeletonPage";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — ClutchGround" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const p = await (getProfile as any)({ data: user.id });
    setProfile(p);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.navigate({ to: "/login" });
      return;
    }
    if (user) load();
  }, [user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background page-content">
        <SkeletonProfile />
      </div>
    );
  }
  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-background page-content">
      <ProfileView profile={profile} isOwner onUpdated={setProfile} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="px-4 mt-3 grid grid-cols-2 gap-2"
      >
        <Link
          to="/stats"
          className="flex items-center gap-2 p-3.5 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm press-effect hover:border-primary/20 transition-all duration-300"
        >
          <BarChart3 className="w-5 h-5 text-primary" />
          <span className="text-sm font-bold">Player stats</span>
        </Link>
        <Link
          to="/matches"
          className="flex items-center gap-2 p-3.5 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm press-effect hover:border-primary/20 transition-all duration-300"
        >
          <Swords className="w-5 h-5 text-primary" />
          <span className="text-sm font-bold">Matches</span>
        </Link>
      </motion.div>

      {user.role === "admin" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.35, duration: 0.4 }}
          className="px-4 mt-3"
        >
          <Link
            to="/admin"
            className="flex items-center justify-center gap-2 h-11 rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive font-bold text-sm hover:bg-destructive/15 transition-all"
          >
            <ShieldAlert className="w-4 h-4" /> Admin panel
          </Link>
        </motion.div>
      )}
    </div>
  );
}
