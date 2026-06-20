/**
 * StandingsCard — Professional Esports-Grade Tournament Results
 *
 * Renders a mobile-first HTML standings table (Thryl/BGMI-inspired).
 * Keeps a hidden canvas for "Save Image" download.
 *
 * Column rules:
 *  - Battle Royale Solo / Duo  → Rank | Player | Kills | Position
 *  - Battle Royale Squad       → Rank | Squad  | Kills | Position | Points
 *  - Clash Squad               → Rank | Team   | Kills | Position
 *  - Lone Wolf                 → Rank | Player | Kills | Position
 */

import { useEffect, useRef } from "react";
import { Download, ImageIcon, Flame, MapPin, Star, Swords } from "lucide-react";

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

/* ─── palette ─── */
const DARK_BG = "#080c14";
const W = 900;
const SCALE = 2;

/* ─── Medal colours ─── */
const MEDAL = [
  { border: "#f59e0b", bg: "rgba(245,158,11,0.12)", text: "#fbbf24", label: "🥇" },
  { border: "#94a3b8", bg: "rgba(148,163,184,0.10)", text: "#cbd5e1", label: "🥈" },
  { border: "#cd7c2f", bg: "rgba(205,124,47,0.10)", text: "#f97316", label: "🥉" },
];

/* ─── Canvas draw (kept for download only) ─── */
function drawCanvas(
  canvas: HTMLCanvasElement,
  tournamentName: string,
  mode: string,
  results: ResultRow[],
  showPoints: boolean,
) {
  const sorted = [...results].sort((a, b) => {
    if (!showPoints) {
      const pa = a.position ?? 999,
        pb = b.position ?? 999;
      if (pa !== pb) return pa - pb;
      return (b.kills ?? 0) - (a.kills ?? 0);
    }
    if (b.points !== a.points) return (b.points ?? 0) - (a.points ?? 0);
    return (b.kills ?? 0) - (a.kills ?? 0);
  });

  const ROW_H = 56;
  const HEADER_H = 160;
  const FOOTER_H = 60;
  const PAD = 32;
  const H = HEADER_H + sorted.length * ROW_H + FOOTER_H + PAD;

  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0f0c1a");
  bg.addColorStop(0.5, "#16102a");
  bg.addColorStop(1, "#0a0a14");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  const hg = ctx.createLinearGradient(0, 0, W, 0);
  hg.addColorStop(0, "#ff6b00");
  hg.addColorStop(0.5, "#ff4d6d");
  hg.addColorStop(1, "#7c3aed");
  ctx.fillStyle = hg;
  ctx.fillRect(0, 0, W, 6);

  ctx.font = "bold 13px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.textAlign = "left";
  ctx.fillText("CLUTCHGROUND", PAD, 36);
  ctx.font = "bold 28px Arial Black";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(tournamentName || "Tournament Results", PAD, 76);
  ctx.font = "14px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText(`${mode} • Free Fire • Final Standings`, PAD, 100);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(PAD, 114, W - PAD * 2, 1);

  const cols = showPoints
    ? [
        { label: "RANK", x: PAD, w: 60, align: "center" as CanvasTextAlign },
        { label: "SQUAD", x: PAD + 70, w: 340, align: "left" as CanvasTextAlign },
        { label: "KILLS", x: PAD + 430, w: 100, align: "center" as CanvasTextAlign },
        { label: "POSITION", x: PAD + 550, w: 110, align: "center" as CanvasTextAlign },
        { label: "POINTS", x: W - PAD - 90, w: 90, align: "right" as CanvasTextAlign },
      ]
    : [
        { label: "RANK", x: PAD, w: 60, align: "center" as CanvasTextAlign },
        { label: "PLAYER / TEAM", x: PAD + 70, w: 430, align: "left" as CanvasTextAlign },
        { label: "KILLS", x: PAD + 530, w: 140, align: "center" as CanvasTextAlign },
        { label: "POSITION", x: W - PAD - 120, w: 120, align: "center" as CanvasTextAlign },
      ];

  const tableTop = 126;
  ctx.font = "bold 10px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.letterSpacing = "2px";
  cols.forEach((c) => {
    ctx.textAlign = c.align;
    const tx = c.align === "right" ? c.x + c.w : c.align === "center" ? c.x + c.w / 2 : c.x;
    ctx.fillText(c.label, tx, tableTop);
  });
  ctx.letterSpacing = "0px";

  const rowStart = tableTop + 16;
  const RANK_CLR = ["#FFD700", "#C0C0C0", "#CD7F32"];
  sorted.forEach((r: any, i: number) => {
    const ry = rowStart + i * ROW_H;
    const top3 = i < 3;
    if (i % 2 === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      ctx.beginPath();
      ctx.roundRect(PAD - 8, ry - 2, W - PAD * 2 + 16, ROW_H - 4, 10);
      ctx.fill();
    }
    if (top3) {
      ctx.fillStyle = RANK_CLR[i];
      ctx.beginPath();
      ctx.roundRect(PAD - 8, ry - 2, 3, ROW_H - 4, 2);
      ctx.fill();
    }
    const cy = ry + ROW_H / 2 - 4;
    ctx.textAlign = "center";
    if (top3) {
      ctx.font = "bold 18px Arial";
      ctx.fillStyle = RANK_CLR[i];
      ctx.fillText(["🥇", "🥈", "🥉"][i], PAD + 30, cy + 8);
    } else {
      ctx.font = "bold 15px Arial";
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillText(`#${i + 1}`, PAD + 30, cy + 6);
    }
    const name = r.team_name || r.username || "Unknown";
    ctx.textAlign = "left";
    ctx.font = top3 ? "bold 15px Arial" : "600 14px Arial";
    ctx.fillStyle = top3 ? "#ffffff" : "rgba(255,255,255,0.8)";
    let dn = name;
    while (ctx.measureText(dn).width > cols[1].w - 10 && dn.length > 4)
      dn = dn.slice(0, -4) + "...";
    ctx.fillText(dn, cols[1].x, cy + 6);
    const kc = cols[2];
    ctx.textAlign = "center";
    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.fillStyle = "#f97316";
    ctx.fillText(String(r.kills || 0), kc.x + kc.w / 2, cy + 6);
    const pc = cols[3];
    ctx.font = "14px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(r.position ? `#${r.position}` : "—", pc.x + pc.w / 2, cy + 6);
    if (showPoints && cols[4]) {
      const ptc = cols[4];
      ctx.textAlign = "right";
      ctx.font = "bold 16px Arial";
      ctx.fillStyle = "#a78bfa";
      ctx.fillText(String(r.points || 0), ptc.x + ptc.w, cy + 6);
    }
    if (i < sorted.length - 1) {
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(PAD, ry + ROW_H - 6, W - PAD * 2, 1);
    }
  });

  const fy = rowStart + sorted.length * ROW_H + 16;
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(PAD, fy, W - PAD * 2, 1);
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillText(
    `clutchground.games  •  ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
    W / 2,
    fy + 28,
  );
  const bg2 = ctx.createLinearGradient(0, 0, W, 0);
  bg2.addColorStop(0, "#7c3aed");
  bg2.addColorStop(0.5, "#ff4d6d");
  bg2.addColorStop(1, "#ff6b00");
  ctx.fillStyle = bg2;
  ctx.fillRect(0, H - 4, W, 4);
}

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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const modeL = mode?.toLowerCase() ?? "";
  const typeL = tournamentType?.toLowerCase() ?? "";
  const showPoints = modeL === "squad" && typeL !== "clash_squad" && typeL !== "lone_wolf";

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

  useEffect(() => {
    if (canvasRef.current && results.length > 0) {
      drawCanvas(canvasRef.current, tournamentName, mode, results, showPoints);
    }
  }, [tournamentName, mode, results, showPoints]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `${tournamentName.replace(/\s+/g, "_")}_Standings.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

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
                <th
                  className="text-center px-2 py-2.5 text-[9px] font-black uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.3)", width: 64 }}
                >
                  {showPoints && isOverall ? "Rank" : "Pos"}
                </th>
                {showPoints && booyahCounts && Object.keys(booyahCounts).length > 0 && (
                  <th
                    className="text-center px-1 py-2.5 text-[9px] font-black uppercase tracking-widest"
                    style={{ color: "rgba(255,255,255,0.3)", width: 48 }}
                  >
                    🏆
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

                    {/* Position / Rank */}
                    <td className="px-2 py-3 text-center align-middle" style={{ width: 64 }}>
                      {(() => {
                        // For overall standings in Squad BR, show rank; per-match shows raw position
                        const displayPos = showPoints && isOverall ? i + 1 : row.position;
                        return displayPos ? (
                          <span
                            className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-black tabular-nums"
                            style={{
                              background:
                                displayPos === 1
                                  ? "rgba(245,158,11,0.18)"
                                  : "rgba(255,255,255,0.07)",
                              color: displayPos === 1 ? "#fbbf24" : "rgba(255,255,255,0.5)",
                              border:
                                displayPos === 1
                                  ? "1px solid rgba(245,158,11,0.4)"
                                  : "1px solid rgba(255,255,255,0.1)",
                              minWidth: 32,
                            }}
                          >
                            #{displayPos}
                          </span>
                        ) : (
                          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>—</span>
                        );
                      })()}
                    </td>

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

      {/* Hidden canvas for image download */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="w-full h-11 rounded-2xl flex items-center justify-center gap-2 border text-sm font-black uppercase tracking-widest press-effect active:scale-95 transition-all"
        style={{
          background: "rgba(0,200,255,0.08)",
          color: "#00c8ff",
          borderColor: "rgba(0,200,255,0.25)",
        }}
      >
        <Download className="w-4 h-4" />
        Save Standings Image
      </button>
    </div>
  );
}
