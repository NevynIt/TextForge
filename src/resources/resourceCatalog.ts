import manualTestPlan from "./docs/test-plan.md?raw";
import userManual from "./docs/user-guide.md?raw";
import capabilityDevelopmentOperatingModelWhitepaper from "./docs/capability-model.md?raw";
import continuousAccreditationSecureWebAppsWhitepaper from "./docs/secure-web-apps.md?raw";
import futureFeatures from "./docs/roadmap.md?raw";
import indentedTextModelFormat from "./docs/itm-format.md?raw";
import itmGraphStyleSupport from "./docs/graph-styles.md?raw";
import itmMarkdownIntegrationUserGuide from "./docs/markdown-itm.md?raw";
import itmMindmapStyleSupport from "./docs/mindmap-styles.md?raw";
import itmTreeStyleSupport from "./docs/tree-styles.md?raw";
import luaScriptingTutorial from "./docs/lua-guide.md?raw";
import pluginDevelopment from "./docs/plugin-dev.md?raw";
import operatingModelPocRelationshipsWhitepaper from "./docs/model-links.md?raw";
import textForgeExecutiveSummary from "./docs/summary.md?raw";
import textForgeRebuildWhitepaper from "./docs/rebuild.md?raw";
import graphvizCorpusIndex from "./examples/dot-index.md?raw";
import graphvizCoreDirectedLayout from "./examples/dot-core.md?raw";
import graphvizClustersLayouts from "./examples/dot-clusters.md?raw";
import graphvizRecordsTablesI18n from "./examples/dot-labels.md?raw";
import graphvizAutomataPrograms from "./examples/dot-patterns.md?raw";
import graphvizEdgesShapesUndirected from "./examples/dot-shapes.md?raw";
import mermaidLiveSamplesTestCorpus from "./examples/mermaid-samples.md?raw";
import partyInlineExample from "./examples/party-inline.itm?raw";
import partyExample from "./examples/party.itm?raw";
import sharedPartySupplies from "./examples/party-supplies.itm?raw";
import fullItmExample from "./examples/itm/full-example.itm?raw";
import markdownHeadingsLua from "./examples/lua/md-headings.lua?raw";
import diagramsAndMath from "./examples/markdown/diagrams.md?raw";
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
  resource("docs/test-plan", "Manual Test Plan", "docs/test-plan.md", "text.markdown", manualTestPlan, "Release and smoke-test procedure."),
  resource("docs/user-guide", "User Manual", "docs/user-guide.md", "text.markdown", userManual, "Guided introduction from basic editing through graph exploration and Lua automation."),
  resource("docs/capability-model", "Capability Development Operating Model Whitepaper", "docs/capability-model.md", "text.markdown", capabilityDevelopmentOperatingModelWhitepaper, "Operating model whitepaper with embedded source diagrams and capability structure guidance."),
  resource("docs/secure-web-apps", "Continuous Accreditation Secure Web Apps Whitepaper", "docs/secure-web-apps.md", "text.markdown", continuousAccreditationSecureWebAppsWhitepaper, "Whitepaper covering continuous accreditation approaches for secure web applications."),
  resource("docs/roadmap", "Future Features", "docs/roadmap.md", "text.markdown", futureFeatures, "Deferred design notes and rationale."),
  resource("docs/itm-format", "Indented Text Model Format", "docs/itm-format.md", "text.markdown", indentedTextModelFormat, "Canonical ITM format reference for entities, relationships, directives, and views."),
  resource("docs/graph-styles", "ITM Graph Style Support", "docs/graph-styles.md", "text.markdown", itmGraphStyleSupport, "How ITM style directives flow into the graph viewers."),
  resource("docs/markdown-itm", "ITM Markdown Integration User Guide", "docs/markdown-itm.md", "text.markdown", itmMarkdownIntegrationUserGuide, "User guide for the Markdown and ITM integration workflow."),
  resource("docs/mindmap-styles", "ITM Mindmap Style Support", "docs/mindmap-styles.md", "text.markdown", itmMindmapStyleSupport, "How ITM styles map into the jsMind viewer."),
  resource("docs/tree-styles", "ITM Tree Style Support", "docs/tree-styles.md", "text.markdown", itmTreeStyleSupport, "How ITM styles render in the tree outline viewer."),
  resource("docs/lua-guide", "Lua Scripting Tutorial", "docs/lua-guide.md", "text.markdown", luaScriptingTutorial, "Lua action format, host API, and bundled modules."),
  resource("docs/plugin-dev", "TextForge Lua Extension Development", "docs/plugin-dev.md", "text.markdown", pluginDevelopment, "Guide to building packaged Lua extensions and internal plugins."),
  resource("docs/model-links", "Operating Model POC Relationships Whitepaper", "docs/model-links.md", "text.markdown", operatingModelPocRelationshipsWhitepaper, "Whitepaper describing the proof-of-concept operating model relationship structure."),
  resource("docs/summary", "TextForge Executive Summary", "docs/summary.md", "text.markdown", textForgeExecutiveSummary, "Product positioning, architecture, and operating principles."),
  resource("docs/rebuild", "TextForge Rebuild Whitepaper", "docs/rebuild.md", "text.markdown", textForgeRebuildWhitepaper, "Rebuild whitepaper covering the current architecture and implementation direction."),
  resource("docs/readme", "Project README", "README.md", "text.markdown", readmeDocument, "Repository overview, feature summary, and development commands."),
  resource("examples/dot-index", "Graphviz DOT Corpus Index", "examples/dot-index.md", "text.markdown", graphvizCorpusIndex, "Overview of the split Graphviz DOT example corpus."),
  resource("examples/dot-core", "Graphviz DOT Core Directed Layout", "examples/dot-core.md", "text.markdown", graphvizCoreDirectedLayout, "Directed Graphviz layout basics and compact topology samples."),
  resource("examples/dot-clusters", "Graphviz DOT Clusters, Subgraphs, And Layout Constraints", "examples/dot-clusters.md", "text.markdown", graphvizClustersLayouts, "Clustered Graphviz layouts, subgraphs, and rank constraints."),
  resource("examples/dot-labels", "Graphviz DOT Records, Tables, Text, And I18N", "examples/dot-labels.md", "text.markdown", graphvizRecordsTablesI18n, "Graphviz record, table, font, label, and international text samples."),
  resource("examples/dot-patterns", "Graphviz DOT Automata, Programs, And Data Structures", "examples/dot-patterns.md", "text.markdown", graphvizAutomataPrograms, "Graphviz automata, grammar, and program/data structure samples."),
  resource("examples/dot-shapes", "Graphviz DOT Edges, Shapes, Domain Models, And Undirected Graphs", "examples/dot-shapes.md", "text.markdown", graphvizEdgesShapesUndirected, "Graphviz edge variants, shape tests, domain models, and undirected samples."),
  resource("examples/mermaid-samples", "Mermaid Live Samples Test Corpus", "examples/mermaid-samples.md", "text.markdown", mermaidLiveSamplesTestCorpus, "Regression corpus of Mermaid Live Editor sample diagrams."),
  resource("examples/party-inline", "Family Birthday Party Plan Inline", "examples/party-inline.itm", "text.itm", partyInlineExample, "Inline-linked ITM sample for a family birthday party plan."),
  resource("examples/party", "Family Birthday Party Plan", "examples/party.itm", "text.itm", partyExample, "ITM sample project for a family birthday party plan."),
  resource("examples/party-supplies", "Shared Party Supplies", "examples/party-supplies.itm", "text.itm", sharedPartySupplies, "Shared ITM include data for reusable party supplies."),
  resource("examples/itm/full-example", "Full ITM Feature Example", "examples/itm/full-example.itm", "text.itm", fullItmExample, "Styles, links, attributes, and hierarchy."),
  resource("examples/lua/md-headings", "Markdown Headings Lua Action", "examples/lua/md-headings.lua", "text.lua", markdownHeadingsLua, "Example Lua action that emits ITM using the Markdown bridge."),
  resource("examples/markdown/diagrams", "Markdown Diagrams And Math", "examples/markdown/diagrams.md", "text.markdown", diagramsAndMath, "Mermaid, Graphviz, KaTeX, and code highlighting sample.")
];
