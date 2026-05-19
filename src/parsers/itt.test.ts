import { describe, expect, it } from "vitest";
import { indentedTreeToGraph, parseIndentedTree } from "./itt";

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
});
