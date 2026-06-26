import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { extname, join, dirname } from 'node:path';

const port = process.env.PORT || 3000;
const root = process.cwd();
const stateFile = join(root, 'data', 'state.json');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon',
};

async function readJsonFile(path, fallback = null) {
  try {
    const text = await readFile(path, 'utf8');
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

async function writeJsonFile(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2), 'utf8');
}

async function getState() {
  return (
    (await readJsonFile(stateFile, null)) || {
      merchants: [],
      selectedMerchantId: null,
    }
  );
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (url.pathname === '/api/state' && req.method === 'GET') {
    const state = await getState();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(state));
    return;
  }

  if (url.pathname === '/api/state' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 5_000_000) req.destroy();
    });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        await writeJsonFile(stateFile, parsed);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid state payload' }));
      }
    });
    return;
  }

  if (url.pathname === '/api/message' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) req.destroy();
    });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const reply = {
          ok: true,
          received: parsed,
          replyText: `Received message for ${parsed?.merchantId || 'unknown merchant'}.`,
        };
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(reply));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid message payload' }));
      }
    });
    return;
  }

  const urlPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = join(root, urlPath);

  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    try {
      const data = await readFile(join(root, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    } catch {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Server error');
    }
  }
});

server.listen(port, () => {
  console.log(`Vyapar OS running at http://localhost:${port}`);
});
