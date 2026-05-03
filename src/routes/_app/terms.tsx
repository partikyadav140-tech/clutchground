import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "./tournaments";

export const Route = createFileRoute("/_app/terms")({
  head: () => ({ meta: [{ title: "Terms and Conditions — CLUTCHGROUND" }] }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-16 space-y-8">
      <PageHeader title="Terms and Conditions" subtitle="Platform Rules" />
      <div className="bg-card-gradient border border-border p-6 sm:p-10 clip-notch space-y-6 text-sm text-muted-foreground leading-relaxed">
        <h3 className="text-xl font-display font-bold text-foreground">1. Acceptance of Terms</h3>
        <p>By registering on CLUTCHGROUND, you agree to abide by these Terms and Conditions. You must be at least 13 years old to participate, and users under 18 must have parental consent to make transactions.</p>
        
        <h3 className="text-xl font-display font-bold text-foreground mt-8">2. Fair Play & Anti-Cheat</h3>
        <p>We maintain a strict zero-tolerance policy against cheating, hacking, or using unauthorized third-party software. Any player caught cheating will be permanently banned, and their team may be disqualified and forfeit all winnings.</p>
        
        <h3 className="text-xl font-display font-bold text-foreground mt-8">3. Wallets & Transactions</h3>
        <p>CG Coins have no real-world value outside of the CLUTCHGROUND platform until officially withdrawn. Deposits are final and non-refundable. Withdrawals are processed manually within 24-48 hours and may be subject to verification.</p>
        
        <h3 className="text-xl font-display font-bold text-foreground mt-8">4. Tournament Execution</h3>
        <p>CLUTCHGROUND reserves the right to reschedule, cancel, or alter tournaments in case of technical issues or insufficient participation. In the event of a cancellation, entry fees will be refunded to your deposit balance.</p>
        
        <h3 className="text-xl font-display font-bold text-foreground mt-8">5. Dispute Resolution</h3>
        <p>All tournament disputes must be submitted within 30 minutes of match completion with video evidence. Admin decisions are final and binding.</p>
      </div>
    </div>
  );
}
