import { useMemo } from "react";
import { buildWheelSlices, type SpinSegment } from "@/lib/spin-wheel";

type SpinWheelProps = {
  segments: SpinSegment[];
  rotation: number;
  size?: number;
  spinning?: boolean;
  activePrizeIds?: string[];
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export function SpinWheel({
  segments,
  rotation,
  size = 300,
  spinning = false,
  activePrizeIds = [],
}: SpinWheelProps) {
  const slices = useMemo(() => buildWheelSlices(segments), [segments]);
  const total = slices.length || 1;
  const sliceAngle = 360 / total;
  const svgSize = size - 20;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const innerR = svgSize / 2 - 6;
  const activeSet = useMemo(() => new Set(activePrizeIds), [activePrizeIds]);

  return (
    <div className="relative mx-auto select-none" style={{ width: size, height: size }}>
      {/* Ambient glow */}
      <div
        className="absolute inset-4 rounded-full blur-2xl opacity-40 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,107,0,0.5) 0%, transparent 70%)" }}
      />

      {/* Metal outer ring */}
      <div
        className="absolute inset-0 rounded-full p-[5px]"
        style={{
          background: "linear-gradient(145deg, #FFD700 0%, #FF6B00 35%, #B45309 65%, #FFD700 100%)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.35)",
        }}
      >
        <div className="w-full h-full rounded-full bg-[#0c1018] p-[3px]">
          {/* Pin dots */}
          <div className="absolute inset-[10px] rounded-full pointer-events-none z-10">
            {Array.from({ length: total }).map((_, i) => {
              const a = i * sliceAngle + sliceAngle / 2;
              const p = polarToCartesian(size / 2, size / 2, size / 2 - 14, a);
              return (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-white/90 shadow-[0_0_4px_rgba(255,255,255,0.8)]"
                  style={{ left: p.x - 3, top: p.y - 3 }}
                />
              );
            })}
          </div>

          <div
            className="w-full h-full rounded-full overflow-hidden will-change-transform"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning
                ? "transform 5.2s cubic-bezier(0.12, 0.75, 0.18, 1)"
                : "none",
            }}
          >
            <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className="mx-auto mt-[2px]">
              {slices.map((slice, i) => {
                const start = i * sliceAngle;
                const end = start + sliceAngle;
                const mid = start + sliceAngle / 2;
                const path = describeArc(cx, cy, innerR, start, end);
                const labelPos = polarToCartesian(cx, cy, innerR * 0.68, mid);
                const isActive = activeSet.has(slice.segmentId);
                const textColor = slice.segment.amount >= 100 || slice.segment.amount === 0 ? "#fff" : "#0f172a";

                return (
                  <g key={`${slice.segmentId}-${i}`}>
                    <path
                      d={path}
                      fill={slice.segment.color}
                      stroke={isActive ? "rgba(255,215,0,0.55)" : "rgba(255,255,255,0.22)"}
                      strokeWidth={isActive ? 2 : 1}
                    />
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      fill={textColor}
                      fontSize={slice.segment.label.length > 7 ? 8 : 10}
                      fontWeight="800"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${mid}, ${labelPos.x}, ${labelPos.y})`}
                      style={{ fontFamily: "system-ui, sans-serif", textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}
                    >
                      {slice.segment.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Center hub — fixed, does not rotate */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div
          className="w-[18%] h-[18%] rounded-full flex items-center justify-center font-display font-black text-primary"
          style={{
            background: "linear-gradient(145deg, #1a2234, #0c1018)",
            border: "3px solid #FF6B00",
            boxShadow: "0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
            fontSize: size * 0.045,
          }}
        >
          CG
        </div>
      </div>

      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30" style={{ marginTop: -2 }}>
        <div
          className="relative"
          style={{
            width: 0,
            height: 0,
            borderLeft: "14px solid transparent",
            borderRight: "14px solid transparent",
            borderTop: "26px solid #FF6B00",
            filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.5))",
          }}
        />
        <div
          className="absolute top-[2px] left-1/2 -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: "9px solid transparent",
            borderRight: "9px solid transparent",
            borderTop: "18px solid #FFD700",
          }}
        />
      </div>
    </div>
  );
}
