// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

const initializeMock = vi.fn();
const renderMock = vi.fn<(id: string, source: string, container?: Element) => Promise<{ svg: string }>>();

vi.mock("mermaid", () => ({
  default: {
    initialize: initializeMock,
    render: renderMock
  }
}));

describe("renderMermaidSvg", () => {
  it("renders through an off-screen host that still participates in layout", async () => {
    renderMock.mockImplementation(async (_id, _source, container) => {
      expect(container).toBeInstanceOf(HTMLDivElement);
      expect(container?.isConnected).toBe(true);
      expect(container?.getAttribute("aria-hidden")).toBe("true");
      expect((container as HTMLElement).style.left).toBe("-10000px");
      expect((container as HTMLElement).style.top).toBe("-10000px");
      expect((container as HTMLElement).style.width).toBe("");
      expect((container as HTMLElement).style.height).toBe("");
      expect((container as HTMLElement).style.visibility).toBe("hidden");
      expect((container as HTMLElement).style.pointerEvents).toBe("none");
      return { svg: "<svg></svg>" };
    });

    const { renderMermaidSvg } = await import("./renderMermaidSvg");

    const svg = await renderMermaidSvg("test-id", "gantt\n  title Demo");

    expect(svg).toBe("<svg></svg>");
    expect(initializeMock).toHaveBeenCalledWith({ startOnLoad: false, securityLevel: "strict" });
    expect(renderMock).toHaveBeenCalledTimes(1);
    expect(document.body.childElementCount).toBe(0);
  });
});