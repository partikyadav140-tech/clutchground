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
  const W        = 800;
  const ROW_H    = 54;
  const PAD      = 28;
  const HEADER_H = 130;
  const FOOTER_H = 48;
  const H        = HEADER_H + results.length * ROW_H + FOOTER_H + PAD;

  canvas.width  = W;
  canvas.height = H;

  const ctx = canvas.getContext("2d")!;

  /* ── 1. Background ── */
  ctx.fillStyle = DARK_BG;
  ctx.fillRect(0, 0, W, H);

  /* subtle grid lines */
  ctx.strokeStyle = rgba(NEON, 0.04);
  ctx.lineWidth   = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  /* top neon bar */
  const bar = ctx.createLinearGradient(0, 0, W, 0);
  bar.addColorStop(0,   ACCENT_1);
  bar.addColorStop(0.5, NEON);
  bar.addColorStop(1,   ACCENT_1);
  ctx.fillStyle = bar;
  ctx.fillRect(0, 0, W, 4);

  /* ── 2. Header ── */
  /* glow orb */
  const orb = ctx.createRadialGradient(W / 2, 70, 10, W / 2, 70, 180);
  orb.addColorStop(0, rgba(NEON, 0.12));
  orb.addColorStop(1, rgba(NEON, 0));
  ctx.fillStyle = orb;
  ctx.fillRect(0, 0, W, HEADER_H);

  /* CLUTCHGROUND wordmark */
  ctx.font      = "bold 11px monospace";
  ctx.fillStyle = rgba(NEON, 0.6);
  ctx.letterSpacing = "4px";
  ctx.textAlign = "center";
  ctx.fillText("CLUTCHGROUND  ·  ESPORTS ARENA", W / 2, 30);
  ctx.letterSpacing = "0px";

  /* Tournament name */
  ctx.font      = "bold 30px 'Arial Black', Arial, sans-serif";
  ctx.fillStyle = WHITE;
  ctx.textAlign = "center";
  ctx.fillText(tournamentName.toUpperCase(), W / 2, 72);

  /* "FINAL RESULTS" badge */
  const badgeW = 160, badgeH = 24, badgeX = W / 2 - badgeW / 2, badgeY = 84;
  const badgeGrad = ctx.createLinearGradient(badgeX, 0, badgeX + badgeW, 0);
  badgeGrad.addColorStop(0, rgba(ACCENT_1, 0.85));
  badgeGrad.addColorStop(1, rgba(NEON,     0.85));
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 12);
  ctx.fillStyle = badgeGrad;
  ctx.fill();

  ctx.font      = "bold 10px monospace";
  ctx.fillStyle = WHITE;
  ctx.letterSpacing = "3px";
  ctx.textAlign = "center";
  ctx.fillText("FINAL RESULTS", W / 2, badgeY + 16);
  ctx.letterSpacing = "0px";

  /* divider */
  const div = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
  div.addColorStop(0,   rgba(NEON, 0));
  div.addColorStop(0.5, rgba(NEON, 0.4));
  div.addColorStop(1,   rgba(NEON, 0));
  ctx.strokeStyle = div;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, HEADER_H - 8);
  ctx.lineTo(W - PAD, HEADER_H - 8);
  ctx.stroke();

  /* ── 3. Column headers ── */
  const COL_RANK = 60;
  const COL_NAME = 240;
  const COL_MODE = 380;
  const COL_KILL = 520;
  const COL_POS  = 640;
  const COL_PTS  = 740;

  const hdrY = HEADER_H + 18;
  ctx.font      = "bold 10px monospace";
  ctx.fillStyle = rgba(WHITE, 0.3);
  ctx.letterSpacing = "2px";
  ctx.textAlign = "center";
  const hdrs: [string, number][] = [
    ["RANK", COL_RANK],
    ["PLAYER / TEAM", 300],
    ["MODE", COL_MODE],
    ["KILLS", COL_KILL],
    ["POS", COL_POS],
    ["POINTS", COL_PTS],
  ];
  hdrs.forEach(([label, x]) => ctx.fillText(label, x, hdrY));
  ctx.letterSpacing = "0px";

  /* ── 4. Rows ── */
  results.forEach((r, idx) => {
    const rowY   = HEADER_H + 28 + idx * ROW_H;
    const isTop3 = idx < 3;
    const clr    = isTop3 ? MEDAL_CLR[idx] : rgba(WHITE, 0.06);
    const name   = (mode === "Squad" ? r.team_name || r.username : r.username) || "?";

    /* row background */
    if (isTop3) {
      const rg = ctx.createLinearGradient(PAD, rowY, W - PAD, rowY);
      rg.addColorStop(0, rgba(clr, 0.12));
      rg.addColorStop(0.5, rgba(clr, 0.06));
      rg.addColorStop(1, rgba(clr, 0.0));
      roundRect(ctx, PAD, rowY + 2, W - PAD * 2, ROW_H - 4, 10);
      ctx.fillStyle = rg;
      ctx.fill();

      /* left accent */
      roundRect(ctx, PAD, rowY + 2, 4, ROW_H - 4, 2);
      ctx.fillStyle = clr;
      ctx.fill();
    } else {
      /* subtle separator */
      ctx.strokeStyle = rgba(WHITE, 0.04);
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(PAD, rowY + ROW_H - 1);
      ctx.lineTo(W - PAD, rowY + ROW_H - 1);
      ctx.stroke();
    }

    const midY = rowY + ROW_H / 2 + 1;

    /* rank medal / number */
    const medals = ["🥇", "🥈", "🥉"];
    ctx.textAlign = "center";
    if (isTop3) {
      ctx.font = "22px serif";
      ctx.fillText(medals[idx], COL_RANK, midY + 8);
    } else {
      ctx.font      = "bold 14px 'Arial Black', Arial, sans-serif";
      ctx.fillStyle = rgba(WHITE, 0.35);
      ctx.fillText(String(idx + 1), COL_RANK, midY + 5);
    }

    /* avatar circle */
    const avX = 108, avR = 17;
    ctx.beginPath();
    ctx.arc(avX, midY, avR, 0, Math.PI * 2);
    ctx.fillStyle = isTop3 ? rgba(clr, 0.18) : rgba(WHITE, 0.06);
    ctx.fill();
    ctx.strokeStyle = isTop3 ? rgba(clr, 0.5) : rgba(WHITE, 0.1);
    ctx.lineWidth   = isTop3 ? 2 : 1;
    ctx.stroke();

    ctx.font      = "bold 14px Arial, sans-serif";
    ctx.fillStyle = isTop3 ? clr : rgba(WHITE, 0.4);
    ctx.textAlign = "center";
    ctx.fillText(name[0].toUpperCase(), avX, midY + 5);

    /* name */
    ctx.textAlign = "left";
    ctx.font      = `bold 14px 'Arial Black', Arial, sans-serif`;
    ctx.fillStyle = isTop3 ? clr : rgba(WHITE, 0.85);
    const nameMaxW = 190;
    // truncate if needed
    let displayName = name;
    while (ctx.measureText(displayName).width > nameMaxW && displayName.length > 2) {
      displayName = displayName.slice(0, -1);
    }
    if (displayName !== name) displayName += "…";
    ctx.fillText(displayName, 132, midY + 5);

    /* mode pill */
    const modeW = 58, modeH = 22;
    const modeX = COL_MODE - modeW / 2, modeY2 = midY - modeH / 2;
    roundRect(ctx, modeX, modeY2, modeW, modeH, 11);
    ctx.fillStyle = rgba(NEON, 0.1);
    ctx.fill();
    ctx.strokeStyle = rgba(NEON, 0.3);
    ctx.lineWidth   = 1;
    ctx.stroke();
    ctx.font      = "bold 9px monospace";
    ctx.fillStyle = NEON;
    ctx.letterSpacing = "1px";
    ctx.textAlign = "center";
    ctx.fillText(mode.toUpperCase(), COL_MODE, midY + 4);
    ctx.letterSpacing = "0px";

    /* kills */
    ctx.textAlign = "center";
    ctx.font      = `bold 16px 'Arial Black', Arial, sans-serif`;
    ctx.fillStyle = isTop3 ? clr : rgba(WHITE, 0.9);
    ctx.fillText(String(r.kills ?? 0), COL_KILL, midY + 6);

    /* position */
    ctx.font      = `bold 16px 'Arial Black', Arial, sans-serif`;
    ctx.fillStyle = rgba(WHITE, 0.55);
    ctx.fillText(r.position ? `#${r.position}` : "–", COL_POS, midY + 6);

    /* points */
    ctx.font      = `bold 18px 'Arial Black', Arial, sans-serif`;
    ctx.fillStyle = isTop3 ? clr : NEON;
    ctx.fillText(String(r.points ?? 0), COL_PTS, midY + 6);
  });

  /* ── 5. Footer ── */
  const footY = H - FOOTER_H;
  ctx.fillStyle = rgba(NEON, 0.03);
  ctx.fillRect(0, footY, W, FOOTER_H);

  const footDiv = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
  footDiv.addColorStop(0,   rgba(NEON, 0));
  footDiv.addColorStop(0.5, rgba(NEON, 0.25));
  footDiv.addColorStop(1,   rgba(NEON, 0));
  ctx.strokeStyle = footDiv;
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(PAD, footY); ctx.lineTo(W - PAD, footY); ctx.stroke();

  ctx.font      = "bold 11px monospace";
  ctx.fillStyle = rgba(WHITE, 0.2);
  ctx.textAlign = "center";
  ctx.letterSpacing = "3px";
  ctx.fillText("CLUTCHGROUND  ·  INDIA'S #1 FREE FIRE ARENA", W / 2, footY + 30);
  ctx.letterSpacing = "0px";
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
