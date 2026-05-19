/**
 * StandingsCard — Professional Esports-Grade Tournament Results Renderer
 *
 * Draws a pixel-perfect standings image on an HTML <canvas> element.
 * The card includes:
 *  - A dark glassmorphism background with neon accent grid lines
 *  - Tournament branding header with event name & "FINAL RESULTS" label
 *  - Top-3 podium highlight rows with gold/silver/bronze glows
 *  - Full ranked table with kills, position and points columns
 *  - A CLUTCHGROUND footer watermark
 *
 * Usage:
 *   <StandingsCard
 *     tournamentName="Grand Finals"
 *     mode="Squad"              // "Solo" | "Duo" | "Squad"
 *     results={[...]}           // array from getTournamentResults
 *   />
 *
 * The component also exposes a "Save Image" button that downloads the
 * canvas as a PNG.
 */

import { useEffect, useRef } from "react";
import { Download, ImageIcon } from "lucide-react";

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
  mode: "Solo" | "Duo" | "Squad" | string;
  results: ResultRow[];
}

/* ─── palette ─── */
const DARK_BG   = "#080c14";
const CARD_BG   = "#0d1220";
const BORDER    = "#1e2a3a";
const NEON      = "#00c8ff";
const GOLD      = "#f59e0b";
const SILVER    = "#94a3b8";
const BRONZE    = "#cd7c2f";
const ACCENT_1  = "#ff0055";
const WHITE     = "#ffffff";
const MUTED     = "#64748b";

const MEDAL_CLR = [GOLD, SILVER, BRONZE];

/* ─── helpers ─── */
const hex2rgb = (h: string) => {
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return { r, g, b };
};
const rgba = (hex: string, a: number) => {
  const { r, g, b } = hex2rgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};

/* Round a rectangle path */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ─── main draw function ─── */
function drawStandings(
  canvas: HTMLCanvasElement,
  tournamentName: string,
  mode: string,
  results: ResultRow[]
) {
  const showPoints = mode === "Squad";

  const sortedData = [...results].sort((a, b) => {
    if (b.points !== a.points) return (b.points || 0) - (a.points || 0);
    return (b.kills || 0) - (a.kills || 0);
  });

  const SCALE = 2;
  const W = 900;
  const HEADER_H = 160;
  const ROW_H = 56;
  const FOOTER_H = 60;
  const PADDING = 32;
  const H = HEADER_H + sortedData.length * ROW_H + FOOTER_H + PADDING;

  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0f0c1a");
  bg.addColorStop(0.5, "#16102a");
  bg.addColorStop(1, "#0a0a14");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Header gradient bar
  const headerGrad = ctx.createLinearGradient(0, 0, W, 0);
  headerGrad.addColorStop(0, "#ff6b00");
  headerGrad.addColorStop(0.5, "#ff4d6d");
  headerGrad.addColorStop(1, "#7c3aed");
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, W, 6);

  // Glow under top bar
  const glowGrad = ctx.createLinearGradient(0, 6, 0, 80);
  glowGrad.addColorStop(0, "rgba(255,107,0,0.18)");
  glowGrad.addColorStop(1, "transparent");
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 6, W, 74);

  // Logo / Brand
  ctx.font = "bold 13px 'Arial', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.textAlign = "left";
  ctx.fillText("GOD ESPORTS ARENA", PADDING, 36);

  // Trophy icon area (decorative circle)
  ctx.beginPath();
  ctx.arc(W - PADDING - 20, 44, 24, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,107,0,0.15)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,107,0,0.4)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ff6b00";
  ctx.fillText("🏆", W - PADDING - 20, 50);

  // Tournament title
  ctx.textAlign = "left";
  ctx.font = "bold 28px 'Arial Black', Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(tournamentName || "Tournament Results", PADDING, 76);

  // Sub-info
  ctx.font = "14px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  const modeLabel = `${mode} • Free Fire • Final Standings`;
  ctx.fillText(modeLabel, PADDING, 100);

  // Divider
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(PADDING, 114, W - PADDING * 2, 1);

  // Column config
  const cols = showPoints
    ? [
        { label: "RANK",  x: PADDING,       w: 60,  align: "center" as CanvasTextAlign },
        { label: "SQUAD / PLAYER", x: PADDING + 70, w: 340, align: "left" as CanvasTextAlign },
        { label: "KILLS", x: PADDING + 430, w: 100, align: "center" as CanvasTextAlign },
        { label: "POSITION", x: PADDING + 550, w: 110, align: "center" as CanvasTextAlign },
        { label: "POINTS", x: W - PADDING - 90, w: 90, align: "right" as CanvasTextAlign },
      ]
    : [
        { label: "RANK",  x: PADDING,       w: 60,  align: "center" as CanvasTextAlign },
        { label: "PLAYER / SQUAD", x: PADDING + 70, w: 430, align: "left" as CanvasTextAlign },
        { label: "KILLS", x: PADDING + 530, w: 140, align: "center" as CanvasTextAlign },
        { label: "POSITION", x: W - PADDING - 120, w: 120, align: "center" as CanvasTextAlign },
      ];

  // Column headers
  const tableTop = 126;
  ctx.font = "bold 10px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.letterSpacing = "2px";
  cols.forEach((col) => {
    ctx.textAlign = col.align;
    const tx = col.align === "right" ? col.x + col.w : col.align === "center" ? col.x + col.w / 2 : col.x;
    ctx.fillText(col.label, tx, tableTop);
  });
  ctx.letterSpacing = "0px";

  // Rows
  const rowStart = tableTop + 16;
  sortedData.forEach((r: any, i: number) => {
    const rowY = rowStart + i * ROW_H;
    const isTop3 = i < 3;

    // Row background
    if (i % 2 === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      ctx.beginPath();
      ctx.roundRect(PADDING - 8, rowY - 2, W - PADDING * 2 + 16, ROW_H - 4, 10);
      ctx.fill();
    }

    // Top-3 accent left border
    if (isTop3) {
      const rankColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
      ctx.fillStyle = rankColors[i];
      ctx.beginPath();
      ctx.roundRect(PADDING - 8, rowY - 2, 3, ROW_H - 4, 2);
      ctx.fill();
    }

    const cellMidY = rowY + ROW_H / 2 - 4;

    // RANK
    const rankColors3 = ["#FFD700", "#C0C0C0", "#CD7F32"];
    ctx.textAlign = "center";
    if (isTop3) {
      ctx.font = "bold 18px Arial";
      ctx.fillStyle = rankColors3[i];
      const rankEmojis = ["🥇", "🥈", "🥉"];
      ctx.fillText(rankEmojis[i], PADDING + 30, cellMidY + 8);
    } else {
      ctx.font = "bold 15px Arial";
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillText(`#${i + 1}`, PADDING + 30, cellMidY + 6);
    }

    // Squad / Player name
    const name = r.team_name || r.username || "Unknown";
    ctx.textAlign = "left";
    ctx.font = isTop3 ? "bold 15px Arial" : "600 14px Arial";
    ctx.fillStyle = isTop3 ? "#ffffff" : "rgba(255,255,255,0.8)";
    let displayName = name;
    const maxNameW = cols[1].w - 10;
    while (ctx.measureText(displayName).width > maxNameW && displayName.length > 4) {
      displayName = displayName.slice(0, -4) + "...";
    }
    ctx.fillText(displayName, cols[1].x, cellMidY + 6);

    // Kills
    const killsCol = cols[2];
    ctx.textAlign = "center";
    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.fillStyle = "#f97316";
    ctx.fillText(String(r.kills || 0), killsCol.x + killsCol.w / 2, cellMidY + 6);

    // Position
    const posCol = cols[3];
    ctx.textAlign = "center";
    ctx.font = "14px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(r.position ? `#${r.position}` : "—", posCol.x + posCol.w / 2, cellMidY + 6);

    // Points (Squad only, skip 0)
    if (showPoints) {
      const ptsCol = cols[4];
      const pts = r.points || 0;
      ctx.textAlign = "right";
      ctx.font = "bold 16px Arial";
      ctx.fillStyle = pts > 0 ? "#a78bfa" : "rgba(255,255,255,0.2)";
      ctx.fillText(pts > 0 ? String(pts) : "—", ptsCol.x + ptsCol.w, cellMidY + 6);
    }

    // Row divider
    if (i < sortedData.length - 1) {
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(PADDING, rowY + ROW_H - 6, W - PADDING * 2, 1);
    }
  });

  // Footer
  const footerY = rowStart + sortedData.length * ROW_H + 16;
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(PADDING, footerY, W - PADDING * 2, 1);
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillText(
    `godEsportsArena.com  •  Generated ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
    W / 2,
    footerY + 28,
  );

  // Bottom gradient bar
  const bottomGrad = ctx.createLinearGradient(0, 0, W, 0);
  bottomGrad.addColorStop(0, "#7c3aed");
  bottomGrad.addColorStop(0.5, "#ff4d6d");
  bottomGrad.addColorStop(1, "#ff6b00");
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, H - 4, W, 4);
}

/* ─── React component ─── */
export function StandingsCard({ tournamentName, mode, results }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && results.length > 0) {
      drawStandings(canvasRef.current, tournamentName, mode, results);
    }
  }, [tournamentName, mode, results]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `${tournamentName.replace(/\s+/g, "_")}_Standings.png`;
    link.href     = canvasRef.current.toDataURL("image/png");
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

  return (
    <div className="flex flex-col gap-3">
      {/* Canvas wrapped in a scrollable container */}
      <div
        className="rounded-2xl overflow-hidden border border-border shadow-card"
        style={{ background: "#080c14" }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="w-full h-11 rounded-2xl flex items-center justify-center gap-2 border border-border text-sm font-black uppercase tracking-widest press-effect active:scale-95 transition-all"
        style={{ background: "rgba(0,200,255,0.08)", color: "#00c8ff", borderColor: "rgba(0,200,255,0.25)" }}
      >
        <Download className="w-4 h-4" />
        Save Standings Image
      </button>
    </div>
  );
}
