import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/favicon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        name: "AGEO",
        short_name: "AGEO",
        description: "Le carnet de bord de votre séjour à Maurice",
        lang: "fr",
        theme_color: "#1490C7",
        background_color: "#F7F7F5",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Les appels Supabase (auth/API) ne doivent jamais être servis
        // depuis le cache — seul le shell de l'app (HTML/JS/CSS/icônes)
        // en bénéficie, pour un chargement instantané une fois installée.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
});
