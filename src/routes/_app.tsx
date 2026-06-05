import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Suspense, useEffect, useLayoutEffect, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { LiveTutorial } from "@/components/LiveTutorial";

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
    const path = routerState.location.pathname;
    const cleanPath = path === "/" ? "/" : path.replace(/\/$/, "");
    const scrollRef = useRef<HTMLElement>(null);

    const isAuthRoute = ["/login", "/signup"].includes(cleanPath);

    const isChatPage  = cleanPath.startsWith("/support/") || cleanPath.startsWith("/admin/tickets/") || cleanPath === "/chat";

    const announcement = settings?.announcement;
    const isMaintenance = settings?.maintenance_mode === "true";

    // Scroll to top on route change
    // useLayoutEffect: immediate reset before paint
    useLayoutEffect(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = 0;
    }, [path]);

    // useEffect + double rAF: runs after framer-motion exit animation,
    // ensuring the new page always starts at the very top
    useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      // First frame: reset immediately after paint
      const raf1 = requestAnimationFrame(() => {
        el.scrollTop = 0;
        // Second frame: reset again after any animation layout shifts
        const raf2 = requestAnimationFrame(() => {
          el.scrollTop = 0;
        });
        return () => cancelAnimationFrame(raf2);
      });
      return () => cancelAnimationFrame(raf1);
    }, [path]);

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
            <span className="text-center">System Maintenance: Some features may be temporarily offline.</span>
          </div>
        )}

        <main
          id="app-scroll-container"
          ref={scrollRef}
          className={[
            "flex-1 overflow-x-hidden hide-scrollbar relative",
            isChatPage ? "h-full flex flex-col overflow-hidden" : "overflow-y-auto",
            /* Mobile: pt-20 on ALL non-auth & non-chat pages | Desktop: pt-16 on ALL non-auth pages */
            !isAuthRoute
              ? isChatPage
                ? "lg:pt-16"            /* chat pages: header hidden on mobile, shown on desktop */
                : "pt-20 lg:pt-16"      /* standard pages: header shown on mobile and desktop */
              : "",
            /* Mobile: bottom-nav padding | Desktop: no bottom nav */
            !isAuthRoute && !isChatPage ? "pb-[60px] lg:pb-0" : "",
          ].filter(Boolean).join(" ")}
        >
          {!isAuthRoute && <Navbar />}

          {/*
            Container width:
            • Mobile  → max-w-[480px] (unchanged — keeps the native app feel)
            • Desktop → max-w-5xl (gives room to breathe on wide screens)
          */}
          <div className={[
            "mx-auto w-full",
            !isAuthRoute ? "max-w-[480px] lg:max-w-5xl" : "",
            isChatPage ? "h-full flex flex-col overflow-hidden" : "",
          ].filter(Boolean).join(" ")}>
            <Suspense fallback={<PageSpinner />}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={path}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  onAnimationComplete={(definition) => {
                    // When the enter animation completes, ensure scroll is at top
                    if (definition === "animate" && scrollRef.current) {
                      scrollRef.current.scrollTop = 0;
                    }
                  }}
                  className={isChatPage ? "h-full flex flex-col" : "min-h-full"}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </div>
        </main>

        {/* Live Interactive Tutorial */}
        <LiveTutorial />
      </div>
    );
  },
});
