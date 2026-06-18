import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Inbox } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TeamRequestsPanel } from "@/components/team/TeamRequestsPanel";
import { SkeletonTeamList } from "@/components/SkeletonPage";
import { getMyTeam, getTeamRequests } from "../../api";
import { useAuth } from "../../lib/auth-client";
import type { Team } from "@/lib/team-utils";

export const Route = createFileRoute("/_app/team-requests")({
  head: () => ({ meta: [{ title: "Join Requests — ClutchGround" }] }),
  component: TeamRequestsPage,
});

function TeamRequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const t = await (getMyTeam as any)({ data: user.id });
    if (!t || t.leader_id !== user.id) {
      router.navigate({ to: "/my-team" });
      return;
    }
    const reqs = await (getTeamRequests as any)({ data: user.id });
    setTeam(t);
    setRequests(reqs || []);
    setLoading(false);
  }, [user, router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.navigate({ to: "/login" });
      return;
    }
    if (user) refresh();
  }, [user, authLoading, router, refresh]);

  if (loading || authLoading) {
    return (
      <div className="min-h-[60vh] pb-4">
        <SkeletonTeamList />
      </div>
    );
  }

  if (!team || !user) return null;

  return (
    <div className="min-h-screen bg-background pb-4 page-content">
      <Link
        to="/my-team"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary mb-3"
      >
        <ArrowLeft className="w-4 h-4" /> Back to squad
      </Link>

      <PageHeader
        eyebrow={team.name}
        eyebrowIcon={Inbox}
        title="Join requests"
        action={
          requests.length > 0 ? (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/15 text-primary">
              {requests.length} pending
            </span>
          ) : null
        }
      />

      <p className="text-sm text-muted-foreground -mt-1 mb-5">
        Players who requested to join your squad. Accept or decline each request.
      </p>

      <TeamRequestsPanel captainId={user.id} requests={requests} onUpdated={refresh} />
    </div>
  );
}
