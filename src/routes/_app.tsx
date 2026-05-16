import { createFileRoute, Outlet, useRouter } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Suspense, useEffect, useRef, useState } from "react";
import { Navbar } from "@/components/Navbar";

const PageSpinner = () => (
  <div className="h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export const Route = createFileRoute("/_app")({
  component: () => {
    const router = useRouter();
    const path = router.state.location.pathname;
    const scrollRef = useRef<HTMLElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const isAuthRoute = ["/login", "/signup"].includes(path);
    const isMainTab   = ["", "/", "/tournaments", "/matches", "/leaderboard", "/profile", "/wallet"].includes(path);
    const isChatPage  = path.startsWith("/support/") || path.startsWith("/admin/tickets/") || path === "/chat";

    // Scroll to top on route change
    useEffect(() => {
      scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
    }, [path]);

    return (
      <div className="h-[100dvh] flex flex-col bg-background text-foreground overflow-hidden">
        {!isAuthRoute && <Navbar />}

        <main
          id="app-scroll-container"
          ref={scrollRef}
          className={[
            "flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar relative",
            /* Mobile: pt-16 only on main tabs | Desktop (lg+): pt-16 on ALL non-auth pages */
            !isAuthRoute && !isChatPage
              ? isMainTab
                ? "pt-16"               /* mobile main-tab pages already have header */
                : "lg:pt-16"            /* sub-pages: header hidden on mobile, shown on desktop */
              : "",
            /* Mobile: bottom-nav padding | Desktop: no bottom nav */
            !isAuthRoute && !isChatPage ? "pb-[60px] lg:pb-0" : "",
            isChatPage ? "overflow-hidden" : "",
          ].filter(Boolean).join(" ")}
        >
          {/*
            Container width:
            • Mobile  → max-w-[480px] (unchanged — keeps the native app feel)
            • Desktop → max-w-5xl (gives room to breathe on wide screens)
          */}
          <div className={[
            "mx-auto w-full",
            !isAuthRoute ? "max-w-[480px] lg:max-w-5xl" : "",
          ].filter(Boolean).join(" ")}>
            <Suspense fallback={<PageSpinner />}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={path}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className={isChatPage ? "h-full flex flex-col" : "min-h-full"}
                >
                  {mounted ? <Outlet /> : <PageSpinner />}
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </div>
        </main>
      </div>
    );
  },
});
