/* Semestre a Barcelona: study abroad hub.
   Plain JavaScript, no build step. Data lives in this browser's localStorage. */
(() => {
'use strict';

/* =====================================================================
   Helpers
   ===================================================================== */
const KEY = 'bcn-hub-v1';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clone = o => JSON.parse(JSON.stringify(o));
const sum = a => a.reduce((x, y) => x + (+y || 0), 0);
const pad = n => String(n).padStart(2, '0');

const PALETTE = ['#27c4b0', '#ffc93c', '#e63946', '#ff7a59', '#4ea1ff', '#a78bfa', '#6fd08c', '#f472b6'];
const DAYS = [
  { n: 1, s: 'Mon', l: 'Monday' }, { n: 2, s: 'Tue', l: 'Tuesday' }, { n: 3, s: 'Wed', l: 'Wednesday' },
  { n: 4, s: 'Thu', l: 'Thursday' }, { n: 5, s: 'Fri', l: 'Friday' }, { n: 6, s: 'Sat', l: 'Saturday' }, { n: 0, s: 'Sun', l: 'Sunday' }
];
const STAGES = [['Idea', '#a78bfa'], ['Shooting', '#ffc93c'], ['Editing', '#ff7a59'], ['Submitted', '#4ea1ff'], ['Published', '#6fd08c']];
const FORMATS = ['Video', 'Reel or short', 'Photo set', 'Blog post', 'Article', 'Podcast', 'Story', 'Other'];
const IDEA_TAGS = ['Food', 'Culture', 'Travel', 'Daily life', 'Language', 'Student life', 'Other'];
const PLACE_CATS = ['Restaurant', 'Cafe', 'Tapas and bars', 'Bakery', 'Market', 'Sight', 'Outdoors', 'Nightlife', 'Shopping', 'Other'];
const PLACE_COLORS = { Restaurant: '#ff7a59', Cafe: '#ffc93c', 'Tapas and bars': '#e63946', Bakery: '#f472b6', Market: '#27c4b0', Sight: '#4ea1ff', Outdoors: '#6fd08c', Nightlife: '#a78bfa', Shopping: '#ff9ec7', Other: '#9aa5cc' };
const FOOD_CATS = ['Restaurant', 'Cafe', 'Tapas and bars', 'Bakery', 'Market'];
const EXP_CATS = [['Housing', '#4ea1ff'], ['Groceries', '#6fd08c'], ['Food out', '#ff7a59'], ['Transport', '#ffc93c'], ['Travel', '#27c4b0'], ['Fun', '#a78bfa'], ['Shopping', '#f472b6'], ['Health', '#e63946'], ['School', '#9aa5cc'], ['Other', '#6b7599']];
const MOODS = [['😍', 'Amazing'], ['😊', 'Good'], ['😐', 'Okay'], ['😴', 'Tired'], ['🥲', 'Homesick']];
const PROMPTS = [
  'What did you see today that you would never see at home?',
  'What was the best thing you ate this week, and where?',
  'Which Catalan or Spanish word or phrase did you pick up?',
  'Where did you get lost, and what did you find?',
  'What made you feel at home today?',
  'Who did you meet, and what did you talk about?',
  'What would you film if you only had five minutes of footage?',
  'What do you miss from home right now? What are you glad to be away from?',
  'Describe one street you walked down in three sentences.',
  'What surprised you about the city today?',
  'What is one small win from today?',
  'What do you still want to do before the semester ends?'
];
const STARTER_PLACES = [
  ['Sagrada Família', 'Sight', 'Eixample', '€€', 'Book tickets ahead of time.'],
  ['Park Güell', 'Sight', 'Gràcia', '€€', 'Timed entry for the monument zone. Go early.'],
  ['Casa Batlló', 'Sight', 'Eixample', '€€€', ''],
  ['Palau de la Música Catalana', 'Sight', 'Sant Pere', '€€', 'Look up the guided tour times.'],
  ['Bunkers del Carmel', 'Outdoors', 'El Carmel', '€', 'Free viewpoint. Good for sunset.'],
  ['Montjuïc', 'Outdoors', 'Montjuïc', '€', 'Castle, gardens and views over the port.'],
  ['Barceloneta beach', 'Outdoors', 'Barceloneta', '€', ''],
  ['Mercat de la Boqueria', 'Market', 'El Raval', '€€', 'Busy. Try the smaller stalls away from the entrance.'],
  ['Mercat de Santa Caterina', 'Market', 'El Born', '€€', ''],
  ['Bar del Pla', 'Tapas and bars', 'El Born', '€€', ''],
  ['Carrer de Blai', 'Tapas and bars', 'Poble-sec', '€', 'Pintxos street.'],
  ['Granja Viader', 'Cafe', 'El Raval', '€', 'Classic spot for hot chocolate.'],
  ['Can Culleretes', 'Restaurant', 'Barri Gòtic', '€€', 'One of the oldest restaurants in the city.']
];
const PACK_STARTER = ['Passport and visa papers', 'Phone charger and EU plug adapter', 'Debit and credit cards', 'Some cash in euros', 'Medications', 'Reusable water bottle', 'Comfortable walking shoes', 'Rain jacket', 'Camera and memory card'];

const DEFAULT_STATE = {
  settings: { name: '', start: '', end: '', monthlyBudget: 900, homeCurrency: 'USD', rate: 1.1, homeLabel: 'Home', homeOffset: 6 },
  classes: [], assignments: [], content: [], ideas: [], trips: [], wishlist: [], places: [], expenses: [], journal: []
};

/* ---------- dates ---------- */
const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => iso(new Date());
const parseD = (s, t) => {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  const [h, mi] = (t || '00:00').split(':').map(Number);
  return new Date(y, m - 1, d, h, mi);
};
const D = x => (typeof x === 'string' ? parseD(x) : x);
const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / 864e5);
const fmtDate = x => D(x).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const shortDate = x => D(x).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const fmtTime = t => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};
const monthLabel = ym => { const [y, m] = ym.split('-').map(Number); return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); };
const shiftMonth = (ym, n) => { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };

/* =====================================================================
   State and storage
   ===================================================================== */
let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) { console.warn('Could not read saved data', e); }
  return clone(DEFAULT_STATE);
}
function normalize(p) {
  const base = clone(DEFAULT_STATE);
  const out = { ...base, ...p, settings: { ...base.settings, ...(p.settings || {}) } };
  Object.keys(base).forEach(k => { if (k !== 'settings' && !Array.isArray(out[k])) out[k] = []; });
  return out;
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { toast('Could not save. Browser storage may be full or blocked.'); }
}
function upsert(coll, obj) {
  const arr = state[coll];
  const i = arr.findIndex(x => x.id === obj.id);
  if (i >= 0) arr[i] = obj; else arr.push(obj);
  save(); render();
}
function remove(coll, id) {
  state[coll] = state[coll].filter(x => x.id !== id);
  save(); render();
}

const ui = {
  tab: { content: 'pipeline', travel: 'trips' },
  month: today().slice(0, 7),
  aFilter: 'todo', aCourse: '', ideaTag: '', placeCat: '', placeStatus: 'all'
};

/* =====================================================================
   Derived data
   ===================================================================== */
const classColor = name => (state.classes.find(c => c.course === name) || {}).color || '#9aa5cc';
const tVal = i => { const d = dueAt(i); return d ? d.getTime() : Infinity; };
const byDue = (a, b) => (tVal(a) - tVal(b)) || 0;

function dueAt(i) {
  if (!i || !i.due) return null;
  let d = parseD(i.due, i.dueTime || '23:59');
  if (i.clock === 'home') d = new Date(d.getTime() + (+state.settings.homeOffset || 0) * 36e5);
  return d;
}
function dueText(i) {
  const at = dueAt(i);
  let t = fmtDate(i.due) + (i.dueTime ? ' at ' + fmtTime(i.dueTime) : '');
  if (i.clock === 'home') {
    t += ` ${state.settings.homeLabel || 'home'} time (${at.toLocaleDateString('en-US', { weekday: 'short' })} ${at.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} in Barcelona)`;
  }
  return t;
}
function rel(d) {
  const n = daysBetween(new Date(), d);
  if (d < new Date()) return n === 0 ? 'Overdue today' : `${-n} day${n === -1 ? '' : 's'} overdue`;
  if (n === 0) return 'Due today';
  if (n === 1) return 'Due tomorrow';
  return `Due in ${n} days`;
}
function upcomingItems() {
  const items = [];
  state.assignments.filter(a => a.status !== 'Done' && a.due).forEach(a =>
    items.push({ kind: 'Assignment', title: a.title, sub: a.course || '', at: dueAt(a), color: classColor(a.course), act: 'edit-assign', id: a.id }));
  state.content.filter(p => !['Submitted', 'Published'].includes(p.stage) && p.due).forEach(p =>
    items.push({ kind: 'Content', title: p.title, sub: p.format || '', at: dueAt(p), color: '#ff7a59', act: 'edit-piece', id: p.id }));
  return items.sort((a, b) => a.at - b.at);
}
function streak() {
  const set = new Set(state.journal.map(j => j.date));
  let d = new Date();
  if (!set.has(iso(d))) d = addDays(d, -1);
  let n = 0;
  while (set.has(iso(d))) { n++; d = addDays(d, -1); }
  return n;
}
function weekendList(n) {
  const out = [];
  const d = startOfDay(new Date());
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
  const items = upcomingItems();
  for (let i = 0; i < n; i++) {
    const sat = addDays(d, 7 * i), sun = addDays(sat, 1), fri = addDays(sat, -1), mon = addDays(sat, 2);
    if (state.settings.end && iso(sat) > state.settings.end) break;
    const trip = state.trips.find(t => t.start && t.end && t.start <= iso(sun) && t.end >= iso(sat));
    const dl = items.filter(x => x.at >= startOfDay(fri) && x.at <= endOfDay(mon));
    out.push({ sat, sun, trip, dl });
  }
  return out;
}

/* ---------- money ---------- */
function fmtMoney(n, cur) {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(n); }
  catch (e) { return `${cur} ${n.toFixed(2)}`; }
}
const eur = n => fmtMoney(n, 'EUR');
const homeMoney = n => fmtMoney(n * (+state.settings.rate || 1), state.settings.homeCurrency || 'USD');

/* =====================================================================
   Icons and mosaic
   ===================================================================== */
const svg = p => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const ICON = {
  home: svg('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>'),
  cal: svg('<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>'),
  tasks: svg('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 13l2 2 4-4"/>'),
  film: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/>'),
  plane: svg('<path d="M2 13l20-9-7 17-3-7z"/><path d="M12 14l10-10"/>'),
  pin: svg('<path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
  euro: svg('<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5a4.5 4.5 0 100 7M7 11h6M7 13.5h6"/>'),
  book: svg('<path d="M4 5a2 2 0 012-2h13v17H6a2 2 0 00-2 2z"/><path d="M8 7h7"/>'),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'),
  edit: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
  check: svg('<path d="M4 12l5 5L20 6"/>'),
  x: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  left: svg('<path d="M15 5l-7 7 7 7"/>'),
  right: svg('<path d="M9 5l7 7-7 7"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>')
};
const LOGO = `<svg viewBox="0 0 128 128" aria-hidden="true"><rect width="128" height="128" rx="30" fill="#0d1220"/><g stroke="#0d1220" stroke-width="3" stroke-linejoin="round"><polygon points="14,14 66,10 40,58" fill="#27c4b0"/><polygon points="66,10 114,18 84,52" fill="#ffc93c"/><polygon points="40,58 66,10 84,52" fill="#4ea1ff" fill-opacity=".85"/><polygon points="14,14 40,58 10,84" fill="#e63946"/><polygon points="114,18 118,70 84,52" fill="#ff7a59"/><polygon points="40,58 84,52 62,96" fill="#a78bfa"/><polygon points="10,84 40,58 62,96 30,118" fill="#6fd08c" fill-opacity=".9"/><polygon points="84,52 118,70 100,114 62,96" fill="#f472b6" fill-opacity=".9"/><polygon points="30,118 62,96 100,114 98,120 34,122" fill="#ffc93c" fill-opacity=".8"/></g></svg>`;

// Trencadís: broken-tile mosaic, like Gaudí's Park Güell bench. Seeded so it looks the same each visit.
function mosaic(w, h, cell, seed, cols) {
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const nc = Math.ceil(w / cell) + 1, nr = Math.ceil(h / cell) + 1;
  const P = [];
  for (let r = 0; r <= nr; r++) {
    P[r] = [];
    for (let c = 0; c <= nc; c++) P[r][c] = [c * cell + (rnd() - .5) * cell * .7, r * cell + (rnd() - .5) * cell * .7];
  }
  let out = '';
  const poly = pts => {
    const col = cols[Math.floor(rnd() * cols.length)];
    const op = (.62 + rnd() * .38).toFixed(2);
    out += `<polygon points="${pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ')}" fill="${col}" fill-opacity="${op}"/>`;
  };
  for (let r = 0; r < nr; r++) {
    for (let c = 0; c < nc; c++) {
      const a = P[r][c], b = P[r][c + 1], d = P[r + 1][c + 1], e = P[r + 1][c];
      if (rnd() < .5) { poly([a, b, d]); poly([a, d, e]); } else { poly([a, b, e]); poly([b, d, e]); }
    }
  }
  return `<svg class="mosaic" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g>${out}</g></svg>`;
}

/* =====================================================================
   UI building blocks
   ===================================================================== */
const btn = (label, act, data = {}, cls = '') =>
  `<button class="btn ${cls}" data-act="${act}" ${Object.entries(data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ')}>${label}</button>`;
const pageHead = (title, sub, actions = '') =>
  `<header class="phead"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="acts">${actions}</div></header>`;
const empty = (title, text, action = '') =>
  `<div class="empty"><b>${title}</b><span>${text}</span>${action}</div>`;
const tabs = (group, items) =>
  `<div class="tabs" role="tablist">${items.map(([v, l]) => `<button role="tab" aria-selected="${ui.tab[group] === v}" class="${ui.tab[group] === v ? 'on' : ''}" data-act="tab" data-g="${group}" data-v="${v}">${l}</button>`).join('')}</div>`;
const chips = (items, current, act) =>
  `<div class="chips">${items.map(([v, l]) => `<button class="chip ${current === v ? 'on' : ''}" data-act="${act}" data-v="${esc(v)}">${esc(l)}</button>`).join('')}</div>`;

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ---------- modal + generic form ---------- */
function modal(html, wide) {
  $('#modal-root').innerHTML = `<div class="overlay"><div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div></div>`;
  document.body.classList.add('noscroll');
}
function closeModal() {
  $('#modal-root').innerHTML = '';
  document.body.classList.remove('noscroll');
  formCtx = null;
}
let formCtx = null;

function fieldHTML(f, v) {
  const id = 'f_' + f.key;
  const req = f.required ? 'required' : '';
  const val = v[f.key] ?? f.default ?? '';
  const full = f.full ? 'full' : '';
  if (f.type === 'checkbox') return `<label class="f check full"><input type="checkbox" name="${f.key}" ${val ? 'checked' : ''}><span>${esc(f.label)}</span></label>`;
  let inner = '';
  let labelEl = `<label class="lbl" for="${id}">${esc(f.label)}</label>`;
  switch (f.type) {
    case 'textarea':
      inner = `<textarea id="${id}" name="${f.key}" rows="${f.rows || 3}" ${req} placeholder="${esc(f.ph || '')}">${esc(val)}</textarea>`; break;
    case 'select': {
      const opts = (typeof f.options === 'function' ? f.options() : f.options).map(o => {
        const ov = typeof o === 'object' ? o.v : o, ol = typeof o === 'object' ? o.l : o;
        return `<option value="${esc(ov)}" ${String(ov) === String(val) ? 'selected' : ''}>${esc(ol)}</option>`;
      }).join('');
      inner = `<select id="${id}" name="${f.key}" ${req}>${opts}</select>`; break;
    }
    case 'days':
      labelEl = `<span class="lbl">${esc(f.label)}</span>`;
      inner = `<div class="daypick">${DAYS.map(d => `<label class="daychip"><input type="checkbox" name="${f.key}" value="${d.n}" ${(val || []).includes(d.n) ? 'checked' : ''}><span>${d.s}</span></label>`).join('')}</div>`; break;
    case 'color':
      labelEl = `<span class="lbl">${esc(f.label)}</span>`;
      inner = `<div class="swatches">${PALETTE.map(c => `<label><input type="radio" name="${f.key}" value="${c}" ${(val || PALETTE[0]) === c ? 'checked' : ''}><span style="background:${c}"></span></label>`).join('')}</div>`; break;
    default: {
      const list = f.list ? `<datalist id="dl_${f.key}">${f.list().map(o => `<option value="${esc(o)}">`).join('')}</datalist>` : '';
      inner = `<input id="${id}" name="${f.key}" type="${f.type || 'text'}" value="${esc(val)}" ${f.list ? `list="dl_${f.key}"` : ''} ${f.step ? `step="${f.step}"` : ''} ${f.min != null ? `min="${f.min}"` : ''} ${req} placeholder="${esc(f.ph || '')}" autocomplete="off">${list}`;
    }
  }
  return `<div class="f ${full}">${labelEl}${inner}</div>`;
}

function collect(form, fields) {
  const out = {};
  fields.forEach(f => {
    if (f.type === 'days') out[f.key] = $$(`input[name="${f.key}"]:checked`, form).map(i => +i.value);
    else if (f.type === 'color') { const c = form.querySelector(`input[name="${f.key}"]:checked`); out[f.key] = c ? c.value : PALETTE[0]; }
    else if (f.type === 'checkbox') out[f.key] = form.elements[f.key].checked;
    else if (f.type === 'number') { const v = form.elements[f.key].value; out[f.key] = v === '' ? '' : parseFloat(v); }
    else out[f.key] = form.elements[f.key].value.trim();
  });
  return out;
}

function openForm({ title, fields, values = {}, onSave, onDelete }) {
  formCtx = { fields, onSave, onDelete };
  modal(`<form id="mform"><h2>${esc(title)}</h2><div class="fgrid">${fields.map(f => fieldHTML(f, values)).join('')}</div>
    <div class="mfoot">${onDelete ? btn('Delete', 'form-delete', {}, 'danger left').replace('data-act', 'type="button" data-act') : ''}
    <button type="button" class="btn" data-act="close-modal">Cancel</button><button type="submit" class="btn primary">Save</button></div></form>`);
  const first = $('#mform input:not([type=checkbox]):not([type=radio]), #mform select, #mform textarea');
  if (first && !values.id) first.focus();
}

function entityForm(coll, id, name, fields, defaults = {}, after) {
  const cur = id ? state[coll].find(x => x.id === id) : null;
  openForm({
    title: (cur ? 'Edit ' : 'Add ') + name, fields, values: cur || defaults,
    onSave: v => { upsert(coll, { ...(cur || {}), ...v, id: cur ? cur.id : uid() }); if (after) after(); },
    onDelete: cur ? () => { if (!confirm('Delete this ' + name + '?')) return false; remove(coll, cur.id); } : null
  });
}

/* =====================================================================
   Entity forms
   ===================================================================== */
const courseNames = () => [...new Set(state.classes.map(c => c.course))];

function editClass(id) {
  entityForm('classes', id, 'class', [
    { key: 'course', label: 'Course name', required: true, full: true },
    { key: 'code', label: 'Course code' },
    { key: 'professor', label: 'Professor' },
    { key: 'days', label: 'Days', type: 'days', full: true },
    { key: 'start', label: 'Starts', type: 'time' },
    { key: 'end', label: 'Ends', type: 'time' },
    { key: 'room', label: 'Room or building' },
    { key: 'color', label: 'Color', type: 'color' },
    { key: 'notes', label: 'Notes (attendance policy, grading, office hours)', type: 'textarea', full: true }
  ], { color: PALETTE[state.classes.length % PALETTE.length], days: [] });
}

function editAssign(id, defaults) {
  entityForm('assignments', id, 'assignment', [
    { key: 'title', label: 'Assignment', required: true, full: true },
    { key: 'course', label: 'Course', list: courseNames },
    { key: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High'] },
    { key: 'due', label: 'Due date', type: 'date', required: true },
    { key: 'dueTime', label: 'Due time (optional)', type: 'time' },
    { key: 'clock', label: 'Deadline is on', type: 'select', options: [{ v: 'bcn', l: 'Barcelona time' }, { v: 'home', l: `${state.settings.homeLabel || 'Home'} time` }] },
    { key: 'status', label: 'Status', type: 'select', options: ['To do', 'In progress', 'Done'] },
    { key: 'notes', label: 'Notes', type: 'textarea', full: true }
  ], { status: 'To do', priority: 'Medium', clock: 'bcn', ...(defaults || {}) });
}

function editPiece(id, defaults) {
  entityForm('content', id, 'content piece', [
    { key: 'title', label: 'Title', required: true, full: true },
    { key: 'format', label: 'Format', type: 'select', options: FORMATS },
    { key: 'stage', label: 'Stage', type: 'select', options: STAGES.map(s => s[0]) },
    { key: 'due', label: 'Due date', type: 'date' },
    { key: 'sendTo', label: 'Send it to', ph: 'Coordinator, email or upload link' },
    { key: 'tags', label: 'Tags', ph: 'food, culture' },
    { key: 'place', label: 'Linked place', type: 'select', options: () => [{ v: '', l: 'None' }, ...state.places.map(p => ({ v: p.id, l: p.name }))] },
    { key: 'shotList', label: 'Shot list or outline', type: 'textarea', full: true, rows: 4 },
    { key: 'caption', label: 'Caption or script draft', type: 'textarea', full: true, rows: 4 },
    { key: 'notes', label: 'Requirements and notes', type: 'textarea', full: true }
  ], { stage: 'Idea', format: 'Video', ...(defaults || {}) });
}

function editIdea(id) {
  entityForm('ideas', id, 'idea', [
    { key: 'title', label: 'Idea', required: true, full: true },
    { key: 'tag', label: 'Tag', type: 'select', options: IDEA_TAGS },
    { key: 'notes', label: 'Notes', type: 'textarea', full: true },
    { key: 'ready', label: 'Ready to film or write', type: 'checkbox' }
  ], { tag: 'Food' });
}

function editTrip(id, defaults) {
  entityForm('trips', id, 'trip', [
    { key: 'destination', label: 'Destination', required: true, full: true },
    { key: 'start', label: 'Leave', type: 'date', required: true },
    { key: 'end', label: 'Return', type: 'date', required: true },
    { key: 'transport', label: 'Transport', ph: 'Train, flight, bus' },
    { key: 'lodging', label: 'Where you are staying' },
    { key: 'confirmation', label: 'Booking confirmation' },
    { key: 'budget', label: 'Trip budget (EUR)', type: 'number', step: '0.01', min: 0 },
    { key: 'notes', label: 'Notes', type: 'textarea', full: true }
  ], defaults || {}, () => {});
}

function editWish(id) {
  entityForm('wishlist', id, 'wishlist destination', [
    { key: 'name', label: 'Destination', required: true, full: true },
    { key: 'cost', label: 'Rough cost (EUR)', type: 'number', step: '0.01', min: 0 },
    { key: 'notes', label: 'Why go, best time, who with', type: 'textarea', full: true }
  ]);
}

function editPlace(id) {
  entityForm('places', id, 'place', [
    { key: 'name', label: 'Name', required: true, full: true },
    { key: 'category', label: 'Category', type: 'select', options: PLACE_CATS },
    { key: 'neighborhood', label: 'Neighborhood' },
    { key: 'price', label: 'Price', type: 'select', options: ['', '€', '€€', '€€€', '€€€€'] },
    { key: 'rating', label: 'Your rating', type: 'select', options: [{ v: '', l: 'Not rated' }, { v: '5', l: '5 stars' }, { v: '4', l: '4 stars' }, { v: '3', l: '3 stars' }, { v: '2', l: '2 stars' }, { v: '1', l: '1 star' }] },
    { key: 'link', label: 'Link (optional)', type: 'url', full: true, ph: 'https://' },
    { key: 'notes', label: 'Notes', type: 'textarea', full: true },
    { key: 'been', label: 'I have been here', type: 'checkbox' }
  ], { category: 'Restaurant' });
}

function editExpense(id) {
  const cur = id ? state.expenses.find(e => e.id === id) : null;
  const vals = cur ? { ...cur, amount: cur.orig } : { date: today(), cur: 'EUR', category: 'Food out' };
  openForm({
    title: cur ? 'Edit expense' : 'Log expense',
    values: vals,
    fields: [
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'amount', label: 'Amount', type: 'number', step: '0.01', min: 0, required: true },
      { key: 'cur', label: 'Currency', type: 'select', options: [{ v: 'EUR', l: 'EUR' }, { v: 'HOME', l: state.settings.homeCurrency || 'USD' }] },
      { key: 'category', label: 'Category', type: 'select', options: EXP_CATS.map(c => c[0]) },
      { key: 'note', label: 'What was it?', full: true, ph: 'Lunch at the market' },
      { key: 'trip', label: 'Part of a trip?', type: 'select', full: true, options: () => [{ v: '', l: 'No' }, ...state.trips.map(t => ({ v: t.id, l: t.destination }))] }
    ],
    onSave: v => {
      const rate = +state.settings.rate || 1;
      const e = v.cur === 'EUR' ? v.amount : v.amount / rate;
      upsert('expenses', { ...(cur || {}), id: cur ? cur.id : uid(), date: v.date, orig: v.amount, cur: v.cur, eur: e, category: v.category, note: v.note, trip: v.trip });
      toast('Expense saved');
    },
    onDelete: cur ? () => { if (!confirm('Delete this expense?')) return false; remove('expenses', cur.id); } : null
  });
}

function editJournal(id) {
  const cur = id ? state.journal.find(j => j.id === id) : null;
  const prompt = PROMPTS[Math.floor(new Date() / 864e5) % PROMPTS.length];
  openForm({
    title: cur ? 'Edit entry' : 'New journal entry',
    values: cur || { date: today(), mood: '😊' },
    fields: [
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'mood', label: 'How are you feeling?', type: 'select', options: MOODS.map(m => ({ v: m[0], l: `${m[0]} ${m[1]}` })) },
      { key: 'best', label: 'Best moment of the day', full: true },
      { key: 'text', label: 'Write about your day', type: 'textarea', rows: 8, full: true, ph: prompt },
      { key: 'phrase', label: 'New word or phrase (Catalan, Spanish)', full: true }
    ],
    onSave: v => { upsert('journal', { ...(cur || {}), ...v, id: cur ? cur.id : uid() }); toast('Entry saved'); },
    onDelete: cur ? () => { if (!confirm('Delete this entry?')) return false; remove('journal', cur.id); } : null
  });
}

/* =====================================================================
   Views
   ===================================================================== */
function viewDashboard() {
  const s = state.settings, now = new Date(), h = now.getHours();
  const greet = h < 12 ? 'Bon dia' : h < 20 ? 'Bona tarda' : 'Bona nit';
  let sub = 'Add your program dates in Settings to see your semester countdown.', prog = '';
  const st = parseD(s.start), en = parseD(s.end);
  if (st && en) {
    const total = daysBetween(st, en) + 1;
    if (daysBetween(now, st) > 0) sub = `${daysBetween(now, st)} days until Barcelona`;
    else if (daysBetween(now, en) >= 0) {
      const d = daysBetween(st, now) + 1;
      sub = `Day ${d} of ${total} in Barcelona, ${daysBetween(now, en)} days left`;
      prog = `<div class="bar" role="progressbar" aria-valuenow="${d}" aria-valuemax="${total}"><i style="width:${Math.min(100, d / total * 100)}%"></i></div>`;
    } else sub = 'Semester complete. Visca!';
  }
  const todays = state.classes.filter(c => (c.days || []).includes(now.getDay())).sort((a, b) => (a.start || '').localeCompare(b.start || ''));
  const soon = upcomingItems().filter(x => x.at <= addDays(now, 14)).slice(0, 7);
  const trip = state.trips.filter(t => t.end >= today()).sort((a, b) => a.start.localeCompare(b.start))[0];
  const ym = today().slice(0, 7);
  const spent = sum(state.expenses.filter(e => e.date.startsWith(ym)).map(e => e.eur));
  const budget = +s.monthlyBudget || 0;
  const pct = budget ? spent / budget * 100 : 0;
  const nextFree = weekendList(10).find(w => !w.trip && !w.dl.length);
  const last = [...state.journal].sort((a, b) => b.date.localeCompare(a.date))[0];
  const wroteToday = state.journal.some(j => j.date === today());

  return `
  <section class="hero">
    ${mosaic(1200, 280, 44, 20260, ['#27c4b0', '#ffc93c', '#e63946', '#ff7a59', '#4ea1ff', '#a78bfa', '#e8ecf7'])}
    <h1>${greet}${s.name ? ', ' + esc(s.name) : ''}</h1>
    <p>${sub}</p>${prog}
    <div class="quick">
      ${btn('Add assignment', 'add-assign')}${btn('Log expense', 'add-expense')}${btn('Write journal', 'add-journal')}${btn('Save a place', 'add-place')}${btn('New idea', 'add-idea')}
    </div>
  </section>
  <div class="panels">
    <section class="panel"><div class="panel-h"><h2>Today's classes</h2><a href="#schedule">Full schedule</a></div>
      ${todays.length ? todays.map(c => `<div class="mini"><span class="dot" style="--c:${c.color}"></span><div class="grow"><div class="t">${esc(c.course)}</div><div class="m">${c.start ? fmtTime(c.start) + (c.end ? ' to ' + fmtTime(c.end) : '') : 'Time not set'}${c.room ? ', ' + esc(c.room) : ''}</div></div></div>`).join('') : '<p class="muted">No classes today.</p>'}
    </section>
    <section class="panel"><div class="panel-h"><h2>Coming up</h2><a href="#assignments">All assignments</a></div>
      ${soon.length ? soon.map(x => `<div class="mini"><span class="dot" style="--c:${x.color}"></span><div class="grow"><div class="t">${esc(x.title)}</div><div class="m">${x.kind}${x.sub ? ', ' + esc(x.sub) : ''}</div></div><span class="rel ${x.at < now ? 'bad' : ''}">${rel(x.at)}</span></div>`).join('') : '<p class="muted">Nothing due in the next two weeks.</p>'}
    </section>
    <section class="panel"><div class="panel-h"><h2>Next trip</h2><a href="#travel">Travel</a></div>
      ${trip ? `<div class="big">${esc(trip.destination)}</div><p class="muted">${shortDate(trip.start)} to ${shortDate(trip.end)}${daysBetween(now, D(trip.start)) > 0 ? `, in ${daysBetween(now, D(trip.start))} days` : ', happening now'}</p>` : '<p class="muted">No trips planned yet.</p>'}
      ${nextFree ? `<p class="note">Next free weekend: ${shortDate(nextFree.sat)} to ${shortDate(nextFree.sun)}</p>` : ''}
    </section>
    <section class="panel"><div class="panel-h"><h2>Spending this month</h2><a href="#budget">Budget</a></div>
      <div class="big">${eur(spent)}</div>
      <div class="bar ${pct > 100 ? 'over' : pct > 80 ? 'warn' : ''}"><i style="width:${Math.min(100, pct)}%"></i></div>
      <p class="muted">${budget ? `${eur(Math.abs(budget - spent))} ${budget >= spent ? 'left of' : 'over'} your ${eur(budget)} budget` : 'Set a monthly budget in Settings.'}</p>
    </section>
    <section class="panel wide"><div class="panel-h"><h2>Journal</h2><a href="#journal">Open journal</a></div>
      <p class="muted">${streak() ? `${streak()} day streak.` : 'No entries yet.'} ${wroteToday ? 'You wrote today.' : ''}</p>
      ${last ? `<div class="mini"><span class="big">${esc(last.mood || '')}</span><div class="grow"><div class="t">${esc(last.best || shortDate(last.date))}</div><div class="m">${fmtDate(last.date)}</div></div></div>` : ''}
      ${wroteToday ? '' : `<div>${btn('Write today\'s entry', 'add-journal', {}, 'primary')}</div>`}
    </section>
  </div>`;
}

function viewSchedule() {
  const days = DAYS.filter(d => (d.n >= 1 && d.n <= 5) || state.classes.some(c => (c.days || []).includes(d.n)));
  const wd = new Date().getDay();
  const cols = days.map(d => {
    const list = state.classes.filter(c => (c.days || []).includes(d.n)).sort((a, b) => (a.start || '').localeCompare(b.start || ''));
    return `<div class="day ${d.n === wd ? 'today' : ''}"><h3>${d.l}${d.n === wd ? '<small>Today</small>' : ''}</h3>
      ${list.length ? list.map(c => `<button class="slot" style="--c:${c.color}" data-act="edit-class" data-id="${c.id}"><b>${esc(c.course)}</b><span>${c.start ? fmtTime(c.start) + (c.end ? ' to ' + fmtTime(c.end) : '') : ''}${c.room ? ' in ' + esc(c.room) : ''}</span></button>`).join('') : '<span class="none">Free</span>'}</div>`;
  }).join('');
  return pageHead('Class schedule', 'Your week at a glance. Tap a class to edit it.', btn(ICON.plus + 'Add class', 'add-class', {}, 'primary')) +
    (state.classes.length ? `<div class="week">${cols}</div>
      <h2 class="grp" style="margin-top:32px">Courses <span>${state.classes.length}</span></h2>
      <div class="grid">${state.classes.map(c => `<article class="card" style="--c:${c.color}"><h3>${esc(c.course)}</h3>
        <div class="m">${c.code ? `<span>${esc(c.code)}</span>` : ''}${c.professor ? `<span>${esc(c.professor)}</span>` : ''}</div>
        <div class="m">${(c.days || []).map(n => DAYS.find(d => d.n === n).s).join(', ')}${c.start ? ', ' + fmtTime(c.start) : ''}${c.room ? ', ' + esc(c.room) : ''}</div>
        ${c.notes ? `<p class="muted" style="white-space:pre-wrap">${esc(c.notes)}</p>` : ''}
        <div class="foot">${btn('Edit', 'edit-class', { id: c.id }, 'small')}</div></article>`).join('')}</div>`
      : empty('No classes yet', 'Add your courses to build your weekly timetable.', btn('Add your first class', 'add-class', {}, 'primary')));
}

function assignRow(a) {
  const at = dueAt(a), done = a.status === 'Done', late = !done && at < new Date();
  return `<div class="row ${done ? 'done' : ''} ${late ? 'late' : ''}" style="--c:${classColor(a.course)}">
    <button class="tick" data-act="toggle-assign" data-id="${a.id}" aria-label="${done ? 'Mark as not done' : 'Mark as done'}">${done ? ICON.check : ''}</button>
    <div class="grow"><div class="t">${esc(a.title)}</div>
      <div class="m">${a.course ? `<span class="pill" style="--c:${classColor(a.course)}">${esc(a.course)}</span>` : ''}<span>${dueText(a)}</span>${a.status === 'In progress' ? '<span class="tag">In progress</span>' : ''}</div></div>
    ${done ? '' : `<span class="rel ${late ? 'bad' : ''}">${rel(at)}</span><span class="prio p-${a.priority}">${a.priority || ''}</span>`}
    <button class="icon-btn" data-act="edit-assign" data-id="${a.id}" aria-label="Edit ${esc(a.title)}">${ICON.edit}</button></div>`;
}

function viewAssignments() {
  let list = state.assignments.slice();
  if (ui.aCourse) list = list.filter(a => a.course === ui.aCourse);
  const open = list.filter(a => a.status !== 'Done').sort(byDue);
  const done = list.filter(a => a.status === 'Done').sort((a, b) => byDue(b, a));
  const now = new Date();
  const groups = [
    ['Overdue', open.filter(a => dueAt(a) < now), 'bad'],
    ['Next 7 days', open.filter(a => dueAt(a) >= now && dueAt(a) <= addDays(now, 7)), ''],
    ['Later', open.filter(a => dueAt(a) > addDays(now, 7)), '']
  ];
  let body = '';
  if (ui.aFilter !== 'done') body += groups.filter(g => g[1].length).map(g => `<h2 class="grp ${g[2]}">${g[0]} <span>${g[1].length}</span></h2><div class="stack">${g[1].map(assignRow).join('')}</div>`).join('');
  if (ui.aFilter !== 'todo' && done.length) body += `<h2 class="grp">Done <span>${done.length}</span></h2><div class="stack">${done.map(assignRow).join('')}</div>`;
  if (!body) body = empty(state.assignments.length ? 'Nothing here' : 'No assignments yet', 'Add an assignment with its due date and it will show up on your dashboard.', btn('Add assignment', 'add-assign', {}, 'primary'));
  const courses = courseNames();
  return pageHead('Assignments', 'Everything due, sorted by deadline. Deadlines set to home time are converted to Barcelona time.', btn(ICON.plus + 'Add assignment', 'add-assign', {}, 'primary')) +
    chips([['all', 'All'], ['todo', 'To do'], ['done', 'Done']], ui.aFilter, 'a-filter') +
    (courses.length ? chips([['', 'All courses'], ...courses.map(c => [c, c])], ui.aCourse, 'a-course') : '') + body;
}

function viewContent() {
  const t = ui.tab.content;
  const acts = t === 'ideas' ? btn(ICON.plus + 'New idea', 'add-idea', {}, 'primary') : btn(ICON.plus + 'New piece', 'add-piece', {}, 'primary');
  let body = '';
  if (t === 'pipeline') {
    body = `<div class="board">${STAGES.map(([st, color], i) => {
      const items = state.content.filter(p => p.stage === st).sort(byDue);
      return `<section class="col" style="--c:${color}"><h3>${st}<span>${items.length}</span></h3>${items.map(p => {
        const finished = ['Submitted', 'Published'].includes(p.stage);
        const at = dueAt(p);
        return `<article class="kcard"><div class="t" data-act="edit-piece" data-id="${p.id}" tabindex="0" role="button">${esc(p.title)}</div>
          <div class="m"><span class="tag">${esc(p.format || '')}</span>${p.due ? `<span class="${!finished && at < new Date() ? 'rel bad' : ''}">${finished ? shortDate(p.due) : rel(at)}</span>` : ''}${p.sendTo ? `<span>to ${esc(p.sendTo)}</span>` : ''}</div>
          <div class="mv"><button class="icon-btn" data-act="move-piece" data-id="${p.id}" data-d="-1" aria-label="Move back" ${i === 0 ? 'disabled style="opacity:.25"' : ''}>${ICON.left}</button>
          <button class="icon-btn" data-act="move-piece" data-id="${p.id}" data-d="1" aria-label="Move forward" ${i === STAGES.length - 1 ? 'disabled style="opacity:.25"' : ''}>${ICON.right}</button></div></article>`;
      }).join('') || '<span class="muted" style="padding:6px">Empty</span>'}</section>`;
    }).join('')}</div>`;
    if (!state.content.length) body = empty('No content pieces yet', 'Add what you owe the program: videos, photo sets, blog posts. Move each one across the board as you work.', btn('Add a piece', 'add-piece', {}, 'primary'));
  } else if (t === 'deliverables') {
    const list = state.content.slice().sort(byDue);
    const todo = list.filter(p => !['Submitted', 'Published'].includes(p.stage));
    body = list.length ? `<p class="muted" style="margin-bottom:12px">${todo.length} still to send${todo[0] && todo[0].due ? `. Next due ${shortDate(todo[0].due)}.` : '.'}</p>
      <div class="scroll-x"><table class="tbl"><thead><tr><th>Deliverable</th><th>Format</th><th>Due</th><th>Send to</th><th>Stage</th><th></th></tr></thead><tbody>
      ${list.map(p => { const fin = ['Submitted', 'Published'].includes(p.stage); const at = dueAt(p); return `<tr><td>${esc(p.title)}</td><td>${esc(p.format || '')}</td>
        <td>${p.due ? `${shortDate(p.due)} <span class="rel ${!fin && at < new Date() ? 'bad' : ''}">${fin ? '' : rel(at)}</span>` : '<span class="muted">No date</span>'}</td><td>${esc(p.sendTo || '')}</td>
        <td><select data-change="set-stage" data-id="${p.id}" aria-label="Stage for ${esc(p.title)}">${STAGES.map(s => `<option ${s[0] === p.stage ? 'selected' : ''}>${s[0]}</option>`).join('')}</select></td>
        <td><button class="icon-btn" data-act="edit-piece" data-id="${p.id}" aria-label="Edit">${ICON.edit}</button></td></tr>`; }).join('')}</tbody></table></div>`
      : empty('No deliverables yet', 'Add each piece of content the program expects, with its due date and who to send it to.', btn('Add a piece', 'add-piece', {}, 'primary'));
  } else {
    const list = state.ideas.filter(i => !ui.ideaTag || i.tag === ui.ideaTag);
    body = chips([['', 'All'], ...IDEA_TAGS.map(x => [x, x])], ui.ideaTag, 'idea-tag') +
      (list.length ? `<div class="grid">${list.map(i => `<article class="card" style="--c:${i.ready ? 'var(--teal)' : 'var(--line)'}"><h3>${esc(i.title)}</h3>
        <div class="m"><span class="tag">${esc(i.tag || '')}</span>${i.ready ? '<span class="tag free">Ready</span>' : ''}</div>
        ${i.notes ? `<p class="muted" style="white-space:pre-wrap">${esc(i.notes)}</p>` : ''}
        <div class="foot">${btn(i.ready ? 'Not ready' : 'Mark ready', 'toggle-idea', { id: i.id }, 'small')}${btn('Make it a piece', 'idea-to-piece', { id: i.id }, 'small primary')}${btn('Edit', 'edit-idea', { id: i.id }, 'small')}</div></article>`).join('')}</div>`
        : empty('No ideas here', 'Jot down anything you might film or write. Journal entries and saved places can turn into ideas too.', btn('Add an idea', 'add-idea', {}, 'primary')));
  }
  return pageHead('Content hub', 'Track what you owe the program and the ideas behind it.', acts) +
    tabs('content', [['pipeline', 'Pipeline'], ['deliverables', 'Deliverables'], ['ideas', `Idea bank (${state.ideas.length})`]]) + body;
}

function viewTravel() {
  const t = ui.tab.travel;
  const acts = t === 'wishlist' ? btn(ICON.plus + 'Add destination', 'add-wish', {}, 'primary') : btn(ICON.plus + 'Add trip', 'add-trip', {}, 'primary');
  let body = '';
  if (t === 'trips') {
    const list = state.trips.slice().sort((a, b) => a.start.localeCompare(b.start));
    body = list.length ? `<div class="grid">${list.map(tr => {
      const n = daysBetween(D(tr.start), D(tr.end));
      const past = tr.end < today();
      const until = daysBetween(new Date(), D(tr.start));
      const pack = tr.packing || [];
      const actual = sum(state.expenses.filter(e => e.trip === tr.id).map(e => e.eur));
      return `<article class="card" style="--c:${past ? 'var(--line)' : 'var(--azure)'}"><h3>${esc(tr.destination)}</h3>
        <div class="m"><span>${shortDate(tr.start)} to ${shortDate(tr.end)}</span><span>${n} night${n === 1 ? '' : 's'}</span>${!past ? `<span class="tag trip">${until > 0 ? `in ${until} days` : 'now'}</span>` : '<span class="tag">Done</span>'}</div>
        ${tr.transport ? `<div class="m">${esc(tr.transport)}${tr.lodging ? ', staying at ' + esc(tr.lodging) : ''}</div>` : ''}
        <div class="m">Packed ${pack.filter(p => p.done).length} of ${pack.length}${tr.budget ? `. Spent ${eur(actual)} of ${eur(tr.budget)}` : actual ? `. Spent ${eur(actual)}` : ''}</div>
        <div class="foot">${btn('Open', 'open-trip', { id: tr.id }, 'small primary')}${btn('Edit', 'edit-trip', { id: tr.id }, 'small')}</div></article>`;
    }).join('')}</div>` : empty('No trips yet', 'Add a weekend away or a break trip with dates, transport and where you are staying.', btn('Add a trip', 'add-trip', {}, 'primary'));
  } else if (t === 'wishlist') {
    body = state.wishlist.length ? `<div class="grid">${state.wishlist.map(w => `<article class="card" style="--c:var(--violet)"><h3>${esc(w.name)}</h3>
      ${w.cost ? `<div class="m">About ${eur(w.cost)}</div>` : ''}${w.notes ? `<p class="muted" style="white-space:pre-wrap">${esc(w.notes)}</p>` : ''}
      <div class="foot">${btn('Plan this trip', 'wish-to-trip', { id: w.id }, 'small primary')}${btn('Edit', 'edit-wish', { id: w.id }, 'small')}</div></article>`).join('')}</div>`
      : empty('Wishlist is empty', 'Save places you want to visit before you have dates for them.', btn('Add a destination', 'add-wish', {}, 'primary'));
  } else {
    const w = weekendList(14);
    body = `<p class="muted" style="margin-bottom:12px">Weekends are marked busy if a deadline falls between Friday and Monday.</p><div class="stack">${w.map(x => {
      let cls = 'free', label = 'Nothing planned';
      if (x.trip) { cls = 'trip'; label = x.trip.destination; }
      else if (x.dl.length) { cls = 'busy'; label = 'Due: ' + x.dl.slice(0, 2).map(d => d.title).join(', '); }
      return `<div class="row"><div class="grow"><div class="t">${shortDate(x.sat)} to ${shortDate(x.sun)}</div><div class="m">${esc(label)}</div></div>
        <span class="tag ${cls}">${cls === 'free' ? 'Free' : cls === 'trip' ? 'Trip' : 'Busy'}</span>
        ${cls === 'free' ? btn('Plan a trip', 'add-trip', { start: iso(x.sat), end: iso(x.sun) }, 'small') : ''}</div>`;
    }).join('') || '<p class="muted">No weekends left in your program dates.</p>'}</div>`;
  }
  return pageHead('Travel', 'Trips, wishlist and which weekends are free.', acts) +
    tabs('travel', [['trips', 'Trips'], ['wishlist', 'Wishlist'], ['weekends', 'Free weekends']]) + body;
}

function openTrip(id) {
  const t = state.trips.find(x => x.id === id);
  if (!t) return;
  const pack = t.packing || [];
  const done = pack.filter(p => p.done).length;
  const actual = sum(state.expenses.filter(e => e.trip === t.id).map(e => e.eur));
  modal(`<div class="mhead"><div><h2>${esc(t.destination)}</h2><p class="muted">${fmtDate(t.start)} to ${fmtDate(t.end)}</p></div>
    <button class="icon-btn" data-act="close-modal" aria-label="Close">${ICON.x}</button></div>
    <dl class="kv">
      <dt>Transport</dt><dd>${esc(t.transport || 'Not set')}</dd>
      <dt>Staying at</dt><dd>${esc(t.lodging || 'Not set')}</dd>
      <dt>Confirmation</dt><dd>${esc(t.confirmation || 'Not set')}</dd>
      <dt>Budget</dt><dd>${t.budget ? `${eur(actual)} spent of ${eur(t.budget)}` : actual ? `${eur(actual)} spent` : 'Not set'}</dd>
    </dl>
    ${t.notes ? `<p class="note" style="margin-top:12px;white-space:pre-wrap">${esc(t.notes)}</p>` : ''}
    <h3>Itinerary</h3>
    <textarea data-change="trip-itin" data-id="${t.id}" rows="6" placeholder="Day 1: arrive, check in, dinner at...&#10;Day 2: ..." aria-label="Itinerary">${esc(t.itinerary || '')}</textarea>
    <h3>Packing list <span class="muted" style="font:600 .85rem var(--font)">${done} of ${pack.length}</span></h3>
    ${pack.map(p => `<div class="pack ${p.done ? 'done' : ''}"><button class="tick" data-act="pack-toggle" data-id="${t.id}" data-p="${p.id}" aria-label="Toggle ${esc(p.text)}">${p.done ? ICON.check : ''}</button><span class="grow">${esc(p.text)}</span>
      <button class="icon-btn" data-act="pack-del" data-id="${t.id}" data-p="${p.id}" aria-label="Remove ${esc(p.text)}">${ICON.x}</button></div>`).join('')}
    <form id="packform" data-id="${t.id}" class="inline-add"><input type="text" name="packtext" placeholder="Add an item" aria-label="New packing item" autocomplete="off"><button class="btn" type="submit">Add</button></form>
    ${pack.length ? '' : `<p style="margin-top:10px">${btn('Add a starter list', 'pack-starter', { id: t.id }, 'small')}</p>`}
    <div class="mfoot">${btn('Edit trip details', 'edit-trip', { id: t.id })}${btn('Done', 'close-modal', {}, 'primary')}</div>`, true);
}

function viewPlaces() {
  let list = state.places.slice();
  if (ui.placeCat) list = list.filter(p => p.category === ui.placeCat);
  if (ui.placeStatus === 'todo') list = list.filter(p => !p.been);
  if (ui.placeStatus === 'been') list = list.filter(p => p.been);
  list.sort((a, b) => (a.been - b.been) || a.name.localeCompare(b.name));
  const used = PLACE_CATS.filter(c => state.places.some(p => p.category === c));
  return pageHead('Food and places', 'Spots to try, sights to see and things you have already checked off.',
    btn('Add starter list', 'starter-places') + btn(ICON.plus + 'Add place', 'add-place', {}, 'primary')) +
    chips([['all', 'All'], ['todo', 'To try'], ['been', 'Been there']], ui.placeStatus, 'p-status') +
    (used.length > 1 ? chips([['', 'Any type'], ...used.map(c => [c, c])], ui.placeCat, 'p-cat') : '') +
    (list.length ? `<div class="grid">${list.map(p => `<article class="card" style="--c:${PLACE_COLORS[p.category] || '#9aa5cc'}"><h3>${esc(p.name)}</h3>
      <div class="m"><span class="pill" style="--c:${PLACE_COLORS[p.category] || '#9aa5cc'}">${esc(p.category)}</span>${p.neighborhood ? `<span>${esc(p.neighborhood)}</span>` : ''}${p.price ? `<span>${esc(p.price)}</span>` : ''}${p.been ? '<span class="tag free">Been</span>' : ''}${p.rating ? `<span style="color:var(--sun)">${'★'.repeat(+p.rating)}</span>` : ''}</div>
      ${p.notes ? `<p class="muted" style="white-space:pre-wrap">${esc(p.notes)}</p>` : ''}
      <div class="foot">${btn(p.been ? 'Not been yet' : 'Mark as been', 'toggle-place', { id: p.id }, 'small')}
      <a class="btn small" href="${p.link ? esc(p.link) : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.name + ' Barcelona')}" target="_blank" rel="noopener">Open map</a>
      ${btn('Content idea', 'place-to-idea', { id: p.id }, 'small')}${btn('Edit', 'edit-place', { id: p.id }, 'small')}</div></article>`).join('')}</div>`
      : empty(state.places.length ? 'No matches' : 'No places saved', 'Save restaurants, cafes and sights you want to visit. Load a starter list of Barcelona classics to get going.', btn('Add starter list', 'starter-places', {}, 'primary')));
}

function viewBudget() {
  const ym = ui.month;
  const ex = state.expenses.filter(e => e.date.startsWith(ym)).sort((a, b) => b.date.localeCompare(a.date));
  const spent = sum(ex.map(e => e.eur));
  const budget = +state.settings.monthlyBudget || 0;
  const left = budget - spent;
  const [y, m] = ym.split('-').map(Number);
  const dim = new Date(y, m, 0).getDate();
  const isCur = ym === today().slice(0, 7);
  const dayNum = isCur ? new Date().getDate() : dim;
  const perDay = isCur && left > 0 ? left / Math.max(1, dim - dayNum + 1) : null;
  const pct = budget ? spent / budget * 100 : 0;
  const cats = EXP_CATS.map(([c, color]) => ({ c, color, v: sum(ex.filter(e => e.category === c).map(e => e.eur)) })).filter(x => x.v > 0).sort((a, b) => b.v - a.v);
  const daily = Array.from({ length: dim }, (_, i) => sum(ex.filter(e => +e.date.slice(8) === i + 1).map(e => e.eur)));
  const maxD = Math.max(...daily, 1);
  const rate = +state.settings.rate || 1;
  return pageHead('Budget and expenses', `Amounts are stored in euros. Home currency: ${esc(state.settings.homeCurrency)} at ${rate} per euro (change in Settings).`, btn(ICON.plus + 'Log expense', 'add-expense', {}, 'primary')) +
    `<div class="mnav" style="margin-bottom:16px"><button class="icon-btn" data-act="month" data-d="-1" aria-label="Previous month">${ICON.left}</button><b>${monthLabel(ym)}</b><button class="icon-btn" data-act="month" data-d="1" aria-label="Next month">${ICON.right}</button></div>
    <div class="stats">
      <div class="stat"><small>Spent</small><span class="big">${eur(spent)}</span><small>${homeMoney(spent)}</small></div>
      <div class="stat"><small>${left >= 0 ? 'Left this month' : 'Over budget by'}</small><span class="big" style="${left < 0 ? 'color:#ff8a93' : ''}">${eur(Math.abs(left))}</span><small>${budget ? `of ${eur(budget)}` : 'No budget set'}</small></div>
      <div class="stat"><small>Daily average</small><span class="big">${eur(spent / Math.max(1, dayNum))}</span><small>${perDay ? `Safe to spend ${eur(perDay)} a day` : `${ex.length} expense${ex.length === 1 ? '' : 's'}`}</small></div>
    </div>
    ${budget ? `<div class="bar ${pct > 100 ? 'over' : pct > 80 ? 'warn' : ''}" style="margin-bottom:22px" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemax="100"><i style="width:${Math.min(100, pct)}%"></i></div>` : ''}
    <div class="panels" style="margin-bottom:24px">
      <section class="panel"><div class="panel-h"><h2>By category</h2></div>
        ${cats.length ? cats.map(x => `<div class="catbar"><span>${x.c}</span><div class="bar"><i style="width:${x.v / spent * 100}%;--c:${x.color}"></i></div><b>${eur(x.v)}</b></div>`).join('') : '<p class="muted">No spending logged this month.</p>'}</section>
      <section class="panel"><div class="panel-h"><h2>By day</h2></div>
        <div class="spark" role="img" aria-label="Daily spending bars">${daily.map((v, i) => `<i class="${v ? '' : 'z'}" style="height:${v ? Math.max(6, v / maxD * 100) : 3}%" title="${shortDate(`${ym}-${pad(i + 1)}`)}: ${eur(v)}"></i>`).join('')}</div>
        <div class="muted" style="display:flex;justify-content:space-between;font-size:.8rem"><span>1</span><span>${dim}</span></div>
        <div class="conv"><input type="number" id="conv-in" step="0.01" placeholder="Amount" aria-label="Amount to convert"><select id="conv-dir" aria-label="Direction"><option value="eh">EUR to ${esc(state.settings.homeCurrency)}</option><option value="he">${esc(state.settings.homeCurrency)} to EUR</option></select><b id="conv-out" class="muted">Quick converter</b></div></section>
    </div>
    <h2 class="grp">Expenses <span>${ex.length}</span></h2>
    ${ex.length ? `<div class="stack">${ex.map(e => `<div class="row" style="--c:${(EXP_CATS.find(c => c[0] === e.category) || [0, '#9aa5cc'])[1]}">
      <div class="grow"><div class="t">${esc(e.note || e.category)}</div><div class="m"><span>${fmtDate(e.date)}</span><span class="pill" style="--c:${(EXP_CATS.find(c => c[0] === e.category) || [0, '#9aa5cc'])[1]}">${esc(e.category)}</span>${e.trip && state.trips.find(t => t.id === e.trip) ? `<span>${esc(state.trips.find(t => t.id === e.trip).destination)}</span>` : ''}</div></div>
      <div style="text-align:right"><b>${eur(e.eur)}</b><div class="m" style="justify-content:flex-end">${homeMoney(e.eur)}</div></div>
      <button class="icon-btn" data-act="edit-expense" data-id="${e.id}" aria-label="Edit expense">${ICON.edit}</button></div>`).join('')}</div>`
      : empty('No expenses this month', 'Log what you spend and see where the money goes.', btn('Log an expense', 'add-expense', {}, 'primary'))}`;
}

function viewJournal() {
  const list = state.journal.slice().sort((a, b) => b.date.localeCompare(a.date));
  const prompt = PROMPTS[Math.floor(new Date() / 864e5) % PROMPTS.length];
  return pageHead('Journal', `${streak() ? `${streak()} day streak. ` : ''}${list.length} entr${list.length === 1 ? 'y' : 'ies'} so far.`, btn(ICON.plus + 'New entry', 'add-journal', {}, 'primary')) +
    `<div class="prompt"><p>${esc(prompt)}</p>${btn('Write about it', 'add-journal', {}, 'primary')}</div>` +
    (list.length ? `<div class="stack">${list.map(j => `<article class="entry"><header><span class="mood" aria-label="Mood">${esc(j.mood || '')}</span><div class="grow"><b>${fmtDate(j.date)}</b></div>
      <button class="icon-btn" data-act="edit-journal" data-id="${j.id}" aria-label="Edit entry">${ICON.edit}</button></header>
      ${j.best ? `<div class="best">${esc(j.best)}</div>` : ''}${j.text ? `<div class="body">${esc(j.text)}</div>` : ''}
      ${j.phrase ? `<div class="phrase">New phrase: ${esc(j.phrase)}</div>` : ''}
      <div>${btn('Save as content idea', 'journal-to-idea', { id: j.id }, 'small')}</div></article>`).join('')}</div>`
      : empty('Your journal is empty', 'Write a few lines each day. They make great raw material for your content later.', btn('Write your first entry', 'add-journal', {}, 'primary')));
}

function viewSettings() {
  const s = state.settings;
  const input = (name, label, type = 'text', extra = '') => `<div class="f"><label class="lbl" for="s_${name}">${label}</label><input id="s_${name}" name="${name}" type="${type}" value="${esc(s[name])}" ${extra}></div>`;
  return pageHead('Settings', 'Program dates, money and your data.') +
    `<form id="settings-form"><section class="set-sec"><h2>Your semester</h2><div class="fgrid">
      ${input('name', 'Your name')}<div></div>
      ${input('start', 'Program start', 'date')}${input('end', 'Program end', 'date')}
    </div></section>
    <section class="set-sec"><h2>Money</h2><div class="fgrid">
      ${input('monthlyBudget', 'Monthly budget (EUR)', 'number', 'step="1" min="0"')}${input('homeCurrency', 'Home currency code', 'text', 'maxlength="3" placeholder="USD"')}
      ${input('rate', 'Exchange rate: home currency per 1 EUR', 'number', 'step="0.0001" min="0"')}<div class="note">Check the current rate and update this now and then. Past expenses keep the rate they were saved with.</div>
    </div></section>
    <section class="set-sec"><h2>Time zones</h2><div class="fgrid">
      ${input('homeLabel', 'Name for home time (shown on deadlines)')}${input('homeOffset', 'Hours Barcelona is ahead of home', 'number', 'step="0.5"')}
      <div class="note full" style="grid-column:1/-1">Barcelona is usually 6 hours ahead of the US East Coast, but it can be 5 for a few weeks in March and October when the clocks change on different dates.</div>
    </div></section>
    <div class="acts" style="margin-bottom:28px"><button class="btn primary" type="submit">Save settings</button></div></form>
    <section class="set-sec"><h2>Your data</h2>
      <p class="muted">Everything is saved in this browser only. Export a backup now and then, and use import to move your data between your phone and laptop.</p>
      <div class="acts">${btn('Export backup (JSON)', 'export-json')}<label class="btn" tabindex="0">Import backup<input type="file" accept="application/json" id="import-file" hidden></label>${btn('Export to calendar (.ics)', 'export-ics')}${btn('Erase everything', 'reset-all', {}, 'danger')}</div>
      <p class="note" style="margin-top:14px">If this repo is public, never commit passport numbers, booking codes or other private details to it. Keep them in the app, where they stay on your device.</p>
    </section>`;
}

/* =====================================================================
   Router and render
   ===================================================================== */
const ROUTES = {
  dashboard: { label: 'Home', icon: ICON.home, view: viewDashboard },
  schedule: { label: 'Classes', icon: ICON.cal, view: viewSchedule },
  assignments: { label: 'Assignments', icon: ICON.tasks, view: viewAssignments },
  content: { label: 'Content', icon: ICON.film, view: viewContent },
  travel: { label: 'Travel', icon: ICON.plane, view: viewTravel },
  places: { label: 'Places', icon: ICON.pin, view: viewPlaces },
  budget: { label: 'Budget', icon: ICON.euro, view: viewBudget },
  journal: { label: 'Journal', icon: ICON.book, view: viewJournal },
  settings: { label: 'Settings', icon: ICON.gear, view: viewSettings }
};
const route = () => { const r = (location.hash || '#dashboard').slice(1); return ROUTES[r] ? r : 'dashboard'; };

function render() {
  const cur = route();
  $('#nav').innerHTML = `<a class="brand" href="#dashboard">${LOGO}<span><b>Semestre</b><small>Barcelona</small></span></a>
    <div class="links">${Object.entries(ROUTES).map(([k, r]) => `<a href="#${k}" class="${k === cur ? 'on' : ''}" ${k === cur ? 'aria-current="page"' : ''}>${r.icon}<span>${r.label}</span></a>`).join('')}</div>`;
  $('#main').innerHTML = ROUTES[cur].view();
  document.title = (cur === 'dashboard' ? '' : ROUTES[cur].label + ' | ') + 'Semestre a Barcelona';
}

/* =====================================================================
   Actions
   ===================================================================== */
const find = (coll, id) => state[coll].find(x => x.id === id);

const actions = {
  'close-modal': closeModal,
  'form-delete': () => { const c = formCtx; if (c && c.onDelete) { if (c.onDelete() !== false) closeModal(); } },
  tab: d => { ui.tab[d.g] = d.v; render(); },
  month: d => { ui.month = shiftMonth(ui.month, +d.d); render(); },

  'add-class': () => editClass(), 'edit-class': d => editClass(d.id),

  'add-assign': () => editAssign(), 'edit-assign': d => editAssign(d.id),
  'toggle-assign': d => { const a = find('assignments', d.id); if (a) { a.status = a.status === 'Done' ? 'To do' : 'Done'; save(); render(); } },
  'a-filter': d => { ui.aFilter = d.v; render(); },
  'a-course': d => { ui.aCourse = d.v; render(); },

  'add-piece': () => editPiece(), 'edit-piece': d => editPiece(d.id),
  'move-piece': d => {
    const p = find('content', d.id); if (!p) return;
    const names = STAGES.map(s => s[0]);
    const i = Math.min(names.length - 1, Math.max(0, names.indexOf(p.stage) + (+d.d)));
    p.stage = names[i]; save(); render();
  },
  'add-idea': () => editIdea(), 'edit-idea': d => editIdea(d.id),
  'idea-tag': d => { ui.ideaTag = d.v; render(); },
  'toggle-idea': d => { const i = find('ideas', d.id); if (i) { i.ready = !i.ready; save(); render(); } },
  'idea-to-piece': d => {
    const i = find('ideas', d.id); if (!i) return;
    const id = uid();
    state.ideas = state.ideas.filter(x => x.id !== i.id);
    state.content.push({ id, title: i.title, format: 'Video', stage: 'Idea', tags: (i.tag || '').toLowerCase(), notes: i.notes || '' });
    save(); ui.tab.content = 'pipeline'; render(); editPiece(id);
  },

  'add-trip': d => editTrip(null, d.start ? { start: d.start, end: d.end } : undefined), 'edit-trip': d => editTrip(d.id),
  'open-trip': d => openTrip(d.id),
  'add-wish': () => editWish(), 'edit-wish': d => editWish(d.id),
  'wish-to-trip': d => { const w = find('wishlist', d.id); if (w) editTrip(null, { destination: w.name, budget: w.cost || '', notes: w.notes || '' }); },
  'pack-toggle': d => { const t = find('trips', d.id); const p = t && (t.packing || []).find(x => x.id === d.p); if (p) { p.done = !p.done; save(); render(); openTrip(d.id); } },
  'pack-del': d => { const t = find('trips', d.id); if (t) { t.packing = (t.packing || []).filter(x => x.id !== d.p); save(); render(); openTrip(d.id); } },
  'pack-starter': d => { const t = find('trips', d.id); if (t) { t.packing = PACK_STARTER.map(text => ({ id: uid(), text, done: false })); save(); render(); openTrip(d.id); } },

  'add-place': () => editPlace(), 'edit-place': d => editPlace(d.id),
  'toggle-place': d => { const p = find('places', d.id); if (p) { p.been = !p.been; save(); render(); } },
  'p-status': d => { ui.placeStatus = d.v; render(); },
  'p-cat': d => { ui.placeCat = d.v; render(); },
  'starter-places': () => {
    const have = new Set(state.places.map(p => p.name));
    const add = STARTER_PLACES.filter(p => !have.has(p[0])).map(([name, category, neighborhood, price, notes]) => ({ id: uid(), name, category, neighborhood, price, notes, been: false }));
    state.places.push(...add); save(); render(); toast(add.length ? `Added ${add.length} places. Check opening hours before you go.` : 'Starter places are already on your list');
  },
  'place-to-idea': d => {
    const p = find('places', d.id); if (!p) return;
    state.ideas.push({ id: uid(), title: `Feature: ${p.name}`, tag: FOOD_CATS.includes(p.category) ? 'Food' : p.category === 'Sight' || p.category === 'Outdoors' ? 'Travel' : 'Culture', notes: [p.neighborhood, p.notes].filter(Boolean).join('. '), ready: false });
    save(); render(); toast('Added to your idea bank');
  },

  'add-expense': () => editExpense(), 'edit-expense': d => editExpense(d.id),
  'add-journal': () => editJournal(), 'edit-journal': d => editJournal(d.id),
  'journal-to-idea': d => {
    const j = find('journal', d.id); if (!j) return;
    state.ideas.push({ id: uid(), title: j.best || `Idea from ${shortDate(j.date)}`, tag: 'Daily life', notes: (j.text || '').slice(0, 300), ready: false });
    save(); render(); toast('Added to your idea bank');
  },

  'export-json': () => download(`barcelona-hub-backup-${today()}.json`, JSON.stringify(state, null, 2), 'application/json'),
  'export-ics': exportICS,
  'reset-all': () => {
    if (confirm('Erase all your data from this browser? Export a backup first if you want to keep it.') && confirm('This cannot be undone. Erase everything?')) {
      state = clone(DEFAULT_STATE); save(); render(); toast('All data erased');
    }
  }
};

const changes = {
  'set-stage': el => { const p = find('content', el.dataset.id); if (p) { p.stage = el.value; save(); render(); } },
  'trip-itin': el => { const t = find('trips', el.dataset.id); if (t) { t.itinerary = el.value; save(); } }
};

document.addEventListener('click', e => {
  if (e.target.classList && e.target.classList.contains('overlay')) { closeModal(); return; }
  const el = e.target.closest('[data-act]');
  if (el && !el.disabled && actions[el.dataset.act]) actions[el.dataset.act](el.dataset, el, e);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#modal-root').firstChild) closeModal();
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[role=button][data-act]')) { e.preventDefault(); e.target.click(); }
});
document.addEventListener('change', e => {
  const el = e.target.closest('[data-change]');
  if (el && changes[el.dataset.change]) changes[el.dataset.change](el);
  if (e.target.id === 'import-file') importJSON(e.target);
});
document.addEventListener('input', e => {
  if (e.target.id === 'conv-in' || e.target.id === 'conv-dir') {
    const v = parseFloat($('#conv-in').value), rate = +state.settings.rate || 1, dir = $('#conv-dir').value;
    $('#conv-out').textContent = isNaN(v) ? 'Quick converter' : dir === 'eh' ? fmtMoney(v * rate, state.settings.homeCurrency || 'USD') : eur(v / rate);
  }
});
document.addEventListener('submit', e => {
  const f = e.target;
  if (f.id === 'mform') {
    e.preventDefault();
    const ctx = formCtx; if (!ctx) return;
    const vals = collect(f, ctx.fields);
    closeModal();
    ctx.onSave(vals);
  } else if (f.id === 'packform') {
    e.preventDefault();
    const text = f.elements.packtext.value.trim(), t = find('trips', f.dataset.id);
    if (t && text) { (t.packing = t.packing || []).push({ id: uid(), text, done: false }); save(); render(); openTrip(t.id); const i = $('#packform input'); if (i) i.focus(); }
  } else if (f.id === 'settings-form') {
    e.preventDefault();
    const fd = new FormData(f), s = state.settings;
    s.name = fd.get('name').trim(); s.start = fd.get('start'); s.end = fd.get('end');
    s.monthlyBudget = parseFloat(fd.get('monthlyBudget')) || 0;
    s.homeCurrency = (fd.get('homeCurrency') || 'USD').trim().toUpperCase() || 'USD';
    s.rate = parseFloat(fd.get('rate')) || 1;
    s.homeLabel = fd.get('homeLabel').trim() || 'Home';
    s.homeOffset = parseFloat(fd.get('homeOffset')) || 0;
    save(); render(); toast('Settings saved');
  }
});
window.addEventListener('hashchange', () => { closeModal(); render(); window.scrollTo(0, 0); });

/* =====================================================================
   Export, import, calendar
   ===================================================================== */
function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function importJSON(input) {
  const file = input.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(r.result);
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('bad');
      if (!confirm('Replace everything in this browser with the backup?')) return;
      state = normalize(data); save(); render(); toast('Backup imported');
    } catch (e) { toast('That file is not a valid backup'); }
    input.value = '';
  };
  r.readAsText(file);
}

function exportICS() {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const f = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const fd = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const t = s => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Barcelona Hub//EN', 'CALSCALE:GREGORIAN'];
  upcomingItems().forEach(x => {
    L.push('BEGIN:VEVENT', `UID:${x.id}@barcelona-hub`, `DTSTAMP:${stamp}Z`, `DTSTART:${f(x.at)}`, `DTEND:${f(new Date(x.at.getTime() + 30 * 6e4))}`, `SUMMARY:${t(x.kind + ' due: ' + x.title)}`, 'END:VEVENT');
  });
  state.trips.forEach(tr => {
    if (!tr.start || !tr.end) return;
    L.push('BEGIN:VEVENT', `UID:${tr.id}@barcelona-hub`, `DTSTAMP:${stamp}Z`, `DTSTART;VALUE=DATE:${fd(D(tr.start))}`, `DTEND;VALUE=DATE:${fd(addDays(D(tr.end), 1))}`, `SUMMARY:${t('Trip: ' + tr.destination)}`, 'END:VEVENT');
  });
  const st = parseD(state.settings.start), en = parseD(state.settings.end);
  const BY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  if (st && en) {
    state.classes.forEach(c => {
      if (!c.start || !c.end) return;
      (c.days || []).forEach(n => {
        const first = new Date(st);
        while (first.getDay() !== n) first.setDate(first.getDate() + 1);
        if (first > en) return;
        const [sh, sm] = c.start.split(':').map(Number), [eh, em] = c.end.split(':').map(Number);
        const a = new Date(first.getFullYear(), first.getMonth(), first.getDate(), sh, sm);
        const b = new Date(first.getFullYear(), first.getMonth(), first.getDate(), eh, em);
        L.push('BEGIN:VEVENT', `UID:${c.id}-${n}@barcelona-hub`, `DTSTAMP:${stamp}Z`, `DTSTART:${f(a)}`, `DTEND:${f(b)}`,
          `RRULE:FREQ=WEEKLY;BYDAY=${BY[n]};UNTIL=${fd(en)}T235959`, `SUMMARY:${t(c.course)}`, c.room ? `LOCATION:${t(c.room)}` : '', 'END:VEVENT');
      });
    });
  }
  L.push('END:VCALENDAR');
  download('barcelona-hub.ics', L.filter(Boolean).join('\r\n'), 'text/calendar');
  toast('Calendar file downloaded');
}

/* =====================================================================
   Start
   ===================================================================== */
render();
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
})();
