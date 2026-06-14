import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { signupUser, sendEmailOtp, verifyEmailOtp } from "../../api";
import { setSessionId } from "../../lib/auth-client";
import { Eye, EyeOff, ArrowRight, User, Phone, Lock, Gamepad2, Mail, Hash, ChevronLeft, ShieldCheck, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/_app/signup")({
  head: () => ({ meta: [{ title: "Create Account — CLUTCHGROUND" }] }),
  component: SignupPage,
});

const SLIDE = {
  initial: (dir: number) => ({ opacity: 0, x: dir * 40 }),
  animate: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -40 }),
};

function SignupPage() {
  const [step, setStep] = useState(1); // 1=account info, 2=email OTP, 3=game details
  const [dir, setDir] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    username: "", ign: "", uid: "", email: "", phone: "", password: "",
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  // OTP state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpId, setOtpId] = useState<number | null>(null);
  const [otpToken, setOtpToken] = useState<number | null>(null);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = () => {
    setCooldown(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  const goTo = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim()) { toast.error("Email address is required for verification"); return; }
    setLoading(true);
    try {
      const res = await (sendEmailOtp as any)({ data: { email: form.email.trim(), purpose: "signup" } });
      setOtpId(res.otpId);
      setMaskedEmail(res.masked);
      if (res.emailError) {
        toast.warning(`⚠️ Email delivery failed — check your spam or contact support. Code is valid.`);
      } else {
        toast.success(`Verification code sent to ${res.masked}`);
      }
      startCooldown();
      goTo(2);
    } catch (err: any) {
      toast.error(err.message || "Failed to send verification email");
    } finally { setLoading(false); }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    try {
      const res = await (sendEmailOtp as any)({ data: { email: form.email.trim(), purpose: "signup" } });
      setOtpId(res.otpId);
      setMaskedEmail(res.masked);
      setOtp(["", "", "", "", "", ""]);
      setOtpToken(null);
      if (res.emailError) {
        toast.warning(`⚠️ Email delivery failed — check spam or contact support.`);
      } else {
        toast.success("New code sent!");
      }
      startCooldown();
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      toast.error(err.message || "Failed to resend");
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { toast.error("Enter the 6-digit code"); return; }
    setLoading(true);
    try {
      const res = await (verifyEmailOtp as any)({ data: { otpId, otp: code, purpose: "signup" } });
      setOtpToken(res.otpToken);
      toast.success("Email verified! 🎉");
      goTo(3);
    } catch (err: any) {
      toast.error(err.message || "Invalid code");
    } finally { setLoading(false); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await (signupUser as any)({ data: { ...form, otpToken } });
      setSessionId(res.sessionId);
      toast.success("Welcome to CLUTCHGROUND! 🔥");
      window.location.href = "/";
    } catch (err: any) {
      toast.error(err.message || "Failed to create account");
    } finally { setLoading(false); }
  };

  const handleOtpInput = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  const stepLabels = ["Account Info", "Verify Email", "Game Details"];

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-y-auto pb-[20px] pt-[20px]">
      {/* Ambient */}
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-[120px] pointer-events-none opacity-15"
        style={{ background: "var(--neon)" }} />
      <div className="absolute bottom-1/3 left-0 w-60 h-60 rounded-full blur-[100px] pointer-events-none opacity-15"
        style={{ background: "var(--primary)" }} />
      <div className="absolute inset-0 grid-bg opacity-[0.04] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px] bg-card/45 backdrop-blur-xl border border-border/80 rounded-[32px] p-6 sm:p-8 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.4)] relative z-10"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-primary/20 bg-secondary/30">
              <Logo size={36} withText={false} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5.5 h-5.5 rounded-full flex items-center justify-center shadow-md"
              style={{ background: "var(--gradient-cta)" }}>
              <Gamepad2 className="w-2.5 h-2.5 text-white" />
            </div>
          </div>

          <h1 className="font-display font-black text-2xl text-foreground mb-1 tracking-wide text-glow">
            {step === 1 ? "Create Account" : step === 2 ? "Verify Email" : "Game Details"}
          </h1>
          <p className="text-xs text-muted-foreground font-semibold px-2">
            {step === 1 ? "Join India's Free Fire esports arena"
              : step === 2 ? `Code sent to ${maskedEmail}`
              : "Set up your Free Fire profile"}
          </p>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map(s => (
              <div key={s} className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: step === s ? "24px" : "12px",
                  background: step >= s ? "var(--primary)" : "var(--border)"
                }} />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-2">
            Step {step} of 3 — {stepLabels[step - 1]}
          </p>
        </div>

        <AnimatePresence mode="wait" custom={dir}>
          {/* ── Step 1: Account Info ── */}
          {step === 1 && (
            <motion.form key="step1" custom={dir} variants={SLIDE} initial="initial" animate="animate" exit="exit"
              transition={{ duration: 0.25 }} onSubmit={handleStep1} className="space-y-3.5">
              <AppInput icon={User} placeholder="Username" value={form.username} onChange={set("username")} required autoComplete="username" />
              <AppInput icon={Phone} type="tel" placeholder="Phone number" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} required inputMode="numeric" />
              <AppInput icon={Mail} type="email" placeholder="Email address (required)" value={form.email} onChange={set("email")} required autoComplete="email" />
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/75" />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={set("password")}
                  required
                  autoComplete="new-password"
                  className="w-full h-13 bg-secondary/50 border border-border focus:border-primary/60 focus:bg-secondary/80 focus:ring-1 focus:ring-primary/20 rounded-2xl pl-12 pr-12 text-sm font-semibold text-foreground outline-none transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button type="submit" disabled={loading}
                className="w-full h-13 rounded-2xl font-black text-xs uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all active:scale-95 press-effect shadow-cta mt-2"
                style={{ background: loading ? "var(--secondary)" : "var(--gradient-cta)" }}>
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending Code...</>
                  : <>Send Verification Code <ArrowRight className="w-3.5 h-3.5" /></>}
              </button>
            </motion.form>
          )}

          {/* ── Step 2: OTP Verification ── */}
          {step === 2 && (
            <motion.form key="step2" custom={dir} variants={SLIDE} initial="initial" animate="animate" exit="exit"
              transition={{ duration: 0.25 }} onSubmit={handleVerifyOtp} className="space-y-5">
              {/* OTP hint */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-primary/10 border border-primary/20">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--primary)" }}>
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-primary">Check your inbox</p>
                  <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                    We sent a 6-digit code to <span className="text-foreground font-bold">{maskedEmail}</span>
                  </p>
                </div>
              </div>

              {/* 6-digit OTP boxes */}
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    id={`otp-digit-${i + 1}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpInput(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className="w-11 h-14 text-center text-xl font-black bg-secondary/50 border-2 rounded-2xl text-foreground outline-none transition-all"
                    style={{
                      borderColor: digit ? "var(--primary)" : "var(--border)",
                      background: digit ? "rgba(124,58,237,0.08)" : undefined,
                    }}
                  />
                ))}
              </div>

              {/* Resend */}
              <div className="text-center">
                <button type="button" onClick={handleResendOtp} disabled={cooldown > 0 || loading}
                  className="inline-flex items-center gap-1.5 text-xs font-bold transition-colors disabled:opacity-50"
                  style={{ color: cooldown > 0 ? "var(--muted-foreground)" : "var(--primary)" }}>
                  <RefreshCw className="w-3.5 h-3.5" />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>

              <button type="submit" disabled={loading || otp.join("").length < 6}
                className="w-full h-13 rounded-2xl font-black text-xs uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all active:scale-95 press-effect shadow-cta"
                style={{ background: (loading || otp.join("").length < 6) ? "var(--secondary)" : "var(--gradient-cta)" }}>
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</>
                  : <><ShieldCheck className="w-3.5 h-3.5" /> Verify & Continue</>}
              </button>

              <button type="button" onClick={() => goTo(1)}
                className="w-full h-11 rounded-2xl font-black text-xs uppercase tracking-widest border border-border bg-secondary/30 text-muted-foreground flex items-center justify-center gap-2 press-effect active:scale-95 hover:bg-secondary/50">
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            </motion.form>
          )}

          {/* ── Step 3: Game Details ── */}
          {step === 3 && (
            <motion.form key="step3" custom={dir} variants={SLIDE} initial="initial" animate="animate" exit="exit"
              transition={{ duration: 0.25 }} onSubmit={handleSignup} className="space-y-3.5">
              <AppInput icon={Gamepad2} placeholder="In-Game Name (IGN)" value={form.ign} onChange={set("ign")} />
              <AppInput icon={Hash} placeholder="Free Fire UID" value={form.uid}
                onChange={e => setForm(f => ({ ...f, uid: e.target.value.replace(/\D/g, "") }))} inputMode="numeric" maxLength={12} />

              <label className="flex items-start gap-3 px-1 pt-1">
                <input type="checkbox" required className="accent-primary mt-0.5 w-4 h-4 shrink-0 rounded border-border" />
                <span className="text-[11px] text-muted-foreground font-semibold leading-relaxed">
                  I accept the{" "}
                  <a href="/rules" className="font-bold hover:underline" style={{ color: "var(--primary)" }}>Rules</a>,{" "}
                  <a href="/terms" className="font-bold hover:underline" style={{ color: "var(--primary)" }}>Terms</a> &{" "}
                  <a href="/privacy" className="font-bold hover:underline" style={{ color: "var(--primary)" }}>Privacy</a>.
                  I am 13+ years old.
                </span>
              </label>

              <button type="submit" disabled={loading}
                className="w-full h-13 rounded-2xl font-black text-xs uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all active:scale-95 press-effect shadow-cta mt-2"
                style={{ background: loading ? "var(--secondary)" : "var(--gradient-cta)" }}>
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</>
                  : <>Create Account <ArrowRight className="w-3.5 h-3.5" /></>}
              </button>

              <button type="button" onClick={() => goTo(2)}
                className="w-full h-11 rounded-2xl font-black text-xs uppercase tracking-widest border border-border bg-secondary/30 text-muted-foreground flex items-center justify-center gap-2 press-effect active:scale-95 hover:bg-secondary/50">
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-muted-foreground font-semibold mt-6">
          Already have an account?{" "}
          <Link to="/login" className="font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-wider text-[11px]">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}

function AppInput({ icon: Icon, ...props }: { icon: any } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/75 pointer-events-none" />
      <input
        {...props}
        className="w-full h-13 bg-secondary/50 border border-border focus:border-primary/60 focus:bg-secondary/80 focus:ring-1 focus:ring-primary/20 rounded-2xl pl-12 pr-4 text-sm font-semibold text-foreground outline-none transition-all"
      />
    </div>
  );
}
