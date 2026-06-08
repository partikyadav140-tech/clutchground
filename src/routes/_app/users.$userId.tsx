import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { getPublicProfile } from "@/api";
import { ProfileView } from "@/components/profile/ProfileView";

export const Route = createFileRoute("/_app/users/$userId")({
  head: () => ({ meta: [{ title: "Player Profile — ClutchGround" }] }),
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const { userId } = Route.useParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (getPublicProfile as any)({ data: Number(userId) })
      .then((p: any) => setProfile(p))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-content px-4 py-12 text-center">
        <p className="font-bold text-muted-foreground">Player not found</p>
        <Link to="/" className="text-primary text-sm font-bold mt-2 inline-block">
          Go home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background page-content">
      <div className="px-4 pt-4">
        <Link to=".." className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>
      <ProfileView profile={profile} isOwner={false} />
    </div>
  );
}
