import { createFileRoute, useRouter } from "@tanstack/react-router";
import { PageHeader } from "./tournaments";
import { Trophy, Target, Crosshair, TrendingUp, Edit3, Bell, Share2, Save, Users, Crown, Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "../../lib/auth-client";
import { useState, useEffect } from "react";
import { getProfile, updateProfile, getMyTeam, saveMyTeam, getTeamRequests, resolveTeamRequest, getMyMatches, leaveTeam, deleteTeam } from "../../api";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "My Profile — CLUTCHGROUND" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [formData, setFormData] = useState({ ign: "", uid: "", email: "", phone: "" });

  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [teamData, setTeamData] = useState({
    name: "",
    logo: "",
    members: Array(5).fill({ ign: "", uid: "", role: "player" })
  });

  useEffect(() => {
    if (!user) {
      if (!loading) router.navigate({ to: "/login" });
      return;
    }
    async function load() {
      try {
        const p = await (getProfile as any)({ data: user.id });
        setProfile(p);
        setFormData({ ign: p?.ign || "", uid: p?.uid || "", email: p?.email || "", phone: p?.phone || "" });

        const t = await (getMyTeam as any)({ data: user.id });
        if (t) {
          setTeam(t);
          setTeamData({
            name: t.name, logo: t.logo || "",
            members: [...t.members, ...Array(5 - t.members.length).fill({ ign: "", uid: "", role: "player" })].slice(0, 5)
          });
        }
        
        const reqs = await (getTeamRequests as any)({ data: user.id });
        setRequests(reqs);

      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [user]);

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

  const handleSaveTeam = async () => {
    try {
      if (!teamData.name) return toast.error("Team Name is required");
      const validMembers = teamData.members.filter(m => m.ign && m.uid);
      await (saveMyTeam as any)({
        data: {
          userId: user.id,
          teamName: teamData.name,
          logo: teamData.logo,
          members: validMembers
        }
      });
      const t = await (getMyTeam as any)({ data: user.id });
      setTeam(t);
      setTeamData({
        name: t.name, logo: t.logo || "",
        members: [...t.members, ...Array(5 - t.members.length).fill({ ign: "", uid: "", role: "player" })].slice(0, 5)
      });
      setIsEditingTeam(false);
      toast.success("Team saved successfully!");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to save team");
    }
  };

  const handleResolveRequest = async (requestId: number, status: 'approved' | 'rejected') => {
    try {
      await (resolveTeamRequest as any)({ data: { requestId, status } });
      setRequests(requests.filter(r => r.id !== requestId));
      if (status === 'approved') {
        const t = await (getMyTeam as any)({ data: user.id });
        setTeam(t);
      }
      toast.success(`Request ${status}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to resolve request");
    }
  };

  const handleLeaveTeam = async () => {
    if (!confirm("Are you sure you want to leave the team?")) return;
    try {
      await (leaveTeam as any)({ data: { userId: user.id, teamId: team.id } });
      setTeam(null);
      toast.success("You have left the team");
    } catch (err: any) {
      toast.error(err.message || "Failed to leave team");
    }
  };

  const handleDeleteTeam = async () => {
    if (!confirm("Are you sure you want to completely delete your team? This cannot be undone.")) return;
    try {
      await (deleteTeam as any)({ data: { userId: user.id, teamId: team.id } });
      setTeam(null);
      setIsEditingTeam(false);
      toast.success("Team deleted successfully");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete team");
    }
  };

  if (loading) return <div className="p-20 text-center flex justify-center items-center h-[50vh]"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) {
    if (typeof window !== 'undefined') {
      router.navigate({ to: "/login" });
    }
    return null;
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-16">
      <PageHeader title="My Profile" subtitle="Warrior Identity" />

      <div className="mt-8 grid lg:grid-cols-3 gap-6">
        {/* Identity card */}
        <div className="bg-card-gradient border border-primary/40 clip-notch p-6 shadow-fire">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-md bg-fire-gradient grid place-items-center font-display font-black text-3xl text-primary-foreground shadow-fire shrink-0">
              {profile?.ign ? profile.ign[0].toUpperCase() : user.username[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              {isEditingProfile ? (
                <div className="space-y-2 mt-1">
                  <input className="w-full bg-secondary border border-border px-2 py-1 text-sm font-display" placeholder="IGN" value={formData.ign} onChange={e => setFormData({...formData, ign: e.target.value})} />
                  <input className="w-full bg-secondary border border-border px-2 py-1 text-sm text-muted-foreground" placeholder="UID" value={formData.uid} onChange={e => setFormData({...formData, uid: e.target.value})} />
                  <input className="w-full bg-secondary border border-border px-2 py-1 text-sm" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  <input className="w-full bg-secondary border border-border px-2 py-1 text-sm" placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              ) : (
                <>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">IGN</div>
                  <h2 className="font-display text-2xl font-black truncate">{profile?.ign || user.username}</h2>
                  <div className="text-xs text-muted-foreground mt-1">UID: {profile?.uid || "Not set"}</div>
                  {(profile?.email || profile?.phone) && (
                    <div className="text-[10px] text-muted-foreground mt-2 border-t border-border/40 pt-1">
                      {profile.email && <div>{profile.email}</div>}
                      {profile.phone && <div>{profile.phone}</div>}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-5">
            {isEditingProfile ? (
              <Button variant="hero" size="sm" onClick={handleSaveProfile}><Save className="w-4 h-4" /> Save</Button>
            ) : (
              <Button variant="outlineFire" size="sm" onClick={() => setIsEditingProfile(true)}><Edit3 className="w-4 h-4" /> Edit</Button>
            )}
            <Button variant="outlineFire" size="sm" onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success("Profile link copied!"); }}><Share2 className="w-4 h-4" /> Share</Button>
          </div>
        </div>

        {/* My Team Panel */}
        <div className="lg:col-span-2 bg-card-gradient border border-border clip-notch p-6">
          <div className="flex justify-between items-center mb-4 border-b border-border/60 pb-2">
            <h3 className="font-display font-bold flex items-center gap-2 text-primary"><Users className="w-5 h-5" /> My Team</h3>
            <div className="flex gap-2">
              {team && team.leader_id === user.id && !isEditingTeam && (
                <Button variant="outlineFire" size="sm" onClick={handleDeleteTeam} className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Trash className="w-4 h-4 mr-1" /> Delete Team
                </Button>
              )}
              {team && team.leader_id !== user.id && (
                <Button variant="outlineFire" size="sm" onClick={handleLeaveTeam} className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive">
                  Leave Team
                </Button>
              )}
              {(!team || team.leader_id === user.id) && !isEditingTeam && (
                <Button variant="outlineFire" size="sm" onClick={() => setIsEditingTeam(true)}>
                  <Edit3 className="w-4 h-4 mr-1" /> {team ? "Edit Team" : "Create Team"}
                </Button>
              )}
            </div>
          </div>

          {isEditingTeam ? (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-display text-muted-foreground mb-1">Team Name</label>
                  <input className="w-full bg-secondary border border-border px-3 py-2 text-sm" value={teamData.name} onChange={e => setTeamData({...teamData, name: e.target.value})} placeholder="Enter Team Name" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-display text-muted-foreground mb-2">Roster (up to 5 teammates + You)</label>
                <div className="space-y-2">
                  <div className="flex gap-2 text-xs font-bold text-muted-foreground px-2">
                    <div className="w-1/3">IGN</div><div className="w-1/3">UID</div><div className="w-1/4">Role</div>
                  </div>
                  {teamData.members.map((m, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input className="w-1/3 bg-secondary border border-border px-2 py-1.5 text-xs" placeholder={`P${i+2} IGN`} value={m.ign} onChange={e => setTeamData({ ...teamData, members: teamData.members.map((x, j) => j === i ? { ...x, ign: e.target.value } : x) })} />
                      <input className="w-1/3 bg-secondary border border-border px-2 py-1.5 text-xs" placeholder="UID" value={m.uid} onChange={e => setTeamData({ ...teamData, members: teamData.members.map((x, j) => j === i ? { ...x, uid: e.target.value } : x) })} />
                      <select className="w-1/4 bg-secondary border border-border px-2 py-1.5 text-xs" value={m.role} onChange={e => setTeamData({ ...teamData, members: teamData.members.map((x, j) => j === i ? { ...x, role: e.target.value } : x) })}>
                        <option value="player">Main</option>
                        <option value="substitute">Sub</option>
                      </select>
                      <button 
                        type="button" 
                        onClick={() => setTeamData({ ...teamData, members: teamData.members.map((x, j) => j === i ? { ign: "", uid: "", role: "player" } : x) })} 
                        className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors rounded"
                        title="Remove Player"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border/40">
                <Button variant="ghost" onClick={() => setIsEditingTeam(false)}>Cancel</Button>
                <Button variant="hero" onClick={handleSaveTeam}><Save className="w-4 h-4" /> Save Team</Button>
              </div>
            </div>
          ) : team ? (
            <div className="space-y-4">
              <div className="text-xl font-display font-black text-fire-gradient">{team.name}</div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Roster</div>
                <div className="space-y-1">
                  <div className="flex gap-2 p-2 bg-secondary/40 border border-border text-sm items-center justify-between">
                    <div className="flex gap-2 items-center">
                      <Crown className="w-4 h-4 text-primary" /> 
                      <span className="font-bold">{team.leader?.ign || team.leader?.username}</span> 
                      {team.leader?.uid && <span className="text-xs text-muted-foreground ml-2">UID: {team.leader.uid}</span>}
                    </div>
                    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-primary/20 text-primary border border-primary/50 rounded-full">Captain</span>
                  </div>
                  {team.members.map((m: any, i: number) => (
                    <div key={i} className="flex gap-2 p-2 bg-secondary/20 border border-border/40 text-sm items-center justify-between">
                      <div><span className="font-bold">{m.ign}</span> <span className="text-xs text-muted-foreground ml-2">UID: {m.uid}</span></div>
                      <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-background border border-border rounded-full">{m.role}</span>
                    </div>
                  ))}
                </div>
              </div>

              {requests.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border/40">
                  <div className="text-[10px] uppercase tracking-widest text-primary mb-2 flex items-center gap-2"><Bell className="w-3 h-3" /> Join Requests</div>
                  <div className="space-y-2">
                    {requests.map(r => (
                      <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-secondary/40 border border-border clip-notch gap-3">
                        <div>
                          <div className="font-bold text-sm text-primary">{r.ign}</div>
                          <div className="text-xs text-muted-foreground">UID: {r.uid} · User: {r.username}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outlineFire" size="sm" onClick={() => handleResolveRequest(r.id, 'rejected')}>Reject</Button>
                          <Button variant="hero" size="sm" onClick={() => handleResolveRequest(r.id, 'approved')}>Approve</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <div className="text-muted-foreground mb-4">You haven't formed a team yet.</div>
              <Button variant="outlineFire" onClick={() => setIsEditingTeam(true)}>Create Your Squad</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
