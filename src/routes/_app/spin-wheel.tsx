import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SpinWheelSheet } from "@/components/spin-wheel/SpinWheelSheet";
import { useAuth } from "@/lib/auth-client";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/spin-wheel")({
  head: () => ({ meta: [{ title: "Spin Wheel — ClutchGround" }] }),
  component: SpinWheelPage,
});

function SpinWheelPage() {
  const { user } = useAuth();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(true);
  }, []);

  return (
    <div className="page-content min-h-[60vh] pb-8">
      <PageHeader eyebrow="Rewards" eyebrowIcon={Sparkles} title="Daily spin wheel" />
      <p className="text-sm text-muted-foreground -mt-1 mb-6">
        Spin once per day when you have {">="} 100 CG deposit coins. Winnings go to deposit balance.
      </p>

      {!user ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground">Login to spin the wheel and win CG coins.</p>
          <Button asChild className="rounded-xl font-bold">
            <Link to="/login">Login</Link>
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Use the spin wheel below.</p>
      )}

      {user && <SpinWheelSheet open={open} onOpenChange={setOpen} />}
    </div>
  );
}
