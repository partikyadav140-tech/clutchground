import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import heroBgAsset from "@/assets/hero-bg.jpg";
import { Button } from "./ui/button";
import { Link } from "@tanstack/react-router";
import { Trophy, Zap, ChevronDown } from "lucide-react";
import { JoinBattleDialog } from "./JoinBattleDialog";
import { useAuth } from "../lib/auth-client";
import { toast } from "sonner";

export function Hero() {
  const reduce = useReducedMotion();
  const [ended, setEnded] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setEnded(true);
  }, []);

  const t = (delay: number, duration = 0.7) => ({
    duration: reduce ? 0 : duration,
    delay: reduce ? 0 : delay,
    ease: [0.22, 1, 0.36, 1] as const,
  });

  return (
    <section className="relative w-full min-h-[100svh] overflow-hidden bg-background">
      {/* Background Media */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40"
          style={{
            width: '100vw',
            height: '56.25vw', // 16:9 aspect ratio
            minHeight: '100vh',
            minWidth: '177.77vh', // 16:9 aspect ratio
            transform: 'translate(-50%, -50%) scale(1.35)' // Scale up to hide UI elements
          }}
        >
          <iframe
            src="https://www.youtube.com/embed/JDY8XkebaeA?autoplay=1&mute=1&loop=1&playlist=JDY8XkebaeA&controls=0&showinfo=0&modestbranding=1&rel=0&playsinline=1&disablekb=1&fs=0&iv_load_policy=3&vq=hd1080"
            title="Hero Background"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style={{ border: 0 }}
          />
        </div>
        
        {/* Advanced gradients for text readability on all screens */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/20 to-background z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent sm:from-transparent sm:bg-gradient-to-r sm:from-background/95 sm:via-background/60 sm:to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] z-10 pointer-events-none" />
      </div>

      {/* Cyberpunk grid overlay */}
      <div className="absolute inset-0 grid-bg opacity-[0.15] z-10 pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-20 container mx-auto px-4 lg:px-8 min-h-[100svh] flex flex-col justify-center pt-24 pb-20 sm:pt-32 sm:pb-24 pointer-events-none">
        
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left max-w-4xl mx-auto sm:mx-0 w-full mt-auto mb-auto pointer-events-auto">
          {/* Live Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={t(0.2)}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-primary/50 bg-primary/20 backdrop-blur-md mb-4 sm:mb-6 shadow-[0_0_15px_rgba(255,0,255,0.3)]"
          >
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-[10px] sm:text-xs font-display tracking-[0.2em] sm:tracking-[0.25em] text-white uppercase">Season 7 Live</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={t(0.4)}
            className="font-display text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black leading-[0.9] tracking-tighter"
          >
            <span className="block text-foreground drop-shadow-lg">BECOME A</span>
            <span className="block text-fire-gradient filter drop-shadow-[0_0_25px_rgba(255,0,255,0.5)]">GOD OF THE</span>
            <span className="block text-foreground drop-shadow-lg">ARENA</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={t(0.6)}
            className="mt-4 sm:mt-6 max-w-xs sm:max-w-xl text-sm sm:text-lg text-muted-foreground/90 font-medium leading-relaxed drop-shadow-md"
          >
            India's most elite Free Fire esports platform. Compete in high-stakes solo & squad tournaments for massive real cash prizes.
          </motion.p>

          {/* Call to Actions - Full width on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={t(0.8)}
            className="mt-8 flex flex-col sm:flex-row w-full sm:w-auto gap-3 sm:gap-4"
          >
            {user ? (
              <Button asChild variant="hero" size="lg" className="w-full sm:w-auto font-display tracking-widest text-sm sm:text-base h-12 sm:h-14">
                <Link to="/tournaments">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5" /> JOIN BATTLE
                </Link>
              </Button>
            ) : (
              <Button asChild variant="hero" size="lg" className="w-full sm:w-auto font-display tracking-widest text-sm sm:text-base h-12 sm:h-14" onClick={() => toast.error("You must be logged in to join battles.")}>
                <Link to="/login">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5" /> JOIN BATTLE
                </Link>
              </Button>
            )}
            <Link to="/tournaments" className="w-full sm:w-auto">
              <Button variant="outlineFire" size="lg" className="w-full font-display tracking-widest text-sm sm:text-base h-12 sm:h-14 bg-background/50 backdrop-blur-md">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" /> VIEW TOURNAMENTS
              </Button>
            </Link>
          </motion.div>

          {/* Stats Grid - Glassmorphism, tailored for mobile */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={t(1.1)}
            className="mt-10 sm:mt-16 w-full grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 max-w-sm sm:max-w-3xl"
          >
            {[
              { v: "120K+", l: "Players" },
              { v: "₹50L+", l: "Prize Pool" },
              { v: "850+", l: "Matches" },
              { v: "24/7", l: "Live" },
            ].map((s, i) => (
              <div key={i} className="relative bg-card/40 backdrop-blur-xl border border-primary/30 clip-notch p-3 sm:p-5 flex flex-col items-center sm:items-start shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                <div className="absolute top-0 left-0 w-4 sm:w-6 h-[2px] bg-primary" />
                <div className="absolute top-0 left-0 w-[2px] h-4 sm:h-6 bg-primary" />
                <div className="font-display text-xl sm:text-3xl font-black text-white text-glow">{s.v}</div>
                <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-primary mt-0.5 sm:mt-1 font-bold">{s.l}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Floating Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ opacity: { delay: 1.5, duration: 0.6 }, y: { duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: 1.5 } }}
        className="absolute bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 text-primary/70 pointer-events-none hidden sm:flex pointer-events-auto"
      >
        <span className="text-[10px] font-display uppercase tracking-[0.3em]">Scroll</span>
        <ChevronDown className="w-4 h-4" />
      </motion.div>
    </section>
  );
}
