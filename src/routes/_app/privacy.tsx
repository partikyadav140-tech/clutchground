import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — Professional Esports Arena" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="bg-background min-h-screen pb-24">
      {/* ─── Top Header (Mobile First) ─── */}
      <div className="bg-white rounded-b-[2rem] shadow-[0_4px_24px_oklch(0_0_0/0.04)] pt-6 pb-6 px-4 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-black text-foreground">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">Data Protection</p>
        </div>
      </div>

      <div className="px-4 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-[1.5rem] border border-border shadow-sm p-6 space-y-6 text-sm text-muted-foreground leading-relaxed"
        >
          <div>
            <h3 className="text-lg font-display font-black text-foreground mb-2">
              1. Information We Collect
            </h3>
            <p className="font-semibold">
              We collect information necessary to provide and secure our esports tournament
              services. This includes your username, email, phone number, in-game name (IGN), UID,
              and transaction history. We do not store sensitive payment details directly on our
              servers; they are processed by our secure payment partners.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-display font-black text-foreground mb-2">
              2. How We Use Your Data
            </h3>
            <p className="font-semibold">
              Your data is used strictly for managing tournaments, verifying player identity,
              processing payouts, and preventing fraud or cheating. We use your contact info to send
              important notifications regarding your matches and account security.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-display font-black text-foreground mb-2">
              3. Data Sharing
            </h3>
            <p className="font-semibold">
              We do not sell or share your personal data with third parties for marketing purposes.
              Your IGN and public stats may be visible on leaderboards and tournament brackets.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-display font-black text-foreground mb-2">4. Security</h3>
            <p className="font-semibold">
              We employ industry-standard security measures to protect your account. However, no
              internet transmission is 100% secure. You are responsible for keeping your password
              safe.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-display font-black text-foreground mb-2">
              5. Account Deletion
            </h3>
            <p className="font-semibold">
              You can request account deletion by contacting support. Once deleted, your personal
              data and wallet balance will be permanently erased, except where retention is required
              by law.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
