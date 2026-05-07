import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";

// TanStack Router Vite Plugin Configuration for proper Link component bundling
export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    tanstackStart(),
    react(),
    tailwindcss(),
    tsconfigPaths()
  ],
  preview: {
    host: true,
    port: parseInt(process.env.PORT || "4173"),
    allowedHosts: true,
  },
  server: {
    host: true,
    allowedHosts: true,
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
