export interface DocumentationTopic {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly href?: string;
  readonly tags?: ReadonlyArray<string>;
}

export interface SampleWorkspaceConvention {
  readonly id: string;
  readonly title: string;
  readonly purpose: string;
  readonly canonicalResources: ReadonlyArray<string>;
  readonly notes: ReadonlyArray<string>;
}

export interface PackageDocumentationTemplate {
  readonly title: string;
  readonly purpose: string;
  readonly sections: ReadonlyArray<string>;
  readonly body: string;
}

export const docsIndex = {
  packageId: '@textforge/examples-docs',
  topics: [
    {
      id: 'workspace-conventions',
      title: 'Workspace conventions',
      summary: 'Sample conventions for naming, resource layout, and legacy provenance.',
      tags: ['workspace', 'fixtures', 'provenance'],
    },
    {
      id: 'package-doc-template',
      title: 'Package documentation template',
      summary: 'A minimal template that package guides can reuse for public docs.',
      tags: ['docs', 'template', 'package'],
    },
  ] satisfies ReadonlyArray<DocumentationTopic>,
  sampleWorkspaces: [
    {
      id: 'starter-workspace',
      title: 'Starter workspace',
      purpose: 'Show the expected root layout and canonical resource naming.',
      canonicalResources: ['workspace.json', 'docs/index.md', 'fixtures/'],
      notes: [
        'Treat Markdown and structured model files as canonical workspace inputs.',
        'Keep generated previews and exports as derived resources.',
      ],
    },
  ] satisfies ReadonlyArray<SampleWorkspaceConvention>,
  packageDocumentationTemplate: {
    title: 'Package implementation guide template',
    purpose: 'Use this as the baseline for package-specific roadmap guidance and local docs.',
    sections: [
      'Purpose',
      'Ownership rule',
      'Allowed dependencies',
      'Public surface',
      'Milestone plan',
      'Tests and definition of done',
      'Non-goals',
    ],
    body: `# Package implementation guide template

## Purpose

Describe the package responsibility in one short paragraph.

## Ownership rule

State which contracts and tests the package owns.

## Allowed dependencies

List internal dependencies first, then third-party candidates if any.

## Public surface

Describe the exported types, commands, contributions, or services.

## Milestone plan

Map the package to the roadmap phases it participates in.

## Tests and definition of done

Describe the checks that make the package ready.

## Non-goals

Describe the work this package explicitly does not own.`,
  } satisfies PackageDocumentationTemplate,
} as const;

export const contributions = {
  id: '@textforge/examples-docs',
  diagnostics: [],
  commands: [],
  surfaces: [],
  pipelines: [],
} as const;
