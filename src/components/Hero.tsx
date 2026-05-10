import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Trophy, Zap, ChevronDown, Flame, Star } from "lucide-react";
import { JoinBattleDialog } from "./JoinBattleDialog";
import { useAuth } from "../lib/auth-client";
import { toast } from "sonner";

const stats = [
  { v: "120K+", l: "Players", icon: "👾" },
  { v: "50L+ Coins", l: "Prize Pool", icon: "💰" },
  { v: "850+", l: "Matches", icon: "⚔️" },
  { v: "24/7", l: "Support", icon: "🔥" },
];

export function Hero() {
  const reduce = useReducedMotion();
  const { user } = useAuth();

  const t = (delay: number, duration = 0.6) => ({
    duration: reduce ? 0 : duration,
    delay: reduce ? 0 : delay,
    ease: [0.22, 1, 0.36, 1] as const,
  });

  return (
    <section className="relative w-full min-h-[100svh] overflow-hidden bg-background">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        <img
          src="/hero-banner.png"
          alt="Hero Banner"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-60"
        />
        {/* Gradient overlays for mobile readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/20 to-background z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent z-10 hidden sm:block" />
      </div>

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 grid-bg opacity-[0.08] z-10 pointer-events-none" />

      {/* Decorative accent lines */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-fire-gradient z-20 opacity-80" />

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 lg:px-8 min-h-[100svh] flex flex-col justify-end pb-28 sm:pb-24 sm:justify-center sm:pt-28 pt-24">
        <div className="max-w-4xl w-full mx-auto lg:mx-0">
          {/* Live Season Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={t(0.1)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/40 bg-primary/10 backdrop-blur-md mb-5"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-[11px] font-display tracking-[0.2em] text-cta uppercase font-bold">
              Season 7 · Live Now
            </span>
            <Flame className="w-3.5 h-3.5 text-cta animate-flicker" />
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={t(0.2)}
            className="font-display font-black leading-[0.9] tracking-tighter"
          >
            <span className="block text-4xl sm:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl text-foreground drop-shadow-lg">
              BECOME A
            </span>
            <span className="block text-5xl sm:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl text-fire-gradient filter drop-shadow-[0_0_20px_oklch(0.65_0.28_320/0.4)]">
              LEGEND
            </span>
            <span className="block text-3xl sm:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl text-foreground/90 drop-shadow-lg">
              OF THE ARENA
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={t(0.35)}
            className="mt-4 sm:mt-6 max-w-sm sm:max-w-xl lg:max-w-2xl text-sm sm:text-base lg:text-lg text-muted-foreground/90 leading-relaxed"
          >
            India's most elite Free Fire esports platform. Compete in high-stakes tournaments &amp;
            win real cash prizes.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={t(0.5)}
            className="mt-7 flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
          >
            {user ? (
              <JoinBattleDialog
                mode="Squad"
                trigger={
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full sm:w-auto font-display tracking-widest text-base h-13 sm:h-14 shadow-fire"
                  >
                    <Trophy className="w-5 h-5" /> JOIN BATTLE
                  </Button>
                }
              />
            ) : (
              <Button
                asChild
                variant="hero"
                size="lg"
                className="w-full sm:w-auto font-display tracking-widest text-base h-13 sm:h-14 shadow-fire"
              >
                <a href="/login">
                  <Trophy className="w-5 h-5" /> JOIN BATTLE
                </a>
              </Button>
            )}
            <Button
              asChild
              variant="outlineFire"
              size="lg"
              className="w-full sm:w-auto font-display tracking-widest text-base h-13 sm:h-14 bg-background/30 backdrop-blur-md"
            >
              <a href="/tournaments">
                <Zap className="w-5 h-5" /> VIEW TOURNAMENTS
              </a>
            </Button>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={t(0.7)}
            className="mt-10 grid grid-cols-4 gap-2 sm:gap-4 max-w-sm sm:max-w-lg lg:max-w-xl mx-auto lg:mx-0"
          >
            {stats.map((s, i) => (
              <div
                key={i}
                className="relative flex flex-col items-center text-center p-2.5 sm:p-4 rounded-xl bg-card/40 backdrop-blur-xl border border-primary/20 overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-0.5 bg-fire-gradient opacity-60" />
                <div className="text-base sm:text-xl mb-0.5">{s.icon}</div>
                <div className="font-display text-base sm:text-2xl font-black text-white text-glow leading-tight">
                  {s.v}
                </div>
                <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-cta/80 font-bold mt-0.5">
                  {s.l}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator - desktop only */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{
          opacity: { delay: 1.5, duration: 0.6 },
          y: { duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 1.5 },
        }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 hidden sm:flex flex-col items-center gap-1 text-cta/60"
      >
        <span className="text-[10px] font-display uppercase tracking-[0.3em]">Scroll</span>
        <ChevronDown className="w-4 h-4" />
      </motion.div>
    </section>
  );
}
