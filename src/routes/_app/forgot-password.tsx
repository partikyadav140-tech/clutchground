import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { sendEmailOtp, verifyEmailOtp, resetPassword } from "../../api";
import {
  Lock,
  ArrowRight,
  ChevronLeft,
  Mail,
  ShieldCheck,
  RefreshCw,
  KeyRound,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/_app/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot Password — CLUTCHGROUND" }] }),
  component: ForgotPasswordPage,
});

const SLIDE = {
  initial: (dir: number) => ({ opacity: 0, x: dir * 40 }),
  animate: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -40 }),
};

function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1=email, 2=OTP, 3=new password
  const [dir, setDir] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpId, setOtpId] = useState<number | null>(null);
  const [otpToken, setOtpToken] = useState<number | null>(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const router = useRouter();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = () => {
    setCooldown(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  useEffect(
    () => () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    },
    [],
  );

  const goTo = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await (sendEmailOtp as any)({
        data: { email: email.trim(), purpose: "forgot_password" },
      });
      setOtpId(res.otpId);
      setMaskedEmail(res.masked);
      if (res.emailError) {
        toast.warning(`⚠️ Email delivery failed — check spam or contact support. Code is valid.`);
      } else {
        toast.success(`Verification code sent to ${res.masked}`);
      }
      startCooldown();
      goTo(2);
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    try {
      const res = await (sendEmailOtp as any)({
        data: { email: email.trim(), purpose: "forgot_password" },
      });
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
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const res = await (verifyEmailOtp as any)({
        data: { otpId, otp: code, purpose: "forgot_password" },
      });
      setOtpToken(res.otpToken);
      toast.success("Code verified! Set your new password.");
      goTo(3);
    } catch (err: any) {
      toast.error(err.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await (resetPassword as any)({
        data: { email: email.trim(), otpToken, new_password: newPassword },
      });
      toast.success("Password reset successfully! Please sign in.");
      router.navigate({ to: "/login" });
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
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

  const stepTitles = ["Find Account", "Verify Email", "New Password"];
  const stepSubs = [
    "Enter your registered email address",
    maskedEmail ? `Code sent to ${maskedEmail}` : "Check your email",
    "Choose a strong new password",
  ];

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden relative">
      <div
        className="absolute top-0 right-0 w-72 h-72 rounded-full blur-[120px] pointer-events-none opacity-20"
        style={{ background: "var(--neon)" }}
      />
      <div
        className="absolute bottom-1/3 left-0 w-60 h-60 rounded-full blur-[100px] pointer-events-none opacity-15"
        style={{ background: "var(--primary)" }}
      />

      {/* Top section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center flex-shrink-0 px-6 pb-4 pt-8"
      >
        <div className="relative mb-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center border border-primary/20"
            style={{
              background: "linear-gradient(135deg, rgba(0,200,255,0.08), rgba(124,58,237,0.08))",
            }}
          >
            <Logo size={40} withText={false} />
          </div>
        </div>

        <h1 className="font-display font-black text-2xl text-foreground mb-1">
          {stepTitles[step - 1]}
        </h1>
        <p className="text-sm text-muted-foreground font-medium text-center">
          {stepSubs[step - 1]}
        </p>

        {/* Step dots */}
        <div className="flex items-center gap-2 mt-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: step === s ? "24px" : "10px",
                background: step >= s ? "var(--primary)" : "var(--border)",
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Bottom sheet */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-card border-t border-border rounded-t-[32px] px-6 pt-7 pb-8 shadow-[0_-20px_60px_rgba(0,0,0,0.25)] flex-1 overflow-y-auto"
      >
        <AnimatePresence mode="wait" custom={dir}>
          {/* ── Step 1: Email ── */}
          {step === 1 && (
            <motion.form
              key="fp-step1"
              custom={dir}
              variants={SLIDE}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
              onSubmit={handleSendOtp}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    id="fp-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full h-14 bg-secondary border border-border focus:border-primary/60 rounded-2xl pl-12 pr-4 text-sm font-semibold text-foreground outline-none transition-all"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-2 ml-1 font-medium">
                  We'll send a 6-digit code to this email to verify it's you.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all active:scale-95 press-effect shadow-cta mt-4"
                style={{
                  background: loading || !email.trim() ? "var(--secondary)" : "var(--gradient-cta)",
                }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send OTP <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="mt-2">
                <Link to="/login">
                  <button
                    type="button"
                    className="w-full h-12 rounded-2xl font-black text-sm border border-border text-muted-foreground flex items-center justify-center gap-2 press-effect active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back to Login
                  </button>
                </Link>
              </div>
            </motion.form>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 2 && (
            <motion.form
              key="fp-step2"
              custom={dir}
              variants={SLIDE}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
              onSubmit={handleVerifyOtp}
              className="space-y-5"
            >
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-primary/10 border border-primary/20">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--primary)" }}
                >
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-primary">
                    Check your inbox
                  </p>
                  <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                    Code sent to <span className="text-foreground font-bold">{maskedEmail}</span>
                  </p>
                </div>
              </div>

              {/* 6-digit OTP boxes */}
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    id={`fp-otp-${i + 1}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpInput(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 h-14 text-center text-xl font-black bg-secondary border-2 rounded-2xl text-foreground outline-none transition-all"
                    style={{
                      borderColor: digit ? "var(--primary)" : "var(--border)",
                      background: digit ? "rgba(124,58,237,0.08)" : undefined,
                    }}
                  />
                ))}
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0 || loading}
                  className="inline-flex items-center gap-1.5 text-xs font-bold transition-colors disabled:opacity-50"
                  style={{ color: cooldown > 0 ? "var(--muted-foreground)" : "var(--primary)" }}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || otp.join("").length < 6}
                className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all active:scale-95 press-effect shadow-cta"
                style={{
                  background:
                    loading || otp.join("").length < 6 ? "var(--secondary)" : "var(--gradient-cta)",
                }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Verify Code
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => goTo(1)}
                className="w-full h-12 rounded-2xl font-black text-sm border border-border text-muted-foreground flex items-center justify-center gap-2 press-effect active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            </motion.form>
          )}

          {/* ── Step 3: New Password ── */}
          {step === 3 && (
            <motion.form
              key="fp-step3"
              custom={dir}
              variants={SLIDE}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
              onSubmit={handleReset}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-green-500/10 border border-green-500/20 mb-2">
                <ShieldCheck className="w-5 h-5 text-green-400 shrink-0" />
                <p className="text-[12px] text-green-400 font-bold">Email verified successfully!</p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-1">
                  New Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    id="fp-new-password"
                    type={showPass ? "text" : "password"}
                    placeholder="Enter new password (min 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full h-14 bg-secondary border border-border focus:border-primary/60 rounded-2xl pl-12 pr-12 text-sm font-semibold text-foreground outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Lock className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all active:scale-95 press-effect shadow-cta mt-4"
                style={{ background: loading ? "var(--secondary)" : "var(--gradient-cta)" }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    Reset Password <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
