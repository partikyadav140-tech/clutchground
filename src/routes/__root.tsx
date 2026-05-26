import { Outlet, createRootRoute, HeadContent, Scripts, ScrollRestoration, useRouterState } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { SplashScreen } from "@/components/SplashScreen";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useEffect } from "react";
import { trackWebVitals } from "@/lib/performance";
import { ThemeProvider, themeInitScript } from "@/lib/theme";
import { InstallPwaDialog } from "@/components/InstallPwaDialog";

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
      { name: "viewport", content: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" },
      { title: "Clutch Ground | Rule the Battleground" },
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
      { property: "og:title", content: "Clutch Ground | Rule the Battleground" },
      {
        property: "og:description",
        content:
          "Join ClutchGround to compete in top-tier Free Fire and Free Fire MAX tournaments. Win massive real cash prizes, join elite esports teams, and climb the Leaderboard.",
      },
      { property: "og:image", content: "/new-banner.png" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Clutch Ground | Rule the Battleground" },
      {
        name: "twitter:description",
        content:
          "Join ClutchGround to compete in top-tier Free Fire and Free Fire MAX tournaments. Win massive real cash prizes, join elite esports teams, and climb the Leaderboard.",
      },
      { name: "twitter:image", content: "/new-banner.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      // Fonts — single optimised request (Orbitron display + Inter body)
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Inter:wght@400;500;600;700&display=swap",
      },
      // DNS prefetch for API & CDN
      { rel: "dns-prefetch", href: "//api.clutchground.com" },
      { rel: "dns-prefetch", href: "//res.cloudinary.com" },
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
        <link rel="manifest" href="/manifest.webmanifest" />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(console.error);
            });
          }
        `}} />
      </head>
      <body>
        <ThemeProvider>
          <SplashScreen />
          <InstallPwaDialog />
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
  const routerState = useRouterState();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [routerState.location.pathname]);

  useEffect(() => {
    trackWebVitals();

    if (typeof window !== "undefined") {
      window.history.scrollRestoration = "manual";
    }

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
