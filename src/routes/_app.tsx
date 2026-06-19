import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { Suspense, useEffect, useLayoutEffect, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MyTeamFab } from "@/components/MyTeamFab";

import { getSiteSettings } from "../api";

const PageSpinner = () => (
  <div className="h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export const Route = createFileRoute("/_app")({
  loader: async () => {
    try {
      return await getSiteSettings();
    } catch {
      return {};
    }
  },
  component: () => {
    const settings = Route.useLoaderData() as Record<string, string>;
    const routerState = useRouterState();
    const pathname = routerState.location.pathname;
    const cleanPath = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
    const scrollRef = useRef<HTMLElement>(null);

    const isAuthRoute = ["/login", "/signup"].includes(cleanPath);

    const isChatPage =
      cleanPath.startsWith("/support/") ||
      cleanPath.startsWith("/admin/tickets/") ||
      cleanPath === "/chat";

    const announcement = settings?.announcement;
    const isMaintenance = settings?.maintenance_mode === "true";

    useLayoutEffect(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = 0;
    }, [pathname]);

    useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      const raf1 = requestAnimationFrame(() => {
        el.scrollTop = 0;
        const raf2 = requestAnimationFrame(() => {
          el.scrollTop = 0;
        });
        return () => cancelAnimationFrame(raf2);
      });
      return () => cancelAnimationFrame(raf1);
    }, [pathname]);

    return (
      <div className="h-[100dvh] flex flex-col bg-background text-foreground overflow-hidden">
        {announcement && !isAuthRoute && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-500 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 relative z-50">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping shrink-0" />
            <span className="text-center">{announcement}</span>
          </div>
        )}

        {isMaintenance && !isAuthRoute && (
          <div className="bg-red-500/10 border-b border-red-500/20 text-red-500 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 relative z-50 animate-pulse">
            <span>⚠️</span>
            <span className="text-center">
              System Maintenance: Some features may be temporarily offline.
            </span>
          </div>
        )}

        <main
          id="app-scroll-container"
          ref={scrollRef}
          className={[
            "flex-1 overflow-x-hidden hide-scrollbar relative",
            isChatPage ? "h-full flex flex-col overflow-hidden" : "overflow-y-auto",
            !isAuthRoute
              ? isChatPage
                ? "lg:pt-16"
                : "pt-[60px]"
              : "",
            !isAuthRoute && !isChatPage
              ? "pb-[calc(80px+env(safe-area-inset-bottom,0px))] lg:pb-0"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {!isAuthRoute && <Navbar />}

          <div
            className={[
              "mx-auto w-full",
              !isAuthRoute ? "max-w-[480px] lg:max-w-5xl" : "",
              isChatPage ? "h-full flex flex-col overflow-hidden" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className={isChatPage ? "h-full flex flex-col" : "min-h-full flex flex-col"}>
              <Suspense fallback={<PageSpinner />}>
                <Outlet />
              </Suspense>
              {!isAuthRoute && !isChatPage && <Footer />}
            </div>
          </div>
        </main>

        {!isAuthRoute && <MyTeamFab />}
      </div>
    );
  },
});
