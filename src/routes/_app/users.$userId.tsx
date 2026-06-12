import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { getPublicProfile } from "@/api";
import { ProfileView } from "@/components/profile/ProfileView";

import { SkeletonProfile } from "@/components/SkeletonPage";

export const Route = createFileRoute("/_app/users/$userId")({
  head: () => ({ meta: [{ title: "Player Profile — ClutchGround" }] }),
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const { userId } = Route.useParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  useEffect(() => {
    (getPublicProfile as any)({ data: Number(userId) })
      .then((p: any) => setProfile(p))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background page-content">
        <div className="px-4 pt-4 mb-2">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
        <SkeletonProfile />
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
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>
      <ProfileView profile={profile} isOwner={false} />
    </div>
  );
}
