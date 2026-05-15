import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none touch-manipulation",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-primary hover:brightness-110 active:scale-95 rounded-2xl",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 active:scale-95 rounded-2xl",
        outline:
          "border border-border bg-card text-foreground hover:bg-secondary active:scale-95 rounded-2xl",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-accent active:scale-95 rounded-2xl",
        ghost:
          "hover:bg-secondary text-foreground active:scale-95 rounded-2xl",
        link:
          "text-primary underline-offset-4 hover:underline",
        hero:
          "text-white font-black shadow-cta hover:brightness-110 active:scale-95 rounded-2xl",
        outlineFire:
          "border border-primary/50 text-primary bg-primary/5 hover:bg-primary/10 active:scale-95 rounded-2xl",
        blade:
          "text-white font-black active:scale-95 rounded-2xl",
      },
      size: {
        default: "h-12 px-6 text-sm",
        sm:      "h-9 px-4 text-xs rounded-xl",
        lg:      "h-14 px-8 text-base",
        xl:      "h-16 px-10 text-lg",
        icon:    "h-10 w-10 rounded-2xl",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    const gradientStyles: React.CSSProperties =
      variant === "hero"
        ? { background: "var(--gradient-cta)", ...style }
        : variant === "blade"
        ? { background: "var(--gradient-primary)", ...style }
        : { ...style };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={gradientStyles}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
