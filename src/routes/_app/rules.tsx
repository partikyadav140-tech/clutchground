import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "./tournaments";

export const Route = createFileRoute("/_app/rules")({
  head: () => ({ meta: [{ title: "Rules — CLUTCHGROUND" }] }),
  component: () => (
    <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-16 max-w-3xl">
      <PageHeader title="Rules" subtitle="Code Of The Arena" />
      <div className="mt-8 space-y-4">
        {[
          "All players must have a verified Free Fire UID linked to their CLUTCHGROUND account.",
          "Slot booking is first-come-first-serve unless tournament is approval-based.",
          "Room ID & password are released exactly 10 minutes before match start.",
          "Late arrivals (5+ min after start) forfeit their slot. No refunds.",
          "Hacking, modding, or use of unauthorized scripts = permanent ban + team ban.",
          "Stream sniping, teaming with enemies, or chat abuse = match disqualification.",
          "Submit screenshot proof within 30 min of match end. Late submissions invalidated.",
          "Admin verdicts on disputes are final. Appeals via support@godesports.gg.",
          "Prize money credited to wallet within 24 hours of admin verification.",
          "Withdrawals require KYC. Minimum ₹500. Processed within 48 hours.",
        ].map((r, i) => (
          <div key={i} className="flex gap-4 p-4 bg-card-gradient border border-border clip-notch">
            <span className="font-display font-black text-2xl text-fire-gradient shrink-0">{String(i + 1).padStart(2, "0")}</span>
            <p className="text-muted-foreground">{r}</p>
          </div>
        ))}
      </div>
    </div>
  ),
});
