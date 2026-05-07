import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SpeedDial } from "@/components/SpeedDial";

export const Route = createFileRoute("/_app")({
  component: () => (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pt-16 lg:pt-20 pb-16 lg:pb-0">
        <Outlet />
      </main>
      <Footer />
      <SpeedDial />
    </div>
  ),
});
