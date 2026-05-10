import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useState } from "react";
import { toast } from "sonner";
import { loginUser } from "../../api";
import { setSessionId } from "../../lib/auth-client";
import { Eye, EyeOff, Flame } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/login")({
  head: () => ({ meta: [{ title: "Login — Professional Esports Arena" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await (loginUser as any)({ data: { phone, password } });
      setSessionId(res.sessionId);
      toast.success("Welcome back, warrior! 🔥");
      if (res.user.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/";
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid phone number or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8 bg-background relative overflow-hidden">
      {/* Background Cyberpunk decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 lg:w-96 lg:h-96 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 lg:w-96 lg:h-96 bg-blue-500/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md lg:max-w-lg z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-6 lg:mb-8">
          <div className="w-16 h-16 lg:w-20 lg:h-20 bg-card rounded-[1.25rem] shadow-[0_0_20px_rgba(255,0,85,0.3)] border border-primary/30 flex items-center justify-center mb-3 lg:mb-4">
            <Logo size={40} withText={false} />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl lg:text-3xl font-black text-white text-glow">
              Welcome Back
            </h1>
            <p className="text-muted-foreground text-sm lg:text-base mt-1 font-semibold">
              Enter the battlefield, warrior.
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-[1.5rem] lg:rounded-[2rem] border border-white/5 bg-card/80 backdrop-blur-xl p-6 lg:p-8 shadow-card">
          <form onSubmit={handleLogin} className="space-y-4 lg:space-y-5">
            {/* Phone */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5 ml-1">
                Phone
              </label>
              <input
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                  if (value.length <= 10) {
                    setPhone(value);
                  }
                }}
                required
                autoComplete="tel"
                maxLength={10}
                className="w-full bg-black/30 border border-white/10 focus:border-primary focus:bg-black/50 text-white outline-none px-4 h-12 text-sm rounded-xl transition-all font-bold placeholder:text-white/20"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5 ml-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-black/30 border border-white/10 focus:border-primary focus:bg-black/50 text-white outline-none px-4 pr-12 h-12 text-sm rounded-xl transition-all font-bold placeholder:text-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-cta transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember + forgot */}
            <div className="flex items-center justify-between text-xs px-1">
              <label className="flex items-center gap-2 text-muted-foreground font-semibold cursor-pointer">
                <input type="checkbox" className="accent-primary rounded w-3.5 h-3.5 bg-black/30 border-white/10" />
                Remember me
              </label>
              <a href="#" className="text-cta hover:text-white transition-colors font-bold">
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full font-black uppercase tracking-widest mt-2 h-12 rounded-xl bg-cta-gradient text-cta-foreground shadow-cta hover:scale-[1.02] active:scale-[0.98] transition-all border border-cta/50"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <>
                  <Flame className="w-4 h-4 mr-2" /> Log In
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              OR
            </span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Sign up link */}
          <p className="mt-6 text-center text-sm text-muted-foreground font-semibold">
            New to the arena?{" "}
            <a href="/signup" className="text-cta font-black hover:text-white transition-colors">
              Create account
            </a>
          </p>
        </div>

        {/* Bottom links */}
        <div className="mt-8 flex items-center justify-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
          <a href="/rules" className="hover:text-cta transition-colors">
            Rules
          </a>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <a href="/privacy" className="hover:text-cta transition-colors">
            Privacy
          </a>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <a href="/contact" className="hover:text-cta transition-colors">
            Support
          </a>
        </div>
      </motion.div>
    </div>
  );
}
