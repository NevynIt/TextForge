export const diagramExportWorkerSource = String.raw`
function parseSvgDimension(value) {
  const match = String(value ?? '').trim().match(/^([0-9]+(?:\.[0-9]+)?)/);
  return match ? Number(match[1]) : undefined;
}

function inferSvgSize(svgText) {
  const widthMatch = svgText.match(/\bwidth="([^"]+)"/i);
  const heightMatch = svgText.match(/\bheight="([^"]+)"/i);
  const parsedWidth = parseSvgDimension(widthMatch?.[1]);
  const parsedHeight = parseSvgDimension(heightMatch?.[1]);
  if (parsedWidth && parsedHeight) {
    return { width: parsedWidth, height: parsedHeight };
  }

  const viewBoxMatch = svgText.match(/\bviewBox="([^"]+)"/i);
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].trim().split(/\s+/).map((part) => Number(part));
    if (parts.length === 4 && Number.isFinite(parts[2]) && Number.isFinite(parts[3])) {
      return {
        width: parts[2],
        height: parts[3],
      };
    }
  }

  return { width: 1024, height: 768 };
}

async function rasterizeSvgInWorker(svgText) {
  if (typeof OffscreenCanvas !== 'function' || typeof createImageBitmap !== 'function') {
    throw new Error('Worker SVG rasterization requires OffscreenCanvas and createImageBitmap support.');
  }

  const { width, height } = inferSvgSize(svgText);
  const canvas = new OffscreenCanvas(Math.max(1, Math.round(width)), Math.max(1, Math.round(height)));
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Worker canvas 2D context is unavailable.');
  }

  const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
  const image = await createImageBitmap(svgBlob);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close?.();
  const pngBlob = await canvas.convertToBlob({ type: 'image/png' });
  return pngBlob.arrayBuffer();
}

self.addEventListener('message', (event) => {
  const jobs = Array.isArray(event.data?.jobs) ? event.data.jobs : [];
  void (async () => {
    const results = [];
    for (const job of jobs) {
      try {
        const bytes = await rasterizeSvgInWorker(String(job.svgText ?? ''));
        results.push({
          id: job.id,
          bytes,
        });
      } catch (error) {
        results.push({
          id: job.id,
          error: error?.message ?? 'PNG rasterization failed.',
        });
      }
    }
    self.postMessage({ type: 'done', results }, results.map((result) => result.bytes).filter(Boolean));
  })().catch((error) => {
    self.postMessage({
      type: 'error',
      message: error?.message ?? 'Diagram export worker failed.',
    });
  });
});
`;
