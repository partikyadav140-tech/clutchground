import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useState } from "react";
import { toast } from "sonner";
import { signupUser } from "../../api";
import { setSessionId } from "../../lib/auth-client";
import { Eye, EyeOff, Flame } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/signup")({
  head: () => ({ meta: [{ title: "Sign Up — CLUTCHGROUND" }] }),
  component: SignupPage,
});

function SignupPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [ign, setIgn] = useState("");
  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await (signupUser as any)({
        data: { username, password, ign, uid, email, phone },
      });
      setSessionId(res.sessionId);
      toast.success("Welcome to the arena, warrior! 🔥");
      window.location.href = "/";
    } catch (err: any) {
      toast.error(err.message || "Failed to create account");
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
        className="relative w-full max-w-md lg:max-w-lg z-10 my-auto"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-6 lg:mb-8">
          <div className="w-16 h-16 lg:w-20 lg:h-20 bg-card rounded-[1.25rem] shadow-[0_0_20px_rgba(255,0,85,0.3)] border border-primary/30 flex items-center justify-center mb-3">
            <Logo size={40} withText={false} />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl lg:text-3xl font-black text-white text-glow">
              Join The Arena
            </h1>
            <p className="text-muted-foreground text-sm lg:text-base mt-1 font-semibold">
              120K+ warriors are waiting for you.
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-[1.5rem] lg:rounded-[2rem] border border-white/5 bg-card/80 backdrop-blur-xl p-6 lg:p-8 shadow-card">
          <form onSubmit={handleSignup} className="space-y-4 lg:space-y-5">
            {/* Row 1 */}
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Username *"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
              <Field
                label="IGN"
                placeholder="in-game name"
                value={ign}
                onChange={(e) => setIgn(e.target.value)}
              />
            </div>

            {/* UID */}
            <Field
              label="Free Fire UID"
              placeholder="Enter your UID"
              value={uid}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                setUid(value);
              }}
              maxLength={12}
            />

            {/* Email */}
            <Field
              label="Email"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            {/* Phone */}
            <Field
              label="Phone *"
              type="tel"
              placeholder="+91 XXXXXXXXXX"
              value={phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                if (value.length <= 10) {
                  setPhone(value);
                }
              }}
              autoComplete="tel"
              required
              maxLength={10}
            />

            {/* Password */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5 ml-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Choose a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
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

            {/* Terms */}
            <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer px-1 mt-2">
              <input
                type="checkbox"
                required
                className="accent-primary mt-0.5 shrink-0 w-3.5 h-3.5 rounded bg-black/30 border-white/10"
              />
              <span className="leading-relaxed font-semibold">
                I accept the{" "}
                <a href="/rules" className="text-cta font-bold hover:text-white transition-colors">
                  Rules
                </a>
                ,{" "}
                <a href="/terms" className="text-cta font-bold hover:text-white transition-colors">
                  Terms
                </a>{" "}
                &{" "}
                <a href="/privacy" className="text-cta font-bold hover:text-white transition-colors">
                  Privacy Policy
                </a>
                . I confirm I am 13+ years old.
              </span>
            </label>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full font-black uppercase tracking-widest mt-4 h-12 rounded-xl bg-cta-gradient text-cta-foreground shadow-cta hover:scale-[1.02] active:scale-[0.98] transition-all border border-cta/50"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Account...
                </span>
              ) : (
                <>
                  <Flame className="w-4 h-4 mr-2" /> Join The Arena
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground font-semibold">
            Already a warrior?{" "}
            <a href="/login" className="text-cta font-black hover:text-white transition-colors">
              Log in
            </a>
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
          <a href="/rules" className="hover:text-cta transition-colors">
            Rules
          </a>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <a href="/anti-cheat" className="hover:text-cta transition-colors">
            Anti-Cheat
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

function Field({
  label,
  ...rest
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5 ml-1">
        {label}
      </label>
      <input
        {...rest}
        className="w-full bg-black/30 border border-white/10 focus:border-primary focus:bg-black/50 text-white outline-none px-4 h-12 text-sm rounded-xl transition-all font-bold placeholder:text-white/20"
      />
    </div>
  );
}
