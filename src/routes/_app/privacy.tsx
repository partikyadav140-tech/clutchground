import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "./tournaments";

export const Route = createFileRoute("/_app/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — CLUTCHGROUND" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-16 space-y-8">
      <PageHeader title="Privacy Policy" subtitle="Data Protection" />
      <div className="bg-card-gradient border border-border p-6 sm:p-10 clip-notch space-y-6 text-sm text-muted-foreground leading-relaxed">
        <h3 className="text-xl font-display font-bold text-foreground">1. Information We Collect</h3>
        <p>We collect information necessary to provide and secure our esports tournament services. This includes your username, email, phone number, in-game name (IGN), UID, and transaction history. We do not store sensitive payment details directly on our servers; they are processed by our secure payment partners.</p>
        
        <h3 className="text-xl font-display font-bold text-foreground mt-8">2. How We Use Your Data</h3>
        <p>Your data is used strictly for managing tournaments, verifying player identity, processing payouts, and preventing fraud or cheating. We use your contact info to send important notifications regarding your matches and account security.</p>
        
        <h3 className="text-xl font-display font-bold text-foreground mt-8">3. Data Sharing</h3>
        <p>We do not sell or share your personal data with third parties for marketing purposes. Your IGN and public stats may be visible on leaderboards and tournament brackets.</p>
        
        <h3 className="text-xl font-display font-bold text-foreground mt-8">4. Security</h3>
        <p>CLUTCHGROUND employs industry-standard security measures to protect your account. However, no internet transmission is 100% secure. You are responsible for keeping your password safe.</p>
        
        <h3 className="text-xl font-display font-bold text-foreground mt-8">5. Account Deletion</h3>
        <p>You can request account deletion by contacting support. Once deleted, your personal data and wallet balance will be permanently erased, except where retention is required by law.</p>
      </div>
    </div>
  );
}
