import MarkdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItFootnote from 'markdown-it-footnote';
import markdownItKatex from 'markdown-it-katex';

import { createMarkdownDiagnostic, escapeHtml, slugifyHeading } from './support.js';

export function replaceInlineStyleSpans(source) {
  return source.replace(/\[([^\]]+)\]\{((?:\s*\.[A-Za-z][A-Za-z0-9_-]*)+)\}/g, (_match, text, classes) => {
    const className = classes
      .trim()
      .split(/\s+/)
      .map((value) => value.replace(/^\./, ''))
      .join(' ');
    return `<span class="${escapeHtml(className)}">${escapeHtml(text)}</span>`;
  });
}

function extractTrailingAttributes(content) {
  const match = content.match(/\s*\{([^}]+)\}\s*$/);
  if (!match) {
    return undefined;
  }

  const attributes = match[1].trim().split(/\s+/);
  const anchor = attributes.find((attribute) => attribute.startsWith('#'))?.slice(1);
  const classes = attributes
    .filter((attribute) => attribute.startsWith('.'))
    .map((attribute) => attribute.slice(1));
  if (!anchor && classes.length === 0) {
    return undefined;
  }

  return {
    marker: match[0],
    content: content.slice(0, content.length - match[0].length).trimEnd(),
    anchor,
    classes,
    rawAttributes: attributes,
  };
}

function stripTrailingMarkerFromChildren(children, marker) {
  if (!Array.isArray(children)) {
    return;
  }

  for (let index = children.length - 1; index >= 0; index -= 1) {
    const child = children[index];
    if (child.type === 'text' && child.content.endsWith(marker)) {
      child.content = child.content.slice(0, child.content.length - marker.length).trimEnd();
      break;
    }
  }
}

export function createMarkdownItEnvironment(baseEnvironment) {
  return {
    diagnostics: [...(baseEnvironment.diagnostics ?? [])],
    referencedAssets: [...(baseEnvironment.referencedAssets ?? [])],
    generatedResources: [...(baseEnvironment.generatedResources ?? [])],
    sourceResource: baseEnvironment.sourceResource,
    resolveAssetReference: baseEnvironment.resolveAssetReference,
  };
}

export function createMarkdownProcessor() {
  const markdown = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
  });
  markdown.use(markdownItFootnote);
  markdown.use(markdownItAnchor, {
    slugify: slugifyHeading,
  });
  markdown.use(markdownItKatex);

  markdown.core.ruler.after('inline', 'tfmd-attributes', (state) => {
    const env = state.env;
    for (let index = 0; index < state.tokens.length; index += 1) {
      const inlineToken = state.tokens[index];
      if (inlineToken.type !== 'inline') {
        continue;
      }

      const openToken = state.tokens[index - 1];
      if (!openToken || (openToken.type !== 'heading_open' && openToken.type !== 'paragraph_open')) {
        continue;
      }

      const extracted = extractTrailingAttributes(inlineToken.content);
      if (!extracted) {
        continue;
      }

      inlineToken.content = extracted.content;
      stripTrailingMarkerFromChildren(inlineToken.children, extracted.marker);
      if (extracted.anchor) {
        if (openToken.type === 'heading_open') {
          openToken.attrSet('id', extracted.anchor);
        } else {
          env.diagnostics.push(createMarkdownDiagnostic(
            'tfmd.anchor.paragraph-unsupported',
            `Paragraph attribute anchors are not supported in the TF-MD baseline: ${extracted.anchor}`,
            'warning',
          ));
        }
      }

      if (extracted.classes.length > 0) {
        openToken.attrJoin('class', extracted.classes.join(' '));
      }
    }
  });

  const defaultImageRenderer = markdown.renderer.rules.image ?? ((tokens, idx, options, env, self) =>
    self.renderToken(tokens, idx, options));
  markdown.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const href = token.attrGet('src') ?? '';
    const resolved = env.resolveAssetReference?.({
      sourceResource: env.sourceResource,
      href,
    });
    if (resolved?.resolvedSrc) {
      token.attrSet('src', resolved.resolvedSrc);
      env.referencedAssets.push(resolved);
    } else {
      env.diagnostics.push(createMarkdownDiagnostic(
        'tfmd.asset.unresolved',
        `Unable to resolve Markdown asset reference: ${href}`,
        'warning',
        {
          origin: {
            subsystem: 'asset-resolution',
          },
        },
      ));
    }

    return defaultImageRenderer(tokens, idx, options, env, self);
  };

  return markdown;
}
