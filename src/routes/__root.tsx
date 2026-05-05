import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { Tutorial } from "@/components/Tutorial";
import { SplashScreen } from "@/components/SplashScreen";
import { ConfirmDialog } from "@/components/ConfirmDialog";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ClutchGround | India's #1 Free Fire Tournament & Esports Arena" },
      {
        name: "description",
        content:
          "Join ClutchGround to compete in top-tier Free Fire and Free Fire MAX tournaments. Win massive real cash prizes, join elite esports teams, and climb the Leaderboard.",
      },
      {
        name: "keywords",
        content:
          "ClutchGround, clutch ground, clutch, tournament free fire, free fire tournament app, free fire esports, ff max tournament, clutch esports, play free fire earn money, best free fire tournament app",
      },
      {
        name: "robots",
        content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      { name: "author", content: "ClutchGround Esports" },
      { property: "og:title", content: "ClutchGround | Elite Free Fire Tournaments" },
      {
        property: "og:description",
        content:
          "India's most fierce Free Fire esports league. Play, Win, and become a God of the Arena.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "ClutchGround" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "ClutchGround Free Fire Tournaments" },
      {
        name: "twitter:description",
        content: "Compete in daily Free Fire tournaments for real cash prizes on ClutchGround.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <SplashScreen />
        {children}
        <Tutorial />
        <ConfirmDialog />
        <Toaster
          theme="light"
          toastOptions={{
            className:
              "bg-background border border-primary/50 text-foreground font-display clip-notch shadow-fire",
            descriptionClassName: "text-muted-foreground font-sans",
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
