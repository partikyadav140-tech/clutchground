import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { loginUser } from "../../api";
import { setSessionId } from "../../lib/auth-client";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Gamepad2 } from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/_app/login")({
  head: () => ({ meta: [{ title: "Sign In — CLUTCHGROUND" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await (loginUser as any)({ data: { email: email.trim(), password } });
      setSessionId(res.sessionId);
      toast.success("Welcome back!");
      window.location.href = res.user.role === "admin" ? "/admin" : "/";
    } catch (err: any) {
      const msg = err.message || "Invalid credentials";
      setErrorMsg(msg);
      if (msg.includes("locked for 2 hours")) {
        setIsLocked(true);
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-y-auto pb-[20px] pt-[20px]">
      {/* Ambient glows */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-full blur-[120px] pointer-events-none opacity-20"
        style={{ background: "var(--primary)" }}
      />
      <div
        className="absolute bottom-10 right-10 w-72 h-72 rounded-full blur-[100px] pointer-events-none opacity-15"
        style={{ background: "var(--neon)" }}
      />
      <div className="absolute inset-0 grid-bg opacity-[0.04] pointer-events-none" />

      {/* Card container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px] bg-card/45 backdrop-blur-xl border border-border/80 rounded-[32px] p-6 sm:p-8 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.4)] relative z-10"
      >
        {/* Brand Section */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-primary border border-primary/20 bg-secondary/30">
              <Logo size={38} withText={false} />
            </div>
            <div
              className="absolute -bottom-1 -right-1 w-5.5 h-5.5 rounded-full flex items-center justify-center shadow-md"
              style={{ background: "var(--gradient-cta)" }}
            >
              <Gamepad2 className="w-2.5 h-2.5 text-white" />
            </div>
          </div>

          <h1 className="font-display font-black text-2xl text-foreground mb-1 tracking-wide text-glow">
            Welcome Back
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Sign in to your ClutchGround account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-label mb-1.5 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/75 pointer-events-none" />
              <input
                type="text"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full h-13 bg-secondary/50 border border-border focus:border-primary/60 rounded-2xl pl-12 pr-4 text-sm font-semibold text-foreground outline-none transition-all focus:ring-1 focus:ring-primary/20 focus:bg-secondary/80"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-label mb-1.5 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/75 pointer-events-none" />
              <input
                type={showPass ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full h-13 bg-secondary/50 border border-border focus:border-primary/60 rounded-2xl pl-12 pr-12 text-sm font-semibold text-foreground outline-none transition-all focus:ring-1 focus:ring-primary/20 focus:bg-secondary/80"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex justify-end mt-2">
              <Link
                to="/forgot-password"
                className="text-[11px] font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          {/* Error / Lockout message */}
          {errorMsg && (
            <div className={`p-3 rounded-2xl border text-[12px] font-semibold ${
              isLocked
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-400"
            }`}>
              {errorMsg}
            </div>
          )}

          {/* Sign in button */}
          <button
            type="submit"
            disabled={loading || isLocked}
            className="w-full h-13 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-95 press-effect shadow-cta mt-2"
            style={{ background: loading ? "var(--secondary)" : "var(--gradient-cta)" }}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border/60" />
          <span className="text-label">New here?</span>
          <div className="flex-1 h-px bg-border/60" />
        </div>

        {/* Sign up */}
        <Link to="/signup">
          <button className="w-full h-13 rounded-2xl font-bold text-sm border border-border bg-secondary/40 text-foreground flex items-center justify-center gap-2 transition-all active:scale-95 press-effect hover:bg-secondary/70">
            Create Account
          </button>
        </Link>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-4 mt-6 text-xs font-semibold text-muted-foreground">
          <Link to={"/rules" as any} className="hover:text-foreground transition-colors">
            Rules
          </Link>
          <span className="w-1.5 h-1.5 rounded-full bg-border/60" />
          <Link to={"/privacy" as any} className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <span className="w-1.5 h-1.5 rounded-full bg-border/60" />
          <Link to={"/contact" as any} className="hover:text-foreground transition-colors">
            Support
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
