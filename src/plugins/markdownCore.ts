import type { TextForgePlugin } from "../domain/types";
import { extractMarkdownHeadingTree } from "../parsers/markdown";
import { escapeHtml } from "../parsers/source";
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
        const [mod, katexMod, hljsMod] = await Promise.all([
          context.runtime.load("markdown-it", () => import("markdown-it")),
          context.runtime.load("katex", () => import("katex")),
          context.runtime.load("highlight.js", () => import("highlight.js"))
        ]);
        const MarkdownIt = mod.default;
        const katex = katexMod.default;
        const hljs = hljsMod.default;
        const artifacts: MarkdownArtifact[] = [];
        const inlineMath: InlineMathArtifact[] = [];
        const prepared = await extractMarkdownArtifacts(value.text, artifacts, inlineMath, context, katex);
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
        const rendered = markdown.render(replaceInlineMath(prepared, inlineMath, katex));
        return {
          kind: "html",
          html: `<article class="rendered-markdown">${restoreMarkdownArtifacts(rendered, artifacts, inlineMath)}</article>`,
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
  katex: KatexRenderer
): Promise<string> {
  let text = source;
  text = await replaceAsync(text, /```(mermaid|dot|graphviz)\s*\r?\n([\s\S]*?)```/gi, async (_match, lang: string, body: string) => {
    const kind = lang.toLowerCase() === "mermaid" ? "mermaid" : "graphviz";
    const id = `tf-artifact-${artifacts.length + 1}`;
    const html = await renderDiagramArtifact(kind, id, body.trim(), context);
    artifacts.push({ id, kind, source: body.trim(), html });
    return `\n\n${artifactToken(id)}\n\n`;
  });
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_match, body: string) => {
    const id = `tf-math-block-${artifacts.length + 1}`;
    artifacts.push({
      id,
      kind: "math-block",
      source: body.trim(),
      html: renderMathBlock(id, body.trim(), katex)
    });
    return `\n\n${artifactToken(id)}\n\n`;
  });
  return text.replace(/(^|[^\\$])\$([^\n$]+?)\$/g, (match, prefix: string, body: string) => {
    const id = `tf-inline-math-${inlineMath.length + 1}`;
    inlineMath.push({ id, source: body.trim(), html: inlineMathToken(id) });
    return `${prefix}${inlineMathToken(id)}`;
  });
}

function replaceInlineMath(source: string, inlineMath: InlineMathArtifact[], katex: KatexRenderer): string {
  let text = source;
  inlineMath.forEach((item) => {
    let html = "";
    try {
      html = katex.renderToString(item.source, { throwOnError: false, displayMode: false });
    } catch {
      html = `<code>${escapeHtml(item.source)}</code>`;
    }
    item.html = html;
    text = text.replaceAll(inlineMathToken(item.id), item.id);
  });
  return text;
}

function restoreMarkdownArtifacts(rendered: string, artifacts: MarkdownArtifact[], inlineMath: InlineMathArtifact[]): string {
  let html = rendered;
  artifacts.forEach((artifact) => {
    html = html.replaceAll(`<p>${artifactToken(artifact.id)}</p>`, artifact.html);
    html = html.replaceAll(artifactToken(artifact.id), artifact.html);
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
  const mod = await context.runtime.load("mermaid", () => import("mermaid"));
  const mermaid = mod.default;
  mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });
  const rendered = await mermaid.render(`textforge-md-${id}`, source);
  return rendered.svg;
}

async function renderGraphviz(source: string, context: Parameters<NonNullable<TextForgePlugin["transformers"]>[number]["transform"]>[1]): Promise<string> {
  const mod = await context.runtime.load("@viz-js/viz", () => import("@viz-js/viz"));
  const viz = await mod.instance();
  return viz.renderSVGElement(source).outerHTML;
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
    <div class="tf-artifact-toolbar">
      <span>${escapeHtml(kind)}</span>
      <button type="button" data-artifact-action="copy-source">Copy source</button>
      <button type="button" data-artifact-action="copy-svg">Copy SVG</button>
      <button type="button" data-artifact-action="download-svg">Download SVG</button>
      <button type="button" data-artifact-action="download-png">Download PNG</button>
      <button type="button" data-artifact-action="popout-svg">Pop out</button>
      <button type="button" data-artifact-action="reset-view">Reset</button>
    </div>
    <div class="tf-artifact-body">${body}</div>
  </div>`;
}

function artifactToken(id: string): string {
  return `TEXTFORGE_ARTIFACT_${id}`;
}

function inlineMathToken(id: string): string {
  return `TEXTFORGE_INLINE_MATH_${id}`;
}

function cleanSvg(svg: string): string {
  return svg.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*')/gi, "");
}

async function replaceAsync(source: string, pattern: RegExp, replacer: (...args: string[]) => Promise<string>): Promise<string> {
  const matches = Array.from(source.matchAll(pattern));
  const replacements = await Promise.all(matches.map((match) => replacer(...(match as unknown as string[]))));
  let cursor = 0;
  let output = "";
  matches.forEach((match, index) => {
    output += source.slice(cursor, match.index);
    output += replacements[index];
    cursor = (match.index || 0) + match[0].length;
  });
  return output + source.slice(cursor);
}
