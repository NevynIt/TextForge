import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

const itmEntry = new URL("./external/ITM/src/index.ts", import.meta.url).pathname;
const itmNodeEntry = new URL("./external/ITM/src/node.ts", import.meta.url).pathname;
const reactPackageAliases = {
  react: new URL("./node_modules/react/index.js", import.meta.url).pathname,
  "react-dom": new URL("./node_modules/react-dom/index.js", import.meta.url).pathname,
  "react-dom/client": new URL("./node_modules/react-dom/client.js", import.meta.url).pathname,
  "react-dom/test-utils": new URL("./node_modules/react-dom/test-utils.js", import.meta.url).pathname,
  "react/jsx-runtime": new URL("./node_modules/react/jsx-runtime.js", import.meta.url).pathname,
  "react/jsx-dev-runtime": new URL("./node_modules/react/jsx-dev-runtime.js", import.meta.url).pathname
};

export default defineConfig({
  publicDir: "public",
  plugins: [preact()],
  resolve: {
    alias: {
      ...reactPackageAliases,
      "@textforge/itm": itmEntry,
      "@textforge/itm/node": itmNodeEntry
    }
  },
  define: {
    "process.env.NODE_ENV": '"production"',
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
