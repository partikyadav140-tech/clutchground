import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PlayerSearchInvite } from "@/components/team/PlayerSearchInvite";
import { getMyTeam } from "../../api";
import { useAuth } from "../../lib/auth-client";
import { countRosterSlots, type Team } from "@/lib/team-utils";

export const Route = createFileRoute("/_app/team-invite")({
  head: () => ({ meta: [{ title: "Invite Players — ClutchGround" }] }),
  component: TeamInvitePage,
});

function TeamInvitePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const t = await (getMyTeam as any)({ data: user.id });
    if (!t || t.leader_id !== user.id) {
      router.navigate({ to: "/my-team" });
      return;
    }
    setTeam(t);
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
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!team || !user) return null;

  const slots = countRosterSlots(team.members);

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
        eyebrowIcon={UserPlus}
        title="Invite players"
      />

      <p className="text-sm text-muted-foreground -mt-1 mb-5">
        Search by username, IGN, or UID. {slots.open} open {slots.open === 1 ? "slot" : "slots"} left on your roster.
      </p>

      <div className="rounded-2xl border border-border bg-card p-5">
        <PlayerSearchInvite
          captainId={user.id}
          disabled={slots.isFull}
          onInvited={refresh}
        />
        {slots.isFull && (
          <p className="text-xs text-amber-600 mt-4 text-center">
            Roster is full. Remove a member from My Squad to invite someone new.
          </p>
        )}
      </div>
    </div>
  );
}
