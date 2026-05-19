import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { loginUser } from "../../api";
import { setSessionId } from "../../lib/auth-client";
import { Eye, EyeOff, Phone, Lock, ArrowRight, Gamepad2 } from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/_app/login")({
  head: () => ({ meta: [{ title: "Sign In — CLUTCHGROUND" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await (loginUser as any)({ data: { phone, password } });
      setSessionId(res.sessionId);
      toast.success("Welcome back! 🔥");
      window.location.href = res.user.role === "admin" ? "/admin" : "/";
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden relative">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-[120px] pointer-events-none opacity-30"
        style={{ background: "var(--primary)" }} />
      <div className="absolute bottom-0 right-0 w-60 h-60 rounded-full blur-[100px] pointer-events-none opacity-20"
        style={{ background: "var(--neon)" }} />

      {/* Top brand section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center flex-1 px-6 pb-4"
      >
        {/* Logo */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-primary border border-primary/20"
            style={{ background: "linear-gradient(135deg, rgba(0,200,255,0.1), rgba(124,58,237,0.1))" }}>
            <Logo size={48} withText={false} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: "var(--gradient-cta)" }}>
            <Gamepad2 className="w-3 h-3 text-white" />
          </div>
        </div>

        <h1 className="font-display font-black text-2xl text-foreground mb-1">Welcome Back</h1>
        <p className="text-sm text-muted-foreground font-medium">Sign in to your CLUTCHGROUND account</p>
      </motion.div>

      {/* Form card — slides up */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="bg-card border-t border-border rounded-t-[32px] px-6 pt-8 pb-8 shadow-[0_-20px_60px_rgba(0,0,0,0.3)]"
      >
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Phone */}
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
                autoComplete="tel"
                className="w-full h-14 bg-secondary border border-border focus:border-primary/60 rounded-2xl pl-12 pr-4 text-sm font-semibold text-foreground outline-none transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type={showPass ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full h-14 bg-secondary border border-border focus:border-primary/60 rounded-2xl pl-12 pr-12 text-sm font-semibold text-foreground outline-none transition-all"
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
              <Link to="/forgot-password" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                Forgot Password?
              </Link>
            </div>
          </div>

          {/* Sign in button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all active:scale-95 press-effect shadow-cta mt-2"
            style={{ background: loading ? "var(--secondary)" : "var(--gradient-cta)" }}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              <>Sign In <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">New here?</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Sign up */}
        <Link to="/signup">
          <button className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest border border-border bg-secondary text-foreground flex items-center justify-center gap-2 transition-all active:scale-95 press-effect">
            Create Account
          </button>
        </Link>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-4 mt-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <Link to={"/rules" as any} className="hover:text-foreground transition-colors">Rules</Link>
          <span className="w-1 h-1 rounded-full bg-border" />
          <Link to={"/privacy" as any} className="hover:text-foreground transition-colors">Privacy</Link>
          <span className="w-1 h-1 rounded-full bg-border" />
          <Link to={"/contact" as any} className="hover:text-foreground transition-colors">Support</Link>
        </div>
      </motion.div>
    </div>
  );
}
