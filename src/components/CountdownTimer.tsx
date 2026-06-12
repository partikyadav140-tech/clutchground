import { useEffect, useState } from "react";

type CountdownTimerProps = {
  targetDate: string;
  status?: string;
  compact?: boolean;
};

function parseCountdown(target: string) {
  const now = Date.now();
  const end = new Date(target).getTime();
  const diff = end - now;

  if (diff <= 0) return null;

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return { days, hours, minutes, seconds, total: diff };
}

export function CountdownTimer({ targetDate, status, compact = false }: CountdownTimerProps) {
  const [countdown, setCountdown] = useState(() => parseCountdown(targetDate));

  useEffect(() => {
    const id = setInterval(() => {
      const next = parseCountdown(targetDate);
      setCountdown(next);
      if (!next) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  // Already past start time
  if (!countdown) {
    if (status === "live") {
      return (
        <span className="inline-flex items-center gap-1.5 text-red-500 font-black text-xs uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          LIVE NOW
        </span>
      );
    }
    if (status === "completed") {
      return (
        <span className="text-muted-foreground font-bold text-xs uppercase tracking-wider">
          Completed
        </span>
      );
    }
    return (
      <span className="text-amber-500 font-bold text-xs uppercase tracking-wider">
        Starting soon
      </span>
    );
  }

  if (compact) {
    // Single-line compact: "2d 5h 12m"
    const parts: string[] = [];
    if (countdown.days > 0) parts.push(`${countdown.days}d`);
    if (countdown.hours > 0 || countdown.days > 0) parts.push(`${countdown.hours}h`);
    parts.push(`${countdown.minutes}m`);
    if (countdown.days === 0) parts.push(`${countdown.seconds}s`);

    return (
      <span className="font-mono font-bold text-xs text-primary tabular-nums">
        {parts.join(" ")}
      </span>
    );
  }

  // Full countdown blocks
  return (
    <div className="flex items-center gap-1.5">
      {countdown.days > 0 && (
        <TimeBlock value={countdown.days} label="D" />
      )}
      <TimeBlock value={countdown.hours} label="H" />
      <TimeBlock value={countdown.minutes} label="M" />
      {countdown.days === 0 && (
        <TimeBlock value={countdown.seconds} label="S" />
      )}
    </div>
  );
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[32px] bg-secondary/60 border border-border/40 rounded-lg px-1.5 py-1">
      <span className="font-mono font-black text-sm leading-none text-foreground tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[7px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
        {label}
      </span>
    </div>
  );
}
