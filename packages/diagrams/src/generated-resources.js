import { createGeneratedResourceDescriptor } from '@textforge/pipeline';

export function createGeneratedDiagramPath(basePath, blockKind, blockId, extension) {
  const normalizedBase = String(basePath ?? '/generated/diagram').replaceAll('\\', '/').replace(/\/+$/, '');
  return `${normalizedBase}-${blockKind}-${blockId}.${extension}`;
}

export function createDiagramGeneratedResources(input) {
  const svgPath = createGeneratedDiagramPath(
    input.generatedAssetBasePath,
    input.blockKind,
    input.blockId,
    'svg',
  );
  const resources = [
    createGeneratedResourceDescriptor({
      path: svgPath,
      title: svgPath.split('/').pop(),
      representation: 'text',
      mimeType: 'image/svg+xml',
      languageId: 'svg',
      text: input.svg,
      format: 'svg',
      pipelineId: input.pipelineId,
      sourceResourceId: input.sourceResource?.resourceId,
      sourcePath: input.sourceResource?.path,
      sourceUpdatedAt: input.sourceUpdatedAt,
      blockId: input.blockId,
      blockKind: input.blockKind,
    }),
  ];

  if (input.pngBytes instanceof Uint8Array) {
    const pngPath = createGeneratedDiagramPath(
      input.generatedAssetBasePath,
      input.blockKind,
      input.blockId,
      'png',
    );
    resources.push(
      createGeneratedResourceDescriptor({
        path: pngPath,
        title: pngPath.split('/').pop(),
        representation: 'bytes',
        mimeType: 'image/png',
        bytes: input.pngBytes,
        format: 'png',
        pipelineId: input.pipelineId,
        sourceResourceId: input.sourceResource?.resourceId,
        sourcePath: input.sourceResource?.path,
        sourceUpdatedAt: input.sourceUpdatedAt,
        blockId: input.blockId,
        blockKind: input.blockKind,
      }),
    );
  }

  return resources;
}
