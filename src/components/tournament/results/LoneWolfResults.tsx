/**
 * LoneWolfResults — Professional Lone Wolf (Solo Ranked) Tournament Standings
 *
 * Mobile-first HTML table: Rank | Player | Kills | Position
 * Keeps hidden canvas for "Save Image" download.
 */

import { useEffect, useRef } from "react";
import { Download, ImageIcon, Flame } from "lucide-react";

interface PlayerResult {
  id?: number;
  username?: string;
  ign?: string;
  uid?: string;
  kills?: number;
  position?: number;
}

interface Props {
  tournamentName: string;
  results: PlayerResult[];
}

const MEDAL = [
  { border: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "🥇" },
  { border: "#94a3b8", bg: "rgba(148,163,184,0.10)", label: "🥈" },
  { border: "#cd7c2f", bg: "rgba(205,124,47,0.10)",  label: "🥉" },
];

/* ── canvas for download ── */
function drawCanvas(canvas: HTMLCanvasElement, tournamentName: string, results: PlayerResult[]) {
  const SCALE=2,W=900,PAD=32,HEADER_H=160,ROW_H=56,FOOTER_H=60;
  const H=HEADER_H+results.length*ROW_H+FOOTER_H+PAD;
  canvas.width=W*SCALE; canvas.height=H*SCALE;
  const ctx=canvas.getContext("2d")!;
  ctx.scale(SCALE,SCALE);
  const bg=ctx.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,"#0f0c1a");bg.addColorStop(0.5,"#16102a");bg.addColorStop(1,"#0a0a14");
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle="rgba(255,255,255,0.03)";ctx.lineWidth=1;
  for(let x=0;x<W;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=60){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  const hg=ctx.createLinearGradient(0,0,W,0);
  hg.addColorStop(0,"#ff6b00");hg.addColorStop(0.5,"#ff4d6d");hg.addColorStop(1,"#7c3aed");
  ctx.fillStyle=hg;ctx.fillRect(0,0,W,6);
  ctx.font="bold 13px Arial";ctx.fillStyle="rgba(255,255,255,0.4)";ctx.textAlign="left";
  ctx.fillText("CLUTCHGROUND • LONE WOLF",PAD,36);
  ctx.font="bold 28px Arial Black";ctx.fillStyle="#ffffff";
  ctx.fillText(tournamentName||"Lone Wolf Results",PAD,76);
  ctx.font="14px Arial";ctx.fillStyle="rgba(255,255,255,0.5)";
  ctx.fillText("Lone Wolf • Free Fire • Final Standings",PAD,100);
  ctx.fillStyle="rgba(255,255,255,0.08)";ctx.fillRect(PAD,114,W-PAD*2,1);
  const tableTop=126;
  ctx.font="bold 10px Arial";ctx.fillStyle="rgba(255,255,255,0.35)";ctx.letterSpacing="2px";
  [{label:"RANK",x:PAD,w:60,a:"center"as CanvasTextAlign},
   {label:"PLAYER",x:PAD+70,w:420,a:"left"as CanvasTextAlign},
   {label:"KILLS",x:PAD+510,w:130,a:"center"as CanvasTextAlign},
   {label:"POSITION",x:W-PAD-140,w:140,a:"center"as CanvasTextAlign}].forEach(c=>{
    ctx.textAlign=c.a;
    ctx.fillText(c.label,c.a==="center"?c.x+c.w/2:c.x,tableTop);
  });
  ctx.letterSpacing="0px";
  const rowStart=tableTop+16;
  const RANK_CLR=["#FFD700","#C0C0C0","#CD7F32"];
  results.forEach((r,i)=>{
    const ry=rowStart+i*ROW_H,top3=i<3;
    if(i%2===0){ctx.fillStyle="rgba(255,255,255,0.03)";ctx.beginPath();ctx.roundRect(PAD-8,ry-2,W-PAD*2+16,ROW_H-4,10);ctx.fill();}
    if(top3){ctx.fillStyle=RANK_CLR[i];ctx.beginPath();ctx.roundRect(PAD-8,ry-2,3,ROW_H-4,2);ctx.fill();}
    const cy=ry+ROW_H/2-4;
    ctx.textAlign="center";
    if(top3){ctx.font="bold 18px Arial";ctx.fillStyle=RANK_CLR[i];ctx.fillText(["🥇","🥈","🥉"][i],PAD+30,cy+8);}
    else{ctx.font="bold 15px Arial";ctx.fillStyle="rgba(255,255,255,0.35)";ctx.fillText(`#${i+1}`,PAD+30,cy+6);}
    const name=r.ign||r.username||`Player ${i+1}`;
    ctx.textAlign="left";ctx.font=top3?"bold 15px Arial":"600 14px Arial";
    ctx.fillStyle=top3?"#ffffff":"rgba(255,255,255,0.8)";
    ctx.fillText(name,PAD+70,cy+6);
    ctx.textAlign="center";ctx.font="bold 14px 'Courier New',monospace";ctx.fillStyle="#f97316";
    ctx.fillText(String(r.kills||0),PAD+510+65,cy+6);
    ctx.font="14px Arial";ctx.fillStyle="rgba(255,255,255,0.55)";
    ctx.fillText(r.position?`#${r.position}`:"—",W-PAD-70,cy+6);
    if(i<results.length-1){ctx.fillStyle="rgba(255,255,255,0.05)";ctx.fillRect(PAD,ry+ROW_H-6,W-PAD*2,1);}
  });
  const fy=rowStart+results.length*ROW_H+16;
  ctx.fillStyle="rgba(255,255,255,0.06)";ctx.fillRect(PAD,fy,W-PAD*2,1);
  ctx.font="12px Arial";ctx.textAlign="center";ctx.fillStyle="rgba(255,255,255,0.25)";
  ctx.fillText(`clutchground.games  •  ${new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}`,W/2,fy+28);
  const bg2=ctx.createLinearGradient(0,0,W,0);
  bg2.addColorStop(0,"#7c3aed");bg2.addColorStop(0.5,"#ff4d6d");bg2.addColorStop(1,"#ff6b00");
  ctx.fillStyle=bg2;ctx.fillRect(0,H-4,W,4);
}

/* ── React component ── */
export function LoneWolfResults({ tournamentName, results }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sorted = [...results].sort((a, b) => {
    const pa = a.position ?? 999, pb = b.position ?? 999;
    if (pa !== pb) return pa - pb;
    return (b.kills ?? 0) - (a.kills ?? 0);
  });

  useEffect(() => {
    if (canvasRef.current && results.length > 0) {
      drawCanvas(canvasRef.current, tournamentName, sorted);
    }
  }, [tournamentName, results]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `${tournamentName.replace(/\s+/g, "_")}_LoneWolf.png`;
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

  return (
    <div className="flex flex-col gap-3">
      {/* ── Professional HTML Table ── */}
      <div
        className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
        style={{ background: "linear-gradient(160deg,#0f0c1a 0%,#16102a 60%,#0a0a14 100%)" }}
      >
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg,#ff6b00,#ff4d6d,#7c3aed)" }} />

        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                style={{ background:"rgba(167,139,250,0.15)", color:"#a78bfa", border:"1px solid rgba(167,139,250,0.35)" }}
              >
                Lone Wolf
              </span>
              <span
                className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                style={{ background:"rgba(16,185,129,0.12)", color:"#10b981", border:"1px solid rgba(16,185,129,0.3)" }}
              >
                Final Results
              </span>
            </div>
            <h2 className="font-black text-base text-white leading-tight line-clamp-2">{tournamentName}</h2>
            <p className="text-[10px] text-white/40 mt-0.5 font-medium">Free Fire • clutchground.games</p>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
            style={{ background:"rgba(167,139,250,0.15)", border:"1px solid rgba(167,139,250,0.3)" }}
          >
            🐺
          </div>
        </div>

        <div className="h-px mx-4" style={{ background:"rgba(255,255,255,0.07)" }} />

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] border-collapse">
            <thead>
              <tr style={{ background:"rgba(255,255,255,0.04)" }}>
                <th className="text-left pl-4 pr-2 py-2.5 text-[9px] font-black uppercase tracking-widest" style={{ color:"rgba(255,255,255,0.3)", width:48 }}>#</th>
                <th className="text-left px-2 py-2.5 text-[9px] font-black uppercase tracking-widest" style={{ color:"rgba(255,255,255,0.3)" }}>Player</th>
                <th className="text-center px-2 py-2.5 text-[9px] font-black uppercase tracking-widest" style={{ color:"rgba(255,255,255,0.3)", width:64 }}>Kills</th>
                <th className="text-center pr-4 py-2.5 text-[9px] font-black uppercase tracking-widest" style={{ color:"rgba(255,255,255,0.3)", width:72 }}>Position</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => {
                const isTop3 = i < 3;
                const medal  = isTop3 ? MEDAL[i] : null;
                const name   = row.ign || row.username || `Player ${i + 1}`;
                return (
                  <tr
                    key={row.id ?? i}
                    style={{
                      background: medal?.bg ?? (i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent"),
                      borderLeft: isTop3 ? `3px solid ${medal!.border}` : "3px solid transparent",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <td className="pl-3 pr-2 py-3 text-center align-middle" style={{ width:48 }}>
                      {isTop3 ? (
                        <span className="text-base leading-none select-none">{medal!.label}</span>
                      ) : (
                        <span className="text-xs font-black tabular-nums" style={{ color:"rgba(255,255,255,0.3)" }}>#{i+1}</span>
                      )}
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <div>
                        <span className="font-bold text-sm leading-tight line-clamp-1 block" style={{ color: isTop3 ? "#ffffff" : "rgba(255,255,255,0.75)" }}>
                          {name}
                        </span>
                        {row.uid && (
                          <span className="text-[10px] font-medium" style={{ color:"rgba(255,255,255,0.3)" }}>
                            UID: {row.uid}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center align-middle" style={{ width:64 }}>
                      <div className="flex items-center justify-center gap-1">
                        <Flame className="w-2.5 h-2.5 shrink-0" style={{ color:"#f97316" }} />
                        <span className="font-black text-sm tabular-nums" style={{ color:"#f97316" }}>{row.kills ?? 0}</span>
                      </div>
                    </td>
                    <td className="pr-4 py-3 text-center align-middle" style={{ width:72 }}>
                      {row.position ? (
                        <span
                          className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-black tabular-nums"
                          style={{
                            background: row.position === 1 ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.07)",
                            color: row.position === 1 ? "#fbbf24" : "rgba(255,255,255,0.5)",
                            border: row.position === 1 ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(255,255,255,0.1)",
                            minWidth: 32,
                          }}
                        >
                          #{row.position}
                        </span>
                      ) : (
                        <span style={{ color:"rgba(255,255,255,0.2)", fontSize:12 }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mx-4 my-3 flex items-center justify-between" style={{ borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:10 }}>
          <span className="text-[9px] font-black uppercase tracking-widest" style={{ color:"rgba(255,255,255,0.2)" }}>CLUTCHGROUND</span>
          <span className="text-[9px]" style={{ color:"rgba(255,255,255,0.2)" }}>
            {new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}
          </span>
        </div>

        <div className="h-1 w-full" style={{ background:"linear-gradient(90deg,#7c3aed,#ff4d6d,#ff6b00)" }} />
      </div>

      <canvas ref={canvasRef} style={{ display:"none" }} />

      <button
        onClick={handleDownload}
        className="w-full h-11 rounded-2xl flex items-center justify-center gap-2 border text-sm font-black uppercase tracking-widest press-effect active:scale-95 transition-all"
        style={{ background:"rgba(0,200,255,0.08)", color:"#00c8ff", borderColor:"rgba(0,200,255,0.25)" }}
      >
        <Download className="w-4 h-4" />
        Save Standings Image
      </button>
    </div>
  );
}

export default LoneWolfResults;
