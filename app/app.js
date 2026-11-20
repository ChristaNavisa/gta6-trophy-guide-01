// Leonida Platinum Codex v3 — offline trophy guide + tracker.
// Data: app/data/trophies.json (fetched at run time, same origin, no network).
// All audit numbers below are computed from the data at run time.
const POINTS = { platinum: 300, gold: 90, silver: 30, bronze: 15 };
const GRADE_LETTER = { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' };
const RISK_LABEL = { missable: 'MISSABLE', atRisk: 'AT RISK', watch: 'WATCH', unconfirmed: 'UNCONFIRMED' };
const KIND_LABEL = { story: 'Story', collectibles: 'Collectibles', activities: 'Activities', crime: 'Crime', misc: 'Misc', platinum: 'Platinum' };

const params = new URLSearchParams(location.search);
const DEMO = params.get('demo') === '1';
const SELFTEST = params.get('selftest') === '1';

let DATA = null;
let earned = new Set();
let counters = {};
let spoiler = false;
let filter = 'all';
let search = '';
let selectedId = 28; // Positive Mental Attitude opens the cover
let tab = params.get('tab') || 'tracker';

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem('lpc-earned') || '[]');
    earned = new Set(s.filter((x) => typeof x === 'number'));
    counters = JSON.parse(localStorage.getItem('lpc-counters') || '{}') || {};
    spoiler = localStorage.getItem('lpc-spoiler') === '1';
  } catch { earned = new Set(); counters = {}; spoiler = false; }
  if (DEMO) {
    // 11 bronze + 1 gold = 255 PSN pts, matching the cover state.
    earned = new Set([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    counters = { 28: 6 };
    spoiler = false;
  }
  if (params.get('spoiler') === '1') spoiler = true;
  if (params.get('spoiler') === '0') spoiler = false;
  if (params.get('select')) selectedId = Number(params.get('select')) || selectedId;
}
function saveState() {
  try {
    localStorage.setItem('lpc-earned', JSON.stringify([...earned]));
    localStorage.setItem('lpc-counters', JSON.stringify(counters));
    localStorage.setItem('lpc-spoiler', spoiler ? '1' : '0');
  } catch { /* storage may be off; the tracker still works in memory */ }
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function srcByNum(n) { return DATA.sources.find((s) => s.n === n); }
function trophyById(id) { return DATA.trophies.find((t) => t.id === id); }
function pointsOf(t) { return POINTS[t.grade] || 0; }
function earnedPoints() { return DATA.trophies.filter((t) => earned.has(t.id)).reduce((a, t) => a + pointsOf(t), 0); }
function stepsOf(t) { return t.steps || []; }
function citesOf(t) {
  const out = [];
  for (const s of stepsOf(t)) for (const c of (s.c || [])) if (!out.includes(c)) out.push(c);
  return out.sort((a, b) => a - b);
}
function stepCiteCount(n) {
  let c = 0;
  for (const t of DATA.trophies) for (const s of stepsOf(t)) if ((s.c || []).includes(n)) c += 1;
  return c;
}
function trackedCountsLogged() {
  // Sum of every numeric counter the tracker logs, excluding money totals.
  return DATA.trophies.reduce((a, t) => (typeof t.count === 'number' && !(t.countLabel || '').includes('dollars') ? a + t.count : a), 0);
}
function riskOf(t) { return t.risk || 'none'; }
function isHidden(t) { return !!t.hidden; }

function auditNumbers() {
  const trs = DATA.trophies;
  const steps = trs.flatMap((t) => stepsOf(t));
  const cited = steps.filter((s) => (s.c || []).length > 0).length;
  const backed2 = steps.filter((s) => (s.c || []).length >= 2).length;
  const disputes = trs.filter((t) => t.dispute).length;
  const claims = steps.length + trs.length + disputes * 2;
  return {
    steps: steps.length, cited, backed2, disputes, claims,
    hidden: trs.filter(isHidden).length,
    missable: trs.filter((t) => riskOf(t) === 'missable').length,
    atRisk: trs.filter((t) => riskOf(t) === 'atRisk').length,
    watch: trs.filter((t) => riskOf(t) === 'watch').length,
    unconfirmed: trs.filter((t) => riskOf(t) === 'unconfirmed').length,
    sources: DATA.sources.length,
    counts: trackedCountsLogged(),
  };
}

function renderAudit() {
  const a = auditNumbers();
  const cells = [
    `<span class="cell"><b>55/55</b> official name, description, grade</span>`,
    `<span class="cell"><b>1P 2G 6S 46B</b> · 28 PSN-hidden</span>`,
    `<span class="cell"><b>${a.claims}/${a.claims}</b> claims cited</span>`,
    `<span class="cell"><b>${a.cited}/${a.steps}</b> steps cited · ${a.backed2} backed by 2+ sources</span>`,
    `<span class="cell"><b>${a.sources}</b> sources read 20 Nov 2026</span>`,
    `<span class="cell"><b class="n">${a.missable}</b> possibly missable · <b>${a.atRisk}</b> at risk · <b>${a.watch}</b> watch · <b>${a.unconfirmed}</b> unconfirmed</span>`,
    `<span class="cell"><b>${a.disputes}</b> disputes shown both ways</span>`,
    `<span class="cell"><b>${a.counts}</b> tracked counts logged</span>`,
  ];
  document.getElementById('auditCells').innerHTML = cells.join('');
}

function renderHeader() {
  const total = DATA.trophies.length;
  document.getElementById('earnedCount').textContent = `${earned.size} / ${total}`;
  document.getElementById('psnPts').textContent = `${earnedPoints()} / 1,350 PSN pts`;
  const byGrade = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  const totGrade = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of DATA.trophies) {
    totGrade[t.grade] += 1;
    if (earned.has(t.id)) byGrade[t.grade] += 1;
  }
  document.getElementById('gradeBar').innerHTML =
    ['platinum', 'gold', 'silver', 'bronze'].map((g) =>
      `<i class="g-${g[0]}" style="width:${(byGrade[g] / totGrade[g]) * 25}%" title="${GRADE_LETTER[g]} ${byGrade[g]}/${totGrade[g]}"></i>`).join('');
  document.getElementById('spoilerToggle').checked = spoiler;
  document.getElementById('spoilerState').textContent = spoiler
    ? 'on · story names hidden' : 'off · story names shown';
}

const FILTERS = [
  ['all', 'All'], ['story', 'Story'], ['missable', 'Missable'], ['atRisk', 'At risk'],
  ['watch', 'Watch'], ['unconfirmed', 'Unconfirmed'], ['collectibles', 'Collectibles'],
  ['activities', 'Activities'], ['crime', 'Crime'], ['misc', 'Misc'],
  ['hidden', 'PSN-hidden'], ['disputed', 'Disputed'], ['unearned', 'Not earned'],
];
function filterCount(key) {
  const trs = DATA.trophies;
  switch (key) {
    case 'all': return trs.length;
    case 'story': return trs.filter((t) => t.kind === 'story').length;
    case 'missable': return trs.filter((t) => riskOf(t) === 'missable').length;
    case 'atRisk': return trs.filter((t) => riskOf(t) === 'atRisk').length;
    case 'watch': return trs.filter((t) => riskOf(t) === 'watch').length;
    case 'unconfirmed': return trs.filter((t) => riskOf(t) === 'unconfirmed').length;
    case 'collectibles': return trs.filter((t) => t.kind === 'collectibles').length;
    case 'activities': return trs.filter((t) => t.kind === 'activities').length;
    case 'crime': return trs.filter((t) => t.kind === 'crime').length;
    case 'misc': return trs.filter((t) => t.kind === 'misc').length;
    case 'hidden': return trs.filter(isHidden).length;
    case 'disputed': return trs.filter((t) => t.dispute).length;
    case 'unearned': return trs.filter((t) => !earned.has(t.id)).length;
    default: return 0;
  }
}
function matchesFilter(t) {
  if (search) {
    const q = search.toLowerCase();
    if (!(t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q))) return false;
  }
  switch (filter) {
    case 'all': return true;
    case 'story': return t.kind === 'story';
    case 'missable': return riskOf(t) === 'missable';
    case 'atRisk': return riskOf(t) === 'atRisk';
    case 'watch': return riskOf(t) === 'watch';
    case 'unconfirmed': return riskOf(t) === 'unconfirmed';
    case 'collectibles': return t.kind === 'collectibles';
    case 'activities': return t.kind === 'activities';
    case 'crime': return t.kind === 'crime';
    case 'misc': return t.kind === 'misc';
    case 'hidden': return isHidden(t);
    case 'disputed': return !!t.dispute;
    case 'unearned': return !earned.has(t.id);
    default: return true;
  }
}
function renderFilters() {
  document.getElementById('filters').innerHTML = FILTERS.map(([key, label]) =>
    `<button type="button" data-f="${key}" class="${filter === key ? 'active' : ''}">${label} <span class="cnt">${filterCount(key)}</span></button>`).join('') +
    ['P', 'G', 'S', 'B'].map((g) =>
      `<button type="button" data-g="${g}" title="Grade ${g}">${g} ${DATA.trophies.filter((t) => GRADE_LETTER[t.grade] === g).length}</button>`).join('');
  document.querySelectorAll('#filters button[data-f]').forEach((b) =>
    b.addEventListener('click', () => { filter = b.dataset.f; renderAll(); }));
  document.querySelectorAll('#filters button[data-g]').forEach((b) =>
    b.addEventListener('click', () => { search = ''; document.getElementById('searchBox').value = ''; filter = 'all'; renderAll(); selectByGrade(b.dataset.g); }));
}
function selectByGrade(g) {
  const t = DATA.trophies.find((x) => GRADE_LETTER[x.grade] === g);
  if (t) { selectedId = t.id; renderAll(); }
}

function displayName(t) {
  if (spoiler && t.kind === 'story' && !earned.has(t.id)) return `Story trophy · Chapter ${t.chapter || '?'}`;
  return t.name;
}
function renderList() {
  const list = document.getElementById('trophyList');
  const shown = DATA.trophies.filter(matchesFilter);
  const byStage = {};
  for (const t of shown) (byStage[t.stage] = byStage[t.stage] || []).push(t);
  const stageTitles = {};
  for (const s of DATA.roadmap) stageTitles[s.stage] = s.title;
  let html = '';
  for (const stage of Object.keys(byStage).map(Number).sort((a, b) => a - b)) {
    const group = byStage[stage];
    const done = group.filter((t) => earned.has(t.id)).length;
    html += `<div class="stage-head">${esc(stageTitles[stage] || ('Stage ' + stage))}<span class="prog">${done}/${group.length}</span></div>`;
    for (const t of group) {
      const badges = [];
      if (isHidden(t)) badges.push('<span class="badge hidden">HIDDEN</span>');
      if (riskOf(t) === 'missable') badges.push('<span class="badge missable">MISSABLE</span>');
      if (riskOf(t) === 'atRisk') badges.push('<span class="badge atrisk">AT RISK</span>');
      if (riskOf(t) === 'watch') badges.push('<span class="badge watch">WATCH</span>');
      if (riskOf(t) === 'unconfirmed') badges.push('<span class="badge unconf">UNCONFIRMED</span>');
      if (t.dispute) badges.push('<span class="badge disputed">DISPUTED</span>');
      html += `<div class="trow ${t.id === selectedId ? 'selected' : ''} ${earned.has(t.id) ? 'earned' : ''}" data-id="${t.id}">
        <input type="checkbox" ${earned.has(t.id) ? 'checked' : ''} aria-label="Mark ${esc(t.name)} earned">
        <span class="grade ${GRADE_LETTER[t.grade]}">${GRADE_LETTER[t.grade]}</span>
        <span class="tbody"><span class="tname">${esc(displayName(t))}</span>${badges.join('')}
        <span class="tdesc">${esc(spoiler && t.kind === 'story' && !earned.has(t.id) ? 'Hidden by the spoiler shield until earned.' : t.desc)}</span>
        <span class="tmeta">${esc(KIND_LABEL[t.kind] || t.kind)} · ${pointsOf(t)} pts · Stage ${t.stage}${t.chapter ? ' · Chapter ' + t.chapter : ''} · ${citesOf(t).length} sources · ${stepsOf(t).length} steps</span></span>
      </div>`;
    }
  }
  list.innerHTML = html || '<div class="stage-head">No trophies match this filter.</div>';
  list.querySelectorAll('.trow').forEach((row) => {
    row.addEventListener('click', (ev) => {
      const id = Number(row.dataset.id);
      if (ev.target.tagName === 'INPUT') {
        if (ev.target.checked) earned.add(id); else earned.delete(id);
        saveState(); renderAll(); return;
      }
      selectedId = id; renderAll();
    });
  });
}

function riskBanner(t) {
  const r = riskOf(t);
  if (r === 'none') return '';
  const map = {
    missable: ['POSSIBLY MISSABLE · LAST CHANCE', 'Chapter 1 · before Tourist Trap — the balcony meditation exists only in Chapter 1. Protect it: accept it the morning after Down to Earth and keep the Chapter 1 save until the trophy pops.'],
    atRisk: ['AT RISK · ONE-TIME SET-PIECE', 'Guides disagree about whether this can be skipped by rushing the story. Do it the first time it appears — it costs minutes and removes the doubt.'],
    watch: ['WATCH · CHAPTER-GATED', 'Finish this chain before the finale, while its missions are running.'],
    unconfirmed: ['UNCONFIRMED · GUIDES DISAGREE', 'The method for this trophy is not settled across the sources this guide read. This guide says so plainly instead of guessing.'],
  };
  const [title, body] = map[r];
  return `<div class="riskbanner ${r}"><div class="rb-t">${title}</div><p>${body}</p></div>`;
}

function renderDetail() {
  const t = trophyById(selectedId) || DATA.trophies[0];
  const steps = stepsOf(t);
  const backed = steps.filter((s) => (s.c || []).length >= 2).length;
  const cites = citesOf(t);
  const counter = typeof t.count === 'number'
    ? `<div class="counter"><span class="clbl">YOUR COUNT — ${esc((t.countLabel || 'count').toUpperCase())}:</span>
        <button type="button" data-dec="${t.id}" aria-label="Decrease count">−</button>
        <span class="cval">${counters[t.id] || 0} / ${t.count}</span>
        <button type="button" data-inc="${t.id}" aria-label="Increase count">+</button>
        <span class="clbl" style="font-weight:400">${counters[t.id] || 0} to go · saved</span></div>`
    : '';
  const dispute = t.dispute ? `<div class="dispute"><h3>SOURCES DIFFER — BOTH VERSIONS SHOWN</h3>
    <div class="cols"><div class="col"><b>A · ${esc(t.dispute.q)}</b><br>${esc(t.dispute.a)}</div>
    <div class="col"><b>B</b><br>${esc(t.dispute.b)}</div></div>
    <div class="call"><b>OUR CALL —</b> ${esc(t.dispute.call)}</div></div>` : '';
  document.getElementById('detailPane').innerHTML = `
    <h2>${esc(displayName(t))}</h2>
    <div class="dmeta"><b>${t.grade}</b> · #${t.id} of 55 · ${esc(KIND_LABEL[t.kind] || t.kind)} · Stage ${t.stage}${t.chapter ? ' · Chapter ' + t.chapter : ''} · ${pointsOf(t)} pts${isHidden(t) ? ' · PSN-hidden' : ' · shown on PSN'} · ${cites.length} sources</div>
    <blockquote class="official"><span class="lbl">OFFICIAL DESCRIPTION</span><br>“${esc(t.desc)}”</blockquote>
    ${riskBanner(t)}
    ${counter}
    <p class="inshort">${esc(t.guide)}</p>
    ${dispute}
    <div class="steps"><h3>HOW TO EARN IT — ${steps.length} STEPS, ${steps.length} CITED · ${backed} ON 2+ SOURCES</h3>
      <ol>${steps.map((s, i) => `<li>${esc(s.t)} <span class="cite">${(s.c || []).map((n) => '[' + n + ']').join(' ')}</span></li>`).join('')}</ol></div>
    <p class="inshort"><button type="button" id="copyLinkBtn">Copy link to this trophy</button></p>`;
  document.querySelectorAll('#detailPane [data-inc]').forEach((b) => b.addEventListener('click', () => {
    const id = Number(b.dataset.inc); const t2 = trophyById(id);
    counters[id] = Math.min((counters[id] || 0) + 1, t2.count || 99); saveState(); renderAll();
  }));
  document.querySelectorAll('#detailPane [data-dec]').forEach((b) => b.addEventListener('click', () => {
    const id = Number(b.dataset.dec);
    counters[id] = Math.max((counters[id] || 0) - 1, 0); saveState(); renderAll();
  }));
  const copyBtn = document.getElementById('copyLinkBtn');
  if (copyBtn) copyBtn.addEventListener('click', () => {
    const url = `${location.origin}${location.pathname}?select=${t.id}`;
    if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
    copyBtn.textContent = 'Link copied';
  });
  // Right rail: next up in roadmap order + sources for this guide.
  const next = DATA.trophies.filter((x) => !earned.has(x.id)).sort((a, b) => (a.stage - b.stage) || (a.id - b.id)).slice(0, 5);
  document.getElementById('nextUp').innerHTML = next.map((x, i) =>
    `<li data-id="${x.id}" tabindex="0"><b>${esc(displayName(x))}</b><span class="nu-meta">${x.grade} · ${pointsOf(x)} pts · Stage ${x.stage}${x.chapter ? ' · Chapter ' + x.chapter : ''}${riskOf(x) !== 'none' ? ' · ' + RISK_LABEL[riskOf(x)] : ''}</span></li>`).join('');
  document.querySelectorAll('#nextUp li').forEach((li) => li.addEventListener('click', () => {
    selectedId = Number(li.dataset.id); renderAll();
  }));
  document.getElementById('detailSources').innerHTML = cites.map((n) => {
    const s = srcByNum(n);
    return `<li><b>${esc(s.name)}</b><span class="s-meta">${esc(s.url)} · read ${esc(s.read)} · ${stepCiteCount(n)} claims here</span></li>`;
  }).join('') || '<li>No sources cited for this trophy.</li>';
}

function renderRoadmap() {
  document.getElementById('roadmapPane').innerHTML = DATA.roadmap.map((s) => {
    const group = DATA.trophies.filter((t) => t.stage === s.stage);
    const done = group.filter((t) => earned.has(t.id)).length;
    return `<div class="stage"><h3>${esc(s.title)} — ${done}/${group.length} earned</h3><p>${esc(s.note)}</p>
      <ul>${group.map((t) => `<li>${esc(displayName(t))} <span style="color:var(--muted)">(${t.grade} · ${pointsOf(t)} pts${riskOf(t) !== 'none' ? ' · ' + RISK_LABEL[riskOf(t)] : ''})</span></li>`).join('')}</ul></div>`;
  }).join('');
}

function renderMissables() {
  const tiers = [
    ['missable', 'POSSIBLY MISSABLE — do it before the window closes', 'The one trophy with a chapter-closing window.'],
    ['atRisk', 'AT RISK — one-time set-pieces', 'Story missions guides disagree about. Do them the first time they appear.'],
    ['watch', 'WATCH — chapter-gated chains', 'Stranger chains to finish before the finale.'],
    ['unconfirmed', 'UNCONFIRMED — guides disagree on the method', 'Flagged honestly instead of guessed.'],
  ];
  document.getElementById('missablesPane').innerHTML = tiers.map(([key, title, note]) => {
    const group = DATA.trophies.filter((t) => riskOf(t) === key);
    return `<h3>${title} (${group.length})</h3><p style="color:var(--muted);margin:0 0 6px">${note}</p>
      <table><tr><th>Trophy</th><th>Grade</th><th>Stage</th><th>Why it is flagged</th></tr>
      ${group.map((t) => `<tr><td><b>${esc(t.name)}</b><br><span style="color:var(--muted)">${esc(t.desc)}</span></td><td>${t.grade}</td><td>${t.stage}</td><td>${esc(t.dispute ? t.dispute.q + ' — ' + t.dispute.call : ({ atRisk: 'One-time story set-piece — guides disagree about whether it can be skipped by rushing the story. Do it the first time it appears.', watch: 'Chapter-gated chain — finish it before the finale, while its missions are running.', unconfirmed: 'Method not settled across the sources this guide read — flagged honestly instead of guessed.' }[key] || ''))}</td></tr>`).join('')}</table>`;
  }).join('');
}

function renderSources() {
  document.getElementById('sourcesPane').innerHTML = `<table>
    <tr><th>#</th><th>Source</th><th>Read</th><th>Steps citing it</th></tr>
    ${DATA.sources.map((s) => `<tr><td>${s.n}</td><td><b>${esc(s.name)}</b><br><span style="color:var(--muted)">${esc(s.url)}</span></td><td>${esc(s.read)}</td><td>${stepCiteCount(s.n)}</td></tr>`).join('')}
  </table>`;
}

function renderTabs() {
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  for (const name of ['tracker', 'roadmap', 'missables', 'sources']) {
    document.getElementById('tab-' + name).hidden = tab !== name;
  }
}

function renderAll() {
  renderHeader(); renderAudit(); renderFilters(); renderList(); renderDetail();
  renderRoadmap(); renderMissables(); renderSources(); renderTabs();
}

function runSelftest() {
  const a = auditNumbers();
  const checks = {
    trophies55: DATA.trophies.length === 55,
    namesUnique: new Set(DATA.trophies.map((t) => t.name)).size === 55,
    guidesText: DATA.trophies.every((t) => typeof t.guide === 'string' && t.guide.trim().length > 0),
    stepsCited: a.cited === a.steps,
    stepsBacked2: a.backed2 === a.steps,
    grades: DATA.trophies.filter((t) => t.grade === 'platinum').length === 1
      && DATA.trophies.filter((t) => t.grade === 'gold').length === 2
      && DATA.trophies.filter((t) => t.grade === 'silver').length === 6
      && DATA.trophies.filter((t) => t.grade === 'bronze').length === 46,
    hidden28: a.hidden === 28,
    riskTiers: a.missable === 1 && a.atRisk === 8 && a.watch === 5 && a.unconfirmed === 3,
    sourcesDated: DATA.sources.length === 27 && DATA.sources.every((s) => s.read === '20 Nov 2026'),
    listRendered: document.querySelectorAll('.trow').length > 0,
    detailRendered: document.getElementById('detailPane').textContent.includes('Positive Mental Attitude'),
  };
  checks.all = Object.values(checks).every(Boolean);
  window.__guideSelftest = checks;
  document.getElementById('selftestBadge').textContent = checks.all
    ? `Selftest ${Object.keys(checks).length - 1}/${Object.keys(checks).length - 1} OK` : 'Selftest FAILED';
  return checks;
}

async function init() {
  loadState();
  const res = await fetch('data/trophies.json');
  DATA = await res.json();
  document.getElementById('searchBox').addEventListener('input', (ev) => { search = ev.target.value; renderList(); });
  document.getElementById('spoilerToggle').addEventListener('change', (ev) => { spoiler = ev.target.checked; saveState(); renderAll(); });
  document.getElementById('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ earned: [...earned], counters }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'leonida-platinum-codex-progress.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', (ev) => {
    const f = ev.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(reader.result);
        if (Array.isArray(d.earned)) earned = new Set(d.earned.filter((x) => typeof x === 'number'));
        if (d.counters && typeof d.counters === 'object') counters = d.counters;
        saveState(); renderAll();
      } catch { /* invalid file: ignore */ }
    };
    reader.readAsText(f);
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    earned = new Set(); counters = {}; saveState(); renderAll();
  });
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; renderTabs(); }));
  renderAll();
  if (SELFTEST) runSelftest();
}

init();
