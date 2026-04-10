// ── CONFIG ──────────────────────────────────────────────
const STORAGE_KEY = 'taskflow_v1';
const COLS = ['todo', 'doing', 'done', 'blocked'];

// ── STATE ────────────────────────────────────────────────
let tasks = [];
let editingId = null;
let dragId = null;
let activeFilter = 'all';
let searchQuery = '';

// ── UTILITIES ────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── PERSISTENCE ──────────────────────────────────────────
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : seedTasks();
  } catch {
    tasks = seedTasks();
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function seedTasks() {
  const fmt = n => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  };
  return [
    { id: uid(), title: 'Design landing page mockup', desc: 'Create wireframes and high-fidelity mock for the hero section.', priority: 'high', due: fmt(2), col: 'todo' },
    { id: uid(), title: 'Set up CI/CD pipeline', desc: 'Configure GitHub Actions for automated testing and deployment.', priority: 'medium', due: fmt(5), col: 'todo' },
    { id: uid(), title: 'Write unit tests for auth module', desc: 'Cover login, register, and token refresh flows.', priority: 'high', due: fmt(-1), col: 'doing' },
    { id: uid(), title: 'Integrate payments API', desc: 'Stripe checkout flow with backend webhooks.', priority: 'high', due: fmt(3), col: 'doing' },
    { id: uid(), title: 'Database schema finalized', desc: 'ER diagram approved by team. Migration scripts ready.', priority: 'low', due: fmt(-3), col: 'done' },
    { id: uid(), title: 'Fix CORS issue on staging', desc: 'Backend returning 403 for cross-origin preflight requests.', priority: 'high', due: fmt(1), col: 'blocked' },
  ];
}

// ── FILTERING ────────────────────────────────────────────
function filtered() {
  return tasks.filter(t => {
    const matchS = !searchQuery ||
      t.title.toLowerCase().includes(searchQuery) ||
      (t.desc || '').toLowerCase().includes(searchQuery);
    const matchF = activeFilter === 'all' || t.priority === activeFilter;
    return matchS && matchF;
  });
}

// ── DATE FORMATTING ──────────────────────────────────────
function formatDue(ds) {
  if (!ds) return null;
  const due = new Date(ds + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.round((due - now) / 86400000);
  const label =
    diff === 0 ? 'Today' :
    diff === 1 ? 'Tomorrow' :
    diff === -1 ? 'Yesterday' :
    diff < 0 ? `${Math.abs(diff)}d ago` :
    diff <= 7 ? `In ${diff}d` :
    due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const cls = diff < 0 ? 'overdue' : diff <= 2 ? 'soon' : '';
  return { label, cls };
}

// ── CARD HTML ────────────────────────────────────────────
function cardHTML(t) {
  const due = formatDue(t.due);
  return `<div class="card" draggable="true" data-id="${t.id}">
    <div class="card-top">
      <div class="card-title">${escHtml(t.title)}</div>
      <div class="card-actions">
        <button class="card-btn" onclick="editTask('${t.id}')" title="Edit">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="card-btn del" onclick="deleteTask('${t.id}')" title="Delete">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
        </button>
      </div>
    </div>
    ${t.desc ? `<div class="card-desc">${escHtml(t.desc)}</div>` : ''}
    <div class="card-footer">
      <span class="priority-badge priority-${t.priority}">${t.priority}</span>
      ${due ? `<span class="due-date ${due.cls}">
        <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        ${due.label}</span>` : ''}
    </div>
  </div>`;
}

// ── RENDER ───────────────────────────────────────────────
function render() {
  saveTasks();
  const vis = filtered();
  COLS.forEach(col => {
    const wrap = document.getElementById('cards-' + col);
    const colVis = vis.filter(t => t.col === col);
    document.getElementById('count-' + col).textContent = tasks.filter(t => t.col === col).length;
    wrap.innerHTML = colVis.length
      ? colVis.map(cardHTML).join('')
      : '<div class="col-empty">Drop tasks here</div>';
  });
  renderStats();
  setupDrag();
}

function renderStats() {
  const total = tasks.length;
  const done  = tasks.filter(t => t.col === 'done').length;
  const high  = tasks.filter(t => t.priority === 'high' && t.col !== 'done').length;
  const now   = new Date(); now.setHours(0, 0, 0, 0);
  const over  = tasks.filter(t => t.due && t.col !== 'done' && new Date(t.due + 'T00:00:00') < now).length;
  const pct   = total ? Math.round(done / total * 100) : 0;
  document.getElementById('statsBar').innerHTML = `
    <div class="stat"><div class="stat-dot" style="background:var(--text-muted)"></div><strong>${total}</strong> Total</div>
    <div class="stat"><div class="stat-dot" style="background:var(--col-done)"></div><strong>${done}</strong> Completed</div>
    <div class="stat"><div class="stat-dot" style="background:var(--col-blocked)"></div><strong>${high}</strong> High Priority</div>
    <div class="stat"><div class="stat-dot" style="background:var(--accent2)"></div><strong>${over}</strong> Overdue</div>
    <div class="stat">📊 <strong>${pct}%</strong> Done</div>`;
}

// ── DRAG & DROP ──────────────────────────────────────────
function setupDrag() {
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('dragstart', e => {
      dragId = card.dataset.id;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => {
      dragId = null;
      card.classList.remove('dragging');
      document.querySelectorAll('.column').forEach(c => c.classList.remove('drag-over'));
    });
  });
  document.querySelectorAll('.column').forEach(col => {
    col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('drag-over'); });
    col.addEventListener('dragleave', e => { if (!col.contains(e.relatedTarget)) col.classList.remove('drag-over'); });
    col.addEventListener('drop', e => {
      e.preventDefault();
      col.classList.remove('drag-over');
      if (!dragId) return;
      const t = tasks.find(t => t.id === dragId);
      if (t && t.col !== col.dataset.col) { t.col = col.dataset.col; render(); }
    });
  });
}

// ── MODAL ────────────────────────────────────────────────
function openModal(preCol) {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'New Task';
  document.getElementById('taskTitle').value = '';
  document.getElementById('taskDesc').value = '';
  document.getElementById('taskPriority').value = 'medium';
  document.getElementById('taskDue').value = '';
  document.getElementById('taskColumn').value = preCol || 'todo';
  document.getElementById('modalOverlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('taskTitle').focus(), 80);
}

function editTask(id) {
  const t = tasks.find(t => t.id === id);
  if (!t) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = 'Edit Task';
  document.getElementById('taskTitle').value = t.title;
  document.getElementById('taskDesc').value = t.desc || '';
  document.getElementById('taskPriority').value = t.priority;
  document.getElementById('taskDue').value = t.due || '';
  document.getElementById('taskColumn').value = t.col;
  document.getElementById('modalOverlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('taskTitle').focus(), 80);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  editingId = null;
}

function saveTask() {
  const title = document.getElementById('taskTitle').value.trim();
  if (!title) {
    const el = document.getElementById('taskTitle');
    el.style.borderColor = 'var(--accent2)';
    el.focus();
    setTimeout(() => el.style.borderColor = '', 1000);
    return;
  }
  const data = {
    title,
    desc: document.getElementById('taskDesc').value.trim(),
    priority: document.getElementById('taskPriority').value,
    due: document.getElementById('taskDue').value,
    col: document.getElementById('taskColumn').value,
  };
  if (editingId) {
    const i = tasks.findIndex(t => t.id === editingId);
    if (i !== -1) tasks[i] = { ...tasks[i], ...data };
  } else {
    tasks.push({ id: uid(), ...data });
  }
  closeModal();
  render();
}

function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  tasks = tasks.filter(t => t.id !== id);
  render();
}

// ── EVENT LISTENERS ──────────────────────────────────────
document.getElementById('searchInput').addEventListener('input', function () {
  searchQuery = this.value.trim().toLowerCase();
  render();
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    activeFilter = this.dataset.filter;
    render();
  });
});

document.getElementById('modalOverlay').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('searchInput').focus();
  }
});

// ── INIT ─────────────────────────────────────────────────
loadTasks();
render();
