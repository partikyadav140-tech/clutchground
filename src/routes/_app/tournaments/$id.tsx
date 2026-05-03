import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getTournaments, getTournamentResults, getMyMatches } from "../../../api";
import { Button } from "@/components/ui/button";
import { Calendar, Trophy, Users, Target, Shield, ArrowLeft, Crosshair, Share2, Heart, Download } from "lucide-react";
import { toast } from "sonner";
import { JoinBattleDialog } from "@/components/JoinBattleDialog";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useAuth } from "../../../lib/auth-client";

export const Route = createFileRoute("/_app/tournaments/$id")({
  component: TournamentDetailPage,
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="font-display text-4xl mb-4">Tournament Not Found</h1>
      <Link to="/tournaments"><Button variant="hero">Back to Tournaments</Button></Link>
    </div>
  ),
  loader: async ({ params }) => {
    const ts = await getTournaments();
    const t = ts.find((x: any) => String(x.id) === params.id);
    if (!t) throw notFound();
    let allRegistrations = await (getTournamentResults as any)({ data: t.id });
    let results = t.status === 'completed' ? allRegistrations : [];
    return { t, results, allRegistrations };
  },
  errorComponent: ({ error }) => (
    <div className="container mx-auto px-4 py-20 text-center">
      <p className="text-destructive">{error.message}</p>
    </div>
  ),
});

const POSTERS = [
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=800",
];

function TournamentDetailPage() {
  const { t, results, allRegistrations } = Route.useLoaderData();
  const { user } = useAuth();
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    if (user) {
      (getMyMatches as any)({ data: user.id }).then((matches: any[]) => {
        if (matches.some((m: any) => m.id === t.id)) {
          setIsJoined(true);
        }
      }).catch(console.error);
    }
  }, [user, t.id]);

  useEffect(() => {
    const hasSeen = localStorage.getItem("god_esports_tour_detail_seen");
    if (!hasSeen) {
      const timer = setTimeout(() => {
        const driverObj = driver({
          showProgress: true,
          animate: true,
          allowClose: true,
          popoverClass: 'driverjs-theme',
          steps: [
            { 
              element: '#join-section-tour', 
              popover: { 
                title: '🔥 Join The Battle', 
                description: 'Tap here to book your slot. If there is an entry fee, it will be deducted from your wallet. Hurry, slots fill up fast!', 
                side: "left", 
                align: 'start' 
              } 
            },
            { 
              element: '#room-details-tour', 
              popover: { 
                title: '🎮 Room ID & Password', 
                description: 'Once you join, check back here exactly 10 minutes before the match starts to reveal the Custom Room ID and Password.', 
                side: "left", 
                align: 'start' 
              } 
            },
            { 
              element: '#results-rules-tour', 
              popover: { 
                title: '📸 Results & Verification', 
                description: 'After the match, submit your screenshot proof to the admins as per the rules. Final Standings and Prize distribution will appear on this page automatically!', 
                side: "top", 
                align: 'start' 
              } 
            }
          ],
          onDestroyStarted: () => {
            if (!driverObj.hasNextStep() || confirm("Are you sure you want to skip the rest of the tour?")) {
              driverObj.destroy();
              localStorage.setItem("god_esports_tour_detail_seen", "true");
            }
          },
        });
        driverObj.drive();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const downloadStandings = () => {
    if (!results || results.length === 0) return;
    const headers = ["Rank", "Team / Player", "Kills", "Position", "Points"];
    const rows = results.map((r: any, i: number) => [
      i + 1,
      `"${(r.team_name || r.username).replace(/"/g, '""')}"`,
      r.kills || 0,
      r.position || '-',
      r.points || 0
    ]);
    const csvContent = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${t.title.replace(/\s+/g, '_')}_Standings.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-16">
      <Link to="/tournaments" className="inline-flex items-center gap-2 text-sm font-display uppercase tracking-widest text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4" /> All Tournaments
      </Link>

      <div 
        className="relative overflow-hidden bg-cover bg-center clip-notch p-8 sm:p-12 lg:p-16 mb-8"
        style={{ backgroundImage: `url(${POSTERS[t.id % POSTERS.length]})` }}
      >
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent" />
        <div className="relative z-10 max-w-3xl">
          <span className="font-display text-xs uppercase tracking-[0.3em] text-white/90">{t.game} · {t.format}</span>
          <h1 className="mt-3 font-display text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white drop-shadow-lg">{t.title}</h1>
          <p className="mt-4 text-white/90 text-lg max-w-xl">Compete for the throne. {t.mode} format. {t.startsAt}.</p>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
          <Card title="Match Details">
            <div className="grid sm:grid-cols-2 gap-4">
              <Detail icon={Trophy} label="Prize Pool" value={`₹${t.prize.toLocaleString()}`} highlight />
              <Detail icon={Target} label="Entry Fee" value={t.entry === 0 ? "FREE" : `₹${t.entry}`} />
              <Detail icon={Users} label="Mode" value={t.mode} />
              <Detail icon={Crosshair} label="Format" value={t.format} />
              <Detail icon={Calendar} label="Starts" value={t.startsAt} />
              <Detail icon={Shield} label="Slots" value={`${t.filled} / ${t.slots}`} />
            </div>
          </Card>

          <Card title="Latest News & Updates">
            <div className="space-y-4">
              <div className="flex gap-4 border-l-2 border-primary/50 pl-4 py-1">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0 animate-pulse-glow" />
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest font-display mb-1">Today, 10:00 AM</div>
                  <p className="text-sm text-foreground">Registration is now open! Secure your slots early as they fill up extremely fast. Make sure your UID is verified.</p>
                </div>
              </div>
              <div className="flex gap-4 border-l-2 border-border pl-4 py-1">
                <div className="w-2 h-2 rounded-full bg-border mt-1.5 shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest font-display mb-1">Yesterday, 06:30 PM</div>
                  <p className="text-sm text-muted-foreground">Prize pool has been updated and officially verified by GOD ESPORTS management. Good luck warriors!</p>
                </div>
              </div>
            </div>
          </Card>

          <Card title="About This Tournament">
            <div className="text-sm text-muted-foreground leading-relaxed space-y-4">
              <p>Welcome to the ultimate battleground! The <strong className="text-primary">{t.title}</strong> is a high-stakes {t.game} event where the best of the best compete for glory and a share of the ₹{t.prize.toLocaleString()} prize pool.</p>
              <p>Gather your squad, strategize your drops, and fight for survival in this intense {t.mode} format. Whether you are a seasoned veteran or an rising star, this is your chance to prove your worth and etch your name into the Hall of Gods.</p>
              <p>Registration closes soon, and slots are strictly on a first-come, first-serve basis. Prepare your loadouts and get ready to drop into the combat zone.</p>
            </div>
          </Card>

          <Card id="results-rules-tour" title="Rules">
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                "Players must verify their Free Fire UID before joining.",
                "Room ID & password released 10 minutes before match start.",
                "Submit screenshot proof of kills & placement after match.",
                "Any form of hacking, teaming with enemies, or stream sniping = permanent ban.",
                "Disputes handled by GOD ESPORTS admin team. Verdicts are final.",
                "Prize money credited to wallet within 24 hours of admin verification.",
              ].map((r, i) => (
                <li key={i} className="flex gap-3"><span className="text-primary font-display font-black">{String(i + 1).padStart(2, "0")}</span>{r}</li>
              ))}
            </ul>
          </Card>

          <Card title="Prize Distribution">
            <div className="space-y-2">
              {[
                { rank: "🥇 1st", pct: 50 },
                { rank: "🥈 2nd", pct: 30 },
                { rank: "🥉 3rd", pct: 20 },
              ].map((p) => (
                <div key={p.rank} className="flex items-center justify-between p-3 bg-secondary border border-border">
                  <span className="font-display tracking-wide">{p.rank}</span>
                  <span className="font-display font-black text-fire-gradient">₹{Math.round((t.prize * p.pct) / 100).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>

          {t.status === 'completed' && results && results.length > 0 && (
            <Card 
              title="Final Standings"
              titleRight={<Button variant="outlineFire" size="sm" onClick={downloadStandings} className="h-8 text-xs py-0"><Download className="w-3 h-3 mr-2"/> Download Excel</Button>}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-secondary/50 border-y border-border">
                    <tr>
                      <th className="px-4 py-3 font-display">Rank</th>
                      <th className="px-4 py-3 font-display">Team / Player</th>
                      <th className="px-4 py-3 font-display text-center">Kills</th>
                      <th className="px-4 py-3 font-display text-center">Position</th>
                      <th className="px-4 py-3 font-display text-right text-primary">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r: any, idx: number) => (
                      <tr key={r.id} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                        <td className="px-4 py-3 font-display font-black text-muted-foreground">#{idx + 1}</td>
                        <td className="px-4 py-3 font-bold text-foreground">{r.team_name || r.username}</td>
                        <td className="px-4 py-3 text-center">{r.kills || 0}</td>
                        <td className="px-4 py-3 text-center">{r.position || '-'}</td>
                        <td className="px-4 py-3 text-right font-display font-black text-fire-gradient text-lg">{r.points || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {t.status !== 'completed' && allRegistrations && allRegistrations.length > 0 && (
            <Card title="Registered Teams">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allRegistrations.map((r: any, idx: number) => (
                  <div key={r.id} className="flex items-center gap-3 p-3 bg-secondary/60 border border-border">
                    <span className="font-display font-black text-muted-foreground">#{idx + 1}</span>
                    <span className="font-bold text-foreground">{r.team_name || r.username}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4 order-1 lg:order-2 mb-2 lg:mb-0">
          <div id="join-section-tour" className="bg-card-gradient border border-primary/40 clip-notch p-6 shadow-fire">
            <div className="text-xs font-display uppercase tracking-widest text-muted-foreground">Slots Filled</div>
            <div className="mt-2 font-display text-4xl font-black text-fire-gradient">{t.filled}/{t.slots}</div>
            <div className="mt-3 h-2 bg-secondary"><div className="h-full bg-fire-gradient" style={{ width: `${(t.filled / t.slots) * 100}%` }} /></div>
            {t.filled >= t.slots ? (
              <Button variant="outlineFire" size="lg" className="w-full mt-6 font-display tracking-wider" disabled>SLOTS FULL</Button>
            ) : isJoined ? (
              <Button variant="outlineFire" size="lg" className="w-full mt-6 font-display tracking-wider border-primary text-primary" disabled>ALREADY JOINED</Button>
            ) : (
              <JoinBattleDialog
                tournamentId={t.id}
                tournamentTitle={t.title}
                mode={t.mode}
                entryFee={t.entry}
                trigger={
                  <Button variant="hero" size="lg" className="w-full mt-6 font-display tracking-wider">
                    {t.entry === 0 ? "BOOK FREE SLOT" : `PAY ₹${t.entry} & JOIN`}
                  </Button>
                }
              />
            )}
            <p className="text-[10px] text-center text-muted-foreground mt-3 uppercase tracking-widest">First come, first serve</p>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success("Link copied to clipboard!"); }}>
                <Share2 className="w-4 h-4" /> Share
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toast.success("Added to your watchlist 🔥")}>
                <Heart className="w-4 h-4" /> Watch
              </Button>
            </div>
          </div>

          <Card id="room-details-tour" title="Match Room">
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Room ID</div>
                {t.room_id ? (
                  <div className="font-mono text-lg font-bold text-primary">{t.room_id}</div>
                ) : (
                  <div className="font-mono text-lg blur-sm select-none">●●●●●●●</div>
                )}
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Password</div>
                {t.room_pass ? (
                  <div className="font-mono text-lg font-bold text-primary">{t.room_pass}</div>
                ) : (
                  <div className="font-mono text-lg blur-sm select-none">●●●●●●</div>
                )}
              </div>
              {!t.room_id && !t.room_pass && (
                <p className="text-xs text-muted-foreground pt-2 border-t border-border/60">🔒 Released 10 min before start</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children, titleRight, id }: { title: string; children: React.ReactNode; titleRight?: React.ReactNode; id?: string }) {
  return (
    <div id={id} className="bg-card-gradient border border-border clip-notch p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm uppercase tracking-[0.25em] text-primary">{title}</h3>
        {titleRight && <div>{titleRight}</div>}
      </div>
      {children}
    </div>
  );
}

function Detail({ icon: Icon, label, value, highlight }: { icon: typeof Trophy; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-secondary/60 border border-border">
      <Icon className="w-5 h-5 text-primary mt-0.5" />
      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className={`font-display font-black ${highlight ? "text-fire-gradient text-lg" : "text-foreground"}`}>{value}</div>
      </div>
    </div>
  );
}
