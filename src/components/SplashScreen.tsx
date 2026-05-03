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
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center animate-out fade-out duration-500 delay-2500 fill-mode-forwards">
      <div className="relative grid place-items-center">
        {/* Outer glowing spinner */}
        <div className="absolute w-40 h-40 rounded-full border-t-2 border-primary animate-spin shadow-[0_0_20px_theme('colors.primary.DEFAULT')]" />
        
        {/* Inner reverse spinner */}
        <div className="absolute w-32 h-32 rounded-full border-b-2 border-orange-500 animate-[spin_1.5s_linear_reverse_infinite]" />
        
        {/* Logo in center */}
        <div className="z-10 animate-pulse">
          <Logo size={80} withText={false} />
        </div>
      </div>
      <div className="mt-8 font-display font-black tracking-[0.3em] text-primary uppercase animate-pulse">
        Initializing Area...
      </div>
    </div>
  );
}
