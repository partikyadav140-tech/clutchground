import { motion } from "framer-motion";

type ProfileEffectRendererProps = {
  value: string | null | undefined;
};

export function ProfileEffectRenderer({ value }: ProfileEffectRendererProps) {
  if (!value || value === "none") return null;

  switch (value) {
    case "sparkles":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-yellow-400 select-none"
              style={{
                left: `${(i * 7 + Math.random() * 5) % 100}%`,
                top: `${-10 - Math.random() * 20}%`,
                fontSize: `${12 + (i % 3) * 6}px`,
                filter: "drop-shadow(0 0 6px rgba(253, 224, 71, 0.6))",
              }}
              animate={{
                y: ["0vh", "60vh"],
                opacity: [0, 1, 1, 0],
                rotate: [0, 360],
                scale: [0.6, 1.2, 0.6],
              }}
              transition={{
                duration: 4 + (i % 4) * 1.5,
                repeat: Infinity,
                ease: "linear",
                delay: i * 0.4,
              }}
            >
              ✨
            </motion.div>
          ))}
        </div>
      );

    case "hearts":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-pink-500 select-none"
              style={{
                left: `${10 + ((i * 8) % 80)}%`,
                bottom: `${-10 - Math.random() * 20}%`,
                fontSize: `${14 + (i % 3) * 6}px`,
                filter: "drop-shadow(0 0 6px rgba(236, 72, 153, 0.5))",
              }}
              animate={{
                y: ["0px", "-450px"],
                x: [0, (i % 2 === 0 ? 30 : -30) * Math.sin(i)],
                opacity: [0, 0.9, 0.9, 0],
                scale: [0.8, 1.3, 0.8],
              }}
              transition={{
                duration: 5 + (i % 3) * 1.5,
                repeat: Infinity,
                ease: "easeOut",
                delay: i * 0.5,
              }}
            >
              💖
            </motion.div>
          ))}
        </div>
      );

    case "lightning":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          {/* Background electrical storm glow */}
          {Array.from({ length: 2 }).map((_, i) => (
            <motion.div
              key={`glow-${i}`}
              className="absolute inset-0 bg-purple-600/10 blur-xl pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.25, 0, 0.15, 0, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                repeatDelay: 5 + i * 4,
                delay: i * 2.5,
              }}
            />
          ))}

          {/* Drifting electric sparks */}
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={`spark-${i}`}
              className="absolute text-purple-400 font-bold select-none text-base"
              style={{
                left: `${15 + ((i * 12) % 70)}%`,
                top: `${15 + ((i * 11) % 60)}%`,
                filter: "drop-shadow(0 0 8px rgba(168, 85, 247, 0.8))",
              }}
              animate={{
                scale: [0, 1.5, 0, 1.2, 0],
                opacity: [0, 1, 0, 0.8, 0],
                rotate: [0, i % 2 === 0 ? 15 : -15],
              }}
              transition={{
                duration: 0.4,
                repeat: Infinity,
                repeatDelay: 3 + (i % 3) * 1.5,
                delay: i * 0.6,
              }}
            >
              ⚡
            </motion.div>
          ))}
        </div>
      );

    case "flames":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          {Array.from({ length: 22 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                bottom: "-12px",
                left: `${(i * 4.6) % 100}%`,
                width: `${14 + (i % 4) * 6}px`,
                height: `${14 + (i % 4) * 6}px`,
                background:
                  i % 2 === 0
                    ? "linear-gradient(to top, rgba(239, 68, 68, 0.9), rgba(249, 115, 22, 0.3))"
                    : "linear-gradient(to top, rgba(249, 115, 22, 0.9), rgba(234, 179, 8, 0.3))",
                filter: "blur(5px)",
              }}
              animate={{
                y: [0, -50 - (i % 3) * 20],
                scale: [1.0, 1.6, 0.3],
                opacity: [0.6, 0.9, 0],
              }}
              transition={{
                duration: 1.5 + (i % 3) * 0.4,
                repeat: Infinity,
                ease: "easeOut",
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      );

    default:
      return null;
  }
}
