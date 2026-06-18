export function createBlobUrlDriver() {
  return {
    createObjectURL(source) {
      const blob = new Blob([source.data ?? new Uint8Array()], { type: source.type ?? 'application/octet-stream' });
      return URL.createObjectURL(blob);
    },
    revokeObjectURL(url) {
      URL.revokeObjectURL(url);
    },
  };
}

export function sanitizeFilenameSegment(value, fallback = 'textforge-workspace') {
  const normalized = String(value ?? '')
    .trim()
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}


export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function createZipFilename(label, fallback) {
  return `${sanitizeFilenameSegment(label, fallback)}.zip`;
}

export function isWorkspaceResource(entry) {
  return entry?.kind === 'resource';
}

export function downloadBytes(filename, bytes, mimeType = 'application/octet-stream') {
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

const filePickerCancelDelayMs = 500;

export function pickLocalFile({ accept } = {}) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    let settled = false;
    input.type = 'file';
    if (accept) {
      input.accept = accept;
    }
    input.style.display = 'none';

    function finish(file) {
      if (settled) {
        return;
      }
      settled = true;
      input.remove();
      window.removeEventListener('focus', handleWindowFocus, true);
      resolve(file);
    }

    function handleWindowFocus() {
      window.setTimeout(() => {
        if (!input.files?.length) {
          finish(undefined);
        }
      }, filePickerCancelDelayMs);
    }

    input.addEventListener('change', () => finish(input.files?.[0]));
    window.addEventListener('focus', handleWindowFocus, true);
    document.body.append(input);
    input.click();
  });
}

export async function readFileBytes(file) {
  return new Uint8Array(await file.arrayBuffer());
}

export function splitFilename(name) {
  const normalized = String(name ?? '');
  const extensionIndex = normalized.lastIndexOf('.');
  if (extensionIndex <= 0) {
    return {
      stem: normalized || 'upload',
      extension: '',
    };
  }

  return {
    stem: normalized.slice(0, extensionIndex),
    extension: normalized.slice(extensionIndex),
  };
}
