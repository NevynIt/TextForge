// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import { App } from "./App";
import { shouldSuppressSvgSelection, ViewerContent, zoomStandaloneSvgViewAtPoint } from "../components/viewers";
import type { ViewerResult } from "../domain/types";

const svgNamespace = "ht" + "tp://www.w3.org/2000/svg";

function renderHtmlViewer(html: string, toolbarAction?: { revision: number; action: string }) {
  const result: ViewerResult = {
    kind: "html",
    title: "Markdown",
    html
  };

  return render(
    <ViewerContent
      result={result}
      query=""
      zoom={1}
      settings={{}}
      toolbarAction={toolbarAction}
    />
  );
}

function renderSvgViewer() {
  const result: ViewerResult = {
    kind: "svg",
    title: "SVG Viewer",
    svg: [
      `<svg xmlns="${svgNamespace}" width="200" height="120" viewBox="0 0 200 120">`,
      '  <rect x="10" y="10" width="80" height="40" fill="#ddd" />',
      '  <text x="20" y="35">Selectable label</text>',
      '</svg>'
    ].join("")
  };

  return render(
    <ViewerContent
      result={result}
      query=""
      zoom={1}
      settings={{}}
    />
  );
}

describe("App smoke", () => {
  it("renders the workbench shell", async () => {
    const { container } = render(<App />);

    await waitFor(() => expect(screen.getByText("Ready.")).toBeTruthy());
    expect(screen.getByText("TextForge")).toBeTruthy();
    expect(screen.getByRole("button", { name: "New" })).toBeTruthy();
    expect((container.querySelector(".actionbar select") as HTMLSelectElement | null)?.disabled).toBe(false);
    expect(screen.getByLabelText("Pipeline")).toBeTruthy();
    expect(screen.queryByText("No document open.")).toBeNull();
  });

  it("switches editor content reliably when clicking document tabs", async () => {
    const { container } = render(<App />);

    await waitFor(() => expect(screen.getByText("Ready.")).toBeTruthy());

    const newButton = screen.getByRole("button", { name: "New" });
    fireEvent.click(newButton);

    await waitFor(() => expect(container.querySelectorAll(".document-tabs > button").length).toBe(2));

    const tabs = Array.from(container.querySelectorAll(".document-tabs > button")) as HTMLButtonElement[];
    fireEvent.click(tabs[0]);

    await waitFor(() => {
      const editor = container.querySelector(".cm-editor");
      expect(editor).toBeTruthy();
      expect(editor?.textContent).toContain("Welcome to TextForge.");
    });

    fireEvent.click((container.querySelectorAll(".document-tabs > button")[1] as HTMLButtonElement));

    await waitFor(() => {
      const editor = container.querySelector(".cm-editor");
      expect(editor).toBeTruthy();
      expect(editor?.textContent || "").not.toContain("Welcome to TextForge.");
    });
  });

  it("hides wrapped markdown section content when a heading is folded", () => {
    const { container } = renderHtmlViewer([
      '<article class="rendered-markdown">',
      "<h2>Section A</h2>",
      "<p>Hide me</p>",
      "<h3>Section A.1</h3>",
      "<p>Hide me too</p>",
      "<h2>Section B</h2>",
      "<p>Keep me visible</p>",
      "</article>"
    ].join(""));

    (screen.getAllByRole("button", { name: "Fold heading section" })[0] as HTMLButtonElement).click();

    const article = container.querySelector(".rendered-markdown");
    const paragraphs = article?.querySelectorAll("p") || [];
    const nestedHeading = article?.querySelectorAll("h3")[0];
    const siblingHeading = article?.querySelectorAll("h2")[1];

    expect(paragraphs[0]?.hidden).toBe(true);
    expect(nestedHeading?.hidden).toBe(true);
    expect(paragraphs[1]?.hidden).toBe(true);
    expect(siblingHeading?.hidden).toBe(false);
    expect(paragraphs[2]?.hidden).toBe(false);
  });

  it("fold all hides wrapped markdown sections and unfold all restores them", () => {
    const html = [
      '<article class="rendered-markdown">',
      "<h2>Section A</h2>",
      "<p>Hide me</p>",
      "<h2>Section B</h2>",
      "<p>Hide me as well</p>",
      "</article>"
    ].join("");

    const { rerender, container } = renderHtmlViewer(html, { revision: 1, action: "html-fold-all" });
    const article = container.querySelector(".rendered-markdown");
    const paragraphs = article?.querySelectorAll("p") || [];

    expect(paragraphs[0]?.hidden).toBe(true);
    expect(paragraphs[1]?.hidden).toBe(true);

    const result: ViewerResult = {
      kind: "html",
      title: "Markdown",
      html
    };

    rerender(
      <ViewerContent
        result={result}
        query=""
        zoom={1}
        settings={{}}
        toolbarAction={{ revision: 2, action: "html-unfold-all" }}
      />
    );

    expect(paragraphs[0]?.hidden).toBe(false);
    expect(paragraphs[1]?.hidden).toBe(false);
  });

  it("suppresses selection for non-text SVG drag targets", () => {
    const { container } = renderSvgViewer();
    const frame = container.querySelector(".svg-frame") as HTMLDivElement;

    expect(shouldSuppressSvgSelection(frame)).toBe(true);
  });

  it("keeps text selection available for SVG text drag targets", () => {
    const { container } = renderSvgViewer();
    const text = container.querySelector("text") as SVGTextElement;

    expect(shouldSuppressSvgSelection(text)).toBe(false);
  });

  it("anchors standalone SVG zoom to the mouse position", () => {
    const anchored = zoomStandaloneSvgViewAtPoint({ panX: 10, panY: 15 }, 2, 4, 110, 95);

    expect(anchored.panX).toBeCloseTo(-90);
    expect(anchored.panY).toBeCloseTo(-65);
  });
});
