import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getTournaments, getTournamentResults, getMyMatches } from "../../../api";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Trophy,
  Users,
  Target,
  Shield,
  ArrowLeft,
  Crosshair,
  Share2,
  Heart,
  Download,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { JoinBattleDialog } from "@/components/JoinBattleDialog";
import { GodCoin } from "@/components/GodCoin";
import { confirmDialog } from "@/components/ConfirmDialog";
import { useAuth } from "../../../lib/auth-client";

export const Route = createFileRoute("/_app/tournaments/$id")({
  component: TournamentDetailPage,
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="font-display text-4xl mb-4">Tournament Not Found</h1>
      <a href="/tournaments">
        <Button variant="hero">Back to Tournaments</Button>
      </a>
    </div>
  ),
  loader: async ({ params }) => {
    const ts = await getTournaments();
    const t = ts.find((x: any) => String(x.id) === params.id);
    if (!t) throw notFound();
    let allRegistrations = await (getTournamentResults as any)({ data: t.id });
    let results = t.status === "completed" ? allRegistrations : [];
    return { t, results, allRegistrations };
  },
  errorComponent: ({ error }) => (
    <div className="container mx-auto px-4 py-20 text-center">
      <p className="text-destructive">{error.message}</p>
    </div>
  ),
});

const POSTERS = [
  "/posters/poster1.jpg",
  "/posters/poster2.jpg",
  "/posters/poster3.jpg",
  "/posters/poster4.jpg",
  "/posters/poster5.jpg",
  "/posters/poster6.jpg",
];

type TabType = "info" | "registered" | "rules" | "prizes" | "standings";

function TournamentDetailPage() {
  const { t, results, allRegistrations } = Route.useLoaderData();
  const { user } = useAuth();
  const [isJoined, setIsJoined] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("info");

  useEffect(() => {
    if (user) {
      (getMyMatches as any)({ data: user.id })
        .then((matches: any[]) => {
          if (matches.some((m: any) => m.id === t.id)) setIsJoined(true);
        })
        .catch(console.error);
    }
  }, [user, t.id]);

  const canViewRoom = isJoined;


  const downloadStandings = () => {
    if (!results || results.length === 0) return;
    const headers = ["Rank", "Team / Player", "Kills", "Position", "Points"];
    const rows = results.map((r: any, i: number) => [
      i + 1,
      `"${(r.team_name || r.username).replace(/"/g, '""')}"`,
      r.kills || 0,
      r.position || "-",
      r.points || 0,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${t.title.replace(/\s+/g, "_")}_Standings.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fillPct = Math.min(100, (t.filled / t.slots) * 100);
  const isFull = t.filled >= t.slots;

  const tabs: { key: TabType; label: string }[] = [
    { key: "info", label: "Info" },
    { key: "registered", label: "Registered Teams" },
    { key: "prizes", label: "Prizes" },
    ...(t.status === "completed" ? [{ key: "standings" as TabType, label: "Standings" }] : []),
  ];

  return (
    <div
      className="mb-safe lg:mb-0 min-h-[100svh] bg-background"
      style={
        {
          "--background": "oklch(0.97 0.01 260)",
          "--foreground": "oklch(0.15 0.02 260)",
          "--card": "oklch(0.99 0.005 260)",
          "--card-foreground": "oklch(0.15 0.02 260)",
          "--muted": "oklch(0.95 0.01 260)",
          "--muted-foreground": "oklch(0.45 0.02 260)",
          "--border": "oklch(0.92 0.01 260)",
          "--secondary": "oklch(0.95 0.01 260)",
          "--secondary-foreground": "oklch(0.15 0.02 260)",
          "--gradient-card": "linear-gradient(145deg, oklch(1 0 0), oklch(0.97 0.01 260))",
        } as any
      }
    >
      <div className="bg-background text-foreground min-h-[100svh] pb-10">
        {/* ─── Hero Banner ─── */}
        <div
          className="relative h-48 sm:h-64 lg:h-80 overflow-hidden"
          style={{
            backgroundImage: `url(${POSTERS[t.id % POSTERS.length]})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 grid-bg opacity-[0.06]" />

          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <a
              href="/tournaments"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-background/70 backdrop-blur-md border border-border/60 text-sm font-display uppercase tracking-wider text-foreground hover:border-primary/50 transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </a>
            {t.status === "live" && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-red-500/90 backdrop-blur-sm text-white text-xs font-display font-bold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
              </div>
            )}
          </div>

          <div className="absolute bottom-5 left-4 right-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-display mb-1">
              {t.game} · {t.format}
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-lg line-clamp-2">
              {t.title}
            </h1>
          </div>
        </div>

        {/* ─── Main Content ─── */}
        <div className="container mx-auto px-4 lg:px-8 pb-8">
          {/* Join Card (shows first on mobile) */}
          <div className="lg:hidden mt-5 rounded-2xl border border-primary/30 bg-card-gradient p-5 shadow-fire">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Prize Pool
                </div>
                {t.mode === "Solo" ? (
                  <div className="font-display text-lg sm:text-xl font-black text-fire-gradient flex items-center gap-1">
                    {t.per_kill_coin}/Kill | {t.first_place_coin} MVP{" "}
                    <GodCoin className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                ) : (
                  <div className="font-display text-3xl font-black text-fire-gradient flex items-center gap-1">
                    <GodCoin className="w-7 h-7" /> {t.prize.toLocaleString()}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Entry
                </div>
                <div className="font-display text-xl font-black flex items-center justify-end gap-1">
                  {t.entry === 0 ? (
                    "FREE"
                  ) : (
                    <>
                      <GodCoin className="w-5 h-5" /> {t.entry}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Slots bar */}
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-[10px] uppercase tracking-widest">
                <span className="text-muted-foreground">
                  {t.filled}/{t.slots} slots filled
                </span>
                <span className="text-primary">{t.startsAt || t.startsat}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-fire-gradient rounded-full"
                  style={{ width: `${fillPct}%` }}
                />
              </div>
            </div>

            {/* CTA */}
            {t.status === "locked" ? (
              <Button
                variant="outlineFire"
                size="lg"
                className="w-full font-display tracking-wider border-amber-500/50 text-amber-400"
                disabled
              >
                <Lock className="w-5 h-5 mr-2" /> TOURNAMENT LOCKED
              </Button>
            ) : isFull ? (
              <Button
                variant="outlineFire"
                size="lg"
                className="w-full font-display tracking-wider"
                disabled
              >
                SLOTS FULL
              </Button>
            ) : isJoined ? (
              <Button
                variant="outlineFire"
                size="lg"
                className="w-full font-display tracking-wider border-emerald-500/50 text-emerald-400"
                disabled
              >
                <CheckCircle2 className="w-5 h-5 mr-2" /> ALREADY JOINED
              </Button>
            ) : (
              <JoinBattleDialog
                tournamentId={t.id}
                tournamentTitle={t.title}
                mode={t.mode}
                entryFee={t.entry}
                trigger={
                  <Button variant="hero" size="lg" className="w-full font-display tracking-wider">
                    {t.entry === 0 ? (
                      "BOOK FREE SLOT"
                    ) : (
                      <span className="flex items-center gap-1.5">
                        PAY <GodCoin className="w-4 h-4" /> {t.entry} & JOIN
                      </span>
                    )}
                  </Button>
                }
              />
            )}

            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  toast.success("Link copied!");
                }}
                className="flex items-center justify-center gap-2 h-9 rounded-xl border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all text-sm font-semibold active:scale-95"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button
                onClick={() => toast.success("Added to watchlist 🔥")}
                className="flex items-center justify-center gap-2 h-9 rounded-xl border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all text-sm font-semibold active:scale-95"
              >
                <Heart className="w-4 h-4" /> Watch
              </button>
            </div>
          </div>

          {/* Room Card (mobile) */}
          <div className="lg:hidden mt-4 rounded-2xl border border-border/60 bg-card-gradient p-4">
            <div className="text-xs font-display uppercase tracking-widest text-primary mb-3">
              Match Room
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-secondary/60 border border-border/40">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  Room ID
                </div>
                {canViewRoom && t.room_id ? (
                  <div className="font-mono text-lg font-bold text-primary">{t.room_id}</div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span className="font-mono text-sm blur-sm select-none">●●●●●</span>
                  </div>
                )}
              </div>
              <div className="p-3 rounded-xl bg-secondary/60 border border-border/40">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  Password
                </div>
                {canViewRoom && t.room_pass ? (
                  <div className="font-mono text-lg font-bold text-primary">{t.room_pass}</div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span className="font-mono text-sm blur-sm select-none">●●●●</span>
                  </div>
                )}
              </div>
            </div>
            {!canViewRoom && (
              <p className="text-[10px] text-muted-foreground mt-3 text-center uppercase tracking-widest">
                🔒 Only registered players can unlock room details.
              </p>
            )}
          </div>

          {/* ─── Mobile Tab Bar ─── */}
          <div className="lg:hidden mt-5 flex gap-1 bg-secondary/60 p-1 rounded-xl border border-border/40">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2.5 text-xs font-display font-bold uppercase tracking-widest rounded-lg transition-all ${
                  activeTab === tab.key
                    ? "bg-card text-primary shadow border border-border/50"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ─── Desktop Layout ─── */}
          <div className="mt-6 flex flex-col lg:grid lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-4">
              {/* Info Tab */}
              <div className={`space-y-4 ${activeTab !== "info" ? "hidden lg:block" : ""}`}>
                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    {
                      icon: Trophy,
                      label: "Prize Pool",
                      value:
                        t.mode === "Solo" ? (
                          `${t.per_kill_coin}/Kill | ${t.first_place_coin} MVP`
                        ) : (
                          <span className="flex items-center gap-1">
                            <GodCoin className="w-4 h-4" /> {t.prize.toLocaleString()}
                          </span>
                        ),
                      highlight: true,
                    },
                    {
                      icon: Target,
                      label: "Entry Fee",
                      value:
                        t.entry === 0 ? (
                          "FREE"
                        ) : (
                          <span className="flex items-center gap-1">
                            <GodCoin className="w-4 h-4" /> {t.entry}
                          </span>
                        ),
                    },
                    { icon: Users, label: "Mode", value: t.mode },
                    { icon: Crosshair, label: "Format", value: t.format },
                    { icon: Calendar, label: "Starts", value: t.startsAt || t.startsat },
                    { icon: Shield, label: "Slots", value: `${t.filled} / ${t.slots}` },
                  ].map((d, i) => {
                    const Icon = d.icon;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/50"
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            {d.label}
                          </div>
                          <div
                            className={`font-display font-black text-sm truncate ${d.highlight ? "text-fire-gradient" : "text-foreground"}`}
                          >
                            {d.value}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* About */}
                <div className="rounded-2xl border border-border/60 bg-card-gradient p-5">
                  <div className="text-xs font-display uppercase tracking-widest text-primary mb-3">
                    About This Tournament
                  </div>
                  <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                    <p>
                      Welcome to the ultimate battleground!{" "}
                      <strong className="text-foreground">{t.title}</strong> is a high-stakes{" "}
                      {t.game} event where the best of the best compete for glory and a share of the{" "}
                      <span className="text-primary font-bold inline-flex items-center gap-1">
                        <GodCoin className="w-4 h-4" /> {t.prize.toLocaleString()}
                      </span>{" "}
                      prize pool.
                    </p>
                    <p>
                      Gather your squad, strategize your drops, and fight for survival in this
                      intense {t.mode} format. Whether you are a seasoned veteran or a rising star,
                      this is your chance to prove your worth.
                    </p>
                    <p>
                      Registration closes soon, and slots are strictly first-come, first-serve.
                      Prepare your loadouts and get ready to drop in.
                    </p>
                  </div>
                </div>

                {/* Rules in Info */}
                <div className="rounded-2xl border border-border/60 bg-card-gradient p-5">
                  <div className="text-xs font-display uppercase tracking-widest text-primary mb-4">
                    Tournament Rules
                  </div>
                  <ul className="space-y-3">
                    {[
                      "Players must verify their Free Fire UID before joining.",
                      "Room ID & password released 10 minutes before match start.",
                      "Submit screenshot proof of kills & placement after match.",
                      "Any form of hacking, teaming with enemies, or stream sniping = permanent ban.",
                      "Disputes handled by CLUTCHGROUND admin team. Verdicts are final.",
                      "Prize money credited to wallet within 24 hours of admin verification.",
                    ].map((r, i) => (
                      <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                        <span className="font-display font-black text-primary text-base shrink-0 w-6">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Registered Teams Tab */}
              <div className={`space-y-4 ${activeTab !== "registered" ? "hidden lg:block" : ""}`}>
                <div className="rounded-2xl border border-border/60 bg-card-gradient p-5">
                  <div className="text-xs font-display uppercase tracking-widest text-primary mb-3">
                    Registered Teams ({allRegistrations?.length || 0})
                  </div>
                  {allRegistrations && allRegistrations.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {allRegistrations.map((r: any, idx: number) => (
                        <div
                          key={r.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/40"
                        >
                          <div className="w-7 h-7 rounded-full bg-fire-gradient grid place-items-center font-display font-black text-xs text-white shrink-0">
                            {(r.team_name || r.username)?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm truncate">
                              {r.team_name || r.username}
                            </div>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-display">
                            #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No teams have registered yet. Be the first to join this tournament!</p>
                  )}
                </div>
              </div>

              {/* Prizes Tab */}
              <div className={`space-y-4 ${activeTab !== "prizes" ? "hidden lg:block" : ""}`}>
                <div className="rounded-2xl border border-border/60 bg-card-gradient p-5">
                  <div className="text-xs font-display uppercase tracking-widest text-primary mb-4">
                    Prize Distribution
                  </div>

                  <div className="text-sm text-muted-foreground mb-5 bg-secondary/30 p-4 rounded-xl border border-border/40">
                    <h4 className="font-bold text-foreground mb-1">How Prizes Are Awarded:</h4>
                    {t.mode === "Solo" ? (
                      <p>
                        In <strong>Solo</strong> mode, players are rewarded primarily for their
                        aggressive gameplay. Prizes are given based directly on your total Kills and
                        an extra bonus for being the Match MVP. Match placement still matters for
                        your overall ranking, but coins are earned directly through combat
                        performance!
                      </p>
                    ) : (
                      <p>
                        In <strong>{t.mode}</strong> mode, teams earn points based on their Match
                        Placement (e.g., 12 points for a BOOYAH) plus their total team Kills. After
                        all points are tallied, the top 3 teams on the overall leaderboard share the
                        total prize pool (50% to 1st, 30% to 2nd, and 20% to 3rd).
                      </p>
                    )}
                  </div>

                  {t.mode === "Solo" ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-4 rounded-xl border border-primary/40 bg-primary/5">
                        <span className="font-display font-bold tracking-wide text-sm">🥇 MVP</span>
                        <span className="font-display font-black text-fire-gradient text-lg flex items-center gap-1">
                          <GodCoin className="w-5 h-5" /> {t.first_place_coin}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/5">
                        <span className="font-display font-bold tracking-wide text-sm">
                          ⚔️ Per Kill
                        </span>
                        <span className="font-display font-black text-emerald-500 text-lg flex items-center gap-1">
                          <GodCoin className="w-5 h-5 text-emerald-500" /> {t.per_kill_coin}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {[
                        {
                          rank: "🥇 1st Place",
                          pct: 50,
                          color: "border-amber-500/40 bg-amber-500/5",
                        },
                        {
                          rank: "🥈 2nd Place",
                          pct: 30,
                          color: "border-slate-400/40 bg-slate-400/5",
                        },
                        {
                          rank: "🥉 3rd Place",
                          pct: 20,
                          color: "border-amber-700/40 bg-amber-700/5",
                        },
                      ].map((p) => (
                        <div
                          key={p.rank}
                          className={`flex items-center justify-between p-4 rounded-xl border ${p.color}`}
                        >
                          <span className="font-display font-bold tracking-wide text-sm">
                            {p.rank}
                          </span>
                          <span className="font-display font-black text-fire-gradient text-lg flex items-center gap-1">
                            <GodCoin className="w-5 h-5" />{" "}
                            {Math.round((t.prize * p.pct) / 100).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Standings Tab */}
              {t.status === "completed" && results && results.length > 0 && (
                <div className={`space-y-4 ${activeTab !== "standings" ? "hidden lg:block" : ""}`}>
                  <div className="rounded-2xl border border-border/60 bg-card-gradient overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                      <div className="text-xs font-display uppercase tracking-widest text-primary">
                        Final Standings
                      </div>
                      <Button
                        variant="outlineFire"
                        size="sm"
                        onClick={downloadStandings}
                        className="h-8 text-xs py-0"
                      >
                        <Download className="w-3 h-3 mr-1.5" /> Export
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-secondary/40 border-b border-border/40">
                          <tr>
                            <th className="px-4 py-3 font-display">#</th>
                            <th className="px-4 py-3 font-display">Team / Player</th>
                            <th className="px-4 py-3 font-display text-center">Kills</th>
                            <th className="px-4 py-3 font-display text-center">Pos</th>
                            <th className="px-4 py-3 font-display text-right text-primary">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((r: any, idx: number) => (
                            <tr
                              key={r.id}
                              className="border-b border-border/30 hover:bg-primary/5 transition-colors last:border-0"
                            >
                              <td className="px-4 py-3 font-display font-black text-muted-foreground text-sm">
                                {idx === 0
                                  ? "🥇"
                                  : idx === 1
                                    ? "🥈"
                                    : idx === 2
                                      ? "🥉"
                                      : `#${idx + 1}`}
                              </td>
                              <td className="px-4 py-3 font-bold text-foreground">
                                {r.team_name || r.username}
                              </td>
                              <td className="px-4 py-3 text-center">{r.kills || 0}</td>
                              <td className="px-4 py-3 text-center">{r.position || "-"}</td>
                              <td className="px-4 py-3 text-right font-display font-black text-fire-gradient text-base">
                                {r.points || 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ─── Right Sidebar (desktop only) ─── */}
            <div className="hidden lg:flex flex-col gap-4">
              {/* Join Card */}
              <div
                id="join-section-tour"
                className="rounded-2xl border border-primary/30 bg-card-gradient p-6 shadow-fire"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Prize Pool
                    </div>
                    {t.mode === "Solo" ? (
                      <div className="font-display text-lg sm:text-xl font-black text-fire-gradient flex items-center gap-1">
                        {t.per_kill_coin}/Kill | {t.first_place_coin} MVP{" "}
                        <GodCoin className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                    ) : (
                      <div className="font-display text-3xl font-black text-fire-gradient flex items-center gap-1">
                        <GodCoin className="w-7 h-7" /> {t.prize.toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Entry
                    </div>
                    <div className="font-display text-xl font-black flex items-center justify-end gap-1">
                      {t.entry === 0 ? (
                        "FREE"
                      ) : (
                        <>
                          <GodCoin className="w-5 h-5" /> {t.entry}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 mb-5">
                  <div className="flex justify-between text-[10px] uppercase tracking-widest">
                    <span className="text-muted-foreground">
                      {t.filled}/{t.slots} slots
                    </span>
                    <span className="text-primary">{t.startsAt || t.startsat}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-fire-gradient rounded-full"
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                </div>

                {isFull ? (
                  <Button
                    variant="outlineFire"
                    size="lg"
                    className="w-full font-display tracking-wider"
                    disabled
                  >
                    SLOTS FULL
                  </Button>
                ) : isJoined ? (
                  <Button
                    variant="outlineFire"
                    size="lg"
                    className="w-full font-display tracking-wider border-emerald-500/50 text-emerald-400"
                    disabled
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" /> ALREADY JOINED
                  </Button>
                ) : (
                  <JoinBattleDialog
                    tournamentId={t.id}
                    tournamentTitle={t.title}
                    mode={t.mode}
                    entryFee={t.entry}
                    trigger={
                      <Button
                        variant="hero"
                        size="lg"
                        className="w-full font-display tracking-wider"
                      >
                        {t.entry === 0 ? (
                          "BOOK FREE SLOT"
                        ) : (
                          <span className="flex items-center gap-1.5">
                            PAY <GodCoin className="w-5 h-5" /> {t.entry} & JOIN
                          </span>
                        )}
                      </Button>
                    }
                  />
                )}

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      toast.success("Link copied!");
                    }}
                    className="flex items-center justify-center gap-2 h-9 rounded-xl border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all text-sm font-semibold active:scale-95"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                  <button
                    onClick={() => toast.success("Added to watchlist 🔥")}
                    className="flex items-center justify-center gap-2 h-9 rounded-xl border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all text-sm font-semibold active:scale-95"
                  >
                    <Heart className="w-4 h-4" /> Watch
                  </button>
                </div>
              </div>

              {/* Room Card */}
              <div
                id="room-details-tour"
                className="rounded-2xl border border-border/60 bg-card-gradient p-5"
              >
                <div className="text-xs font-display uppercase tracking-widest text-primary mb-4">
                  Match Room
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-secondary/40 border border-border/40">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                      Room ID
                    </div>
                    {canViewRoom && t.room_id ? (
                      <div className="font-mono text-xl font-bold text-primary">{t.room_id}</div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Lock className="w-4 h-4" />
                        <span className="font-mono text-lg blur-sm select-none">●●●●●●</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/40 border border-border/40">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                      Password
                    </div>
                    {canViewRoom && t.room_pass ? (
                      <div className="font-mono text-xl font-bold text-primary">{t.room_pass}</div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Lock className="w-4 h-4" />
                        <span className="font-mono text-lg blur-sm select-none">●●●●●</span>
                      </div>
                    )}
                  </div>
                  {!canViewRoom && (
                    <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest">
                      🔒 Only registered players can unlock room details.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
