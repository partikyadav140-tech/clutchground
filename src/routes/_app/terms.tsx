import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/terms")({
  head: () => ({ meta: [{ title: "Terms and Conditions — Professional Esports Arena" }] }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="bg-background min-h-screen pb-24">
      {/* ─── Top Header (Mobile First) ─── */}
      <div className="bg-white rounded-b-[2rem] shadow-[0_4px_24px_oklch(0_0_0/0.04)] pt-6 pb-6 px-4 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-primary/10 text-cta rounded-2xl flex items-center justify-center mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-black text-foreground">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">Platform Rules</p>
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
              1. Acceptance of Terms
            </h3>
            <p className="font-semibold">
              By registering on our platform, you agree to abide by these Terms and Conditions. You
              must be at least 13 years old to participate, and users under 18 must have parental
              consent to make transactions.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-display font-black text-foreground mb-2">
              2. Fair Play & Anti-Cheat
            </h3>
            <p className="font-semibold">
              We maintain a strict zero-tolerance policy against cheating, hacking, or using
              unauthorized third-party software. Any player caught cheating will be permanently
              banned, and their team may be disqualified and forfeit all winnings.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-display font-black text-foreground mb-2">
              3. Wallets & Transactions
            </h3>
            <p className="font-semibold">
              Coins have no real-world value outside of the platform until officially withdrawn.
              Deposits are final and non-refundable. Withdrawals are processed manually within 24-48
              hours and may be subject to verification.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-display font-black text-foreground mb-2">
              4. Tournament Execution
            </h3>
            <p className="font-semibold">
              We reserve the right to reschedule, cancel, or alter tournaments in case of technical
              issues or insufficient participation. In the event of a cancellation, entry fees will
              be refunded to your deposit balance.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-display font-black text-foreground mb-2">
              5. Dispute Resolution
            </h3>
            <p className="font-semibold">
              All tournament disputes must be submitted within 30 minutes of match completion with
              video evidence. Admin decisions are final and binding.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
