import { createFileRoute, Outlet, useRouter } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense } from "react";
import { Navbar } from "@/components/Navbar";

// Fast loading skeleton
const PageLoadingSkeleton = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export const Route = createFileRoute("/_app")({
  component: () => {
    const router = useRouter();

    const currentPath = router.state.location.pathname;
    const isMainTab = ["", "/", "/tournaments", "/matches", "/leaderboard", "/profile", "/wallet"].includes(currentPath);
    const isAuthRoute = ["/login", "/signup"].includes(currentPath);

    return (
      <div className="h-[100dvh] overflow-hidden flex flex-col bg-background text-foreground relative">
        {!isAuthRoute && <Navbar />}
        
        <main id="app-scroll-container" className={`flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar ${!isAuthRoute ? 'pb-20' : ''} relative ${isMainTab && !isAuthRoute ? 'pt-16' : 'pt-0'}`}>
          <Suspense fallback={<PageLoadingSkeleton />}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={router.state.location.pathname}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="min-h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </main>
      </div>
    );
  },
});
