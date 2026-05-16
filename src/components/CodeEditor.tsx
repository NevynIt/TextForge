import { useEffect, useRef } from "preact/hooks";
import { basicSetup } from "codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { json } from "@codemirror/lang-json";
import { xml } from "@codemirror/lang-xml";
import { StreamLanguage, type StreamParser } from "@codemirror/language";
import { Compartment, EditorState, Transaction } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

interface CodeEditorProps {
  value: string;
  languageId: string;
  onChange: (text: string) => void;
}

export function CodeEditor({ value, languageId, onChange }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const languageCompartmentRef = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current || viewRef.current) {
      return;
    }
    const languageCompartment = languageCompartmentRef.current;
    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        languageCompartment.of(languageExtension(languageId)),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (
            update.docChanged &&
            !update.transactions.some((transaction) => transaction.annotation(Transaction.remote))
          ) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        editorTheme
      ]
    });
    viewRef.current = new EditorView({
      state,
      parent: containerRef.current
    });
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
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
        annotations: Transaction.remote.of(true)
      });
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

  return <div ref={containerRef} class="code-editor" />;
}

function languageExtension(languageId: string) {
  if (languageId === "text.markdown") {
    return markdown();
  }
  if (languageId === "text.json") {
    return json();
  }
  if (languageId === "text.xml") {
    return xml();
  }
  if (languageId === "text.indented-tree") {
    return StreamLanguage.define(ittParser);
  }
  if (languageId === "text.csv" || languageId === "text.tsv") {
    return StreamLanguage.define(delimitedParser);
  }
  if (languageId === "text.mermaid" || languageId === "text.graphviz-dot") {
    return StreamLanguage.define(diagramParser);
  }
  return [];
}

const ittParser: StreamParser<unknown> = {
  token(stream) {
    if (stream.sol()) {
      stream.eatSpace();
      if (stream.match(/&[A-Za-z][A-Za-z0-9_-]*/)) {
        return "atom";
      }
      if (stream.match(/\[[^\]]+\]/)) {
        return "keyword";
      }
      if (stream.match(/[|%].*/)) {
        return "comment";
      }
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
