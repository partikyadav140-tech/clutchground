import { useMemo, useEffect, useRef, useState } from "react";
import { buildWheelSlices, rotationDeltaForSlice, type SpinSegment } from "@/lib/spin-wheel";

type SpinWheelProps = {
  segments: SpinSegment[];
  rotation?: number;
  size?: number;
  isSpinning?: boolean;
  targetSliceIndex?: number | null;
  activePrizeIds?: string[];
  onFinished?: (winningSegment: SpinSegment) => void;
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
  rotation = 0,
  size = 300,
  isSpinning = false,
  targetSliceIndex = null,
  activePrizeIds = [],
  onFinished,
}: SpinWheelProps) {
  const slices = useMemo(() => buildWheelSlices(segments), [segments]);
  const total = slices.length || 1;
  const sliceAngle = 360 / total;
  const svgSize = size - 20;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const innerR = svgSize / 2 - 6;
  const activeSet = useMemo(() => new Set(activePrizeIds), [activePrizeIds]);

  const [winningSliceIndex, setWinningSliceIndex] = useState<number | null>(null);

  const wheelRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const angleRef = useRef(rotation);
  const pointerTiltRef = useRef(0);
  const lastPegIndexRef = useRef(-1);

  const targetSliceIndexRef = useRef(targetSliceIndex);
  const onFinishedRef = useRef(onFinished);
  const slicesRef = useRef(slices);

  // Synchronize targetSliceIndex, onFinished, and slices to refs
  useEffect(() => {
    targetSliceIndexRef.current = targetSliceIndex;
  }, [targetSliceIndex]);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  useEffect(() => {
    slicesRef.current = slices;
  }, [slices]);

  // Synchronize initial angle from parent
  useEffect(() => {
    if (!isSpinning) {
      angleRef.current = rotation;
      if (wheelRef.current) {
        wheelRef.current.style.transform = `rotate(${rotation}deg) translate3d(0,0,0)`;
      }
    }
  }, [rotation]);

  // Main animation effect using requestAnimationFrame
  useEffect(() => {
    if (isSpinning) {
      setWinningSliceIndex(null);

      let startAngle = angleRef.current;
      let targetAngle: number | null = null;
      let startTime = performance.now();
      let lastFrameTime = performance.now();
      let duration = 4000; // Will be computed dynamically during Phase 2
      let isDecelerating = false;

      const V_IDLE = 0.75; // 750 degrees per second (about 2 spins per second)
      let D = 0;

      const animate = (now: number) => {
        if (!wheelRef.current) return;

        const currentTarget = targetSliceIndexRef.current;
        const dt = now - lastFrameTime;
        lastFrameTime = now;

        if (currentTarget === null) {
          // Phase 1: Constant idle spinning (waiting for backend response)
          angleRef.current += V_IDLE * dt;
          angleRef.current = angleRef.current % 360000; // Keep in safe numeric range
        } else {
          // Phase 2: Deceleration (target specified)
          if (!isDecelerating) {
            isDecelerating = true;
            startAngle = angleRef.current;

            // Calculate target angle matching segment boundary
            const sliceCenter = currentTarget * sliceAngle + sliceAngle / 2;
            const targetMod = (360 - sliceCenter + 360) % 360;
            const currentMod = ((startAngle % 360) + 360) % 360;

            let delta = (targetMod - currentMod + 360) % 360;
            // Add 2 full spins to guarantee a smooth deceleration ramp
            delta += 2 * 360;

            targetAngle = startAngle + delta;
            D = delta;
            startTime = now;

            // Dynamically set deceleration duration so initial velocity matches V_IDLE
            // T = 2 * D / V_IDLE (constant deceleration formula)
            duration = (2 * D) / V_IDLE;
          }

          const elapsed = now - startTime;
          if (elapsed < duration) {
            // Constant friction deceleration equation (strictly monotonic decay of velocity from V_IDLE to 0)
            angleRef.current = startAngle + V_IDLE * elapsed - (V_IDLE / (2 * duration)) * Math.pow(elapsed, 2);
          } else {
            // Wheel fully stopped
            angleRef.current = targetAngle!;
            wheelRef.current.style.transform = `rotate(${angleRef.current}deg) translate3d(0,0,0)`;

            // Snap pointer back to center
            pointerTiltRef.current = 0;
            if (pointerRef.current) {
              pointerRef.current.style.transform = "translateX(-50%) rotate(0deg)";
            }

            setWinningSliceIndex(currentTarget);

            // Call callback after highlight settles
            setTimeout(() => {
              if (onFinishedRef.current && slicesRef.current[currentTarget]) {
                onFinishedRef.current(slicesRef.current[currentTarget].segment);
              }
            }, 600);
            return; // Stop animation loop
          }
        }

        // Apply 3D rotation to the wheel element
        wheelRef.current.style.transform = `rotate(${angleRef.current}deg) translate3d(0,0,0)`;

        // Calculate Pointer Ticking (based on peg crossing)
        const currentPeg = Math.floor(angleRef.current / sliceAngle);
        if (currentPeg !== lastPegIndexRef.current) {
          lastPegIndexRef.current = currentPeg;
          // Calculate wiggling velocity: high at speed, decaying to zero at halt
          let tiltAmount = 18;
          if (isDecelerating && targetAngle !== null) {
            const remainingRatio = 1 - (angleRef.current - startAngle) / (targetAngle - startAngle);
            tiltAmount = Math.max(3, 18 * remainingRatio);
          }
          pointerTiltRef.current = tiltAmount;
        }

        // Decay pointer tilt smoothly back to 0
        pointerTiltRef.current += (0 - pointerTiltRef.current) * 0.16;
        if (pointerRef.current) {
          pointerRef.current.style.transform = `translateX(-50%) rotate(${pointerTiltRef.current}deg)`;
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      // Set initial times
      startTime = performance.now();
      lastFrameTime = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isSpinning, total, sliceAngle]);

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

          {/* Rotating wheel wrapper */}
          <div
            ref={wheelRef}
            className="w-full h-full rounded-full overflow-hidden flex items-center justify-center will-change-transform"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transformStyle: "preserve-3d",
            }}
          >
            <svg
              width={svgSize}
              height={svgSize}
              viewBox={`0 0 ${svgSize} ${svgSize}`}
              className="shrink-0"
            >
              {slices.map((slice, i) => {
                const start = i * sliceAngle;
                const end = start + sliceAngle;
                const mid = start + sliceAngle / 2;
                const path = describeArc(cx, cy, innerR, start, end);
                const labelPos = polarToCartesian(cx, cy, innerR * 0.68, mid);
                const isActive = activeSet.has(slice.segmentId);
                const isWinner = winningSliceIndex === i;
                const textColor = slice.segment.amount >= 100 || slice.segment.amount === 0 ? "#fff" : "#0f172a";

                return (
                  <g key={`${slice.segmentId}-${i}`}>
                    <path
                      d={path}
                      fill={slice.segment.color}
                      stroke={isWinner ? "#FFD700" : isActive ? "rgba(255,215,0,0.45)" : "rgba(255,255,255,0.18)"}
                      strokeWidth={isWinner ? 3.5 : isActive ? 1.5 : 0.8}
                      style={{
                        transition: "opacity 0.45s ease-out, stroke 0.45s ease-out, stroke-width 0.45s ease-out",
                        opacity: winningSliceIndex === null ? 1 : isWinner ? 1 : 0.35,
                      }}
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
                      style={{
                        fontFamily: "system-ui, sans-serif",
                        textShadow: "0 1px 2px rgba(0,0,0,0.35)",
                        transition: "opacity 0.45s ease-out",
                        opacity: winningSliceIndex === null ? 1 : isWinner ? 1 : 0.18,
                      }}
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
      <div
        ref={pointerRef}
        className="absolute top-0 left-1/2 -translate-x-1/2 z-30"
        style={{ marginTop: -2, transformOrigin: "50% 0%" }}
      >
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

