import * as React from 'react';
import { createRoot } from 'react-dom/client';
import {
  createCapability,
  createContributionManifest,
  createDiagnostic,
  createResourcePredicate,
} from '@textforge/core';

export const eaViewerCapabilityId = '@textforge/ea-viewer/capability/dashboard';
export const eaViewerSurfaceId = '@textforge/ea-viewer/dashboard';

export const eaDashboardJsonDocumentPredicate = createResourcePredicate({
  representations: ['text'],
  languageIds: ['json'],
  mimeTypes: ['application/json', 'text/json'],
  fileExtensions: ['json'],
});

const modelCollections = Object.freeze({
  'architecture.securitydomain': 'securityDomains',
  'architecture.domain': 'domains',
  'architecture.capability': 'capabilities',
  'architecture.system': 'systems',
  'architecture.service': 'services',
  'architecture.dataentity': 'dataEntities',
  'architecture.datacenter': 'datacenters',
  'architecture.rack': 'racks',
  'architecture.server': 'servers',
  'architecture.cloudresource': 'cloudResources',
  'architecture.database': 'databases',
  'architecture.project': 'projects',
  'architecture.strategicgoal': 'strategicGoals',
  'architecture.valuestream': 'valueStreams',
  'architecture.businessunit': 'businessUnits',
  'architecture.businessprocess': 'businessProcesses',
});

const collectionModels = Object.fromEntries(
  Object.entries(modelCollections).map(([model, collection]) => [collection, model]),
);

const collectionNames = Object.freeze(Object.values(modelCollections));

const viewOptions = Object.freeze([
  { id: 'network', label: '1. Network Topology View' },
  { id: 'capability', label: '2. Business Capability Map' },
  { id: 'dependency', label: '3. Service Dependency Graph' },
  { id: 'business', label: '4. Business Architecture Dashboard' },
  { id: 'datacenter', label: '5. Datacenter Detail View' },
  { id: 'projects', label: '6. Project Portfolio View' },
  { id: 'process', label: '7. Business Process Detail View' },
]);

function createEaDiagnostic(resource, message, code, severity = 'error') {
  return createDiagnostic(message, severity, {
    code,
    resource,
    origin: {
      packageId: '@textforge/ea-viewer',
      subsystem: 'fixture-normalizer',
    },
  });
}

function coerceArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizePk(value) {
  const numeric = Number(value);
  return Number.isInteger(numeric) ? numeric : String(value ?? '').trim();
}

function readName(value, fallback) {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function cloneFields(fields) {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
    return {};
  }
  return { ...fields };
}

function isFixtureRecord(value) {
  return Boolean(
    value
    && typeof value === 'object'
    && typeof value.model === 'string'
    && Object.hasOwn(value, 'pk')
    && value.fields
    && typeof value.fields === 'object'
    && !Array.isArray(value.fields),
  );
}

export function isEaDashboardFixture(input) {
  if (!Array.isArray(input) || input.length === 0) {
    return false;
  }
  const fixtureRecords = input.filter(isFixtureRecord);
  if (fixtureRecords.length !== input.length) {
    return false;
  }
  return fixtureRecords.some((record) => Object.hasOwn(modelCollections, record.model));
}

function createIndex(collection) {
  return new Map(collection.map((entry) => [entry.id, entry]));
}

function resolveOne(indexes, model, id) {
  const normalized = normalizePk(id);
  return indexes[model]?.get(normalized);
}

function resolveMany(indexes, model, ids) {
  return coerceArray(ids)
    .map((id) => resolveOne(indexes, model, id))
    .filter(Boolean);
}

function securityLevel(entity) {
  return Number(entity?.security_domain?.level ?? entity?.securityDomain?.level ?? entity?.level ?? 1) || 1;
}

function relateModel(model) {
  const indexes = Object.fromEntries(
    collectionNames.map((collection) => [
      collectionModels[collection],
      createIndex(model[collection]),
    ]),
  );

  const security = (id) => resolveOne(indexes, 'architecture.securitydomain', id);
  const domain = (id) => resolveOne(indexes, 'architecture.domain', id);
  const capability = (id) => resolveOne(indexes, 'architecture.capability', id);
  const system = (id) => resolveOne(indexes, 'architecture.system', id);
  const service = (id) => resolveOne(indexes, 'architecture.service', id);
  const datacenter = (id) => resolveOne(indexes, 'architecture.datacenter', id);
  const rack = (id) => resolveOne(indexes, 'architecture.rack', id);
  const server = (id) => resolveOne(indexes, 'architecture.server', id);
  const cloudResource = (id) => resolveOne(indexes, 'architecture.cloudresource', id);
  const project = (id) => resolveOne(indexes, 'architecture.project', id);
  const strategicGoal = (id) => resolveOne(indexes, 'architecture.strategicgoal', id);
  const valueStream = (id) => resolveOne(indexes, 'architecture.valuestream', id);
  const businessUnit = (id) => resolveOne(indexes, 'architecture.businessunit', id);

  for (const collectionName of collectionNames) {
    for (const entry of model[collectionName]) {
      if (entry.security_domain !== undefined) {
        entry.security_domain_id = entry.security_domain;
        entry.security_domain = security(entry.security_domain) ?? entry.security_domain;
      }
    }
  }

  for (const entry of model.capabilities) {
    entry.domain_id = entry.domain;
    entry.domain = domain(entry.domain) ?? entry.domain;
  }

  for (const entry of model.systems) {
    entry.capability_ids = coerceArray(entry.capabilities);
    entry.capabilities = resolveMany(indexes, 'architecture.capability', entry.capabilities);
    entry.servers = [];
    entry.services = [];
    entry.databases = [];
    entry.cloud_resources = [];
    entry.projects = [];
  }

  for (const entry of model.services) {
    entry.system_id = entry.system;
    entry.system = system(entry.system) ?? entry.system;
    entry.consumed_by_ids = coerceArray(entry.consumed_by);
    entry.consumed_by = resolveMany(indexes, 'architecture.system', entry.consumed_by);
    if (entry.system?.services) {
      entry.system.services.push(entry);
    }
  }

  for (const entry of model.dataEntities) {
    entry.system_id = entry.system;
    entry.system = system(entry.system) ?? entry.system;
  }

  for (const entry of model.datacenters) {
    entry.racks = [];
    entry.servers = [];
  }

  for (const entry of model.racks) {
    entry.datacenter_id = entry.datacenter;
    entry.datacenter = datacenter(entry.datacenter) ?? entry.datacenter;
    entry.servers = [];
    if (entry.datacenter?.racks) {
      entry.datacenter.racks.push(entry);
    }
  }

  for (const entry of model.servers) {
    entry.datacenter_id = entry.datacenter;
    entry.rack_id = entry.rack;
    entry.datacenter = datacenter(entry.datacenter) ?? entry.datacenter;
    entry.rack = rack(entry.rack) ?? entry.rack;
    entry.system_ids = coerceArray(entry.systems);
    entry.systems = resolveMany(indexes, 'architecture.system', entry.systems);
    entry.datacenter_name = entry.datacenter?.name;
    entry.rack_name = entry.rack?.name;
    entry.datacenter_security_domain = entry.datacenter?.security_domain;
    entry.rack_security_domain = entry.rack?.security_domain;
    if (entry.datacenter?.servers) {
      entry.datacenter.servers.push(entry);
    }
    if (entry.rack?.servers) {
      entry.rack.servers.push(entry);
    }
    for (const linkedSystem of entry.systems) {
      linkedSystem.servers?.push(entry);
    }
  }

  for (const entry of model.cloudResources) {
    entry.system_ids = coerceArray(entry.systems);
    entry.systems = resolveMany(indexes, 'architecture.system', entry.systems);
    for (const linkedSystem of entry.systems) {
      linkedSystem.cloud_resources?.push(entry);
    }
  }

  for (const entry of model.databases) {
    entry.system_id = entry.system;
    entry.server_id = entry.server;
    entry.cloud_resource_id = entry.cloud_resource;
    entry.system = system(entry.system) ?? entry.system;
    entry.server = server(entry.server) ?? entry.server;
    entry.cloud_resource = cloudResource(entry.cloud_resource) ?? entry.cloud_resource;
    if (entry.system?.databases) {
      entry.system.databases.push(entry);
    }
  }

  for (const entry of model.projects) {
    entry.dependency_ids = coerceArray(entry.dependencies);
    entry.domain_ids = coerceArray(entry.domains);
    entry.capability_ids = coerceArray(entry.capabilities);
    entry.system_ids = coerceArray(entry.systems);
    entry.service_ids = coerceArray(entry.services);
    entry.server_ids = coerceArray(entry.servers);
    entry.cloud_resource_ids = coerceArray(entry.cloud_resources);
    entry.dependencies = resolveMany(indexes, 'architecture.project', entry.dependencies);
    entry.domains = resolveMany(indexes, 'architecture.domain', entry.domains);
    entry.capabilities = resolveMany(indexes, 'architecture.capability', entry.capabilities);
    entry.systems = resolveMany(indexes, 'architecture.system', entry.systems);
    entry.services = resolveMany(indexes, 'architecture.service', entry.services);
    entry.servers = resolveMany(indexes, 'architecture.server', entry.servers);
    entry.cloud_resources = resolveMany(indexes, 'architecture.cloudresource', entry.cloud_resources);
    for (const linkedSystem of entry.systems) {
      linkedSystem.projects?.push(entry);
    }
  }

  for (const entry of model.strategicGoals) {
    entry.capability_ids = coerceArray(entry.capabilities);
    entry.project_ids = coerceArray(entry.projects);
    entry.capabilities = resolveMany(indexes, 'architecture.capability', entry.capabilities);
    entry.projects = resolveMany(indexes, 'architecture.project', entry.projects);
    entry.value_streams = [];
  }

  for (const entry of model.valueStreams) {
    entry.strategic_goal_ids = coerceArray(entry.strategic_goals);
    entry.strategic_goals = resolveMany(indexes, 'architecture.strategicgoal', entry.strategic_goals);
    entry.business_processes = [];
    for (const goal of entry.strategic_goals) {
      goal.value_streams?.push(entry);
    }
  }

  for (const entry of model.businessUnits) {
    entry.value_stream_ids = coerceArray(entry.value_streams);
    entry.system_ids = coerceArray(entry.systems);
    entry.value_streams = resolveMany(indexes, 'architecture.valuestream', entry.value_streams);
    entry.systems = resolveMany(indexes, 'architecture.system', entry.systems);
  }

  for (const entry of model.businessProcesses) {
    entry.value_stream_id = entry.value_stream;
    entry.business_unit_id = entry.business_unit;
    entry.system_ids = coerceArray(entry.systems);
    entry.value_stream = valueStream(entry.value_stream) ?? entry.value_stream;
    entry.business_unit = businessUnit(entry.business_unit) ?? entry.business_unit;
    entry.systems = resolveMany(indexes, 'architecture.system', entry.systems);
    if (entry.value_stream?.business_processes) {
      entry.value_stream.business_processes.push(entry);
    }
  }

  return model;
}

function addCoverageDiagnostics(model, diagnostics, resource) {
  if (model.systems.length === 0 && model.businessProcesses.length === 0) {
    diagnostics.push(createEaDiagnostic(
      resource,
      'EA Dashboard fixture does not include systems or business processes that can drive the viewer.',
      'ea.fixture.no-renderable-models',
      'warning',
    ));
  }
  if (model.racks.length === 0 || model.servers.length === 0) {
    diagnostics.push(createEaDiagnostic(
      resource,
      'EA Dashboard fixture omits rack/server deployment records; datacenter detail views will render available metadata only.',
      'ea.fixture.deployment-partial',
      'warning',
    ));
  }
  return diagnostics;
}

export function normalizeEaDashboardFixture(sourceText, options = {}) {
  const diagnostics = [];
  let parsed;
  try {
    parsed = JSON.parse(String(sourceText ?? ''));
  } catch (error) {
    return {
      recognized: false,
      diagnostics: [
        createEaDiagnostic(
          options.resource,
          `EA Dashboard JSON could not be parsed: ${error?.message ?? 'invalid JSON'}.`,
          'ea.fixture.parse-failed',
        ),
      ],
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      recognized: false,
      diagnostics: [
        createEaDiagnostic(
          options.resource,
          'EA Dashboard JSON must be a Django fixture array.',
          'ea.fixture.not-array',
          'warning',
        ),
      ],
    };
  }

  if (!isEaDashboardFixture(parsed)) {
    return {
      recognized: false,
      diagnostics: [
        createEaDiagnostic(
          options.resource,
          'JSON does not look like an EA Dashboard Django fixture export.',
          'ea.fixture.unrecognized',
          'warning',
        ),
      ],
    };
  }

  const model = {
    sourceKind: 'ea-dashboard-django-fixture',
    recordCount: parsed.length,
    modelCounts: {},
    diagnostics,
  };
  for (const collection of collectionNames) {
    model[collection] = [];
  }

  for (const record of parsed) {
    if (!isFixtureRecord(record)) {
      diagnostics.push(createEaDiagnostic(
        options.resource,
        'Skipped malformed Django fixture record.',
        'ea.fixture.record-invalid',
        'warning',
      ));
      continue;
    }

    const collection = modelCollections[record.model];
    if (!collection) {
      diagnostics.push(createEaDiagnostic(
        options.resource,
        `Skipped unsupported EA Dashboard model '${record.model}'.`,
        'ea.fixture.model-unsupported',
        'warning',
      ));
      continue;
    }

    const id = normalizePk(record.pk);
    model.modelCounts[record.model] = (model.modelCounts[record.model] ?? 0) + 1;
    model[collection].push({
      id,
      pk: id,
      sourceModel: record.model,
      ...cloneFields(record.fields),
    });
  }

  relateModel(model);
  addCoverageDiagnostics(model, diagnostics, options.resource);

  return {
    recognized: true,
    model,
    diagnostics,
  };
}

export function createEaViewerModel(sourceText, options = {}) {
  const result = normalizeEaDashboardFixture(sourceText, {
    resource: options.resource,
  });
  return {
    ...result,
    title: options.title ?? options.resource?.path ?? 'EA Dashboard viewer',
  };
}

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function createFailureHtml(title, diagnostics) {
  const items = diagnostics.length > 0
    ? diagnostics.map((diagnostic) => `<li>${escapeHtml(diagnostic.message)}</li>`).join('')
    : '<li>EA Dashboard viewer could not resolve a local fixture model.</li>';
  return `
    <section class="tf-ea-viewer tf-ea-viewer--fallback" data-ea-viewer-fallback>
      <div class="tf-ea-fallback">
        <p class="tf-ea-eyebrow">Enterprise Architecture Viewer</p>
        <h3>${escapeHtml(title)}</h3>
        <ul>${items}</ul>
      </div>
    </section>
  `;
}

function readCspNonce(documentRef) {
  if (!documentRef?.querySelector) {
    return undefined;
  }

  const meta = documentRef.querySelector('meta[name="textforge-csp-nonce"]');
  const nonce = meta?.getAttribute('content')?.trim();
  return nonce || undefined;
}

function createStyleElement(documentRef) {
  const style = documentRef.createElement('style');
  style.dataset.textforgeEaViewerStyle = 'true';
  const cspNonce = readCspNonce(documentRef);
  if (cspNonce) {
    style.setAttribute('nonce', cspNonce);
  }
  style.textContent = `
    .tf-ea-viewer{--ea-bg:#040a16;--ea-panel:rgba(8,23,44,.9);--ea-border:rgba(59,130,246,.35);--ea-text:#f8fafc;--ea-muted:#94a3b8;--ea-blue:#3b82f6;--ea-green:#10b981;--ea-amber:#f59e0b;--ea-red:#ef4444;display:flex;flex-direction:column;width:100%;height:100%;min-height:520px;background:#040a16;color:var(--ea-text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow:hidden}
    .tf-ea-viewer *{box-sizing:border-box}
    .tf-ea-viewer button,.tf-ea-viewer select,.tf-ea-viewer input{font:inherit}
    .tf-ea-viewer--fallback{align-items:center;justify-content:center;padding:24px}
    .tf-ea-fallback{width:min(680px,100%);padding:22px;border:1px solid var(--ea-border);border-radius:8px;background:var(--ea-panel)}
    .tf-ea-fallback h3{margin:4px 0 14px;font-size:1.1rem}
    .tf-ea-fallback ul{margin:0;padding-left:20px;color:var(--ea-muted)}
    .tf-ea-shell{display:grid;grid-template-columns:240px minmax(0,1fr) 320px;min-height:0;height:100%}
    .tf-ea-sidebar{border-right:1px solid var(--ea-border);background:rgba(8,23,44,.84);padding:18px 14px;display:flex;flex-direction:column;gap:14px;min-width:0}
    .tf-ea-brand{display:flex;align-items:center;gap:10px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.08)}
    .tf-ea-compass{width:34px;height:34px;border:1px solid #fff;border-radius:50%;display:grid;place-items:center;color:#fff;background:rgba(255,255,255,.08)}
    .tf-ea-brand-title{font-weight:700;font-size:.95rem}
    .tf-ea-nav{display:flex;flex-direction:column;gap:6px}
    .tf-ea-nav button,.tf-ea-btn{border:1px solid transparent;background:transparent;color:var(--ea-muted);border-radius:6px;padding:8px 10px;text-align:left;cursor:pointer}
    .tf-ea-nav button:hover,.tf-ea-btn:hover{background:rgba(255,255,255,.06);color:#fff}
    .tf-ea-nav button[aria-pressed=true],.tf-ea-btn--active{background:rgba(59,130,246,.16);border-color:rgba(59,130,246,.45);color:#fff}
    .tf-ea-stage{position:relative;min-width:0;min-height:0;overflow:hidden}
    .tf-ea-header{position:absolute;z-index:8;top:18px;left:18px;pointer-events:none;text-shadow:0 2px 10px rgba(0,0,0,.7)}
    .tf-ea-header h2{margin:0;font-size:1.15rem;letter-spacing:.02em}
    .tf-ea-header p{margin:4px 0 0;color:var(--ea-muted);font-size:.84rem}
    .tf-ea-flow{height:100%;width:100%;background:#040a16}
    .tf-ea-node-card{min-width:180px;max-width:260px;border:1px solid var(--ea-border);border-radius:8px;background:rgba(15,23,42,.88);box-shadow:0 8px 24px rgba(0,0,0,.34);padding:12px;color:#fff}
    .tf-ea-node-card__kind{font-size:.68rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#60a5fa}
    .tf-ea-node-card__title{font-size:.9rem;font-weight:700;margin-top:4px;line-height:1.2}
    .tf-ea-node-card__meta{font-size:.72rem;color:var(--ea-muted);margin-top:5px}
    .tf-ea-controls{border-left:1px solid var(--ea-border);background:rgba(8,23,44,.86);padding:18px;display:flex;flex-direction:column;gap:14px;min-width:0;overflow:auto}
    .tf-ea-panel{border:1px solid rgba(255,255,255,.08);border-radius:8px;background:rgba(255,255,255,.03);padding:12px}
    .tf-ea-panel h3{margin:0 0 8px;font-size:.78rem;text-transform:uppercase;letter-spacing:.08em;color:#60a5fa}
    .tf-ea-field{display:flex;flex-direction:column;gap:6px;margin-top:10px}
    .tf-ea-field label,.tf-ea-row-label{font-size:.74rem;font-weight:700;color:var(--ea-muted)}
    .tf-ea-field select{width:100%;border:1px solid rgba(59,130,246,.35);border-radius:6px;background:#040a16;color:#fff;padding:8px}
    .tf-ea-check{display:flex;gap:8px;align-items:center;color:#dbeafe;font-size:.82rem;margin-top:8px}
    .tf-ea-range-value{display:flex;justify-content:space-between;align-items:center;font-size:.78rem;color:#dbeafe}
    .tf-ea-range{width:100%;accent-color:var(--ea-blue)}
    .tf-ea-timeline{position:absolute;z-index:9;bottom:22px;left:50%;transform:translateX(-50%);width:min(600px,calc(100% - 40px));border:1px solid var(--ea-blue);border-radius:10px;background:rgba(8,23,44,.94);box-shadow:0 8px 32px rgba(0,0,0,.55);padding:14px 24px}
    .tf-ea-detail{position:absolute;z-index:8;left:18px;bottom:18px;width:min(360px,calc(100% - 36px));border:1px solid rgba(16,185,129,.35);border-radius:8px;background:rgba(8,23,44,.9);padding:12px;box-shadow:0 8px 28px rgba(0,0,0,.42)}
    .tf-ea-detail h3{margin:0 0 8px;font-size:.9rem}
    .tf-ea-detail dl{display:grid;grid-template-columns:100px minmax(0,1fr);gap:6px;margin:0;font-size:.78rem}
    .tf-ea-detail dt{color:var(--ea-muted);font-weight:700}
    .tf-ea-detail dd{margin:0;min-width:0;overflow-wrap:anywhere}
    .tf-ea-svg-view{height:100%;display:flex;align-items:center;justify-content:center;padding:86px 24px 24px}
    .tf-ea-svg-frame{width:min(900px,100%);height:min(620px,100%);border:1px solid var(--ea-border);border-radius:8px;background:rgba(15,23,42,.86);padding:20px;overflow:auto}
    .tf-ea-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;padding:86px 24px 24px;height:100%;overflow:auto}
    .tf-ea-list-card{border:1px solid var(--ea-border);border-radius:8px;background:rgba(15,23,42,.86);padding:14px;cursor:pointer}
    .tf-ea-list-card:hover{border-color:#60a5fa;background:rgba(30,41,59,.92)}
    .tf-ea-eyebrow{margin:0;color:#60a5fa;font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
    .tf-ea-flow .react-flow{direction:ltr;width:100%;height:100%;position:relative;overflow:hidden;z-index:0;background:#040a16}
    .tf-ea-flow .react-flow__renderer,.tf-ea-flow .react-flow__zoompane,.tf-ea-flow .react-flow__selectionpane{width:100%;height:100%;position:absolute;inset:0}
    .tf-ea-flow .react-flow__pane{z-index:1;cursor:grab}
    .tf-ea-flow .react-flow__viewport{transform-origin:0 0;z-index:2;pointer-events:none}
    .tf-ea-flow .react-flow__container{position:absolute;width:100%;height:100%;top:0;left:0}
    .tf-ea-flow .react-flow__nodes{position:absolute;width:100%;height:100%;transform-origin:0 0;pointer-events:none}
    .tf-ea-flow .react-flow__node{position:absolute;user-select:none;pointer-events:all;transform-origin:0 0}
    .tf-ea-flow .react-flow__edges{position:absolute;width:100%;height:100%;overflow:visible;pointer-events:none}
    .tf-ea-flow .react-flow__edge{pointer-events:visibleStroke}
    .tf-ea-flow .react-flow__edge-path{fill:none;stroke:#3b82f6;stroke-width:2}
    .tf-ea-flow .react-flow__edge-text{font-size:11px;fill:#dbeafe}
    .tf-ea-flow .react-flow__background{position:absolute;width:100%;height:100%;top:0;left:0}
    .tf-ea-flow .react-flow__controls{position:absolute;z-index:5;left:12px;bottom:12px;display:flex;flex-direction:column;box-shadow:0 8px 24px rgba(0,0,0,.3)}
    .tf-ea-flow .react-flow__controls button{width:28px;height:28px;border:0;border-bottom:1px solid rgba(255,255,255,.12);background:rgba(15,23,42,.9);color:#fff;display:grid;place-items:center;cursor:pointer}
    .tf-ea-flow .react-flow__controls button:hover{background:rgba(59,130,246,.35)}
    @media (max-width:1100px){.tf-ea-shell{grid-template-columns:190px minmax(0,1fr)}.tf-ea-controls{position:absolute;right:12px;top:80px;bottom:12px;width:min(320px,calc(100% - 24px));z-index:12;border:1px solid var(--ea-border);border-radius:8px}.tf-ea-sidebar{font-size:.85rem}}
  `;
  return style;
}

function ensurePackageStyle(container) {
  const documentRef = container.ownerDocument ?? globalThis.document;
  if (!documentRef?.head) {
    return () => {};
  }
  const existing = documentRef.head.querySelector('style[data-textforge-ea-viewer-style="true"]');
  if (existing) {
    return () => {};
  }
  const style = createStyleElement(documentRef);
  documentRef.head.appendChild(style);
  return () => {
    style.remove();
  };
}

function formatSecurity(entity) {
  const domain = entity?.security_domain;
  if (domain && typeof domain === 'object') {
    return domain.abbreviation ? `${domain.abbreviation} / L${domain.level ?? 1}` : domain.name;
  }
  return 'L1';
}

function entityTitle(entity) {
  return readName(entity?.name ?? entity?.hostname, `Record ${entity?.id ?? ''}`);
}

function getLifecycle(entity, year) {
  const phases = Array.isArray(entity?.lifecycle) ? entity.lifecycle : [];
  if (phases.length > 0) {
    const current = phases.find((phase) => year >= Number(phase.start) && year < Number(phase.end));
    if (current) {
      return { status: current.status ?? 'Operational', opacity: 1, color: '#10b981' };
    }
  }
  const text = `${entityTitle(entity)} ${entity?.status ?? ''}`.toLowerCase();
  if (year < 2022) {
    return { status: 'Planned (Future)', opacity: 0.35, color: '#a855f7' };
  }
  if (text.includes('legacy') || text.includes('obsolete')) {
    return year >= 2029
      ? { status: 'Operational (Obsolete)', opacity: 1, color: '#ef4444' }
      : { status: 'Operational', opacity: 1, color: '#10b981' };
  }
  if (year >= 2038) {
    return { status: 'Operational (Aging)', opacity: 0.85, color: '#f59e0b' };
  }
  return { status: entity?.status ?? 'Operational', opacity: 1, color: '#10b981' };
}

function groupForSystem(system) {
  const capabilities = coerceArray(system?.capabilities).map((capability) => entityTitle(capability).toLowerCase());
  const name = entityTitle(system).toLowerCase();
  if (capabilities.some((capability) => capability.includes('identity') || capability.includes('security')) || name.includes('dir') || name.includes('guard')) {
    return 'Enterprise Security & Identity';
  }
  if (capabilities.some((capability) => capability.includes('sat') || capability.includes('communication')) || name.includes('sat') || name.includes('wan')) {
    return 'Communications & SATCOM';
  }
  if (capabilities.some((capability) => capability.includes('command') || capability.includes('intelligence')) || name.includes('c2')) {
    return 'C2 & Intelligence';
  }
  if (capabilities.some((capability) => capability.includes('deploy') || capability.includes('edge')) || name.includes('edge')) {
    return 'Deployable Edge';
  }
  return 'Other Operations';
}

function groupColor(groupName) {
  switch (groupName) {
    case 'Enterprise Security & Identity': return '#3b82f6';
    case 'Communications & SATCOM': return '#10b981';
    case 'C2 & Intelligence': return '#a855f7';
    case 'Deployable Edge': return '#f59e0b';
    default: return '#64748b';
  }
}

function createNodeLabel(ReactRef, node) {
  return ReactRef.createElement(
    'div',
    { className: 'tf-ea-node-card', 'data-ea-node-card': node.id },
    ReactRef.createElement('div', { className: 'tf-ea-node-card__kind' }, node.kindLabel),
    ReactRef.createElement('div', { className: 'tf-ea-node-card__title' }, node.title),
    ReactRef.createElement('div', { className: 'tf-ea-node-card__meta' }, node.meta),
  );
}

function layoutWithDagre(dagre, nodes, edges, direction) {
  if (!dagre?.graphlib?.Graph || typeof dagre.layout !== 'function') {
    throw new Error('Dagre layout engine did not initialize with graphlib.Graph.');
  }

  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: direction, nodesep: 110, ranksep: 150 });
  for (const node of nodes) {
    graph.setNode(node.id, { width: 220, height: 96 });
  }
  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target);
  }
  dagre.layout(graph);
  return nodes.map((node) => {
    const position = graph.node(node.id);
    if (!position) {
      throw new Error(`Dagre layout did not return a position for node ${node.id}.`);
    }
    return {
      ...node,
      position: {
        x: position.x - 110,
        y: position.y - 48,
      },
    };
  });
}

export function createDagreLayoutEngine(dagreModule, graphlibModule) {
  const layout = dagreModule?.layout;
  const Graph = graphlibModule?.Graph;
  if (typeof layout !== 'function' || typeof Graph !== 'function') {
    return undefined;
  }
  return {
    layout,
    graphlib: {
      Graph,
    },
  };
}

export function verifyDagreLayoutEngine(dagre) {
  if (!dagre?.graphlib?.Graph || typeof dagre.layout !== 'function') {
    throw new Error('Dagre layout engine did not expose graphlib.Graph.');
  }

  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: 'LR' });
  graph.setNode('source', { width: 100, height: 50 });
  graph.setNode('target', { width: 100, height: 50 });
  graph.setEdge('source', 'target');
  dagre.layout(graph);

  for (const id of ['source', 'target']) {
    const node = graph.node(id);
    if (!Number.isFinite(node?.x) || !Number.isFinite(node?.y)) {
      throw new Error(`Dagre layout engine did not produce coordinates for ${id}.`);
    }
  }
}

function buildGlobalGraph(ReactRef, dagre, model, state) {
  const visibleSystems = model.systems.filter((system) => {
    if (state.detailLevel <= 1 && securityLevel(system) > 4) {
      return false;
    }
    return state.enabledGroups[groupForSystem(system)] !== false;
  });
  const nodes = visibleSystems.map((system) => {
    const lifecycle = getLifecycle(system, state.showFutureState ? state.timelineYear : 2026);
    const group = groupForSystem(system);
    return {
      id: `system-${system.id}`,
      raw: system,
      kindLabel: group,
      title: entityTitle(system),
      meta: `${formatSecurity(system)} / ${lifecycle.status}`,
      style: {
        border: `2px solid ${groupColor(group)}`,
        background: 'transparent',
        opacity: lifecycle.opacity,
      },
    };
  });

  if (state.detailLevel === 1) {
    for (const project of model.projects) {
      nodes.push({
        id: `project-${project.id}`,
        raw: project,
        kindLabel: 'Project',
        title: entityTitle(project),
        meta: `${project.status ?? 'Planned'} / ${project.completion_percentage ?? 0}%`,
        style: { border: '2px solid #f59e0b', background: 'transparent' },
      });
    }
  }

  const edges = [];
  for (const service of model.services) {
    const source = service.system?.id;
    for (const consumer of service.consumed_by ?? []) {
      if (source && consumer?.id && source !== consumer.id) {
        edges.push({
          id: `service-${service.id}-${consumer.id}`,
          source: `system-${consumer.id}`,
          target: `system-${source}`,
          type: 'smoothstep',
          animated: state.showDataFlow,
          label: state.detailLevel >= 2 ? String(service.protocol ?? service.name ?? 'uses') : undefined,
          style: { stroke: state.showDataFlow ? '#06b6d4' : '#3b82f6', strokeWidth: 2 },
        });
      }
    }
  }
  for (const project of model.projects) {
    for (const system of project.systems ?? []) {
      if (state.detailLevel === 1) {
        edges.push({
          id: `project-${project.id}-system-${system.id}`,
          source: `project-${project.id}`,
          target: `system-${system.id}`,
          type: 'smoothstep',
          animated: true,
          label: 'delivers',
          style: { stroke: '#f59e0b', strokeDasharray: '5 5', strokeWidth: 1.5 },
        });
      }
    }
  }

  const direction = state.view === 'dependency' ? 'TB' : 'LR';
  const layouted = layoutWithDagre(dagre, nodes, edges, direction).map((node) => ({
    ...node,
    data: { label: createNodeLabel(ReactRef, node), raw: node.raw },
  }));

  return { nodes: layouted, edges };
}

function buildBusinessGraph(ReactRef, dagre, model) {
  const nodes = [];
  const edges = [];
  const addNode = (id, raw, kindLabel, color) => {
    nodes.push({
      id,
      raw,
      kindLabel,
      title: entityTitle(raw),
      meta: formatSecurity(raw),
      style: { border: `2px solid ${color}`, background: 'transparent' },
    });
  };
  for (const goal of model.strategicGoals) addNode(`goal-${goal.id}`, goal, 'Strategic Goal', '#4f46e5');
  for (const stream of model.valueStreams) {
    addNode(`stream-${stream.id}`, stream, 'Value Stream', '#10b981');
    for (const goal of stream.strategic_goals ?? []) {
      edges.push({ id: `goal-${goal.id}-stream-${stream.id}`, source: `goal-${goal.id}`, target: `stream-${stream.id}`, type: 'smoothstep', animated: true, style: { stroke: '#818cf8', strokeWidth: 2 } });
    }
  }
  for (const process of model.businessProcesses) {
    addNode(`process-${process.id}`, process, 'Business Process', '#f59e0b');
    if (process.value_stream?.id) {
      edges.push({ id: `stream-${process.value_stream.id}-process-${process.id}`, source: `stream-${process.value_stream.id}`, target: `process-${process.id}`, type: 'smoothstep', style: { stroke: '#34d399', strokeWidth: 2 } });
    }
    for (const system of process.systems ?? []) {
      addNode(`system-${system.id}`, system, 'IT System', '#3b82f6');
      edges.push({ id: `process-${process.id}-system-${system.id}`, source: `process-${process.id}`, target: `system-${system.id}`, type: 'smoothstep', animated: true, label: 'supports', style: { stroke: '#fbbf24', strokeWidth: 1.5, strokeDasharray: '4 4' } });
    }
  }
  const uniqueNodes = [...new Map(nodes.map((node) => [node.id, node])).values()];
  return {
    nodes: layoutWithDagre(dagre, uniqueNodes, edges, 'TB').map((node) => ({
      ...node,
      data: { label: createNodeLabel(ReactRef, node), raw: node.raw },
    })),
    edges,
  };
}

function DetailPanel({ selected }) {
  if (!selected) {
    return null;
  }
  const raw = selected.data?.raw ?? selected.raw;
  return React.createElement(
    'aside',
    { className: 'tf-ea-detail', 'data-ea-selected-panel': true },
    React.createElement('p', { className: 'tf-ea-eyebrow' }, raw?.sourceModel ?? selected.id),
    React.createElement('h3', null, entityTitle(raw)),
    React.createElement(
      'dl',
      null,
      React.createElement('dt', null, 'Security'),
      React.createElement('dd', null, formatSecurity(raw)),
      React.createElement('dt', null, 'Identifier'),
      React.createElement('dd', null, String(raw?.id ?? selected.id)),
      React.createElement('dt', null, 'Description'),
      React.createElement('dd', null, String(raw?.description ?? raw?.status ?? raw?.role ?? 'No description')),
    ),
  );
}

function DatacenterView({ model, selected, setSelected }) {
  const datacenter = selected?.sourceModel === 'architecture.datacenter'
    ? selected
    : model.datacenters[0];
  const racks = datacenter?.racks ?? model.racks;
  return React.createElement(
    'div',
    { className: 'tf-ea-svg-view', 'data-ea-custom-detail-view': 'datacenter' },
    React.createElement(
      'div',
      { className: 'tf-ea-svg-frame' },
      React.createElement('p', { className: 'tf-ea-eyebrow' }, 'Datacenter Schema'),
      React.createElement('h2', null, entityTitle(datacenter ?? { name: 'Deployment unavailable' })),
      React.createElement(
        'svg',
        { viewBox: '0 0 920 520', width: '100%', height: '430', role: 'img', 'aria-label': 'Datacenter rack layout' },
        React.createElement('rect', { x: 20, y: 30, width: 880, height: 450, rx: 10, fill: '#071426', stroke: '#3b82f6', strokeWidth: 2 }),
        racks.slice(0, 30).map((rackItem, index) => {
          const col = index % 10;
          const row = Math.floor(index / 10);
          const x = 55 + col * 82;
          const y = 80 + row * 125;
          const serverCount = rackItem.servers?.length ?? 0;
          return React.createElement(
            'g',
            { key: rackItem.id, onClick: () => setSelected(rackItem), style: { cursor: 'pointer' } },
            React.createElement('rect', { x, y, width: 58, height: 92, rx: 5, fill: selected?.id === rackItem.id ? '#1d4ed8' : '#0f172a', stroke: '#60a5fa', strokeWidth: 1.5 }),
            React.createElement('text', { x: x + 29, y: y + 28, fill: '#fff', fontSize: 12, textAnchor: 'middle' }, rackItem.name),
            React.createElement('text', { x: x + 29, y: y + 52, fill: '#94a3b8', fontSize: 10, textAnchor: 'middle' }, `${serverCount} servers`),
            React.createElement('rect', { x: x + 12, y: y + 66, width: Math.min(34, 4 + serverCount * 6), height: 8, rx: 4, fill: serverCount > 8 ? '#ef4444' : '#10b981' }),
          );
        }),
      ),
    ),
  );
}

function ListDetailView({ title, eyebrow, items, onSelect }) {
  return React.createElement(
    'div',
    { className: 'tf-ea-list', 'data-ea-list-detail-view': eyebrow },
    items.length === 0
      ? React.createElement('div', { className: 'tf-ea-list-card' }, React.createElement('p', { className: 'tf-ea-eyebrow' }, eyebrow), React.createElement('h3', null, 'No local records available'))
      : items.map((item) => React.createElement(
        'article',
        { key: item.id, className: 'tf-ea-list-card', onClick: () => onSelect(item) },
        React.createElement('p', { className: 'tf-ea-eyebrow' }, eyebrow),
        React.createElement('h3', null, entityTitle(item)),
        React.createElement('p', null, String(item.description ?? item.status ?? item.protocol ?? title)),
      )),
  );
}

function ViewerApp({ title, model, diagnostics, modules }) {
  const ReactFlow = modules.ReactFlow;
  const Background = modules.Background;
  const Controls = modules.Controls;
  const applyNodeChanges = modules.applyNodeChanges;
  const applyEdgeChanges = modules.applyEdgeChanges;
  const dagre = modules.dagre;

  const groupNames = React.useMemo(() => {
    const groups = new Set(model.systems.map(groupForSystem));
    if (groups.size === 0) groups.add('Other Operations');
    return [...groups].sort();
  }, [model]);
  const [view, setView] = React.useState('network');
  const [detailLevel, setDetailLevel] = React.useState(2);
  const [showFutureState, setShowFutureState] = React.useState(false);
  const [timelineYear, setTimelineYear] = React.useState(2026);
  const [showDataFlow, setShowDataFlow] = React.useState(false);
  const [showSecurity, setShowSecurity] = React.useState(false);
  const [showLifecycle, setShowLifecycle] = React.useState(false);
  const [showDeployment, setShowDeployment] = React.useState(false);
  const [enabledGroups, setEnabledGroups] = React.useState(() => Object.fromEntries(groupNames.map((name) => [name, true])));
  const [selected, setSelected] = React.useState(undefined);

  const graphState = React.useMemo(() => ({
    view,
    detailLevel,
    showFutureState,
    timelineYear,
    showDataFlow,
    showSecurity,
    showLifecycle,
    showDeployment,
    enabledGroups,
  }), [view, detailLevel, showFutureState, timelineYear, showDataFlow, showSecurity, showLifecycle, showDeployment, enabledGroups]);

  const graph = React.useMemo(() => (
    view === 'business'
      ? buildBusinessGraph(React, dagre, model)
      : buildGlobalGraph(React, dagre, model, graphState)
  ), [view, model, dagre, graphState]);
  const [nodes, setNodes] = React.useState(graph.nodes);
  const [edges, setEdges] = React.useState(graph.edges);

  React.useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [graph]);

  const onNodesChange = React.useCallback((changes) => setNodes((current) => applyNodeChanges(changes, current)), [applyNodeChanges]);
  const onEdgesChange = React.useCallback((changes) => setEdges((current) => applyEdgeChanges(changes, current)), [applyEdgeChanges]);

  const selectedView = viewOptions.find((candidate) => candidate.id === view) ?? viewOptions[0];
  const selectedRaw = selected?.data?.raw ?? selected;
  const graphView = view === 'network' || view === 'capability' || view === 'dependency' || view === 'business';

  return React.createElement(
    'section',
    { className: 'tf-ea-viewer', 'data-ea-viewer': 'ready', 'data-ea-view': view },
    React.createElement(
      'div',
      { className: 'tf-ea-shell' },
      React.createElement(
        'aside',
        { className: 'tf-ea-sidebar' },
        React.createElement(
          'div',
          { className: 'tf-ea-brand' },
          React.createElement('div', { className: 'tf-ea-compass' }, 'EA'),
          React.createElement('div', null, React.createElement('div', { className: 'tf-ea-brand-title' }, 'NCIA EA Portal'), React.createElement('p', { className: 'tf-ea-eyebrow' }, 'Local fixture')),
        ),
        React.createElement(
          'nav',
          { className: 'tf-ea-nav', 'aria-label': 'EA viewer views' },
          viewOptions.map((option) => React.createElement(
            'button',
            {
              key: option.id,
              type: 'button',
              'aria-pressed': view === option.id,
              onClick: () => {
                setView(option.id);
                setSelected(undefined);
              },
            },
            option.label,
          )),
        ),
        React.createElement(
          'div',
          { className: 'tf-ea-panel' },
          React.createElement('h3', null, 'Fixture'),
          React.createElement('div', { className: 'tf-ea-row-label' }, `${model.recordCount} records`),
          React.createElement('div', { className: 'tf-ea-row-label' }, `${model.systems.length} systems / ${model.services.length} services`),
          React.createElement('div', { className: 'tf-ea-row-label' }, `${diagnostics.length} diagnostics`),
        ),
      ),
      React.createElement(
        'main',
        { className: 'tf-ea-stage' },
        React.createElement(
          'div',
          { className: 'tf-ea-header' },
          React.createElement('h2', null, view === 'business' ? 'Business Architecture Dashboard' : title),
          React.createElement('p', null, selectedView.label),
        ),
        graphView && React.createElement(
          'div',
          { className: 'tf-ea-flow', 'data-ea-graph-stage': true },
          React.createElement(
            ReactFlow,
            {
              nodes,
              edges,
              onNodesChange,
              onEdgesChange,
              onNodeClick: (event, node) => setSelected(node),
              fitView: true,
              minZoom: 0.2,
              maxZoom: 1.6,
            },
            React.createElement(Background, { color: '#1e293b', gap: 20, size: 1 }),
            React.createElement(Controls, { style: { background: 'rgba(15,23,42,.85)', border: '1px solid rgba(59,130,246,.35)', color: '#fff' } }),
          ),
        ),
        view === 'datacenter' && React.createElement(DatacenterView, { model, selected: selectedRaw, setSelected }),
        view === 'projects' && React.createElement(ListDetailView, { title: 'Project Portfolio', eyebrow: 'Project', items: model.projects, onSelect: setSelected }),
        view === 'process' && React.createElement(ListDetailView, { title: 'Business Processes', eyebrow: 'Process', items: model.businessProcesses, onSelect: setSelected }),
        React.createElement(DetailPanel, { selected }),
        showFutureState && React.createElement(
          'div',
          { className: 'tf-ea-timeline', 'data-ea-timeline': true },
          React.createElement(
            'div',
            { className: 'tf-ea-range-value' },
            React.createElement('span', null, '2012 (Past)'),
            React.createElement('strong', { 'data-ea-timeline-year': true }, timelineYear),
            React.createElement('span', null, '2042 (Future)'),
          ),
          React.createElement('input', { className: 'tf-ea-range', 'aria-label': 'Timeline year', type: 'range', min: 2012, max: 2042, value: timelineYear, onChange: (event) => setTimelineYear(Number(event.target.value)) }),
        ),
      ),
      React.createElement(
        'aside',
        { className: 'tf-ea-controls', 'data-ea-controls': true },
        React.createElement(
          'div',
          { className: 'tf-ea-panel' },
          React.createElement('h3', null, 'Control Dashboard'),
          React.createElement(
            'div',
            { className: 'tf-ea-field' },
            React.createElement('label', { htmlFor: 'tf-ea-view-select' }, 'Active Base Map'),
            React.createElement(
              'select',
              { id: 'tf-ea-view-select', value: view, onChange: (event) => setView(event.target.value), 'data-ea-view-select': true },
              viewOptions.map((option) => React.createElement('option', { key: option.id, value: option.id }, option.label)),
            ),
          ),
          React.createElement(
            'div',
            { className: 'tf-ea-field' },
            React.createElement(
              'div',
              { className: 'tf-ea-range-value' },
              React.createElement('label', { htmlFor: 'tf-ea-detail-level' }, 'Level of Detail'),
              React.createElement('strong', { 'data-ea-detail-level-label': true }, detailLevel === 1 ? 'Manager' : detailLevel === 2 ? 'Architect' : 'Tech Nerd'),
            ),
            React.createElement('input', { id: 'tf-ea-detail-level', className: 'tf-ea-range', 'aria-label': 'Level of detail', type: 'range', min: 1, max: 3, step: 1, value: detailLevel, onChange: (event) => setDetailLevel(Number(event.target.value)), 'data-ea-detail-level': true }),
          ),
        ),
        React.createElement(
          'div',
          { className: 'tf-ea-panel' },
          React.createElement('h3', null, 'Toggle Overlays'),
          [
            ['Future State (Timeline)', showFutureState, setShowFutureState],
            ['Data Flow (Exchange)', showDataFlow, setShowDataFlow],
            ['Security Architecture', showSecurity, setShowSecurity],
            ['Lifecycle / Tech Radar', showLifecycle, setShowLifecycle],
            ['Hosting Locations', showDeployment, setShowDeployment],
          ].map(([label, value, setter]) => React.createElement(
            'label',
            { key: label, className: 'tf-ea-check' },
            React.createElement('input', { type: 'checkbox', checked: value, onChange: (event) => setter(event.target.checked) }),
            label,
          )),
        ),
        React.createElement(
          'div',
          { className: 'tf-ea-panel' },
          React.createElement('h3', null, 'Filter Capabilities'),
          groupNames.map((groupName) => React.createElement(
            'label',
            { key: groupName, className: 'tf-ea-check' },
            React.createElement('input', {
              type: 'checkbox',
              checked: enabledGroups[groupName] !== false,
              onChange: (event) => setEnabledGroups((current) => ({ ...current, [groupName]: event.target.checked })),
              style: { accentColor: groupColor(groupName) },
            }),
            React.createElement('span', { style: { color: groupColor(groupName) } }, groupName),
          )),
        ),
      ),
    ),
  );
}

async function mountEaViewerRuntime(container, model) {
  ensurePackageStyle(container);
  const previous = {
    display: container.style.display,
    flex: container.style.flex,
    width: container.style.width,
    height: container.style.height,
    minHeight: container.style.minHeight,
    overflow: container.style.overflow,
  };
  container.style.display = 'flex';
  container.style.flex = '1 1 auto';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.minHeight = '0';
  container.style.overflow = 'hidden';

  const root = createRoot(container);
  try {
    const [reactFlowModule, dagreModule, graphlibModule] = await Promise.all([
      import('@xyflow/react'),
      import('dagre-d3-es/src/dagre/index.js'),
      import('dagre-d3-es/src/graphlib/index.js'),
    ]);
    const dagre = createDagreLayoutEngine(dagreModule, graphlibModule);
    if (!dagre) {
      throw new Error('Dagre ESM layout module did not expose graphlib.Graph.');
    }
    verifyDagreLayoutEngine(dagre);
    root.render(React.createElement(ViewerApp, {
      title: model.title,
      model: model.model,
      diagnostics: model.diagnostics,
      modules: {
        ReactFlow: reactFlowModule.ReactFlow,
        Background: reactFlowModule.Background,
        Controls: reactFlowModule.Controls,
        applyNodeChanges: reactFlowModule.applyNodeChanges,
        applyEdgeChanges: reactFlowModule.applyEdgeChanges,
        dagre,
      },
    }));
  } catch (error) {
    root.render(React.createElement(
      'section',
      { className: 'tf-ea-viewer tf-ea-viewer--fallback' },
      React.createElement(
        'div',
        { className: 'tf-ea-fallback' },
        React.createElement('p', { className: 'tf-ea-eyebrow' }, 'Enterprise Architecture Viewer'),
        React.createElement('h3', null, 'Viewer runtime failed to load'),
        React.createElement('ul', null, React.createElement('li', null, error?.message ?? 'Unknown runtime error')),
      ),
    ));
  }

  return () => {
    root.unmount();
    container.style.display = previous.display;
    container.style.flex = previous.flex;
    container.style.width = previous.width;
    container.style.height = previous.height;
    container.style.minHeight = previous.minHeight;
    container.style.overflow = previous.overflow;
    container.innerHTML = '';
  };
}

export const eaViewerSurfaceContribution = {
  id: eaViewerSurfaceId,
  label: 'EA Dashboard viewer',
  description: 'Open EA Dashboard Django fixture JSON in a local enterprise architecture viewer.',
  kind: 'enterprise-architecture-viewer',
  localName: 'ea-dashboard',
  capabilities: [eaViewerCapabilityId],
  readOnly: true,
  defaultActive: true,
  resourcePredicate: eaDashboardJsonDocumentPredicate,
  documentPredicate: eaDashboardJsonDocumentPredicate,
  resourceRepresentations: ['text'],
  languageIds: ['json'],
  mimeTypes: ['application/json', 'text/json'],
  fileExtensions: ['json'],
  placements: ['main', 'popup'],
  openWithPriority: 90,
  open(execution = {}) {
    const title = execution.resourceTitle ?? execution.resource?.path ?? 'EA Dashboard viewer';
    const viewerModel = createEaViewerModel(execution.sourceText ?? '', {
      title,
      resource: execution.resource,
    });
    const html = viewerModel.recognized
      ? '<section class="tf-ea-viewer tf-ea-viewer--fallback"><div class="tf-ea-fallback"><p class="tf-ea-eyebrow">Enterprise Architecture Viewer</p><h3>Loading local EA Dashboard viewer...</h3></div></section>'
      : createFailureHtml(title, viewerModel.diagnostics);

    return {
      mountId: `${execution.session?.id ?? 'surface'}:${this.id}:${execution.updatedAt ?? 'current'}:${viewerModel.recognized ? 'recognized' : 'fallback'}`,
      summary: viewerModel.recognized
        ? 'Local EA Dashboard fixture viewer.'
        : 'EA Dashboard fixture was not recognized.',
      detail: viewerModel.recognized
        ? `${viewerModel.model.recordCount} records / ${viewerModel.diagnostics.length} diagnostics`
        : 'JSON fallback',
      readOnly: true,
      diagnostics: viewerModel.diagnostics,
      inspectorSections: [
        {
          eyebrow: 'Runtime',
          icon: 'status',
          title: 'EA Dashboard viewer',
          rows: [
            { label: 'Renderer', value: 'React Flow / Dagre' },
            { label: 'Source', value: 'Local JSON fixture' },
            { label: 'Network', value: 'No default calls' },
          ],
        },
      ],
      surface: {
        model: {
          html,
          diagnostics: viewerModel.diagnostics,
        },
        mount(container) {
          if (!viewerModel.recognized || !viewerModel.model) {
            ensurePackageStyle(container);
            container.innerHTML = html;
            return () => {
              container.innerHTML = '';
            };
          }

          let disposed = false;
          let disposeRuntime = () => {};
          container.innerHTML = html;
          void (async () => {
            disposeRuntime = await mountEaViewerRuntime(container, viewerModel);
            if (disposed) {
              disposeRuntime();
            }
          })();
          return () => {
            disposed = true;
            disposeRuntime();
          };
        },
      },
    };
  },
};

export function createEaViewerContributionManifest(overrides = {}) {
  return createContributionManifest('@textforge/ea-viewer', {
    name: '@textforge/ea-viewer',
    version: '0.1.0',
    description: 'Local EA Dashboard JSON fixture viewer for TextForge.',
    dependencies: [
      '@textforge/core',
      ...(overrides.dependencies ?? []),
    ],
    capabilities: overrides.capabilities ?? [
      createCapability(eaViewerCapabilityId, {
        localName: 'ea-dashboard',
        aliases: ['ea', 'enterprise-architecture'],
        description: 'Open EA Dashboard JSON fixture exports in a local read-only viewer.',
        defaultActive: true,
        documentPredicate: eaDashboardJsonDocumentPredicate,
      }),
    ],
    surfaces: overrides.surfaces ?? [eaViewerSurfaceContribution],
  });
}

export const contributions = createEaViewerContributionManifest();
