import { createFileRoute, Outlet, useRouter } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const SpeedDial = lazy(() => import("@/components/SpeedDial").then(module => ({ default: module.SpeedDial })));

// Fast loading skeleton
const PageLoadingSkeleton = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export const Route = createFileRoute("/_app")({
  component: () => {
    const router = useRouter();

    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 pt-16 lg:pt-20 pb-40 lg:pb-0">
          <Suspense fallback={<PageLoadingSkeleton />}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={router.state.location.pathname}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="min-h-[60vh]"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </main>
        <Footer />
        <Suspense fallback={null}>
          <SpeedDial />
        </Suspense>
      </div>
    );
  },
});
