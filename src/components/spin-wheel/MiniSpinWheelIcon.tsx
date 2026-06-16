const SEGMENTS = [
  "#FF6B00",
  "#1E293B",
  "#F59E0B",
  "#334155",
  "#10B981",
  "#475569",
  "#8B5CF6",
  "#FFD700",
];

export function MiniSpinWheelIcon({ className = "" }: { className?: string }) {
  const size = 56;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;
  const n = SEGMENTS.length;
  const step = 360 / n;

  const polar = (angle: number, radius: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const arc = (i: number) => {
    const start = i * step;
    const end = start + step;
    const p1 = polar(end, r);
    const p2 = polar(start, r);
    const large = step > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 0 ${p2.x} ${p2.y} Z`;
  };

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Fixed pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5 z-20">
        <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[9px] border-l-transparent border-r-transparent border-t-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" />
      </div>

      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 p-[3px] shadow-[0_6px_20px_rgba(255,107,0,0.5)]">
        <div className="w-full h-full rounded-full bg-[#0a0f18] p-[2px] overflow-hidden">
          {/* Spinning wheel */}
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="w-full h-full animate-[spin_3s_linear_infinite]"
          >
            {SEGMENTS.map((color, i) => (
              <path
                key={i}
                d={arc(i)}
                fill={color}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="0.5"
              />
            ))}
            <circle
              cx={cx}
              cy={cy}
              r={r * 0.22}
              fill="#141c2b"
              stroke="#FF6B00"
              strokeWidth="1.5"
            />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#FF6B00"
              fontSize="7"
              fontWeight="900"
            >
              CG
            </text>
          </svg>
        </div>
      </div>

      {/* Daily badge */}
      <span className="absolute -top-0.5 -right-0.5 z-30 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center border-2 border-card shadow-sm">
        1
      </span>
    </div>
  );
}
