const storageKey = 'vyapar-os-v1';
const authKey = 'vyapar-os-auth-v1';

const defaultState = {
  merchants: [
    {
      id: 'msme-001',
      businessName: 'Sharma Traders',
      ownerName: 'Aman Sharma',
      language: 'Hindi',
      fallbackLanguage: 'English',
      role: 'Owner',
      channels: ['WhatsApp', 'Amazon'],
      status: 'Active',
      approvals: true,
      notes: 'Tier-2 marketplace seller',
      logs: [
        { ts: '2026-06-26T09:00:00Z', type: 'onboarded', message: 'Workspace created in Hindi mode.' },
        { ts: '2026-06-26T09:14:00Z', type: 'file', message: 'Settlement CSV uploaded.' },
      ],
      disputes: [{ id: 'D-1001', platform: 'Amazon', amount: 1240, status: 'Draft ready', daysOpen: 0 }],
      alerts: [
        { title: 'Blue Kurta low stock', detail: '3 units left. Reorder now.', severity: 'warn' },
        { title: 'Deduction spike', detail: 'Shipping deduction 18% above baseline this week.', severity: 'danger' },
      ],
      tasks: [
        { title: 'Approve Amazon dispute', detail: 'Rs 1,240 ready to send', status: 'Waiting' },
        { title: 'Review low stock', detail: 'Blue Kurta needs reorder', status: 'Action needed' },
        { title: 'Check buyer return pattern', detail: 'Repeat issue on one pincode', status: 'Watch' },
      ],
      inbox: [
        { from: 'WhatsApp', message: 'Bhai is hafte kitna kamaya?', type: 'seller' },
        { from: 'Vyapar OS', message: 'Recovered Rs 1,240 from Amazon mismatch.', type: 'system' },
      ],
      packProof: [{ title: 'Order A-1001', detail: 'Video stored with AWB timestamp', status: 'Ready' }],
      weeklySummary: {
        recovered: 1240,
        netProfit: 18240,
        deductionLeak: 1240,
        topSku: 'Blue Kurta',
      },
    },
  ],
  selectedMerchantId: 'msme-001',
};

function loadState() {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;
  } catch {
    return defaultState;
  }
}

function saveState(nextState) {
  localStorage.setItem(storageKey, JSON.stringify(nextState));
  fetch('/api/state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nextState),
  }).catch(() => {});
}

function loadAuth() {
  try {
    return JSON.parse(localStorage.getItem(authKey) || 'null');
  } catch {
    return null;
  }
}

function saveAuth(value) {
  localStorage.setItem(authKey, JSON.stringify(value));
}

function getSessionToken() {
  try {
    return loadAuth()?.session?.token || null;
  } catch {
    return null;
  }
}

async function hydrateStateFromServer() {
  try {
    const response = await fetch('/api/state');
    if (!response.ok) return;
    const serverState = await response.json();
    if (serverState?.merchants?.length) {
      const merged = { ...defaultState, ...serverState };
      localStorage.setItem(storageKey, JSON.stringify(merged));
      render();
    }
  } catch {
    // keep local-only mode
  }
}

async function createSession(merchantId) {
  const response = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchantId }),
  });
  const result = await response.json();
  if (result?.ok && result.session) {
    saveAuth({ session: result.session });
  }
  return result;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function money(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function parseSettlement(text) {
  const normalized = text.replace(/\r/g, '\n').trim();
  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const rows = [];
  const headerLine = lines[0] || '';
  const headers = headerLine.toLowerCase().split(',').map((item) => item.trim());
  const hasHeaders = headers.some((item) => /order|sku|platform|amount|payout|deduction/.test(item));
  const dataLines = hasHeaders ? lines.slice(1) : lines;

  for (const line of dataLines) {
    const parts = line.split(',').map((part) => part.trim().replace(/^"|"$/g, ''));
    if (parts.length < 4) continue;
    const amountCandidate = parts.find((part) => /-?\d+([.,]\d+)?/.test(part)) || parts[3];
    const amount = Number(amountCandidate.replace(/[^0-9.-]/g, ''));
    if (Number.isNaN(amount)) continue;
    rows.push({
      orderId: parts[0] || `row-${rows.length + 1}`,
      sku: parts[1] || 'Unknown SKU',
      platform: parts[2] || 'Marketplace',
      amount,
      raw: line,
    });
  }

  return rows;
}

function summarizeRows(rows) {
  if (!rows.length) {
    return { recovered: 0, deductionLeak: 0, netProfit: 0, topSku: 'No data yet' };
  }

  const leakBySku = new Map();
  let recovered = 0;
  let topSku = rows[0].sku;
  let maxLeak = -1;

  for (const row of rows) {
    const leak = Math.max(0, 500 - row.amount);
    recovered += leak;
    const skuLeak = (leakBySku.get(row.sku) || 0) + leak;
    leakBySku.set(row.sku, skuLeak);
    if (skuLeak > maxLeak) {
      maxLeak = skuLeak;
      topSku = row.sku;
    }
  }

  return {
    recovered,
    deductionLeak: recovered,
    netProfit: Math.max(0, 17000 + recovered),
    topSku,
  };
}

function createDisputeDraft(rows, merchant) {
  const totals = summarizeRows(rows);
  const top = rows[0];
  return {
    summary: rows.length
      ? `${rows.length} suspicious rows checked. Estimated recovery ${money(Math.max(totals.recovered, 0))}.`
      : 'No rows detected from the current text. Paste settlement rows or a CSV extract to begin.',
    draft: rows.length
      ? `Namaste ${merchant.ownerName},\n\nMain ne aapke settlement file me ${rows.length} possible mismatch dekhe.\nTop issue: ${top.orderId} / ${top.sku} on ${top.platform}.\nEstimated recoverable amount: ${money(Math.max(totals.recovered, 0))}.\n\nAgar aap chaho, main dispute draft abhi prepare kar sakta hoon.\n\n-- Vyapar OS`
      : 'No dispute draft yet. Upload or paste settlement rows first.',
  };
}

function appTemplate(state) {
  const merchant = state.merchants.find((item) => item.id === state.selectedMerchantId) || state.merchants[0];
  const summary = merchant.weeklySummary;
  const role = merchant.role || 'Owner';
  const auth = loadAuth();
  const locked = !auth;

  return `
    ${locked ? `
      <div class="lockscreen">
        <div class="lockcard">
          <div class="brand lockbrand">
            <div class="mark">V</div>
            <div>
              <h1>Vyapar OS</h1>
              <p>Local workspace lock</p>
            </div>
          </div>
          <p class="lede">Set a local passcode so this browser session behaves like a private merchant workspace.</p>
          <label>
            Passcode
            <input type="password" data-passcode placeholder="Enter any local passcode" />
          </label>
          <div class="actions" style="justify-content:flex-start">
            <button data-unlock-workspace>Unlock workspace</button>
          </div>
        </div>
      </div>
    ` : ''}
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="mark">V</div>
          <div>
            <h1>Vyapar OS</h1>
            <p>Zero-budget MSME recovery tool</p>
          </div>
        </div>

        <nav class="merchant-list">
          ${state.merchants
            .map(
              (item) => `
              <button class="merchant-card ${item.id === merchant.id ? 'active' : ''}" data-select-merchant="${item.id}">
                <strong>${escapeHtml(item.businessName)}</strong>
                <span>${escapeHtml(item.ownerName)} · ${escapeHtml(item.language)}</span>
              </button>
            `
            )
            .join('')}
        </nav>

        <section class="sidebar-panel">
          <h2>Language profile</h2>
          <div class="stack">
            <label>
              Role
              <select data-role>
                ${['Owner', 'Accountant', 'Ops'].map((item) => `<option ${role === item ? 'selected' : ''}>${item}</option>`).join('')}
              </select>
            </label>
            <label>
              Primary language
              <select data-language>
                ${['Hindi', 'English', 'Hinglish', 'Tamil', 'Telugu', 'Marathi', 'Gujarati']
                  .map((lang) => `<option ${merchant.language === lang ? 'selected' : ''}>${lang}</option>`)
                  .join('')}
              </select>
            </label>
            <label>
              Fallback language
              <select data-fallback-language>
                ${['English', 'Hindi'].map((lang) => `<option ${merchant.fallbackLanguage === lang ? 'selected' : ''}>${lang}</option>`).join('')}
              </select>
            </label>
          </div>
        </section>

        <section class="sidebar-panel muted">
          <h2>Safety rails</h2>
          <ul>
            <li>No scraping</li>
            <li>No hidden actions</li>
            <li>Approval before disputes</li>
            <li>Merchant data stays isolated</li>
          </ul>
        </section>
      </aside>

      <main class="content">
        <header class="hero">
          <div>
            <p class="eyebrow">WhatsApp-first control plane</p>
            <h2>Recover money, explain it simply, and keep MSMEs in control.</h2>
            <p class="lede">
              Vyapar OS starts with settlement leak detection, then grows into dispute tracking, stock alerts,
              pack proof, and daily Hindi or English summaries.
            </p>
          </div>
          <div class="hero-card">
            <div class="metric">
              <span>Recovered this week</span>
              <strong>${money(summary.recovered)}</strong>
            </div>
            <div class="metric">
              <span>Estimated net profit</span>
              <strong>${money(summary.netProfit)}</strong>
            </div>
            <div class="metric">
              <span>Top SKU</span>
              <strong>${escapeHtml(summary.topSku)}</strong>
            </div>
          </div>
        </header>

        <section class="grid">
          <article class="panel panel-large">
            <div class="panel-header">
              <div>
                <h3>Merchant onboarding</h3>
                <p>Set language, channels, and approval rules.</p>
              </div>
              <span class="status ${merchant.status === 'Active' ? 'ok' : 'warn'}">${escapeHtml(merchant.status)}</span>
            </div>
            <div class="form-grid">
              <label>
                Business name
                <input value="${escapeHtml(merchant.businessName)}" data-business-name />
              </label>
              <label>
                Owner name
                <input value="${escapeHtml(merchant.ownerName)}" data-owner-name />
              </label>
              <label>
                Connected channels
                <input value="${escapeHtml(merchant.channels.join(', '))}" data-channels />
              </label>
              <label>
                Approval required for disputes
                <select data-approvals>
                  <option value="true" ${merchant.approvals ? 'selected' : ''}>Yes</option>
                  <option value="false" ${!merchant.approvals ? 'selected' : ''}>No</option>
                </select>
              </label>
            </div>
            <div class="actions">
              <button data-save-profile>Save merchant profile</button>
            </div>
            <div class="actions" style="justify-content:flex-start">
              <button data-add-merchant type="button">Add merchant</button>
              <button data-export-backup type="button">Export backup</button>
            </div>
            <div class="stack" style="margin-top:12px">
              <label>
                Restore backup
                <input type="file" accept=".json" data-restore-backup />
              </label>
            </div>
          </article>

          <article class="panel">
            <div class="panel-header">
              <div>
                <h3>Settlement upload</h3>
                <p>Paste CSV rows, upload a CSV, or paste extracted PDF text to detect leaks.</p>
              </div>
            </div>
            <textarea rows="10" placeholder="OrderId,SKU,Platform,Amount&#10;A-1001,Blue Kurta,Amazon,240&#10;A-1002,Blue Kurta,Amazon,180" data-settlement-input></textarea>
            <input type="file" accept=".csv,.txt,.pdf" data-file-upload />
            <div class="actions">
              <button data-analyze-settlement>Analyze file</button>
            </div>
            <p class="helper">PDF support is text-extract based for now, so we can prove value without paid infra.</p>
          </article>

          <article class="panel">
            <div class="panel-header">
              <div>
                <h3>Recovery summary</h3>
                <p>Explain the issue in the merchant's chosen language.</p>
              </div>
            </div>
            <div class="summary-box" data-summary-box>
              ${escapeHtml(merchant.weeklySummary.recovered ? `Recovered ${money(summary.recovered)} this week.` : 'Waiting for settlement data.')}
            </div>
            <pre class="draft" data-draft>${escapeHtml(
              createDisputeDraft([{ orderId: 'A-1001', sku: 'Blue Kurta', platform: 'Amazon', amount: 240 }], merchant).draft
            )}</pre>
            <div class="actions">
              <button data-approve-dispute>Approve dispute draft</button>
            </div>
          </article>

          <article class="panel">
            <div class="panel-header">
              <div>
                <h3>Dispute tracker</h3>
                <p>File, remind, and resolve in one place.</p>
              </div>
            </div>
            <div class="list">
              ${merchant.disputes
                .map(
                  (item) => `
                    <div class="list-row">
                      <div>
                        <strong>${escapeHtml(item.platform)}</strong>
                        <span>${escapeHtml(item.id)} · ${item.daysOpen} days open</span>
                      </div>
                      <strong>${money(item.amount)}</strong>
                      <span class="status warn">${escapeHtml(item.status)}</span>
                    </div>
                  `
                )
                .join('')}
            </div>
            <div class="actions">
              <button data-add-dispute>Add sample dispute</button>
              <button data-create-dispute type="button">Create API dispute</button>
            </div>
          </article>

          <article class="panel">
            <div class="panel-header">
              <div>
                <h3>Alerts and next actions</h3>
                <p>High-value MSME signals the competitor dashboards often miss.</p>
              </div>
            </div>
            <div class="summary-box callout">Next best action: approve the Amazon dispute first, then reorder stock.</div>
            <div class="alerts">
              ${merchant.alerts
                .map(
                  (item) => `
                    <div class="alert ${item.severity}">
                      <strong>${escapeHtml(item.title)}</strong>
                      <p>${escapeHtml(item.detail)}</p>
                    </div>
                  `
                )
                .join('')}
            </div>
          </article>

          <article class="panel">
            <div class="panel-header">
              <div>
                <h3>Task inbox</h3>
                <p>Simple merchant action queue with approvals and watch items.</p>
              </div>
            </div>
            <div class="list compact">
              ${merchant.tasks
                .map(
                  (item) => `
                    <div class="list-row">
                      <div>
                        <strong>${escapeHtml(item.title)}</strong>
                        <span>${escapeHtml(item.detail)}</span>
                      </div>
                      <span class="status warn">${escapeHtml(item.status)}</span>
                    </div>
                  `
                )
                .join('')}
            </div>
          </article>

          <article class="panel">
            <div class="panel-header">
              <div>
                <h3>WhatsApp inbox simulator</h3>
                <p>Test how the conversational layer will route seller messages.</p>
              </div>
            </div>
            <div class="list compact">
              ${merchant.inbox
                .map(
                  (item) => `
                    <div class="list-row">
                      <div>
                        <strong>${escapeHtml(item.from)}</strong>
                        <span>${escapeHtml(item.message)}</span>
                      </div>
                      <span class="status ${item.type === 'system' ? 'ok' : 'warn'}">${escapeHtml(item.type)}</span>
                    </div>
                  `
                )
                .join('')}
            </div>
            <div class="actions">
              <button data-send-test-message>Send test summary</button>
              <button data-send-custom-message type="button">Send sample message</button>
            </div>
          </article>

          <article class="panel">
            <div class="panel-header">
              <div>
                <h3>Pack-proof vault</h3>
                <p>Tamper-evident evidence for fraud and empty-box disputes.</p>
              </div>
            </div>
            <div class="list compact">
              ${merchant.packProof
                .map(
                  (item) => `
                    <div class="list-row">
                      <div>
                        <strong>${escapeHtml(item.title)}</strong>
                        <span>${escapeHtml(item.detail)}</span>
                      </div>
                      <span class="status ok">${escapeHtml(item.status)}</span>
                    </div>
                  `
                )
                .join('')}
            </div>
          </article>

          <article class="panel">
            <div class="panel-header">
              <div>
                <h3>Audit log</h3>
                <p>Every file, response, and approval is recorded.</p>
              </div>
            </div>
            <div class="list compact">
              ${merchant.logs
                .slice()
                .reverse()
                .map(
                  (item) => `
                    <div class="list-row">
                      <div>
                        <strong>${escapeHtml(item.type)}</strong>
                        <span>${escapeHtml(item.message)}</span>
                      </div>
                      <span>${formatDate(item.ts)}</span>
                    </div>
                  `
                )
                .join('')}
            </div>
          </article>
        </section>
      </main>
    </div>
  `;
}

function render() {
  const state = loadState();
  document.querySelector('#app').innerHTML = appTemplate(state);
  bindEvents();
}

function updateMerchant(updater) {
  const state = loadState();
  const next = {
    ...state,
    merchants: state.merchants.map((merchant) => {
      if (merchant.id !== state.selectedMerchantId) return merchant;
      return updater(merchant);
    }),
  };
  saveState(next);
  render();
}

function bindEvents() {
  document.querySelectorAll('[data-select-merchant]').forEach((button) => {
    button.addEventListener('click', () => {
      const state = loadState();
      saveState({ ...state, selectedMerchantId: button.dataset.selectMerchant });
      render();
    });
  });

  document.querySelector('[data-unlock-workspace]')?.addEventListener('click', () => {
    const passcode = document.querySelector('[data-passcode]').value.trim();
    if (!passcode) return;
    const state = loadState();
    const merchantId = state.selectedMerchantId;
    createSession(merchantId).then(() => render());
  });

  document.querySelector('[data-save-profile]')?.addEventListener('click', () => {
    const businessName = document.querySelector('[data-business-name]').value.trim();
    const ownerName = document.querySelector('[data-owner-name]').value.trim();
    const channels = document
      .querySelector('[data-channels]')
      .value.split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const approvals = document.querySelector('[data-approvals]').value === 'true';
    const language = document.querySelector('[data-language]').value;
    const fallbackLanguage = document.querySelector('[data-fallback-language]').value;
    const role = document.querySelector('[data-role]').value;

    updateMerchant((merchant) => ({
      ...merchant,
      businessName,
      ownerName,
      channels,
      approvals,
      language,
      fallbackLanguage,
      role,
      logs: [...merchant.logs, { ts: new Date().toISOString(), type: 'profile-updated', message: `Language set to ${language}.` }],
    }));
  });

  document.querySelector('[data-role]')?.addEventListener('change', () => {
    updateMerchant((merchant) => ({
      ...merchant,
      role: document.querySelector('[data-role]').value,
    }));
  });

  document.querySelector('[data-language]')?.addEventListener('change', () => {
    updateMerchant((merchant) => ({
      ...merchant,
      language: document.querySelector('[data-language]').value,
      fallbackLanguage: document.querySelector('[data-fallback-language]').value,
    }));
  });

  document.querySelector('[data-fallback-language]')?.addEventListener('change', () => {
    updateMerchant((merchant) => ({
      ...merchant,
      language: document.querySelector('[data-language]').value,
      fallbackLanguage: document.querySelector('[data-fallback-language]').value,
    }));
  });

  document.querySelector('[data-file-upload]')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);
      const response = await fetch('/api/pdf-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64 }),
      });
      const result = await response.json();
      document.querySelector('[data-settlement-input]').value = result.text || '';
      document.querySelector('[data-summary-box]').textContent = `Extracted text from ${file.name}. Ready to analyze.`;
    } else {
      const text = await file.text();
      document.querySelector('[data-settlement-input]').value = text;
      document.querySelector('[data-summary-box]').textContent = `Loaded ${file.name}. Ready to analyze.`;
    }
  });

  document.querySelector('[data-analyze-settlement]')?.addEventListener('click', () => {
    const text = document.querySelector('[data-settlement-input]').value.trim();
    const rows = parseSettlement(text);
    const state = loadState();
    const merchant = state.merchants.find((item) => item.id === state.selectedMerchantId);
    const result = createDisputeDraft(rows, merchant);
    const totals = summarizeRows(rows);

    updateMerchant((current) => ({
      ...current,
      weeklySummary: rows.length
        ? {
            ...current.weeklySummary,
            recovered: totals.recovered,
            deductionLeak: totals.deductionLeak,
            netProfit: totals.netProfit,
            topSku: totals.topSku,
          }
        : current.weeklySummary,
      logs: [...current.logs, { ts: new Date().toISOString(), type: 'analysis-run', message: `${rows.length} settlement row(s) analyzed.` }],
    }));

    document.querySelector('[data-summary-box]').textContent = result.summary;
    document.querySelector('[data-draft]').textContent = result.draft;
  });

  document.querySelector('[data-add-dispute]')?.addEventListener('click', () => {
    updateMerchant((merchant) => ({
      ...merchant,
      disputes: [
        ...merchant.disputes,
        {
          id: `D-${Math.floor(1000 + Math.random() * 9000)}`,
          platform: 'Flipkart',
          amount: 860,
          status: 'Draft ready',
          daysOpen: 0,
        },
      ],
      logs: [...merchant.logs, { ts: new Date().toISOString(), type: 'dispute-added', message: 'Sample dispute added for approval flow testing.' }],
    }));
  });

  document.querySelector('[data-create-dispute]')?.addEventListener('click', async () => {
    const state = loadState();
    const merchant = state.merchants.find((item) => item.id === state.selectedMerchantId);
    const response = await fetch('/api/disputes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantId: merchant.id,
        platform: 'Amazon',
        amount: merchant.weeklySummary.recovered || 1240,
        note: 'Created from UI approval flow',
        sessionToken: getSessionToken(),
      }),
    });
    const result = await response.json();
    if (result?.ok) {
      const currentState = loadState();
      const currentMerchant = currentState.merchants.find((item) => item.id === currentState.selectedMerchantId);
      updateMerchant((current) => ({
        ...current,
        disputes: [...current.disputes, result.dispute],
        logs: [...current.logs, { ts: new Date().toISOString(), type: 'dispute-created', message: 'Dispute created via API.' }],
      }));
    }
  });

  document.querySelector('[data-approve-dispute]')?.addEventListener('click', () => {
    const state = loadState();
    const merchant = state.merchants.find((item) => item.id === state.selectedMerchantId);
    const disputeId = merchant.disputes[0]?.id;
    fetch('/api/disputes/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantId: merchant.id,
        disputeId,
        sessionToken: getSessionToken(),
      }),
    }).finally(() => {
      updateMerchant((merchantState) => ({
        ...merchantState,
        logs: [...merchantState.logs, { ts: new Date().toISOString(), type: 'dispute-approved', message: 'Merchant approved the current dispute draft.' }],
      }));
    });
  });

  document.querySelector('[data-add-merchant]')?.addEventListener('click', () => {
    const state = loadState();
    const count = state.merchants.length + 1;
    const id = `msme-${String(count).padStart(3, '0')}`;
    const newMerchant = {
      id,
      businessName: `Merchant ${count}`,
      ownerName: 'New Founder',
      language: 'Hindi',
      fallbackLanguage: 'English',
      role: 'Owner',
      channels: ['WhatsApp'],
      status: 'Draft',
      approvals: true,
      notes: 'New onboarding workspace',
      logs: [{ ts: new Date().toISOString(), type: 'created', message: 'Merchant workspace created.' }],
      disputes: [],
      alerts: [],
      tasks: [],
      inbox: [],
      packProof: [],
      weeklySummary: { recovered: 0, netProfit: 0, deductionLeak: 0, topSku: 'No data yet' },
    };
    saveState({
      ...state,
      selectedMerchantId: id,
      merchants: [...state.merchants, newMerchant],
    });
    render();
  });

  document.querySelector('[data-send-test-message]')?.addEventListener('click', () => {
    updateMerchant((merchant) => ({
      ...merchant,
      inbox: [
        ...merchant.inbox,
        { from: 'Merchant', message: 'How much did I earn this week?', type: 'seller' },
        { from: 'Vyapar OS', message: `You recovered ${money(merchant.weeklySummary.recovered)} this week.`, type: 'system' },
      ],
      logs: [...merchant.logs, { ts: new Date().toISOString(), type: 'inbox-test', message: 'Test summary message sent to inbox simulator.' }],
    }));
  });

  document.querySelector('[data-send-custom-message]')?.addEventListener('click', async () => {
    const state = loadState();
    const merchant = state.merchants.find((item) => item.id === state.selectedMerchantId);
    const sampleText = merchant.language === 'Hindi' ? 'Bhai, kitna kamaya aur dispute kya hai?' : 'How much did I earn and what is the dispute status?';
    const response = await fetch('/api/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantId: merchant.id,
        language: merchant.language,
        text: sampleText,
        role: merchant.role,
      }),
    });
    const result = await response.json();
    updateMerchant((current) => ({
      ...current,
      inbox: [
        ...current.inbox,
        { from: 'Merchant', message: sampleText, type: 'seller' },
        { from: 'Vyapar OS', message: result.replyText || 'No reply generated.', type: 'system' },
      ],
      logs: [...current.logs, { ts: new Date().toISOString(), type: 'message-routed', message: 'Sample message routed through /api/message.' }],
    }));
  });

  document.querySelector('[data-export-backup]')?.addEventListener('click', () => {
    const state = loadState();
    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'Vyapar OS',
      version: 1,
      state,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vyapar-os-backup-${Date.now()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    updateMerchant((merchant) => ({
      ...merchant,
      logs: [...merchant.logs, { ts: new Date().toISOString(), type: 'backup-exported', message: 'Workspace backup exported as JSON.' }],
    }));
  });

  document.querySelector('[data-restore-backup]')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      if (!payload?.state?.merchants?.length) {
        alert('Backup file does not contain a valid Vyapar OS state.');
        return;
      }

      localStorage.setItem(storageKey, JSON.stringify(payload.state));
      render();
    } catch {
      alert('Could not restore that backup file.');
    }
  });
}

render();
hydrateStateFromServer();
