import manualTestPlan from "./docs/manual-test-plan.md?raw";
import userManual from "./docs/user-manual.md?raw";
import futureFeatures from "./docs/future-features.md?raw";
import indentedTextModelFormat from "./docs/indented_text_model_format.md?raw";
import indentedTreeTextFormat from "./docs/indented_tree_text_format.md?raw";
import itmGraphStyleSupport from "./docs/itm-graph-style-support.md?raw";
import itmMindmapStyleSupport from "./docs/itm-mindmap-style-support.md?raw";
import itmTreeStyleSupport from "./docs/itm-tree-style-support.md?raw";
import luaScriptingTutorial from "./docs/lua-scripting-tutorial.md?raw";
import pluginDevelopment from "./docs/plugin-development.md?raw";
import textForgeExecutiveSummary from "./docs/textforge_executive_summary.md?raw";
import graphvizCorpusIndex from "./examples/graphviz-dot-00-corpus-index.md?raw";
import graphvizCoreDirectedLayout from "./examples/graphviz-dot-01-core-directed-layout.md?raw";
import graphvizClustersLayouts from "./examples/graphviz-dot-02-clusters-subgraphs-layouts.md?raw";
import graphvizRecordsTablesI18n from "./examples/graphviz-dot-03-records-tables-text-i18n.md?raw";
import graphvizAutomataPrograms from "./examples/graphviz-dot-04-automata-programs-data-structures.md?raw";
import graphvizEdgesShapesUndirected from "./examples/graphviz-dot-05-edges-shapes-domain-undirected.md?raw";
import mermaidLiveSamplesTestCorpus from "./examples/mermaid_live_samples_test_corpus.md?raw";
import partyInlineExample from "./examples/Party inline.itm?raw";
import partyExample from "./examples/Party.itm?raw";
import sharedPartySupplies from "./examples/shared-party-supplies.itm?raw";
import fullItmExample from "./examples/itm/full-feature-example.itm?raw";
import markdownHeadingsLua from "./examples/lua/markdown-headings-to-itm.lua?raw";
import diagramsAndMath from "./examples/markdown/diagrams-and-math.md?raw";
import readmeDocument from "../../README.md?raw";

export interface TextForgeResource {
  id: string;
  title: string;
  path: string;
  languageId: string;
  text: string;
  description: string;
}

function resource(
  id: string,
  title: string,
  path: string,
  languageId: string,
  text: string,
  description: string
): TextForgeResource {
  return { id, title, path, languageId, text, description };
}

export const textForgeResources: TextForgeResource[] = [
  resource("docs/manual-test-plan", "Manual Test Plan", "docs/manual-test-plan.md", "text.markdown", manualTestPlan, "Release and smoke-test procedure."),
  resource("docs/user-manual", "User Manual", "docs/user-manual.md", "text.markdown", userManual, "Guided introduction from basic editing through graph exploration and Lua automation."),
  resource("docs/future-features", "Future Features", "docs/future-features.md", "text.markdown", futureFeatures, "Deferred design notes and rationale."),
  resource("docs/indented-text-model-format", "Indented Text Model Format", "docs/indented_text_model_format.md", "text.markdown", indentedTextModelFormat, "Canonical ITM format reference for entities, relationships, directives, and views."),
  resource("docs/indented-tree-text-format", "Legacy Indented Tree Text Format", "docs/indented_tree_text_format.md", "text.markdown", indentedTreeTextFormat, "Earlier ITT reference retained for comparison during the ITM transition."),
  resource("docs/itm-graph-style-support", "ITM Graph Style Support", "docs/itm-graph-style-support.md", "text.markdown", itmGraphStyleSupport, "How ITM style directives flow into the graph viewers."),
  resource("docs/itm-mindmap-style-support", "ITM Mindmap Style Support", "docs/itm-mindmap-style-support.md", "text.markdown", itmMindmapStyleSupport, "How ITM styles map into the jsMind viewer."),
  resource("docs/itm-tree-style-support", "ITM Tree Style Support", "docs/itm-tree-style-support.md", "text.markdown", itmTreeStyleSupport, "How ITM styles render in the tree outline viewer."),
  resource("docs/lua-scripting-tutorial", "Lua Scripting Tutorial", "docs/lua-scripting-tutorial.md", "text.markdown", luaScriptingTutorial, "Lua action format, host API, and bundled modules."),
  resource("docs/plugin-development", "TextForge Lua Extension Development", "docs/plugin-development.md", "text.markdown", pluginDevelopment, "Guide to building packaged Lua extensions and internal plugins."),
  resource("docs/executive-summary", "TextForge Executive Summary", "docs/textforge_executive_summary.md", "text.markdown", textForgeExecutiveSummary, "Product positioning, architecture, and operating principles."),
  resource("docs/readme", "Project README", "README.md", "text.markdown", readmeDocument, "Repository overview, feature summary, and development commands."),
  resource("examples/graphviz-dot-00-corpus-index", "Graphviz DOT Corpus Index", "examples/graphviz-dot-00-corpus-index.md", "text.markdown", graphvizCorpusIndex, "Overview of the split Graphviz DOT example corpus."),
  resource("examples/graphviz-dot-01-core-directed-layout", "Graphviz DOT Core Directed Layout", "examples/graphviz-dot-01-core-directed-layout.md", "text.markdown", graphvizCoreDirectedLayout, "Directed Graphviz layout basics and compact topology samples."),
  resource("examples/graphviz-dot-02-clusters-subgraphs-layouts", "Graphviz DOT Clusters, Subgraphs, And Layout Constraints", "examples/graphviz-dot-02-clusters-subgraphs-layouts.md", "text.markdown", graphvizClustersLayouts, "Clustered Graphviz layouts, subgraphs, and rank constraints."),
  resource("examples/graphviz-dot-03-records-tables-text-i18n", "Graphviz DOT Records, Tables, Text, And I18N", "examples/graphviz-dot-03-records-tables-text-i18n.md", "text.markdown", graphvizRecordsTablesI18n, "Graphviz record, table, font, label, and international text samples."),
  resource("examples/graphviz-dot-04-automata-programs-data-structures", "Graphviz DOT Automata, Programs, And Data Structures", "examples/graphviz-dot-04-automata-programs-data-structures.md", "text.markdown", graphvizAutomataPrograms, "Graphviz automata, grammar, and program/data structure samples."),
  resource("examples/graphviz-dot-05-edges-shapes-domain-undirected", "Graphviz DOT Edges, Shapes, Domain Models, And Undirected Graphs", "examples/graphviz-dot-05-edges-shapes-domain-undirected.md", "text.markdown", graphvizEdgesShapesUndirected, "Graphviz edge variants, shape tests, domain models, and undirected samples."),
  resource("examples/mermaid-live-samples-test-corpus", "Mermaid Live Samples Test Corpus", "examples/mermaid_live_samples_test_corpus.md", "text.markdown", mermaidLiveSamplesTestCorpus, "Regression corpus of Mermaid Live Editor sample diagrams."),
  resource("examples/party-inline", "Family Birthday Party Plan Inline", "examples/Party inline.itm", "text.itm", partyInlineExample, "Inline-linked ITM sample for a family birthday party plan."),
  resource("examples/party", "Family Birthday Party Plan", "examples/Party.itm", "text.itm", partyExample, "ITM sample project for a family birthday party plan."),
  resource("examples/shared-party-supplies", "Shared Party Supplies", "examples/shared-party-supplies.itm", "text.itm", sharedPartySupplies, "Shared ITM include data for reusable party supplies."),
  resource("examples/itm/full-feature-example", "Full ITM Feature Example", "examples/itm/full-feature-example.itm", "text.itm", fullItmExample, "Styles, links, attributes, and hierarchy."),
  resource("examples/lua/markdown-headings-to-itm", "Markdown Headings Lua Action", "examples/lua/markdown-headings-to-itm.lua", "text.lua", markdownHeadingsLua, "Example Lua action that emits ITM using the Markdown bridge."),
  resource("examples/markdown/diagrams-and-math", "Markdown Diagrams And Math", "examples/markdown/diagrams-and-math.md", "text.markdown", diagramsAndMath, "Mermaid, Graphviz, KaTeX, and code highlighting sample.")
];
