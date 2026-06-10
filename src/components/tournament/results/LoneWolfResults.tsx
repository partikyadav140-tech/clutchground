/**
 * LoneWolfResults — Professional Solo (Lone Wolf) Tournament Results
 *
 * Renders individual player standings with:
 *  - Player avatars and IGN/UID labels
 *  - Solo-specific metrics (kills, points, position)
 *  - Professional esports-grade styling
 *  - Podium highlighting for top 3
 */

import { useEffect, useRef } from "react";
import { Download, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlayerResult {
  id?: number;
  username?: string;
  ign?: string;
  uid?: string;
  avatar_url?: string;
  points?: number;
  kills?: number;
  position?: number;
}

interface Props {
  tournamentName: string;
  results: PlayerResult[];
}

const DARK_BG = "#080c14";
const CARD_BG = "#0d1220";
const BORDER = "#1e2a3a";
const NEON = "#00c8ff";
const GOLD = "#f59e0b";
const SILVER = "#94a3b8";
const BRONZE = "#cd7c2f";
const ACCENT_1 = "#ff0055";
const WHITE = "#ffffff";
const MUTED = "#64748b";

const MEDAL_CLR = [GOLD, SILVER, BRONZE];

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

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
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

function drawLoneWolfResults(
  canvas: HTMLCanvasElement,
  tournamentName: string,
  results: PlayerResult[]
) {
  const SCALE = 2;
  const W = 900;
  const HEADER_H = 160;
  const ROW_H = 56;
  const FOOTER_H = 60;
  const PADDING = 32;
  const H = HEADER_H + results.length * ROW_H + FOOTER_H + PADDING;

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

  // Header gradient bar
  const headerGrad = ctx.createLinearGradient(0, 0, W, 0);
  headerGrad.addColorStop(0, "#ff6b00");
  headerGrad.addColorStop(0.5, "#ff4d6d");
  headerGrad.addColorStop(1, "#7c3aed");
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, W, 6);

  // Glow under top bar
  const glowGrad = ctx.createLinearGradient(0, 6, 0, 80);
  glowGrad.addColorStop(0, rgba(ACCENT_1, 0.15));
  glowGrad.addColorStop(1, rgba(ACCENT_1, 0));
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 6, W, 74);

  // Title
  ctx.font = "700 48px Inter, sans-serif";
  ctx.fillStyle = WHITE;
  ctx.textAlign = "left";
  ctx.fillText("LONE WOLF RESULTS", PADDING, 76);

  // Subtitle
  ctx.font = "400 18px Inter, sans-serif";
  ctx.fillStyle = MUTED;
  ctx.fillText(tournamentName || "Tournament Results", PADDING, 108);

  // Column headers
  ctx.fillStyle = MUTED;
  ctx.font = "600 14px Inter, sans-serif";
  ctx.textAlign = "left";
  let x = PADDING;
  ctx.fillText("#", x, 150);
  x += 40;
  ctx.fillText("PLAYER", x, 150);
  x += 400;
  ctx.fillText("KILLS", x, 150);

  // Render player rows
  results.slice(0, 50).forEach((player, idx) => {
    const y = HEADER_H + idx * ROW_H;
    const isPodium = idx < 3;
    const medalColor = isPodium ? MEDAL_CLR[idx] : null;

    // Background highlight for podium
    if (isPodium) {
      ctx.fillStyle = rgba(medalColor!, 0.08);
      ctx.fillRect(PADDING, y + 4, W - PADDING * 2, ROW_H - 8);

      // Medal left accent bar
      ctx.fillStyle = medalColor!;
      ctx.fillRect(PADDING, y + 4, 4, ROW_H - 8);
    }

    // Rank / Medal
    ctx.font = "700 18px Inter, sans-serif";
    ctx.fillStyle = medalColor || NEON;
    ctx.textAlign = "center";
    ctx.fillText(`#${idx + 1}`, PADDING + 20, y + 36);

    // Player name / IGN
    ctx.font = "600 14px Inter, sans-serif";
    ctx.fillStyle = WHITE;
    ctx.textAlign = "left";
    let x = PADDING + 40;
    const playerName = player.ign || player.username || `Player ${idx + 1}`;
    ctx.fillText(playerName, x, y + 24);

    // UID
    ctx.font = "400 12px Inter, sans-serif";
    ctx.fillStyle = MUTED;
    ctx.fillText(`UID: ${player.uid || "—"}`, x, y + 40);

    // Kills
    ctx.font = "600 14px Inter, sans-serif";
    ctx.fillStyle = NEON;
    ctx.textAlign = "center";
    ctx.fillText(`${player.kills || 0}`, PADDING + 520, y + 36);
  });

  // Footer
  ctx.fillStyle = rgba(BORDER, 0.5);
  ctx.fillRect(0, H - FOOTER_H, W, FOOTER_H);

  ctx.font = "600 14px Inter, sans-serif";
  ctx.fillStyle = MUTED;
  ctx.textAlign = "left";
  ctx.fillText("Powered by CLUTCHGROUND", PADDING, H - 18);

  ctx.font = "400 12px Inter, sans-serif";
  ctx.fillStyle = rgba(WHITE, 0.5);
  ctx.textAlign = "right";
  ctx.fillText(`${new Date().toLocaleDateString()}`, W - PADDING, H - 18);
}

export function LoneWolfResults({ tournamentName, results }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      drawLoneWolfResults(canvasRef.current, tournamentName, results);
    }
  }, [tournamentName, results]);

  const downloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.href = canvasRef.current.toDataURL("image/png");
    link.download = `lone-wolf-results-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="space-y-4">
      <canvas
        ref={canvasRef}
        className="w-full border border-border rounded-lg bg-card/50"
      />
      <Button
        onClick={downloadImage}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        Save Image
      </Button>
    </div>
  );
}

export default LoneWolfResults;
