import type { JsMindSurfaceModel } from './model.js';

export declare function mountJsMindRuntime(
  container: Element,
  model: JsMindSurfaceModel,
  execution?: {
    readonly openSourceRange?: (
      sourcePath: string,
      sourceRange?: unknown,
      options?: { readonly placement?: string },
    ) => unknown;
  },
): () => void;
