import { createMarkdownDiagnostic, escapeHtml } from './support.js';

const mdppDirectivePattern = /^[ \t]{0,3}\[([^\]]+)\]:[ \t]*(.*)$/gm;
const repositoryQualifiedPattern = /^([A-Za-z][A-Za-z0-9_-]*):(.*)$/u;
const unsafeStylesheetPattern = /@import\b|url\s*\(\s*['"]?\s*(?:https?:|data:|javascript:)|expression\s*\(/iu;

function createMdppDiagnostic(code, message, severity = 'warning', overrides = {}) {
  return createMarkdownDiagnostic(code, message, severity, {
    ...overrides,
    origin: {
      subsystem: 'mdpp',
      ...overrides.origin,
    },
  });
}

function unquote(value) {
  const text = String(value ?? '').trim();
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.slice(1, -1);
  }
  return text;
}

function parseDirectiveValue(rawValue) {
  const value = String(rawValue ?? '').trim();
  if (!value) {
    return {
      destination: '',
      title: undefined,
      valid: true,
    };
  }

  if (value.startsWith('<')) {
    const end = value.indexOf('>');
    if (end < 0) {
      return {
        destination: value,
        title: undefined,
        valid: false,
      };
    }
    const rest = value.slice(end + 1).trim();
    return {
      destination: value.slice(1, end),
      title: rest ? unquote(rest) : undefined,
      valid: rest === '' || /^"[^"]*"$|^'[^']*'$/u.test(rest),
    };
  }

  const titleMatch = value.match(/^(\S+)(?:\s+("[^"]*"|'[^']*'))?$/u);
  if (!titleMatch) {
    return {
      destination: value,
      title: undefined,
      valid: false,
    };
  }

  return {
    destination: titleMatch[1],
    title: titleMatch[2] ? unquote(titleMatch[2]) : undefined,
    valid: true,
  };
}

function parseRequirement(directive) {
  const selector = directive.value;
  const scopedMatch = selector.match(/^([a-z0-9][a-z0-9-]*):(.+)$/u);
  const rawCapability = scopedMatch ? scopedMatch[2] : selector;
  const atIndex = rawCapability.indexOf('@');
  const name = atIndex >= 0 ? rawCapability.slice(0, atIndex) : rawCapability;
  const simpleRange = atIndex >= 0 ? rawCapability.slice(atIndex + 1) : undefined;
  const versionRange = directive.title ?? simpleRange;
  const diagnostics = [];

  if (directive.title && simpleRange) {
    diagnostics.push(createMdppDiagnostic(
      'MDPP0103',
      `Requirement '${selector}' contains both an @ range and a quoted range.`,
      'error',
      { origin: { directive: 'require' } },
    ));
  }

  return {
    requirement: {
      name,
      versionRange,
      source: 'document',
      mdpp: true,
      repositoryScope: scopedMatch?.[1],
    },
    diagnostics,
  };
}

function normalizeRepositoryName(name) {
  const normalized = String(name ?? '').trim();
  return /^[A-Za-z][A-Za-z0-9_-]*$/u.test(normalized) ? normalized : undefined;
}

function splitRepositoryQualifiedRef(ref) {
  const text = String(ref ?? '').trim();
  if (
    !text
    || text.startsWith('/')
    || text.startsWith('./')
    || text.startsWith('../')
    || /^[A-Za-z][A-Za-z0-9+.-]*:\/\//u.test(text)
  ) {
    return undefined;
  }
  const match = text.match(repositoryQualifiedPattern);
  if (!match) {
    return undefined;
  }
  return {
    repositoryName: match[1],
    path: match[2],
  };
}

function repositoryPathEscapes(path) {
  let depth = 0;
  for (const segment of String(path ?? '').replaceAll('\\', '/').split('/')) {
    if (!segment || segment === '.') {
      continue;
    }
    if (segment === '..') {
      depth -= 1;
      if (depth < 0) {
        return true;
      }
      continue;
    }
    depth += 1;
  }
  return false;
}

function collectMdppDirectives(source, options = {}) {
  const directives = [];
  const diagnostics = [];
  let strippedSource = '';
  let lastIndex = 0;

  for (const match of source.matchAll(mdppDirectivePattern)) {
    const raw = match[0];
    const rawLabel = match[1].trim();
    const rawValue = match[2] ?? '';
    const start = match.index ?? 0;
    strippedSource += source.slice(lastIndex, start);
    lastIndex = start + raw.length;

    if (!rawLabel.toLowerCase().startsWith('md:')) {
      strippedSource += raw;
      continue;
    }

    const parsedValue = parseDirectiveValue(rawValue);
    const name = rawLabel.slice(3);
    const line = source.slice(0, start).split(/\r?\n/u).length;
    const directive = {
      raw,
      label: rawLabel,
      name,
      value: parsedValue.destination,
      title: parsedValue.title,
      line,
      start,
      end: start + raw.length,
      sourcePath: options.path,
    };
    directives.push(directive);
    if (!parsedValue.valid) {
      diagnostics.push(createMdppDiagnostic(
        'MDPP0004',
        `Invalid md++ directive syntax: ${raw.trim()}`,
        'error',
        { file: options.path, line, origin: { directive: name } },
      ));
    }
  }

  strippedSource += source.slice(lastIndex);
  return {
    directives,
    diagnostics,
    source: strippedSource,
  };
}

function buildDirectiveSummary(directives) {
  const metadata = {};
  const requirements = [];
  const repositories = {};
  const includes = [];
  const themes = [];
  const stylesheets = [];
  const layouts = [];
  const diagnostics = [];

  for (const directive of directives) {
    switch (directive.name) {
      case 'profile':
        metadata.profile = directive.value;
        break;
      case 'profile-version':
        metadata.profileVersion = directive.value;
        break;
      case 'title':
        metadata.title = directive.value;
        break;
      case 'status':
        metadata.status = directive.value;
        break;
      case 'require': {
        const parsed = parseRequirement(directive);
        requirements.push(parsed.requirement);
        diagnostics.push(...parsed.diagnostics);
        break;
      }
      case 'include':
        includes.push(directive);
        break;
      case 'theme':
        themes.push(directive);
        break;
      case 'stylesheet':
        stylesheets.push(directive);
        break;
      case 'layout':
        layouts.push(directive);
        break;
      default:
        if (directive.name.startsWith('repository:')) {
          const repositoryName = normalizeRepositoryName(directive.name.slice('repository:'.length));
          if (!repositoryName) {
            diagnostics.push(createMdppDiagnostic(
              'MDPP0202',
              `Invalid md++ repository name in directive '${directive.label}'.`,
              'error',
              { file: directive.sourcePath, line: directive.line, origin: { directive: directive.name } },
            ));
            break;
          }
          const existing = repositories[repositoryName];
          if (existing) {
            diagnostics.push(createMdppDiagnostic(
              existing.location === directive.value ? 'MDPP0203' : 'MDPP0204',
              existing.location === directive.value
                ? `Repository '${repositoryName}' is declared more than once with the same target.`
                : `Repository '${repositoryName}' is declared more than once with different targets.`,
              existing.location === directive.value ? 'warning' : 'error',
              { file: directive.sourcePath, line: directive.line, origin: { repository: repositoryName } },
            ));
          }
          repositories[repositoryName] = {
            name: repositoryName,
            location: directive.value,
            sourcePath: directive.sourcePath,
            line: directive.line,
          };
        }
        break;
    }
  }

  for (const requirement of requirements) {
    if (requirement.repositoryScope && !repositories[requirement.repositoryScope]) {
      diagnostics.push(createMdppDiagnostic(
        'MDPP0104',
        `Requirement '${requirement.repositoryScope}:${requirement.name}' references an unknown md++ repository.`,
        'error',
        { origin: { directive: 'require', repository: requirement.repositoryScope } },
      ));
    }
  }

  return {
    metadata,
    requirements,
    repositories,
    includes,
    themes,
    stylesheets,
    layouts,
    diagnostics,
  };
}

function mergeRepositoryTables(...tables) {
  return Object.assign({}, ...tables);
}

async function readMdppResource(ref, role, context) {
  const qualified = splitRepositoryQualifiedRef(ref);
  if (qualified && repositoryPathEscapes(qualified.path)) {
    return {
      text: undefined,
      path: undefined,
      diagnostics: [createMdppDiagnostic(
        'MDPP0206',
        `Repository reference '${ref}' escapes above the repository root.`,
        'error',
        { origin: { repository: qualified.repositoryName, role } },
      )],
    };
  }

  const result = await context.resolveTextResource?.({
    ref,
    basePath: context.basePath,
    sourceResource: context.sourceResource,
    role,
    repositoryAliases: context.repositoryAliases,
  });
  if (!result) {
    return {
      text: undefined,
      path: undefined,
      diagnostics: [],
    };
  }
  return {
    text: result.text,
    path: result.path,
    mimeType: result.mimeType,
    diagnostics: result.diagnostics ?? [],
  };
}

async function expandIncludes(source, context, seen = []) {
  const scanned = collectMdppDirectives(source, { path: context.basePath });
  const summary = buildDirectiveSummary(scanned.directives);
  const repositoryAliases = {
    ...(context.repositoryAliases ?? {}),
    ...Object.fromEntries(Object.entries(summary.repositories).map(([name, repository]) => [name, repository.location])),
  };
  const diagnostics = [
    ...scanned.diagnostics,
    ...summary.diagnostics,
  ];
  const chunks = [];
  const directives = [...scanned.directives];
  let cursor = 0;
  const includesByStart = new Map(summary.includes.map((include) => [include.start, include]));

  for (const directive of scanned.directives) {
    chunks.push(source.slice(cursor, directive.start));
    cursor = directive.end;
    const include = includesByStart.get(directive.start);
    if (!include) {
      continue;
    }

    const resource = await readMdppResource(include.value, 'include', {
      ...context,
      repositoryAliases,
    });
    diagnostics.push(...resource.diagnostics);
    if (!resource.text) {
      diagnostics.push(createMdppDiagnostic(
        'MDPP0200',
        `Unable to resolve md++ include '${include.value}'.`,
        'warning',
        { file: include.sourcePath, line: include.line, origin: { directive: 'include' } },
      ));
      continue;
    }

    const includePath = resource.path ?? include.value;
    if (seen.includes(includePath)) {
      diagnostics.push(createMdppDiagnostic(
        'MDPP0201',
        `Circular md++ include detected for '${include.value}'.`,
        'error',
        { file: include.sourcePath, line: include.line, origin: { directive: 'include' } },
      ));
      continue;
    }

    const expanded = await expandIncludes(resource.text, {
      ...context,
      basePath: includePath,
      repositoryAliases,
    }, [...seen, includePath]);
    diagnostics.push(...expanded.diagnostics);
    directives.push(...expanded.directives);
    chunks.push(expanded.source);
  }

  const resolvedSummary = buildDirectiveSummary(directives);
  chunks.push(source.slice(cursor));
  return {
    source: chunks.join(''),
    diagnostics,
    directives,
    summary: {
      ...resolvedSummary,
      repositories: mergeRepositoryTables(context.repositories, resolvedSummary.repositories),
    },
    repositoryAliases,
  };
}

function parseThemeDeclarations(source) {
  const tokens = {};
  const classes = {};
  const components = {};
  let current = undefined;

  for (const rawLine of String(source ?? '').split(/\r?\n/u)) {
    const heading = rawLine.match(/^##\s+(.+)$/u);
    if (heading) {
      const title = heading[1].trim();
      const classMatch = title.match(/^class\s+(.+)$/u);
      const componentMatch = title.match(/^component\s+(.+)$/u);
      current = classMatch
        ? { kind: 'class', name: classMatch[1].trim() }
        : componentMatch
          ? { kind: 'component', name: componentMatch[1].trim() }
          : { kind: 'token', name: title };
      continue;
    }

    const declaration = rawLine.match(/^([A-Za-z0-9_.-]+):\s*(.+)$/u);
    if (!declaration || !current) {
      continue;
    }
    const [, key, value] = declaration;
    if (current.kind === 'class') {
      classes[current.name] = {
        ...(classes[current.name] ?? {}),
        [key]: value,
      };
    } else if (current.kind === 'component') {
      components[current.name] = {
        ...(components[current.name] ?? {}),
        [key]: value,
      };
    } else {
      tokens[current.name] = {
        ...(tokens[current.name] ?? {}),
        [key]: value,
      };
    }
  }

  return {
    tokens,
    classes,
    components,
  };
}

function cssDeclarations(properties) {
  return Object.entries(properties ?? {})
    .map(([key, value]) => `${key}: ${String(value)};`)
    .join(' ');
}

function createThemeStyleSheet(themes) {
  const declarations = [];
  const classRules = [];
  const componentRules = [];
  for (const theme of themes) {
    for (const [group, values] of Object.entries(theme.tokens ?? {})) {
      for (const [key, value] of Object.entries(values)) {
        declarations.push(`--mdpp-${group}-${key}: ${String(value)};`);
      }
    }
    for (const [className, properties] of Object.entries(theme.classes ?? {})) {
      classRules.push(`.mdpp-document .${className} { ${cssDeclarations(properties)} }`);
    }
    for (const [componentName, properties] of Object.entries(theme.components ?? {})) {
      const selector = componentName === 'table'
        ? '.mdpp-document table'
        : `.mdpp-document .mdpp-component-${componentName}`;
      componentRules.push(`${selector} { ${cssDeclarations(properties)} }`);
    }
  }
  return [
    declarations.length ? `.mdpp-document { ${declarations.join(' ')} }` : '',
    ...classRules,
    ...componentRules,
  ].filter(Boolean).join('\n');
}

async function loadPresentationResources(summary, context) {
  const diagnostics = [];
  const stylesheets = [];
  const themes = [];

  for (const directive of summary.themes) {
    const resource = await readMdppResource(directive.value, 'theme', context);
    diagnostics.push(...resource.diagnostics);
    if (!resource.text) {
      diagnostics.push(createMdppDiagnostic(
        'MDPP0400',
        `Unable to resolve md++ theme '${directive.value}'.`,
        'error',
        { file: directive.sourcePath, line: directive.line, origin: { directive: 'theme' } },
      ));
      continue;
    }
    themes.push({
      ref: directive.value,
      path: resource.path,
      ...parseThemeDeclarations(resource.text),
    });
  }

  for (const directive of summary.stylesheets) {
    const resource = await readMdppResource(directive.value, 'stylesheet', context);
    diagnostics.push(...resource.diagnostics);
    if (!resource.text || unsafeStylesheetPattern.test(resource.text)) {
      diagnostics.push(createMdppDiagnostic(
        'MDPP0401',
        resource.text
          ? `md++ stylesheet '${directive.value}' contains unsupported unsafe CSS.`
          : `Unable to resolve md++ stylesheet '${directive.value}'.`,
        'error',
        { file: directive.sourcePath, line: directive.line, origin: { directive: 'stylesheet' } },
      ));
      continue;
    }
    stylesheets.push({
      ref: directive.value,
      path: resource.path,
      css: resource.text,
    });
  }

  return {
    diagnostics,
    themes,
    stylesheets,
    styleSheet: [
      createThemeStyleSheet(themes),
      ...stylesheets.map((stylesheet) => stylesheet.css),
    ].filter(Boolean).join('\n'),
  };
}

export function scanMdppDirectives(source, options = {}) {
  const scanned = collectMdppDirectives(source, options);
  const summary = buildDirectiveSummary(scanned.directives);
  return {
    ...scanned,
    ...summary,
    diagnostics: [
      ...scanned.diagnostics,
      ...summary.diagnostics,
    ],
  };
}

export async function preprocessMdppDocument(source, options = {}) {
  const firstScan = scanMdppDirectives(source, { path: options.resource?.path });
  const isMdpp = firstScan.metadata.profile === 'md++';
  if (!isMdpp) {
    return {
      profile: 'markdown',
      source,
      metadata: {},
      requirements: [],
      diagnostics: [],
      styleSheet: '',
      mdpp: undefined,
    };
  }

  const rootPath = options.resource?.path;
  const expanded = await expandIncludes(source, {
    basePath: rootPath,
    sourceResource: options.resource,
    resolveTextResource: options.resolveTextResource,
    repositoryAliases: {},
    repositories: {},
  }, rootPath ? [rootPath] : []);
  const repositoryAliases = {
    ...expanded.repositoryAliases,
    ...Object.fromEntries(Object.entries(expanded.summary.repositories).map(([name, repository]) => [name, repository.location])),
  };
  const presentation = await loadPresentationResources(expanded.summary, {
    basePath: rootPath,
    sourceResource: options.resource,
    resolveTextResource: options.resolveTextResource,
    repositoryAliases,
  });

  return {
    profile: 'mdpp',
    source: expanded.source,
    metadata: expanded.summary.metadata,
    requirements: expanded.summary.requirements,
    diagnostics: [
      ...expanded.diagnostics,
      ...presentation.diagnostics,
    ],
    styleSheet: presentation.styleSheet,
    mdpp: {
      directives: expanded.directives,
      repositories: expanded.summary.repositories,
      includedResources: [],
      stylesheets: presentation.stylesheets,
      themes: presentation.themes,
      layouts: expanded.summary.layouts.map((directive) => ({
        ref: directive.value,
        line: directive.line,
      })),
      models: [],
    },
  };
}

export function createMdppModelStyleSheet(models = []) {
  if (!models.length) {
    return '';
  }
  return `/* md++ models: ${escapeHtml(models.map((model) => model.name).join(', '))} */`;
}
