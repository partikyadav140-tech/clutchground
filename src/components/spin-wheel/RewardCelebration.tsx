import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Gift } from "lucide-react";
import { GodCoin } from "@/components/GodCoin";
import { Button } from "@/components/ui/button";

type RewardCelebrationProps = {
  open: boolean;
  onClose: () => void;
  prize: { label: string; amount: number } | null;
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  shape: "circle" | "square" | "triangle";
  opacity: number;
}

export function RewardCelebration({ open, onClose, prize }: RewardCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!open || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Confetti particles
    const particles: Particle[] = [];
    const colors = [
      "#FFD700", // Gold
      "#FF6B00", // Orange
      "#FEF08A", // Light yellow
      "#3B82F6", // Blue
      "#10B981", // Green
      "#EC4899", // Pink
      "#8B5CF6", // Purple
      "#EF4444", // Red
    ];

    const shapes: Array<Particle["shape"]> = ["circle", "square", "triangle"];

    // Initialize particles: explode from center and shoot from corners
    const spawnExplosion = (cx: number, cy: number, count = 80) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 8;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (2 + Math.random() * 4), // slightly upward velocity bias
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 6 + Math.random() * 6,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          opacity: 1,
        });
      }
    };

    const spawnCannon = (x: number, y: number, angleDeg: number, count = 40) => {
      const angleRad = (angleDeg * Math.PI) / 180;
      for (let i = 0; i < count; i++) {
        const angle = angleRad + (Math.random() - 0.5) * 0.3; // variation
        const speed = 10 + Math.random() * 12;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 6 + Math.random() * 6,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 15,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          opacity: 1,
        });
      }
    };

    // Initial triggers
    spawnExplosion(width / 2, height / 2 - 100, 100);
    setTimeout(() => spawnCannon(0, height, -45, 50), 200);
    setTimeout(() => spawnCannon(width, height, -135, 50), 200);
    setTimeout(() => spawnExplosion(width / 2, height / 2 - 100, 40), 600);

    const updateAndDraw = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Apply physics
        p.vy += 0.22; // gravity
        p.vx *= 0.985; // air resistance
        p.vy *= 0.985;

        p.rotation += p.rotationSpeed;
        
        // Slow fade out after peak
        if (p.vy > 1) {
          p.opacity -= 0.008;
        }

        if (p.opacity <= 0 || p.y > height + 20 || p.x < -20 || p.x > width + 20) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;

        ctx.beginPath();
        if (p.shape === "circle") {
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        } else if (p.shape === "square") {
          ctx.rect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.shape === "triangle") {
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(p.size / 2, p.size / 2);
          ctx.lineTo(-p.size / 2, p.size / 2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Keep spawning minor trickles of confetti from top randomly
      if (particles.length < 50 && Math.random() < 0.2) {
        particles.push({
          x: Math.random() * width,
          y: -10,
          vx: (Math.random() - 0.5) * 2,
          vy: 2 + Math.random() * 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 5 + Math.random() * 5,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 8,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          opacity: 1,
        });
      }

      animationId = requestAnimationFrame(updateAndDraw);
    };

    updateAndDraw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [open]);

  if (!open || !prize) return null;

  const isWin = prize.amount > 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#090b11]/85 backdrop-blur-md"
        />

        {/* Confetti canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

        {/* Modal card */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{
            scale: 1,
            opacity: 1,
            y: 0,
            transition: {
              type: "spring",
              damping: 15,
              stiffness: 220,
            },
          }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm rounded-[24px] border border-primary/25 bg-gradient-to-b from-[#181d29] to-[#0c0f18] p-6 text-center shadow-[0_24px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(255,107,0,0.15)] overflow-hidden"
        >
          {/* Card background glowing elements */}
          <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none" />

          {/* Icon Header */}
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-yellow-500 flex items-center justify-center shadow-[0_0_20px_rgba(255,107,0,0.4)] relative">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1.1, 1] }}
              transition={{ repeat: Infinity, repeatType: "reverse", duration: 2.5 }}
            >
              {isWin ? <Sparkles className="w-8 h-8 text-black" /> : <Gift className="w-8 h-8 text-black" />}
            </motion.div>
            
            {/* Pulsing ring */}
            <span className="absolute inset-0 rounded-full border border-primary animate-ping opacity-25" />
          </div>

          <h3 className="mt-5 font-display font-black text-2xl tracking-tight text-white uppercase">
            {isWin ? "Congratulations!" : "Spin Completed"}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground font-semibold">
            {isWin ? "You have unlocked a reward!" : "Here is your spin outcome"}
          </p>

          {/* Reward Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 rounded-2xl bg-card/60 border border-white/5 py-5 px-4 flex flex-col items-center justify-center relative overflow-hidden"
          >
            {/* Spinning rays background in css */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_0,transparent_70%)]" />

            {isWin ? (
              <>
                <motion.div
                  animate={{ rotateY: 360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  className="mb-2"
                >
                  <GodCoin className="w-14 h-14" />
                </motion.div>
                <div className="font-display font-black text-3xl text-yellow-400 drop-shadow-md tracking-tight flex items-baseline gap-1 justify-center">
                  +{prize.amount}
                  <span className="text-sm font-black text-white/90">CG COINS</span>
                </div>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">
                  Added to deposit balance
                </p>
              </>
            ) : (
              <>
                <p className="font-display font-black text-lg text-foreground mt-1 px-2">
                  {prize.label}
                </p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                  Better luck next time!
                </p>
              </>
            )}
          </motion.div>

          {/* Action button */}
          <Button
            onClick={onClose}
            className="mt-6 w-full h-12 rounded-xl font-display font-black text-base shadow-[0_4px_16px_rgba(255,107,0,0.25)] hover:shadow-[0_4px_24px_rgba(255,107,0,0.4)] transition-all bg-gradient-to-r from-primary to-orange-500 text-white press-effect active:scale-95 border-none"
          >
            Claim Winnings
          </Button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
