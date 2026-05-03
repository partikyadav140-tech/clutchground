import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Twitter, Youtube, Instagram, MessageCircle, Send, Flame, Mail, ArrowUpRight, Headset } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";

export function Footer() {
  const [email, setEmail] = useState("");

  return (
    <footer className="relative border-t border-border/60 bg-card/40 mt-24">
      <div className="absolute inset-x-0 top-0 h-px bg-fire-gradient opacity-50" />

      {/* Newsletter */}
      <div className="border-b border-border/60">
        <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-14 grid lg:grid-cols-2 gap-6 items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-5 h-5 text-primary animate-flicker" />
              <span className="text-xs font-display tracking-[0.3em] text-primary uppercase">Battle Briefings</span>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              <span className="text-foreground">Never miss a </span><span className="text-fire-gradient">tournament drop.</span>
            </h3>
            <p className="text-muted-foreground mt-2 text-sm">Weekly schedule, prize alerts, meta updates straight to your inbox.</p>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); if (!email.includes("@")) return toast.error("Enter a valid email."); toast.success("🔥 Subscribed! Check your inbox."); setEmail(""); }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="warrior@arena.gg"
                className="w-full bg-background border border-border focus:border-primary outline-none pl-10 pr-4 h-12 text-sm clip-notch transition-colors"
              />
            </div>
            <Button type="submit" variant="hero" size="lg" className="font-display tracking-wider shrink-0">
              <Send className="w-4 h-4" /> <span className="hidden sm:inline">Subscribe</span>
            </Button>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 pt-12 pb-28 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          <div className="col-span-2 space-y-4">
            <Logo size={48} />
            <p className="text-sm text-muted-foreground max-w-xs">
              India's most fierce Free Fire esports arena. Compete. Conquer. Become a god.
            </p>
            <div className="flex gap-2">
              {[
                { Icon: Instagram, href: "https://www.instagram.com/clutchgroundofficial", label: "Instagram" },
                { Icon: Send, href: "https://t.me/clutchground", label: "Telegram" },
                { Icon: MessageCircle, href: "https://whatsapp.com/channel/0029Vb8GIynDp2Q21617we1s", label: "WhatsApp" },
                { Icon: Mail, href: "mailto:clutchgroundofficial@gmail.com", label: "Email" },
                { Icon: Headset, href: "https://discord.gg/clutchground", label: "Discord" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={label}
                  className="w-9 h-9 grid place-items-center rounded-md bg-secondary border border-border hover:border-primary hover:text-primary hover:shadow-fire transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground pt-2">
              <span className="text-primary">●</span> 12,408 warriors online now
            </div>
          </div>
          {[
            { title: "Compete", links: [["Tournaments", "/tournaments"], ["Leaderboard", "/leaderboard"], ["Teams", "/teams"], ["Community", "/community"]] as const },
            { title: "Account", links: [["Profile", "/profile"], ["Wallet", "/wallet"], ["Login", "/login"], ["Signup", "/signup"]] as const },
            { title: "Legal & Support", links: [["Contact Us", "/contact"], ["Privacy Policy", "/privacy"], ["Terms & Conditions", "/terms"], ["Anti-Cheat Policy", "/anti-cheat"], ["Admin", "/admin"]] as const },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-display font-bold text-foreground mb-4 uppercase tracking-widest text-sm border-b border-border/50 pb-2 inline-block">{col.title}</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {col.links.map(([label, to]) => (
                  <li key={to}>
                    <Link to={to} className="hover:text-primary transition-colors flex items-center gap-2"><ArrowUpRight className="w-3 h-3" /> {label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-6 border-t border-border/60 flex flex-col items-center justify-center gap-6 text-center">
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
