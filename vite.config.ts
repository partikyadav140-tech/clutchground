import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tanstackStart({
      server: {
        // @ts-expect-error Vinxi server preset option
        preset: process.env.SERVER_PRESET || "node",
      },
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  build: {
    chunkSizeWarningLimit: 800,
    // esbuild is faster than terser and produces similar output
    minify: "esbuild",
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks(id) {
          // TanStack Start handles React & router as SSR externals — don't touch them
          if (id.includes("node_modules/framer-motion")) return "vendor-motion";
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-"))
            return "vendor-charts";
          if (id.includes("node_modules/lucide-react")) return "vendor-icons";
          if (id.includes("node_modules/@radix-ui")) return "vendor-radix";
        },
      },
    },
  },
  // esbuild drop console/debugger in production
  esbuild: {
    drop: ["console", "debugger"],
  },
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
