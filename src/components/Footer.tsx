export function Footer() {
  return (
    <footer className="relative border-t border-border/60 bg-card/40 mt-24 pb-28 lg:pb-12">
      <div className="absolute inset-x-0 top-0 h-px bg-fire-gradient opacity-50" />

      <div className="container mx-auto px-4 lg:px-8 pt-12">
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="font-display tracking-widest text-primary">⚔ FORGED IN FIRE ⚔</span>
          </div>
          <div className="flex flex-col gap-1.5 items-center">
            <p className="text-sm font-display font-bold tracking-widest text-muted-foreground uppercase">© 2026 CLUTCHGROUND</p>
            <p className="text-xs text-muted-foreground/80 tracking-wide">Designed & Developed by Pratikk Yadav <span className="mx-1 text-primary">|</span> +91 8307224756</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
