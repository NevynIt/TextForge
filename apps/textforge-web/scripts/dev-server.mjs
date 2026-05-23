import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const dirIndex = args.indexOf('--dir');
const port = portIndex >= 0 ? Number(args[portIndex + 1]) : 4173;
const serveDir = resolve(fileURLToPath(new URL('..', import.meta.url)), dirIndex >= 0 ? args[dirIndex + 1] : '.');

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
]);

const server = createServer(async (request, response) => {
  try {
    const requestedUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
    let pathname = decodeURIComponent(requestedUrl.pathname);
    if (pathname === '/') {
      pathname = '/index.html';
    }

    const filePath = resolve(serveDir, `.${pathname}`);
    await stat(filePath);

    const body = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': mimeTypes.get(extname(filePath)) ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(body);
  } catch (error) {
    try {
      const fallback = resolve(serveDir, 'index.html');
      const body = await readFile(fallback);
      response.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      response.end(body);
    } catch {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(`TextForge web shell server error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});

server.listen(port, '127.0.0.1', () => {
  console.info(`TextForge web shell running at http://127.0.0.1:${port}`);
});
