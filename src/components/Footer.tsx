import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSocialLinks } from "../api";

const LEGAL_LINKS = [
  { to: "/rules", label: "Rules" },
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
  { to: "/contact", label: "Contact" },
] as const;

const QUICK_LINKS = [
  { to: "/tournaments", label: "Tournaments" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/matches", label: "Matches" },
  { to: "/teams", label: "Teams" },
  { to: "/wallet", label: "Wallet" },
] as const;

export function Footer() {
  const [email, setEmail] = useState("clutchgroundofficial@gmail.com");

  useEffect(() => {
    getSocialLinks().then((links) => {
      if (links?.email) setEmail(links.email);
    });
  }, []);

  return (
    <footer className="relative bg-background mt-8">
      {/* Desktop footer */}
      <div className="hidden lg:block container mx-auto px-4 lg:px-8 pt-12 lg:pt-16 pb-8 lg:pb-12">
        <div className="absolute inset-x-0 top-0 h-px bg-fire-gradient opacity-40" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12 mb-8 lg:mb-12">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-display font-black text-lg">CG</span>
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-foreground">CLUTCHGROUND</h3>
                <p className="text-xs text-muted-foreground">Esports arena</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground/80 leading-relaxed">
              India&apos;s Free Fire esports platform. Compete in tournaments, win prizes, and climb
              the ranks.
            </p>
          </div>

          <div className="lg:col-span-1">
            <h4 className="font-display font-bold text-foreground mb-4 text-sm">Quick links</h4>
            <div className="space-y-3">
              {QUICK_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="block text-sm text-muted-foreground hover:text-cta transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <h4 className="font-display font-bold text-foreground mb-4 text-sm">Support</h4>
            <div className="space-y-3">
              <Link
                to="/rules"
                className="block text-sm text-muted-foreground hover:text-cta transition-colors"
              >
                Rules &amp; regulations
              </Link>
              <Link
                to="/anti-cheat"
                className="block text-sm text-muted-foreground hover:text-cta transition-colors"
              >
                Anti-cheat policy
              </Link>
              <Link
                to="/support"
                className="block text-sm text-muted-foreground hover:text-cta transition-colors"
              >
                Support tickets
              </Link>
              <Link
                to="/privacy"
                className="block text-sm text-muted-foreground hover:text-cta transition-colors"
              >
                Privacy policy
              </Link>
              <Link
                to="/terms"
                className="block text-sm text-muted-foreground hover:text-cta transition-colors"
              >
                Terms of service
              </Link>
            </div>
          </div>

          <div className="lg:col-span-1">
            <h4 className="font-display font-bold text-foreground mb-4 text-sm">Contact</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <span className="block font-semibold text-foreground">Email</span>
                <a href={`mailto:${email}`} className="hover:text-primary transition-colors">
                  {email}
                </a>
              </p>
              <p>
                <span className="block font-semibold text-foreground">Phone</span>
                +91 83072 24756
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 lg:py-8 pb-36 lg:pb-8">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-1.5 text-center">
          <p className="text-xs font-semibold text-muted-foreground">
            © {new Date().getFullYear()} ClutchGround. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/80">
            Designed and Developed by{" "}
            <span className="font-semibold text-foreground">Pratikk Yadav</span>{" "}
            <a href="tel:+918307224756" className="hover:text-primary transition-colors">
              +91 8307224756
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
