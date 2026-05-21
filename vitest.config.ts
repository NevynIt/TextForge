import { defineConfig } from "vitest/config";

const itmEntry = new URL("./external/ITM/src/index.ts", import.meta.url).pathname;
const itmNodeEntry = new URL("./external/ITM/src/node.ts", import.meta.url).pathname;

export default defineConfig({
  resolve: {
    alias: {
      "@textforge/itm": itmEntry,
      "@textforge/itm/node": itmNodeEntry
    }
  },
  test: {
    globals: true,
    environment: "node",
    exclude: ["external/**", "node_modules/**", "dist/**", "coverage/**"]
  }
});
