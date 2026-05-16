import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  publicDir: "public",
  plugins: [preact()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
    sourcemap: true,
    cssCodeSplit: false,
    modulePreload: false,
    lib: {
      entry: "src/main.tsx",
      name: "TextForge",
      formats: ["iife"],
      fileName: () => "textforge.js"
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "textforge.css";
          }
          return "assets/[name]-[hash][extname]";
        }
      }
    }
  }
});
