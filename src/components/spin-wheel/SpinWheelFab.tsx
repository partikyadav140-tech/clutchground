import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MiniSpinWheelIcon } from "./MiniSpinWheelIcon";
import { SpinWheelSheet } from "./SpinWheelSheet";
import { useAuth } from "@/lib/auth-client";

type SpinWheelFabProps = {
  bottomOffset?: number;
};

export function SpinWheelFab({ bottomOffset = 152 }: SpinWheelFabProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let scrollContainer = document.getElementById("app-scroll-container");
    const threshold = 12; // Minimum scroll delta to trigger
    let ticking = false;

    const handleScroll = (e: Event) => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const currentY = scrollContainer
          ? scrollContainer.scrollTop
          : e.currentTarget === window
            ? window.scrollY
            : (e.target as HTMLElement).scrollTop || 0;

        const delta = currentY - lastScrollY.current;

        // Hide when scrolling DOWN past 60px; show when scrolling UP or near the top
        if (delta > threshold && currentY > 60) {
          setVisible(false);
        } else if (delta < -threshold || currentY <= 60) {
          setVisible(true);
        }

        lastScrollY.current = currentY;
        ticking = false;
      });
    };

    if (!scrollContainer) {
      scrollContainer = document.getElementById("app-scroll-container");
    }

    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!user) return null;

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            initial={{ scale: 0, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 30 }}
            transition={{
              type: "spring",
              damping: 18,
              stiffness: 280,
            }}
            className="fixed right-3 z-40 press-effect active:scale-95 flex flex-col items-center"
            style={{ bottom: `calc(env(safe-area-inset-bottom, 0px) + ${bottomOffset}px)` }}
            aria-label="Daily spin wheel"
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <MiniSpinWheelIcon />
            </motion.div>
            <span className="mt-1.5 text-[10px] font-black uppercase tracking-wider text-primary drop-shadow-sm">
              Spin
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <SpinWheelSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
