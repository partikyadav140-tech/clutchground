import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_app/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — ClutchGround" }] }),
  component: PrivacyPage,
});

const SECTIONS = [
  {
    title: "1. Information we collect",
    body: "We collect information needed to run tournaments securely: username, email, phone, in-game name (IGN), UID, and transaction history. Payment details are handled by our payment partners, not stored on our servers.",
  },
  {
    title: "2. How we use your data",
    body: "Your data is used to manage tournaments, verify identity, process payouts, and prevent fraud. We send match and security notifications to your registered contact details.",
  },
  {
    title: "3. Data sharing",
    body: "We do not sell personal data for marketing. Your IGN and public stats may appear on leaderboards and tournament brackets.",
  },
  {
    title: "4. Security",
    body: "We use industry-standard measures to protect accounts. No internet transmission is fully secure — keep your password confidential.",
  },
  {
    title: "5. Account deletion",
    body: "Contact support to request deletion. Personal data and wallet balance are permanently removed unless law requires retention.",
  },
];

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background pb-8 page-content">
      <PageHeader
        eyebrow="Legal"
        eyebrowIcon={ShieldAlert}
        title="Privacy policy"
      />
      <p className="text-sm text-muted-foreground -mt-1 mb-6">
        How ClutchGround collects, uses, and protects your data.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card shadow-card p-5 sm:p-6 space-y-6"
      >
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h3 className="font-display font-bold text-base text-foreground mb-2">
              {section.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
