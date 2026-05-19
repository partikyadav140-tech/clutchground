import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { resetPassword } from "../../api";
import { Phone, Lock, ArrowRight, ChevronLeft, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/_app/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot Password — CLUTCHGROUND" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [phone, setPhone] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("What is your childhood nickname?");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await (resetPassword as any)({ data: { phone, security_question: securityQuestion, security_answer: securityAnswer, new_password: newPassword } });
      toast.success("Password reset successfully! Please sign in.");
      router.navigate({ to: "/login" });
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden relative">
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-[120px] pointer-events-none opacity-20"
        style={{ background: "var(--neon)" }} />
      <div className="absolute bottom-1/3 left-0 w-60 h-60 rounded-full blur-[100px] pointer-events-none opacity-15"
        style={{ background: "var(--primary)" }} />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center flex-1 px-6 pb-4 pt-8"
      >
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-primary/20"
            style={{ background: "linear-gradient(135deg, rgba(0,200,255,0.08), rgba(124,58,237,0.08))" }}>
            <Logo size={40} withText={false} />
          </div>
        </div>

        <h1 className="font-display font-black text-2xl text-foreground mb-1">
          Reset Password
        </h1>
        <p className="text-sm text-muted-foreground font-medium text-center">
          Answer your security question to continue
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-card border-t border-border rounded-t-[32px] px-6 pt-7 pb-8 shadow-[0_-20px_60px_rgba(0,0,0,0.25)] h-full max-h-[75vh] overflow-y-auto"
      >
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="tel"
                inputMode="numeric"
                placeholder="10-digit phone number"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                required
                className="w-full h-14 bg-secondary border border-border focus:border-primary/60 rounded-2xl pl-12 pr-4 text-sm font-semibold text-foreground outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-1">
              Security Question
            </label>
            <div className="relative">
              <select
                value={securityQuestion}
                onChange={(e) => setSecurityQuestion(e.target.value)}
                className="w-full h-14 bg-secondary border border-border focus:border-primary/60 rounded-2xl px-4 text-sm font-semibold text-foreground outline-none transition-all appearance-none"
              >
                <option value="What is your childhood nickname?">What is your childhood nickname?</option>
                <option value="What is the name of your favorite childhood friend?">What is the name of your favorite childhood friend?</option>
                <option value="What was the name of your first pet?">What was the name of your first pet?</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-1">
              Answer
            </label>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Security Answer"
                value={securityAnswer}
                onChange={e => setSecurityAnswer(e.target.value)}
                required
                className="w-full h-14 bg-secondary border border-border focus:border-primary/60 rounded-2xl pl-12 pr-4 text-sm font-semibold text-foreground outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-1">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                className="w-full h-14 bg-secondary border border-border focus:border-primary/60 rounded-2xl pl-12 pr-4 text-sm font-semibold text-foreground outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all active:scale-95 press-effect shadow-cta mt-4"
            style={{ background: loading ? "var(--secondary)" : "var(--gradient-cta)" }}
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Resetting...</>
            ) : (
              <>Reset Password <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="mt-6">
          <Link to="/login">
            <button className="w-full h-12 rounded-2xl font-black text-sm border border-border text-muted-foreground flex items-center justify-center gap-2 press-effect active:scale-95">
              <ChevronLeft className="w-4 h-4" /> Back to Login
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
