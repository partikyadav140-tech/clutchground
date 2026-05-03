import { createFileRoute, Link } from "@tanstack/react-router";
import { Hero } from "@/components/Hero";
import { getTournaments, getGlobalLeaderboard } from "../../api";
import { Trophy, Users, Crown, Radio, Shield, Wallet, MessageCircle, Bell, BarChart3, Smartphone, Flame, ChevronRight, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { JoinBattleDialog } from "@/components/JoinBattleDialog";
import { useEffect, useRef } from "react";
import { useAuth } from "../../lib/auth-client";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "CLUTCHGROUND — India's #1 Free Fire Tournament Arena" },
      { name: "description", content: "Compete in Free Fire & Free Fire MAX tournaments. Solo, duo, squad battles. Real cash prizes, live leaderboard, anti-cheat protection." },
      { property: "og:title", content: "CLUTCHGROUND — Rule the Battleground" },
      { property: "og:description", content: "India's most fierce Free Fire esports league." },
    ],
  }),
  loader: async () => {
    try {
      const ts = await getTournaments();
      const lb = await (getGlobalLeaderboard as any)();
      return { ts, lb };
    } catch (e: any) {
      return { ts: [{ 
        id: 0, 
        title: 'ERROR: ' + e.message, 
        game: String(e.stack || e),
        mode: "Error",
        format: "Error",
        entry: 0,
        prize: 0,
        slots: 0,
        filled: 0,
        startsAt: "Error",
        status: "open",
        banner: "from-red-600 to-red-900"
      }], lb: [] };
    }
  },
  component: HomePage,
});

const features = [
  { icon: Trophy, title: "Tournaments", desc: "Solo, duo & squad. Battle Royale, knockout, league formats.", to: "/tournaments" },
  { icon: Crown, title: "Leaderboard", desc: "Global, weekly & monthly rankings with ELO/MMR.", to: "/leaderboard" },
  { icon: Users, title: "Teams & Clans", desc: "Create or join teams. Captain controls & roster management.", to: "/teams" },
  { icon: Radio, title: "Live Streaming", desc: "Watch matches embedded from YouTube & Twitch.", to: "/live" },
  { icon: Shield, title: "Anti-Cheat", desc: "Screenshot validation, report system, admin review.", to: "/anti-cheat" },
  { icon: Wallet, title: "Wallet & Prizes", desc: "Add funds, pay entry fees, withdraw winnings.", to: "/wallet" },
  { icon: BarChart3, title: "Match Stats", desc: "Kill points, placement points, full match history.", to: "/profile" },
  { icon: Bell, title: "Notifications", desc: "Email, SMS, in-app alerts for match reminders & results.", to: "/profile" },
  { icon: MessageCircle, title: "Community", desc: "Forums, comments, follow players & clans.", to: "/community" },
  { icon: Smartphone, title: "Mobile First", desc: "PWA, blazing fast on every screen size.", to: "/" },
];

function MobileSlider({ children, autoSlide = false, marquee = false }: { children: React.ReactNode, autoSlide?: boolean, marquee?: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!autoSlide || !scrollRef.current || marquee) return;
    const el = scrollRef.current;
    let idx = 0;
    const interval = setInterval(() => {
      if (!el) return;
      const childrenArray = Array.from(el.children) as HTMLElement[];
      const childWidth = childrenArray[0]?.offsetWidth || 0;
      const gap = parseInt(window.getComputedStyle(el).gap) || 0;
      
      if (childWidth) {
        idx++;
        if (idx >= el.children.length) {
          el.scrollTo({ left: 0, behavior: 'auto' });
          idx = 0;
        } else {
          el.scrollTo({ left: idx * (childWidth + gap), behavior: 'smooth' });
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [autoSlide, marquee]);

  if (marquee) {
    return (
      <div className="relative overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-4 animate-marquee hover:[animation-play-state:paused] active:[animation-play-state:paused] w-max">
          <div className="flex gap-4 shrink-0">
            {children}
          </div>
          <div className="flex gap-4 shrink-0">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
      {children}
    </div>
  );
}

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
  const displayTournaments = allTournaments.filter((t: any) => Boolean(t.is_hero) && t.is_hero !== '0' && t.is_hero !== 0 && t.is_hero !== 'false' && t.is_hero !== 'f').slice(0, 4);

  return (
    <>
      <Hero />

      {/* Marquee */}
      <div className="relative overflow-hidden border-y border-border/60 bg-card/40 py-4">
        <div className="flex gap-12 animate-marquee whitespace-nowrap">
          {[...Array(2)].map((_, k) => (
            <div key={k} className="flex gap-12 items-center shrink-0">
              {["⚔ NEW SEASON LIVE", "🔥 ₹50L PRIZE POOL", "👑 GOD CHAMPIONS CUP TONIGHT", "🎯 1500+ DAILY MATCHES", "💀 NO MERCY · NO EXCUSES", "⚡ INSTANT PAYOUTS"].map((t, i) => (
                <span key={i} className="font-display text-sm md:text-base tracking-[0.2em] text-fire-gradient">{t}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Live Tournaments */}
      <Section title="Hero Tournaments" subtitle="The biggest battles of the season." cta={{ label: "View All", to: "/tournaments" }}>
        {displayTournaments.length === 0 ? (
          <div className="text-center py-12 border border-border bg-secondary/40 clip-notch">
            <Trophy className="w-12 h-12 text-muted-foreground opacity-30 mx-auto mb-4" />
            <p className="text-muted-foreground font-display tracking-wider">No Hero Tournaments selected.</p>
            <p className="text-xs text-muted-foreground mt-2">Admins can feature tournaments here from the Admin Panel.</p>
          </div>
        ) : (
          <MobileSlider autoSlide={true}>
            {displayTournaments.map((t: any, i: number) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="shrink-0 w-[85vw] sm:w-auto snap-center group relative bg-card-gradient border border-border hover:border-primary/60 transition-all clip-notch overflow-hidden active:scale-[0.98]"
            >
              <div 
                className="h-32 relative overflow-hidden bg-cover bg-center" 
                style={{ backgroundImage: `url(${POSTERS[t.id % POSTERS.length]})` }}
              >
                <div className="absolute inset-0 grid-bg opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                {t.status === "live" && (
                  <span className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-destructive text-destructive-foreground text-[10px] font-display font-bold uppercase tracking-widest z-10">
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" /> Live
                  </span>
                )}
                <span className="absolute bottom-3 left-4 font-display text-xs uppercase tracking-[0.2em] text-white/90 drop-shadow-md z-10">{t.game}</span>
              </div>
              <div className="p-5 space-y-3">
                <h3 className="font-display text-lg sm:text-xl font-black tracking-wide text-foreground group-hover:text-primary transition-colors">{t.title}</h3>
                <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-widest font-bold">
                  <span className="px-2 py-1 bg-secondary border border-border">{t.mode}</span>
                  <span className="px-2 py-1 bg-secondary border border-border">{t.format}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Prize Pool</div>
                    <div className="font-display text-lg font-black text-fire-gradient">₹{t.prize.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Entry</div>
                    <div className="font-display text-lg font-black text-foreground">{t.entry === 0 ? "FREE" : `₹${t.entry}`}</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] uppercase tracking-widest">
                    <span className="text-muted-foreground">{t.filled}/{t.slots} slots</span>
                    <span className="text-primary">{t.startsAt}</span>
                  </div>
                  <div className="h-1.5 bg-secondary overflow-hidden">
                    <div className="h-full bg-fire-gradient" style={{ width: `${(t.filled / t.slots) * 100}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Button asChild variant="outlineFire" className="w-full">
                    <Link to="/tournaments/$id" params={{ id: String(t.id) }}>
                      <Eye className="w-4 h-4 mr-1" /> View
                    </Link>
                  </Button>
                  {t.filled >= t.slots ? (
                    <Button variant="outlineFire" className="w-full" disabled>Full</Button>
                  ) : (
                    <JoinBattleDialog
                      tournamentId={t.id}
                      tournamentTitle={t.title}
                      mode={t.mode as any}
                      entryFee={t.entry}
                      trigger={<Button variant="hero" className="w-full">Join</Button>}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </MobileSlider>
        )}
        <div className="mt-6 text-center sm:hidden">
          <Link to="/tournaments">
            <Button variant="outlineFire" className="w-full">View All Tournaments</Button>
          </Link>
        </div>
      </Section>

      {/* Features grid */}
      <Section title="Built For Champions" subtitle="Every feature you need to dominate the arena.">
        <MobileSlider marquee={true}>
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (i % 5) * 0.05 }}
                className="shrink-0 w-[70vw] sm:w-auto snap-center active:scale-[0.98] transition-transform"
              >
                <Link to={f.to} className="block h-full p-5 bg-card-gradient border border-border hover:border-primary/60 hover:shadow-fire transition-all clip-notch group">
                  <Icon className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-display font-bold text-base uppercase tracking-wider mb-1">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </Link>
              </motion.div>
            );
          })}
        </MobileSlider>
      </Section>

      {/* Top players preview */}
      <Section title="Hall Of Fame" subtitle="The top warriors this season." cta={{ label: "Full Leaderboard", to: "/leaderboard" }}>
        <div className="bg-card-gradient border border-border clip-notch overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 sm:px-6 py-3 border-b border-border/60 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            <div className="col-span-1">#</div>
            <div className="col-span-6 sm:col-span-7">Team</div>
            <div className="col-span-2 sm:col-span-2 text-right">Kills</div>
            <div className="col-span-3 sm:col-span-2 text-right">Points</div>
          </div>
          {leaderboard.slice(0, 5).map((p: any) => (
            <div key={p.rank} className="grid grid-cols-12 gap-2 px-4 sm:px-6 py-3 border-b border-border/30 last:border-0 hover:bg-primary/5 transition-colors items-center">
              <div className="col-span-1">
                <span className={`font-display font-black text-lg ${p.rank === 1 ? "text-fire-gradient" : p.rank <= 3 ? "text-primary" : "text-muted-foreground"}`}>
                  {p.rank}
                </span>
              </div>
              <div className="col-span-6 sm:col-span-7 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-fire-gradient grid place-items-center font-display font-black text-xs text-primary-foreground">
                  {p.team ? p.team[0].toUpperCase() : 'T'}
                </div>
                <div className="min-w-0">
                  <div className="font-bold truncate">{p.team || "Unknown Team"}</div>
                </div>
              </div>
              <div className="col-span-2 sm:col-span-2 text-right font-mono text-sm">{p.kills || 0}</div>
              <div className="col-span-3 sm:col-span-2 text-right font-display font-bold text-primary">{p.points.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <section className="container mx-auto px-4 lg:px-8 py-20 lg:py-28">
        <div className="relative overflow-hidden bg-card-gradient border border-primary/40 clip-notch p-8 sm:p-12 lg:p-20 text-center shadow-fire">
          <div className="absolute inset-0 grid-bg opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blood/10" />
          <div className="relative z-10 max-w-3xl mx-auto">
            <Flame className="w-12 h-12 text-primary mx-auto mb-6 animate-flicker" />
            <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4">
              <span className="text-foreground">{user ? "READY FOR THE" : "YOUR THRONE"}</span><br />
              <span className="text-fire-gradient">{user ? "NEXT BATTLE?" : "AWAITS."}</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-xl mx-auto">
              {user ? "Your loadout is set and the squad is waiting. Enter a tournament and dominate the leaderboards." : "Sign up free. Verify your Free Fire UID. Enter your first tournament in under 60 seconds."}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {!user ? (
                <Link to="/signup"><Button variant="hero" size="xl" className="font-display tracking-wider">CLAIM YOUR CROWN</Button></Link>
              ) : (
                <Link to="/tournaments"><Button variant="hero" size="xl" className="font-display tracking-wider">BROWSE BATTLES</Button></Link>
              )}
              {!user && (
                <Link to="/tournaments"><Button variant="ghost" size="xl" className="font-display tracking-wider">BROWSE BATTLES</Button></Link>
              )}
            </div>
          </div>
        </div>
      </section>
      <div id="debug-is-hero" style={{ display: 'none' }}>
        DEBUG: {JSON.stringify(allTournaments.map((t: any) => ({ id: t.id, is_hero: t.is_hero, typeof: typeof t.is_hero })))}
      </div>
    </>
  );
}

function Section({ title, subtitle, cta, children }: { title: string; subtitle?: string; cta?: { label: string; to: string }; children: React.ReactNode }) {
  return (
    <section className="container mx-auto px-4 lg:px-8 py-16 lg:py-24">
      <div className="flex items-end justify-between mb-8 lg:mb-12 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="w-8 h-px bg-primary" />
            <span className="text-xs font-display tracking-[0.3em] text-primary uppercase">{subtitle ?? "Section"}</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground">{title}</h2>
        </div>
        {cta && (
          <Link to={cta.to} className="hidden sm:inline-flex items-center gap-1 text-sm font-display tracking-wider uppercase text-primary hover:gap-2 transition-all">
            {cta.label} <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
