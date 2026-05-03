import logo from "@/assets/god-logo.png";
import { Link } from "@tanstack/react-router";

export function Logo({ size = 40, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3 group">
      <img
        src={logo}
        alt="CLUTCHGROUND"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="object-contain drop-shadow-[0_0_12px_oklch(0.72_0.22_40/0.6)] group-hover:drop-shadow-[0_0_20px_oklch(0.72_0.22_40/0.9)] transition-all duration-300"
      />
      {withText && (
        <div className="hidden sm:flex items-center gap-2">
          <span className="font-display text-lg sm:text-2xl font-black tracking-widest text-fire-gradient uppercase">CLUTCH</span>
          <span className="font-display text-[10px] sm:text-sm font-bold tracking-[0.2em] text-muted-foreground uppercase">GROUND</span>
        </div>
      )}
    </Link>
  );
}
