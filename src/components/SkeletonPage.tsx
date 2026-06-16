import { motion } from "framer-motion";

/* ── Base shimmer block ── */
function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-secondary/60 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/8 to-transparent" />
    </div>
  );
}

/* ── Skeleton: Tournament Card ── */
export function SkeletonTournamentCard() {
  return (
    <div className="rounded-3xl bg-card border border-border overflow-hidden">
      <Shimmer className="h-[180px] rounded-none" />
      <div className="flex items-stretch divide-x divide-border">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-center py-3 gap-1.5">
            <Shimmer className="w-8 h-2 rounded-full" />
            <Shimmer className="w-10 h-3 rounded-full" />
          </div>
        ))}
      </div>
      <div className="h-1.5 bg-secondary" />
      <div className="p-3 flex gap-2">
        <Shimmer className="flex-1 h-10 rounded-2xl" />
        <Shimmer className="w-24 h-10 rounded-2xl" />
      </div>
    </div>
  );
}

/* ── Skeleton: Match Card ── */
export function SkeletonMatchCard() {
  return (
    <div className="rounded-3xl bg-card border border-border overflow-hidden">
      <Shimmer className="h-[150px] rounded-none" />
      <div className="flex items-stretch divide-x divide-border">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1">
            <Shimmer className="w-7 h-1.5 rounded-full" />
            <Shimmer className="w-9 h-3 rounded-full" />
          </div>
        ))}
      </div>
      <div className="p-3 flex gap-2">
        <Shimmer className="flex-1 h-10 rounded-2xl" />
        <Shimmer className="w-28 h-10 rounded-2xl" />
      </div>
    </div>
  );
}

/* ── Skeleton: Profile Header ── */
export function SkeletonProfile() {
  return (
    <div className="space-y-4">
      {/* Banner */}
      <Shimmer className="h-36 rounded-none" />
      {/* Avatar + name */}
      <div className="flex items-end gap-4 px-4 -mt-10 relative z-10">
        <Shimmer className="w-20 h-20 rounded-full shrink-0 border-4 border-background" />
        <div className="flex-1 space-y-2 pb-1">
          <Shimmer className="w-32 h-5 rounded-full" />
          <Shimmer className="w-20 h-3 rounded-full" />
        </div>
      </div>
      {/* Stats */}
      <div className="px-4 grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-3 space-y-1.5">
            <Shimmer className="w-full h-2 rounded-full" />
            <Shimmer className="w-3/4 h-4 rounded-full mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Skeleton: Leaderboard Rows ── */
export function SkeletonLeaderboard() {
  return (
    <div className="space-y-2 px-4">
      {/* Podium */}
      <div className="flex items-end justify-center gap-3 py-6">
        <Shimmer className="w-16 h-24 rounded-xl" />
        <Shimmer className="w-20 h-32 rounded-xl" />
        <Shimmer className="w-16 h-20 rounded-xl" />
      </div>
      {/* Rows */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-2.5"
        >
          <Shimmer className="w-6 h-6 rounded-full" />
          <Shimmer className="w-8 h-8 rounded-full" />
          <div className="flex-1 space-y-1">
            <Shimmer className="w-24 h-3 rounded-full" />
            <Shimmer className="w-16 h-2 rounded-full" />
          </div>
          <Shimmer className="w-12 h-4 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/* ── Skeleton: Wallet ── */
export function SkeletonWallet() {
  return (
    <div className="space-y-4 px-4">
      {/* Balance card */}
      <Shimmer className="h-28 rounded-2xl" />
      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Shimmer className="h-12 rounded-2xl" />
        <Shimmer className="h-12 rounded-2xl" />
      </div>
      {/* Transaction list */}
      <div className="space-y-2">
        <Shimmer className="w-24 h-3 rounded-full" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-3"
          >
            <Shimmer className="w-9 h-9 rounded-xl" />
            <div className="flex-1 space-y-1">
              <Shimmer className="w-28 h-3 rounded-full" />
              <Shimmer className="w-16 h-2 rounded-full" />
            </div>
            <Shimmer className="w-14 h-4 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Skeleton: Generic Page ── */
export function SkeletonPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="min-h-[60vh] pb-24"
    >
      <div className="px-4 pt-5 pb-4 space-y-1">
        <Shimmer className="w-16 h-2 rounded-full" />
        <Shimmer className="w-36 h-6 rounded-full" />
      </div>
      <div className="px-4 space-y-3">
        <SkeletonTournamentCard />
        <SkeletonTournamentCard />
      </div>
    </motion.div>
  );
}

/* ── Skeleton: Team / Squad HQ ── */
export function SkeletonTeam() {
  return (
    <div className="space-y-4">
      {/* Team card */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-card">
        <div className="relative px-6 pt-8 pb-6 flex flex-col items-center bg-gradient-to-b from-primary/5 via-card to-card">
          {/* Logo shimmer */}
          <Shimmer className="w-28 h-28 rounded-3xl mb-4" />
          {/* Name & subtitle shimmers */}
          <Shimmer className="w-40 h-6 rounded-full mb-2" />
          <Shimmer className="w-48 h-3 rounded-full mb-1" />
          <Shimmer className="w-36 h-2.5 rounded-full mb-4" />

          {/* Action buttons shimmers */}
          <div className="flex gap-5 mt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <Shimmer className="w-12 h-12 rounded-2xl" />
                <Shimmer className="w-8 h-2 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Roster members list */}
        <div className="px-5 pb-6 pt-2 space-y-3.5">
          <Shimmer className="w-24 h-4 rounded-full mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0"
            >
              <Shimmer className="w-10 h-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Shimmer className="w-32 h-3 rounded-full" />
                <Shimmer className="w-16 h-2 rounded-full" />
              </div>
              <Shimmer className="w-16 h-6 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
