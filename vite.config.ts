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
  base: "./",
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
    target: "es2022",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/codemirror") || id.includes("node_modules/@codemirror")) {
            return "codemirror";
          }
          if (id.includes("node_modules/mermaid")) {
            return "mermaid";
          }
          if (id.includes("node_modules/cytoscape") || id.includes("node_modules/sigma") || id.includes("node_modules/graphology")) {
            return "graph-viewers";
          }
        }
      }
    }
  }
});
