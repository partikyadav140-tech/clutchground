import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "./tournaments";
import { Mail, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/contact")({
  head: () => ({ meta: [{ title: "Contact — GOD ESPORTS" }] }),
  component: () => (
    <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-16 max-w-4xl">
      <PageHeader title="Contact" subtitle="War Room" />
      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <form onSubmit={(e) => { e.preventDefault(); toast.success("Message sent! We'll respond within 24h."); }} className="space-y-4 bg-card-gradient border border-border clip-notch p-6">
          <h3 className="font-display text-lg uppercase tracking-widest text-primary">Send Message</h3>
          <input className="w-full bg-background border border-border focus:border-primary outline-none px-4 h-11 text-sm" placeholder="Your name" required />
          <input type="email" className="w-full bg-background border border-border focus:border-primary outline-none px-4 h-11 text-sm" placeholder="Email" required />
          <textarea rows={5} className="w-full bg-background border border-border focus:border-primary outline-none px-4 py-3 text-sm" placeholder="What's on your mind, warrior?" required />
          <Button type="submit" variant="hero" className="w-full"><Send className="w-4 h-4" /> Send</Button>
        </form>
        <div className="space-y-4">
          {[
            { icon: Mail, t: "Email", v: "support@godesports.gg" },
            { icon: MessageCircle, t: "Discord", v: "discord.gg/godesports" },
            { icon: Send, t: "Telegram", v: "@godesports_official" },
          ].map((c) => (
            <div key={c.t} className="flex items-center gap-4 p-5 bg-card-gradient border border-border clip-notch">
              <c.icon className="w-8 h-8 text-primary" />
              <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.t}</div><div className="font-display font-bold">{c.v}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
});
