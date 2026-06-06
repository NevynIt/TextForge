import { createMarkdownDiagnostic, tfmdFenceAliases } from './support.js';

function parseScalar(value) {
  const trimmed = String(value ?? '').trim();
  if (trimmed === 'true') {
    return true;
  }

  if (trimmed === 'false') {
    return false;
  }

  if (trimmed === 'null') {
    return null;
  }

  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith('\'') && trimmed.endsWith('\''))) {
    return trimmed.slice(1, -1);
  }

  const asNumber = Number(trimmed);
  if (!Number.isNaN(asNumber) && trimmed !== '') {
    return asNumber;
  }

  return trimmed;
}

function parseStructuredBlock(blockSource) {
  const object = {};
  for (const rawLine of blockSource.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const separator = line.indexOf(':');
    if (separator <= 0) {
      throw new Error(`Invalid structured TF-MD line: ${line}`);
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    object[key] = parseScalar(value);
  }
  return object;
}

function parseControlBlock(blockSource, diagnostics) {
  const metadata = {};
  const styles = {};
  const requirements = [];
  const lines = blockSource.split(/\r?\n/);
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    index += 1;
    if (!line) {
      continue;
    }

    if (!line.startsWith('%')) {
      diagnostics.push(createMarkdownDiagnostic(
        'tfmd.directive.invalid-line',
        `Invalid TF-MD directive line: ${line}`,
        'error',
      ));
      continue;
    }

    const match = line.match(/^%([A-Za-z][A-Za-z0-9_-]*)(?:\s+([^{]+?))?\s*(\{)?\s*$/);
    if (!match) {
      diagnostics.push(createMarkdownDiagnostic(
        'tfmd.directive.invalid-syntax',
        `Invalid TF-MD directive syntax: ${line}`,
        'error',
      ));
      continue;
    }

    const [, directiveName, directiveValue = '', opensBlock] = match;
    let blockContent = '';
    if (opensBlock) {
      while (index < lines.length) {
        const blockLine = lines[index];
        index += 1;
        if (blockLine.trim() === '}') {
          break;
        }
        blockContent += `${blockLine}\n`;
      }
    }

    try {
      switch (directiveName) {
        case 'metadata':
          Object.assign(metadata, parseStructuredBlock(blockContent));
          break;
        case 'style': {
          const selector = directiveValue.trim();
          if (!selector.startsWith('.')) {
            throw new Error(`Unsupported TF-MD style selector: ${selector || '(empty)'}`);
          }

          const styleName = selector.slice(1);
          styles[styleName] = {
            ...(styles[styleName] ?? {}),
            ...parseStructuredBlock(blockContent),
          };
          break;
        }
        case 'require': {
          const [name, versionRange] = directiveValue.trim().split(/\s+/, 2);
          if (!name) {
            throw new Error('A %require directive must name a capability.');
          }

          requirements.push({
            name,
            versionRange,
            source: 'document',
          });
          break;
        }
        default:
          diagnostics.push(createMarkdownDiagnostic(
            'tfmd.directive.unsupported',
            `Unsupported TF-MD directive: %${directiveName}`,
            'warning',
            {
              origin: {
                directive: directiveName,
              },
            },
          ));
          break;
      }
    } catch (error) {
      diagnostics.push(createMarkdownDiagnostic(
        'tfmd.directive.parse-failed',
        error?.message ?? `Failed to parse %${directiveName}`,
        'error',
        {
          origin: {
            directive: directiveName,
          },
        },
      ));
    }
  }

  return {
    metadata,
    requirements,
    styles,
  };
}

export function scanTfmdBlocks(source) {
  const diagnostics = [];
  const metadata = {};
  const requirements = [];
  const styles = {};
  const fencePattern = /```([^\n]+)\r?\n([\s\S]*?)\r?\n```/g;
  let lastIndex = 0;
  let stripped = '';
  for (const match of source.matchAll(fencePattern)) {
    const [rawBlock, infoString, blockBody] = match;
    const normalizedInfo = infoString.trim().toLowerCase();
    const blockIndex = match.index ?? 0;
    stripped += source.slice(lastIndex, blockIndex);
    lastIndex = blockIndex + rawBlock.length;
    if (!tfmdFenceAliases.includes(normalizedInfo)) {
      stripped += rawBlock;
      continue;
    }

    const parsed = parseControlBlock(blockBody, diagnostics);
    Object.assign(metadata, parsed.metadata);
    requirements.push(...parsed.requirements);
    for (const [styleName, styleRules] of Object.entries(parsed.styles)) {
      styles[styleName] = {
        ...(styles[styleName] ?? {}),
        ...styleRules,
      };
    }
    stripped += '\n';
  }

  stripped += source.slice(lastIndex);
  return {
    source: stripped,
    metadata,
    requirements,
    styles,
    diagnostics,
  };
}

export function parseMarkdownCapabilityRequirements(source = '') {
  return scanTfmdBlocks(source).requirements;
}

export function createTfmdStyleSheet(styles) {
  return Object.entries(styles)
    .map(([styleName, properties]) => {
      const declarations = Object.entries(properties)
        .map(([key, value]) => `${key}: ${String(value)};`)
        .join(' ');
      return `.tfmd-preview .${styleName} { ${declarations} }`;
    })
    .join('\n');
}
