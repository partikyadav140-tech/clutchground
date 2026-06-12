import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Clock, Shield, Star, Users, Zap } from "lucide-react";
import { JoinBattleDialog } from "@/components/JoinBattleDialog";
import { GodCoin } from "@/components/GodCoin";
import { getModeColors, getTournamentPoster } from "@/lib/mode-colors";
import { CountdownTimer } from "@/components/CountdownTimer";

type TournamentCardProps = {
  t: {
    id: number;
    title: string;
    mode: string;
    entry: number;
    prize?: number;
    per_kill_coin?: number;
    slots?: number;
    filled?: number;
    status?: string;
    banner?: string | null;
    startsAt?: string;
    startsat?: string;
    tournament_code?: string;
    [key: string]: any;
  };
  index?: number;
  isJoined?: boolean;
  compact?: boolean;
  animated?: boolean;
};

export function TournamentCard({
  t,
  index = 0,
  isJoined = false,
  compact = false,
  animated = false,
}: TournamentCardProps) {
  const poster = getTournamentPoster(t);
  const slots = Number(t.slots) || 1;
  const filled = Number(t.filled) || 0;
  const fillPct = Math.min(100, Math.round((filled / slots) * 100));
  const isFull = filled >= slots;
  const isLive = t.status === "live";
  const isFree = t.tournament_type === "clash_squad" || t.tournament_type === "lone_wolf" 
    ? (t.entry_fee || 0) === 0
    : t.entry === 0;
  const mc = getModeColors(t.mode);

  const card = (
    <div
      className="rounded-3xl p-[1.5px] transition-all duration-300 group"
      style={{
        background: `linear-gradient(135deg, ${mc.color}44, transparent 60%, ${mc.color}22)`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 0 28px ${mc.glow}, 0 8px 32px rgba(0,0,0,0.4)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div className="rounded-[calc(1.5rem-1.5px)] overflow-hidden bg-card">
        <div className={`relative overflow-hidden ${compact ? "h-[150px]" : "h-[180px]"}`}>
          <img
            src={poster}
            alt={t.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 55%, rgba(8,12,20,0.98) 100%)",
            }}
          />

          <div className="absolute top-3 left-3 flex items-center gap-2">
            {isLive && (
              <span className="badge-live text-xs">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-current" />
                Live
              </span>
            )}
            <span
              className="px-2.5 py-1 rounded-full text-xs font-bold"
              style={{
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(8px)",
                color: mc.color,
                border: `1px solid ${mc.color}55`,
              }}
            >
              {mc.label}
            </span>
          </div>

          {isFree && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <span className="badge-free text-xs">Free</span>
            </div>
          )}

          {/* Tournament Code Badge */}
          {t.tournament_code && (
            <div className={`absolute ${isFree ? 'top-10' : 'top-3'} right-3`}>
              <span
                className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold"
                style={{
                  background: "rgba(0,0,0,0.6)",
                  backdropFilter: "blur(8px)",
                  color: "rgba(255,255,255,0.8)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                {t.tournament_code}
              </span>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
            <div className="text-label mb-1 flex items-center gap-1" style={{ color: mc.color }}>
              <Star className="w-3 h-3" />
              Free Fire
            </div>
            <h3
              className={`font-display font-black leading-tight line-clamp-1 drop-shadow-lg ${compact ? "text-base" : "text-xl"}`}
              style={{ color: "#fff" }}
            >
              {t.title}
            </h3>
          </div>
        </div>

        <div className="flex items-stretch divide-x divide-border">
          <div className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5">
            <span className="text-label">Entry</span>
            <span className="font-display font-black text-sm text-foreground flex items-center gap-1">
              {isFree ? (
                <span className="text-emerald-400 text-xs">Free</span>
              ) : (
                <>
                  <GodCoin className="w-3.5 h-3.5 text-amber-400" />
                  {t.tournament_type === "clash_squad" || t.tournament_type === "lone_wolf" ? (t.entry_fee || 0) : t.entry}
                </>
              )}
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5">
            <span className="text-label" style={{ color: mc.color }}>
              Prize
            </span>
            <span className="font-display font-black text-sm text-foreground flex items-center gap-1">
              <GodCoin className="w-3.5 h-3.5 text-amber-400" />
              {t.tournament_type === "clash_squad" || t.tournament_type === "lone_wolf" 
                ? (t.prize_pool || 0)
                : (t.mode === "Solo" ? `${t.per_kill_coin}/kill` : t.prize)}
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5">
            <span className="text-label">Starts</span>
            <div className="flex items-center justify-center">
              <CountdownTimer targetDate={t.startsAt || t.startsat || ""} status={t.status} compact />
            </div>
          </div>
        </div>

        <div className={`px-4 pb-4 ${compact ? "pt-2" : "pt-3"}`}>
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>
                <span className="font-bold text-foreground">{filled}</span>/{slots}
              </span>
            </div>
            <span
              className="text-xs font-bold"
              style={{ color: isFull ? "#ef4444" : fillPct > 70 ? "#f59e0b" : mc.color }}
            >
              {isFull ? "Full" : `${fillPct}%`}
            </span>
          </div>

          <div className="relative h-2 bg-secondary rounded-full overflow-hidden mb-4">
            <div
              className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
              style={{
                width: `${fillPct}%`,
                background: isFull ? "linear-gradient(90deg,#ef4444,#b91c1c)" : mc.gradient,
              }}
            >
              {!isFull && fillPct > 10 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Link to="/tournaments/$id" params={{ id: String(t.id) }} className="flex-[0_0_auto]">
              <button
                type="button"
                className={`rounded-2xl text-xs font-bold border border-border text-foreground bg-secondary hover:bg-accent transition-all press-effect active:scale-95 flex items-center gap-1.5 ${
                  compact ? "h-10 px-3.5" : "h-12 px-5"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Info
              </button>
            </Link>

            <div className="flex-1">
              {isJoined ? (
                <Link
                  to="/matches"
                  className={`w-full rounded-2xl text-xs font-bold flex items-center justify-center bg-green-500/10 text-green-500 border border-green-500/20 press-effect ${
                    compact ? "h-10" : "h-12"
                  }`}
                >
                  Joined
                </Link>
              ) : isFull ? (
                <button
                  type="button"
                  disabled
                  className={`w-full rounded-2xl text-xs font-bold bg-secondary text-muted-foreground border border-border cursor-not-allowed ${
                    compact ? "h-10" : "h-12"
                  }`}
                >
                  Full
                </button>
              ) : (
                <JoinBattleDialog
                  tournamentId={t.id}
                  tournamentTitle={t.title}
                  mode={t.mode as "Solo" | "Duo" | "Squad"}
                  entryFee={t.entry}
                  trigger={
                    <button
                      type="button"
                      className={`w-full rounded-2xl text-xs font-bold flex items-center justify-center gap-2 press-effect active:scale-95 transition-all ${
                        compact ? "h-10" : "h-12"
                      }`}
                      style={{
                        background: mc.gradient,
                        boxShadow: `0 4px 20px ${mc.glow}`,
                        color: "#fff",
                      }}
                    >
                      <Zap className="w-4 h-4" />
                      {compact ? "Join" : "Join battle"}
                    </button>
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!animated) return card;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ delay: Math.min(index * 0.07, 0.35), duration: 0.32, ease: "easeOut" }}
    >
      {card}
    </motion.div>
  );
}
