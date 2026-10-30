/* CTRL + ALT + COMPETE — teacher-hosted classroom review game.
   All content comes from questions.json (or the bundled questions.js copy). */
(() => {
'use strict';

/* ================= utilities ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmt = n => (n < 0 ? '−' : '') + Math.abs(Math.round(n)).toLocaleString('en-US');
const signed = n => (n > 0 ? '+' : n < 0 ? '−' : '±') + Math.abs(n).toLocaleString('en-US');
const LETTERS = 'ABCDEF';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round50 = v => Math.round(v / 50) * 50;

const store = {
  get(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* storage blocked */ } }
};
const session = {
  get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
};
const LS_GAME = 'cac.game.v1', LS_CONTENT = 'cac.gameContent.v1', LS_CUSTOM = 'cac.customQuestions.v1', LS_PREFS = 'cac.prefs.v1';

const TEAM_NAMES = ['Team Router', 'Team Byte', 'Team Pixel', 'Team Packet', 'Team Kernel', 'Team Cache'];
const TEAM_COLORS = ['#5EEAD4', '#E8B048', '#FF7A6B', '#A78BFA', '#A3E635', '#38BDF8'];

function hexRgb(hex) {
  const m = String(hex).replace('#', '');
  const h = m.length === 3 ? m.split('').map(c => c + c).join('') : m.padEnd(6, '0');
  return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) || 0);
}
function rgba(hex, a) { const [r, g, b] = hexRgb(hex); return `rgba(${r},${g},${b},${a})`; }
function inkFor(hex) {
  const [r, g, b] = hexRgb(hex).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 0.28 ? '#06101F' : '#FFFFFF';
}
function teamVars(t) { return `--tc:${t.color};--tc-ink:${inkFor(t.color)};--tc-glow:${rgba(t.color, .45)};--tc-dark:${rgba(t.color, .35)}`; }

const I = {
  vol: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
  mute: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6M16 9l6 6"/>',
  full: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  play: '<path d="M7 4v16l13-8z"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  swap: '<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  flag: '<path d="M4 22V4"/><path d="M4 4h13l-2 4 2 4H4"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  bulb: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>',
  arrow: '<path d="M5 12h14M13 5l7 7-7 7"/>',
  back: '<path d="M19 12H5M11 19l-7-7 7-7"/>',
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  hands: '<path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
  bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>'
};
const icon = n => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;

/* ================= sound (Web Audio, generated) ================= */
const Snd = {
  ctx: null, master: null, loopTimer: null,
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  tone(freq, at, dur, type = 'sine', vol = 0.14, slideTo = null) {
    if (!prefs.sound) return;
    const c = this.ensure(); if (!c) return;
    const t0 = c.currentTime + at;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.master); o.start(t0); o.stop(t0 + dur + 0.05);
  },
  select() { this.tone(520, 0, .09, 'triangle', .12); this.tone(880, .07, .14, 'triangle', .12); },
  click() { this.tone(700, 0, .05, 'triangle', .06); },
  correct() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, i * .085, .38, 'sine', .16)); this.tone(1567.98, .34, .5, 'sine', .05); },
  wrong() { this.tone(233, 0, .22, 'triangle', .16); this.tone(185, .18, .38, 'triangle', .16); },
  tick() { this.tone(1320, 0, .045, 'square', .035); },
  timeUp() { this.tone(392, 0, .16, 'triangle', .14); this.tone(330, .14, .16, 'triangle', .14); this.tone(262, .28, .36, 'triangle', .14); },
  alarm() { for (let i = 0; i < 3; i++) { this.tone(440, i * .42, .38, 'sawtooth', .07, 880); this.tone(220, i * .42, .38, 'square', .03, 440); } },
  whoosh() { this.tone(180, 0, .35, 'sine', .08, 900); },
  fanfare() {
    const n = [[392, 0], [523.25, .14], [659.25, .28], [783.99, .42], [659.25, .62], [783.99, .74], [1046.5, .9]];
    n.forEach(([f, t], i) => { this.tone(f, t, i === n.length - 1 ? 1.1 : .22, 'triangle', .14); this.tone(f / 2, t, .22, 'sine', .06); });
  },
  startLoop() {
    this.stopLoop();
    if (!prefs.sound) return;
    // original "thinking" pattern: soft arpeggio + pulse, loops every 2s
    const pat = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];
    let step = 0;
    const play = () => {
      if (!prefs.sound) return;
      const f = pat[step % pat.length];
      this.tone(f, 0, .22, 'sine', .07);
      if (step % 4 === 0) this.tone(f / 2, 0, .35, 'triangle', .06);
      step++;
    };
    play(); this.loopTimer = setInterval(play, 250);
  },
  stopLoop() { clearInterval(this.loopTimer); this.loopTimer = null; }
};

/* ================= speech ================= */
function speak(text) {
  try {
    if (!('speechSynthesis' in window)) return toast('Read-aloud is not supported in this browser');
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95; u.lang = 'en-US';
    speechSynthesis.speak(u);
  } catch (e) { /* ignore */ }
}
function stopSpeech() { try { speechSynthesis.cancel(); } catch (e) { /* ignore */ } }

/* ================= content ================= */
let content = null;          // active question set
let contentSource = 'default';
let loadErrors = null;

function validate(d) {
  const E = [];
  const err = (where, msg) => E.push({ where, msg });
  if (!d || typeof d !== 'object' || Array.isArray(d)) { err('file', 'The file is not a JSON object.'); return E; }
  if (!d.game || !d.game.title) err('game', 'Missing game.title.');
  if (!Array.isArray(d.rounds) || !d.rounds.length) { err('rounds', 'Missing rounds[] (need at least one round).'); return E; }
  const ids = new Set(), catIds = new Set();
  const checkQ = (q, id) => {
    if (!q || typeof q !== 'object') return err(id, 'is not a question object.');
    if (q.id) { if (ids.has(q.id)) err(q.id, 'id is used more than once.'); ids.add(q.id); }
    if (!['mc', 'tf', 'order', 'short'].includes(q.type)) return err(id, `type must be mc, tf, order, or short (found "${q.type}").`);
    if (!q.prompt || typeof q.prompt !== 'string') err(id, 'is missing its prompt.');
    if (q.type === 'mc') {
      if (!Array.isArray(q.choices) || q.choices.length < 2 || q.choices.length > 6) err(id, 'multiple choice needs 2 to 6 choices.');
      else if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex >= q.choices.length) err(id, `answerIndex must point at one of the choices (0 to ${q.choices.length - 1}).`);
    }
    if (q.type === 'tf' && typeof q.answer !== 'boolean') err(id, 'true/false answer must be true or false (no quotes).');
    if (q.type === 'order' && (!Array.isArray(q.items) || q.items.length < 2)) err(id, 'order questions need at least 2 items.');
    if (q.type === 'short' && (q.answer == null || q.answer === '')) err(id, 'short answer is missing its answer.');
    if (q.accept != null && !Array.isArray(q.accept)) err(id, 'accept must be a list.');
  };
  d.rounds.forEach((r, ri) => {
    const rid = r && r.id || `rounds[${ri}]`;
    if (!r || typeof r !== 'object') return err(rid, 'round is not an object.');
    if (!r.id) err(rid, 'round is missing an id.');
    if (!r.name) err(rid, 'round is missing a name.');
    const okVals = Array.isArray(r.values) && r.values.length && r.values.every(v => typeof v === 'number');
    if (!okVals) err(rid, 'values must be a list of numbers, like [100, 200, 300, 400, 500].');
    if (!Array.isArray(r.categories) || !r.categories.length) return err(rid, 'needs a categories list.');
    if (r.categories.length > 6) err(rid, 'has more than 6 categories (the board fits 6).');
    r.categories.forEach((c, ci) => {
      const cid = c && c.id || `${rid} category ${ci + 1}`;
      if (!c || typeof c !== 'object') return err(cid, 'category is not an object.');
      if (!c.id) err(cid, 'category is missing an id.'); else catIds.add(c.id);
      if (!c.name) err(cid, 'category is missing a name.');
      if (!Array.isArray(c.questions)) return err(cid, 'needs a questions list.');
      if (okVals && c.questions.length !== r.values.length) err(cid, `has ${c.questions.length} questions but round ${rid} has ${r.values.length} values.`);
      c.questions.forEach((q, qi) => checkQ(q, (q && q.id) || `${cid} question ${qi + 1}`));
    });
  });
  if (d.final) {
    if (!d.final.primary) err('final', 'final is missing its primary question.');
    else checkQ(d.final.primary, d.final.primary.id || 'final.primary');
    (d.final.backups || []).forEach((q, i) => checkQ(q, (q && q.id) || `final.backups[${i}]`));
  }
  (d.tiebreakers || []).forEach((t, i) => {
    const id = t && t.id || `tiebreakers[${i}]`;
    if (!t || !t.prompt) err(id, 'tiebreaker is missing its prompt.');
    if (t && !['fastest', 'closest'].includes(t.mode)) err(id, 'mode must be "fastest" or "closest".');
    if (t && (t.answer == null || t.answer === '')) err(id, 'tiebreaker is missing its answer.');
  });
  (d.spares || []).forEach((s, i) => {
    const id = `spare ${i + 1}${s && s.categoryId ? ' (' + s.categoryId + ')' : ''}`;
    if (s && !catIds.has(s.categoryId)) err(id, `categoryId "${s && s.categoryId}" does not match any category.`);
    checkQ(s, s && s.id || id);
  });
  return E;
}

async function loadContent() {
  const custom = store.get(LS_CUSTOM);
  if (custom && !validate(custom).length) { content = custom; contentSource = 'imported'; return; }
  let data = null, parseError = null;
  try {
    const r = await fetch('questions.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const text = await r.text();
    try { data = JSON.parse(text); } catch (e) { parseError = e.message; }
  } catch (e) {
    data = window.QUESTIONS_FALLBACK || null; // opened from disk: use bundled copy
  }
  if (parseError) { loadErrors = [{ where: 'questions.json', msg: 'is not valid JSON: ' + parseError }]; return; }
  if (!data) { loadErrors = [{ where: 'questions.json', msg: 'could not be loaded and no bundled copy was found.' }]; return; }
  const errs = validate(data);
  if (errs.length) { loadErrors = errs; return; }
  content = data; contentSource = 'default';
}

const getRound = id => content.rounds.find(r => r.id === id);
function findCat(id) {
  for (let ri = 0; ri < content.rounds.length; ri++) {
    const ci = content.rounds[ri].categories.findIndex(c => c.id === id);
    if (ci > -1) return { ri, ci, round: content.rounds[ri], cat: content.rounds[ri].categories[ci] };
  }
  return null;
}
function answerText(q) {
  if (q.type === 'mc') return `${LETTERS[q.answerIndex]}) ${q.choices[q.answerIndex]}`;
  if (q.type === 'tf') return q.answer ? 'True' : 'False';
  if (q.type === 'order') return q.answer || q.items.join(' → ');
  return String(q.answer);
}
function speakText(q) {
  let t = q.prompt;
  if (q.type === 'mc') t += '. ' + q.choices.map((c, i) => `${LETTERS[i]}: ${c}`).join('. ');
  if (q.type === 'tf') t += '. True, or false?';
  return t;
}

/* ================= prefs + setup draft ================= */
const prefs = Object.assign({ sound: true }, store.get(LS_PREFS) || {});
function savePrefs() { store.set(LS_PREFS, prefs); }

function defaultSettings() {
  const d = content.defaults || {};
  return {
    answerTimer: d.answerTimerSeconds ?? 30,
    stealTimer: d.stealTimerSeconds ?? 15,
    finalTimer: d.finalTimerSeconds ?? 60,
    stealMult: d.stealValueMultiplier ?? 0.5,
    penalty: !!d.wrongAnswerPenalty,
    turnOrder: d.turnOrder === 'classic' ? 'classic' : 'rotate',
    readAloud: true,
    lowCap: d.lowScoreWagerCap ?? 500
  };
}
const teamsMin = () => clamp((content.defaults || {}).teamsMin ?? 2, 1, 6);
const teamsMax = () => clamp((content.defaults || {}).teamsMax ?? 6, 2, 6);
function getSetup() {
  let su = prefs.setup;
  if (!su || !Array.isArray(su.teams)) su = { count: 4, mode: 'full', customCats: [] };
  su.teams = TEAM_NAMES.map((n, i) => Object.assign({ name: n, color: TEAM_COLORS[i] }, (su.teams || [])[i] || {}));
  su.count = clamp(su.count || 4, teamsMin(), teamsMax());
  su.settings = Object.assign(defaultSettings(), su.settings || {});
  su.customCats = (su.customCats || []).filter(id => findCat(id));
  const modes = modeList().map(m => m.id);
  if (!modes.includes(su.mode)) su.mode = 'full';
  prefs.setup = su;
  return su;
}
function modeList() {
  const rs = content.rounds;
  const list = [{ id: 'full', name: 'Full Game', desc: rs.map(r => r.name).join(' → ') + (content.final ? ' → ' + (content.final.name || 'Final') : ''), meta: `${rs.reduce((a, r) => a + r.categories.length * r.values.length, 0)} tiles · best over two class days` }];
  if (rs.length > 1) rs.forEach((r, i) => list.push({ id: 'round:' + r.id, name: `${(r.unit || 'Round ' + (i + 1)).split(':')[0]} Only`, desc: `${r.name}${content.final ? ' → ' + (content.final.name || 'Final') : ''}`, meta: `${r.categories.length * r.values.length} tiles · fits one class period` }));
  list.push({ id: 'custom', name: 'Custom Board', desc: 'Pick 4 to 6 categories from any round', meta: 'Each column keeps its round’s point values' });
  return list;
}

/* ================= game state ================= */
let S = null;                                    // persisted game state
const ui = { view: 'loading', anim: new Set(), modal: null, peek: false, editingScore: null, flipping: false };

function save() {
  if (!S) return;
  if (!store.set(LS_GAME, S) && !ui.warnedStorage) { ui.warnedStorage = true; toast('Saving is blocked in this browser. The game still works, but a refresh will lose it.'); }
}
function hasSavedGame() { const g = store.get(LS_GAME); return !!(g && g.v === 1 && g.screen && store.get(LS_CONTENT)); }

function newGame(su) {
  const teams = su.teams.slice(0, su.count).map((t, i) => ({ name: (t.name || '').trim() || TEAM_NAMES[i], color: t.color || TEAM_COLORS[i], score: 0 }));
  const stages = [];
  if (su.mode === 'custom') stages.push({ custom: true, catIds: su.customCats.slice() });
  else if (su.mode.startsWith('round:')) stages.push({ roundId: su.mode.slice(6) });
  else content.rounds.forEach(r => stages.push({ roundId: r.id }));
  if (content.final && content.final.primary) stages.push({ final: true });
  S = { v: 1, settings: clone(su.settings), teams, mode: su.mode, stages, stageIdx: 0, board: null, turn: 0, cur: null, timer: null, final: null, sudden: null, paused: false, tieWinner: null, usedSpares: [], hist: [], screen: 'intro' };
  store.set(LS_CONTENT, content);
  enterStage(0);
}

function buildBoard(stage) {
  let cols, label, name, unit, specials;
  if (stage.custom) {
    const found = stage.catIds.map(findCat).filter(Boolean);
    cols = found.map(f => ({ ri: f.ri, ci: f.ci, name: f.cat.name, blurb: f.cat.blurb || '', values: f.round.values }));
    const rounds = [...new Set(found.map(f => f.round))];
    label = 'CUSTOM'; name = 'CUSTOM BOARD'; unit = rounds.map(r => r.unit || r.name).join(' + ');
    specials = {
      systemOverride: Math.max(0, ...rounds.map(r => (r.specialTiles || {}).systemOverride || 0)),
      allHands: Math.max(0, ...rounds.map(r => (r.specialTiles || {}).allHands || 0)),
      excludeLowestRow: rounds.some(r => (r.specialTiles || {}).excludeLowestRow !== false)
    };
  } else {
    const ri = content.rounds.findIndex(r => r.id === stage.roundId), r = content.rounds[ri];
    cols = r.categories.map((c, ci) => ({ ri, ci, name: c.name, blurb: c.blurb || '', values: r.values }));
    const n = S.stages.filter(s => !s.final).indexOf(stage) + 1;
    label = 'ROUND ' + n; name = r.name; unit = r.unit || '';
    specials = Object.assign({ systemOverride: 0, allHands: 0, excludeLowestRow: true }, r.specialTiles || {});
  }
  const rows = Math.max(...cols.map(c => c.values.length));
  const tiles = cols.map(c => c.values.map((v, qi) => ({ ri: c.ri, ci: c.ci, qi, value: v, used: false, winners: [], special: null, spare: null })));
  const spots = [];
  tiles.forEach((col, x) => col.forEach((t, y) => { if (!(specials.excludeLowestRow && y === 0)) spots.push([x, y]); }));
  const picks = shuffle(spots);
  for (let i = 0; i < specials.systemOverride && picks.length; i++) { const [x, y] = picks.shift(); tiles[x][y].special = 'override'; }
  for (let i = 0; i < specials.allHands && picks.length; i++) { const [x, y] = picks.shift(); tiles[x][y].special = 'allhands'; }
  return { label, name, unit, cols, rows, tiles, specials: { override: specials.systemOverride, allHands: specials.allHands } };
}

function enterStage(i) {
  S.stageIdx = i; S.cur = null; S.timer = null;
  const st = S.stages[i];
  if (!st) return finishGame();
  if (st.final) { S.board = null; S.final = { phase: 'category', choice: 0, wagers: S.teams.map(() => ''), marks: S.teams.map(() => null), order: [], shown: 0, before: [] }; }
  else S.board = buildBoard(st);
  S.screen = 'intro';
}

function getQ(t) {
  if (t.spare != null) return content.spares[t.spare];
  return content.rounds[t.ri].categories[t.ci].questions[t.qi];
}
const curTile = () => S.cur && S.board.tiles[S.cur.col][S.cur.row];
const curQ = () => getQ(curTile());

function snap() {
  const { hist, ...rest } = S;
  S.hist.push(clone(rest));
  if (S.hist.length > 40) S.hist.shift();
}
function undo() {
  const prev = S && S.hist.pop();
  if (!prev) return toast('Nothing to undo');
  const hist = S.hist;
  S = prev; S.hist = hist;
  if (S.timer) S.timer.running = false;
  Snd.stopLoop(); stopSpeech();
  ui.anim.add('undo');
  render(); save(); toast('Undid last action');
}
function award(i, pts) {
  if (!S.teams[i] || !pts) return;
  S.teams[i].score += pts;
  ui.anim.add('score' + i);
}

/* ---------- timer ---------- */
function startTimer(sec, ctx) { S.timer = { total: sec, left: sec, running: true, ctx, whole: sec }; }
function stopTimer() { if (S.timer) S.timer.running = false; }
function toggleTimer() {
  const T = S && S.timer; if (!T) return;
  if (T.left <= 0) { T.left = T.total; T.whole = T.total; T.running = true; if (S.cur) S.cur.timeUp = false; render(); }
  else { T.running = !T.running; paintTimer(); }
  if (S.screen === 'final' && S.final.phase === 'question') { T.running ? Snd.startLoop() : Snd.stopLoop(); }
  save();
}
let lastNow = performance.now();
setInterval(() => {
  const now = performance.now(), dt = (now - lastNow) / 1000; lastNow = now;
  const T = S && S.timer;
  if (!T || !T.running || S.paused || ui.view !== 'game') return;
  T.left = Math.max(0, T.left - dt);
  const whole = Math.ceil(T.left);
  if (whole !== T.whole) { T.whole = whole; if (whole <= 5 && whole > 0) Snd.tick(); save(); }
  paintTimer();
  if (T.left <= 0) { T.running = false; onTimeUp(T.ctx); }
}, 100);

function paintTimer() {
  const T = S && S.timer; if (!T) return;
  const pct = T.total ? (T.left / T.total) * 100 : 0;
  const cls = T.left <= 5 ? 'danger' : T.left <= 10 ? 'warn' : '';
  $$('[data-timer-bar]').forEach(b => { b.style.width = pct + '%'; b.className = 'timer-bar ' + cls; });
  $$('[data-timer-num]').forEach(n => { n.textContent = Math.ceil(T.left); n.className = 'timer-num ' + cls + (T.running ? '' : ' paused'); });
  $$('[data-timer-btn]').forEach(b => { b.innerHTML = icon(T.running ? 'pause' : 'play') + `<span>${T.running ? 'Pause' : (T.left <= 0 ? 'Restart' : 'Start')}</span><kbd>Space</kbd>`; });
}

function onTimeUp(ctx) {
  Snd.timeUp();
  if (S.screen === 'final') { Snd.stopLoop(); render(); save(); return; }
  if (S.screen === 'sudden') { render(); return; }
  const c = S.cur; if (!c) return;
  c.timeUp = true; render(); save();
  if ((ctx === 'answer' && c.kind === 'normal' && c.phase === 'answer') || (ctx === 'steal' && c.phase === 'intercept')) {
    const token = c, idx = c.steal.idx;
    setTimeout(() => { if (S && S.cur === token && token.timeUp && !S.timer.running && token.steal.idx === idx && ['answer', 'intercept'].includes(token.phase) && !S.paused) incorrect(); }, 1300);
  }
}

/* ---------- tiles ---------- */
function pickTile(col, row) {
  const t = S.board.tiles[col][row];
  if (t.used || ui.flipping) return;
  Snd.select();
  const el = $(`.tile[data-col="${col}"][data-row="${row}"]`);
  ui.flipping = true;
  if (el) el.classList.add('flipping');
  setTimeout(() => { ui.flipping = false; openTile(col, row); }, el ? 480 : 0);
}
function openTile(col, row) {
  const t = S.board.tiles[col][row], q = getQ(t);
  S.cur = {
    col, row, team: S.turn, kind: t.special || 'normal', value: t.value,
    phase: t.special === 'override' ? 'overrideIntro' : 'answer',
    wager: null, steal: { queue: [], idx: 0 }, awarded: [], marks: {}, result: null,
    revealed: false, order: orderFor(q), picked: null, followUp: false, touched: t.special === 'override', timeUp: false
  };
  S.timer = null;
  if (S.cur.kind === 'override') Snd.alarm();
  else startTimer(S.settings.answerTimer, 'answer');
  if (S.cur.kind === 'allhands') Snd.whoosh();
  S.screen = 'question';
  render(); save();
}
function orderFor(q) {
  if (q.type !== 'order') return null;
  const idx = q.items.map((_, i) => i);
  let s = shuffle(idx), guard = 0;
  while (s.every((v, i) => v === i) && guard++ < 10) s = shuffle(idx);
  return s;
}
const stealValue = () => Math.max(50, round50(S.cur.value * S.settings.stealMult));
const penaltyFor = v => Math.max(50, round50(v / 2));

function correct() {
  const c = S.cur; if (!c) return;
  if (c.phase === 'intercept') return awardSteal(c.steal.queue[c.steal.idx]);
  if (c.phase !== 'answer' || c.kind === 'allhands') return;
  snap();
  const pts = c.kind === 'override' ? c.wager : c.value;
  award(c.team, pts);
  c.awarded = [c.team];
  c.result = { type: 'good', text: `${S.teams[c.team].name} ${signed(pts)}` };
  finishTile(true);
}
function incorrect() {
  const c = S.cur; if (!c) return;
  const n = S.teams.length;
  if (c.phase === 'answer' && c.kind === 'normal') {
    snap(); c.touched = true;
    let note = '';
    if (S.settings.penalty) { const p = penaltyFor(c.value); award(c.team, -p); note = ` ${signed(-p)}`; }
    Snd.wrong();
    const queue = []; for (let k = 1; k < n; k++) queue.push((c.team + k) % n);
    c.result = { type: 'bad', text: `${S.teams[c.team].name}: not quite${note}` };
    if (!queue.length) { c.phase = 'nobody'; stopTimer(); }
    else { c.phase = 'intercept'; c.steal = { queue, idx: 0 }; c.timeUp = false; startTimer(S.settings.stealTimer, 'steal'); }
    ui.anim.add('result');
  } else if (c.phase === 'answer' && c.kind === 'override') {
    snap();
    award(c.team, -c.wager);
    c.result = { type: 'bad', text: `${S.teams[c.team].name} ${signed(-c.wager)}` };
    Snd.wrong(); finishTile(false, true);
    return;
  } else if (c.phase === 'intercept') {
    snap();
    const who = c.steal.queue[c.steal.idx];
    let note = '';
    if (S.settings.penalty) { const p = penaltyFor(stealValue()); award(who, -p); note = ` ${signed(-p)}`; }
    c.result = { type: 'bad', text: `${S.teams[who].name} passed or missed${note}` };
    c.steal.idx++; c.timeUp = false;
    if (c.steal.idx >= c.steal.queue.length) { c.phase = 'nobody'; stopTimer(); c.result = { type: 'meh', text: 'Nobody intercepted it' }; }
    else startTimer(S.settings.stealTimer, 'steal');
    Snd.wrong(); ui.anim.add('result');
  } else return;
  render(); save();
}
function awardSteal(i) {
  const c = S.cur;
  if (!c || c.phase !== 'intercept' || i == null || i === c.team || !S.teams[i]) return;
  snap();
  const pts = stealValue();
  award(i, pts);
  c.awarded = [i];
  c.result = { type: 'good', text: `INTERCEPTED! ${S.teams[i].name} ${signed(pts)}` };
  finishTile(true);
}
function finishTile(good, silent) {
  const c = S.cur;
  c.phase = 'done'; c.revealed = true; c.touched = true; c.followUp = false;
  stopTimer();
  if (!silent) good ? Snd.correct() : Snd.wrong();
  ui.anim.add('reveal'); ui.anim.add('result'); ui.anim.add('flip');
  render(); save();
}
function reveal() {
  const c = S.cur; if (!c) return;
  if (c.phase === 'overrideIntro' || c.phase === 'wager') return;
  if (c.kind === 'allhands' && c.phase === 'answer') {
    snap(); c.phase = 'judge'; c.revealed = true; c.touched = true; stopTimer();
    ui.anim.add('reveal'); ui.anim.add('flip'); render(); save(); return;
  }
  if (c.revealed) return;
  snap();
  c.revealed = true; c.touched = true;
  if (['answer', 'intercept', 'nobody'].includes(c.phase)) {
    c.phase = 'done';
  }
  stopTimer();
  ui.anim.add('reveal'); ui.anim.add('flip');
  render(); save();
}
function toggleMark(i) {
  const c = S.cur; if (!c || c.kind !== 'allhands' || c.phase !== 'judge' || !S.teams[i]) return;
  c.marks[i] = c.marks[i] === true ? false : c.marks[i] === false ? undefined : true;
  Snd.click(); render(); save();
}
function applyAllHands() {
  const c = S.cur; if (!c || c.phase !== 'judge') return;
  snap();
  const winners = S.teams.map((_, i) => i).filter(i => c.marks[i] === true);
  winners.forEach(i => award(i, c.value));
  c.awarded = winners;
  c.result = winners.length ? { type: 'good', text: `${winners.length} team${winners.length > 1 ? 's' : ''} ${signed(c.value)}` } : { type: 'meh', text: 'No team got it this time' };
  c.phase = 'done';
  winners.length ? Snd.correct() : Snd.wrong();
  ui.anim.add('result'); render(); save();
}
function lockWager(v) {
  const c = S.cur; if (!c || c.phase !== 'wager') return;
  const max = overrideMax();
  if (!Number.isFinite(v) || v < 0 || v > max || Math.floor(v) !== v) { ui.wagerErr = `Enter a whole number from 0 to ${fmt(max)}`; render(); return; }
  ui.wagerErr = null;
  c.wager = v; c.phase = 'answer';
  startTimer(S.settings.answerTimer, 'override');
  Snd.select(); render(); save();
}
const overrideMax = () => { const sc = S.teams[S.cur.team].score; return Math.max(sc, S.settings.lowCap); };

function swapQuestion() {
  const c = S.cur, t = curTile(); if (!c || c.touched || c.kind === 'override') return;
  const catId = content.rounds[t.ri].categories[t.ci].id;
  const spares = (content.spares || []).map((s, i) => ({ s, i })).filter(o => o.s.categoryId === catId && !S.usedSpares.includes(o.i) && o.i !== t.spare);
  if (!spares.length) return toast('No spare questions left for this category');
  const pick = spares.find(o => o.s.value === t.value) || spares[0];
  snap();
  S.usedSpares.push(pick.i);
  t.spare = pick.i;
  c.order = orderFor(pick.s); c.picked = null; c.followUp = false; c.timeUp = false;
  startTimer(S.settings.answerTimer, 'answer');
  Snd.whoosh(); ui.anim.add('swap'); render(); save();
  toast('Swapped in a spare question');
}
const sparesLeft = () => {
  const t = curTile(); if (!t) return 0;
  const catId = content.rounds[t.ri].categories[t.ci].id;
  return (content.spares || []).filter((s, i) => s.categoryId === catId && !S.usedSpares.includes(i) && i !== t.spare).length;
};

function closeQuestion() {
  const c = S.cur; if (!c) return;
  stopSpeech();
  if (!c.touched) { S.cur = null; S.timer = null; S.screen = 'board'; render(); save(); return; }
  snap();
  const t = curTile();
  t.used = true; t.winners = c.awarded.slice();
  const n = S.teams.length;
  if (S.settings.turnOrder === 'classic' && c.kind !== 'allhands' && c.awarded.length === 1) S.turn = c.awarded[0];
  else S.turn = (c.team + 1) % n;
  S.cur = null; S.timer = null; S.screen = 'board';
  if (S.board.tiles.every(col => col.every(x => x.used))) {
    enterStage(S.stageIdx + 1);
    ui.boardCleared = true;
  }
  render(); save();
}

/* ---------- final byte ---------- */
const finalQ = () => S.final.choice === 0 ? content.final.primary : content.final.backups[S.final.choice - 1];
const finalMax = i => { const sc = S.teams[i].score; return sc > 0 ? sc : S.settings.lowCap; };
function wagerOk(i) {
  const raw = S.final.wagers[i];
  if (raw === '' || raw == null) return false;
  const v = Number(raw);
  return Number.isInteger(v) && v >= 0 && v <= finalMax(i);
}
function finalNext() {
  const F = S.final;
  if (F.phase === 'category') { F.phase = 'wager'; Snd.select(); }
  else if (F.phase === 'wager') {
    if (!S.teams.every((_, i) => wagerOk(i))) return toast('Every team needs a valid wager');
    snap();
    F.phase = 'question'; F.wagers = F.wagers.map(Number);
    startTimer(S.settings.finalTimer, 'final'); Snd.startLoop();
  } else if (F.phase === 'question') {
    snap(); stopTimer(); Snd.stopLoop(); F.phase = 'judge'; ui.anim.add('reveal');
  } else if (F.phase === 'judge') {
    if (F.marks.some(m => m == null)) return toast('Mark every team correct or incorrect first');
    snap();
    F.phase = 'results';
    F.before = S.teams.map(t => t.score);
    F.order = S.teams.map((_, i) => i).sort((a, b) => S.teams[a].score - S.teams[b].score || b - a);
    F.shown = 0;
  } else if (F.phase === 'results') {
    if (F.shown < F.order.length) {
      snap();
      const i = F.order[F.shown];
      award(i, F.marks[i] ? F.wagers[i] : -F.wagers[i]);
      F.shown++;
      F.marks[i] ? Snd.correct() : Snd.wrong();
    } else {
      snap(); return checkTie();
    }
  }
  render(); save();
}
function checkTie() {
  const top = Math.max(...S.teams.map(t => t.score));
  const tied = S.teams.map((t, i) => i).filter(i => S.teams[i].score === top);
  if (tied.length > 1 && (content.tiebreakers || []).length) {
    S.sudden = { tied, tb: 0, revealed: false, guesses: {}, winner: null };
    S.screen = 'sudden'; S.timer = null;
    Snd.alarm();
  } else finishGame();
  render(); save();
}
function finishGame() {
  S.screen = 'winner'; S.cur = null; S.timer = null;
  ui.celebrate = true;
}

/* ---------- board actions ---------- */
function setScore(i, v) { if (!Number.isFinite(v)) return; snap(); S.teams[i].score = Math.round(v); ui.anim.add('score' + i); render(); save(); }
function adjust(i, d) { snap(); award(i, d); Snd.click(); render(); save(); }
function setTurn(i) { S.turn = i; Snd.click(); render(); save(); }

/* ================= rendering ================= */
const app = $('#app');

function hudCluster(extra = '') {
  return `<div class="hud">${extra}
    <button class="btn btn-icon ${prefs.sound ? 'on' : ''}" data-act="sound" title="Sound ${prefs.sound ? 'on' : 'off'} (M)" aria-label="Toggle sound">${icon(prefs.sound ? 'vol' : 'mute')}</button>
    <button class="btn btn-icon" data-act="fullscreen" title="Full screen" aria-label="Full screen">${icon('full')}</button>
  </div>`;
}
function soundBtn() { return `<button class="btn btn-icon ${prefs.sound ? 'on' : ''}" data-act="sound" title="Sound ${prefs.sound ? 'on' : 'off'} (M)" aria-label="Toggle sound">${icon(prefs.sound ? 'vol' : 'mute')}</button>`; }

function viewTitle() {
  const g = content.game || {};
  const saved = hasSavedGame() ? store.get(LS_GAME) : null;
  let savedNote = '';
  if (saved) {
    const st = saved.stages[saved.stageIdx];
    const where = saved.screen === 'winner' ? 'game finished' : st && st.final ? 'Final Byte' : saved.board ? `${saved.board.label} · ${saved.board.name}` : '';
    savedNote = `<div class="saved-note">Saved game: ${saved.teams.length} teams · ${esc(where)}</div>`;
  }
  const units = (g.units || []).map(u => { const [a, b] = u.split(':'); return `<span class="chip"><b>${esc(a)}</b>${b ? ' ·' + esc(b) : ''}</span>`; }).join('');
  return `<section class="screen title-screen">
    ${hudCluster()}
    <div class="eyebrow">Grade ${esc(g.grade ?? 7)} · Computer Science Review</div>
    <div class="logo" aria-label="${esc(g.title || 'CTRL + ALT + COMPETE')}">
      <div class="keys"><div class="keycap">CTRL</div><span class="plus">+</span><div class="keycap">ALT</div><span class="plus">+</span></div>
      <div class="compete">COMPETE</div>
    </div>
    <p class="subtitle">${esc(g.subtitle || '')}</p>
    <div class="unit-chips">${units}</div>
    <div class="title-actions">
      <button class="btn btn-gold btn-lg" data-act="toSetup">${icon('play')} Start New Game</button>
      ${saved ? `<button class="btn btn-teal btn-lg" data-act="resume">${icon('reset')} Resume Saved Game</button>` : ''}
    </div>
    ${savedNote}
    <div class="foot-note">Teacher-run on one screen · no logins, no student data · <button data-act="help">keyboard shortcuts</button></div>
  </section>`;
}

function viewSetup() {
  const su = getSetup();
  const min = teamsMin(), max = teamsMax();
  const pills = []; for (let n = min; n <= max; n++) pills.push(`<button class="pill ${su.count === n ? 'on' : ''}" data-act="count" data-n="${n}">${n}</button>`);
  const rows = su.teams.slice(0, su.count).map((t, i) => `
    <div class="team-row">
      <span class="num">${i + 1}</span>
      <label class="swatch" style="--c:${esc(t.color)}" title="Change color"><input type="color" value="${esc(t.color)}" data-bind="teamColor" data-i="${i}" aria-label="Team ${i + 1} color"></label>
      <input class="text-in" maxlength="24" value="${esc(t.name)}" data-bind="teamName" data-i="${i}" aria-label="Team ${i + 1} name" placeholder="${esc(TEAM_NAMES[i])}">
    </div>`).join('');
  const modes = modeList().map(m => `
    <button class="mode ${su.mode === m.id ? 'on' : ''}" data-act="mode" data-id="${esc(m.id)}">
      <b>${esc(m.name)}</b><span>${esc(m.desc)}</span><em>${esc(m.meta)}</em>
    </button>`).join('');
  let picker = '';
  if (su.mode === 'custom') {
    const n = su.customCats.length;
    picker = `<div class="cat-picker">
      ${content.rounds.map(r => `<div><h3>${esc(r.name)} · ${esc(r.unit || '')}</h3><div class="cat-chips">
        ${r.categories.map(c => `<button class="cat-chip ${su.customCats.includes(c.id) ? 'on' : ''}" data-act="cat" data-id="${esc(c.id)}">${esc(c.name)}</button>`).join('')}
      </div></div>`).join('')}
      <div class="pick-count ${n < 4 || n > 6 ? 'bad' : ''}">${n} selected · choose 4 to 6</div>
    </div>`;
  }
  const ready = su.mode !== 'custom' || (su.customCats.length >= 4 && su.customCats.length <= 6);
  const modeName = (modeList().find(m => m.id === su.mode) || {}).name;
  return `<section class="screen setup">
    ${hudCluster()}
    <div class="setup-inner">
      <div class="setup-head">
        <button class="btn btn-icon" data-act="toTitle" aria-label="Back to title">${icon('back')}</button>
        <h1>Game <span>Setup</span></h1>
      </div>
      <div class="setup-grid">
        <div>
          <div class="card">
            <h2>Teams <div class="count-pills">${pills.join('')}</div></h2>
            <div class="team-rows">${rows}</div>
          </div>
          <div class="card">
            <h2>Questions</h2>
            <div class="source-row">
              <span class="dot ${contentSource === 'imported' ? 'custom' : ''}"></span>
              <span>${contentSource === 'imported' ? 'Using your imported questions.json' : 'Using the built-in question set'} · ${content.rounds.reduce((a, r) => a + r.categories.length * r.values.length, 0)} board questions, ${(content.spares || []).length} spares</span>
            </div>
            <div class="source-row" style="margin-top:12px">
              <button class="btn" data-act="import">${icon('upload')} Import questions.json</button>
              ${contentSource === 'imported' ? `<button class="btn btn-ghost" data-act="useDefault">Use built-in set</button>` : ''}
            </div>
          </div>
        </div>
        <div>
          <div class="card">
            <h2>Play Mode</h2>
            <div class="modes">${modes}</div>
            ${picker}
          </div>
          <div class="card">
            <h2>Settings</h2>
            ${settingsForm(su.settings)}
          </div>
        </div>
      </div>
    </div>
    <div class="setup-bar">
      <div class="summary"><b>${su.count}</b> teams · <b>${esc(modeName)}</b> · ${hasSavedGame() && store.get(LS_GAME).screen !== 'winner' ? 'starting replaces the saved game' : 'ready when you are'}</div>
      <button class="btn btn-gold btn-lg" data-act="startGame" ${ready ? '' : 'disabled'}>Start Game ${icon('arrow')}</button>
    </div>
    <input type="file" id="importFile" accept=".json,application/json" hidden>
  </section>`;
}

function settingsForm(st) {
  const seg = (key, opts) => `<div class="seg">${opts.map(([v, l]) => `<button class="${st[key] === v ? 'on' : ''}" data-act="setting" data-key="${key}" data-val='${JSON.stringify(v)}'>${l}</button>`).join('')}</div>`;
  return `<div class="settings">
    <div class="field"><span>Answer timer</span>${seg('answerTimer', [[15, '15s'], [20, '20s'], [30, '30s'], [45, '45s'], [60, '60s']])}</div>
    <div class="field"><span>Steal timer</span>${seg('stealTimer', [[10, '10s'], [15, '15s'], [20, '20s'], [30, '30s']])}</div>
    <div class="field"><span>Steal value</span>${seg('stealMult', [[0.25, '25%'], [0.5, '50%'], [0.75, '75%'], [1, '100%']])}</div>
    <div class="field"><span>Turn order</span>${seg('turnOrder', [['rotate', 'Rotate'], ['classic', 'Classic']])}</div>
    <div class="field"><span>Wrong-answer penalty</span>${seg('penalty', [[false, 'Off'], [true, 'On (−½)']])}</div>
    <div class="field"><span>Read-aloud button</span>${seg('readAloud', [[true, 'On'], [false, 'Off']])}</div>
    <div class="field"><span>Sound</span><div class="seg"><button class="${prefs.sound ? 'on' : ''}" data-act="soundSet" data-val="1">On</button><button class="${!prefs.sound ? 'on' : ''}" data-act="soundSet" data-val="0">Off</button></div></div>
    <div class="field"><span>Final Byte timer</span>${seg('finalTimer', [[30, '30s'], [60, '60s'], [90, '90s']])}</div>
  </div>`;
}

function scoreboard(compact) {
  return `<div class="scoreboard" style="--teams:${S.teams.length}">${S.teams.map((t, i) => {
    const active = i === S.turn && !compact;
    const editing = ui.editingScore === i;
    return `<div class="team-card ${active ? 'active' : ''}" style="${teamVars(t)}">
      ${active ? '<span class="up">▶ UP NEXT</span>' : ''}
      <button class="tname" data-act="setTurn" data-i="${i}" title="Make ${esc(t.name)} up next">${esc(t.name)}</button>
      ${editing ? `<input class="score-in" type="number" step="50" value="${t.score}" data-bind="scoreEdit" data-i="${i}" aria-label="Exact score">`
        : `<button class="tscore ${t.score < 0 ? 'neg' : ''} ${ui.anim.has('score' + i) ? 'bump' : ''}" data-act="editScore" data-i="${i}" title="Click to type an exact score">${fmt(t.score)}</button>`}
      <div class="adj"><button data-act="adj" data-i="${i}" data-d="100" aria-label="Add 100">+100</button><button data-act="adj" data-i="${i}" data-d="-100" aria-label="Subtract 100">−100</button></div>
    </div>`;
  }).join('')}</div>`;
}

function viewBoard() {
  const B = S.board;
  const cols = B.cols.length;
  const heads = B.cols.map(c => `<div class="cat-head"><div><b>${esc(c.name)}</b>${c.blurb ? `<small>${esc(c.blurb)}</small>` : ''}</div></div>`).join('');
  let cells = '';
  for (let r = 0; r < B.rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = B.tiles[c][r];
      if (!t) { cells += '<div></div>'; continue; }
      if (t.used) {
        const ws = t.winners.map(i => S.teams[i]).filter(Boolean);
        let style = '', who = 'No one';
        if (ws.length === 1) { style = `--used-bg:${rgba(ws[0].color, .2)};--used-line:${rgba(ws[0].color, .55)};--used-ink:${ws[0].color}`; who = ws[0].name; }
        else if (ws.length > 1) {
          const stops = ws.map((w, k) => `${rgba(w.color, .3)} ${(k / ws.length) * 100}% ${((k + 1) / ws.length) * 100}%`).join(',');
          style = `--used-bg:linear-gradient(135deg,${stops});--used-line:#2A4670;--used-ink:#EAF1FB`; who = `${ws.length} teams`;
        }
        cells += `<div class="tile used" style="${style}" aria-label="${t.value} used, won by ${esc(who)}"><div class="won"><span class="v">${t.value}</span><span class="who">${ws.length ? '✓ ' : ''}${esc(who)}</span></div></div>`;
      } else {
        cells += `<button class="tile" data-act="tile" data-col="${c}" data-row="${r}" aria-label="${esc(B.cols[c].name)} for ${t.value}">${t.value}</button>`;
      }
    }
  }
  return `<section class="screen board-screen">
    <div class="topbar">
      <div class="round-badge"><span class="rn">${esc(B.label)}</span><span class="name">${esc(B.name)}</span><span class="unit">${esc(B.unit)}</span></div>
      <div class="spacer"></div>
      <div class="tools">
        <button class="btn" data-act="undo" title="Undo (Ctrl+Z)" ${S.hist.length ? '' : 'disabled'}>${icon('undo')}<span class="lbl">Undo</span></button>
        <button class="btn" data-act="settings" title="Settings">${icon('gear')}<span class="lbl">Settings</span></button>
        <button class="btn" data-act="pause" title="Pause game (P)">${icon('pause')}<span class="lbl">Pause</span></button>
        <button class="btn" data-act="endRound" title="End this round now">${icon('flag')}<span class="lbl">End Round</span></button>
        <button class="btn btn-coral" data-act="reset" title="Reset game">${icon('reset')}<span class="lbl">Reset</span></button>
        <button class="btn btn-icon" data-act="help" title="Keyboard shortcuts (?)" aria-label="Keyboard shortcuts">${icon('help')}</button>
        ${soundBtn()}
        <button class="btn btn-icon" data-act="fullscreen" title="Full screen" aria-label="Full screen">${icon('full')}</button>
      </div>
    </div>
    <div class="board-wrap"><div class="board" style="--cols:${cols};--rows:${B.rows}">${heads}${cells}</div></div>
    ${scoreboard()}
  </section>`;
}

function choiceBlock(q, c) {
  const rev = c.revealed;
  if (q.type === 'mc' || q.type === 'tf') {
    const opts = q.type === 'mc' ? q.choices : ['True', 'False'];
    const ans = q.type === 'mc' ? q.answerIndex : (q.answer ? 0 : 1);
    return `<div class="choices ${q.type === 'tf' ? 'tf' : ''}">${opts.map((o, i) => {
      const cls = rev ? (i === ans ? 'correct' : 'dim') : (c.picked === i ? 'picked' : '');
      return `<button class="choice ${cls}" data-act="pick" data-i="${i}">${q.type === 'mc' ? `<span class="ltr">${LETTERS[i]}</span>` : ''}<span>${esc(o)}</span>${rev && i === ans ? '<span class="mark">✓ CORRECT</span>' : ''}</button>`;
    }).join('')}</div>`;
  }
  if (q.type === 'order') {
    const shown = c.order || q.items.map((_, i) => i);
    const seq = rev ? q.items.map((_, i) => i) : shown;
    return `<div class="order-list">${seq.map((itemIdx, pos) => {
      const display = shown.indexOf(itemIdx) + 1;
      return `<div class="order-card ${rev ? 'done' : ''}" data-flip="ord${itemIdx}"><span class="n">${rev ? itemIdx + 1 : pos + 1}</span><span>${esc(q.items[itemIdx])}</span>${rev ? `<span class="was">was card ${display}</span>` : ''}</div>`;
    }).join('')}</div>`;
  }
  return rev ? '' : `<div class="short-hint">Answer out loud</div>`;
}

function revealBlock(q, c) {
  if (!c.revealed) return '';
  const acc = (q.accept || []).filter(a => String(a).toLowerCase() !== String(q.answer).toLowerCase());
  return `<div class="reveal ${ui.anim.has('reveal') ? 'anim-in' : ''}">
    <div class="tag">ANSWER</div>
    <div class="ans">${esc(answerText(q))}</div>
    ${acc.length && q.type !== 'mc' && q.type !== 'tf' ? `<p class="accept">Also accept: <b>${acc.map(esc).join(' · ')}</b></p>` : ''}
    ${q.explanation ? `<p class="why"><span class="tag">WHY:</span>${esc(q.explanation)}</p>` : ''}
  </div>`;
}

function viewQuestion() {
  const c = S.cur, t = curTile(), q = curQ();
  const cat = S.board.cols[c.col];
  const team = S.teams[c.team];
  const T = S.timer;

  if (c.phase === 'overrideIntro' || c.phase === 'wager') {
    const max = overrideMax();
    const body = c.phase === 'overrideIntro'
      ? `<div class="warn-tag">⚠ ALERT ⚠ ALERT ⚠</div>
         <h2>SYSTEM<br>OVERRIDE</h2>
         <p><b style="color:${esc(team.color)}">${esc(team.name)}</b> found a wager tile in <b>${esc(cat.name)}</b>. Only they answer. No intercepts.</p>
         <button class="btn btn-gold btn-lg" data-act="toWager">Set the wager ${icon('arrow')}</button>`
      : `<div class="wager-box">
          <div class="warn-tag">SYSTEM OVERRIDE · ${esc(cat.name)}</div>
          <div class="wager-team" style="color:${esc(team.color)}">${esc(team.name)}</div>
          <div class="wager-meta">Score <b>${fmt(team.score)}</b> · wager 0 to <b>${fmt(max)}</b></div>
          <input class="wager-input ${ui.wagerErr ? 'bad' : ''}" id="wagerIn" type="number" min="0" max="${max}" step="50" inputmode="numeric" value="${c.wagerDraft ?? ''}" placeholder="0" aria-label="Wager">
          <div class="quick">
            <button class="btn" data-act="wq" data-v="0">0</button>
            <button class="btn" data-act="wq" data-v="${round50(max / 2)}">Half · ${fmt(round50(max / 2))}</button>
            <button class="btn" data-act="wq" data-v="${max}">All in · ${fmt(max)}</button>
          </div>
          <div class="err">${esc(ui.wagerErr || '')}</div>
          <button class="btn btn-gold btn-lg" data-act="lockWager">Lock wager &amp; show question ${icon('arrow')}</button>
        </div>`;
    return `<section class="q-screen ${ui.anim.has('qenter') ? 'enter' : ''}">
      ${hudCluster(`<button class="btn" data-act="close" title="Back to board (Esc)">${icon('x')} Close</button>`)}
      <div class="override-intro">${body}</div>
    </section>`;
  }

  const badge = c.kind === 'override' ? `<span class="q-badge override">SYSTEM OVERRIDE · WAGER ${fmt(c.wager)}</span>`
    : c.kind === 'allhands' ? `<span class="q-badge allhands">ALL HANDS</span>`
    : c.phase === 'intercept' ? `<span class="q-badge steal">INTERCEPT · ${fmt(stealValue())}</span>` : '';
  let who = '';
  if (c.phase === 'intercept') { const s = S.teams[c.steal.queue[c.steal.idx]]; who = `<div class="answering"><span class="lbl">Steal</span><span class="team-pill" style="${teamVars(s)}">${esc(s.name)}</span></div>`; }
  else if (c.kind === 'allhands' && !['done'].includes(c.phase)) who = `<div class="answering"><span class="lbl">Answering</span><span>Every team</span></div>`;
  else if (c.phase !== 'done' && c.phase !== 'nobody') who = `<div class="answering"><span class="lbl">Answering</span><span class="team-pill" style="${teamVars(team)}">${esc(team.name)}</span></div>`;

  const timerUI = T && ['answer', 'intercept'].includes(c.phase) ? `<div class="timer-num" data-timer-num>${Math.ceil(T.left)}</div>` : '';
  const timeUp = c.timeUp && T && T.left <= 0 && ['answer', 'intercept'].includes(c.phase) ? `<div class="result bad anim-in">⏰ TIME!</div>` : '';
  const result = c.result ? `<div class="result ${c.result.type} ${ui.anim.has('result') ? 'anim-in' : ''}">${c.result.type === 'good' ? '✓' : c.result.type === 'bad' ? '✗' : '•'} ${esc(c.result.text)}</div>` : '';
  const ahBanner = c.kind === 'allhands' && c.phase === 'answer' ? `<div class="ah-banner">${icon('hands')} Every team writes an answer on a whiteboard. Hold them up when time is called.</div>` : '';
  const follow = c.followUp && q.followUp ? `<div class="followup anim-in"><span class="tag">FOLLOW-UP · ASK THE CLASS</span>${esc(q.followUp)}</div>` : '';

  /* dock */
  const timerBtn = T && ['answer', 'intercept'].includes(c.phase) ? `<button class="btn" data-act="timer" data-timer-btn>${icon(T.running ? 'pause' : 'play')}<span>${T.running ? 'Pause' : 'Start'}</span><kbd>Space</kbd></button>` : '';
  let main = '';
  if (c.phase === 'answer' && c.kind !== 'allhands') {
    main = `<button class="btn btn-teal btn-big" data-act="correct">${icon('check')} Correct<kbd>C</kbd></button>
            <button class="btn btn-coral btn-big" data-act="incorrect">${icon('x')} ${c.kind === 'override' ? 'Incorrect' : 'Incorrect → Intercept'}<kbd>X</kbd></button>`;
  } else if (c.phase === 'intercept') {
    main = `<button class="btn btn-teal btn-big" data-act="correct">${icon('check')} Steal correct<kbd>C</kbd></button>
            <button class="btn btn-coral btn-big" data-act="incorrect">${icon('x')} Pass / miss<kbd>X</kbd></button>`;
  } else if (c.kind === 'allhands' && c.phase === 'answer') {
    main = `<button class="btn btn-gold btn-big" data-act="reveal">${icon('eye')} Reveal &amp; check boards<kbd>R</kbd></button>`;
  } else if (c.phase === 'judge') {
    main = `<button class="btn btn-gold btn-big" data-act="applyAH">${icon('check')} Award ${fmt(c.value)} to marked teams</button>`;
  }
  const revealBtn = !c.revealed && c.phase !== 'judge' && !(c.kind === 'allhands' && c.phase === 'answer') ? `<button class="btn ${c.phase === 'nobody' ? 'btn-gold btn-big' : ''}" data-act="reveal">${icon('eye')} Reveal<kbd>R</kbd></button>` : '';
  const followBtn = q.followUp && c.revealed ? `<button class="btn" data-act="follow">${icon('bulb')} Follow-up<kbd>F</kbd></button>` : '';
  const readBtn = S.settings.readAloud ? `<button class="btn" data-act="read">${icon('vol')} Read<kbd>S</kbd></button>` : '';
  const nSp = !c.touched && c.kind !== 'override' ? sparesLeft() : 0;
  const swapBtn = nSp ? `<button class="btn" data-act="swap" title="Replace with a spare question from this category">${icon('swap')} Swap (${nSp})</button>` : '';
  const closeBtn = `<button class="btn ${c.phase === 'done' ? 'btn-gold btn-big' : ''}" data-act="close">${c.phase === 'done' ? `Back to board ${icon('arrow')}` : `${icon('x')} Close`}<kbd>Esc</kbd></button>`;

  let strip = '';
  if (c.phase === 'intercept') {
    const cur = c.steal.queue[c.steal.idx];
    strip = `<div class="steal-strip"><span class="msg">INTERCEPT! <em>${esc(S.teams[cur].name)}</em> can steal ${fmt(stealValue())}. Or award it to:</span>
      ${S.teams.map((tm, i) => i === c.team ? '' : `<button class="team-btn ${i === cur ? 'current' : ''} ${c.steal.queue.indexOf(i) < c.steal.idx ? 'out' : ''}" style="${teamVars(tm)}" data-act="steal" data-i="${i}"><span class="k">${i + 1}</span>${esc(tm.name)}</button>`).join('')}
    </div>`;
  } else if (c.phase === 'judge') {
    strip = `<div class="steal-strip"><span class="msg">Tap each team with a <em>correct</em> board:</span>
      ${S.teams.map((tm, i) => `<button class="team-btn ${c.marks[i] === true ? 'mark-yes' : c.marks[i] === false ? 'mark-no' : ''}" style="${teamVars(tm)}" data-act="mark" data-i="${i}"><span class="k">${i + 1}</span>${esc(tm.name)}</button>`).join('')}
    </div>`;
  } else if (c.phase === 'done' && c.awarded.length) {
    strip = `<div class="steal-strip">${c.awarded.map(i => `<span class="team-btn current" style="${teamVars(S.teams[i])}">${esc(S.teams[i].name)} <span class="s">${fmt(S.teams[i].score)}</span></span>`).join('')}</div>`;
  }

  return `<section class="q-screen ${ui.anim.has('qenter') ? 'enter' : ''}">
    <header class="q-head">
      <span class="q-cat">${esc(cat.name)}</span>
      <span class="q-val">${fmt(c.value)}</span>
      ${badge}
      <span class="spacer"></span>
      ${who}
      ${timerUI}
    </header>
    <div class="timer-track" ${T && ['answer', 'intercept'].includes(c.phase) ? '' : 'style="visibility:hidden"'}><div class="timer-bar" data-timer-bar></div></div>
    <div class="q-main" id="qmain">
      ${ahBanner}
      <h2 class="q-prompt ${ui.anim.has('swap') ? 'anim-in' : ''}">${esc(q.prompt)}</h2>
      ${choiceBlock(q, c)}
      ${timeUp}${result}
      ${revealBlock(q, c)}
      ${follow}
    </div>
    <footer class="q-dock">
      ${strip}
      <div class="dock-row">
        ${main}${timerBtn}${revealBtn}
        <span class="spacer"></span>
        ${followBtn}${readBtn}${swapBtn}
        <button class="btn" data-act="undo" ${S.hist.length ? '' : 'disabled'} title="Undo (Ctrl+Z)">${icon('undo')}</button>
        ${soundBtn()}
        ${closeBtn}
      </div>
    </footer>
  </section>`;
}

function miniStandings() {
  return `<div class="mini-standings">${S.teams.map(t => `<span class="ms" style="${teamVars(t)}"><i></i>${esc(t.name)} <b>${fmt(t.score)}</b></span>`).join('')}</div>`;
}

function viewIntro() {
  const st = S.stages[S.stageIdx];
  const cleared = ui.boardCleared ? `<div class="chip"><b>Board cleared!</b></div>` : '';
  const anyScore = S.teams.some(t => t.score !== 0);
  if (st.final) {
    return `<section class="screen stage-screen">${hudCluster()}
      ${cleared}
      <div class="eyebrow">The last question of the game</div>
      <h1 class="big gold">${esc(content.final.name || 'FINAL BYTE')}</h1>
      <p class="lead">One question that mixes both units. Each team secretly writes a <b>wager</b> before seeing it.</p>
      ${miniStandings()}
      <button class="btn btn-gold btn-lg" data-act="beginStage">Reveal the category ${icon('arrow')}</button>
    </section>`;
  }
  const B = S.board;
  const vals = B.cols.flatMap(c => c.values);
  return `<section class="screen stage-screen">${hudCluster(`<button class="btn" data-act="toTitleGame">${icon('home')} Title</button>`)}
    ${cleared}
    <div class="eyebrow">${esc(B.label)}${B.unit ? ' · ' + esc(B.unit) : ''}</div>
    <h1 class="big ${S.stageIdx % 2 ? 'gold' : 'teal'}">${esc(B.name)}</h1>
    <p class="lead">${B.cols.length} categories · tiles worth <b>${fmt(Math.min(...vals))}</b> to <b>${fmt(Math.max(...vals))}</b></p>
    <div class="specials-hint">
      ${B.specials.override ? `<span class="chip">${icon('bolt')} <b>SYSTEM OVERRIDE</b> ×${B.specials.override} hidden</span>` : ''}
      ${B.specials.allHands ? `<span class="chip">${icon('hands')} <b>ALL HANDS</b> ×${B.specials.allHands} hidden</span>` : ''}
    </div>
    ${anyScore ? miniStandings() : ''}
    <div class="title-actions">
      <button class="btn btn-gold btn-lg" data-act="beginStage">${icon('play')} Start ${esc(B.label.toLowerCase().replace(/^\w/, m => m.toUpperCase()))}</button>
    </div>
    <p class="lead" style="font-size:clamp(13px,1.8vh,28px)"><b style="color:${esc(S.teams[S.turn].color)}">${esc(S.teams[S.turn].name)}</b> picks first.</p>
  </section>`;
}

function viewFinal() {
  const F = S.final, fq = finalQ();
  const top = `${hudCluster(`<button class="btn" data-act="undo" ${S.hist.length ? '' : 'disabled'} title="Undo (Ctrl+Z)">${icon('undo')}</button>`)}`;
  if (F.phase === 'category') {
    const opts = [content.final.primary, ...(content.final.backups || [])];
    return `<section class="screen stage-screen">${top}
      <div class="eyebrow">${esc(content.final.name || 'FINAL BYTE')} · Category</div>
      <div class="cat-reveal anim-in">${esc(content.final.category || '')}</div>
      <p class="lead">Each team: write your wager on paper. You can bet <b>0 up to your score</b>. Teams at 0 or below may bet up to <b>${fmt(S.settings.lowCap)}</b>.</p>
      ${miniStandings()}
      ${opts.length > 1 ? `<div class="field" style="justify-items:center"><span>Teacher: choose the question (hold A to preview)</span>
        <div class="seg">${opts.map((_, i) => `<button class="${F.choice === i ? 'on' : ''}" data-act="fchoice" data-i="${i}">${i === 0 ? 'Primary' : 'Backup ' + i}</button>`).join('')}</div></div>` : ''}
      <button class="btn btn-gold btn-lg" data-act="fnext">Enter wagers ${icon('arrow')}</button>
    </section>`;
  }
  if (F.phase === 'wager') {
    const all = S.teams.every((_, i) => wagerOk(i));
    return `<section class="screen stage-screen">${top}
      <div class="eyebrow">${esc(content.final.category || '')}</div>
      <h1 class="big gold" style="font-size:clamp(36px,8vh,140px)">Lock in wagers</h1>
      <div class="final-wagers">${S.teams.map((t, i) => {
        const bad = F.wagers[i] !== '' && !wagerOk(i);
        return `<label class="final-wager" style="${teamVars(t)}"><span class="t">${esc(t.name)}</span>
          <span class="m">Score ${fmt(t.score)} · max ${fmt(finalMax(i))}</span>
          <input type="number" min="0" max="${finalMax(i)}" step="50" inputmode="numeric" value="${esc(F.wagers[i])}" data-bind="fwager" data-i="${i}" class="${bad ? 'bad' : ''}" placeholder="0"></label>`;
      }).join('')}</div>
      <button class="btn btn-gold btn-lg" data-act="fnext" id="lockFinal" ${all ? '' : 'disabled'}>Lock wagers &amp; reveal question ${icon('arrow')}</button>
    </section>`;
  }
  if (F.phase === 'question' || F.phase === 'judge') {
    const T = S.timer;
    const judging = F.phase === 'judge';
    return `<section class="q-screen final-q">
      <header class="q-head">
        <span class="q-cat">${esc(content.final.category || '')}</span>
        <span class="q-badge override" style="color:var(--gold);border-color:var(--gold);background:var(--gold-soft)">${esc(content.final.name || 'FINAL BYTE')}</span>
        <span class="spacer"></span>
        ${T && !judging ? `<div class="timer-num" data-timer-num>${Math.ceil(T.left)}</div>` : ''}
      </header>
      <div class="timer-track" ${T && !judging ? '' : 'style="visibility:hidden"'}><div class="timer-bar" data-timer-bar></div></div>
      <div class="q-main" id="qmain">
        <h2 class="q-prompt ${fq.type === 'short' && !judging ? 'final-prompt' : ''}">${esc(fq.prompt)}</h2>
        ${fq.type === 'mc' || fq.type === 'tf' || fq.type === 'order' ? choiceBlock(fq, { revealed: judging, order: fq.type === 'order' ? (F.order2 || (F.order2 = orderFor(fq))) : null, picked: null }) : ''}
        ${T && T.left <= 0 && !judging ? `<div class="result bad anim-in">⏰ TIME! Pens down.</div>` : ''}
        ${judging ? revealBlock(fq, { revealed: true }) : ''}
      </div>
      <footer class="q-dock">
        ${judging ? `<div class="steal-strip"><span class="msg">Mark each team:</span>${S.teams.map((t, i) => `<button class="team-btn ${F.marks[i] === true ? 'mark-yes' : F.marks[i] === false ? 'mark-no' : ''}" style="${teamVars(t)}" data-act="fmark" data-i="${i}"><span class="k">${i + 1}</span>${esc(t.name)}</button>`).join('')}</div>` : ''}
        <div class="dock-row">
          ${judging ? `<button class="btn btn-gold btn-big" data-act="fnext" ${F.marks.some(m => m == null) ? 'disabled' : ''}>Reveal scores ${icon('arrow')}</button>`
            : `<button class="btn" data-act="timer" data-timer-btn>${icon(T && T.running ? 'pause' : 'play')}<span>${T && T.running ? 'Pause' : 'Start'}</span><kbd>Space</kbd></button>
               <button class="btn btn-gold btn-big" data-act="fnext">${icon('eye')} Reveal answer<kbd>R</kbd></button>`}
          <span class="spacer"></span>
          ${S.settings.readAloud ? `<button class="btn" data-act="fread">${icon('vol')} Read<kbd>S</kbd></button>` : ''}
          <button class="btn" data-act="undo" ${S.hist.length ? '' : 'disabled'} title="Undo (Ctrl+Z)">${icon('undo')}</button>
          ${soundBtn()}
        </div>
      </footer>
    </section>`;
  }
  // results
  const done = F.shown >= F.order.length;
  return `<section class="screen stage-screen">${top}
    <div class="eyebrow">${esc(content.final.name || 'FINAL BYTE')} · Results (lowest score first)</div>
    <div class="results">${F.order.map((i, k) => {
      const t = S.teams[i], shown = k < F.shown, w = F.wagers[i], ok = F.marks[i];
      return `<div class="res-row ${shown ? '' : 'hidden'} ${k === F.shown ? 'next' : ''}" style="${teamVars(t)}">
        <span class="mono" style="color:var(--dim)">${k + 1}</span>
        <span class="nm">${esc(t.name)}</span>
        <span class="mono wg">${shown ? 'wagered ' + fmt(w) : 'wager ???'}</span>
        <span class="mono delta ${shown ? (ok ? 'up' : 'down') : ''}">${shown ? (ok ? '✓ ' + signed(w) : '✗ ' + signed(-w)) : ''}</span>
        <span class="sc ${shown && ui.anim.has('score' + i) ? 'bump' : ''}">${fmt(shown ? t.score : F.before[i])}</span>
      </div>`;
    }).join('')}</div>
    <button class="btn btn-gold btn-lg" data-act="fnext">${done ? `${icon('trophy')} Final standings` : `Reveal ${esc(S.teams[F.order[F.shown]].name)} ${icon('arrow')}`}</button>
  </section>`;
}

function viewSudden() {
  const SB = S.sudden, tbs = content.tiebreakers || [];
  const tb = tbs[SB.tb];
  const tied = SB.tied.map(i => S.teams[i]);
  const T = S.timer;
  let closestIdx = [];
  if (SB.revealed && tb.mode === 'closest') {
    const target = parseFloat(String(tb.answer).replace(/[^0-9.\-]+/g, ' ').trim().split(' ')[0]);
    const ds = SB.tied.map(i => ({ i, d: SB.guesses[i] === '' || SB.guesses[i] == null ? Infinity : Math.abs(Number(SB.guesses[i]) - target) }));
    const best = Math.min(...ds.map(o => o.d));
    if (Number.isFinite(best)) closestIdx = ds.filter(o => o.d === best).map(o => o.i);
  }
  return `<section class="screen stage-screen" style="align-content:center">
    ${hudCluster(`<button class="btn" data-act="undo" ${S.hist.length ? '' : 'disabled'}>${icon('undo')}</button>`)}
    <div class="eyebrow">It's a tie between ${tied.map(t => esc(t.name)).join(' & ')}</div>
    <h1 class="big gold" style="font-size:clamp(44px,10vh,180px)">SUDDEN BYTE</h1>
    <div class="picker">${tbs.map((t, i) => `<button class="pill ${i === SB.tb ? 'on' : ''}" data-act="tb" data-i="${i}" title="${t.mode}">${i + 1}</button>`).join('')}</div>
    <div class="tb-mode">${tb.mode === 'closest' ? 'CLOSEST NUMBER WINS · each team writes a guess' : 'FASTEST CORRECT ANSWER WINS · first to shout it out'}</div>
    <h2 class="q-prompt" style="text-align:center;max-width:1400px">${esc(tb.prompt)}</h2>
    ${tb.mode === 'closest' ? `<div class="final-wagers" style="width:min(900px,92vw)">${SB.tied.map(i => `<label class="final-wager" style="${teamVars(S.teams[i])}"><span class="t">${esc(S.teams[i].name)} guess</span><input type="number" data-bind="guess" data-i="${i}" value="${esc(SB.guesses[i] ?? '')}"></label>`).join('')}</div>` : ''}
    ${SB.revealed ? `<div class="reveal anim-in" style="text-align:left"><div class="tag">ANSWER</div><div class="ans">${esc(tb.answer)}</div>${tb.explanation ? `<p class="why"><span class="tag">WHY:</span>${esc(tb.explanation)}</p>` : ''}</div>` : `<button class="btn btn-gold btn-lg" data-act="tbReveal">${icon('eye')} Reveal answer<kbd>R</kbd></button>`}
    <div class="steal-strip" style="justify-content:center"><span class="msg">Winner:</span>${SB.tied.map(i => `<button class="team-btn ${closestIdx.includes(i) ? 'current' : ''}" style="${teamVars(S.teams[i])}" data-act="tbWin" data-i="${i}">${icon('trophy')} ${esc(S.teams[i].name)}</button>`).join('')}</div>
  </section>`;
}

function viewWinner() {
  const order = S.teams.map((t, i) => i).sort((a, b) => (b === S.tieWinner) - (a === S.tieWinner) || S.teams[b].score - S.teams[a].score);
  const top = order.slice(0, 3);
  const champs = order.filter(i => S.teams[i].score === S.teams[order[0]].score && S.tieWinner == null);
  const title = champs.length > 1 ? `<span>Co-champions!</span>` : `<span>${esc(S.teams[order[0]].name)}</span> wins!`;
  const podOrder = top.length === 3 ? [top[1], top[0], top[2]] : top.length === 2 ? [top[1], top[0]] : top;
  return `<section class="screen winner-screen">
    ${hudCluster()}
    <h1>${title}</h1>
    <div class="podium">${podOrder.map(i => {
      const p = top.indexOf(i) + 1;
      return `<div class="pod p${p}" style="${teamVars(S.teams[i])}"><div class="who">${esc(S.teams[i].name)}</div><div class="pts">${fmt(S.teams[i].score)}</div><div class="block">${p}</div></div>`;
    }).join('')}</div>
    <div>
      ${order.length > 3 ? `<div class="standings-row" style="margin-bottom:2vh">${order.slice(3).map((i, k) => `<span class="chip" style="color:var(--text)">${k + 4}. ${esc(S.teams[i].name)} · <b>${fmt(S.teams[i].score)}</b></span>`).join('')}</div>` : ''}
      <div class="standings-row">
        <button class="btn btn-gold btn-lg" data-act="playAgain">${icon('reset')} Play Again</button>
        <button class="btn btn-lg" data-act="newGame">${icon('home')} New Game</button>
      </div>
    </div>
  </section>`;
}

function viewError() {
  return `<section class="screen error-screen"><div class="modal">
    <h3>The question file has a problem</h3>
    <p>Fix these in <code>questions.json</code>, or import a corrected file. Nothing else is broken.</p>
    <ul class="errs">${loadErrors.map(e => `<li><code>${esc(e.where)}</code> ${esc(e.msg)}</li>`).join('')}</ul>
    <div class="actions">
      ${window.QUESTIONS_FALLBACK && !validate(window.QUESTIONS_FALLBACK).length ? `<button class="btn" data-act="useBundled">Use the bundled backup copy</button>` : ''}
      <button class="btn btn-gold" data-act="import">${icon('upload')} Import questions.json</button>
    </div>
    <input type="file" id="importFile" accept=".json,application/json" hidden>
  </div></section>`;
}

function screenKey() {
  if (ui.view !== 'game') return ui.view;
  return S.screen;
}
function render() {
  const key = screenKey();
  const prev = app.dataset.screen;
  if (key === 'question' && prev !== 'question') ui.anim.add('qenter');
  // capture positions for FLIP animation
  const rects = {};
  if (ui.anim.has('flip')) $$('[data-flip]').forEach(el => { rects[el.dataset.flip] = el.getBoundingClientRect(); });

  let html = '';
  if (ui.view === 'title') html = viewTitle();
  else if (ui.view === 'setup') html = viewSetup();
  else if (ui.view === 'error') html = viewError();
  else if (S.screen === 'intro') html = viewIntro();
  else if (S.screen === 'board') html = viewBoard();
  else if (S.screen === 'question') html = (S.board ? viewBoard() : '') + viewQuestion();
  else if (S.screen === 'final') html = viewFinal();
  else if (S.screen === 'sudden') html = viewSudden();
  else if (S.screen === 'winner') html = viewWinner();
  if (ui.view === 'game' && S.paused) html += `<div class="pause-screen"><h2>PAUSED</h2><p>Scores and timers are frozen.</p><button class="btn btn-gold btn-lg" data-act="pause">${icon('play')} Resume game<kbd>P</kbd></button></div>`;

  app.innerHTML = html;
  app.dataset.screen = key;
  if (prev !== key && key !== 'question' && !(prev === 'question' && key === 'board') && app.firstElementChild) app.firstElementChild.classList.add('enter');

  // FLIP
  if (ui.anim.has('flip')) {
    $$('[data-flip]').forEach((el, k) => {
      const r0 = rects[el.dataset.flip]; if (!r0) return;
      const r1 = el.getBoundingClientRect();
      const dx = r0.left - r1.left, dy = r0.top - r1.top;
      if (!dx && !dy) return;
      el.style.transform = `translate(${dx}px,${dy}px)`; el.style.transition = 'none';
      el.getBoundingClientRect();
      el.style.transition = `transform .8s cubic-bezier(.2,.8,.2,1) ${k * 90}ms`;
      el.style.transform = '';
    });
  }
  ui.anim.clear();
  paintTimer();
  fitQuestion();
  renderModal();
  const focusEl = $('#wagerIn') || (ui.editingScore != null && $('.score-in'));
  if (focusEl) { focusEl.focus(); if (focusEl.select) focusEl.select(); }
  if (ui.celebrate && key === 'winner') { ui.celebrate = false; Snd.fanfare(); confetti(); }
}

function fitQuestion() {
  const m = $('#qmain'); if (!m) return;
  let f = 1;
  m.style.setProperty('--fit', f);
  while (m.scrollHeight > m.clientHeight + 2 && f > 0.5) { f -= 0.05; m.style.setProperty('--fit', f.toFixed(2)); }
}
window.addEventListener('resize', () => { clearTimeout(ui.rs); ui.rs = setTimeout(fitQuestion, 120); });

/* ---------- modal + toast ---------- */
function openModal(m) { ui.modal = m; renderModal(); }
function closeModal() { ui.modal = null; renderModal(); }
function renderModal() {
  const root = $('#modal-root');
  const m = ui.modal;
  if (!m) { root.innerHTML = ''; return; }
  root.innerHTML = `<div class="modal-back" data-act="modalBack"><div class="modal ${m.wide ? 'wide' : ''}" role="dialog" aria-modal="true">
    <h3>${m.title}</h3>${typeof m.body === 'function' ? m.body() : (m.body || '')}
    <div class="actions">${m.ok ? `<button class="btn btn-ghost" data-act="modalCancel">${m.cancelLabel || 'Cancel'}</button><button class="btn ${m.danger ? 'btn-coral' : 'btn-gold'}" data-act="modalOk">${m.okLabel || 'OK'}</button>` : `<button class="btn btn-gold" data-act="modalCancel">Done</button>`}</div>
  </div></div>`;
}
function confirmModal(title, body, okLabel, fn, danger) { openModal({ title, body: `<p>${body}</p>`, okLabel, ok: fn, danger }); }
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400); }

function helpModal() {
  const rows = [
    ['Space', 'Start / pause the timer'], ['C', 'Mark correct'], ['X', 'Mark incorrect → open intercept / pass'],
    ['1 – 6', 'Award an intercept to a team (or mark teams in All Hands / Final Byte)'], ['R', 'Reveal answer + explanation'],
    ['F', 'Show the teacher follow-up question'], ['S', 'Read the question aloud'], ['Hold A', 'Peek at the answer (small corner box)'],
    ['Esc', 'Back to board / close a dialog'], ['Ctrl + Z', 'Undo the last scoring action'], ['P', 'Pause the game (board)'],
    ['M', 'Sound on / off'], ['F11', 'Full screen'], ['?', 'This list']
  ];
  openModal({ title: 'Teacher shortcuts', wide: true, body: `<table class="keys-table">${rows.map(([k, d]) => `<tr><td>${k.split(' ').map(x => x === '–' || x === '+' ? x : `<kbd>${x}</kbd>`).join(' ')}</td><td>${d}</td></tr>`).join('')}</table>` });
}

function settingsModal() {
  openModal({ title: 'Game settings', wide: true, body: () => `<p>Changes apply right away.</p><div id="liveSettings">${settingsForm(S.settings)}</div>` });
}

/* ---------- confetti ---------- */
function confetti() {
  const cv = $('#confetti'), cx = cv.getContext('2d');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const W = cv.width = innerWidth * devicePixelRatio, H = cv.height = innerHeight * devicePixelRatio;
  const cols = [...S.teams.map(t => t.color), '#E8B048', '#5EEAD4', '#FFFFFF'];
  const P = Array.from({ length: 260 }, () => ({
    x: Math.random() * W, y: -Math.random() * H * .6, w: (6 + Math.random() * 8) * devicePixelRatio, h: (10 + Math.random() * 10) * devicePixelRatio,
    vx: (Math.random() - .5) * 3 * devicePixelRatio, vy: (2 + Math.random() * 4) * devicePixelRatio, r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: cols[Math.floor(Math.random() * cols.length)]
  }));
  const start = performance.now();
  (function frame(now) {
    cx.clearRect(0, 0, W, H);
    const age = now - start;
    P.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vy += .03 * devicePixelRatio;
      if (p.y > H && age < 4500) { p.y = -20; p.vy = (2 + Math.random() * 3) * devicePixelRatio; }
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; cx.globalAlpha = age > 6000 ? Math.max(0, 1 - (age - 6000) / 1500) : 1;
      cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); cx.restore();
    });
    if (age < 7500) requestAnimationFrame(frame); else cx.clearRect(0, 0, W, H);
  })(start);
}

/* ================= events ================= */
function fullscreen() {
  const d = document, el = d.documentElement;
  try {
    if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else toast('Full screen is not available here. Try your browser’s menu.');
  } catch (e) { toast('Full screen is not available here.'); }
}
function toggleSound(v) {
  prefs.sound = v == null ? !prefs.sound : v; savePrefs();
  if (!prefs.sound) Snd.stopLoop(); else { Snd.ensure(); Snd.click(); if (S && S.screen === 'final' && S.final && S.final.phase === 'question' && S.timer && S.timer.running) Snd.startLoop(); }
  render();
}
function goGame() { ui.view = 'game'; session.set('cac.live', '1'); render(); }

function handleImport() {
  const inp = $('#importFile'); if (!inp) return;
  inp.value = '';
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      let data;
      try { data = JSON.parse(rd.result); } catch (e) { return openModal({ title: 'That file is not valid JSON', body: `<p>${esc(e.message)}</p><p>Tip: paste the file into a JSON checker to find the missing comma or quote.</p>` }); }
      const errs = validate(data);
      if (errs.length) return openModal({ title: `Found ${errs.length} problem${errs.length > 1 ? 's' : ''} in that file`, wide: true, body: `<ul class="errs">${errs.slice(0, 60).map(e => `<li><code>${esc(e.where)}</code> ${esc(e.msg)}</li>`).join('')}</ul>` });
      content = data; contentSource = 'imported'; loadErrors = null;
      if (!store.set(LS_CUSTOM, data)) toast('Loaded for this session (storage is blocked, so it will not be remembered)');
      else toast(`Imported ${f.name}`);
      ui.view = 'setup'; render();
    };
    rd.readAsText(f);
  };
  inp.click();
}

const ACT = {
  sound: () => toggleSound(),
  soundSet: d => toggleSound(d.val === '1'),
  fullscreen,
  help: helpModal,
  toSetup: () => { ui.view = 'setup'; render(); },
  toTitle: () => { savePrefs(); ui.view = 'title'; render(); },
  toTitleGame: () => { ui.view = 'title'; render(); },
  resume: () => {
    const g = store.get(LS_GAME), c = store.get(LS_CONTENT);
    if (!g || !c) return toast('No saved game found');
    S = g; content = c; S.paused = false; if (S.timer) S.timer.running = false;
    goGame();
  },
  count: d => { prefs.setup.count = +d.n; savePrefs(); render(); },
  mode: d => { prefs.setup.mode = d.id; savePrefs(); render(); },
  cat: d => {
    const cc = prefs.setup.customCats, k = cc.indexOf(d.id);
    if (k > -1) cc.splice(k, 1); else if (cc.length < 6) cc.push(d.id); else toast('Six categories max');
    savePrefs(); render();
  },
  setting: d => {
    const v = JSON.parse(d.val);
    const target = ui.view === 'game' ? S.settings : prefs.setup.settings;
    target[d.key] = v;
    if (ui.view === 'game') { save(); render(); }
    else { savePrefs(); render(); }
  },
  import: handleImport,
  useDefault: async () => { store.del(LS_CUSTOM); loadErrors = null; await loadContent(); if (loadErrors) { ui.view = 'error'; } toast('Using the built-in question set'); render(); },
  useBundled: () => { content = window.QUESTIONS_FALLBACK; contentSource = 'default'; loadErrors = null; ui.view = 'title'; render(); },
  startGame: () => {
    const su = getSetup(); savePrefs();
    const go = () => { newGame(su); Snd.select(); goGame(); };
    if (hasSavedGame()) { const g = store.get(LS_GAME); if (g.screen !== 'winner') return confirmModal('Replace the saved game?', 'Starting a new game erases the saved one, including its scores.', 'Start new game', go, true); }
    go();
  },
  beginStage: () => {
    ui.boardCleared = false;
    const st = S.stages[S.stageIdx];
    S.screen = st.final ? 'final' : 'board';
    Snd.whoosh(); render(); save();
  },
  tile: d => pickTile(+d.col, +d.row),
  correct, incorrect, reveal,
  timer: toggleTimer,
  steal: d => awardSteal(+d.i),
  mark: d => toggleMark(+d.i),
  applyAH: applyAllHands,
  pick: d => { if (S.cur && !S.cur.revealed) { S.cur.picked = S.cur.picked === +d.i ? null : +d.i; Snd.click(); render(); save(); } },
  follow: () => { if (S.cur) { S.cur.followUp = !S.cur.followUp; render(); save(); } },
  read: () => { const q = curQ(); if (q) speak(speakText(q)); },
  fread: () => speak(speakText(finalQ())),
  swap: swapQuestion,
  close: closeQuestion,
  toWager: () => { S.cur.phase = 'wager'; Snd.click(); render(); save(); },
  wq: d => { const i = $('#wagerIn'); if (i) { i.value = d.v; S.cur.wagerDraft = d.v; } },
  lockWager: () => { const i = $('#wagerIn'); lockWager(i && i.value !== '' ? Number(i.value) : NaN); },
  undo,
  adj: d => adjust(+d.i, +d.d),
  editScore: d => { ui.editingScore = +d.i; render(); },
  setTurn: d => setTurn(+d.i),
  settings: settingsModal,
  pause: () => { S.paused = !S.paused; if (S.paused) { Snd.stopLoop(); stopSpeech(); } render(); save(); },
  endRound: () => {
    const next = S.stages[S.stageIdx + 1];
    confirmModal('End this round?', `Unplayed tiles are skipped and the game moves to ${next ? (next.final ? (content.final.name || 'the final') : 'the next round') : 'the results'}. Scores are kept.`, 'End round', () => { snap(); enterStage(S.stageIdx + 1); render(); save(); });
  },
  reset: () => confirmModal('Reset the game?', 'This clears every score and returns to setup. You can’t undo it.', 'Reset game', () => { store.del(LS_GAME); S = null; ui.view = 'setup'; render(); }, true),
  fchoice: d => { S.final.choice = +d.i; S.final.order2 = null; render(); save(); },
  fnext: finalNext,
  fmark: d => { const F = S.final; const i = +d.i; F.marks[i] = F.marks[i] === true ? false : true; Snd.click(); render(); save(); },
  tb: d => { snap(); S.sudden.tb = +d.i; S.sudden.revealed = false; S.sudden.guesses = {}; render(); save(); },
  tbReveal: () => { S.sudden.revealed = true; Snd.select(); render(); save(); },
  tbWin: d => { snap(); S.tieWinner = +d.i; finishGame(); render(); save(); },
  playAgain: () => {
    const su = clone(prefs.setup || getSetup());
    su.count = S.teams.length; su.mode = S.mode; su.settings = clone(S.settings);
    su.teams = S.teams.map(t => ({ name: t.name, color: t.color })).concat(su.teams.slice(S.teams.length));
    if (S.mode === 'custom') su.customCats = S.stages[0].catIds.slice();
    newGame(su); render(); save();
  },
  newGame: () => { store.del(LS_GAME); S = null; ui.view = 'setup'; render(); },
  modalBack: (d, el, e) => { if (e.target === el) closeModal(); },
  modalCancel: closeModal,
  modalOk: () => { const fn = ui.modal && ui.modal.ok; closeModal(); fn && fn(); }
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  Snd.ensure();
  const fn = ACT[el.dataset.act];
  if (fn) fn(el.dataset, el, e);
});

document.addEventListener('input', e => {
  const el = e.target, b = el.dataset && el.dataset.bind;
  if (!b) {
    if (el.id === 'wagerIn' && S && S.cur) { S.cur.wagerDraft = el.value; }
    return;
  }
  const i = +el.dataset.i;
  if (b === 'teamName') { prefs.setup.teams[i].name = el.value; savePrefs(); }
  else if (b === 'teamColor') { prefs.setup.teams[i].color = el.value; el.parentElement.style.setProperty('--c', el.value); savePrefs(); }
  else if (b === 'fwager') {
    S.final.wagers[i] = el.value; save();
    el.classList.toggle('bad', el.value !== '' && !wagerOk(i));
    const btn = $('#lockFinal'); if (btn) btn.disabled = !S.teams.every((_, k) => wagerOk(k));
  } else if (b === 'guess') { S.sudden.guesses[i] = el.value; save(); }
});
document.addEventListener('focusout', e => {
  const el = e.target;
  if (el.dataset && el.dataset.bind === 'scoreEdit') commitScore(el);
});
function commitScore(el) {
  const i = +el.dataset.i, v = Number(el.value);
  if (ui.editingScore !== i) return;
  ui.editingScore = null;
  if (el.value !== '' && Number.isFinite(v) && v !== S.teams[i].score) setScore(i, v); else render();
}

const isTyping = el => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
const peekEl = $('#peek');
function showPeek(on) {
  let txt = '';
  if (on && ui.view === 'game' && S) {
    if (S.screen === 'question' && S.cur) txt = `<b>${esc(answerText(curQ()))}</b>`;
    else if (S.screen === 'final') { const q = finalQ(); txt = `${esc(q.prompt)}<br><b>${esc(answerText(q))}</b>`; }
    else if (S.screen === 'sudden') txt = `<b>${esc(content.tiebreakers[S.sudden.tb].answer)}</b>`;
  }
  peekEl.innerHTML = txt;
  peekEl.classList.toggle('show', !!txt);
}

document.addEventListener('keydown', e => {
  Snd.ensure();
  const t = e.target;
  if (isTyping(t)) {
    if (e.key === 'Enter') {
      if (t.id === 'wagerIn') { e.preventDefault(); ACT.lockWager(); }
      else if (t.dataset.bind === 'scoreEdit') { e.preventDefault(); commitScore(t); }
      else if (t.dataset.bind === 'fwager') { const b = $('#lockFinal'); if (b && !b.disabled) finalNext(); }
    } else if (e.key === 'Escape' && t.dataset.bind === 'scoreEdit') { ui.editingScore = null; render(); }
    return;
  }
  const k = e.key.toLowerCase();
  if (ui.modal) {
    if (k === 'escape') closeModal();
    else if (k === 'enter' && ui.modal.ok) ACT.modalOk();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && k === 'z') { if (S && ui.view === 'game') { e.preventDefault(); undo(); } return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (k === '?' || (k === '/' && e.shiftKey)) return helpModal();
  if (k === 'm') return toggleSound();
  if (ui.view !== 'game' || !S) return;
  if (S.paused) { if (k === 'p' || k === ' ' || k === 'escape') { e.preventDefault(); ACT.pause(); } return; }
  if (k === 'a') { if (!e.repeat) showPeek(true); return; }

  if (S.screen === 'board') {
    if (k === 'p') ACT.pause();
    return;
  }
  if (S.screen === 'question' && S.cur) {
    const c = S.cur;
    if (k === ' ') { e.preventDefault(); toggleTimer(); }
    else if (k === 'c') correct();
    else if (k === 'x') incorrect();
    else if (k === 'r') reveal();
    else if (k === 'f') ACT.follow();
    else if (k === 's' && S.settings.readAloud && c.phase !== 'overrideIntro' && c.phase !== 'wager') ACT.read();
    else if (k === 'escape') closeQuestion();
    else if (k === 'enter' && c.phase === 'overrideIntro') ACT.toWager();
    else if (/^[1-6]$/.test(k)) { const i = +k - 1; if (c.phase === 'intercept') awardSteal(i); else if (c.phase === 'judge') toggleMark(i); }
    return;
  }
  if (S.screen === 'final') {
    const F = S.final;
    if (k === ' ' && F.phase === 'question') { e.preventDefault(); toggleTimer(); }
    else if (k === 'r' && F.phase === 'question') finalNext();
    else if (k === 's' && S.settings.readAloud && ['question', 'judge'].includes(F.phase)) ACT.fread();
    else if (/^[1-6]$/.test(k) && F.phase === 'judge' && S.teams[+k - 1]) ACT.fmark({ i: +k - 1 });
    return;
  }
  if (S.screen === 'sudden') {
    if (k === 'r') ACT.tbReveal();
  }
});
document.addEventListener('keyup', e => { if (e.key.toLowerCase() === 'a') showPeek(false); });
window.addEventListener('blur', () => showPeek(false));
document.addEventListener('fullscreenchange', () => setTimeout(fitQuestion, 150));

/* ================= boot ================= */
(async function boot() {
  await loadContent();
  if (loadErrors) { ui.view = 'error'; render(); return; }
  getSetup(); savePrefs();
  // A refresh in the same tab drops straight back into the game; a new visit offers Resume.
  if (session.get('cac.live') === '1' && hasSavedGame()) {
    S = store.get(LS_GAME); content = store.get(LS_CONTENT);
    if (S.timer) S.timer.running = false;
    ui.view = 'game';
  } else ui.view = 'title';
  render();
})();
})();
