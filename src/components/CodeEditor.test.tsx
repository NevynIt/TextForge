// @vitest-environment jsdom

import { render, waitFor } from "@testing-library/preact";
import { EditorView } from "@codemirror/view";
import { useState } from "preact/hooks";
import { describe, expect, it, vi } from "vitest";
import { CodeEditor } from "./CodeEditor";

describe("CodeEditor", () => {
  it("preserves scroll position when external value updates replace the document", async () => {
    const onChange = vi.fn();
    const startingValue = Array.from({ length: 200 }, (_, index) => `line ${index + 1}`).join("\n");
    const updatedValue = `${startingValue}\nappended from outside`;

    const { container, rerender } = render(
      <CodeEditor value={startingValue} languageId="text.plain" onChange={onChange} />
    );

    await waitFor(() => expect(container.querySelector(".cm-editor")).toBeTruthy());

    const scroller = container.querySelector(".cm-scroller") as HTMLDivElement | null;
    expect(scroller).toBeTruthy();
    if (!scroller) {
      return;
    }

    scroller.scrollTop = 240;
    scroller.scrollLeft = 16;

    rerender(
      <CodeEditor value={updatedValue} languageId="text.plain" onChange={onChange} />
    );

    await waitFor(() => {
      expect(scroller.scrollTop).toBe(240);
      expect(scroller.scrollLeft).toBe(16);
    });
  });

  it("preserves the cursor position when external value updates replace the document", async () => {
    const onChange = vi.fn();
    const startingValue = Array.from({ length: 80 }, (_, index) => `line ${index + 1}`).join("\n");
    const updatedValue = `${startingValue}\nappended from outside`;
    let editorView!: EditorView;

    const { container, rerender } = render(
      <CodeEditor value={startingValue} languageId="text.plain" onChange={onChange} onEditorReady={(view) => { editorView = view; }} />
    );

    await waitFor(() => expect(container.querySelector(".cm-editor")).toBeTruthy());
    const view = editorView;

    view.dispatch({ selection: { anchor: 120, head: 120 } });
    expect(view.state.selection.main.anchor).toBe(120);

    rerender(
      <CodeEditor value={updatedValue} languageId="text.plain" onChange={onChange} onEditorReady={(nextView) => { editorView = nextView; }} />
    );

    await waitFor(() => expect(view.state.selection.main.anchor).toBe(120));
    expect(view.state.selection.main.head).toBe(120);
  });

  it("clamps the selection when external value updates replace the document with shorter text", async () => {
    const onChange = vi.fn();
    const startingValue = Array.from({ length: 20 }, (_, index) => `line ${index + 1}`).join("\n");
    const updatedValue = "short";
    let editorView!: EditorView;

    const { container, rerender } = render(
      <CodeEditor value={startingValue} languageId="text.plain" onChange={onChange} onEditorReady={(view) => { editorView = view; }} />
    );

    await waitFor(() => expect(container.querySelector(".cm-editor")).toBeTruthy());
    const view = editorView;

    view.dispatch({ selection: { anchor: startingValue.length, head: startingValue.length } });
    expect(view.state.selection.main.anchor).toBe(startingValue.length);

    rerender(
      <CodeEditor value={updatedValue} languageId="text.plain" onChange={onChange} onEditorReady={(nextView) => { editorView = nextView; }} />
    );

    await waitFor(() => {
      expect(view.state.doc.toString()).toBe(updatedValue);
      expect(view.state.selection.main.anchor).toBe(updatedValue.length);
      expect(view.state.selection.main.head).toBe(updatedValue.length);
    });
  });

  it("treats reveal requests as one-shot when the parent clears them after handling", async () => {
    function Harness() {
      const [mounted, setMounted] = useState(true);
      const [reveal, setReveal] = useState<{ from: number; to: number; line: number; column: number; revision: number } | null>({
        from: 420,
        to: 420,
        line: 40,
        column: 0,
        revision: 1
      });
      const [handledCount, setHandledCount] = useState(0);
      const value = Array.from({ length: 200 }, (_, index) => `line ${index + 1}`).join("\n");

      return (
        <div>
          <button type="button" onClick={() => setMounted((current) => !current)}>toggle</button>
          <output>{handledCount}</output>
          {mounted ? (
            <CodeEditor
              value={value}
              languageId="text.plain"
              onChange={() => {}}
              revealRange={reveal}
              onRevealHandled={(revision) => {
                setHandledCount((current) => current + 1);
                setReveal((current) => current?.revision === revision ? null : current);
              }}
            />
          ) : null}
        </div>
      );
    }

    const { container } = render(<Harness />);

    await waitFor(() => expect(container.querySelector(".cm-editor")).toBeTruthy());

    await waitFor(() => expect(container.querySelector("output")?.textContent).toBe("1"));

    (container.querySelector("button") as HTMLButtonElement).click();
    (container.querySelector("button") as HTMLButtonElement).click();

    await waitFor(() => expect(container.querySelector(".cm-editor")).toBeTruthy());
    expect(container.querySelector("output")?.textContent).toBe("1");
  });

  it("folds and unfolds ITM directive and branch blocks on command", async () => {
    const value = [
      "%view dependencies",
      "{",
      "  pipeline:",
      '    - select: "[Component]"',
      "}",
      "",
      "&root Root",
      "  child",
      "  | detail line"
    ].join("\n");

    const { container, rerender } = render(
      <CodeEditor
        value={value}
        languageId="text.itm"
        onChange={() => {}}
        editorCommand={{ revision: 1, action: "fold-all" }}
      />
    );

    await waitFor(() => expect(container.querySelectorAll(".cm-foldPlaceholder").length).toBeGreaterThan(0));

    rerender(
      <CodeEditor
        value={value}
        languageId="text.itm"
        onChange={() => {}}
        editorCommand={{ revision: 2, action: "unfold-all" }}
      />
    );

    await waitFor(() => expect(container.querySelectorAll(".cm-foldPlaceholder").length).toBe(0));
  });

  it("folds only the leading ITM directives on command", async () => {
    const value = [
      "%metadata",
      "{",
      "  title: Example",
      "}",
      "",
      "%view dependencies",
      "{",
      "  pipeline:",
      '    - select: "[Component]"',
      "}",
      "",
      "&root Root",
      "  child",
      "",
      "%style [Child]",
      "{",
      "  fill: #eee",
      "}"
    ].join("\n");

    const { container } = render(
      <CodeEditor
        value={value}
        languageId="text.itm"
        onChange={() => {}}
        editorCommand={{ revision: 1, action: "fold-leading-directives" }}
      />
    );

    await waitFor(() => expect(container.querySelectorAll(".cm-foldPlaceholder").length).toBe(1));
    expect(container.querySelector(".cm-editor")?.textContent).toContain("&root Root");
    expect(container.querySelector(".cm-editor")?.textContent).toContain("%style [Child]");
  });
});
