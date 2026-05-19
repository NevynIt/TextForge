import type { TextForgePlugin } from "../domain/types";
import { extractMarkdownHeadingTree } from "../parsers/markdown";
import { escapeHtml } from "../parsers/source";
import MarkdownIt from "markdown-it";
import katex from "katex";
import hljs from "highlight.js";
import mermaid from "mermaid";
import * as viz from "@viz-js/viz";
import { renderMermaidSvg } from "./renderMermaidSvg";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github.css";

interface MarkdownArtifact {
  id: string;
  kind: "mermaid" | "graphviz" | "math-block";
  source: string;
  html: string;
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
          typographer: true,
          highlight(source: string, language: string) {
            const languageName = (language || "").toLowerCase();
            try {
              const highlighted = languageName && hljs.getLanguage(languageName)
                ? hljs.highlight(source, { language: languageName, ignoreIllegals: true }).value
                : hljs.highlightAuto(source).value;
              return `<pre class="hljs"><code>${highlighted}</code></pre>`;
            } catch {
              return `<pre><code>${escapeHtml(source)}</code></pre>`;
            }
          }
        });
        const rendered = markdown.render(replaceInlineMath(prepared, inlineMath, katex, tokenNamespace));
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
  text = await replaceAsync(text, /```(mermaid|dot|graphviz)\s*\r?\n([\s\S]*?)```/gi, async (_match, lang: string, body: string) => {
    const kind = lang.toLowerCase() === "mermaid" ? "mermaid" : "graphviz";
    const id = `tf-artifact-${artifacts.length + 1}`;
    const html = await renderDiagramArtifact(kind, id, body.trim(), context);
    artifacts.push({ id, kind, source: body.trim(), html });
    return `\n\n${artifactToken(id, tokenNamespace)}\n\n`;
  });
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_match, body: string) => {
    const id = `tf-math-block-${artifacts.length + 1}`;
    artifacts.push({
      id,
      kind: "math-block",
      source: body.trim(),
      html: renderMathBlock(id, body.trim(), katex)
    });
    return `\n\n${artifactToken(id, tokenNamespace)}\n\n`;
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
    html = html.replaceAll(`<p>${artifactToken(artifact.id, tokenNamespace)}</p>`, artifact.html);
    html = html.replaceAll(artifactToken(artifact.id, tokenNamespace), artifact.html);
  });
  inlineMath.forEach((item) => {
    html = html.replaceAll(item.id, item.html);
  });
  return html;
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
  return `<div class="tf-embedded-artifact" data-artifact-kind="${kind}" data-artifact-id="${id}" data-source="${encodedSource}">
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

function inlineMathToken(id: string, tokenNamespace: string): string {
  return `TEXTFORGE_INLINE_MATH__${tokenNamespace}__${id}__`;
}

function cleanSvg(svg: string): string {
  return svg.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*')/gi, "");
}

async function replaceAsync(source: string, pattern: RegExp, replacer: (...args: string[]) => Promise<string>): Promise<string> {
  const matches = Array.from(source.matchAll(pattern));
  let cursor = 0;
  let output = "";
  for (const match of matches) {
    const replacement = await replacer(...(match as unknown as string[]));
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
