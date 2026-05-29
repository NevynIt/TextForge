import assert from 'node:assert/strict';
import test from 'node:test';

import {
  activateMarkdownPreviewLink,
  resolveMarkdownPreviewLinkTarget,
} from '../src/markdownPreviewLinks.js';

function createWorkspace(entries) {
  const entryByPath = new Map(entries.map((entry) => [entry.path, entry]));
  return {
    getEntryByPath(path) {
      return entryByPath.get(path);
    },
  };
}

test('resolveMarkdownPreviewLinkTarget resolves relative, bare sibling, and repository-qualified markdown links', () => {
  const workspace = createWorkspace([
    {
      id: 'guide',
      kind: 'resource',
      representation: 'text',
      path: '/docs/guides/guide.md',
    },
    {
      id: 'minimal-local',
      kind: 'resource',
      representation: 'text',
      path: '/docs/examples/markdown-minimal.md',
    },
    {
      id: 'minimal',
      kind: 'resource',
      representation: 'text',
      path: '/.textforge/resources/docs/examples/markdown-minimal.md',
    },
  ]);

  const relative = resolveMarkdownPreviewLinkTarget({
    href: '../guides/guide.md#intro',
    sourceResourcePath: '/docs/examples/phase-4.md',
    workspace,
  });
  const bareSibling = resolveMarkdownPreviewLinkTarget({
    href: 'markdown-minimal.md',
    sourceResourcePath: '/docs/examples/phase-4.md',
    workspace,
  });
  const repositoryQualified = resolveMarkdownPreviewLinkTarget({
    href: 'bundled://docs/examples/markdown-minimal.md',
    sourceResourcePath: '/docs/examples/phase-4.md',
    workspace,
  });

  assert.equal(relative.kind, 'resource');
  assert.equal(relative.entry.path, '/docs/guides/guide.md');
  assert.equal(relative.fragment, 'intro');
  assert.equal(bareSibling.kind, 'resource');
  assert.equal(bareSibling.entry.path, '/docs/examples/markdown-minimal.md');
  assert.equal(repositoryQualified.kind, 'resource');
  assert.equal(repositoryQualified.entry.path, '/.textforge/resources/docs/examples/markdown-minimal.md');
});

test('activateMarkdownPreviewLink opens resolved resources and reports misses without throwing', () => {
  const workspace = createWorkspace([
    {
      id: 'guide',
      kind: 'resource',
      representation: 'text',
      path: '/docs/guides/guide.md',
    },
  ]);
  const opened = [];
  const misses = [];

  const openedResult = activateMarkdownPreviewLink({
    href: './guide.md',
    openResourceEntry(entry, options) {
      opened.push({
        entry,
        options,
      });
    },
    placement: 'popup',
    sourceResourcePath: '/docs/guides/index.md',
    workspace,
  });
  const missingResult = activateMarkdownPreviewLink({
    href: './missing.md',
    onMissingTarget(target) {
      misses.push(target.href);
    },
    sourceResourcePath: '/docs/guides/index.md',
    workspace,
  });

  assert.equal(openedResult.status, 'opened');
  assert.deepEqual(opened, [{
    entry: {
      id: 'guide',
      kind: 'resource',
      representation: 'text',
      path: '/docs/guides/guide.md',
    },
    options: {
      placement: 'popup',
    },
  }]);
  assert.equal(missingResult.status, 'missing');
  assert.deepEqual(misses, ['./missing.md']);
});

test('activateMarkdownPreviewLink leaves same-document fragment links alone', () => {
  const result = activateMarkdownPreviewLink({
    href: '#section-1',
    sourceResourcePath: '/docs/guides/index.md',
    workspace: createWorkspace([]),
  });

  assert.equal(result.handled, false);
  assert.equal(result.resolvedTarget.kind, 'fragment');
});
