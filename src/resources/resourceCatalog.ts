import readMeFirst from "./docs/start-here/read-me-first.md?raw";
import manualTestPlan from "./docs/plans/test-plan.md?raw";
import userManual from "./docs/guides/user-guide.md?raw";
import capabilityDevelopmentOperatingModelWhitepaper from "./docs/papers/capability-model.md?raw";
import continuousAccreditationSecureWebAppsWhitepaper from "./docs/papers/secure-web-apps.md?raw";
import futureFeatures from "./docs/plans/roadmap.md?raw";
import indentedTextModelFormat from "./docs/specs/itm-format.md?raw";
import itmGraphStyleSupport from "./docs/specs/graph-styles.md?raw";
import itmMarkdownIntegrationUserGuide from "./docs/guides/markdown-itm.md?raw";
import itmMindmapStyleSupport from "./docs/specs/mindmap-styles.md?raw";
import itmTreeStyleSupport from "./docs/specs/tree-styles.md?raw";
import luaScriptingTutorial from "./docs/guides/lua-guide.md?raw";
import pluginDevelopment from "./docs/guides/plugin-dev.md?raw";
import operatingModelPocRelationshipsWhitepaper from "./docs/papers/model-links.md?raw";
import textForgeExecutiveSummary from "./docs/papers/summary.md?raw";
import textForgeRebuildWhitepaper from "./docs/papers/rebuild.md?raw";
import graphvizCorpusIndex from "./examples/diagrams/dot-index.md?raw";
import graphvizCoreDirectedLayout from "./examples/diagrams/dot-core.md?raw";
import graphvizClustersLayouts from "./examples/diagrams/dot-clusters.md?raw";
import graphvizRecordsTablesI18n from "./examples/diagrams/dot-labels.md?raw";
import graphvizAutomataPrograms from "./examples/diagrams/dot-patterns.md?raw";
import graphvizEdgesShapesUndirected from "./examples/diagrams/dot-shapes.md?raw";
import mermaidLiveSamplesTestCorpus from "./examples/diagrams/mermaid-samples.md?raw";
import partyInlineExample from "./examples/itm/party-inline.itm?raw";
import partyExample from "./examples/itm/party.itm?raw";
import sharedPartySupplies from "./examples/itm/party-supplies.itm?raw";
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
  resource("docs/start-here/read-me-first", "Read Me First", "docs/start-here/read-me-first.md", "text.markdown", readMeFirst, "Quick map of the bundled resource set."),
  resource("docs/start-here/project-readme", "Project README", "docs/start-here/project-readme.md", "text.markdown", readmeDocument, "Repository overview, feature summary, and development commands."),
  resource("docs/plans/test-plan", "Manual Test Plan", "docs/plans/test-plan.md", "text.markdown", manualTestPlan, "Release and smoke-test procedure."),
  resource("docs/guides/user-guide", "User Manual", "docs/guides/user-guide.md", "text.markdown", userManual, "Guided introduction from basic editing through graph exploration and Lua automation."),
  resource("docs/papers/capability-model", "Capability Development Operating Model Whitepaper", "docs/papers/capability-model.md", "text.markdown", capabilityDevelopmentOperatingModelWhitepaper, "Operating model whitepaper with embedded source diagrams and capability structure guidance."),
  resource("docs/papers/secure-web-apps", "Continuous Accreditation Secure Web Apps Whitepaper", "docs/papers/secure-web-apps.md", "text.markdown", continuousAccreditationSecureWebAppsWhitepaper, "Whitepaper covering continuous accreditation approaches for secure web applications."),
  resource("docs/plans/roadmap", "Future Features", "docs/plans/roadmap.md", "text.markdown", futureFeatures, "Deferred design notes and rationale."),
  resource("docs/specs/itm-format", "Indented Text Model Format", "docs/specs/itm-format.md", "text.markdown", indentedTextModelFormat, "Canonical ITM format reference for entities, relationships, directives, and views."),
  resource("docs/specs/graph-styles", "ITM Graph Style Support", "docs/specs/graph-styles.md", "text.markdown", itmGraphStyleSupport, "How ITM style directives flow into the graph viewers."),
  resource("docs/guides/markdown-itm", "ITM Markdown Integration User Guide", "docs/guides/markdown-itm.md", "text.markdown", itmMarkdownIntegrationUserGuide, "User guide for the Markdown and ITM integration workflow."),
  resource("docs/specs/mindmap-styles", "ITM Mindmap Style Support", "docs/specs/mindmap-styles.md", "text.markdown", itmMindmapStyleSupport, "How ITM styles map into the jsMind viewer."),
  resource("docs/specs/tree-styles", "ITM Tree Style Support", "docs/specs/tree-styles.md", "text.markdown", itmTreeStyleSupport, "How ITM styles render in the tree outline viewer."),
  resource("docs/guides/lua-guide", "Lua Scripting Tutorial", "docs/guides/lua-guide.md", "text.markdown", luaScriptingTutorial, "Lua action format, host API, and bundled modules."),
  resource("docs/guides/plugin-dev", "TextForge Lua Extension Development", "docs/guides/plugin-dev.md", "text.markdown", pluginDevelopment, "Guide to building packaged Lua extensions and internal plugins."),
  resource("docs/papers/model-links", "Operating Model POC Relationships Whitepaper", "docs/papers/model-links.md", "text.markdown", operatingModelPocRelationshipsWhitepaper, "Whitepaper describing the proof-of-concept operating model relationship structure."),
  resource("docs/papers/summary", "TextForge Executive Summary", "docs/papers/summary.md", "text.markdown", textForgeExecutiveSummary, "Product positioning, architecture, and operating principles."),
  resource("docs/papers/rebuild", "TextForge Rebuild Whitepaper", "docs/papers/rebuild.md", "text.markdown", textForgeRebuildWhitepaper, "Rebuild whitepaper covering the current architecture and implementation direction."),
  resource("examples/diagrams/dot-index", "Graphviz DOT Corpus Index", "examples/diagrams/dot-index.md", "text.markdown", graphvizCorpusIndex, "Overview of the split Graphviz DOT example corpus."),
  resource("examples/diagrams/dot-core", "Graphviz DOT Core Directed Layout", "examples/diagrams/dot-core.md", "text.markdown", graphvizCoreDirectedLayout, "Directed Graphviz layout basics and compact topology samples."),
  resource("examples/diagrams/dot-clusters", "Graphviz DOT Clusters, Subgraphs, And Layout Constraints", "examples/diagrams/dot-clusters.md", "text.markdown", graphvizClustersLayouts, "Clustered Graphviz layouts, subgraphs, and rank constraints."),
  resource("examples/diagrams/dot-labels", "Graphviz DOT Records, Tables, Text, And I18N", "examples/diagrams/dot-labels.md", "text.markdown", graphvizRecordsTablesI18n, "Graphviz record, table, font, label, and international text samples."),
  resource("examples/diagrams/dot-patterns", "Graphviz DOT Automata, Programs, And Data Structures", "examples/diagrams/dot-patterns.md", "text.markdown", graphvizAutomataPrograms, "Graphviz automata, grammar, and program/data structure samples."),
  resource("examples/diagrams/dot-shapes", "Graphviz DOT Edges, Shapes, Domain Models, And Undirected Graphs", "examples/diagrams/dot-shapes.md", "text.markdown", graphvizEdgesShapesUndirected, "Graphviz edge variants, shape tests, domain models, and undirected samples."),
  resource("examples/diagrams/mermaid-samples", "Mermaid Live Samples Test Corpus", "examples/diagrams/mermaid-samples.md", "text.markdown", mermaidLiveSamplesTestCorpus, "Regression corpus of Mermaid Live Editor sample diagrams."),
  resource("examples/itm/party-inline", "Family Birthday Party Plan Inline", "examples/itm/party-inline.itm", "text.itm", partyInlineExample, "Inline-linked ITM sample for a family birthday party plan."),
  resource("examples/itm/party", "Family Birthday Party Plan", "examples/itm/party.itm", "text.itm", partyExample, "ITM sample project for a family birthday party plan."),
  resource("examples/itm/party-supplies", "Shared Party Supplies", "examples/itm/party-supplies.itm", "text.itm", sharedPartySupplies, "Shared ITM include data for reusable party supplies."),
  resource("examples/itm/full-example", "Full ITM Feature Example", "examples/itm/full-example.itm", "text.itm", fullItmExample, "Styles, links, attributes, and hierarchy."),
  resource("examples/lua/md-headings", "Markdown Headings Lua Action", "examples/lua/md-headings.lua", "text.lua", markdownHeadingsLua, "Example Lua action that emits ITM using the Markdown bridge."),
  resource("examples/markdown/diagrams", "Markdown Diagrams And Math", "examples/markdown/diagrams.md", "text.markdown", diagramsAndMath, "Mermaid, Graphviz, KaTeX, and code highlighting sample.")
];
