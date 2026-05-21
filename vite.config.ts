import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

const itmEntry = new URL("./external/ITM/src/index.ts", import.meta.url).pathname;
const itmNodeEntry = new URL("./external/ITM/src/node.ts", import.meta.url).pathname;

export default defineConfig({
  base: "./",
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
