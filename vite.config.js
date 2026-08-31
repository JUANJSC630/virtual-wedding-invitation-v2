import react from "@vitejs/plugin-react";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
    // Una sola copia de React en el grafo. Sin esto, react-konva arrastra su
    // propio React por react-reconciler y salta "Invalid hook call".
    dedupe: ["react", "react-dom"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          animations: ["framer-motion"],
          ui: ["lucide-react", "@radix-ui/react-slot"],
          canvas: ["konva", "react-konva"],
        },
      },
    },
    // Optimizar assets
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    sourcemap: false,
    minify: "esbuild",
  },
  // Optimizar desarrollo
  server: {
    host: true,
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:3002",
        changeOrigin: true,
      },
    },
  },
  // Pre-bundling para mejor performance
  optimizeDeps: {
    include: ["react", "react-dom", "framer-motion", "konva", "react-konva"],
  },
});
