import { useEffect, useRef } from "preact/hooks";
import { basicSetup } from "codemirror";
import { indentWithTab } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { json } from "@codemirror/lang-json";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { xml } from "@codemirror/lang-xml";
import { HighlightStyle, StreamLanguage, foldAll, foldEffect, foldService, syntaxHighlighting, unfoldAll, type StreamParser } from "@codemirror/language";
import { lua as luaLegacy } from "@codemirror/legacy-modes/mode/lua";
import { Compartment, EditorState, Transaction } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import type { SourceRange } from "../domain/types";

interface CodeEditorProps {
  value: string;
  languageId: string;
  onChange: (text: string) => void;
  readOnly?: boolean;
  revealRange?: (SourceRange & { revision?: number }) | null;
  onRevealHandled?: (revision?: number) => void;
  onEditorReady?: (view: EditorView) => void;
  onSelectionChange?: (range: SourceRange, selectedText: string) => void;
  onSelectSourceRange?: (range: SourceRange) => void;
  editorCommand?: CodeEditorCommand;
}

export interface CodeEditorCommand {
  revision: number;
  action: "fold-all" | "unfold-all" | "fold-leading-directives";
}

export function CodeEditor({ value, languageId, onChange, readOnly, revealRange, onRevealHandled, onEditorReady, onSelectionChange, onSelectSourceRange, editorCommand }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const languageCompartmentRef = useRef(new Compartment());
  const readOnlyCompartmentRef = useRef(new Compartment());
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
        readOnlyCompartmentRef.current.of(EditorState.readOnly.of(Boolean(readOnly))),
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
      const selection = view.state.selection.main;
      const nextDocLength = value.length;
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
        selection: {
          anchor: clampPosition(selection.anchor, nextDocLength),
          head: clampPosition(selection.head, nextDocLength)
        },
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
      effects: [
        languageCompartmentRef.current.reconfigure(languageExtension(languageId)),
        readOnlyCompartmentRef.current.reconfigure(EditorState.readOnly.of(Boolean(readOnly)))
      ]
    });
  }, [languageId, readOnly]);

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

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !editorCommand?.revision) {
      return;
    }
    if (editorCommand.action === "fold-all") {
      foldAll(view);
    } else if (editorCommand.action === "fold-leading-directives") {
      foldLeadingDirectives(view);
    } else if (editorCommand.action === "unfold-all") {
      unfoldAll(view);
    }
  }, [editorCommand?.revision]);

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
  if (languageId === "text.itm" || languageId === "text.indented-tree") {
    return [StreamLanguage.define(itmParser), foldService.of(itmFoldService)];
  }
  if (languageId === "text.csv") {
    return StreamLanguage.define(delimitedParser);
  }
  if (languageId === "text.mermaid" || languageId === "text.graphviz-dot") {
    return StreamLanguage.define(diagramParser);
  }
  return [];
}

interface ItmStreamParserState {
  inAttributes: boolean;
  expectingValue: boolean;
  directiveDepth: number;
  directivePendingBlock: boolean;
  directiveKind?: "style" | "generic";
  styleSelectorEnd?: number;
}

const itmParser: StreamParser<ItmStreamParserState> = {
  startState() {
    return { inAttributes: false, expectingValue: false, directiveDepth: 0, directivePendingBlock: false };
  },
  token(stream, state) {
    if (stream.sol()) {
      const trimmedLine = stream.string.trim();
      if (trimmedLine.startsWith("%style")) {
        const layout = scanStyleDirective(stream.string);
        state.directiveKind = "style";
        state.styleSelectorEnd = layout?.selectorEnd;
        state.directiveDepth = 0;
        state.directivePendingBlock = false;
      } else {
        state.directiveKind = undefined;
        state.styleSelectorEnd = undefined;
      }
      if (state.directiveDepth > 0) {
        state.directiveDepth = Math.max(0, state.directiveDepth + braceBalance(trimmedLine));
        stream.skipToEnd();
        return "comment";
      }
      if (state.directivePendingBlock) {
        if (!trimmedLine) {
          stream.skipToEnd();
          return null;
        }
        if (trimmedLine.startsWith("{")) {
          state.directivePendingBlock = false;
          state.directiveDepth = Math.max(0, braceBalance(trimmedLine));
          stream.skipToEnd();
          return "comment";
        }
        state.directivePendingBlock = false;
      }
      const remaining = stream.string.slice(stream.pos);
      const trimmed = remaining.trim();
      if (state.directiveKind === "style") {
        if (stream.eatSpace()) {
          return null;
        }
        const stylePrefix = stream.string.indexOf("%style");
        if (stylePrefix >= 0 && stream.pos <= stylePrefix) {
          stream.pos = stylePrefix + "%style".length;
          return "keyword";
        }
        if (state.styleSelectorEnd !== undefined && stream.pos < state.styleSelectorEnd) {
          stream.pos = state.styleSelectorEnd;
          return "selector";
        }
      }
      if (stream.eatSpace()) {
        return null;
      }
      if (trimmed.startsWith("%")) {
        state.directiveDepth = trimmed.includes("{") ? Math.max(0, braceBalance(trimmed)) : 0;
        state.directivePendingBlock = !trimmed.includes("{");
        stream.skipToEnd();
        return "comment";
      }
      if (trimmed.startsWith("|")) {
        stream.skipToEnd();
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
    if (stream.match("%style")) {
      return "keyword";
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

function itmFoldService(state: EditorState, from: number): { from: number; to: number } | null {
  const line = state.doc.lineAt(from);
  const directiveFold = directiveFoldRange(state, line.number)?.range;
  if (directiveFold) {
    return directiveFold;
  }
  const detailFold = detailFoldRange(state, line.number);
  if (detailFold) {
    return detailFold;
  }
  return branchFoldRange(state, line.number);
}

function directiveFoldRange(state: EditorState, lineNumber: number): { range: { from: number; to: number } | null; endLineNumber: number } | null {
  const line = state.doc.line(lineNumber);
  const trimmed = line.text.trim();
  if (!trimmed.startsWith("%")) {
    return null;
  }
  if (trimmed.startsWith("%style")) {
    const styleLayout = scanStyleDirective(line.text);
    if (!styleLayout) {
      return { range: null, endLineNumber: lineNumber };
    }
    if (styleLayout.inlineBodyStart !== undefined) {
      return { range: null, endLineNumber: lineNumber };
    }
    const next = nextNonEmptyLine(state, lineNumber + 1);
    if (!next || !next.text.trim().startsWith("{")) {
      return { range: null, endLineNumber: lineNumber };
    }
    if (braceBalance(next.text.trim()) <= 0) {
      return { range: { from: line.to, to: next.to }, endLineNumber: next.number };
    }
    const endLineNumber = findDirectiveBlockEnd(state, next.number, braceBalance(next.text.trim()));
    return {
      range: endLineNumber > lineNumber ? { from: line.to, to: state.doc.line(endLineNumber).to } : null,
      endLineNumber
    };
  }
  if (!trimmed.includes("{")) {
    const next = nextNonEmptyLine(state, lineNumber + 1);
    if (!next || !next.text.trim().startsWith("{")) {
      return { range: null, endLineNumber: lineNumber };
    }
    if (braceBalance(next.text.trim()) <= 0) {
      return { range: { from: line.to, to: next.to }, endLineNumber: next.number };
    }
    const endLineNumber = findDirectiveBlockEnd(state, next.number, braceBalance(next.text.trim()));
    return {
      range: endLineNumber > lineNumber ? { from: line.to, to: state.doc.line(endLineNumber).to } : null,
      endLineNumber
    };
  }
  const initialBalance = braceBalance(trimmed);
  if (initialBalance <= 0) {
    return { range: null, endLineNumber: lineNumber };
  }
  const endLineNumber = findDirectiveBlockEnd(state, lineNumber, initialBalance);
  return {
    range: endLineNumber > lineNumber ? { from: line.to, to: state.doc.line(endLineNumber).to } : null,
    endLineNumber
  };
}

function findDirectiveBlockEnd(state: EditorState, startLineNumber: number, initialBalance: number): number {
  let balance = initialBalance;
  let lineNumber = startLineNumber;
  while (balance > 0 && lineNumber < state.doc.lines) {
    lineNumber += 1;
    balance += braceBalance(state.doc.line(lineNumber).text.trim());
  }
  return lineNumber;
}

function detailFoldRange(state: EditorState, lineNumber: number): { from: number; to: number } | null {
  const line = state.doc.line(lineNumber);
  if (!line.text.trim().startsWith("|")) {
    return null;
  }
  let endLineNumber = lineNumber;
  while (endLineNumber + 1 <= state.doc.lines && state.doc.line(endLineNumber + 1).text.trim().startsWith("|")) {
    endLineNumber += 1;
  }
  return endLineNumber > lineNumber ? { from: line.to, to: state.doc.line(endLineNumber).to } : null;
}

function branchFoldRange(state: EditorState, lineNumber: number): { from: number; to: number } | null {
  const line = state.doc.line(lineNumber);
  const trimmed = line.text.trim();
  if (!trimmed || trimmed.startsWith("%") || trimmed.startsWith("|")) {
    return null;
  }
  const baseIndent = lineIndent(line.text);
  let endLineNumber = lineNumber;
  for (let cursor = lineNumber + 1; cursor <= state.doc.lines; cursor += 1) {
    const candidate = state.doc.line(cursor);
    const candidateTrimmed = candidate.text.trim();
    if (!candidateTrimmed) {
      if (endLineNumber > lineNumber) {
        endLineNumber = cursor;
      }
      continue;
    }
    if (lineIndent(candidate.text) <= baseIndent) {
      break;
    }
    endLineNumber = cursor;
  }
  return endLineNumber > lineNumber ? { from: line.to, to: state.doc.line(endLineNumber).to } : null;
}

function nextNonEmptyLine(state: EditorState, lineNumber: number) {
  for (let cursor = lineNumber; cursor <= state.doc.lines; cursor += 1) {
    const line = state.doc.line(cursor);
    if (line.text.trim()) {
      return line;
    }
  }
  return null;
}

function lineIndent(text: string): number {
  const match = /^\s*/.exec(text);
  return match ? match[0].length : 0;
}

function foldLeadingDirectives(view: EditorView): void {
  let lineNumber = 1;
  let startLineNumber: number | null = null;
  let endLineNumber: number | null = null;
  while (lineNumber <= view.state.doc.lines) {
    const line = view.state.doc.line(lineNumber);
    const trimmed = line.text.trim();
    if (!trimmed) {
      if (startLineNumber !== null) {
        endLineNumber = lineNumber;
      }
      lineNumber += 1;
      continue;
    }
    if (!trimmed.startsWith("%")) {
      break;
    }
    if (startLineNumber === null) {
      startLineNumber = lineNumber;
    }
    const directive = directiveFoldRange(view.state, lineNumber);
    if (!directive) {
      break;
    }
    endLineNumber = directive.endLineNumber;
    lineNumber = directive.endLineNumber + 1;
  }
  if (startLineNumber !== null && endLineNumber !== null && endLineNumber > startLineNumber) {
    view.dispatch({
      effects: foldEffect.of({
        from: view.state.doc.line(startLineNumber).to,
        to: view.state.doc.line(endLineNumber).to
      })
    });
  }
}

function braceBalance(text: string): number {
  let balance = 0;
  for (const char of text) {
    if (char === "{") {
      balance += 1;
    } else if (char === "}") {
      balance -= 1;
    }
  }
  return balance;
}

const textForgeHighlightStyle = HighlightStyle.define([
  { tag: tags.atom, color: "#7b4d00", fontWeight: "600" },
  { tag: tags.keyword, color: "#7a3f73", fontWeight: "650" },
  { tag: tags.special(tags.atom), color: "#0f6f7f", fontWeight: "650" },
  { tag: tags.attributeName, color: "#2f6b56", fontWeight: "600" },
  { tag: tags.string, color: "#8a4f17" },
  { tag: tags.number, color: "#4e6688" },
  { tag: tags.link, color: "#245f94", textDecoration: "underline" },
  { tag: tags.tagName, color: "#6f7c2f" },
  { tag: tags.comment, color: "#777d82", fontStyle: "italic" },
  { tag: tags.bracket, color: "#5f6468" },
  { tag: tags.operator, color: "#596064" }
]);

interface StyleDirectiveLayout {
  selectorStart: number;
  selectorEnd: number;
  inlineBodyStart?: number;
  inlineBodyEnd?: number;
}

function scanStyleDirective(line: string): StyleDirectiveLayout | null {
  const trimmed = line.trimStart();
  const prefixIndex = trimmed.indexOf("%style");
  if (prefixIndex !== 0) {
    return null;
  }
  const afterPrefix = trimmed.slice("%style".length);
  const selectorInput = afterPrefix.trimStart();
  if (!selectorInput) {
    return null;
  }

  const selectorEnd = scanSelectorExpression(selectorInput);
  if (selectorEnd <= 0) {
    return null;
  }

  const rest = selectorInput.slice(selectorEnd).trimStart();
  if (!rest.startsWith("{")) {
    return {
      selectorStart: line.indexOf("%style") + "%style".length,
      selectorEnd: line.indexOf("%style") + "%style".length + selectorEnd
    };
  }

  const body = scanBalancedBlock(rest);
  if (!body) {
    return {
      selectorStart: line.indexOf("%style") + "%style".length,
      selectorEnd: line.indexOf("%style") + "%style".length + selectorEnd
    };
  }

  const selectorBase = line.indexOf("%style") + "%style".length + afterPrefix.length - selectorInput.length;
  const bodyStart = selectorBase + selectorEnd + (selectorInput.slice(selectorEnd).length - rest.length);
  return {
    selectorStart: selectorBase,
    selectorEnd: selectorBase + selectorEnd,
    inlineBodyStart: bodyStart,
    inlineBodyEnd: bodyStart + body.length
  };
}

function scanSelectorExpression(text: string): number {
  let index = 0;

  const skipSpaces = (): void => {
    while (index < text.length && /\s/u.test(text[index] ?? "")) {
      index += 1;
    }
  };

  const readAtomTail = (): boolean => {
    const start = index;
    while (index < text.length && !/\s/u.test(text[index] ?? "") && !["(", ")", "[", "]", "{", "}", ","].includes(text[index] ?? "")) {
      index += 1;
    }
    return index > start;
  };

  const parseExpression = (): boolean => {
    if (!parseUnary()) {
      return false;
    }
    while (true) {
      const save = index;
      if (!matchWord("AND") && !matchWord("OR") && !matchWord("XOR")) {
        index = save;
        return true;
      }
      if (!parseUnary()) {
        return false;
      }
    }
  };

  const parseUnary = (): boolean => {
    skipSpaces();
    if (matchWord("NOT")) {
      return parseUnary();
    }
    return parsePrimary();
  };

  const parsePrimary = (): boolean => {
    skipSpaces();
    const current = text[index];
    if (!current) {
      return false;
    }
    if (current === "(") {
      index += 1;
      if (!parseExpression()) {
        return false;
      }
      skipSpaces();
      if (text[index] !== ")") {
        return false;
      }
      index += 1;
      return true;
    }
    if (current === "[") {
      return scanBalancedBracket();
    }
    if (current === "{") {
      return scanAttributeSelector();
    }
    if (current === "#" || current === "&" || current === "@") {
      index += 1;
      return readAtomTail();
    }
    if (current === "=" && text[index + 1] === ">") {
      index += 2;
      return true;
    }
    if (current === "~" && text[index + 1] === ">") {
      index += 2;
      return true;
    }
    if (current === "-" && text[index + 1] === ">") {
      index += 2;
      if (text[index] === "[") {
        return scanBalancedBracket();
      }
      return true;
    }
    if (/[A-Za-z]/u.test(current)) {
      const start = index;
      while (index < text.length && /[A-Za-z0-9_-]/u.test(text[index] ?? "")) {
        index += 1;
      }
      const name = text.slice(start, index);
      skipSpaces();
      if (text[index] === "(") {
        if (!["ALL", "ANY", "NONE", "ONE"].includes(name)) {
          return false;
        }
        index += 1;
        skipSpaces();
        if (text[index] === ")") {
          return false;
        }
        while (parseExpression()) {
          skipSpaces();
          if (text[index] === ",") {
            index += 1;
            skipSpaces();
            continue;
          }
          if (text[index] === ")") {
            index += 1;
            return true;
          }
          return false;
        }
        return false;
      }
      index = start;
    }
    return false;
  };

  const matchWord = (word: string): boolean => {
    skipSpaces();
    const end = index + word.length;
    if (text.slice(index, end).toUpperCase() !== word) {
      return false;
    }
    const previous = text[index - 1] ?? "";
    const next = text[end] ?? "";
    if (/[A-Za-z0-9_-]/u.test(previous) || /[A-Za-z0-9_-]/u.test(next)) {
      return false;
    }
    index = end;
    skipSpaces();
    return true;
  };

  const scanBalancedBracket = (): boolean => {
    let depth = 0;
    let seenContent = false;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let escaped = false;
    while (index < text.length) {
      const current = text[index];
      if (escaped) {
        escaped = false;
        index += 1;
        seenContent = true;
        continue;
      }
      if (inDoubleQuote) {
        if (current === "\\") {
          escaped = true;
        } else if (current === '"') {
          inDoubleQuote = false;
        }
        index += 1;
        seenContent = true;
        continue;
      }
      if (inSingleQuote) {
        if (current === "'") {
          inSingleQuote = false;
        }
        index += 1;
        seenContent = true;
        continue;
      }
      if (current === '"') {
        inDoubleQuote = true;
        index += 1;
        continue;
      }
      if (current === "'") {
        inSingleQuote = true;
        index += 1;
        continue;
      }
      if (current === "[") {
        depth += 1;
        index += 1;
        continue;
      }
      if (current === "]") {
        depth -= 1;
        index += 1;
        if (depth === 0) {
          return seenContent;
        }
        continue;
      }
      seenContent = true;
      index += 1;
    }
    return false;
  };

  const scanAttributeSelector = (): boolean => {
    const start = index;
    index += 1;
    let depth = 1;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let escaped = false;
    let content = "";
    while (index < text.length) {
      const current = text[index];
      if (escaped) {
        escaped = false;
        content += current;
        index += 1;
        continue;
      }
      if (inDoubleQuote) {
        if (current === "\\") {
          escaped = true;
        } else if (current === '"') {
          inDoubleQuote = false;
        }
        content += current;
        index += 1;
        continue;
      }
      if (inSingleQuote) {
        if (current === "'") {
          inSingleQuote = false;
        }
        content += current;
        index += 1;
        continue;
      }
      if (current === '"') {
        inDoubleQuote = true;
        content += current;
        index += 1;
        continue;
      }
      if (current === "'") {
        inSingleQuote = true;
        content += current;
        index += 1;
        continue;
      }
      if (current === "{") {
        depth += 1;
        content += current;
        index += 1;
        continue;
      }
      if (current === "}") {
        depth -= 1;
        index += 1;
        if (depth === 0) {
          return content.includes("=");
        }
        content += current;
        continue;
      }
      content += current;
      index += 1;
    }
    index = start;
    return false;
  };

  if (!parseExpression()) {
    return 0;
  }
  skipSpaces();
  return index;
}

function scanBalancedBlock(text: string): string | null {
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;
  for (let index = 0; index < text.length; index += 1) {
    const current = text[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (inDoubleQuote) {
      if (current === "\\") {
        escaped = true;
      } else if (current === '"') {
        inDoubleQuote = false;
      }
      continue;
    }
    if (inSingleQuote) {
      if (current === "'") {
        inSingleQuote = false;
      }
      continue;
    }
    if (current === '"') {
      inDoubleQuote = true;
      continue;
    }
    if (current === "'") {
      inSingleQuote = true;
      continue;
    }
    if (current === "{") {
      depth += 1;
      continue;
    }
    if (current === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(0, index + 1);
      }
    }
  }
  return null;
}

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
