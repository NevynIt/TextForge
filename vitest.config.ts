import { defineConfig } from "vitest/config";

const itmEntry = new URL("./external/ITM/src/index.ts", import.meta.url).pathname;
const itmNodeEntry = new URL("./external/ITM/src/node.ts", import.meta.url).pathname;
const reactPackageAliases = [
  { find: "react-dom/client", replacement: new URL("./node_modules/react-dom/client.js", import.meta.url).pathname },
  { find: "react-dom/test-utils", replacement: new URL("./node_modules/react-dom/test-utils.js", import.meta.url).pathname },
  { find: "react/jsx-runtime", replacement: new URL("./node_modules/react/jsx-runtime.js", import.meta.url).pathname },
  { find: "react/jsx-dev-runtime", replacement: new URL("./node_modules/react/jsx-dev-runtime.js", import.meta.url).pathname },
  { find: "react-dom", replacement: new URL("./node_modules/react-dom/index.js", import.meta.url).pathname },
  { find: "react", replacement: new URL("./node_modules/react/index.js", import.meta.url).pathname }
];

export default defineConfig({
  resolve: {
    alias: [
      ...reactPackageAliases,
      { find: "@textforge/itm", replacement: itmEntry },
      { find: "@textforge/itm/node", replacement: itmNodeEntry }
    ]
  },
  test: {
    globals: true,
    environment: "node",
    exclude: ["external/**", "node_modules/**", "dist/**", "coverage/**"]
  }
});
