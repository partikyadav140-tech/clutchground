import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "./tournaments";
import { Shield, AlertCircle, CheckCircle2, Eye } from "lucide-react";

export const Route = createFileRoute("/_app/anti-cheat")({
  head: () => ({ meta: [{ title: "Anti-Cheat — GOD ESPORTS" }] }),
  component: () => (
    <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-16 max-w-4xl">
      <PageHeader title="Anti-Cheat" subtitle="Fair Play Enforcement" />
      <p className="mt-4 text-muted-foreground max-w-2xl">Our anti-cheat system combines screenshot validation, peer reports, and admin review to keep the arena clean.</p>

      <div className="mt-10 grid sm:grid-cols-2 gap-4">
        {[
          { icon: CheckCircle2, t: "Screenshot Validation", d: "Every result requires screenshot proof of kills and final placement." },
          { icon: Eye, t: "Admin Review", d: "Trained moderators verify every match within 24 hours of submission." },
          { icon: AlertCircle, t: "Report System", d: "Players can flag cheaters in-app. 3+ reports trigger instant review." },
          { icon: Shield, t: "Permanent Bans", d: "Confirmed cheaters and their teams are banned permanently. No exceptions." },
        ].map((f) => (
          <div key={f.t} className="bg-card-gradient border border-border clip-notch p-5">
            <f.icon className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-display text-base font-black uppercase tracking-wider">{f.t}</h3>
            <p className="text-sm text-muted-foreground mt-1">{f.d}</p>
          </div>
        ))}
      </div>
    </div>
  ),
});
