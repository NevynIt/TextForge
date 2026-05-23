const contributionPacks = [
  {
    id: '@textforge/core',
    kind: 'core',
    label: 'Core contracts',
    status: 'registered',
    detail: 'Diagnostics, resources, commands, and canonical patch placeholders.',
  },
  {
    id: '@textforge/workspace',
    kind: 'workspace',
    label: 'Workspace model',
    status: 'active',
    detail: 'Virtual folders, resources, path helpers, and first-run state.',
  },
  {
    id: '@textforge/surfaces',
    kind: 'surface',
    label: 'Surface hosts',
    status: 'active',
    detail: 'Main and popup host routing with open-with selection.',
  },
  {
    id: '@textforge/editors',
    kind: 'editor',
    label: 'Text editor',
    status: 'ready',
    detail: 'Generic text editing surface and source-range hooks.',
  },
  {
    id: '@textforge/assets',
    kind: 'viewer',
    label: 'Asset viewers',
    status: 'ready',
    detail: 'Read-only image, SVG, PDF, and binary preview surfaces.',
  },
];

const workspaceItems = [
  { id: 'docs', label: 'docs/', kind: 'folder', depth: 0, badge: '3' },
  { id: 'roadmap', label: 'roadmap/', kind: 'folder', depth: 0, badge: '5' },
  { id: 'notes', label: 'notes.md', kind: 'text', depth: 1, badge: 'MD' },
  { id: 'diagram', label: 'system.svg', kind: 'binary', depth: 1, badge: 'SVG' },
  { id: 'spec', label: 'architecture.txt', kind: 'text', depth: 1, badge: 'TXT' },
];

const surfaceTabs = [
  { id: 'welcome', title: 'Welcome', type: 'main', active: true },
  { id: 'workspace', title: 'Workspace', type: 'main', active: false },
  { id: 'asset', title: 'Asset preview', type: 'popup', active: false },
];

const state = {
  activeWorkspaceItemId: 'notes',
  activeSurfaceTabId: 'welcome',
};

const app = document.getElementById('app');

if (!app) {
  throw new Error('TextForge app root not found.');
}

app.innerHTML = '';

const shell = document.createElement('div');
shell.className = 'shell';

shell.append(
  createShellHeader(),
  createWorkspacePanel(),
  createSurfacePanel(),
  createInspectorPanel(),
  createFooter(),
);

app.append(shell);

function createShellHeader() {
  const header = document.createElement('header');
  header.className = 'shell-header';

  const brand = document.createElement('div');
  brand.className = 'brand';

  const brandMark = document.createElement('div');
  brandMark.className = 'brand-mark';
  brandMark.textContent = 'TF';

  const brandText = document.createElement('div');
  brandText.className = 'brand-text';
  brandText.innerHTML = `
    <strong>TextForge</strong>
    <span>Runnable shell baseline</span>
  `;

  brand.append(brandMark, brandText);

  const statusRail = document.createElement('div');
  statusRail.className = 'status-rail';
  statusRail.append(...[
    badge('Shell ready', 'success'),
    badge('Workspace online', 'info'),
    badge('Contributions registered', 'neutral'),
  ]);

  const actionRail = document.createElement('div');
  actionRail.className = 'action-rail';
  actionRail.append(
    actionButton('Open notes', () => openWorkspaceItem('notes')),
    actionButton('Preview SVG', () => openWorkspaceItem('diagram')),
    actionButton('Focus workspace', () => setActiveSurface('workspace')),
  );

  header.append(brand, statusRail, actionRail);
  return header;
}

function createWorkspacePanel() {
  const panel = document.createElement('section');
  panel.className = 'panel workspace-panel';

  const titleBar = document.createElement('div');
  titleBar.className = 'panel-titlebar';
  titleBar.innerHTML = `
    <h2>Workspace</h2>
    <span class="panel-subtitle">Navigation and source selection</span>
  `;

  const tree = document.createElement('div');
  tree.className = 'workspace-tree';

  for (const item of workspaceItems) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `tree-row${item.id === state.activeWorkspaceItemId ? ' is-active' : ''}`;
    row.style.setProperty('--depth', String(item.depth));
    row.dataset.itemId = item.id;

    row.innerHTML = `
      <span class="tree-label">
        <span class="tree-kind">${item.kind}</span>
        <span>${item.label}</span>
      </span>
      <span class="tree-badge">${item.badge}</span>
    `;

    row.addEventListener('click', () => openWorkspaceItem(item.id));
    tree.append(row);
  }

  const treeFooter = document.createElement('div');
  treeFooter.className = 'panel-footer';
  treeFooter.textContent = 'Open-with routing maps source items to their default surfaces.';

  panel.append(titleBar, tree, treeFooter);
  return panel;
}

function createSurfacePanel() {
  const panel = document.createElement('section');
  panel.className = 'panel surface-panel';

  const titleBar = document.createElement('div');
  titleBar.className = 'panel-titlebar';
  titleBar.innerHTML = `
    <h2>Surface host</h2>
    <span class="panel-subtitle">Main and popup routing</span>
  `;

  const tabBar = document.createElement('div');
  tabBar.className = 'tab-bar';
  for (const tab of surfaceTabs) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `tab${tab.id === state.activeSurfaceTabId ? ' is-active' : ''}`;
    button.textContent = tab.title;
    button.dataset.tabId = tab.id;
    button.addEventListener('click', () => setActiveSurface(tab.id));
    tabBar.append(button);
  }

  const surfaceBody = document.createElement('div');
  surfaceBody.className = 'surface-body';
  surfaceBody.innerHTML = `
    <div class="surface-card">
      <div class="surface-card__eyebrow">Current surface</div>
      <h3 id="surface-title"></h3>
      <p id="surface-summary"></p>
      <div class="surface-stats">
        <div><span>Placement</span><strong id="surface-placement"></strong></div>
        <div><span>Open-with</span><strong id="surface-openwith"></strong></div>
        <div><span>State</span><strong id="surface-state"></strong></div>
      </div>
    </div>
    <div class="surface-preview" id="surface-preview"></div>
  `;

  panel.append(titleBar, tabBar, surfaceBody);
  return panel;
}

function createInspectorPanel() {
  const panel = document.createElement('section');
  panel.className = 'panel inspector-panel';

  const titleBar = document.createElement('div');
  titleBar.className = 'panel-titlebar';
  titleBar.innerHTML = `
    <h2>Contribution packs</h2>
    <span class="panel-subtitle">Shell composition registry</span>
  `;

  const grid = document.createElement('div');
  grid.className = 'contribution-grid';

  for (const pack of contributionPacks) {
    const card = document.createElement('article');
    card.className = 'contribution-card';
    card.innerHTML = `
      <div class="contribution-card__top">
        <strong>${pack.label}</strong>
        <span class="contribution-status">${pack.status}</span>
      </div>
      <code>${pack.id}</code>
      <p>${pack.detail}</p>
    `;
    grid.append(card);
  }

  const notes = document.createElement('div');
  notes.className = 'inspector-notes';
  notes.innerHTML = `
    <p>This shell is intentionally minimal but runnable. It establishes the first user-facing baseline before the deeper package milestones land.</p>
    <ul>
      <li>Visible workbench frame</li>
      <li>Workspace navigation</li>
      <li>Surface host and tabs</li>
      <li>Registered contribution packs</li>
    </ul>
  `;

  panel.append(titleBar, grid, notes);
  return panel;
}

function createFooter() {
  const footer = document.createElement('footer');
  footer.className = 'shell-footer';
  footer.innerHTML = `
    <span>Phase 0.5 runnable shell</span>
    <span>Local-first bootstrap without external runtime dependencies</span>
  `;
  return footer;
}

function badge(label, tone) {
  const el = document.createElement('span');
  el.className = `badge badge--${tone}`;
  el.textContent = label;
  return el;
}

function actionButton(label, handler) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'action-button';
  button.textContent = label;
  button.addEventListener('click', handler);
  return button;
}

function openWorkspaceItem(itemId) {
  state.activeWorkspaceItemId = itemId;
  state.activeSurfaceTabId = itemId === 'diagram' ? 'asset' : 'workspace';
  render();
}

function setActiveSurface(tabId) {
  state.activeSurfaceTabId = tabId;
  if (tabId === 'welcome') {
    state.activeWorkspaceItemId = 'notes';
  } else if (tabId === 'asset') {
    state.activeWorkspaceItemId = 'diagram';
  }
  render();
}

function render() {
  syncTreeSelection();
  syncTabs();
  syncSurfaceDetails();
}

function syncTreeSelection() {
  document.querySelectorAll('.tree-row').forEach((row) => {
    row.classList.toggle('is-active', row.dataset.itemId === state.activeWorkspaceItemId);
  });
}

function syncTabs() {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.tabId === state.activeSurfaceTabId);
  });
}

function syncSurfaceDetails() {
  const surfaceTitle = document.getElementById('surface-title');
  const surfaceSummary = document.getElementById('surface-summary');
  const surfacePlacement = document.getElementById('surface-placement');
  const surfaceOpenWith = document.getElementById('surface-openwith');
  const surfaceState = document.getElementById('surface-state');
  const surfacePreview = document.getElementById('surface-preview');

  if (!surfaceTitle || !surfaceSummary || !surfacePlacement || !surfaceOpenWith || !surfaceState || !surfacePreview) {
    return;
  }

  const activeSurface = surfaceTabs.find((tab) => tab.id === state.activeSurfaceTabId) ?? surfaceTabs[0];
  const activeItem = workspaceItems.find((item) => item.id === state.activeWorkspaceItemId) ?? workspaceItems[0];

  const details = describeSelection(activeItem, activeSurface);
  surfaceTitle.textContent = details.title;
  surfaceSummary.textContent = details.summary;
  surfacePlacement.textContent = activeSurface.type === 'popup' ? 'popup' : 'main';
  surfaceOpenWith.textContent = details.openWith;
  surfaceState.textContent = details.state;
  surfacePreview.innerHTML = details.preview;
}

function describeSelection(item, surface) {
  if (item.id === 'diagram') {
    return {
      title: 'SVG asset preview',
      summary: 'A read-only asset viewer is ready to host diagram and image content from the workspace.',
      openWith: 'Asset viewer',
      state: 'ready',
      preview: `
        <div class="asset-frame">
          <div class="asset-frame__badge">SVG</div>
          <div class="asset-frame__content">
            <strong>system.svg</strong>
            <span>Workspace-bound preview surface</span>
          </div>
        </div>
      `,
    };
  }

  if (surface.id === 'welcome') {
    return {
      title: 'Welcome to TextForge',
      summary: 'The first runnable shell is visible and ready to route package contributions into the workbench chrome.',
      openWith: 'Shell routing',
      state: 'open',
      preview: `
        <div class="welcome-card">
          <p>This checkpoint proves the app can launch, paint the frame, and present the core workspace and surface regions.</p>
          <ul>
            <li>Frame rendered</li>
            <li>Workspace tree available</li>
            <li>Surface tabs available</li>
          </ul>
        </div>
      `,
    };
  }

  if (item.id === 'docs') {
    return {
      title: 'Workspace folder',
      summary: 'Folders are visible in the tree and can serve as stable navigation anchors for later editors and viewers.',
      openWith: 'Workspace navigator',
      state: 'active',
      preview: `
        <div class="folder-card">
          <span class="folder-card__title">docs/</span>
          <span class="folder-card__meta">3 children • root-level workspace folder</span>
        </div>
      `,
    };
  }

  return {
    title: 'Text resource',
    summary: 'Source documents are visible in the shell, ready for later source-editor integration.',
    openWith: 'Text editor',
    state: 'ready',
    preview: `
      <div class="text-card">
        <pre>TextForge source document
Phase 0.5 runnable shell
Ready for workspace and surface integration</pre>
      </div>
    `,
  };
}

render();
