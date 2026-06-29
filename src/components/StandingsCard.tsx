/**
 * StandingsCard — Professional Esports-Grade Tournament Results
 *
 * Renders a mobile-first HTML standings table (Thryl/BGMI-inspired).
 *
 * Column rules:
 *  - Battle Royale Solo / Duo  → Rank | Player | Kills | Position
 *  - Battle Royale Squad       → Rank | Squad  | Kills | Position | Points
 *  - Clash Squad               → Rank | Team   | Kills | Position
 *  - Lone Wolf                 → Rank | Player | Kills | Position
 */

import { ImageIcon, Flame } from "lucide-react";

/* ─── types ─── */
interface ResultRow {
  id?: number;
  username?: string;
  team_name?: string;
  kills?: number;
  position?: number;
  points?: number;
}

interface Props {
  tournamentName: string;
  mode: "Solo" | "Duo" | "Squad" | "Clash Squad" | "Lone Wolf" | string;
  results: ResultRow[];
  /** Pass "clash_squad" | "lone_wolf" to override column logic */
  tournamentType?: string;
  /** Optional label for badge (e.g., "Match 1", "Final Results") */
  label?: string;
  /** Map of registration id to booyah (1st place) count across matches */
  booyahCounts?: Record<number, number>;
  /** When true, show computed rank instead of raw position, and show placement points */
  isOverall?: boolean;
}

/* ─── Medal colours ─── */
const MEDAL = [
  { border: "#f59e0b", bg: "rgba(245,158,11,0.12)", text: "#fbbf24", label: "🥇" },
  { border: "#94a3b8", bg: "rgba(148,163,184,0.10)", text: "#cbd5e1", label: "🥈" },
  { border: "#cd7c2f", bg: "rgba(205,124,47,0.10)", text: "#f97316", label: "🥉" },
];

/* ─── React component ─── */
export function StandingsCard({
  tournamentName,
  mode,
  results,
  tournamentType,
  label,
  booyahCounts,
  isOverall,
}: Props) {
  const modeL = mode?.toLowerCase() ?? "";
  const typeL = tournamentType?.toLowerCase() ?? "";
  const showPoints = modeL === "squad" && typeL !== "clash_squad" && typeL !== "lone_wolf";
  const isMultiMatchOverall = showPoints && isOverall && booyahCounts && Object.keys(booyahCounts).length > 0;
  const showPosColumn = !isMultiMatchOverall;

  const sorted = [...results].sort((a, b) => {
    if (showPoints) {
      if (b.points !== a.points) return (b.points ?? 0) - (a.points ?? 0);
      return (b.kills ?? 0) - (a.kills ?? 0);
    }
    const pa = a.position ?? 999,
      pb = b.position ?? 999;
    if (pa !== pb) return pa - pb;
    return (b.kills ?? 0) - (a.kills ?? 0);
  });

  if (!results.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <ImageIcon className="w-10 h-10 text-muted-foreground opacity-30" />
        <p className="text-sm font-bold text-muted-foreground">No standings data yet.</p>
      </div>
    );
  }

  /* mode label for header badge */
  const modeLabel =
    typeL === "clash_squad" ? "Clash Squad" : typeL === "lone_wolf" ? "Lone Wolf" : mode;

  return (
    <div className="flex flex-col gap-3">
      {/* ── Professional HTML Table ── */}
      <div
        className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
        style={{ background: "linear-gradient(160deg,#0f0c1a 0%,#16102a 60%,#0a0a14 100%)" }}
      >
        {/* Top accent bar */}
        <div
          className="h-1.5 w-full"
          style={{ background: "linear-gradient(90deg,#ff6b00,#ff4d6d,#7c3aed)" }}
        />

        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                style={{
                  background: "rgba(255,107,0,0.15)",
                  color: "#ff6b00",
                  border: "1px solid rgba(255,107,0,0.35)",
                }}
              >
                {modeLabel}
              </span>
              <span
                className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                style={{
                  background: "rgba(16,185,129,0.12)",
                  color: "#10b981",
                  border: "1px solid rgba(16,185,129,0.3)",
                }}
              >
                Final Results
              </span>
            </div>
            <h2 className="font-black text-base text-white leading-tight line-clamp-2">
              {tournamentName}
            </h2>
            <p className="text-[10px] text-white/40 mt-0.5 font-medium">
              Free Fire • clutchground.games
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
            style={{ background: "rgba(255,107,0,0.15)", border: "1px solid rgba(255,107,0,0.3)" }}
          >
            🏆
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mx-4" style={{ background: "rgba(255,255,255,0.07)" }} />

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] border-collapse">
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                <th
                  className="text-left pl-4 pr-2 py-2.5 text-[9px] font-black uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.3)", width: 48 }}
                >
                  #
                </th>
                <th
                  className="text-left px-2 py-2.5 text-[9px] font-black uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {modeL === "solo" || typeL === "lone_wolf" ? "Player" : "Squad / Team"}
                </th>
                <th
                  className="text-center px-2 py-2.5 text-[9px] font-black uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.3)", width: 60 }}
                >
                  Kills
                </th>
                {showPosColumn && (
                  <th
                    className="text-center px-2 py-2.5 text-[9px] font-black uppercase tracking-widest"
                    style={{ color: "rgba(255,255,255,0.3)", width: 64 }}
                  >
                    Pos
                  </th>
                )}
                {showPoints && booyahCounts && Object.keys(booyahCounts).length > 0 && (
                  <th
                    className="text-center px-1 py-2.5 text-[9px] font-black uppercase tracking-widest"
                    style={{ color: "rgba(255,255,255,0.3)", width: 48 }}
                  >
                    Booyah
                  </th>
                )}
                {showPoints && isOverall && (
                  <th
                    className="text-center px-1 py-2.5 text-[9px] font-black uppercase tracking-widest"
                    style={{ color: "rgba(255,255,255,0.3)", width: 52 }}
                  >
                    Pos Pts
                  </th>
                )}
                {showPoints && (
                  <th
                    className="text-right pr-4 py-2.5 text-[9px] font-black uppercase tracking-widest"
                    style={{ color: "rgba(255,255,255,0.3)", width: 64 }}
                  >
                    Pts
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row: any, i: number) => {
                const isTop3 = i < 3;
                const medal = isTop3 ? MEDAL[i] : null;
                const name = row.team_name || row.username || "Unknown";

                return (
                  <tr
                    key={row.id ?? i}
                    style={{
                      background:
                        medal?.bg ?? (i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent"),
                      borderLeft: isTop3 ? `3px solid ${medal!.border}` : "3px solid transparent",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      transition: "background 0.15s",
                    }}
                  >
                    {/* Rank */}
                    <td className="pl-3 pr-2 py-3 text-center align-middle" style={{ width: 48 }}>
                      {isTop3 ? (
                        <span className="text-base leading-none select-none" title={`#${i + 1}`}>
                          {medal!.label}
                        </span>
                      ) : (
                        <span
                          className="text-xs font-black tabular-nums"
                          style={{ color: "rgba(255,255,255,0.3)" }}
                        >
                          #{i + 1}
                        </span>
                      )}
                    </td>

                    {/* Name */}
                    <td className="px-2 py-3 align-middle">
                      <span
                        className="font-bold text-sm leading-tight line-clamp-1"
                        style={{ color: isTop3 ? "#ffffff" : "rgba(255,255,255,0.75)" }}
                      >
                        {name}
                      </span>
                    </td>

                    {/* Kills */}
                    <td className="px-2 py-3 text-center align-middle" style={{ width: 60 }}>
                      <div className="flex items-center justify-center gap-1">
                        <Flame className="w-2.5 h-2.5 shrink-0" style={{ color: "#f97316" }} />
                        <span
                          className="font-black text-sm tabular-nums"
                          style={{ color: "#f97316" }}
                        >
                          {row.kills ?? 0}
                        </span>
                      </div>
                    </td>

                    {/* Position — hidden for multi-match overall */}
                    {showPosColumn && (
                      <td className="px-2 py-3 text-center align-middle" style={{ width: 64 }}>
                        {row.position ? (
                          <span
                            className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-black tabular-nums"
                            style={{
                              background:
                                row.position === 1
                                  ? "rgba(245,158,11,0.18)"
                                  : "rgba(255,255,255,0.07)",
                              color: row.position === 1 ? "#fbbf24" : "rgba(255,255,255,0.5)",
                              border:
                                row.position === 1
                                  ? "1px solid rgba(245,158,11,0.4)"
                                  : "1px solid rgba(255,255,255,0.1)",
                              minWidth: 32,
                            }}
                          >
                            #{row.position}
                          </span>
                        ) : (
                          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>—</span>
                        )}
                      </td>
                    )}

                    {/* Booyah count (Squad multi-match only) */}
                    {showPoints && booyahCounts && Object.keys(booyahCounts).length > 0 && (
                      <td className="px-1 py-3 text-center align-middle" style={{ width: 48 }}>
                        {(booyahCounts[row.id] || 0) > 0 ? (
                          <span
                            className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-black tabular-nums"
                            style={{
                              background: "rgba(245,158,11,0.15)",
                              color: "#fbbf24",
                              border: "1px solid rgba(245,158,11,0.3)",
                              minWidth: 24,
                            }}
                          >
                            {booyahCounts[row.id]}
                          </span>
                        ) : (
                          <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 10 }}>0</span>
                        )}
                      </td>
                    )}

                    {/* Placement Points (Overall Squad only) */}
                    {showPoints && isOverall && (
                      <td className="px-1 py-3 text-center align-middle" style={{ width: 52 }}>
                        <span
                          className="font-black text-xs tabular-nums"
                          style={{ color: isTop3 ? "#10b981" : "rgba(16,185,129,0.55)" }}
                        >
                          {Math.max(0, (row.points ?? 0) - (row.kills ?? 0))}
                        </span>
                      </td>
                    )}

                    {/* Total Points (Squad only) */}
                    {showPoints && (
                      <td className="pr-4 py-3 text-right align-middle" style={{ width: 64 }}>
                        <span
                          className="font-black text-sm tabular-nums"
                          style={{
                            color: isTop3 ? "#a78bfa" : "rgba(167,139,250,0.65)",
                          }}
                        >
                          {row.points ?? 0}
                        </span>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          className="mx-4 my-3 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10 }}
        >
          <span
            className="text-[9px] font-black uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            CLUTCHGROUND
          </span>
          <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>
            {new Date().toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Bottom accent bar */}
        <div
          className="h-1 w-full"
          style={{ background: "linear-gradient(90deg,#7c3aed,#ff4d6d,#ff6b00)" }}
        />
      </div>
    </div>
  );
}
