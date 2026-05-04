import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await (loginUser as any)({ data: { username, password } });
      setSessionId(res.sessionId);
      toast.success("Welcome back, warrior! 🔥");
      if (res.user.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/";
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100svh] flex flex-col items-center justify-center px-4 py-8 mb-safe lg:mb-0 bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-white rounded-[1.5rem] shadow-sm border border-border flex items-center justify-center mb-4">
            <Logo size={48} withText={false} />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground">
              Welcome Back
            </h1>
            <p className="text-muted-foreground text-sm mt-1 font-semibold">Enter the battlefield, warrior.</p>
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-[1.5rem] border border-border bg-white p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5 ml-1">
                Username
              </label>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full bg-secondary/50 border border-border focus:border-primary focus:bg-white outline-none px-4 h-12 text-sm rounded-xl transition-all font-bold placeholder:font-semibold"
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
                  className="w-full bg-secondary/50 border border-border focus:border-primary focus:bg-white outline-none px-4 pr-12 h-12 text-sm rounded-xl transition-all font-bold placeholder:font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember + forgot */}
            <div className="flex items-center justify-between text-xs px-1">
              <label className="flex items-center gap-2 text-muted-foreground font-semibold cursor-pointer">
                <input type="checkbox" className="accent-primary rounded w-3.5 h-3.5" />
                Remember me
              </label>
              <a href="#" className="text-primary hover:underline font-bold">
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full font-bold mt-2 h-12 rounded-xl bg-primary text-white shadow-primary hover:opacity-90 active:scale-[0.98] transition-all"
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
            <div className="flex-1 h-px bg-border/80" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">OR</span>
            <div className="flex-1 h-px bg-border/80" />
          </div>

          {/* Sign up link */}
          <p className="mt-6 text-center text-sm text-muted-foreground font-semibold">
            New to the arena?{" "}
            <Link to="/signup" className="text-primary font-black hover:underline">
              Create account
            </Link>
          </p>
        </div>

        {/* Bottom links */}
        <div className="mt-8 flex items-center justify-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
          <Link to="/rules" className="hover:text-primary transition-colors">Rules</Link>
          <span className="w-1 h-1 rounded-full bg-border" />
          <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          <span className="w-1 h-1 rounded-full bg-border" />
          <Link to="/contact" className="hover:text-primary transition-colors">Support</Link>
        </div>
      </motion.div>
    </div>
  );
}
