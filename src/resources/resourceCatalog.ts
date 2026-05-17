import manualTestPlan from "./docs/manual-test-plan.md?raw";
import futureFeatures from "./docs/future-features.md?raw";
import indentedTreeTextFormat from "./docs/indented_tree_text_format.md?raw";
import ittGraphStyleSupport from "./docs/itt-graph-style-support.md?raw";
import ittMindmapStyleSupport from "./docs/itt-mindmap-style-support.md?raw";
import ittTreeStyleSupport from "./docs/itt-tree-style-support.md?raw";
import luaScriptingTutorial from "./docs/lua-scripting-tutorial.md?raw";
import pluginDevelopment from "./docs/plugin-development.md?raw";
import graphvizCorpusIndex from "./examples/graphviz-dot-00-corpus-index.md?raw";
import graphvizCoreDirectedLayout from "./examples/graphviz-dot-01-core-directed-layout.md?raw";
import graphvizClustersLayouts from "./examples/graphviz-dot-02-clusters-subgraphs-layouts.md?raw";
import graphvizRecordsTablesI18n from "./examples/graphviz-dot-03-records-tables-text-i18n.md?raw";
import graphvizAutomataPrograms from "./examples/graphviz-dot-04-automata-programs-data-structures.md?raw";
import graphvizEdgesShapesUndirected from "./examples/graphviz-dot-05-edges-shapes-domain-undirected.md?raw";
import mermaidLiveSamplesTestCorpus from "./examples/mermaid_live_samples_test_corpus.md?raw";
import partyInlineExample from "./examples/Party inline.itt?raw";
import partyExample from "./examples/Party.itt?raw";
import sharedPartySupplies from "./examples/shared-party-supplies.itt?raw";
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
  resource("docs/future-features", "Future Features", "docs/future-features.md", "text.markdown", futureFeatures, "Deferred design notes and rationale."),
  resource("docs/indented-tree-text-format", "Indented Tree Text Format", "docs/indented_tree_text_format.md", "text.markdown", indentedTreeTextFormat, "Format reference for the indented tree syntax and extensions."),
  resource("docs/itt-graph-style-support", "ITT Graph Style Support", "docs/itt-graph-style-support.md", "text.markdown", ittGraphStyleSupport, "How ITT style directives flow into the graph viewers."),
  resource("docs/itt-mindmap-style-support", "ITT Mindmap Style Support", "docs/itt-mindmap-style-support.md", "text.markdown", ittMindmapStyleSupport, "How ITT styles map into the jsMind viewer."),
  resource("docs/itt-tree-style-support", "ITT Tree Style Support", "docs/itt-tree-style-support.md", "text.markdown", ittTreeStyleSupport, "How ITT styles render in the tree outline viewer."),
  resource("docs/lua-scripting-tutorial", "Lua Scripting Tutorial", "docs/lua-scripting-tutorial.md", "text.markdown", luaScriptingTutorial, "Lua action format, host API, and bundled modules."),
  resource("docs/plugin-development", "TextForge Lua Extension Development", "docs/plugin-development.md", "text.markdown", pluginDevelopment, "Guide to building packaged Lua extensions and internal plugins."),
  resource("examples/graphviz-dot-00-corpus-index", "Graphviz DOT Corpus Index", "examples/graphviz-dot-00-corpus-index.md", "text.markdown", graphvizCorpusIndex, "Overview of the split Graphviz DOT example corpus."),
  resource("examples/graphviz-dot-01-core-directed-layout", "Graphviz DOT Core Directed Layout", "examples/graphviz-dot-01-core-directed-layout.md", "text.markdown", graphvizCoreDirectedLayout, "Directed Graphviz layout basics and compact topology samples."),
  resource("examples/graphviz-dot-02-clusters-subgraphs-layouts", "Graphviz DOT Clusters, Subgraphs, And Layout Constraints", "examples/graphviz-dot-02-clusters-subgraphs-layouts.md", "text.markdown", graphvizClustersLayouts, "Clustered Graphviz layouts, subgraphs, and rank constraints."),
  resource("examples/graphviz-dot-03-records-tables-text-i18n", "Graphviz DOT Records, Tables, Text, And I18N", "examples/graphviz-dot-03-records-tables-text-i18n.md", "text.markdown", graphvizRecordsTablesI18n, "Graphviz record, table, font, label, and international text samples."),
  resource("examples/graphviz-dot-04-automata-programs-data-structures", "Graphviz DOT Automata, Programs, And Data Structures", "examples/graphviz-dot-04-automata-programs-data-structures.md", "text.markdown", graphvizAutomataPrograms, "Graphviz automata, grammar, and program/data structure samples."),
  resource("examples/graphviz-dot-05-edges-shapes-domain-undirected", "Graphviz DOT Edges, Shapes, Domain Models, And Undirected Graphs", "examples/graphviz-dot-05-edges-shapes-domain-undirected.md", "text.markdown", graphvizEdgesShapesUndirected, "Graphviz edge variants, shape tests, domain models, and undirected samples."),
  resource("examples/mermaid-live-samples-test-corpus", "Mermaid Live Samples Test Corpus", "examples/mermaid_live_samples_test_corpus.md", "text.markdown", mermaidLiveSamplesTestCorpus, "Regression corpus of Mermaid Live Editor sample diagrams."),
  resource("examples/party-inline", "Family Birthday Party Plan Inline", "examples/Party inline.itt", "text.indented-tree", partyInlineExample, "Inline-linked ITT sample for a family birthday party plan."),
  resource("examples/party", "Family Birthday Party Plan", "examples/Party.itt", "text.indented-tree", partyExample, "ITT sample project for a family birthday party plan."),
  resource("examples/shared-party-supplies", "Shared Party Supplies", "examples/shared-party-supplies.itt", "text.indented-tree", sharedPartySupplies, "Shared ITT include data for reusable party supplies."),
  resource("examples/itt/full-feature-example", "Full ITT Feature Example", "examples/itt/full-feature-example.itt", "text.indented-tree", fullIttExample, "Styles, links, attributes, and hierarchy."),
  resource("examples/lua/markdown-headings-to-itt", "Markdown Headings Lua Action", "examples/lua/markdown-headings-to-itt.lua", "text.lua", markdownHeadingsLua, "Example Lua action using the Markdown bridge."),
  resource("examples/markdown/diagrams-and-math", "Markdown Diagrams And Math", "examples/markdown/diagrams-and-math.md", "text.markdown", diagramsAndMath, "Mermaid, Graphviz, KaTeX, and code highlighting sample.")
];
