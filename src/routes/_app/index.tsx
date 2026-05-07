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

  const isLocked = (t: any) =>
    String(t.status || "").trim().toLowerCase() === "locked";

  const displayTournaments = allTournaments.filter(
    (t: any) =>
      !isCompleted(t) &&
      !isLocked(t) &&
      Boolean(t.is_hero) &&
      t.is_hero !== "0" &&
      t.is_hero !== 0 &&
      t.is_hero !== "false" &&
      t.is_hero !== "f",
  );

  const upcomingTournaments = allTournaments.filter(
    (t: any) =>
      !isCompleted(t) &&
      !isLocked(t) &&
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
      <div className="bg-white rounded-b-[2rem] lg:rounded-b-[3rem] shadow-[0_4px_24px_oklch(0_0_0/0.04)] pt-4 pb-6 px-4 lg:px-8 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        {/* User Stats / Login Prompt */}
        <div className="relative z-10 max-w-7xl mx-auto">
          {user ? (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                    Welcome back,
                  </p>
                  <h1 className="text-xl lg:text-2xl font-display font-black text-foreground">{user.username}</h1>
                </div>
                <div className="hidden lg:block text-right">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                    Total Balance
                  </p>
                  <div className="flex items-center gap-1.5 justify-end">
                    <GodCoin className="w-5 h-5" />
                    <span className="text-xl font-sans font-semibold tabular-nums text-primary">
                      {totalBalance}
                    </span>
                  </div>
                </div>
              </div>
              <div className="lg:hidden text-right">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                  Total Balance
                </p>
                <div className="flex items-center gap-1.5 justify-end">
                  <GodCoin className="w-5 h-5" />
                  <span className="text-xl font-sans font-semibold tabular-nums text-primary">
                    {totalBalance}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-display font-black text-foreground mb-1">
                  Play. Win. Earn.
                </h1>
                <p className="text-sm lg:text-base text-muted-foreground">Join India's premium esports arena.</p>
              </div>
              <Link to="/login">
                <Button
                  variant="hero"
                  size="sm"
                  className="font-display tracking-wider rounded-full px-6 lg:px-8 shadow-fire w-full lg:w-auto"
                >
                  LOGIN
                </Button>
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-3 mt-2 max-w-md lg:max-w-none">
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
      <div className="px-4 lg:px-8 mt-6 space-y-8 lg:space-y-12 overflow-hidden">
        {/* Hero Banner - Full Rectangle */}
        <div className="relative w-full overflow-hidden rounded-[1.75rem] lg:rounded-[2rem] border border-white/10 shadow-[0_35px_75px_-35px_rgba(15,23,42,0.45)] bg-slate-950">
          <img
            src="/new-banner.png"
            alt="Hero Banner"
            className="w-full h-auto max-h-[40rem] lg:max-h-[50rem] object-contain object-center"
          />
        </div>

        {/* Featured Tournaments */}
        {displayTournaments.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <h3 className="font-display font-black text-lg lg:text-2xl text-foreground flex items-center gap-2">
                <Flame className="w-5 h-5 lg:w-6 lg:h-6 text-primary" /> Featured Tournaments
              </h3>
              <Link to="/tournaments" className="text-xs lg:text-sm font-bold text-primary flex items-center hover:text-primary/80 transition-colors">
                See All <ChevronRight className="w-3 h-3 lg:w-4 lg:h-4 ml-0.5" />
              </Link>
            </div>
            {/* Desktop: Grid Layout */}
            <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {displayTournaments.slice(0, 8).map((t: any, i: number) => (
                <DesktopTournamentCard key={`featured-desktop-${t.id}`} t={t} i={i} />
              ))}
            </div>
            {/* Mobile: Horizontal Scroll */}
            <div
              ref={featuredScrollRef}
              className="lg:hidden flex overflow-x-auto snap-x snap-mandatory hide-scrollbar -mx-4 px-4 pb-4 gap-4"
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

        {/* Upcoming Tournaments */}
        <div>
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h3 className="font-display font-black text-lg lg:text-2xl text-foreground flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 lg:w-6 lg:h-6 text-purple" /> Upcoming Matches
            </h3>
            <Link to="/tournaments" className="text-xs lg:text-sm font-bold text-purple flex items-center hover:text-purple/80 transition-colors">
              View More <ChevronRight className="w-3 h-3 lg:w-4 lg:h-4 ml-0.5" />
            </Link>
          </div>
          {/* Desktop: Grid Layout */}
          <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {upcomingTournaments.slice(0, 8).map((t: any, i: number) => (
              <DesktopTournamentCard key={`upcoming-desktop-${t.id}`} t={t} i={i} />
            ))}
          </div>
          {/* Mobile: Horizontal Scroll */}
          <div
            ref={upcomingScrollRef}
            className="lg:hidden flex overflow-x-auto snap-x snap-mandatory hide-scrollbar -mx-4 px-4 pb-4 gap-4"
          >
            {upcomingTournaments.length > 0 ? (
              [
                ...upcomingTournaments,
                ...upcomingTournaments,
                ...upcomingTournaments,
                ...upcomingTournaments,
              ].map((t: any, i: number) => (
                <FeaturedTournamentCard key={`upcoming-${t.id}-${i}`} t={t} i={i} />
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

function DesktopTournamentCard({ t, i }: { t: any; i: number }) {
  const poster = POSTERS[t.id % POSTERS.length];
  const fillPct = Math.min(100, (t.filled / t.slots) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: i * 0.1 }}
      className="group bg-white rounded-2xl border border-border shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden"
    >
      <div className="relative h-48 overflow-hidden">
        <img src={poster} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute top-4 left-4 flex gap-2">
          {t.status === "live" && (
            <span className="px-3 py-1 rounded-full bg-red-500 text-white text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Live
            </span>
          )}
          <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-widest border border-white/20">
            {t.mode}
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black whitespace-nowrap flex items-center gap-1.5">
            {t.entry === 0 ? (
              "FREE"
            ) : (
              <>
                <GodCoin className="w-4 h-4" /> {t.entry}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-4">
          <h4 className="font-display font-black text-xl leading-tight line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {t.title}
          </h4>
          <div className="flex items-center gap-4 text-sm font-bold text-muted-foreground uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-primary" />{" "}
              {t.mode === "Solo" ? (
                <span className="flex items-center gap-1">
                  {t.per_kill_coin}/Kill | {t.first_place_coin} MVP <GodCoin className="w-3.5 h-3.5" />
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <GodCoin className="w-3.5 h-3.5" /> {t.prize}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" /> {t.format}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm font-bold text-muted-foreground mb-2">
            <span>
              {t.filled}/{t.slots} Joined
            </span>
            <span className="text-primary flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> {t.startsAt || t.startsat}
            </span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link to="/tournaments/$id" params={{ id: String(t.id) }}>
            <Button
              variant="outline"
              className="w-full h-11 rounded-xl font-bold text-sm bg-white border-border hover:bg-secondary/50 transition-colors"
            >
              Details
            </Button>
          </Link>
          {t.filled >= t.slots ? (
            <Button
              disabled
              className="w-full h-11 rounded-xl font-bold text-sm bg-muted text-muted-foreground"
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
                <Button className="w-full h-11 rounded-xl font-bold text-sm bg-primary text-white shadow-primary hover:shadow-primary/80 transition-shadow">
                  Join
                </Button>
              }
            />
          )}
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
      className="shrink-0 w-[86vw] max-w-[360px] snap-center overflow-hidden rounded-[1.75rem] bg-white border border-border shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
    >
      <div className="relative h-44 overflow-hidden">
        <img src={poster} alt={t.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
            {t.mode}
          </span>
          <span className="rounded-full bg-white/90 text-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
            {t.format}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h4 className="font-display font-black text-base text-foreground leading-tight line-clamp-2">
              {t.title}
            </h4>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground mt-2">
              {startsAt}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950/95 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">
            {t.entry === 0 ? "FREE" : "ENTRY"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
          <div className="rounded-3xl bg-slate-100 p-3">
            <div className="text-[10px] uppercase tracking-[0.22em] font-bold text-slate-500">
              Prize Pool
            </div>
            <div className="mt-2 font-black text-foreground flex items-center gap-2">
              <GodCoin className="w-4 h-4" />
              {t.mode === "Solo" ? (t.per_kill_coin || t.first_place_coin ? `${t.per_kill_coin}/kill` : "TBD") : t.prize || "TBD"}
            </div>
          </div>
          <div className="rounded-3xl bg-slate-100 p-3">
            <div className="text-[10px] uppercase tracking-[0.22em] font-bold text-slate-500">
              Fill Rate
            </div>
            <div className="mt-2 font-black text-primary">{fillPct}%</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-violet-500 transition-all"
              style={{ width: `${fillPct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-slate-500 font-bold">
            <span>{fillPct}% Filled</span>
            <span>{t.filled}/{t.slots}</span>
          </div>
        </div>

        <Link to="/tournaments/$id" params={{ id: String(t.id) }}>
          <Button className="mt-4 w-full h-11 rounded-3xl bg-primary text-white font-black shadow-primary">
            View Match
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
