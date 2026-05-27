import type {
  ContributionManifest,
  Diagnostic,
  PipelineContribution,
  PipelineValue,
} from '@textforge/core';

export interface LuaExecutionLimits {
  readonly maxInstructions: number;
  readonly maxWallTimeMs: number;
  readonly maxOutputBytes: number;
  readonly maxRecursionDepth: number;
  readonly instructionHookInterval: number;
}

export interface LuaConsoleLine {
  readonly kind: string;
  readonly text: string;
}

export interface LuaAutomationDefinition {
  readonly id: string;
  readonly name: string;
  readonly input: ReadonlyArray<string>;
  readonly output: string;
  readonly category: string;
  readonly description?: string;
  readonly localName: string;
  readonly contributionId: string;
  readonly sourcePath: string;
  readonly sourceResourceId?: string;
  readonly source: string;
}

export interface LuaPowerSessionHostObject {
  readonly label?: string;
  readonly description?: string;
  readonly api?: Record<string, any>;
}

export interface LuaPowerSessionState {
  readonly elevated: boolean;
  readonly availableHostObjects: ReadonlyArray<{
    readonly id: string;
    readonly label: string;
    readonly description?: string;
  }>;
  readonly recoveryAvailable: boolean;
}

export interface LuaPowerSessionOptions {
  readonly elevated?: boolean;
  readonly hostObjects?: Readonly<Record<string, Record<string, any> | LuaPowerSessionHostObject>>;
  readonly requestRecovery?: () => unknown;
  readonly onStateChange?: (state: LuaPowerSessionState) => void;
}

export interface LuaRunResult {
  readonly ok: boolean;
  readonly value?: PipelineValue;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
  readonly consoleLines: ReadonlyArray<LuaConsoleLine>;
  readonly definitions?: ReadonlyArray<LuaAutomationDefinition>;
  readonly session?: LuaPowerSessionState;
}

export interface LuaAutomationFileRecord {
  readonly id?: string;
  readonly path: string;
  readonly enabled: boolean;
  readonly source: string;
  readonly updatedAt?: string;
}

export declare const luaAutomationRoot: '/.textforge/automation/lua';
export declare const luaConsoleResourceMimeType: 'application/x-textforge-lua-console';
export declare const luaConsoleResourcePath: '/.textforge/runtime/lua-console.session';
export declare const luaCapabilityIds: {
  readonly manualRun: '@textforge/lua/capability/manual-run';
  readonly automation: '@textforge/lua/capability/automation';
  readonly console: '@textforge/lua/capability/console';
};
export declare const defaultLuaExecutionLimits: LuaExecutionLimits;
export declare const luaBlockedGlobals: ReadonlyArray<string>;
export declare const luaBlockedModules: ReadonlyArray<string>;
export declare const luaCommandContributions: ReadonlyArray<import('@textforge/core').CommandContribution>;
export declare const luaCapabilities: ReadonlyArray<import('@textforge/core').Capability>;
export declare function createLuaConsoleSurface(options?: {
  readonly getState?: () => unknown;
  readonly getSessionState?: () => LuaPowerSessionState | undefined;
  readonly requestRecovery?: () => unknown | Promise<unknown>;
  readonly setState?: (nextState: unknown) => void;
  readonly runCommand?: (command: string) => unknown | Promise<unknown>;
}): {
  readonly id: string;
  mount(container: HTMLElement): () => void;
};
export declare const luaConsoleSurfaceContribution: import('@textforge/surfaces').SurfaceContribution;

export declare function createLuaDiagnostic(
  code: string,
  message: string,
  severity?: import('@textforge/core').Severity,
  overrides?: Partial<Diagnostic>,
): Diagnostic;
export declare function createLuaExecutionLimits(overrides?: Partial<LuaExecutionLimits>): LuaExecutionLimits;
export declare function isLuaAutomationPath(path: string, automationRoot?: string): boolean;
export declare function isLuaResource(entry: unknown): boolean;
export declare function resolveLuaModuleCandidatePaths(
  scriptPath: string,
  moduleName: string,
  automationRoot?: string,
): ReadonlyArray<string>;
export declare function listLuaAutomationFiles(
  workspaceInput: unknown,
  options?: {
    readonly automationRoot?: string;
    readonly disabledPaths?: ReadonlyArray<string>;
  },
): ReadonlyArray<LuaAutomationFileRecord>;
export declare function createLuaContributionManifest(options?: {
  readonly definitions?: ReadonlyArray<LuaAutomationDefinition>;
  readonly executionService?: LuaExecutionService;
}): ContributionManifest;
export declare const contributions: ContributionManifest;
export declare function runLuaScript(options?: {
  readonly source?: string;
  readonly scriptPath?: string;
  readonly mode?: 'discover' | 'run';
  readonly sourceResourceId?: string;
  readonly input?: unknown;
  readonly workspace?: unknown;
  readonly limits?: Partial<LuaExecutionLimits>;
  readonly automationRoot?: string;
  readonly automationDefinitions?: ReadonlyArray<LuaAutomationDefinition>;
  readonly pipelineDefinitions?: ReadonlyArray<LuaAutomationDefinition>;
  readonly recursionDepth?: number;
  readonly expectedOutput?: string;
  readonly invokePipelineStep?: (input: { readonly id: string; readonly value: unknown }) => unknown;
  readonly invokeActionStep?: (input: { readonly id: string; readonly value: unknown }) => unknown;
  readonly powerSession?: LuaPowerSessionOptions;
}): LuaRunResult;
export declare function runLuaAutomationDefinition(
  definition: LuaAutomationDefinition,
  options?: Parameters<typeof runLuaScript>[0],
): LuaRunResult;
export declare function discoverLuaAutomations(options?: {
  readonly workspace?: unknown;
  readonly limits?: Partial<LuaExecutionLimits>;
  readonly automationRoot?: string;
  readonly disabledPaths?: ReadonlyArray<string>;
}): {
  readonly definitions: ReadonlyArray<LuaAutomationDefinition>;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
};

export interface LuaExecutionService {
  getAutomationDefinitions(): ReadonlyArray<LuaAutomationDefinition>;
  setAutomationDefinitions(definitions?: ReadonlyArray<LuaAutomationDefinition>): ReadonlyArray<LuaAutomationDefinition>;
  setPipelineDefinitions(definitions?: ReadonlyArray<LuaAutomationDefinition>): ReadonlyArray<LuaAutomationDefinition>;
  getConsoleSessionState(sessionKey: string): LuaPowerSessionState | undefined;
  runSnippet(runOptions?: Parameters<typeof runLuaScript>[0]): LuaRunResult;
  runConsoleCommand(
    sessionKey: string,
    command: string,
    runOptions?: Parameters<typeof runLuaScript>[0],
  ): LuaRunResult;
  runAutomation(
    automationId: string,
    runOptions?: Parameters<typeof runLuaScript>[0],
  ): {
    readonly output?: PipelineValue;
    readonly diagnostics: ReadonlyArray<Diagnostic>;
  };
  discover(
    workspace: unknown,
    discoverOptions?: Parameters<typeof discoverLuaAutomations>[0],
  ): {
    readonly definitions: ReadonlyArray<LuaAutomationDefinition>;
    readonly diagnostics: ReadonlyArray<Diagnostic>;
  };
  createContributionManifest(): ContributionManifest;
}

export declare function createLuaExecutionService(options?: Parameters<typeof runLuaScript>[0]): LuaExecutionService;
