import { Outlet, createRootRoute, HeadContent, Scripts, ScrollRestoration } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { SplashScreen } from "@/components/SplashScreen";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useEffect } from "react";
import { trackWebVitals } from "@/lib/performance";
import { ThemeProvider, themeInitScript } from "@/lib/theme";

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
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </a>
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
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@400;500;600;700&display=swap",
      },
      { rel: "dns-prefetch", href: "//api.clutchground.com" },
      { rel: "dns-prefetch", href: "//fonts.googleapis.com" },
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
        {/* Anti-flash theme script — runs before CSS */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <SplashScreen />
          {children}
          <ConfirmDialog />
          <Toaster
            theme="system"
            position="top-center"
            toastOptions={{
              className:
                "bg-card border border-primary/50 text-foreground font-display shadow-fire",
              descriptionClassName: "text-muted-foreground font-sans",
            }}
          />
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  useEffect(() => {
    trackWebVitals();

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      requestIdleCallback(() => {
        const links = document.querySelectorAll('a[href^="/"]');
        links.forEach((link) => {
          const href = link.getAttribute("href");
          if (href && !href.startsWith("http")) {
            const prefetchLink = document.createElement("link");
            prefetchLink.rel = "prefetch";
            prefetchLink.href = href;
            document.head.appendChild(prefetchLink);
          }
        });
      });
    }
  }, []);

  return <Outlet />;
}
