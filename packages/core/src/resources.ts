import type {
  CanonicalPatch,
  CanonicalPatchOperation,
  Diagnostic,
  LanguageDefinition,
  LanguageId,
  ResourceBadgeToken,
  ResourceFacts,
  ResourcePredicate,
  ResourceRef,
  ResourceRepresentation,
  Severity,
  SourcePosition,
  SourceRange,
  PipelineValue,
} from './types';

export declare function createSourcePosition(line: number, column: number, offset?: number): SourcePosition;
export declare function createSourceRange(start: SourcePosition, end: SourcePosition): SourceRange;
export declare function createResourceRef(resourceId: string, overrides?: Partial<ResourceRef>): ResourceRef;
export declare function createResourceBadgeToken(overrides?: Partial<ResourceBadgeToken>): ResourceBadgeToken;
export declare function createDiagnostic(message: string, severity?: Severity, overrides?: Partial<Diagnostic>): Diagnostic;
export declare function createPipelineValue<TValue = unknown>(
  kind: string,
  value: TValue,
  overrides?: Partial<PipelineValue<TValue>>,
): PipelineValue<TValue>;
export declare function createCanonicalPatch(
  target: ResourceRef,
  operations: ReadonlyArray<CanonicalPatchOperation>,
  overrides?: Partial<CanonicalPatch>,
): CanonicalPatch;
export declare function createResourceFacts(input?: Partial<ResourceRef> & { readonly id?: string }): ResourceFacts;
export declare function hasResourceCapability(
  resource: Partial<ResourceRef> | undefined,
  capabilityId: ResourceCapabilityId | string,
): boolean;
export declare function createResourcePredicate(overrides?: Partial<ResourcePredicate>): ResourcePredicate;
export declare function matchesResourcePredicate(
  predicate: ResourcePredicate,
  input?: Partial<ResourceRef> & { readonly id?: string },
): boolean;
export declare function getLanguageDefinition(languageId: LanguageId | string | undefined): LanguageDefinition | undefined;
export declare function getResourceRepresentation(resource?: Partial<ResourceRef> & { readonly kind?: string }): ResourceRepresentation | undefined;
export declare function inferLanguageId(input: {
  readonly path?: string;
  readonly mimeType?: string;
  readonly fallback?: LanguageId;
}): LanguageId;
export declare function inferResourceRepresentation(input: {
  readonly path?: string;
  readonly mimeType?: string;
  readonly bytes?: Uint8Array;
  readonly fallback?: ResourceRepresentation;
}): ResourceRepresentation;
