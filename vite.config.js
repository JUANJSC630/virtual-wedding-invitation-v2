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
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          animations: ["framer-motion"],
          ui: ["lucide-react", "@radix-ui/react-slot"],
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
  },
  // Pre-bundling para mejor performance
  optimizeDeps: {
    include: ["react", "react-dom", "framer-motion"],
  },
});
