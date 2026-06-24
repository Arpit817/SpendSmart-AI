/* ─── SpendSmart AI — Frontend Script ─── */
'use strict';

const API = 'http://localhost:5000/api';

// ── Session ID (persist across refreshes) ──────────────────────────────────
function getSessionId() {
  let id = localStorage.getItem('ss_session');
  if (!id) {
    id = 'ss_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    localStorage.setItem('ss_session', id);
  }
  return id;
}
const SESSION_ID = getSessionId();

// ── State ───────────────────────────────────────────────────────────────────
let state = {
  user: null,
  analysis: null,
  chatLang: 'en',
  chatLoading: false,
};

// ── Utilities ───────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN');
const pct = n => (Number(n || 0) * 100).toFixed(1) + '%';

function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  $('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function showSection(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  $(`page-${name}`).classList.add('active');
  $(`nav-${name}`)?.classList.add('active');
  if (name === 'history') loadHistory();
  // Close mobile sidebar
  $('sidebar').classList.remove('open');
}

// ── Nav wiring ──────────────────────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => showSection(btn.dataset.section));
});
$('hamburger').addEventListener('click', () => $('sidebar').classList.toggle('open'));

// ── Session display ─────────────────────────────────────────────────────────
$('session-display').textContent = SESSION_ID.slice(0, 22) + '…';

// ── Health Check ────────────────────────────────────────────────────────────
async function checkHealth() {
  try {
    const r = await fetch(`${API.replace('/api', '')}/health`);
    const data = await r.json();
    if (data.success) {
      const dot = document.querySelector('.status-dot');
      const txt = document.querySelector('.status-text');
      dot.classList.add('connected');
      txt.textContent = 'API Connected ✓';
    }
  } catch {
    document.querySelector('.status-text').textContent = 'API Offline';
  }
}
checkHealth();

// ── Load saved profile into form ────────────────────────────────────────────
async function loadProfile() {
  try {
    const r = await fetch(`${API}/user/${SESSION_ID}`);
    if (!r.ok) return;
    const { data } = await r.json();
    state.user = data;
    fillForm(data);
    updateDashboardStats(data);
    updatePreview();
  } catch { /* no profile yet */ }
}

function fillForm(u) {
  if (!u) return;
  $('inp-name').value = u.name || '';
  $('inp-language').value = u.language || 'en';
  $('inp-income').value = u.income || '';
  const e = u.expenses || {};
  ['rent','food','travel','shopping','bills','emi','others'].forEach(k => {
    const el = document.querySelector(`[data-key="${k}"]`);
    if (el) el.value = e[k] || '';
  });
  if (u.savingsGoal) {
    $('inp-goal-amount').value = u.savingsGoal.targetAmount || '';
    $('inp-goal-months').value = u.savingsGoal.targetMonths || '';
    $('inp-goal-desc').value = u.savingsGoal.description || '';
  }
  $('dash-name').textContent = u.name || 'there';
}

// ── Live preview on profile form ────────────────────────────────────────────
function getFormExpenses() {
  const exp = {};
  document.querySelectorAll('.expense-input').forEach(el => {
    exp[el.dataset.key] = parseFloat(el.value) || 0;
  });
  return exp;
}

function updatePreview() {
  const income = parseFloat($('inp-income').value) || 0;
  const exp = getFormExpenses();
  const total = Object.values(exp).reduce((a, b) => a + b, 0);
  const savings = income - total;
  const rate = income > 0 ? Math.max(0, (savings / income) * 100) : 0;

  $('prev-expenses').textContent = fmt(total);
  $('prev-savings').textContent = fmt(savings);
  $('prev-savings').className = savings >= 0 ? 'positive' : 'negative';
  $('prev-rate').textContent = rate.toFixed(1) + '%';
  $('prev-meter').style.width = Math.min(100, rate) + '%';

  let status = 'Enter your details →';
  let color = 'var(--primary)';
  if (income > 0) {
    const r = total / income;
    if (r >= 1) { status = '🔴 Critical — Overspending!'; color = 'var(--danger)'; }
    else if (r >= 0.8) { status = '🟡 Warning — High Spending'; color = 'var(--warning)'; }
    else { status = '🟢 Safe — Good Balance'; color = 'var(--success)'; }
  }
  $('prev-status').textContent = status;
  $('prev-status').style.color = color;
  $('prev-status').style.background = color + '18';
}

$('inp-income').addEventListener('input', updatePreview);
document.querySelectorAll('.expense-input').forEach(el => el.addEventListener('input', updatePreview));

// ── Save Profile ─────────────────────────────────────────────────────────────
$('profile-form').addEventListener('submit', async e => {
  e.preventDefault();
  const income = parseFloat($('inp-income').value);
  if (!income || income < 0) { toast('Please enter a valid income.', 'error'); return; }

  const btn = $('btn-save-profile');
  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'Saving…';

  const payload = {
    sessionId: SESSION_ID,
    name: $('inp-name').value.trim() || 'User',
    income,
    language: $('inp-language').value,
    expenses: getFormExpenses(),
    savingsGoal: {
      targetAmount: parseFloat($('inp-goal-amount').value) || 0,
      targetMonths: parseInt($('inp-goal-months').value) || 12,
      description: $('inp-goal-desc').value.trim(),
    },
  };

  try {
    const r = await fetch(`${API}/user/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'Failed to save');

    state.user = data.data.user;
    toast('Profile saved successfully! ✓', 'success');
    $('dash-name').textContent = payload.name;
    updateDashboardStats(state.user);
    renderExpenseChart(state.user);
    showSection('dashboard');
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Save & Calculate';
  }
});

// ── Dashboard Stats ──────────────────────────────────────────────────────────
function updateDashboardStats(user) {
  if (!user) return;
  const e = user.expenses || {};
  const total = ['rent','food','travel','shopping','bills','emi','others'].reduce((a,k) => a + (e[k]||0), 0);
  const savings = (user.income||0) - total;

  $('dash-income').textContent = fmt(user.income);
  $('dash-expenses').textContent = fmt(total);
  $('dash-savings').textContent = fmt(savings);
  $('dash-health').textContent = state.analysis ? state.analysis.mlPrediction : '—';

  renderExpenseChart(user);
}

// ── Expense Chart (bar) ──────────────────────────────────────────────────────
const CHART_COLORS = [
  'linear-gradient(90deg,#6366f1,#818cf8)',
  'linear-gradient(90deg,#10b981,#34d399)',
  'linear-gradient(90deg,#f59e0b,#fbbf24)',
  'linear-gradient(90deg,#ec4899,#f472b6)',
  'linear-gradient(90deg,#14b8a6,#2dd4bf)',
  'linear-gradient(90deg,#ef4444,#f87171)',
  'linear-gradient(90deg,#8b5cf6,#a78bfa)',
];
const EXPENSE_LABELS = { rent:'Rent', food:'Food', travel:'Travel', shopping:'Shopping', bills:'Bills', emi:'EMI', others:'Others' };

function renderExpenseChart(user) {
  const e = user.expenses || {};
  const entries = Object.entries(EXPENSE_LABELS)
    .map(([k,label]) => ({ key:k, label, value: e[k]||0 }))
    .filter(x => x.value > 0)
    .sort((a,b) => b.value - a.value);

  const total = entries.reduce((a,x) => a + x.value, 0);
  $('chart-total').textContent = fmt(total);

  const wrap = $('expense-chart');
  if (!entries.length) {
    wrap.innerHTML = '<div class="empty-chart"><div class="empty-icon">📊</div><p>Enter your profile data to see the expense breakdown</p></div>';
    $('chart-legend').innerHTML = '';
    return;
  }

  const max = entries[0].value;
  wrap.innerHTML = entries.map((x, i) => `
    <div class="chart-bar-row">
      <div class="chart-bar-label">${x.label}</div>
      <div class="chart-bar-track">
        <div class="chart-bar-fill" style="width:${(x.value/max*100).toFixed(1)}%;background:${CHART_COLORS[i]}">
          <span>${fmt(x.value)}</span>
        </div>
      </div>
    </div>`).join('');

  $('chart-legend').innerHTML = entries.map((x,i) => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${CHART_COLORS[i].split(',')[1].replace(')','').trim()}"></div>
      ${x.label} (${total>0?((x.value/total)*100).toFixed(0):0}%)
    </div>`).join('');
}

// ── Forecast Bars ────────────────────────────────────────────────────────────
function renderForecast(forecast) {
  if (!forecast || !forecast.length) return;
  const months = ['M+1','M+2','M+3','M+4','M+5','M+6'];
  const max = Math.max(...forecast, 1);
  $('forecast-bars').innerHTML = forecast.map((val, i) => `
    <div class="forecast-bar-wrap">
      <div class="forecast-val">${fmt(val)}</div>
      <div class="forecast-bar-col">
        <div class="forecast-bar" style="height:${(val/max*100).toFixed(0)}%"></div>
      </div>
      <div class="forecast-label">${months[i]}</div>
    </div>`).join('');
}

// ── Run Analysis ─────────────────────────────────────────────────────────────
async function runAnalysis() {
  if (!state.user) {
    toast('Please save your financial profile first.', 'error');
    showSection('profile');
    return;
  }

  $('analysis-placeholder').classList.add('hidden');
  $('analysis-results').classList.add('hidden');
  $('analysis-loading').classList.remove('hidden');

  try {
    const r = await fetch(`${API}/analysis?sessionId=${SESSION_ID}`);
    const json = await r.json();
    if (!r.ok) throw new Error(json.message || 'Analysis failed');

    const { analysis, aiSummary } = json.data;
    state.analysis = analysis;

    // Status banner
    const banner = $('status-banner');
    banner.classList.remove('hidden','safe','warning','critical');
    banner.classList.add(analysis.status);
    const icons = { safe:'🟢', warning:'🟡', critical:'🔴' };
    $('banner-icon').textContent = icons[analysis.status];
    $('banner-title').textContent = analysis.status === 'safe' ? 'Financially Healthy' : analysis.status === 'warning' ? 'Spending Warning' : 'Critical Overspending';
    $('banner-text').textContent = aiSummary ? aiSummary.slice(0, 120) + '…' : 'See full analysis below.';
    $('banner-badge').textContent = analysis.mlPrediction;

    // Forecast
    renderForecast(analysis.savingsForecast);

    // Dashboard health score
    $('dash-health').textContent = analysis.mlPrediction;

    // AI Summary card
    $('ai-summary-text').textContent = aiSummary || 'AI summary unavailable.';
    const badge = $('analysis-status-badge');
    badge.textContent = analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1);
    badge.className = 'analysis-status-badge badge-' + analysis.status;

    // Metrics
    $('met-ml').textContent = analysis.mlPrediction;
    $('met-ml').style.color = analysis.mlPrediction === 'Safe' ? 'var(--success)' : 'var(--danger)';
    $('met-ml-conf').textContent = (analysis.mlConfidence || 0) + '% confidence';
    $('met-ratio').textContent = pct(analysis.spendingRatio);
    $('met-ratio').style.color = analysis.spendingRatio >= 1 ? 'var(--danger)' : analysis.spendingRatio >= 0.8 ? 'var(--warning)' : 'var(--success)';
    $('met-emi').textContent = (analysis.emiRisk || '—').charAt(0).toUpperCase() + (analysis.emiRisk||'').slice(1);
    $('met-emi-ratio').textContent = pct(analysis.emiRatio) + ' of income';
    $('met-emerg').textContent = fmt(analysis.emergencyFundRequired);
    $('met-emerg-months').textContent = analysis.monthsToEmergencyFund ? analysis.monthsToEmergencyFund + ' months to save' : 'Goal not set';

    // Recommendations
    $('recs-list').innerHTML = (json.data.analysis.budgetRecommendations || []).map(r =>
      `<div class="rec-item"><div class="rec-dot"></div><span>${r}</span></div>`).join('') || '<p style="color:var(--text-muted);font-size:13px">No recommendations — great job!</p>';

    // Tips
    $('tips-list').innerHTML = (json.data.analysis.financialTips || []).map(t =>
      `<div class="tip-item-full"><span style="flex-shrink:0">${t.slice(0,2)}</span><span>${t.slice(2)}</span></div>`).join('');

    // Tips on dashboard
    renderDashboardTips(json.data.analysis.financialTips);

    $('analysis-loading').classList.add('hidden');
    $('analysis-results').classList.remove('hidden');
    toast('Analysis complete! ✓', 'success');
  } catch (err) {
    $('analysis-loading').classList.add('hidden');
    $('analysis-placeholder').classList.remove('hidden');
    toast(err.message, 'error');
  }
}

function renderDashboardTips(tips) {
  if (!tips || !tips.length) return;
  const icons = ['💰','📊','🏦','📑','🏥','🚨','✂️','📈','💼','⚠️'];
  $('tips-grid').innerHTML = tips.slice(0,6).map((t, i) => `
    <div class="tip-item">
      <span class="tip-icon">${icons[i] || '💡'}</span>
      <span>${t.replace(/^[^\s]+\s/, '')}</span>
    </div>`).join('');
}

$('btn-run-analysis').addEventListener('click', runAnalysis);
$('btn-quick-analyze').addEventListener('click', () => { showSection('analysis'); runAnalysis(); });

// ── Chat ──────────────────────────────────────────────────────────────────────
function timeStr() {
  return new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
}

function addBubble(role, text, isTyping = false) {
  const msgs = $('chat-messages');
  const isUser = role === 'user';
  const div = document.createElement('div');
  div.className = `chat-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}${isTyping ? ' typing-indicator' : ''}`;
  div.id = isTyping ? 'typing-bubble' : '';

  const textContent = isTyping
    ? '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>'
    : text.replace(/\n/g, '<br>');

  div.innerHTML = `
    <div class="bubble-avatar">${isUser ? '👤' : '🤖'}</div>
    <div class="bubble-content">
      <div class="bubble-text">${textContent}</div>
      <div class="bubble-time">${timeStr()}</div>
    </div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function hideSuggestions() {
  $('chat-suggestions').style.display = 'none';
}

async function sendChat(msg) {
  if (!msg.trim() || state.chatLoading) return;
  hideSuggestions();
  state.chatLoading = true;
  $('chat-send-btn').disabled = true;
  $('chat-input').value = '';
  $('chat-input').style.height = 'auto';

  addBubble('user', msg);
  const typingEl = addBubble('assistant', '', true);

  try {
    const r = await fetch(`${API}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: SESSION_ID, message: msg, language: state.chatLang }),
    });
    const json = await r.json();
    typingEl.remove();
    if (!r.ok) throw new Error(json.message || 'Chat failed');
    addBubble('assistant', json.data.reply);
    $('chat-badge').style.display = 'inline';
  } catch (err) {
    typingEl.remove();
    addBubble('assistant', '⚠️ Sorry, I encountered an error: ' + err.message + '. Please try again.');
  } finally {
    state.chatLoading = false;
    $('chat-send-btn').disabled = false;
  }
}

$('chat-send-btn').addEventListener('click', () => sendChat($('chat-input').value));
$('chat-input').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat($('chat-input').value); }
});
// Auto-resize textarea
$('chat-input').addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

document.querySelectorAll('.suggestion-chip').forEach(chip => {
  chip.addEventListener('click', () => sendChat(chip.dataset.msg));
});

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.chatLang = btn.dataset.lang;
  });
});

$('btn-clear-chat').addEventListener('click', async () => {
  try {
    await fetch(`${API}/chat/history`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: SESSION_ID }),
    });
    $('chat-messages').innerHTML = `
      <div class="chat-bubble assistant-bubble">
        <div class="bubble-avatar">🤖</div>
        <div class="bubble-content">
          <div class="bubble-text">Chat cleared! How can I help you? 😊</div>
          <div class="bubble-time">${timeStr()}</div>
        </div>
      </div>`;
    $('chat-suggestions').style.display = 'flex';
    $('chat-badge').style.display = 'none';
    toast('Chat history cleared', 'info');
  } catch { toast('Failed to clear chat', 'error'); }
});

// ── History ───────────────────────────────────────────────────────────────────
async function loadHistory() {
  $('history-empty').classList.add('hidden');
  $('history-list').innerHTML = '';
  $('history-loading').classList.remove('hidden');

  try {
    const r = await fetch(`${API}/history?sessionId=${SESSION_ID}&limit=20`);
    const json = await r.json();
    $('history-loading').classList.add('hidden');

    const reports = json.data?.reports || [];
    if (!reports.length) { $('history-empty').classList.remove('hidden'); return; }

    $('history-list').innerHTML = reports.map(rep => {
      const s = rep.analysis?.status || 'safe';
      const icons = { safe:'🟢', warning:'🟡', critical:'🔴' };
      const colors = { safe:'rgba(16,185,129,0.15)', warning:'rgba(245,158,11,0.15)', critical:'rgba(239,68,68,0.15)' };
      const textColors = { safe:'var(--success)', warning:'var(--warning)', critical:'var(--danger)' };
      const date = new Date(rep.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
      return `
        <div class="history-item" onclick="openReport('${rep._id}')">
          <div class="history-item-icon" style="background:${colors[s]}">${icons[s]}</div>
          <div class="history-item-body">
            <div class="history-item-title">${rep.reportLabel || 'Financial Report'}</div>
            <div class="history-item-meta">Income: ${fmt(rep.income)} &nbsp;|&nbsp; Expenses: ${fmt(rep.analysis?.totalExpenses)} &nbsp;|&nbsp; ${date}</div>
          </div>
          <div class="history-item-badge" style="background:${colors[s]};color:${textColors[s]}">${rep.analysis?.mlPrediction || '—'}</div>
        </div>`;
    }).join('');
  } catch (err) {
    $('history-loading').classList.add('hidden');
    toast('Failed to load history', 'error');
  }
}

async function openReport(id) {
  try {
    const r = await fetch(`${API}/history/${id}`);
    const { data } = await r.json();
    const a = data.analysis || {};
    const e = data.expenses || {};

    $('modal-title').textContent = data.reportLabel || 'Financial Report';
    $('modal-body').innerHTML = `
      <div class="modal-section">
        <div class="modal-section-title">Income & Savings</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div>Income: <strong style="color:var(--text)">${fmt(data.income)}</strong></div>
          <div>Expenses: <strong style="color:var(--danger)">${fmt(a.totalExpenses)}</strong></div>
          <div>Savings: <strong style="color:var(--success)">${fmt(a.monthlySavings)}</strong></div>
          <div>Spending Ratio: <strong style="color:var(--text)">${pct(a.spendingRatio)}</strong></div>
        </div>
      </div>
      <div class="modal-section">
        <div class="modal-section-title">Expense Breakdown</div>
        ${Object.entries(EXPENSE_LABELS).filter(([k]) => e[k] > 0)
          .map(([k,l]) => `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border)"><span>${l}</span><strong style="color:var(--text)">${fmt(e[k])}</strong></div>`).join('')}
      </div>
      <div class="modal-section">
        <div class="modal-section-title">AI Analysis</div>
        <div style="margin-bottom:6px">Status: <strong style="color:var(--text)">${(a.status||'').toUpperCase()}</strong></div>
        <div style="margin-bottom:6px">ML Prediction: <strong style="color:${a.mlPrediction==='Safe'?'var(--success)':'var(--danger)'}">${a.mlPrediction}</strong> (${a.mlConfidence}%)</div>
        <div>EMI Risk: <strong style="color:var(--text)">${a.emiRisk||'—'}</strong></div>
      </div>
      ${data.aiSummary ? `<div class="modal-section"><div class="modal-section-title">AI Summary</div><p>${data.aiSummary}</p></div>` : ''}
    `;
    $('report-modal').classList.remove('hidden');
  } catch { toast('Failed to load report', 'error'); }
}


$('modal-close').addEventListener('click', () => $('report-modal').classList.add('hidden'));
$('report-modal').addEventListener('click', e => { if (e.target === $('report-modal')) $('report-modal').classList.add('hidden'); });
$('btn-refresh-history').addEventListener('click', loadHistory);

// ── Init ──────────────────────────────────────────────────────────────────────
// Expose globals needed by inline onclick="" attributes in index.html
window.showSection = showSection;
window.openReport  = openReport;

(async function init() {
  await loadProfile();
  updatePreview();
})();