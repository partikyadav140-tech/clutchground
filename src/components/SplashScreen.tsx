import { useEffect, useState } from "react";
import { Logo } from "./Logo";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Only show once per session
    if (sessionStorage.getItem("splashShown")) {
      setVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("splashShown", "true");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center animate-out fade-out duration-1000 delay-2000 fill-mode-forwards">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-[#050505] to-[#050505]" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Logo with elegant scale up & glow */}
        <div className="animate-[pulse_2s_ease-in-out_infinite] scale-125 mb-8 filter drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">
          <Logo size={120} withText={false} />
        </div>

        {/* Cinematic Title text */}
        <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-[0.2em] mb-2 drop-shadow-md">
          CLUTCH<span className="text-primary">GROUND</span>
        </h1>
        <p className="font-display text-xs sm:text-sm text-muted-foreground uppercase tracking-[0.4em] mb-12">
          Entering The Arena
        </p>

        {/* Cinematic slim loading bar */}
        <div className="w-64 sm:w-80 h-1 bg-white/10 rounded-full overflow-hidden relative">
          <div className="absolute top-0 left-0 h-full bg-primary animate-[splashLoad_2s_ease-in-out_forwards] shadow-[0_0_10px_theme('colors.primary.DEFAULT')]" />
        </div>
      </div>

      <style>{`
        @keyframes splashLoad {
          0% { width: 0%; opacity: 0.8; }
          50% { width: 70%; opacity: 1; }
          100% { width: 100%; opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
