import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { SplashScreen } from "@/components/SplashScreen";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useEffect } from "react";
import { trackWebVitals } from "@/lib/performance";
import { ThemeProvider, themeInitScript } from "@/lib/theme";
import { InstallPwaDialog } from "@/components/InstallPwaDialog";
import { GlobalErrorBoundaryWrapper } from "../router";

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
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover",
      },

      // ── Primary SEO ──────────────────────────────────────────────────────────
      {
        title:
          "ClutchGround | Clutch Ground — India's #1 Free Fire Esports Tournament Platform | Win Real Cash",
      },
      {
        name: "description",
        content:
          "ClutchGround is India's #1 Free Fire & Free Fire MAX esports tournament platform. Join daily & weekly tournaments, win real cash prizes up to ₹10,000, form squads, climb the national leaderboard, and battle the best players in India. Free to join. Register now at clutchground.games!",
      },
      {
        name: "keywords",
        content:
          "ClutchGround, clutchground.games, clutch ground, free fire tournament, free fire tournament India, free fire esports India, free fire max tournament, ff tournament app, free fire cash tournament, garena free fire tournament, best free fire tournament app, online free fire tournament, free fire squad tournament, free fire duo tournament, free fire solo tournament, free fire tournament registration, win money free fire, free fire prize pool, free fire leaderboard India, free fire esports team, join free fire tournament, free fire gaming platform, ff max esports, clutch esports, indian gaming tournament, mobile esports India, battle royale tournament India",
      },
      {
        name: "robots",
        content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      {
        name: "googlebot",
        content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
      },
      { name: "google-site-verification", content: "1lzJttEC5fS02fFzJrv4p2FH67VPj33kfmciXQ0l6J8" },
      { name: "author", content: "ClutchGround" },
      { name: "theme-color", content: "#080c14" },
      { name: "application-name", content: "ClutchGround" },
      { name: "category", content: "Gaming, Esports, Tournaments" },
      { name: "language", content: "English" },
      { name: "geo.region", content: "IN" },
      { name: "geo.placename", content: "India" },
      { name: "rating", content: "general" },
      { name: "revisit-after", content: "1 days" },

      // ── Canonical ────────────────────────────────────────────────────────────
      { property: "og:url", content: "https://clutchground.games/" },

      // ── Open Graph ───────────────────────────────────────────────────────────
      { property: "og:site_name", content: "ClutchGround" },
      { property: "og:type", content: "website" },
      {
        property: "og:title",
        content: "ClutchGround | Clutch Ground — India's #1 Free Fire Esports Tournament Platform",
      },
      {
        property: "og:description",
        content:
          "Join ClutchGround — India's biggest Free Fire & Free Fire MAX tournament platform. Compete in daily tournaments, win real cash prizes, build your esports team, and dominate the national leaderboard. 10,000+ players trust ClutchGround. Join free at clutchground.games!",
      },
      {
        property: "og:image",
        content: "https://clutchground.games/logo-transparent.png",
      },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: "ClutchGround — Free Fire Esports Tournament Platform India",
      },
      { property: "og:locale", content: "en_IN" },

      // ── Twitter / X Card ─────────────────────────────────────────────────────
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@clutchground" },
      { name: "twitter:creator", content: "@clutchground" },
      {
        name: "twitter:title",
        content: "ClutchGround | Clutch Ground — India's #1 Free Fire Esports Tournament Platform",
      },
      {
        name: "twitter:description",
        content:
          "India's biggest Free Fire tournament platform. Win real cash prizes, join squads, and climb the leaderboard. 10,000+ gamers. Join free at clutchground.games!",
      },
      {
        name: "twitter:image",
        content: "https://clutchground.games/logo-transparent.png",
      },
      { name: "twitter:image:alt", content: "ClutchGround Free Fire Esports Platform" },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/pwa-192x192.png", sizes: "192x192" },
      { rel: "icon", type: "image/png", href: "/favicon-48x48.png", sizes: "48x48" },
      { rel: "apple-touch-icon", href: "/pwa-192x192.png" },
      { rel: "shortcut icon", href: "/favicon.ico" },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "icon", type: "image/png", href: "/favicon-32x32.png", sizes: "32x32" },
      { rel: "icon", type: "image/png", href: "/favicon-16x16.png", sizes: "16x16" },
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: "https://clutchground.games/" },
      // Fonts
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Inter:wght@400;500;600;700&display=swap",
      },
      // DNS prefetch
      { rel: "dns-prefetch", href: "//res.cloudinary.com" },
      { rel: "dns-prefetch", href: "//fonts.googleapis.com" },
    ],
    scripts: [
      {
        // JSON-LD structured data for rich results
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": "https://clutchground.games/#website",
              url: "https://clutchground.games/",
              name: "ClutchGround",
              alternateName: ["Clutch Ground", "Clutcchground", "ClutchGround Esports"],
              description: "India's #1 Free Fire Esports Tournament Platform",
              inLanguage: "en-IN",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://clutchground.games/tournaments?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            },
            {
              "@type": "Organization",
              "@id": "https://clutchground.games/#organization",
              name: "ClutchGround",
              alternateName: ["Clutch Ground", "Clutcchground", "ClutchGround Esports"],
              url: "https://clutchground.games/",
              logo: {
                "@type": "ImageObject",
                url: "https://clutchground.games/pwa-512x512.png",
                width: 512,
                height: 512,
              },
              description:
                "ClutchGround is India's leading Free Fire and Free Fire MAX esports tournament platform where players compete for real cash prizes.",
              foundingDate: "2024",
              areaServed: "IN",
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer support",
                url: "https://clutchground.games/contact",
              },
              sameAs: [],
            },
          ],
        }),
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
        {/* Anti-flash theme script — runs before CSS */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <HeadContent />
        <link rel="manifest" href="/manifest.webmanifest" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
          // Throttled reload helper to prevent redirect loops
          function triggerChunkReload() {
            try {
              const lastReload = sessionStorage.getItem('last_chunk_reload');
              const now = Date.now();
              if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
                sessionStorage.setItem('last_chunk_reload', now.toString());
                window.location.reload();
              }
            } catch (e) {}
          }

          // Handle Vite asset preload errors
          window.addEventListener('vite:preloadError', (event) => {
            event.preventDefault();
            triggerChunkReload();
          });

          // Handle runtime module fetch errors
          window.addEventListener('error', (event) => {
            const msg = event.message || '';
            if (/Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError/i.test(msg)) {
              triggerChunkReload();
            }
          }, true);

          // Handle unhandled promise rejections (async imports)
          window.addEventListener('unhandledrejection', (event) => {
            const reason = event.reason;
            const msg = (reason && (reason.message || reason.stack || String(reason))) || '';
            if (/Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError/i.test(msg)) {
              triggerChunkReload();
            }
          });

          if ('serviceWorker' in navigator) {
            window.addEventListener('load', async () => {
              if (${import.meta.env.DEV}) {
                const reg = await navigator.serviceWorker.getRegistration('/');
                if (reg) {
                  await reg.unregister();
                  console.log('Unregistered service worker in development mode');
                }
                return;
              }

              navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(console.error);
            });
          }
        `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <GlobalErrorBoundaryWrapper>
            <SplashScreen />
            <InstallPwaDialog />
            {children}
            <ConfirmDialog />
            <div aria-live="polite" aria-atomic="true" className="sr-only" />
            <Toaster
              theme="system"
              position="top-center"
              toastOptions={{
                className:
                  "bg-card border border-primary/50 text-foreground font-display shadow-fire",
                descriptionClassName: "text-muted-foreground font-sans",
              }}
            />
          </GlobalErrorBoundaryWrapper>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  useEffect(() => {
    trackWebVitals();

    if (typeof window !== "undefined") {
      window.history.scrollRestoration = "manual";

      // 1. Lock Inspect Element shortcuts, View Source and Zoom Shortcuts
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "F12") {
          e.preventDefault();
          return;
        }

        const isCtrlOrCmd = e.ctrlKey || e.metaKey;
        const isShiftOrOpt = e.shiftKey || e.altKey;

        if (isCtrlOrCmd) {
          // Ctrl+Shift+I / J / C (inspect, console, element select)
          // Ctrl+U (view source), Ctrl+S (save page)
          if (
            (isShiftOrOpt && ["i", "j", "c"].includes(e.key?.toLowerCase())) ||
            ["u", "s"].includes(e.key?.toLowerCase())
          ) {
            e.preventDefault();
            return;
          }

          // Ctrl + zoom key shortcuts (+, -, 0)
          if (["=", "-", "0", "+"].includes(e.key)) {
            e.preventDefault();
            return;
          }
        }
      };

      // 2. Lock Right Click context menu
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
      };

      // 3. Lock Wheel Zoom (Ctrl + Wheel)
      const handleWheel = (e: WheelEvent) => {
        if (e.ctrlKey) {
          e.preventDefault();
        }
      };

      // 4. Lock Pinch Zoom Touch Events
      const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      };
      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      };

      // 5. Lock Safari Gesture Zoom
      const handleGesture = (e: Event) => {
        e.preventDefault();
      };

      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("contextmenu", handleContextMenu);
      document.addEventListener("wheel", handleWheel, { passive: false });
      document.addEventListener("touchstart", handleTouchStart, { passive: false });
      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("gesturestart", handleGesture);
      document.addEventListener("gesturechange", handleGesture);

      // Trigger prefetch of client routes on idle
      if ("requestIdleCallback" in window) {
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

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("contextmenu", handleContextMenu);
        document.removeEventListener("wheel", handleWheel);
        document.removeEventListener("touchstart", handleTouchStart);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("gesturestart", handleGesture);
        document.removeEventListener("gesturechange", handleGesture);
      };
    }
  }, []);

  return <Outlet />;
}
