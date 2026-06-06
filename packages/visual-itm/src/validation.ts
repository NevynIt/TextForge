import type { VisualItmDiagnostic, VisualItmDocument } from './types.js';

export declare function isVisualItmDocument(input: unknown): input is VisualItmDocument;
export declare function validateVisualItmDocument(document: unknown): ReadonlyArray<VisualItmDiagnostic>;
