import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

const itmEntry = new URL("./external/ITM/src/index.ts", import.meta.url).pathname;
const itmNodeEntry = new URL("./external/ITM/src/node.ts", import.meta.url).pathname;

export default defineConfig({
  publicDir: "public",
  plugins: [preact()],
  resolve: {
    alias: {
      "@textforge/itm": itmEntry,
      "@textforge/itm/node": itmNodeEntry
    }
  },
  define: {
    "process.env.FENGARICONF": "undefined"
  },
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
