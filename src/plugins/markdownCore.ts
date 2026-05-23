import type { TextForgePlugin } from "../domain/types";
import { extractMarkdownHeadingTree } from "../parsers/markdown";
import { escapeHtml } from "../parsers/source";
import MarkdownIt from "markdown-it";
import type { MarkdownItToken } from "markdown-it";
import katex from "katex";
import hljs from "highlight.js";
import mermaid from "mermaid";
import * as viz from "@viz-js/viz";
import { resolveMarkdownImageSource } from "../core/mediaSupport";
import { renderMermaidSvg } from "./renderMermaidSvg";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github.css";

interface MarkdownRuntime {
  parse(source: string, env: object): MarkdownRuntimeToken[];
  renderer: {
    rules: Record<string, ((tokens: MarkdownItToken[], index: number) => string) | undefined>;
    render(tokens: MarkdownRuntimeToken[], options: object, env: object): string;
  };
  options: object;
}

interface MarkdownRuntimeToken {
  type: string;
  attrGet(name: string): string | null;
  attrSet(name: string, value: string): void;
  children?: MarkdownRuntimeToken[];
}

interface MarkdownArtifact {
  id: string;
  kind: "mermaid" | "graphviz" | "math-block";
  source: string;
  html: string;
  sourceFrom: number;
  sourceTo: number;
}

interface InlineMathArtifact {
  id: string;
  source: string;
  html: string;
}

type KatexRenderer = Pick<typeof import("katex"), "renderToString">;

let markdownTokenNamespaceCounter = 0;

const plugin: TextForgePlugin = {
  id: "markdown-core",
  name: "Markdown Core",
  version: "0.1.0",
  transformers: [
    {
      kind: "transformer",
      id: "markdown-to-html",
      name: "Markdown to HTML",
      input: "text.markdown",
      output: "html",
      async transform(value, context) {
        if (value.kind !== "text") {
          throw new Error("Markdown transformer requires text input.");
        }
        const artifacts: MarkdownArtifact[] = [];
        const inlineMath: InlineMathArtifact[] = [];
        const tokenNamespace = createTokenNamespace();
        const prepared = await extractMarkdownArtifacts(value.text, artifacts, inlineMath, context, katex, tokenNamespace);
        const markdown = new MarkdownIt({
          html: false,
          linkify: true,
          typographer: true
        }) as unknown as MarkdownRuntime;
        const offsets = lineOffsets(value.text);
        markdown.renderer.rules.fence = (tokens: MarkdownItToken[], index: number) => {
          const token = tokens[index];
          const languageName = ((token.info || "").trim().split(/\s+/)[0] || "").toLowerCase();
          const sourceFrom = lineOffsetAt(offsets, token.map?.[0]);
          const sourceTo = lineOffsetAt(offsets, token.map?.[1], value.text.length);
          const code = highlightCode(token.content, languageName);
          const className = languageName ? `hljs language-${escapeHtml(languageName)}` : "hljs";
          return `<pre class="${className} tf-source-bridge" data-source-kind="code-block" data-source-from="${sourceFrom}" data-source-to="${sourceTo}"><code>${code}</code></pre>`;
        };
        const source = replaceInlineMath(prepared, inlineMath, katex, tokenNamespace);
        const tokens = markdown.parse(source, {});
        await resolveWorkspaceImageTokens(tokens, value.documentId, context);
        const rendered = markdown.renderer.render(tokens, markdown.options, {});
        return {
          kind: "html",
          html: `<article class="rendered-markdown">${restoreMarkdownArtifacts(rendered, artifacts, inlineMath, tokenNamespace)}</article>`,
          diagnostics: value.diagnostics
        };
      }
    },
    {
      kind: "transformer",
      id: "markdown-heading-tree",
      name: "Markdown Heading Tree",
      input: "text.markdown",
      output: "model.tree",
      transform(value) {
        if (value.kind !== "text") {
          throw new Error("Markdown heading extraction requires text input.");
        }
        return {
          kind: "model",
          modelType: "model.tree",
          data: extractMarkdownHeadingTree(value.text),
          diagnostics: value.diagnostics
        };
      }
    }
  ]
};

export default plugin;

async function extractMarkdownArtifacts(
  source: string,
  artifacts: MarkdownArtifact[],
  inlineMath: InlineMathArtifact[],
  context: Parameters<NonNullable<TextForgePlugin["transformers"]>[number]["transform"]>[1],
  katex: KatexRenderer,
  tokenNamespace: string
): Promise<string> {
  let text = source;
  text = await replaceAsync(text, /```(mermaid|dot|graphviz)\s*\r?\n([\s\S]*?)```/gi, async ({ match, index }, lang: string, body: string) => {
    const kind = lang.toLowerCase() === "mermaid" ? "mermaid" : "graphviz";
    const id = `tf-artifact-${artifacts.length + 1}`;
    const html = await renderDiagramArtifact(kind, id, body.trim(), context);
    artifacts.push({ id, kind, source: body.trim(), html, sourceFrom: index, sourceTo: index + match.length });
    return artifactPlaceholder(id, tokenNamespace, match);
  });
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (match, body: string, index: number) => {
    const id = `tf-math-block-${artifacts.length + 1}`;
    artifacts.push({
      id,
      kind: "math-block",
      source: body.trim(),
      html: renderMathBlock(id, body.trim(), katex),
      sourceFrom: index,
      sourceTo: index + match.length
    });
    return artifactPlaceholder(id, tokenNamespace, match);
  });
  return text.replace(/(^|[^\\$])\$([^\n$]+?)\$/g, (match, prefix: string, body: string) => {
    const id = `tf-inline-math-${inlineMath.length + 1}`;
    inlineMath.push({ id, source: body.trim(), html: inlineMathToken(id, tokenNamespace) });
    return `${prefix}${inlineMathToken(id, tokenNamespace)}`;
  });
}

function replaceInlineMath(source: string, inlineMath: InlineMathArtifact[], katex: KatexRenderer, tokenNamespace: string): string {
  let text = source;
  inlineMath.forEach((item) => {
    let html = "";
    try {
      html = katex.renderToString(item.source, { throwOnError: false, displayMode: false });
    } catch {
      html = `<code>${escapeHtml(item.source)}</code>`;
    }
    item.html = html;
    text = text.replaceAll(inlineMathToken(item.id, tokenNamespace), item.id);
  });
  return text;
}

function restoreMarkdownArtifacts(rendered: string, artifacts: MarkdownArtifact[], inlineMath: InlineMathArtifact[], tokenNamespace: string): string {
  let html = rendered;
  artifacts.forEach((artifact) => {
    const artifactHtml = withSourceRangeAttributes(artifact.html, artifact.sourceFrom, artifact.sourceTo);
    html = html.replaceAll(`<p>${artifactToken(artifact.id, tokenNamespace)}</p>`, artifactHtml);
    html = html.replaceAll(artifactToken(artifact.id, tokenNamespace), artifactHtml);
  });
  inlineMath.forEach((item) => {
    html = html.replaceAll(item.id, item.html);
  });
  return html;
}

async function resolveWorkspaceImageTokens(
  tokens: MarkdownRuntimeToken[],
  baseFileId: string | undefined,
  context: Parameters<NonNullable<TextForgePlugin["transformers"]>[number]["transform"]>[1]
): Promise<void> {
  if (!baseFileId) {
    return;
  }
  for (const token of tokens) {
    if (token.type === "image") {
      const source = token.attrGet("src");
      if (source) {
        const resolved = await resolveMarkdownImageSource(context.workspace, source, baseFileId);
        if (resolved) {
          token.attrSet("src", resolved.url);
          token.attrSet("data-workspace-path", resolved.path);
          token.attrSet("loading", "lazy");
        }
      }
    }
    if (token.children?.length) {
      await resolveWorkspaceImageTokens(token.children, baseFileId, context);
    }
  }
}

async function renderDiagramArtifact(
  kind: "mermaid" | "graphviz",
  id: string,
  source: string,
  context: Parameters<NonNullable<TextForgePlugin["transformers"]>[number]["transform"]>[1]
): Promise<string> {
  try {
    const svg = kind === "mermaid" ? await renderMermaid(source, id, context) : await renderGraphviz(source, context);
    return artifactShell(id, kind, source, cleanSvg(svg));
  } catch (error) {
    return artifactShell(id, kind, source, `<pre>${escapeHtml(error instanceof Error ? error.message : String(error))}</pre>`);
  }
}

async function renderMermaid(source: string, id: string, context: Parameters<NonNullable<TextForgePlugin["transformers"]>[number]["transform"]>[1]): Promise<string> {
  await context.runtime.load("mermaid", () => Promise.resolve(mermaid));
  return renderMermaidSvg(`textforge-md-${id}`, source);
}

async function renderGraphviz(source: string, context: Parameters<NonNullable<TextForgePlugin["transformers"]>[number]["transform"]>[1]): Promise<string> {
  const runtime = await context.runtime.load("@viz-js/viz", () => viz.instance());
  return runtime.renderSVGElement(source).outerHTML;
}

function renderMathBlock(
  id: string,
  source: string,
  katex: KatexRenderer
): string {
  try {
    return `<div class="tf-math-block" data-artifact-id="${id}">${katex.renderToString(source, { throwOnError: false, displayMode: true })}</div>`;
  } catch {
    return `<pre>${escapeHtml(source)}</pre>`;
  }
}

function artifactShell(id: string, kind: string, source: string, body: string): string {
  const encodedSource = encodeURIComponent(source);
  return `<div class="tf-embedded-artifact tf-source-bridge" data-artifact-kind="${kind}" data-artifact-id="${id}" data-source="${encodedSource}">
    <div class="tf-artifact-toolbar" style="display:none">
      <span>${escapeHtml(kind)}</span>
      <button type="button" data-artifact-action="copy-source">Copy source</button>
      <button type="button" data-artifact-action="copy-svg">Copy SVG</button>
      <button type="button" data-artifact-action="download-svg">Download SVG</button>
      <button type="button" data-artifact-action="download-png">Download PNG</button>
      <button type="button" data-artifact-action="popout-svg">Pop out</button>
      <button type="button" data-artifact-action="fit-view">Fit</button>
    </div>
    <div class="tf-artifact-body">${body}</div>
  </div>`;
}

function artifactToken(id: string, tokenNamespace: string): string {
  return `TEXTFORGE_ARTIFACT__${tokenNamespace}__${id}__`;
}

function artifactPlaceholder(id: string, tokenNamespace: string, original: string): string {
  const token = artifactToken(id, tokenNamespace);
  const lineCount = Math.max(1, original.split(/\r?\n/).length);
  return `${token}${"\n".repeat(lineCount - 1)}`;
}

function withSourceRangeAttributes(html: string, sourceFrom: number, sourceTo: number): string {
  return html.replace(/^<([a-z0-9-]+)([^>]*)>/i, (_match, tagName: string, attrs: string) => {
    const classMatch = /\bclass\s*=\s*"([^"]*)"/i.exec(attrs);
    const nextAttrs = classMatch
      ? attrs.replace(
          /\bclass\s*=\s*"([^"]*)"/i,
          (_classMatch, classes: string) => {
            const nextClasses = classes.includes("tf-source-bridge") ? classes : `${classes} tf-source-bridge`;
            return `class="${nextClasses.trim()}"`;
          }
        )
      : `${attrs} class="tf-source-bridge"`;
    return `<${tagName}${nextAttrs} data-source-from="${sourceFrom}" data-source-to="${sourceTo}">`;
  });
}

function inlineMathToken(id: string, tokenNamespace: string): string {
  return `TEXTFORGE_INLINE_MATH__${tokenNamespace}__${id}__`;
}

function cleanSvg(svg: string): string {
  return svg.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*')/gi, "");
}

async function replaceAsync(
  source: string,
  pattern: RegExp,
  replacer: (meta: { match: string; index: number }, ...args: string[]) => Promise<string>
): Promise<string> {
  const matches = Array.from(source.matchAll(pattern));
  let cursor = 0;
  let output = "";
  for (const match of matches) {
    const replacement = await replacer({ match: match[0], index: match.index || 0 }, ...(match.slice(1) as string[]));
    output += source.slice(cursor, match.index);
    output += replacement;
    cursor = (match.index || 0) + match[0].length;
  }
  return output + source.slice(cursor);
}

function createTokenNamespace(): string {
  markdownTokenNamespaceCounter += 1;
  return `ns-${markdownTokenNamespaceCounter.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function highlightCode(source: string, languageName: string): string {
  try {
    return languageName && hljs.getLanguage(languageName)
      ? hljs.highlight(source, { language: languageName, ignoreIllegals: true }).value
      : hljs.highlightAuto(source).value;
  } catch {
    return escapeHtml(source);
  }
}

function lineOffsets(text: string): number[] {
  const offsets = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "\n") {
      offsets.push(index + 1);
    }
  }
  return offsets;
}

function lineOffsetAt(offsets: number[], line: number | undefined, fallback = 0): number {
  if (typeof line !== "number") {
    return fallback;
  }
  if (line < 0) {
    return offsets[0] || 0;
  }
  if (line >= offsets.length) {
    return fallback;
  }
  return offsets[line] ?? fallback;
}
