import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useState } from "react";
import { toast } from "sonner";
import { signupUser } from "../../api";
import { setSessionId } from "../../lib/auth-client";
import { Eye, EyeOff, Flame } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/signup")({
  head: () => ({ meta: [{ title: "Sign Up — Professional Esports Arena" }] }),
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
    <div className="min-h-[100svh] flex flex-col items-center justify-center px-4 py-8 mb-safe lg:mb-0 bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md z-10 my-auto"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-white rounded-[1.25rem] shadow-sm border border-border flex items-center justify-center mb-3">
            <Logo size={40} withText={false} />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground">
              Join The Arena
            </h1>
            <p className="text-muted-foreground text-sm mt-1 font-semibold">
              120K+ warriors are waiting for you.
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-[1.5rem] border border-border bg-white p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSignup} className="space-y-4">
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
              onChange={(e) => setUid(e.target.value)}
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
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              required
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

            {/* Terms */}
            <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer px-1 mt-2">
              <input
                type="checkbox"
                required
                className="accent-primary mt-0.5 shrink-0 w-3.5 h-3.5 rounded"
              />
              <span className="leading-relaxed font-semibold">
                I accept the{" "}
                <Link to="/rules" className="text-primary font-bold hover:underline">
                  Rules
                </Link>
                ,{" "}
                <Link to="/terms" className="text-primary font-bold hover:underline">
                  Terms
                </Link>{" "}
                &{" "}
                <Link to="/privacy" className="text-primary font-bold hover:underline">
                  Privacy Policy
                </Link>
                . I confirm I am 13+ years old.
              </span>
            </label>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full font-bold mt-4 h-12 rounded-xl bg-primary text-white shadow-primary hover:opacity-90 active:scale-[0.98] transition-all"
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
            <Link to="/login" className="text-primary font-black hover:underline">
              Log in
            </Link>
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
          <Link to="/rules" className="hover:text-primary transition-colors">
            Rules
          </Link>
          <span className="w-1 h-1 rounded-full bg-border" />
          <Link to="/anti-cheat" className="hover:text-primary transition-colors">
            Anti-Cheat
          </Link>
          <span className="w-1 h-1 rounded-full bg-border" />
          <Link to="/contact" className="hover:text-primary transition-colors">
            Support
          </Link>
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
        className="w-full bg-secondary/50 border border-border focus:border-primary focus:bg-white outline-none px-4 h-12 text-sm rounded-xl transition-all font-bold placeholder:font-semibold"
      />
    </div>
  );
}
