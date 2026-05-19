import { useEffect, useRef } from "preact/hooks";
import { basicSetup } from "codemirror";
import { indentWithTab } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { json } from "@codemirror/lang-json";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { xml } from "@codemirror/lang-xml";
import { HighlightStyle, StreamLanguage, syntaxHighlighting, type StreamParser } from "@codemirror/language";
import { lua as luaLegacy } from "@codemirror/legacy-modes/mode/lua";
import { Compartment, EditorState, Transaction } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import type { SourceRange } from "../domain/types";

interface CodeEditorProps {
  value: string;
  languageId: string;
  onChange: (text: string) => void;
  revealRange?: (SourceRange & { revision?: number }) | null;
  onRevealHandled?: (revision?: number) => void;
  onEditorReady?: (view: EditorView) => void;
  onSelectionChange?: (range: SourceRange, selectedText: string) => void;
  onSelectSourceRange?: (range: SourceRange) => void;
}

export function CodeEditor({ value, languageId, onChange, revealRange, onRevealHandled, onEditorReady, onSelectionChange, onSelectSourceRange }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const languageCompartmentRef = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  const onRevealHandledRef = useRef(onRevealHandled);
  const onSelectionChangeRef = useRef(onSelectionChange);
  const onSelectSourceRangeRef = useRef(onSelectSourceRange);
  const lastRevealRevisionRef = useRef<number | undefined>(undefined);
  const pendingSourceSyncRef = useRef(false);
  onChangeRef.current = onChange;
  onRevealHandledRef.current = onRevealHandled;
  onSelectionChangeRef.current = onSelectionChange;
  onSelectSourceRangeRef.current = onSelectSourceRange;

  useEffect(() => {
    if (!containerRef.current || viewRef.current) {
      return;
    }
    const languageCompartment = languageCompartmentRef.current;
    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        languageCompartment.of(languageExtension(languageId)),
        EditorView.lineWrapping,
        EditorView.domEventHandlers({
          mousedown: (_event, view) => {
            pendingSourceSyncRef.current = false;
            if (_event.button !== 0 || (!_event.ctrlKey && !_event.metaKey)) {
              return false;
            }
            if (!view.contentDOM.contains(_event.target as Node | null)) {
              return false;
            }
            pendingSourceSyncRef.current = true;
            return false;
          }
        }),
        EditorView.updateListener.of((update) => {
          if (
            update.docChanged &&
            !update.transactions.some((transaction) => transaction.annotation(Transaction.remote))
          ) {
            onChangeRef.current(update.state.doc.toString());
          }
          if (
            update.selectionSet &&
            !update.transactions.some((transaction) => transaction.annotation(Transaction.remote))
          ) {
            const selection = update.state.selection.main;
            const from = Math.min(selection.from, selection.to);
            const to = Math.max(selection.from, selection.to);
            const line = update.state.doc.lineAt(from);
            onSelectionChangeRef.current?.({
              from,
              to,
              line: line.number - 1,
              column: from - line.from
            }, update.state.sliceDoc(from, to));
            if (pendingSourceSyncRef.current) {
              pendingSourceSyncRef.current = false;
              onSelectSourceRangeRef.current?.({
                from,
                to,
                line: line.number - 1,
                column: from - line.from
              });
            }
          }
        }),
        syntaxHighlighting(textForgeHighlightStyle),
        editorTheme
      ]
    });
    viewRef.current = new EditorView({
      state,
      parent: containerRef.current
    });
    onEditorReady?.(viewRef.current);
    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }
    const current = view.state.doc.toString();
    if (current !== value) {
      const { scrollTop, scrollLeft } = view.scrollDOM;
      const selection = view.state.selection;
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
        selection,
        annotations: Transaction.remote.of(true)
      });
      view.scrollDOM.scrollTop = scrollTop;
      view.scrollDOM.scrollLeft = scrollLeft;
    }
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }
    view.dispatch({
      effects: languageCompartmentRef.current.reconfigure(languageExtension(languageId))
    });
  }, [languageId]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !revealRange) {
      return;
    }
    if (revealRange.revision !== undefined && lastRevealRevisionRef.current === revealRange.revision) {
      return;
    }
    const docLength = view.state.doc.length;
    const from = clampPosition(revealRange.from, docLength);
    const to = clampPosition(Math.max(revealRange.to, revealRange.from), docLength);
    lastRevealRevisionRef.current = revealRange.revision;
    view.dispatch({
      selection: { anchor: from, head: to },
      effects: EditorView.scrollIntoView(from, { y: "center" }),
      annotations: Transaction.remote.of(true)
    });
    view.focus();
    onRevealHandledRef.current?.(revealRange.revision);
  }, [revealRange?.revision, revealRange?.from, revealRange?.to]);

  return <div ref={containerRef} class="code-editor" />;
}

function clampPosition(value: number, docLength: number): number {
  return Math.max(0, Math.min(docLength, value));
}

function languageExtension(languageId: string) {
  if (languageId === "text.markdown") {
    return markdown();
  }
  if (languageId === "text.json") {
    return json();
  }
  if (languageId === "text.javascript") {
    return javascript({ jsx: true, typescript: false });
  }
  if (languageId === "text.python") {
    return python();
  }
  if (languageId === "text.lua") {
    return StreamLanguage.define(luaLegacy);
  }
  if (languageId === "text.xml" || languageId === "text.bpmn") {
    return xml();
  }
  if (languageId === "text.indented-tree") {
    return StreamLanguage.define(ittParser);
  }
  if (languageId === "text.csv") {
    return StreamLanguage.define(delimitedParser);
  }
  if (languageId === "text.mermaid" || languageId === "text.graphviz-dot") {
    return StreamLanguage.define(diagramParser);
  }
  return [];
}

interface IttParserState {
  inAttributes: boolean;
  expectingValue: boolean;
}

const ittParser: StreamParser<IttParserState> = {
  startState() {
    return { inAttributes: false, expectingValue: false };
  },
  token(stream, state) {
    if (stream.sol()) {
      if (stream.eatSpace()) {
        return null;
      }
      if (stream.match(/[|%].*/)) {
        return "comment";
      }
    }
    if (state.inAttributes) {
      if (stream.eatSpace()) {
        return null;
      }
      if (stream.match("}")) {
        state.inAttributes = false;
        state.expectingValue = false;
        return "bracket";
      }
      if (stream.match(",")) {
        state.expectingValue = false;
        return "separator";
      }
      if (stream.match(":")) {
        state.expectingValue = true;
        return "operator";
      }
      if (!state.expectingValue && stream.match(/[A-Za-z_][A-Za-z0-9_.-]*(?=\s*:)/)) {
        return "attributeName";
      }
      if (stream.match(/#[0-9A-Fa-f]{3,8}\b/)) {
        state.expectingValue = false;
        return "string";
      }
      if (stream.match(/"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/)) {
        state.expectingValue = false;
        return "string";
      }
      if (stream.match(/[+-]?\d+(?:\.\d+)?(?:px|em|rem|%)?\b/)) {
        state.expectingValue = false;
        return "number";
      }
      if (stream.match(/[^,}]+/)) {
        state.expectingValue = false;
        return "string";
      }
    }
    if (stream.match("{")) {
      state.inAttributes = true;
      state.expectingValue = false;
      return "bracket";
    }
    if (stream.match(/&[A-Za-z][A-Za-z0-9_-]*/)) {
      return "atom";
    }
    if (stream.match(/\[[^\]]+\]/)) {
      return "keyword";
    }
    if (stream.match(/#[A-Za-z][A-Za-z0-9_-]*/)) {
      return "tag";
    }
    if (stream.match(/@[A-Za-z][A-Za-z0-9_-]*(?::[A-Za-z][A-Za-z0-9_-]*)?/)) {
      return "link";
    }
    stream.next();
    return null;
  }
};

const textForgeHighlightStyle = HighlightStyle.define([
  { tag: tags.atom, color: "#7b4d00", fontWeight: "600" },
  { tag: tags.keyword, color: "#7a3f73", fontWeight: "650" },
  { tag: tags.attributeName, color: "#2f6b56", fontWeight: "600" },
  { tag: tags.string, color: "#8a4f17" },
  { tag: tags.number, color: "#4e6688" },
  { tag: tags.link, color: "#245f94", textDecoration: "underline" },
  { tag: tags.tagName, color: "#6f7c2f" },
  { tag: tags.comment, color: "#777d82", fontStyle: "italic" },
  { tag: tags.bracket, color: "#5f6468" },
  { tag: tags.operator, color: "#596064" }
]);

const delimitedParser: StreamParser<unknown> = {
  token(stream) {
    if (stream.match(/"(?:""|[^"])*"/)) {
      return "string";
    }
    if (stream.match(/,|\t/)) {
      return "separator";
    }
    stream.next();
    return null;
  }
};

const diagramParser: StreamParser<unknown> = {
  token(stream) {
    if (stream.sol() && stream.match(/\s*(graph|digraph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram)\b/)) {
      return "keyword";
    }
    if (stream.match(/-->|---|->|--/)) {
      return "operator";
    }
    if (stream.match(/\/\/.*/)) {
      return "comment";
    }
    stream.next();
    return null;
  }
};

const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "14px",
    background: "#fbfbf8",
    color: "#202225"
  },
  ".cm-scroller": {
    fontFamily: "Consolas, 'Liberation Mono', monospace"
  },
  ".cm-content": {
    padding: "14px 0"
  },
  ".cm-gutters": {
    background: "#f0eee7",
    color: "#686a6f",
    borderRight: "1px solid #d8d4c8"
  }
});
