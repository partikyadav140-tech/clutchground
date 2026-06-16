import { createFileRoute } from "@tanstack/react-router";
import { FileText, RefreshCcw, XCircle, Shield, Gamepad2, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/terms")({
  head: () => ({ meta: [{ title: "Terms & Conditions — CLUTCHGROUND" }] }),
  component: TermsPage,
});

const Section = ({ icon: Icon, title, children, color = "var(--primary)" }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-card rounded-2xl border border-border p-5 space-y-2"
  >
    <div className="flex items-center gap-3 mb-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, color }}
      >
        <Icon className="w-4 h-4" />
      </div>
      <h2 className="font-display font-black text-base text-foreground">{title}</h2>
    </div>
    <div className="text-sm text-muted-foreground leading-relaxed font-medium space-y-2">
      {children}
    </div>
  </motion.div>
);

function TermsPage() {
  return (
    <div className="bg-background min-h-screen pb-24">
      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
          <FileText className="w-3 h-3" /> Legal
        </div>
        <h1 className="font-display font-black text-2xl text-foreground">Terms & Conditions</h1>
        <p className="text-xs text-muted-foreground mt-1">Last updated: May 2025 · CLUTCHGROUND</p>
      </div>

      <div className="px-4 space-y-3">
        {/* Fair Play / Skill-Based */}
        <Section icon={Gamepad2} title="Skill-Based Gaming Platform" color="#f59e0b">
          <p>
            CLUTCHGROUND is a{" "}
            <strong className="text-foreground">skill-based competitive gaming platform</strong>.
            All tournaments are won through player skill, strategy, and performance — not chance or
            luck.
          </p>
          <p>
            This platform is <strong className="text-foreground">NOT gambling</strong>. Outcomes are
            determined entirely by player ability in Free Fire tournaments. Entry fees are
            participation fees for competitive events.
          </p>
          <p>
            Participation is open to users aged 13 and above. Users under 18 require parental
            consent for transactions.
          </p>
        </Section>

        {/* Refund Policy */}
        <Section icon={RefreshCcw} title="Refund & Cancellation Policy" color="#10b981">
          <p>
            <strong className="text-foreground">Tournament Cancellation by Platform:</strong> If
            CLUTCHGROUND cancels a tournament due to technical issues, insufficient participants, or
            any other reason, 100% of the entry fee will be refunded to your Deposit Balance within
            24 hours.
          </p>
          <p>
            <strong className="text-foreground">Wallet Deposits:</strong> Coins purchased via UPI
            are non-refundable once added to the wallet, except in cases of duplicate transactions
            or payment errors. Contact support within 48 hours for such claims.
          </p>
          <p>
            <strong className="text-foreground">Duplicate Payments:</strong> If you are charged
            twice for the same order, raise a support ticket within 48 hours. Verified duplicates
            will be refunded within 5–7 business days.
          </p>
          <p>
            <strong className="text-foreground">Technical Failures:</strong> If your payment is
            deducted but coins are not credited, contact support with your UTR / Transaction ID
            within 48 hours for immediate resolution.
          </p>
        </Section>

        {/* Cancellation */}
        <Section icon={XCircle} title="Tournament Registration Cancellation" color="#ef4444">
          <p>
            <strong className="text-foreground">Before Room Details Released:</strong> You may
            request cancellation before the room ID/password is shared. Entry fee will be refunded
            to your Deposit Balance.
          </p>
          <p>
            <strong className="text-foreground">After Room Details Released:</strong> No refunds
            once the room ID and password have been shared, as tournament integrity cannot be
            guaranteed.
          </p>
          <p>
            <strong className="text-foreground">No-Show Policy:</strong> Players who register but do
            not join the match forfeit their entry fee. No refunds for no-shows.
          </p>
        </Section>

        {/* Fair Play */}
        <Section icon={Shield} title="Fair Play & Anti-Cheat Policy" color="#8b5cf6">
          <p>
            CLUTCHGROUND maintains a{" "}
            <strong className="text-foreground">zero-tolerance policy</strong> against cheating,
            hacking, emulators (in restricted categories), or any unauthorized third-party software.
          </p>
          <p>
            Violations result in: permanent account ban, disqualification from current and future
            tournaments, and forfeiture of all winnings.
          </p>
          <p>
            All results are subject to admin review. Video evidence may be requested to verify kills
            and placement. Admin decisions are final and binding.
          </p>
        </Section>

        {/* Wallets & Transactions */}
        <Section icon={CreditCard} title="Wallet & Transactions" color="#00c8ff">
          <p>
            <strong className="text-foreground">1 CG Coin = ₹1.</strong> Deposited coins can only be
            used for tournament entry fees.
          </p>
          <p>
            Only <strong className="text-foreground">Winnings Balance</strong> is withdrawable to
            UPI/bank accounts. Deposited coins are non-withdrawable.
          </p>
          <p>
            Withdrawals are processed within 2–3 business days after identity verification. Minimum
            withdrawal amount is ₹50.
          </p>
          <p>
            CLUTCHGROUND uses <strong className="text-foreground">Bharat UPI</strong> for secure,
            instant payments. All deposits require UTR verification by our team before credits are
            applied.
          </p>
        </Section>

        {/* Disputes */}
        <Section icon={FileText} title="Dispute Resolution" color="#f97316">
          <p>
            Tournament disputes must be submitted within{" "}
            <strong className="text-foreground">30 minutes</strong> of match completion with
            video/screenshot evidence via the Support Ticket system.
          </p>
          <p>
            Payment disputes must be raised within{" "}
            <strong className="text-foreground">48 hours</strong> of the transaction via email at{" "}
            <strong className="text-foreground">clutchgroundofficial@gmail.com</strong> or through
            in-app support.
          </p>
          <p>
            Governing law: These terms are governed by the laws of India. Disputes are subject to
            the jurisdiction of courts in India.
          </p>
        </Section>

        <p className="text-center text-[10px] text-muted-foreground pb-4">
          By using CLUTCHGROUND, you agree to these Terms & Conditions.
          <br />
          Contact: clutchgroundofficial@gmail.com
        </p>
      </div>
    </div>
  );
}
