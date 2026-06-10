import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  Bell, MessageCircle, Phone, FileText, Sun, Moon, RefreshCw, Wallet, Users, Trophy, ChevronRight, LogOut, Settings,
} from "lucide-react";
import { useAuth } from "../../lib/auth-client";
import { useTheme } from "../../lib/theme";
import { useTutorialStore } from "../../lib/tutorial-store";
import { PageHeader } from "@/components/PageHeader";
import { GodCoin } from "@/components/GodCoin";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — ClutchGround" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme, isHydrated } = useTheme();
  const balance = user
    ? ((user as any).deposit_balance || 0) + ((user as any).winning_balance || 0)
    : 0;

  if (!user) {
    router.navigate({ to: "/login" });
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-6 page-content">
      <PageHeader eyebrow="App" eyebrowIcon={Settings} title="Settings" />

      <div className="px-4 space-y-5 -mt-2">
        <MenuSection label="Account">
          <MenuItem icon={Wallet} color="#10b981" label="Wallet & balance" to="/wallet"
            right={<span className="text-xs font-bold text-primary flex items-center gap-1"><GodCoin className="w-3 h-3" />{balance}</span>} />
          <MenuItem icon={Users} color="#a78bfa" label="Squad management" to="/my-team" />
          <MenuItem icon={Trophy} color="var(--fire)" label="Match history" to="/matches" />
        </MenuSection>

        <MenuSection label="Preferences">
          <MenuItem icon={Bell} color="#8b5cf6" label="Notifications" to="/notifications" />
          {isHydrated && (
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-0 active:bg-secondary/50"
            >
              <IconBox color="var(--primary)">{theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</IconBox>
              <span className="flex-1 text-sm font-bold text-left">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </MenuSection>

        <MenuSection label="Support">
          <MenuItem icon={MessageCircle} color="#ec4899" label="Help & support" to="/support" />
          <MenuItem icon={Phone} color="#60a5fa" label="Contact us" to="/contact" />
          <MenuItem icon={FileText} color="#fbbf24" label="Terms & conditions" to="/terms" />
        </MenuSection>

        <MenuSection label="App">
          <button
            type="button"
            onClick={() => {
              useTutorialStore.getState().replayTutorial();
              router.navigate({ to: "/" });
            }}
            className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-secondary/50"
          >
            <IconBox color="#f59e0b"><RefreshCw className="w-4 h-4" /></IconBox>
            <span className="flex-1 text-sm font-bold text-left">Replay tutorial</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </MenuSection>
      </div>

      <div className="px-4 mt-8">
        <Button
          variant="outline"
          className="w-full h-12 rounded-2xl text-red-500 border-red-500/30 hover:bg-red-500/10 font-bold"
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign out
        </Button>
      </div>
    </div>
  );
}

function MenuSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-1">{label}</p>
      <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">{children}</div>
    </div>
  );
}

function IconBox({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}20`, color }}>
      {children}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  color,
  label,
  to,
  right,
}: {
  icon: typeof Bell;
  color: string;
  label: string;
  to: string;
  right?: React.ReactNode;
}) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3.5 active:bg-secondary/50">
      <IconBox color={color}><Icon className="w-4 h-4" /></IconBox>
      <span className="flex-1 text-sm font-bold text-foreground">{label}</span>
      {right || <ChevronRight className="w-4 h-4 text-muted-foreground" />}
    </Link>
  );
}
