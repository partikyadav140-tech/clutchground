import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { signupUser } from "../../api";
import { setSessionId } from "../../lib/auth-client";
import { Eye, EyeOff, ArrowRight, User, Phone, Lock, Gamepad2, Mail, Hash, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/_app/signup")({
  head: () => ({ meta: [{ title: "Create Account — CLUTCHGROUND" }] }),
  component: SignupPage,
});

function SignupPage() {
  const [step, setStep] = useState(1); // 2-step onboarding
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ username: "", ign: "", uid: "", email: "", phone: "", password: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    setLoading(true);
    try {
      const res = await (signupUser as any)({ data: form });
      setSessionId(res.sessionId);
      toast.success("Welcome to CLUTCHGROUND! 🔥");
      window.location.href = "/";
    } catch (err: any) {
      toast.error(err.message || "Failed to create account");
    } finally { setLoading(false); }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden relative">
      {/* Ambient */}
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-[120px] pointer-events-none opacity-20"
        style={{ background: "var(--neon)" }} />
      <div className="absolute bottom-1/3 left-0 w-60 h-60 rounded-full blur-[100px] pointer-events-none opacity-15"
        style={{ background: "var(--primary)" }} />

      {/* Top section */}
      <motion.div
        key={step}
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
          {step === 1 ? "Create Account" : "Game Details"}
        </h1>
        <p className="text-sm text-muted-foreground font-medium text-center">
          {step === 1 ? "Join 120K+ warriors in the arena" : "Set up your Free Fire profile"}
        </p>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-4">
          <div className="w-6 h-1.5 rounded-full" style={{ background: "var(--primary)" }} />
          <div className="w-6 h-1.5 rounded-full transition-all" style={{ background: step === 2 ? "var(--primary)" : "var(--border)" }} />
        </div>
      </motion.div>

      {/* Form sheet */}
      <motion.div
        key={`form-${step}`}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-card border-t border-border rounded-t-[32px] px-6 pt-7 pb-8 shadow-[0_-20px_60px_rgba(0,0,0,0.25)]"
      >
        <form onSubmit={handleSignup} className="space-y-3">
          {step === 1 ? (
            <>
              <AppInput icon={User} placeholder="Username" value={form.username} onChange={set("username")} required autoComplete="username" />
              <AppInput icon={Phone} type="tel" placeholder="Phone number" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g,"").slice(0,10) }))} required inputMode="numeric" />
              <AppInput icon={Mail} type="email" placeholder="Email address" value={form.email} onChange={set("email")} autoComplete="email" />
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={set("password")}
                  required
                  autoComplete="new-password"
                  className="w-full h-14 bg-secondary border border-border focus:border-primary/60 rounded-2xl pl-12 pr-12 text-sm font-semibold text-foreground outline-none transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </>
          ) : (
            <>
              <AppInput icon={Gamepad2} placeholder="In-Game Name (IGN)" value={form.ign} onChange={set("ign")} />
              <AppInput icon={Hash} placeholder="Free Fire UID" value={form.uid}
                onChange={e => setForm(f => ({ ...f, uid: e.target.value.replace(/\D/g,"") }))} inputMode="numeric" maxLength={12} />

              <label className="flex items-start gap-3 px-1 pt-1">
                <input type="checkbox" required className="accent-primary mt-0.5 w-4 h-4 shrink-0 rounded" />
                <span className="text-xs text-muted-foreground font-medium leading-relaxed">
                  I accept the{" "}
                  <a href="/rules" className="font-bold" style={{ color: "var(--primary)" }}>Rules</a>,{" "}
                  <a href="/terms" className="font-bold" style={{ color: "var(--primary)" }}>Terms</a> &{" "}
                  <a href="/privacy" className="font-bold" style={{ color: "var(--primary)" }}>Privacy Policy</a>.
                  I am 13+ years old.
                </span>
              </label>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all active:scale-95 press-effect shadow-cta mt-1"
            style={{ background: loading ? "var(--secondary)" : "var(--gradient-cta)" }}
          >
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</>
              : step === 1
              ? <>Next <ArrowRight className="w-4 h-4" /></>
              : <>Create Account <ArrowRight className="w-4 h-4" /></>
            }
          </button>
        </form>

        {step === 2 && (
          <button onClick={() => setStep(1)}
            className="w-full h-12 mt-3 rounded-2xl font-black text-sm border border-border text-muted-foreground flex items-center justify-center gap-2 press-effect active:scale-95">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}

        <p className="text-center text-xs text-muted-foreground font-medium mt-5">
          Already have an account?{" "}
          <Link to="/login" className="font-black" style={{ color: "var(--primary)" }}>Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}

function AppInput({ icon: Icon, ...props }: { icon: any } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <input
        {...props}
        className="w-full h-14 bg-secondary border border-border focus:border-primary/60 rounded-2xl pl-12 pr-4 text-sm font-semibold text-foreground outline-none transition-all"
      />
    </div>
  );
}
