export function Footer() {
  return (
    <footer className="relative border-t border-border/60 bg-card/40 mt-24">
      <div className="absolute inset-x-0 top-0 h-px bg-fire-gradient opacity-50" />

      {/* Desktop Footer Content - Hidden on Mobile */}
      <div className="hidden lg:block container mx-auto px-4 lg:px-8 pt-12 lg:pt-16 pb-8 lg:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12 mb-8 lg:mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-display font-black text-lg">⚔</span>
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-foreground">CLUTCHGROUND</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">
                  Esports Arena
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground/80 leading-relaxed mb-4">
              India's premier Free Fire esports platform. Compete in tournaments, win prizes, and
              become a legend.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                12,408 warriors online
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-1">
            <h4 className="font-display font-bold text-foreground mb-4 uppercase tracking-wider text-sm">
              Quick Links
            </h4>
            <div className="space-y-3">
              <a
                href="/tournaments"
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Tournaments
              </a>
              <a
                href="/leaderboard"
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Leaderboard
              </a>
              <a
                href="/teams"
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Teams
              </a>
              <a
                href="/matches"
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                My Matches
              </a>
              <a
                href="/wallet"
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Wallet
              </a>
            </div>
          </div>

          {/* Support */}
          <div className="lg:col-span-1">
            <h4 className="font-display font-bold text-foreground mb-4 uppercase tracking-wider text-sm">
              Support
            </h4>
            <div className="space-y-3">
              <a
                href="/rules"
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Rules & Regulations
              </a>
              <a
                href="/anti-cheat"
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Anti-Cheat Policy
              </a>
              <a
                href="/support"
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Support Tickets
              </a>
              <a
                href="/privacy"
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-1">
            <h4 className="font-display font-bold text-foreground mb-4 uppercase tracking-wider text-sm">
              Contact
            </h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <span className="block font-semibold text-foreground">Email</span>
                support@clutchground.com
              </p>
              <p>
                <span className="block font-semibold text-foreground">Phone</span>
                +91 83072 24756
              </p>
              <p>
                <span className="block font-semibold text-foreground">Developer</span>
                Pratikk Yadav
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Section - Always Visible */}
      <div className="lg:relative lg:z-auto z-[45] pt-4 lg:pt-0 border-t lg:border-t-0 border-border/40 pb-20 lg:pb-0">
        <div className="container mx-auto px-4 lg:px-8 pb-4 lg:pb-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-2 lg:gap-4">
            <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <span className="flex items-center gap-2">
                <span className="text-primary">⚔ FORGED IN FIRE ⚔</span>
              </span>
            </div>
            <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-4 text-xs text-muted-foreground/80 text-center lg:text-left">
              <p className="font-semibold">© 2026 CLUTCHGROUND. All rights reserved.</p>
              <p className="hidden lg:block">|</p>
              <p>
                Designed & Developed by{" "}
                <span className="font-bold text-primary">Pratikk Yadav | +91 8307224756</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
