import { describe, expect, it } from "vitest";
import { indentedTreeToGraph, parseIndentedTree, parseItmValue } from "./itm";

describe("Indented Tree parser", () => {
  it("parses hierarchy, ids, types, tags, attributes, details, and links", () => {
    const parsed = parseIndentedTree(`&root [system] Root #important {status: draft}
  child @root
  | child details`);

    expect(parsed.nodes[0].declaredId).toBe("root");
    expect(parsed.nodes[0].type).toBe("system");
    expect(parsed.nodes[0].tags).toEqual(["important"]);
    expect(parsed.nodes[0].attributes).toEqual({ status: "draft" });
    expect(parsed.nodes[0].children[0].label).toBe("child");
    expect(parsed.nodes[0].children[0].details).toBe("child details");
    expect(parsed.diagnostics).toEqual([]);
  });

  it("projects tree hierarchy and cross-links into graph edges", () => {
    const parsed = parseIndentedTree(`&a A
  &b B @a`);

    const graph = indentedTreeToGraph(parsed.nodes);

    expect(graph.nodes.map((node) => node.id)).toEqual(["a", "b"]);
    expect(graph.edges.some((edge) => edge.type === "hierarchy")).toBe(true);
    expect(graph.edges.some((edge) => edge.type === "related-to" && edge.target === "a")).toBe(true);
    expect(graph.nodes.find((node) => node.id === "b")?.sourceRange?.line).toBe(2);
    expect(graph.edges.find((edge) => edge.type === "related-to")?.sourceRange?.line).toBe(2);
  });

  it("preserves multiline directives in model.itm without turning them into fake entities", () => {
    const parsed = parseItmValue(`%metadata
{
  title: Example
  owner: Platform
}

%style @depends_on:*
{
  stroke: "#777"
  stroke-width: 3
}

%viewpoint dependency_view
{
  pipeline:
    - select: "[Component]"
    - includeEdges: "@depends_on:*"
}

%view dependencies
{
  viewpoint: dependency_view
}

&root [Component] Root
{
  owner: platform
  lifecycle:
    - draft
    - active
}
  &child [Component] Child @depends_on:root`);

    expect(parsed.document.metadata?.values?.title).toBe("Example");
    expect((parsed.document.styles || []).length).toBe(1);
    expect((parsed.document.viewpoints || []).length).toBe(1);
    expect((parsed.document.views || []).length).toBe(1);
    expect(parsed.resolved.entities.map((entity) => entity.label)).toEqual(["Root", "Child"]);
    const explicitRelationships = parsed.resolved.relationships.filter((relationship) => relationship.relationshipKind === "explicit");
    expect(explicitRelationships).toHaveLength(1);
    expect(explicitRelationships[0]?.typeRef).toBe("depends_on");
    expect(parsed.resolved.entities.some((entity) => ["{", "pipeline:", "owner:", "lifecycle:"].includes(entity.label || ""))).toBe(false);
  });
});
