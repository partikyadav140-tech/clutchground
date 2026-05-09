import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tanstackStart(),
    react(),
    tailwindcss(),
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'ClutchGround Esports',
        short_name: 'ClutchGround',
        description: 'India\'s #1 Free Fire Tournament & Esports Arena',
        theme_color: '#ff6b35',
        background_color: '#0a0a0a',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
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
