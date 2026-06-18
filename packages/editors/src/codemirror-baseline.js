import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import {
  defaultKeymap,
  history,
  historyKeymap,
} from '@codemirror/commands';
import {
  HighlightStyle,
  bracketMatching,
  foldKeymap,
  indentUnit,
  syntaxHighlighting,
} from '@codemirror/language';
import { EditorState, RangeSetBuilder } from '@codemirror/state';
import { tags } from '@lezer/highlight';
import {
  Decoration,
  EditorView,
  ViewPlugin,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightWhitespace,
  keymap,
} from '@codemirror/view';
import { INDENT_UNIT, INDENT_WIDTH } from './codemirror-indentation.js';

export const textForgeHighlightStyle = HighlightStyle.define([
  { tag: [tags.keyword, tags.operatorKeyword, tags.modifier], color: '#67e8f9' },
  { tag: [tags.atom, tags.bool, tags.number], color: '#f4b860' },
  { tag: [tags.string, tags.special(tags.string), tags.regexp, tags.url], color: '#86efac' },
  { tag: [tags.propertyName, tags.attributeName], color: '#93c5fd' },
  { tag: [tags.typeName, tags.className, tags.tagName, tags.labelName, tags.namespace], color: '#5eead4' },
  { tag: [tags.comment, tags.quote, tags.meta], color: '#94a3b8', fontStyle: 'italic' },
  { tag: tags.heading, color: '#f4b860', fontWeight: '700' },
  { tag: [tags.bracket, tags.punctuation, tags.separator], color: '#cbd5e1' },
  { tag: tags.link, color: '#93c5fd', textDecoration: 'underline' },
  { tag: tags.strong, fontWeight: '700' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.invalid, color: '#fca5a5', textDecoration: 'underline wavy' },
]);

const indentGuide = Decoration.mark({ class: 'cm-indentGuide' });

function addIndentGuideDecorations(builder, line) {
  const leading = line.text.match(/^[ \t]+/)?.[0] ?? '';
  if (!leading) {
    return;
  }

  for (let offset = 0; offset < leading.length; offset += INDENT_WIDTH) {
    builder.add(line.from + offset, line.from + offset + 1, indentGuide);
  }
}

const indentationGuides = ViewPlugin.fromClass(class {
  constructor(view) {
    this.decorations = this.buildDecorations(view);
  }

  update(update) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

  buildDecorations(view) {
    const builder = new RangeSetBuilder();
    for (const { from, to } of view.visibleRanges) {
      let position = from;
      while (position <= to) {
        const line = view.state.doc.lineAt(position);
        addIndentGuideDecorations(builder, line);
        if (line.to >= view.state.doc.length) {
          break;
        }
        position = line.to + 1;
      }
    }
    return builder.finish();
  }
}, {
  decorations: (plugin) => plugin.decorations,
});

export function createCodeMirrorBaselineExtensions() {
  return [
    history(),
    closeBrackets(),
    bracketMatching(),
    drawSelection(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    highlightWhitespace(),
    indentationGuides,
    indentUnit.of(INDENT_UNIT),
    EditorState.tabSize.of(INDENT_WIDTH),
    syntaxHighlighting(textForgeHighlightStyle),
    keymap.of([
      ...closeBracketsKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...defaultKeymap,
    ]),
  ];
}

export function createCodeMirrorBaselineTheme() {
  return EditorView.theme({
    '.cm-activeLine': {
      backgroundColor: 'rgba(59, 130, 246, 0.11)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(59, 130, 246, 0.16)',
      color: '#dbeafe',
    },
    '.cm-matchingBracket': {
      backgroundColor: 'rgba(34, 197, 94, 0.22)',
      outline: '1px solid rgba(74, 222, 128, 0.55)',
    },
    '.cm-nonmatchingBracket': {
      backgroundColor: 'rgba(248, 113, 113, 0.22)',
      outline: '1px solid rgba(248, 113, 113, 0.55)',
    },
    '.cm-highlightSpace': {
      backgroundImage: 'radial-gradient(circle at center, rgba(148, 163, 184, 0.18) 0, rgba(148, 163, 184, 0.18) 1px, transparent 1.5px)',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    },
    '.cm-highlightTab': {
      backgroundColor: 'rgba(248, 113, 113, 0.12)',
      borderBottom: '1px solid rgba(248, 113, 113, 0.42)',
    },
    '.cm-indentGuide': {
      borderLeft: '1px solid rgba(148, 163, 184, 0.18)',
      marginLeft: '-1px',
    },
  });
}
