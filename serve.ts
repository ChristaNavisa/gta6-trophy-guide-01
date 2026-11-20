// Static server for the guide: serves app/ at the root and screenshots/
// under /screenshots/, so the app can be tried in desktop Chrome.
// Usage: node serve.ts  (then open http://localhost:8080)
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  let path = url === '/' ? '/index.html' : url;
  let root = join(here, 'app');
  if (path.startsWith('/screenshots/')) {
    root = here;
    path = path.slice(1);
  } else {
    path = path.replace(/^\//, '');
  }
  const file = resolve(join(root, normalize(path)));
  if (!file.startsWith(resolve(root)) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found\n');
    return;
  }
  res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
});

const port = Number(process.env.PORT || 8080);
server.listen(port, () => {
  console.log(`Leonida Platinum Codex serving at http://localhost:${port}`);
});
