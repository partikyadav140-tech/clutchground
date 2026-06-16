import { createFileRoute } from "@tanstack/react-router";
import { ScrollText } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_app/rules")({
  head: () => ({ meta: [{ title: "Rules — ClutchGround" }] }),
  component: () => (
    <div className="min-h-screen bg-background pb-8 page-content">
      <PageHeader eyebrow="Legal" eyebrowIcon={ScrollText} title="Arena rules" />
      <p className="text-sm text-muted-foreground -mt-1 mb-6">
        Code of conduct for every player on ClutchGround.
      </p>

      <div className="space-y-3">
        {[
          "All players must have a verified Free Fire UID linked to their account.",
          "Slot booking is first-come-first-serve unless the tournament is approval-based.",
          "Room ID and password are released exactly 10 minutes before match start.",
          "Late arrivals (5+ minutes after start) forfeit their slot. No refunds.",
          "Hacking, modding, or unauthorized scripts result in a permanent ban.",
          "Stream sniping, teaming with enemies, or chat abuse leads to disqualification.",
          "Submit screenshot proof within 30 minutes of match end.",
          "Admin verdicts on disputes are final. Appeals go through support.",
          "Prize money is credited to your wallet within 24 hours of verification.",
          "Withdrawals require KYC. Minimum 500 coins. Processed within 48 hours.",
        ].map((rule, i) => (
          <motion.div
            key={rule}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            className="flex gap-4 p-4 rounded-2xl border border-border bg-card shadow-card items-start"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <span className="font-display font-bold text-sm text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <p className="text-sm text-foreground leading-relaxed pt-1.5">{rule}</p>
          </motion.div>
        ))}
      </div>
    </div>
  ),
});
