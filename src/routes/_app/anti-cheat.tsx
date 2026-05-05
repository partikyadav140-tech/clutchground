import { createFileRoute } from "@tanstack/react-router";
import { Shield, AlertCircle, CheckCircle2, Eye } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/anti-cheat")({
  head: () => ({ meta: [{ title: "Anti-Cheat — Professional Esports Arena" }] }),
  component: () => (
    <div className="bg-background min-h-screen pb-24">
      {/* ─── Top Header (Mobile First) ─── */}
      <div className="bg-white rounded-b-[2rem] shadow-[0_4px_24px_oklch(0_0_0/0.04)] pt-6 pb-6 px-4 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-black text-foreground">Anti-Cheat</h1>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">Fair Play Enforcement</p>
        </div>
      </div>

      <div className="px-4 mt-6">
        <p className="text-sm font-semibold text-muted-foreground text-center mb-8 px-4">
          Our anti-cheat system combines screenshot validation, peer reports, and admin review to
          keep the arena clean.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              icon: CheckCircle2,
              t: "Screenshot Validation",
              d: "Every result requires screenshot proof of kills and final placement.",
              color: "text-green-500",
              bg: "bg-green-50",
            },
            {
              icon: Eye,
              t: "Admin Review",
              d: "Trained moderators verify every match within 24 hours of submission.",
              color: "text-blue-500",
              bg: "bg-blue-50",
            },
            {
              icon: AlertCircle,
              t: "Report System",
              d: "Players can flag cheaters in-app. 3+ reports trigger instant review.",
              color: "text-amber-500",
              bg: "bg-amber-50",
            },
            {
              icon: Shield,
              t: "Permanent Bans",
              d: "Confirmed cheaters and their teams are banned permanently. No exceptions.",
              color: "text-red-500",
              bg: "bg-red-50",
            },
          ].map((f, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              key={f.t}
              className="bg-white rounded-[1.5rem] border border-border shadow-sm p-6 flex flex-col items-center text-center"
            >
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${f.bg} ${f.color}`}
              >
                <f.icon className="w-7 h-7" />
              </div>
              <h3 className="font-display text-lg font-black text-foreground mb-2">{f.t}</h3>
              <p className="text-sm font-semibold text-muted-foreground">{f.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  ),
});
