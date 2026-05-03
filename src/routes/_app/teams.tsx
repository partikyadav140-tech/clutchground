import { createFileRoute, useRouter } from "@tanstack/react-router";
import { PageHeader } from "./tournaments";
import { Button } from "@/components/ui/button";
import { Plus, Users, Trophy, Calendar, Check, Search } from "lucide-react";
import { toast } from "sonner";
import { getAllTeams, requestJoinTeam, getProfile } from "../../api";
import { useAuth } from "../../lib/auth-client";
import { useState } from "react";

export const Route = createFileRoute("/_app/teams")({
  head: () => ({ meta: [{ title: "Teams — CLUTCHGROUND" }] }),
  loader: async () => await getAllTeams(),
  component: TeamsPage,
});

function TeamsPage() {
  const teams = Route.useLoaderData() as any[];
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [q, setQ] = useState("");

  const filteredTeams = teams.filter((t) => {
    if (q && !t.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const handleOpenJoin = async (tId: number) => {
    if (!user) {
      toast.error("Please login to join a team.");
      return router.navigate({ to: "/login" });
    }
    const loadingToast = toast.loading("Sending request...");
    try {
      const p = await (getProfile as any)({ data: user.id });
      if (!p?.ign || !p?.uid) {
        toast.dismiss(loadingToast);
        toast.error("Please set your IGN and UID in your profile first.");
        return router.navigate({ to: "/profile" });
      }
      await (requestJoinTeam as any)({ data: { teamId: tId, userId: user.id, ign: p.ign, uid: p.uid } });
      toast.dismiss(loadingToast);
      toast.success("Request sent to the Team Captain!");
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.message || "Failed to send request.");
    }
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-16">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <PageHeader title="Teams" subtitle="Brotherhood Of Fire" />
        <Button variant="hero" size="lg" className="font-display tracking-wider self-start" onClick={() => { if(user) router.navigate({ to: "/profile" }); else router.navigate({ to: "/login" }); }}>
          <Plus className="w-5 h-5" /> Create Team
        </Button>
      </div>

      <div className="mt-8">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search teams by name..."
            className="w-full bg-card border border-border focus:border-primary outline-none pl-10 pr-4 h-11 text-sm clip-notch transition-colors"
          />
        </div>
      </div>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTeams.map((t) => (
          <div key={t.id} className="group bg-card-gradient border border-border hover:border-primary/60 hover:shadow-fire transition-all clip-notch p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-16 h-16 rounded-md bg-fire-gradient grid place-items-center font-display font-black text-xl text-primary-foreground shadow-fire">
                {t.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="font-display font-black text-2xl text-fire-gradient">#{t.id}</span>
            </div>
            <h3 className="font-display text-xl font-black tracking-wide group-hover:text-primary transition-colors">{t.name}</h3>

            <div className="mt-5 grid grid-cols-2 gap-2 text-center">
              <Stat icon={Users} value={`${t.members?.length + 1 || 1}/4`} label="Members" />
              <Stat icon={Calendar} value={new Date(t.created_at).toLocaleDateString()} label="Founded" />
            </div>

            <div className="mt-5">
              <Button variant="hero" className="w-full" onClick={() => handleOpenJoin(t.id)}>Request to Join</Button>
            </div>
          </div>
        ))}
      </div>
      
      {filteredTeams.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p>{teams.length === 0 ? "No teams have been created yet. Be the first!" : "No teams match your search."}</p>
        </div>
      )}


    </div>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof Trophy; value: string | number; label: string }) {
  return (
    <div className="p-2 bg-secondary/60 border border-border">
      <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
      <div className="font-display font-black text-sm">{value}</div>
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
