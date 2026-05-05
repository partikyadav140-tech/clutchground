import { createFileRoute } from "@tanstack/react-router";
import { ScrollText } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/rules")({
  head: () => ({ meta: [{ title: "Rules — Professional Esports Arena" }] }),
  component: () => (
    <div className="bg-background min-h-screen pb-24">
      {/* ─── Top Header (Mobile First) ─── */}
      <div className="bg-white rounded-b-[2rem] shadow-[0_4px_24px_oklch(0_0_0/0.04)] pt-6 pb-6 px-4 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-3">
            <ScrollText className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-black text-foreground">Rules</h1>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">Code of the Arena</p>
        </div>
      </div>

      <div className="px-4 mt-6">
        <div className="space-y-3">
          {[
            "All players must have a verified Free Fire UID linked to their account.",
            "Slot booking is first-come-first-serve unless tournament is approval-based.",
            "Room ID & password are released exactly 10 minutes before match start.",
            "Late arrivals (5+ min after start) forfeit their slot. No refunds.",
            "Hacking, modding, or use of unauthorized scripts = permanent ban + team ban.",
            "Stream sniping, teaming with enemies, or chat abuse = match disqualification.",
            "Submit screenshot proof within 30 min of match end. Late submissions invalidated.",
            "Admin verdicts on disputes are final. Appeals via support.",
            "Prize money credited to wallet within 24 hours of admin verification.",
            "Withdrawals require KYC. Minimum 500 Coins. Processed within 48 hours.",
          ].map((r, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              key={i}
              className="flex gap-4 p-5 bg-white rounded-2xl border border-border shadow-sm items-start"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="font-display font-black text-lg text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground pt-0.5 leading-relaxed">{r}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  ),
});
