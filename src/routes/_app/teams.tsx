import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Plus, Users, Trophy, Calendar, Check, Search, Shield } from "lucide-react";
import { toast } from "sonner";
import { getAllTeams, requestJoinTeam, getProfile } from "../../api";
import { useAuth } from "../../lib/auth-client";
import { useState } from "react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/teams")({
  head: () => ({ meta: [{ title: "Squads — Professional Esports Arena" }] }),
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
      toast.error("Please login to join a squad.");
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
      await (requestJoinTeam as any)({
        data: { teamId: tId, userId: user.id, ign: p.ign, uid: p.uid },
      });
      toast.dismiss(loadingToast);
      toast.success("Request sent to the Squad Captain!");
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.message || "Failed to send request.");
    }
  };

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* ─── Top Header (Mobile First) ─── */}
      <div className="bg-white rounded-b-[2rem] shadow-[0_4px_24px_oklch(0_0_0/0.04)] pt-6 pb-6 px-4 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-black text-foreground">Squads</h1>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">
            Join forces and conquer
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <Button
            className="w-full h-12 rounded-xl font-bold bg-primary text-white shadow-primary"
            onClick={() => {
              if (user) router.navigate({ to: "/profile" });
              else router.navigate({ to: "/login" });
            }}
          >
            <Plus className="w-5 h-5 mr-2" /> Create Your Squad
          </Button>

          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search squads by name..."
              className="w-full bg-secondary/50 border border-border focus:border-primary focus:bg-white outline-none pl-10 pr-4 h-11 text-sm rounded-xl transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="px-4 mt-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((t, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              key={t.id}
              className="bg-white rounded-[1.5rem] border border-border hover:border-primary/40 hover:shadow-lg transition-all p-5 flex flex-col relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 font-display font-black text-xl text-secondary group-hover:text-primary/10 transition-colors z-0">
                #{t.id}
              </div>

              <div className="relative z-10 flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-[1rem] bg-gradient-to-br from-primary to-[#d95a00] flex items-center justify-center font-display font-black text-2xl text-white shadow-md">
                  {t.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-display text-xl font-black text-foreground group-hover:text-primary transition-colors">
                    {t.name}
                  </h3>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    Squad
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-secondary/30 rounded-xl p-3 border border-border/50 flex flex-col items-center">
                  <Users className="w-4 h-4 text-primary mb-1" />
                  <div className="font-display font-black text-lg text-foreground leading-tight">
                    {t.members?.length + 1 || 1}/4
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">
                    Roster
                  </div>
                </div>
                <div className="bg-secondary/30 rounded-xl p-3 border border-border/50 flex flex-col items-center">
                  <Calendar className="w-4 h-4 text-primary mb-1" />
                  <div className="font-display font-black text-sm text-foreground mt-0.5 leading-tight">
                    {new Date(t.created_at).toLocaleDateString([], {
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">
                    Founded
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mt-auto rounded-xl font-bold bg-white shadow-sm border-border hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                onClick={() => handleOpenJoin(t.id)}
              >
                Request to Join
              </Button>
            </motion.div>
          ))}
        </div>

        {filteredTeams.length === 0 && (
          <div className="text-center py-16 bg-white rounded-[1.5rem] border border-border shadow-sm mt-4">
            <div className="w-16 h-16 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="font-display font-black text-lg text-foreground mb-1">
              No Squads Found
            </h3>
            <p className="text-sm text-muted-foreground max-w-[200px] mx-auto font-semibold">
              {teams.length === 0
                ? "No squads have been formed yet. Be the first to create one!"
                : "No squads match your search query."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
