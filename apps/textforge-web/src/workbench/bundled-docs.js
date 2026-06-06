const emptyBundledDocs = Object.freeze({
  generatedAt: '1970-01-01T00:00:00.000Z',
  folders: [],
  docs: [],
});

function readBundledDocsPayload() {
  if (typeof globalThis === 'undefined') {
    return emptyBundledDocs;
  }

  const payload = globalThis.TextForgeBundledDocs;
  if (!payload || typeof payload !== 'object') {
    return emptyBundledDocs;
  }

  return {
    generatedAt: typeof payload.generatedAt === 'string'
      ? payload.generatedAt
      : emptyBundledDocs.generatedAt,
    folders: Array.isArray(payload.folders) ? payload.folders : emptyBundledDocs.folders,
    docs: Array.isArray(payload.docs) ? payload.docs : emptyBundledDocs.docs,
  };
}

const payload = readBundledDocsPayload();

export const bundledDocsGeneratedAt = payload.generatedAt;
export const bundledDocFolders = payload.folders;
export const bundledDocs = payload.docs;
