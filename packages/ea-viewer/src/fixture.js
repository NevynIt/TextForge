import { createDiagnostic } from '@textforge/core';

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
