import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useState } from "react";
import { toast } from "sonner";
import { signupUser } from "../../api";
import { setSessionId } from "../../lib/auth-client";

export const Route = createFileRoute("/_app/signup")({
  head: () => ({ meta: [{ title: "Sign Up — GOD ESPORTS" }] }),
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await (signupUser as any)({ data: { username, password, ign, uid, email, phone } });
      setSessionId(res.sessionId);
      toast.success("Account created successfully!");
      window.location.href = "/";
    } catch (err: any) {
      toast.error(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-12 order-2 lg:order-1">
        <form
          onSubmit={handleSignup}
          className="w-full max-w-md space-y-4"
        >
          <div className="lg:hidden mb-4"><Logo size={64} /></div>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight">Join The Gods</h1>
            <p className="text-muted-foreground text-sm mt-1">Forge your legend.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Username" placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} required />
            <Field label="In-Game Name (IGN)" placeholder="Enter IGN" value={ign} onChange={e => setIgn(e.target.value)} />
          </div>
          <Field label="Free Fire UID" placeholder="Enter UID" value={uid} onChange={e => setUid(e.target.value)} />
          <Field label="Email" type="email" placeholder="Enter email" value={email} onChange={e => setEmail(e.target.value)} />
          <Field label="Phone" type="tel" placeholder="Enter phone number" value={phone} onChange={e => setPhone(e.target.value)} />
          <Field label="Password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />

          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input type="checkbox" required className="accent-primary mt-0.5" />
            <span>I accept the GOD ESPORTS rules, anti-cheat policy, and confirm I am 13+.</span>
          </label>

          <Button type="submit" variant="hero" size="lg" className="w-full font-display tracking-wider" disabled={loading}>
            {loading ? "FORGING ACCOUNT..." : "CREATE ACCOUNT"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already a god? <Link to="/login" className="text-primary font-bold hover:underline">Log in</Link>
          </p>
        </form>
      </div>

      <div className="hidden lg:flex relative bg-hero-gradient items-center justify-center p-12 overflow-hidden order-1 lg:order-2">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute inset-0 scanlines" />
        <div className="relative text-center max-w-md">
          <Logo size={120} withText={false} />
          <h2 className="mt-8 font-display text-5xl font-black text-fire-gradient">RISE.</h2>
          <p className="mt-4 text-muted-foreground">120,000+ warriors compete every day. Your throne is waiting.</p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest font-display font-bold text-muted-foreground mb-1.5">{label}</label>
      <input {...rest} className="w-full bg-card border border-border focus:border-primary outline-none px-4 h-11 text-sm transition-colors" />
    </div>
  );
}
