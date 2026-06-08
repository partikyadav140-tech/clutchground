import { useState } from "react";
import { motion } from "framer-motion";
import { MiniSpinWheelIcon } from "./MiniSpinWheelIcon";
import { SpinWheelSheet } from "./SpinWheelSheet";
import { useAuth } from "@/lib/auth-client";

type SpinWheelFabProps = {
  bottomOffset?: number;
};

export function SpinWheelFab({ bottomOffset = 152 }: SpinWheelFabProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 16, stiffness: 260, delay: 0.35 }}
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

      <SpinWheelSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
