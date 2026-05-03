import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useState } from "react";
import { toast } from "sonner";
import { loginUser } from "../../api";
import { setSessionId } from "../../lib/auth-client";

export const Route = createFileRoute("/_app/login")({
  head: () => ({ meta: [{ title: "Login — GOD ESPORTS" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await (loginUser as any)({ data: { username, password } });
      setSessionId(res.sessionId);
      toast.success("Welcome back!");
      if (res.user.role === 'admin') {
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
    <div className="min-h-[calc(100vh-10rem)] grid lg:grid-cols-2">
      <div className="hidden lg:flex relative bg-hero-gradient items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute inset-0 scanlines" />
        <div className="relative text-center max-w-md">
          <Logo size={120} withText={false} />
          <h2 className="mt-8 font-display text-5xl font-black text-fire-gradient">WELCOME BACK</h2>
          <p className="mt-4 text-muted-foreground">The arena has missed you. Time to claim more crowns.</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md space-y-5"
        >
          <div className="lg:hidden mb-4"><Logo size={64} /></div>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight">Login</h1>
            <p className="text-muted-foreground text-sm mt-1">Enter the battlefield.</p>
          </div>

          <Field label="Username" type="text" placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} required />
          <Field label="Password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-muted-foreground"><input type="checkbox" className="accent-primary" /> Remember me</label>
            <a href="#" className="text-primary hover:underline">Forgot password?</a>
          </div>

          <Button type="submit" variant="hero" size="lg" className="w-full font-display tracking-wider" disabled={loading}>
            {loading ? "AUTHENTICATING..." : "LOG IN"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            New here? <Link to="/signup" className="text-primary font-bold hover:underline">Create account</Link>
          </p>
        </form>
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
