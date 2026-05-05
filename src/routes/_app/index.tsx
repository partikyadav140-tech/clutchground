import { createFileRoute, Link } from "@tanstack/react-router";
import { getTournaments, getGlobalLeaderboard } from "../../api";
import {
  Trophy,
  Users,
  Crown,
  Shield,
  Wallet,
  Bell,
  BarChart3,
  Smartphone,
  Flame,
  ChevronRight,
  Eye,
  Crosshair,
  Zap,
  Star,
  Radio,
  ArrowUpRight,
  ArrowDownToLine,
  Gamepad2,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { JoinBattleDialog } from "@/components/JoinBattleDialog";
import { useAuth } from "../../lib/auth-client";
import { GodCoin } from "@/components/GodCoin";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [{ title: "CLUTCHGROUND — Professional Esports Arena" }],
  }),
  loader: async () => {
    try {
      const ts = await getTournaments();
      const lb = await (getGlobalLeaderboard as any)();
      return { ts, lb };
    } catch (e: any) {
      return {
        ts: [],
        lb: [],
      };
    }
  },
  component: HomePage,
});

const POSTERS = [
  "/posters/poster1.jpg",
  "/posters/poster2.jpg",
  "/posters/poster3.jpg",
  "/posters/poster4.jpg",
  "/posters/poster5.jpg",
  "/posters/poster6.jpg",
];

function HomePage() {
  const { ts: allTournaments, lb: leaderboard } = Route.useLoaderData();
  const { user } = useAuth();

  const isCompleted = (t: any) =>
    String(t.status || "").trim().toLowerCase() === "completed";

  const displayTournaments = allTournaments.filter(
    (t: any) =>
      !isCompleted(t) &&
      Boolean(t.is_hero) &&
      t.is_hero !== "0" &&
      t.is_hero !== 0 &&
      t.is_hero !== "false" &&
      t.is_hero !== "f",
  );

  const upcomingTournaments = allTournaments.filter(
    (t: any) =>
      !isCompleted(t) &&
      (!Boolean(t.is_hero) ||
        t.is_hero === "0" ||
        t.is_hero === 0 ||
        t.is_hero === "false" ||
        t.is_hero === "f"),
  );

  const totalBalance = user
    ? ((user as any).deposit_balance || 0) + ((user as any).winning_balance || 0)
    : 0;

  const featuredScrollRef = useRef<HTMLDivElement>(null);
  const upcomingScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollFeatured = setInterval(() => {
      if (featuredScrollRef.current) {
        const el = featuredScrollRef.current;
        const firstChild = el.children[0] as HTMLElement;
        if (!firstChild) return;

        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollTo({ left: el.scrollLeft - el.scrollWidth / 2, behavior: "auto" });
        }
        setTimeout(() => {
          el.scrollBy({ left: firstChild.offsetWidth + 16, behavior: "smooth" });
        }, 50);
      }
    }, 3500);

    const scrollUpcoming = setInterval(() => {
      if (upcomingScrollRef.current) {
        const el = upcomingScrollRef.current;
        const firstChild = el.children[0] as HTMLElement;
        if (!firstChild) return;

        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollTo({ left: el.scrollLeft - el.scrollWidth / 2, behavior: "auto" });
        }
        setTimeout(() => {
          el.scrollBy({ left: firstChild.offsetWidth + 12, behavior: "smooth" });
        }, 50);
      }
    }, 4500);

    return () => {
      clearInterval(scrollFeatured);
      clearInterval(scrollUpcoming);
    };
  }, []);

  return (
    <div className="mb-safe pb-24 bg-background min-h-screen">
      {/* ─── Top Dashboard Area (Mobile First) ─── */}
      <div className="bg-white rounded-b-[2rem] shadow-[0_4px_24px_oklch(0_0_0/0.04)] pt-4 pb-6 px-4 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        {/* User Stats / Login Prompt */}
        <div className="relative z-10">
          {user ? (
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                  Welcome back,
                </p>
                <h1 className="text-xl font-display font-black text-foreground">{user.username}</h1>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                  Total Balance
                </p>
                <div className="flex items-center gap-1.5 justify-end">
                  <GodCoin className="w-5 h-5" />
                  <span className="text-xl font-display font-black text-primary">
                    {totalBalance}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-display font-black text-foreground mb-1">
                  Play. Win. Earn.
                </h1>
                <p className="text-sm text-muted-foreground">Join India's premium esports arena.</p>
              </div>
              <Link to="/login">
                <Button
                  variant="hero"
                  size="sm"
                  className="font-display tracking-wider rounded-full px-6 shadow-fire"
                >
                  LOGIN
                </Button>
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-3 mt-2">
            <QuickAction
              icon={Wallet}
              label="Add Cash"
              to="/wallet"
              color="bg-emerald-50 text-emerald-600 border-emerald-100"
            />
            <QuickAction
              icon={Trophy}
              label="Matches"
              to="/matches"
              color="bg-primary/10 text-primary border-primary/20"
            />
            <QuickAction
              icon={Users}
              label="Teams"
              to="/teams"
              color="bg-blue-50 text-blue-600 border-blue-100"
            />
            <QuickAction
              icon={Crown}
              label="Ranks"
              to="/leaderboard"
              color="bg-amber-50 text-amber-600 border-amber-100"
            />
          </div>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="px-4 mt-6 space-y-8 overflow-hidden">
        {/* Promotional Banner */}
        <div className="relative w-full px-1">
          <img
            src="/new-banner.png"
            alt="Hero Banner"
            className="w-full h-auto object-contain rounded-[1.5rem] shadow-xl border-4 border-white/50 bg-black/5"
          />
        </div>

        {/* Featured Tournaments (Horizontal Scroll) */}
        {displayTournaments.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-black text-lg text-foreground flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" /> Featured Tournaments
              </h3>
              <Link to="/tournaments" className="text-xs font-bold text-primary flex items-center">
                See All <ChevronRight className="w-3 h-3 ml-0.5" />
              </Link>
            </div>
            <div
              ref={featuredScrollRef}
              className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar -mx-4 px-4 pb-4 gap-4"
            >
              {[
                ...displayTournaments,
                ...displayTournaments,
                ...displayTournaments,
                ...displayTournaments,
              ].map((t: any, i: number) => (
                <FeaturedTournamentCard key={`featured-${t.id}-${i}`} t={t} i={i} />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Tournaments (Horizontal List) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-black text-lg text-foreground flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-purple" /> Upcoming Matches
            </h3>
            <Link to="/tournaments" className="text-xs font-bold text-purple flex items-center">
              View More <ChevronRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
          <div
            ref={upcomingScrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar -mx-4 px-4 pb-4 gap-3"
          >
            {upcomingTournaments.length > 0 ? (
              [
                ...upcomingTournaments,
                ...upcomingTournaments,
                ...upcomingTournaments,
                ...upcomingTournaments,
              ].map((t: any, i: number) => (
                <CompactTournamentCard key={`upcoming-${t.id}-${i}`} t={t} i={i} />
              ))
            ) : (
              <div className="p-6 bg-white rounded-2xl border border-border text-center w-full">
                <p className="text-sm text-muted-foreground font-semibold">
                  No upcoming tournaments right now.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  to,
  color,
}: {
  icon: any;
  label: string;
  to: string;
  color: string;
}) {
  return (
    <Link to={to} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${color} shadow-sm`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-[10px] font-bold text-foreground tracking-wide text-center">
        {label}
      </span>
    </Link>
  );
}

function FeaturedTournamentCard({ t, i }: { t: any; i: number }) {
  const poster = POSTERS[t.id % POSTERS.length];
  const fillPct = Math.min(100, (t.filled / t.slots) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: i * 0.1 }}
      className="shrink-0 w-[85vw] max-w-[320px] snap-center rounded-[1.25rem] bg-white border border-x-border border-t-border border-b-4 border-b-primary/30 shadow-md overflow-hidden flex flex-col hover:-translate-y-1 hover:border-b-[6px] hover:shadow-xl active:border-b-2 active:translate-y-1 transition-all duration-200"
    >
      <div className="relative h-32 w-full overflow-hidden">
        <img src={poster} alt={t.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute top-2 left-2 flex gap-2">
          {t.status === "live" && (
            <span className="px-2 py-0.5 rounded bg-red-500 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
            </span>
          )}
          <span className="px-2 py-0.5 rounded bg-white/20 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest border border-white/20">
            {t.mode}
          </span>
        </div>
      </div>

      <div className="p-3.5 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h4 className="font-display font-black text-base leading-tight line-clamp-1">
            {t.title}
          </h4>
          <div className="bg-primary/10 text-primary px-2 py-1 rounded-md text-[10px] font-black whitespace-nowrap flex items-center gap-1">
            {t.entry === 0 ? (
              "FREE"
            ) : (
              <>
                <GodCoin className="w-3 h-3" /> {t.entry}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
          <div className="flex items-center gap-1">
            <Trophy className="w-3 h-3 text-primary" />{" "}
            {t.mode === "Solo" ? (
              <span className="flex items-center gap-1">
                {t.per_kill_coin}/Kill | {t.first_place_coin} MVP <GodCoin className="w-3 h-3" />
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <GodCoin className="w-3 h-3" /> {t.prize}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-primary" /> {t.format}
          </div>
        </div>

        <div className="mt-auto">
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1.5">
            <span>
              {t.filled}/{t.slots} Joined
            </span>
            <span className="text-primary flex items-center gap-1">
              <Clock className="w-3 h-3" /> {t.startsAt || t.startsat}
            </span>
          </div>
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${fillPct}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link to="/tournaments/$id" params={{ id: String(t.id) }} className="w-full">
              <Button
                variant="outline"
                className="w-full h-9 rounded-xl font-bold text-xs bg-white border-border"
              >
                Details
              </Button>
            </Link>
            {t.filled >= t.slots ? (
              <Button
                disabled
                className="w-full h-9 rounded-xl font-bold text-xs bg-muted text-muted-foreground"
              >
                Full
              </Button>
            ) : (
              <JoinBattleDialog
                tournamentId={t.id}
                tournamentTitle={t.title}
                mode={t.mode as any}
                entryFee={t.entry}
                trigger={
                  <Button className="w-full h-9 rounded-xl font-bold text-xs bg-primary text-white shadow-primary">
                    Join
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CompactTournamentCard({ t, i }: { t: any; i: number }) {
  const poster = POSTERS[t.id % POSTERS.length];
  const fillPct = Math.min(100, (t.filled / t.slots) * 100);
  const startsAt = t.startsAt || t.startsat || "TBA";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: i * 0.06 }}
      className="shrink-0 w-[86vw] max-w-[340px] snap-center overflow-hidden rounded-[1.75rem] bg-slate-950 shadow-[0_26px_60px_-30px_rgba(15,23,42,0.9)] ring-1 ring-white/10"
    >
      <div className="relative h-40 overflow-hidden">
        <img src={poster} alt="Upcoming match" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/20 to-transparent" />
        <div className="absolute left-4 bottom-4 right-4 rounded-3xl bg-slate-900/95 border border-white/10 p-3 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.3em] text-slate-400 font-semibold mb-1">
                {t.format} • {t.mode}
              </p>
              <h4 className="text-base font-display font-black text-white leading-tight line-clamp-2">
                {t.title}
              </h4>
            </div>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">
              {t.entry === 0 ? "FREE" : "PAID"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3 text-[9px] uppercase tracking-[0.2em] text-slate-400 font-semibold">
            <div className="rounded-3xl bg-slate-950/80 px-3 py-2">
              <div className="text-[8px]">Starts</div>
              <div className="mt-1 text-sm text-white font-black">{startsAt}</div>
            </div>
            <div className="rounded-3xl bg-slate-950/80 px-3 py-2">
              <div className="text-[8px]">Slots</div>
              <div className="mt-1 text-sm text-white font-black">{t.filled}/{t.slots}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 bg-slate-950">
        <div className="flex flex-col gap-4 mb-4">
          <div className="grid grid-cols-[1.4fr_1fr] gap-3">
            <div className="rounded-3xl bg-slate-900/75 p-3">
              <p className="text-[9px] uppercase tracking-[0.26em] text-slate-400 font-semibold">
                Prize
              </p>
              <p className="mt-1 text-sm font-black text-white flex items-center gap-2">
                {t.mode === "Solo" ? (
                  <>
                    <GodCoin className="w-4 h-4" />
                    {t.entry === 0 ? "Free Battle" : `${t.entry} entry`}
                  </>
                ) : (
                  <>
                    <GodCoin className="w-4 h-4" />
                    {t.prize || "TBD"}
                  </>
                )}
              </p>
            </div>
            <div className="rounded-3xl bg-slate-900/75 p-3">
              <p className="text-[9px] uppercase tracking-[0.26em] text-slate-400 font-semibold">
                Fill Rate
              </p>
              <p className="mt-1 text-sm font-black text-primary">{fillPct}%</p>
            </div>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 transition-all"
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>

        <Link to="/tournaments/$id" params={{ id: String(t.id) }}>
          <Button className="w-full rounded-3xl bg-primary text-white font-black h-11 shadow-[0_18px_45px_-20px_rgba(56,189,248,0.8)]">
            View Match
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
