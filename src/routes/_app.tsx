import { createFileRoute, Outlet } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const SpeedDial = lazy(() => import("@/components/SpeedDial").then(module => ({ default: module.SpeedDial })));

export const Route = createFileRoute("/_app")({
  component: () => (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pt-16 lg:pt-20 pb-40 lg:pb-0">
        <Outlet />
      </main>
      <Footer />
      <Suspense fallback={null}>
        <SpeedDial />
      </Suspense>
    </div>
  ),
});
