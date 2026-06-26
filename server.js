import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { extname, join, dirname } from 'node:path';
import { promisify } from 'node:util';
import { createHash, randomUUID } from 'node:crypto';

const port = process.env.PORT || 3000;
const root = process.cwd();
const stateFile = join(root, 'data', 'state.json');
const pythonExe = 'C:\\Users\\Chinmay\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe';
const execFileAsync = promisify(execFile);

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

function hashPasscode(passcode) {
  return createHash('sha256').update(passcode).digest('hex');
}

async function extractPdfTextFromBase64(base64) {
  const script = String.raw`
import base64, sys, json
from io import BytesIO
from pypdf import PdfReader

data = base64.b64decode(sys.argv[1])
reader = PdfReader(BytesIO(data))
text = []
for page in reader.pages:
    try:
        text.append(page.extract_text() or "")
    except Exception:
        pass
print(json.dumps({"text": "\n".join(text)}))
`;
  const { stdout } = await execFileAsync(pythonExe, ['-c', script, base64], { maxBuffer: 5_000_000 });
  return JSON.parse(stdout).text || '';
}

async function getState() {
  return (
    (await readJsonFile(stateFile, null)) || {
      merchants: [],
      selectedMerchantId: null,
    }
  );
}

async function getMerchantState(merchantId) {
  const state = await getState();
  return state.merchants.find((merchant) => merchant.id === merchantId) || null;
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

  if (url.pathname === '/api/session' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) req.destroy();
    });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const state = await getState();
        const merchant = state.merchants.find((item) => item.id === parsed?.merchantId);
        if (!merchant) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'Merchant not found' }));
          return;
        }
        const token = randomUUID();
        const session = {
          token,
          merchantId: merchant.id,
          role: merchant.role || 'Owner',
          language: merchant.language || 'Hindi',
          createdAt: new Date().toISOString(),
        };
        await writeJsonFile(join(root, 'data', `session-${token}.json`), session);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, session }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid session payload' }));
      }
    });
    return;
  }

  if (url.pathname === '/api/merchant' && req.method === 'GET') {
    const merchantId = url.searchParams.get('id');
    const merchant = await getMerchantState(merchantId);
    if (!merchant) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: 'Merchant not found' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, merchant }));
    return;
  }

  if (url.pathname === '/api/merchant' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) req.destroy();
    });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const state = await getState();
        const merchant = {
          id: `msme-${String(state.merchants.length + 1).padStart(3, '0')}`,
          businessName: parsed.businessName || `Merchant ${state.merchants.length + 1}`,
          ownerName: parsed.ownerName || 'New Founder',
          language: parsed.language || 'Hindi',
          fallbackLanguage: parsed.fallbackLanguage || 'English',
          role: parsed.role || 'Owner',
          channels: Array.isArray(parsed.channels) ? parsed.channels : ['WhatsApp'],
          status: 'Draft',
          approvals: true,
          notes: 'Created via API',
          logs: [{ ts: new Date().toISOString(), type: 'created', message: 'Merchant workspace created via API.' }],
          disputes: [],
          alerts: [],
          tasks: [],
          inbox: [],
          packProof: [],
          weeklySummary: { recovered: 0, netProfit: 0, deductionLeak: 0, topSku: 'No data yet' },
        };
        const next = { ...state, merchants: [...state.merchants, merchant], selectedMerchantId: merchant.id };
        await writeJsonFile(stateFile, next);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, merchant, state: next }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid merchant payload' }));
      }
    });
    return;
  }

  if (url.pathname === '/api/disputes' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) req.destroy();
    });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const state = await getState();
        const merchant = state.merchants.find((item) => item.id === parsed.merchantId);
        if (!merchant) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'Merchant not found' }));
          return;
        }
        const dispute = {
          id: `D-${String(Math.floor(1000 + Math.random() * 9000))}`,
          platform: parsed.platform || 'Marketplace',
          amount: Number(parsed.amount || 0),
          status: 'Draft ready',
          daysOpen: 0,
          note: parsed.note || '',
        };
        merchant.disputes = [...(merchant.disputes || []), dispute];
        merchant.logs = [
          ...(merchant.logs || []),
          { ts: new Date().toISOString(), type: 'dispute-created', message: `Dispute ${dispute.id} created via API.` },
        ];
        state.selectedMerchantId = merchant.id;
        await writeJsonFile(stateFile, state);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, dispute, merchant }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid dispute payload' }));
      }
    });
    return;
  }

  if (url.pathname === '/api/disputes/approve' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) req.destroy();
    });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const state = await getState();
        const merchant = state.merchants.find((item) => item.id === parsed.merchantId);
        if (!merchant) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'Merchant not found' }));
          return;
        }
        merchant.logs = [
          ...(merchant.logs || []),
          { ts: new Date().toISOString(), type: 'dispute-approved', message: `Dispute ${parsed.disputeId || 'unknown'} approved via API.` },
        ];
        await writeJsonFile(stateFile, state);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid approval payload' }));
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
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const state = await getState();
        const merchant = state.merchants.find((item) => item.id === parsed?.merchantId);
        const text = String(parsed?.text || '').toLowerCase();
        const language = parsed?.language || merchant?.language || 'Hindi';
        const role = parsed?.role || merchant?.role || 'Owner';
        let replyText = `Received message for ${parsed?.merchantId || 'unknown merchant'}.`;
        if (text.includes('kamaya') || text.includes('earn') || text.includes('profit')) {
          replyText = language === 'Hindi'
            ? `Aapke liye weekly recovery summary ready hai.`
            : `Your weekly recovery summary is ready.`;
        } else if (text.includes('dispute')) {
          replyText = language === 'Hindi'
            ? `Dispute draft tayyar hai. ${role === 'Accountant' ? 'Accountant review required.' : 'Approval milte hi next step.'}`
            : `The dispute draft is ready. ${role === 'Accountant' ? 'Accountant review required.' : 'Once approved, I will move to the next step.'}`;
        } else if (text.includes('stock')) {
          replyText = language === 'Hindi'
            ? 'Stock alert mila. Main low-stock items list kar raha hoon.'
            : 'Stock alert received. I am listing the low-stock items.';
        } else if (text.includes('backup')) {
          replyText = language === 'Hindi'
            ? 'Backup export aur restore dono ready hain.'
            : 'Backup export and restore are both ready.';
        }
        const reply = {
          ok: true,
          received: parsed,
          replyText,
        };
        if (merchant) {
          merchant.inbox = [
            ...(merchant.inbox || []),
            { from: 'Merchant', message: parsed.text || '', type: 'seller' },
            { from: 'Vyapar OS', message: replyText, type: 'system' },
          ];
          merchant.logs = [
            ...(merchant.logs || []),
            { ts: new Date().toISOString(), type: 'message-routed', message: `Message routed in ${language} for ${role}.` },
          ];
          await writeJsonFile(stateFile, state);
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(reply));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid message payload' }));
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
        const text = String(parsed?.text || '').toLowerCase();
        const language = parsed?.language || 'Hindi';
        let replyText = `Received message for ${parsed?.merchantId || 'unknown merchant'}.`;
        if (text.includes('kamaya') || text.includes('earn') || text.includes('profit')) {
          replyText = language === 'Hindi'
            ? 'Aapne is hafte ke liye earn summary dekh liya. Main recovery aur profit details bhej raha hoon.'
            : 'You have the weekly earnings summary. I am sending the recovery and profit details.';
        } else if (text.includes('dispute')) {
          replyText = language === 'Hindi'
            ? 'Dispute draft tayyar hai. Approval milte hi main next step dikhata hoon.'
            : 'The dispute draft is ready. Once approved, I will show the next step.';
        } else if (text.includes('stock')) {
          replyText = language === 'Hindi'
            ? 'Stock alert mila. Main low-stock items list kar raha hoon.'
            : 'Stock alert received. I am listing the low-stock items.';
        }
        const reply = {
          ok: true,
          received: parsed,
          replyText,
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

  if (url.pathname === '/api/pdf-extract' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 10_000_000) req.destroy();
    });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const text = await extractPdfTextFromBase64(parsed.base64 || '');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, text }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Unable to extract PDF text' }));
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
