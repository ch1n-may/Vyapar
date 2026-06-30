import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { extname, join, dirname } from 'node:path';
import { promisify } from 'node:util';
import { createHash, randomUUID } from 'node:crypto';

const port = process.env.PORT || 3000;
const root = process.cwd();
const dataDir = process.env.VERCEL ? '/tmp/data' : join(root, 'data');
const indexFile = join(dataDir, 'state.json');
const merchantsDir = join(dataDir, 'merchants');
const sessionsDir = join(dataDir, 'sessions');
const eventsFile = join(dataDir, 'events.json');
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

function merchantFile(merchantId) {
  return join(merchantsDir, `${merchantId}.json`);
}

function sessionFile(token) {
  return join(sessionsDir, `${token}.json`);
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
    (await readJsonFile(indexFile, null)) || {
      merchants: [],
      selectedMerchantId: null,
    }
  );
}

async function getMerchantState(merchantId) {
  if (!merchantId) return null;
  return await readJsonFile(merchantFile(merchantId), null);
}

async function saveMerchantState(merchant) {
  await writeJsonFile(merchantFile(merchant.id), merchant);
}

async function appendEvent(event) {
  const existing = (await readJsonFile(eventsFile, [])) || [];
  await writeJsonFile(eventsFile, [...existing.slice(-999), event]);
}

async function listMerchants() {
  const state = await getState();
  const merchants = await Promise.all(
    state.merchants.map(async (merchant) => {
      const full = await getMerchantState(merchant.id);
      return full || merchant;
    })
  );
  return { ...state, merchants };
}

async function readSession(token) {
  if (!token) return null;
  return await readJsonFile(sessionFile(token), null);
}

async function requireSession(req, merchantId) {
  const headerToken = req.headers['x-session-token'];
  const bodyToken = req.sessionToken;
  const token = String(headerToken || bodyToken || '').trim();
  if (!token) return { ok: false, status: 401, error: 'Missing session token' };
  const session = await readSession(token);
  if (!session) return { ok: false, status: 401, error: 'Session not found' };
  if (session.expiresAt && Date.parse(session.expiresAt) < Date.now()) {
    return { ok: false, status: 401, error: 'Session expired' };
  }
  if (merchantId && session.merchantId !== merchantId) {
    return { ok: false, status: 403, error: 'Session does not match merchant' };
  }
  return { ok: true, session };
}

function buildWorkflowState(merchant) {
  const alerts = [];
  const tasks = [];
  const approvals = merchant.approvalQueue || [];
  const summary = merchant.weeklySummary || { recovered: 0, netProfit: 0, deductionLeak: 0, topSku: 'No data yet' };
  const disputes = merchant.disputes || [];
  const packProofCount = Array.isArray(merchant.packProof) ? merchant.packProof.length : 0;

  if ((summary.deductionLeak || 0) > 1000) {
    alerts.push({ title: 'Deduction spike', detail: 'Settlement leak crossed the action threshold.', severity: 'danger' });
    tasks.push({ title: 'Review deduction spike', detail: 'Check the highest leak rows and prepare a dispute.', status: 'Action needed' });
    approvals.push({
      id: `A-${Date.now()}`,
      type: 'dispute',
      title: 'Approve deduction dispute',
      detail: 'Merchant approval required before filing the dispute.',
      status: 'Pending',
      requiredRole: 'Owner',
      createdAt: new Date().toISOString(),
    });
  }

  if (disputes.some((item) => item.status === 'Draft ready')) {
    tasks.push({ title: 'Approve dispute draft', detail: 'One dispute is ready for merchant approval.', status: 'Waiting' });
  }

  if (packProofCount === 0) {
    alerts.push({ title: 'Pack-proof missing', detail: 'No shipment evidence saved yet.', severity: 'warn' });
    tasks.push({ title: 'Capture pack-proof', detail: 'Add a short shipment proof clip for high-risk orders.', status: 'Watch' });
  }

  if ((merchant.channels || []).some((item) => /amazon|flipkart|meesho/i.test(item))) {
    tasks.push({ title: 'Check marketplace activity', detail: 'Review open disputes and weekly recovery status.', status: 'Watch' });
  }

  if (!alerts.length) {
    alerts.push({ title: 'Workflow healthy', detail: 'No urgent recovery issue is flagged right now.', severity: 'ok' });
  }

  return { alerts, tasks, approvalQueue: approvals };
}

function hasRoleAccess(role, allowedRoles) {
  return allowedRoles.includes(role || 'Owner');
}

function buildConnectorReply(merchant, channel, payload) {
  const language = payload.language || merchant?.language || 'Hindi';
  const role = payload.role || merchant?.role || 'Owner';
  const text = String(payload.text || '').toLowerCase();
  let replyText = `Received connector request for ${channel}.`;
  if (channel === 'WhatsApp') {
    if (text.includes('kamaya') || text.includes('earn') || text.includes('profit')) {
      replyText = language === 'Hindi'
        ? 'Aapke liye weekly recovery summary ready hai.'
        : 'Your weekly recovery summary is ready.';
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
  } else if (/amazon|flipkart|meesho/i.test(channel)) {
    replyText = language === 'Hindi'
      ? `${channel} connector ready hai. Sensitive action ke liye approval queue use karo.`
      : `${channel} connector is ready. Use the approval queue for any sensitive action.`;
  }
  return { ok: true, channel, received: payload, replyText };
}

function buildReleaseChecklist(state, events) {
  const issues = [];
  if (!state.merchants?.length) issues.push('No merchants configured');
  if (!events?.length) issues.push('No event history yet');
  if ((state.merchants || []).some((merchant) => !merchant.language)) issues.push('A merchant is missing a language preference');
  if ((state.merchants || []).some((merchant) => !merchant.passcodeHash)) issues.push('A merchant has no passcode set');
  return {
    ready: issues.length === 0,
    issues,
    steps: [
      'Confirm merchant onboarding',
      'Verify session lock and restore',
      'Review approval queue',
      'Review connector safety',
      'Deploy preview, then production',
    ],
  };
}

function buildDeployStatus(state, events) {
  const checklist = buildReleaseChecklist(state, events);
  return {
    environment: process.env.VERCEL_ENV || 'development',
    canPreview: true,
    canPublish: checklist.ready,
    checklist,
  };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/health') {
    const state = await getState();
    const events = (await readJsonFile(eventsFile, [])) || [];
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, merchants: state.merchants.length, events: events.length }));
    return;
  }

  if (url.pathname === '/api/observability/overview' && req.method === 'GET') {
    const state = await listMerchants();
    const events = (await readJsonFile(eventsFile, [])) || [];
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      ok: true,
      merchantCount: state.merchants.length,
      eventCount: events.length,
      latestEvents: events.slice(-20).reverse(),
    }));
    return;
  }

  if (url.pathname === '/api/state' && req.method === 'GET') {
    const state = await listMerchants();
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
        await writeJsonFile(indexFile, parsed);
        if (Array.isArray(parsed.merchants)) {
          await Promise.all(parsed.merchants.map((merchant) => merchant?.id ? saveMerchantState(merchant) : Promise.resolve()));
        }
        await appendEvent({ ts: new Date().toISOString(), type: 'state-saved', detail: 'Workspace state saved.' });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid state payload' }));
      }
    });
    return;
  }

  if (url.pathname === '/api/readiness/check' && req.method === 'GET') {
    const state = await listMerchants();
    const events = (await readJsonFile(eventsFile, [])) || [];
    const latestSession = events.slice().reverse().find((item) => item.type === 'session-created' || item.type === 'session-revoked') || null;
    const issues = [];
    if (!state.merchants.length) issues.push('No merchants configured');
    if (!events.length) issues.push('No event history yet');
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      ok: true,
      ready: issues.length === 0,
      issues,
      merchantCount: state.merchants.length,
      eventCount: events.length,
      latestSession,
    }));
    return;
  }

  if (url.pathname === '/api/release/checklist' && req.method === 'GET') {
    const state = await listMerchants();
    const events = (await readJsonFile(eventsFile, [])) || [];
    const checklist = buildReleaseChecklist(state, events);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, checklist }));
    return;
  }

  if (url.pathname === '/api/deploy/status' && req.method === 'GET') {
    const state = await listMerchants();
    const events = (await readJsonFile(eventsFile, [])) || [];
    const status = buildDeployStatus(state, events);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, status }));
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
        const passcodeHash = hashPasscode(String(parsed?.passcode || ''));
        if (merchant.passcodeHash && merchant.passcodeHash !== passcodeHash) {
          res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'Invalid passcode' }));
          return;
        }
        const token = randomUUID();
        const session = {
          token,
          merchantId: merchant.id,
          role: merchant.role || 'Owner',
          language: merchant.language || 'Hindi',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        };
        await writeJsonFile(sessionFile(token), session);
        await appendEvent({ ts: session.createdAt, type: 'session-created', merchantId: merchant.id, detail: 'Session unlocked.' });
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
    const sessionCheck = await requireSession(req, merchantId);
    if (!sessionCheck.ok) {
      res.writeHead(sessionCheck.status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: sessionCheck.error }));
      return;
    }
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

  if (url.pathname === '/api/merchant' && req.method === 'PATCH') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) req.destroy();
    });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const sessionCheck = await requireSession(req, parsed.id);
        if (!sessionCheck.ok) {
          res.writeHead(sessionCheck.status, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: sessionCheck.error }));
          return;
        }
        const state = await getState();
        const merchant = await getMerchantState(parsed.id);
        if (!merchant) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'Merchant not found' }));
          return;
        }
        const nextMerchant = {
          ...merchant,
          ...parsed,
          id: merchant.id,
        };
        await saveMerchantState(nextMerchant);
        const nextState = {
          ...state,
          merchants: state.merchants.map((item) => (item.id === nextMerchant.id ? nextMerchant : item)),
        };
        await writeJsonFile(indexFile, nextState);
        await appendEvent({ ts: new Date().toISOString(), type: 'merchant-updated', merchantId: nextMerchant.id, detail: 'Merchant profile updated.' });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, merchant: nextMerchant }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid merchant update payload' }));
      }
    });
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
          passcodeHash: parsed.passcode ? hashPasscode(String(parsed.passcode)) : '',
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
        await writeJsonFile(indexFile, next);
        await saveMerchantState(merchant);
        await appendEvent({ ts: new Date().toISOString(), type: 'merchant-created', merchantId: merchant.id, detail: 'Merchant workspace created.' });
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
        const sessionCheck = await requireSession(req, parsed.merchantId);
        if (!sessionCheck.ok) {
          res.writeHead(sessionCheck.status, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: sessionCheck.error }));
          return;
        }
        const state = await getState();
        const merchant = await getMerchantState(parsed.merchantId);
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
        await writeJsonFile(indexFile, state);
        await saveMerchantState(merchant);
        await appendEvent({ ts: new Date().toISOString(), type: 'dispute-created', merchantId: merchant.id, detail: `Dispute ${dispute.id} created.` });
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
        const sessionCheck = await requireSession(req, parsed.merchantId);
        if (!sessionCheck.ok) {
          res.writeHead(sessionCheck.status, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: sessionCheck.error }));
          return;
        }
        const state = await getState();
        const merchant = await getMerchantState(parsed.merchantId);
        if (!merchant) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'Merchant not found' }));
          return;
        }
        merchant.logs = [
          ...(merchant.logs || []),
          { ts: new Date().toISOString(), type: 'dispute-approved', message: `Dispute ${parsed.disputeId || 'unknown'} approved via API.` },
        ];
        await writeJsonFile(indexFile, state);
        await saveMerchantState(merchant);
        await appendEvent({ ts: new Date().toISOString(), type: 'dispute-approved', merchantId: merchant.id, detail: `Dispute ${parsed.disputeId || 'unknown'} approved.` });
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
        const sessionCheck = await requireSession(req, parsed.merchantId);
        if (!sessionCheck.ok) {
          res.writeHead(sessionCheck.status, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: sessionCheck.error }));
          return;
        }
        const merchant = await getMerchantState(parsed?.merchantId);
        const reply = buildConnectorReply(merchant, 'WhatsApp', parsed);
        if (merchant) {
          merchant.inbox = [
            ...(merchant.inbox || []),
            { from: 'Merchant', message: parsed.text || '', type: 'seller' },
            { from: 'Vyapar OS', message: reply.replyText, type: 'system' },
          ];
          merchant.logs = [
            ...(merchant.logs || []),
            { ts: new Date().toISOString(), type: 'message-routed', message: `Message routed through WhatsApp connector.` },
          ];
          await saveMerchantState(merchant);
          await appendEvent({ ts: new Date().toISOString(), type: 'message-routed', merchantId: merchant.id, detail: 'WhatsApp message routed.' });
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

  if (url.pathname === '/api/connectors/route' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) req.destroy();
    });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const sessionCheck = await requireSession(req, parsed.merchantId);
        if (!sessionCheck.ok) {
          res.writeHead(sessionCheck.status, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: sessionCheck.error }));
          return;
        }
        const merchant = await getMerchantState(parsed.merchantId);
        if (!merchant) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'Merchant not found' }));
          return;
        }
        const channel = String(parsed.channel || 'WhatsApp');
        const approved = Boolean(parsed.approved);
        const sensitiveAction = /amazon|flipkart|meesho/i.test(channel) && String(parsed.action || '').trim().length > 0;
        if (sensitiveAction && !approved) {
          res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'Sensitive connector actions require explicit approval' }));
          return;
        }
        const reply = buildConnectorReply(merchant, channel, parsed);
        merchant.logs = [
          ...(merchant.logs || []),
          { ts: new Date().toISOString(), type: 'connector-routed', message: `${channel} connector routed a message.` },
        ];
        if (channel === 'WhatsApp') {
          merchant.inbox = [
            ...(merchant.inbox || []),
            { from: 'Merchant', message: parsed.text || '', type: 'seller' },
            { from: 'Vyapar OS', message: reply.replyText, type: 'system' },
          ];
        }
        await saveMerchantState(merchant);
        await appendEvent({ ts: new Date().toISOString(), type: 'connector-routed', merchantId: merchant.id, detail: `${channel} routed.` });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(reply));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid connector payload' }));
      }
    });
    return;
  }

  if (url.pathname === '/api/connectors/preview' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) req.destroy();
    });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const sessionCheck = await requireSession(req, parsed.merchantId);
        if (!sessionCheck.ok) {
          res.writeHead(sessionCheck.status, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: sessionCheck.error }));
          return;
        }
        const merchant = await getMerchantState(parsed.merchantId);
        if (!merchant) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'Merchant not found' }));
          return;
        }
        const channel = String(parsed.channel || 'WhatsApp');
        const reply = buildConnectorReply(merchant, channel, parsed);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, preview: reply, requiresApproval: /amazon|flipkart|meesho/i.test(channel) }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid connector preview payload' }));
      }
    });
    return;
  }

  if (url.pathname === '/api/session/logout' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 500_000) req.destroy();
    });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const token = String(parsed.sessionToken || '').trim();
        if (token) {
          try {
            await writeFile(sessionFile(token), JSON.stringify({ revokedAt: new Date().toISOString() }, null, 2), 'utf8');
            await appendEvent({ ts: new Date().toISOString(), type: 'session-revoked', detail: 'Session locked.' });
          } catch {
            // ignore missing session
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid logout payload' }));
      }
    });
    return;
  }

  if (url.pathname === '/api/workflow/run' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) req.destroy();
    });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const sessionCheck = await requireSession(req, parsed.merchantId);
        if (!sessionCheck.ok) {
          res.writeHead(sessionCheck.status, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: sessionCheck.error }));
          return;
        }
        const merchant = await getMerchantState(parsed.merchantId);
        if (!merchant) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'Merchant not found' }));
          return;
        }
        const workflow = buildWorkflowState(merchant);
        merchant.alerts = workflow.alerts;
        merchant.tasks = workflow.tasks;
        merchant.approvalQueue = workflow.approvalQueue || merchant.approvalQueue || [];
        merchant.logs = [
          ...(merchant.logs || []),
          { ts: new Date().toISOString(), type: 'workflow-run', message: 'Workflow engine refreshed alerts and tasks.' },
        ];
        await saveMerchantState(merchant);
        await appendEvent({ ts: new Date().toISOString(), type: 'workflow-run', merchantId: merchant.id, detail: 'Workflow refreshed alerts and tasks.' });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, workflow, merchant }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid workflow payload' }));
      }
    });
    return;
  }

  if (url.pathname === '/api/approvals' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) req.destroy();
    });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const sessionCheck = await requireSession(req, parsed.merchantId);
        if (!sessionCheck.ok) {
          res.writeHead(sessionCheck.status, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: sessionCheck.error }));
          return;
        }
        const merchant = await getMerchantState(parsed.merchantId);
        if (!merchant) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'Merchant not found' }));
          return;
        }
        const role = sessionCheck.session.role || merchant.role || 'Owner';
        if (!hasRoleAccess(role, ['Owner', 'Accountant'])) {
          res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'Your role cannot submit approvals' }));
          return;
        }
        const approval = {
          id: `A-${String(Math.floor(1000 + Math.random() * 9000))}`,
          type: parsed.type || 'dispute',
          title: parsed.title || 'Approval needed',
          detail: parsed.detail || '',
          status: 'Pending',
          requiredRole: parsed.requiredRole || 'Owner',
          createdAt: new Date().toISOString(),
        };
        merchant.approvalQueue = [...(merchant.approvalQueue || []), approval];
        merchant.logs = [
          ...(merchant.logs || []),
          { ts: new Date().toISOString(), type: 'approval-requested', message: `Approval ${approval.id} submitted by ${role}.` },
        ];
        await saveMerchantState(merchant);
        await appendEvent({ ts: new Date().toISOString(), type: 'approval-requested', merchantId: merchant.id, detail: `Approval ${approval.id} submitted.` });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, approval, merchant }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid approval payload' }));
      }
    });
    return;
  }

  if (url.pathname === '/api/approvals/resolve' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) req.destroy();
    });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const sessionCheck = await requireSession(req, parsed.merchantId);
        if (!sessionCheck.ok) {
          res.writeHead(sessionCheck.status, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: sessionCheck.error }));
          return;
        }
        const merchant = await getMerchantState(parsed.merchantId);
        if (!merchant) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'Merchant not found' }));
          return;
        }
        const role = sessionCheck.session.role || merchant.role || 'Owner';
        if (!hasRoleAccess(role, ['Owner'])) {
          res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'Only owners can approve this item' }));
          return;
        }
        merchant.approvalQueue = (merchant.approvalQueue || []).map((item) =>
          item.id === parsed.approvalId ? { ...item, status: 'Approved', approvedAt: new Date().toISOString(), approvedBy: role } : item
        );
        merchant.logs = [
          ...(merchant.logs || []),
          { ts: new Date().toISOString(), type: 'approval-resolved', message: `Approval ${parsed.approvalId || 'unknown'} resolved by ${role}.` },
        ];
        await saveMerchantState(merchant);
        await appendEvent({ ts: new Date().toISOString(), type: 'approval-resolved', merchantId: merchant.id, detail: `Approval ${parsed.approvalId || 'unknown'} resolved.` });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, merchant }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid approval resolution payload' }));
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
  const filePath = join(root, 'frontend', 'dist', urlPath);

  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    try {
      const data = await readFile(join(root, 'frontend', 'dist', 'index.html'));
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

export default server;
