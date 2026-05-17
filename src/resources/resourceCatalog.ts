import manualTestPlan from "./docs/manual-test-plan.md?raw";
import futureFeatures from "./docs/future-features.md?raw";
import luaScriptingTutorial from "./docs/lua-scripting-tutorial.md?raw";
import fullIttExample from "./examples/itt/full-feature-example.itt?raw";
import markdownHeadingsLua from "./examples/lua/markdown-headings-to-itt.lua?raw";
import diagramsAndMath from "./examples/markdown/diagrams-and-math.md?raw";

export interface TextForgeResource {
  id: string;
  title: string;
  path: string;
  languageId: string;
  text: string;
  description: string;
}

export const textForgeResources: TextForgeResource[] = [
  {
    id: "docs/manual-test-plan",
    title: "Manual Test Plan",
    path: "docs/manual-test-plan.md",
    languageId: "text.markdown",
    text: manualTestPlan,
    description: "Release and smoke-test procedure."
  },
  {
    id: "docs/future-features",
    title: "Future Features",
    path: "docs/future-features.md",
    languageId: "text.markdown",
    text: futureFeatures,
    description: "Deferred design notes and rationale."
  },
  {
    id: "docs/lua-scripting-tutorial",
    title: "Lua Scripting Tutorial",
    path: "docs/lua-scripting-tutorial.md",
    languageId: "text.markdown",
    text: luaScriptingTutorial,
    description: "Lua action format, host API, and bundled modules."
  },
  {
    id: "examples/itt/full-feature-example",
    title: "Full ITT Feature Example",
    path: "examples/itt/full-feature-example.itt",
    languageId: "text.indented-tree",
    text: fullIttExample,
    description: "Styles, links, attributes, and hierarchy."
  },
  {
    id: "examples/lua/markdown-headings-to-itt",
    title: "Markdown Headings Lua Action",
    path: "examples/lua/markdown-headings-to-itt.lua",
    languageId: "text.lua",
    text: markdownHeadingsLua,
    description: "Example Lua action using the Markdown bridge."
  },
  {
    id: "examples/markdown/diagrams-and-math",
    title: "Markdown Diagrams And Math",
    path: "examples/markdown/diagrams-and-math.md",
    languageId: "text.markdown",
    text: diagramsAndMath,
    description: "Mermaid, Graphviz, KaTeX, and code highlighting sample."
  }
];
