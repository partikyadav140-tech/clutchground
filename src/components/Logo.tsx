import logo from "@/assets/new-logo.png";
import { Link } from "@tanstack/react-router";

export function Logo({ size = 40, withText = true, className }: { size?: number; withText?: boolean; className?: string }) {
  return (
    <a href="/" className="flex items-center gap-3 group">
      <img
        src={logo}
        alt="CLUTCHGROUND"
        width={size}
        height={size}
        style={className ? undefined : { width: size, height: size }}
        className={`object-contain logo-glow ${className || ""}`}
      />
      {withText && (
        <div className="hidden sm:flex items-center gap-2">
          <span className="font-display text-lg sm:text-2xl font-black tracking-widest text-fire-gradient uppercase">
            CLUTCH
          </span>
          <span className="font-display text-[10px] sm:text-sm font-bold tracking-[0.2em] text-muted-foreground uppercase">
            GROUND
          </span>
        </div>
      )}
    </a>
  );
}
