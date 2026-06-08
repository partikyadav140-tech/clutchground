import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { LogOut, ShieldAlert, BarChart3, Swords } from "lucide-react";
import { useAuth } from "../../lib/auth-client";
import { useEffect, useState } from "react";
import { getProfile } from "../../api";
import { ProfileView } from "@/components/profile/ProfileView";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — ClutchGround" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
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
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-background page-content">
      <ProfileView profile={profile} isOwner onUpdated={setProfile} />

      <div className="px-4 mt-2 grid grid-cols-2 gap-2">
        <Link
          to="/stats"
          className="flex items-center gap-2 p-3 rounded-2xl border border-border bg-card press-effect"
        >
          <BarChart3 className="w-5 h-5 text-primary" />
          <span className="text-sm font-bold">Player stats</span>
        </Link>
        <Link
          to="/matches"
          className="flex items-center gap-2 p-3 rounded-2xl border border-border bg-card press-effect"
        >
          <Swords className="w-5 h-5 text-primary" />
          <span className="text-sm font-bold">Matches</span>
        </Link>
      </div>

      {user.role === "admin" && (
        <div className="px-4 mt-3">
          <Link
            to="/admin"
            className="flex items-center justify-center gap-2 h-11 rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive font-bold text-sm"
          >
            <ShieldAlert className="w-4 h-4" /> Admin panel
          </Link>
        </div>
      )}

      <div className="px-4 mt-4">
        <Button
          variant="outline"
          className="w-full h-12 rounded-2xl text-red-500 border-red-500/30 hover:bg-red-500/10 font-bold"
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign out
        </Button>
      </div>
    </div>
  );
}
