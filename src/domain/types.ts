export type ContributionKind = "transformer" | "viewer" | "editor" | "linter";
export type PipelineStatus = "available" | "missing-plugin" | "missing-contribution" | "disabled-plugin" | "runtime-failed" | "failed";
export type Severity = "error" | "warning" | "information" | "observation";

export interface TextDocument {
  id: string;
  fileName: string;
  languageId: string;
  text: string;
  version: number;
  dirty: boolean;
  identity: DocumentIdentity;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentIdentity {
  color: string;
  badgeLabel: string;
  badgeKind?: string;
  shapeCode?: string;
}

export interface LanguageDefinition {
  id: string;
  name: string;
  parentId?: string;
  extensions?: string[];
  mediaType?: string;
  aliases?: string[];
  description?: string;
}

export interface Diagnostic {
  id?: string;
  source: string;
  severity: Severity;
  message: string;
  languageId?: string;
  documentId?: string;
  documentVersion?: number;
  pipelineId?: string;
  pipelineRunId?: string;
  pipelineStepId?: string;
  contributionId?: string;
  from?: number;
  to?: number;
  line?: number;
  column?: number;
  modelPath?: string;
  fixAction?: unknown;
  range?: SourceRange;
  target?: Record<string, unknown>;
  stepId?: string;
}

export interface SourceRange {
  from: number;
  to: number;
  line: number;
  column: number;
}

export interface TreeNode {
  id: string;
  declaredId?: string;
  label: string;
  type?: string;
  tags?: string[];
  attributes?: Record<string, string>;
  style?: Record<string, string>;
  details?: string;
  children: TreeNode[];
  links?: GraphEdge[];
  sourceRange?: SourceRange;
}

export interface TableModel {
  columns: string[];
  rows: string[][];
  delimiter: string;
  sourceText?: string;
  diagnostics?: Diagnostic[];
}

export interface GraphNode {
  id: string;
  label: string;
  type?: string;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
  style?: Record<string, string>;
  details?: string;
  parent?: string;
  classes?: string[];
  hidden?: boolean;
  metrics?: Record<string, number>;
  sourceRange?: SourceRange;
  data?: Record<string, unknown>;
}

export interface GraphEdge {
  id?: string;
  source?: string;
  target: string;
  label?: string;
  type?: string;
  weight?: number;
  width?: number;
  color?: string;
  style?: Record<string, string>;
  details?: string;
  curve?: "straight" | "bezier" | "taxi";
  classes?: string[];
  hidden?: boolean;
  sourceRange?: SourceRange;
  data?: Record<string, unknown>;
}

export interface GraphModel {
  graph?: {
    id?: string;
    label?: string;
    attrs?: Record<string, unknown>;
  };
  nodes: GraphNode[];
  edges: Array<Required<Pick<GraphEdge, "source" | "target">> & Omit<GraphEdge, "source" | "target">>;
  directed?: boolean;
  layouts?: Record<string, unknown>;
  diagnostics?: Diagnostic[];
}

export type PipelineValue =
  | { kind: "text"; languageId: string; text: string; fileName?: string; documentId?: string; diagnostics?: Diagnostic[] }
  | { kind: "model"; modelType: "model.tree"; data: TreeNode[]; diagnostics?: Diagnostic[] }
  | { kind: "model"; modelType: "model.table"; data: TableModel; diagnostics?: Diagnostic[] }
  | { kind: "model"; modelType: "model.graph"; data: GraphModel; diagnostics?: Diagnostic[] }
  | { kind: "html"; html: string; diagnostics?: Diagnostic[] }
  | { kind: "svg"; svg: string; diagnostics?: Diagnostic[] };

export interface ViewerCapabilities {
  zoom?: boolean;
  pan?: boolean;
  search?: boolean;
  filter?: boolean;
  fold?: boolean;
  inspect?: boolean;
  select?: boolean;
  hover?: boolean;
  export?: boolean;
  presets?: boolean;
  animation?: boolean;
  tooltips?: boolean;
  legend?: boolean;
  minimap?: boolean;
  shortcuts?: boolean;
}

export type ViewerSettingValue = string | number | boolean | string[] | null;

export interface ViewerControlDefinition {
  id: string;
  label: string;
  type: "select" | "boolean" | "number" | "range" | "text" | "multi-select";
  defaultValue: ViewerSettingValue;
  options?: Array<{ label: string; value: ViewerSettingValue }>;
  group?: string;
  min?: number;
  max?: number;
  step?: number;
}

interface ViewerResultBase {
  title: string;
  capabilities?: ViewerCapabilities;
  controls?: ViewerControlDefinition[];
  diagnostics?: Diagnostic[];
}

export type ViewerResult =
  | (ViewerResultBase & { kind: "html"; html: string })
  | (ViewerResultBase & { kind: "svg"; svg: string })
  | (ViewerResultBase & { kind: "tree"; nodes: TreeNode[] })
  | (ViewerResultBase & { kind: "table"; table: TableModel })
  | (ViewerResultBase & { kind: "graph"; graph: GraphModel; engine: "cytoscape" | "sigma" | "static" })
  | (ViewerResultBase & { kind: "mindmap"; nodes: TreeNode[] })
  | (ViewerResultBase & { kind: "editor-skeleton"; editorKind: "tree" | "graph"; message: string });

export interface RuntimeLoader {
  load<T>(id: string, loader: () => Promise<T>): Promise<T>;
}

export interface ContributionContext {
  runtime: RuntimeLoader;
  documents?: TextDocument[];
}

export interface TransformerContribution {
  kind: "transformer";
  id: string;
  name: string;
  input: string | string[];
  output: string;
  transform(value: PipelineValue, context: ContributionContext): Promise<PipelineValue> | PipelineValue;
}

export interface ViewerContribution {
  kind: "viewer";
  id: string;
  name: string;
  input: string | string[];
  capabilities?: ViewerCapabilities;
  render(value: PipelineValue, context: ContributionContext): Promise<ViewerResult> | ViewerResult;
}

export interface EditorContribution {
  kind: "editor";
  id: string;
  name: string;
  input: string | string[];
  create(value: PipelineValue, context: ContributionContext): Promise<ViewerResult> | ViewerResult;
}

export interface LinterContribution {
  kind: "linter";
  id: string;
  name: string;
  accepts: string | string[];
  lint(document: TextDocument, context: ContributionContext): Promise<Diagnostic[]> | Diagnostic[];
}

export type Contribution = TransformerContribution | ViewerContribution | EditorContribution | LinterContribution;

export interface PipelineContribution {
  id: string;
  name: string;
  input: string | string[];
  steps: string[];
  description?: string;
  category?: string;
}

export interface TextForgePlugin {
  id: string;
  name: string;
  version: string;
  languages?: LanguageDefinition[];
  linters?: LinterContribution[];
  transformers?: TransformerContribution[];
  viewers?: ViewerContribution[];
  editors?: EditorContribution[];
  pipelines?: PipelineContribution[];
}

export interface PluginManifestEntry {
  id: string;
  name: string;
  version: string;
  autoLoad?: boolean;
  languages?: LanguageDefinition[];
  pipelines?: PipelineContribution[];
  contributionIds: string[];
  load: () => Promise<{ default: TextForgePlugin } | TextForgePlugin>;
}

export interface PluginState {
  id: string;
  name: string;
  version: string;
  status: "available" | "loaded" | "failed";
  autoload: boolean;
  error?: string;
  contributionIds: string[];
}

export interface PipelineTraceStep {
  stepId: string;
  contributionKind?: ContributionKind;
  status: PipelineStatus;
  inputType: string;
  outputType?: string;
  documentId?: string;
  documentName?: string;
  documentLanguageId?: string;
  documentVersion?: number;
  documentIdentity?: DocumentIdentity;
  targetDocumentId?: string;
  targetDocumentName?: string;
  message?: string;
  diagnostics?: Diagnostic[];
  serializedValue?: string;
}

export interface PipelineRunResult {
  pipeline: PipelineContribution;
  status: PipelineStatus;
  trace: PipelineTraceStep[];
  value?: PipelineValue;
  viewerResult?: ViewerResult;
  editorResult?: ViewerResult;
  diagnostics: Diagnostic[];
}

export interface PopupRecord {
  id: string;
  kind: "viewer" | "diagnostics" | "plugin-manager" | "pipeline-trace";
  title: string;
  documentId?: string;
  documentName?: string;
  documentLanguageId?: string;
  sourceVersion?: number;
  documentIdentity?: DocumentIdentity;
  pipelineId?: string;
  contributionId?: string;
  result?: ViewerResult;
  diagnostics?: Diagnostic[];
  trace?: PipelineTraceStep[];
  createdAt: string;
  refreshedAt?: string;
  followSource: boolean;
  detached: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  restoreFrame?: PopupFrameRecord;
  zoom: number;
  query: string;
  searchCount?: number;
  searchIndex?: number;
  searchRevision?: number;
  searchDirection?: "previous" | "next";
  toolbarAction?: string;
  toolbarActionRevision?: number;
  settings: Record<string, ViewerSettingValue>;
  selectedItemId?: string;
  acknowledgedDiagnosticKeys?: string[];
}

export interface PopupFrameRecord {
  x: number;
  y: number;
  width: number;
  height: number;
}
