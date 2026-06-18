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
  const keyValues = attributes
    .filter((attribute) => /^[A-Za-z_:][A-Za-z0-9_:.-]*=/.test(attribute))
    .map((attribute) => {
      const separator = attribute.indexOf('=');
      return {
        key: attribute.slice(0, separator),
        value: attribute.slice(separator + 1).replace(/^['"]|['"]$/g, ''),
      };
    })
    .filter((attribute) =>
      !/^on/i.test(attribute.key)
      && attribute.key.toLowerCase() !== 'style');
  if (!anchor && classes.length === 0 && keyValues.length === 0) {
    return undefined;
  }

  return {
    marker: match[0],
    content: content.slice(0, content.length - match[0].length).trimEnd(),
    anchor,
    classes,
    keyValues,
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
    explicitAnchors: new Set(),
    profile: baseEnvironment.profile ?? 'markdown',
    sourceResource: baseEnvironment.sourceResource,
    resolveAssetReference: baseEnvironment.resolveAssetReference,
  };
}

function applyMdppSemanticClasses(openToken) {
  switch (openToken.type) {
    case 'heading_open':
      openToken.attrJoin('class', 'mdpp-heading');
      openToken.attrSet('data-md-level', openToken.tag.replace(/^h/u, ''));
      break;
    case 'paragraph_open':
      openToken.attrJoin('class', 'mdpp-paragraph');
      break;
    case 'bullet_list_open':
    case 'ordered_list_open':
      openToken.attrJoin('class', 'mdpp-list');
      break;
    case 'list_item_open':
      openToken.attrJoin('class', 'mdpp-list-item');
      break;
    case 'table_open':
      openToken.attrJoin('class', 'mdpp-table');
      break;
    case 'thead_open':
      openToken.attrJoin('class', 'mdpp-table-head');
      break;
    case 'tbody_open':
      openToken.attrJoin('class', 'mdpp-table-body');
      break;
    case 'tr_open':
      openToken.attrJoin('class', 'mdpp-table-row');
      break;
    case 'th_open':
      openToken.attrJoin('class', 'mdpp-table-cell mdpp-table-header-cell');
      break;
    case 'td_open':
      openToken.attrJoin('class', 'mdpp-table-cell mdpp-table-data-cell');
      break;
    default:
      break;
  }
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
      if (env.profile === 'mdpp') {
        applyMdppSemanticClasses(state.tokens[index]);
      }

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
        const duplicateMdppAnchor = env.profile === 'mdpp' && env.explicitAnchors.has(extracted.anchor);
        if (duplicateMdppAnchor) {
          env.diagnostics.push(createMarkdownDiagnostic(
            'MDPP0006',
            `Duplicate md++ explicit anchor: ${extracted.anchor}`,
            'error',
            {
              origin: {
                subsystem: 'mdpp',
                anchor: extracted.anchor,
              },
            },
          ));
        }

        if (!duplicateMdppAnchor) {
          env.explicitAnchors.add(extracted.anchor);
        }

        if (!duplicateMdppAnchor && (openToken.type === 'heading_open' || env.profile === 'mdpp')) {
          openToken.attrSet('id', extracted.anchor);
        } else if (!duplicateMdppAnchor) {
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

      if (env.profile === 'mdpp') {
        for (const attribute of extracted.keyValues) {
          openToken.attrSet(attribute.key, attribute.value);
        }
      }
    }
  });

  const defaultImageRenderer = markdown.renderer.rules.image ?? ((tokens, idx, options, env, self) =>
    self.renderToken(tokens, idx, options));
  markdown.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const href = token.attrGet('src') ?? '';
    if (env.profile === 'mdpp') {
      token.attrJoin('class', 'mdpp-image');
    }
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

  const defaultFenceRenderer = markdown.renderer.rules.fence ?? ((tokens, idx, options, env, self) =>
    self.renderToken(tokens, idx, options));
  markdown.renderer.rules.fence = (tokens, idx, options, env, self) => {
    if (env.profile !== 'mdpp') {
      return defaultFenceRenderer(tokens, idx, options, env, self);
    }
    const token = tokens[idx];
    const language = token.info.trim().split(/\s+/, 1)[0] ?? '';
    const escapedContent = escapeHtml(token.content);
    return `<pre class="mdpp-code-block"${language ? ` data-md-language="${escapeHtml(language)}"` : ''}><code${language ? ` class="language-${escapeHtml(language)}"` : ''}>${escapedContent}</code></pre>\n`;
  };

  return markdown;
}
