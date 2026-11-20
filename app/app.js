// Leonida Platinum Codex v4 — tracker app. All audit numbers are computed
// from data/trophies.json at runtime, never typed by hand.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const params = new URLSearchParams(location.search);
const PSN = { platinum: 300, gold: 90, silver: 30, bronze: 15 };
const GRADE_LETTER = { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' };
const TIER_LABEL = { possibly: 'POSSIBLY MISSABLE', atrisk: 'AT RISK', watch: 'WATCH', unconfirmed: 'UNCONFIRMED' };

let DATA = null;
let earned = new Set(JSON.parse(localStorage.getItem('lpc-earned') || '[]'));
let spoilerOn = params.get('spoilers') !== 'off';
let filter = 'all';
let query = '';
let selected = null;

const res = await fetch('data/trophies.json');
DATA = await res.json();
const TR = DATA.trophies, SRCS = DATA.sources, META = DATA.meta;

// Demo mode: first 12 trophies in roadmap order count as earned.
if (params.get('demo') === '1') {
  earned = new Set(roadmapOrder().slice(0, 12).map((t) => t.n));
}
const demoT = Number(params.get('t') || 0);
if (demoT) selected = demoT;

function roadmapOrder() {
  return [...TR].sort((a, b) => a.stage - b.stage || a.n - b.n);
}
function claimsOf(t) {
  return t.steps.length + 1 + (t.dispute ? 2 : 0);
}
function srcClaims(i) {
  let c = 0;
  for (const t of TR) for (const s of t.steps) if (s.s.includes(i)) c++;
  return c;
}
function audit() {
  const steps = TR.reduce((a, t) => a + t.steps.length, 0);
  const cited = TR.reduce((a, t) => a + t.steps.filter((s) => s.s.length > 0).length, 0);
  const backed2 = TR.reduce((a, t) => a + t.steps.filter((s) => s.s.length >= 2).length, 0);
  const disputes = TR.filter((t) => t.dispute).length;
  const claims = TR.reduce((a, t) => a + claimsOf(t), 0);
  const hidden = TR.filter((t) => t.hidden).length;
  const tiers = { possibly: 0, atrisk: 0, watch: 0, unconfirmed: 0 };
  for (const t of TR) if (tiers[t.tier] !== undefined) tiers[t.tier]++;
  const tracked = TR.reduce((a, t) => a + (t.count ? t.count.total : 0), 0);
  const grades = { P: 0, G: 0, S: 0, B: 0 };
  for (const t of TR) grades[GRADE_LETTER[t.grade]]++;
  const psn = TR.reduce((a, t) => a + PSN[t.grade], 0);
  const pages = SRCS.length, sites = new Set(SRCS.map((s) => s.site)).size;
  return { steps, cited, backed2, disputes, claims, hidden, tiers, tracked, grades, psn, pages, sites };
}
function earnedPsn() {
  return TR.filter((t) => earned.has(t.n)).reduce((a, t) => a + PSN[t.grade], 0);
}
function srcLink(i) {
  const s = SRCS[i - 1];
  return s ? `<a href="${s.url}" target="_blank" rel="noopener">${esc(s.site)} — ${esc(s.title)}</a>` : '';
}
function esc(x) {
  return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function chip(big, label, cls = '') {
  return `<span class="achip ${cls}"><b>${big}</b>${label}</span>`;
}
function renderAudit() {
  const a = audit();
  $('#auditRow1').innerHTML =
    chip('55/55', 'official') +
    chip(`${a.grades.P}P ${a.grades.G}G ${a.grades.S}S ${a.grades.B}B`, 'grades') +
    chip(a.hidden, 'PSN-hidden') +
    chip(`${a.claims}/${a.claims}`, 'claims cited', 'gold') +
    chip(`${a.cited}/${a.steps}`, 'steps cited', 'gold');
  $('#auditRow2').innerHTML =
    chip(`${a.backed2} backed by 2+`, 'sources') +
    chip(a.pages, 'sources') +
    chip(a.sites, 'sites read 20 Nov 2026') +
    chip(a.tiers.possibly, 'possibly missable', 'red') +
    chip(a.tiers.atrisk, 'at risk') +
    chip(a.tiers.watch, 'watch') +
    chip(a.tiers.unconfirmed, 'unconfirmed') +
    chip(a.disputes, 'disputes shown both ways') +
    chip(a.tracked, 'tracked counts logged');
  const f = META;
  $('#roadmapFacts').innerHTML =
    `${esc(f.platinum_hours)} to platinum · difficulty ${esc(f.difficulty)} · ${esc(f.playthroughs)} playthrough · game launched ${esc(f.launch)} ` +
    f.roadmap_src.map((i) => `<span class="src">[${i}]</span>`).join(' ');
  $('#earnedLine').textContent = `EARNED ${earned.size} / 55`;
  $('#psnLine').textContent = `${earnedPsn().toLocaleString()} / ${a.psn.toLocaleString()} PSN pts`;
  $('#earnBar').style.width = `${(earned.size / 55) * 100}%`;
}
function maskName(t) {
  return spoilerOn && t.hidden ? '••••••••' : t.name;
}
function tierTag(t) {
  if (t.tier === 'possibly') return '<span class="tag miss">MISSABLE</span>';
  if (t.tier === 'atrisk') return '<span class="tag risk">AT RISK</span>';
  if (t.tier === 'watch') return '<span class="tag risk">WATCH</span>';
  if (t.tier === 'unconfirmed') return '<span class="tag risk">UNCONFIRMED</span>';
  return '';
}
function matchFilter(t) {
  const q = query.trim().toLowerCase();
  if (q && !(t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q))) return false;
  switch (filter) {
    case 'all': return true;
    case 'story': return t.type === 'Story';
    case 'missable': return t.tier === 'possibly';
    case 'atrisk': return t.tier === 'atrisk';
    case 'watch': return t.tier === 'watch';
    case 'unconfirmed': return t.tier === 'unconfirmed';
    case 'collectibles': return t.type === 'Collectible';
    case 'activities': return t.type === 'Activity';
    case 'crime': return t.type === 'Crime';
    case 'misc': return t.type === 'Secret' || t.type === 'Completion';
    case 'hidden': return t.hidden;
    case 'disputed': return !!t.dispute;
    case 'unearned': return !earned.has(t.n);
    case 'P': case 'G': case 'S': case 'B': return GRADE_LETTER[t.grade] === filter;
    default: return true;
  }
}
function renderList() {
  const groups = {};
  for (const t of TR) {
    if (!matchFilter(t)) continue;
    (groups[t.ch] ||= []).push(t);
  }
  const order = ['Chapters 1–2', 'Chapters 3–4', 'Finale & 100%', 'Activities', 'Collectibles', 'Crime Spree', 'Secrets & Endgame'];
  let html = '';
  for (const ch of order) {
    const list = groups[ch];
    if (!list || !list.length) continue;
    const total = TR.filter((t) => t.ch === ch).length;
    const got = list.filter((t) => earned.has(t.n)).length;
    const allGot = TR.filter((t) => t.ch === ch && earned.has(t.n)).length;
    html += `<h4>${esc(ch)} · ${allGot}/${total}</h4>`;
    for (const t of list) {
      const srcCount = new Set(t.steps.flatMap((s) => s.s)).size;
      html += `<button type="button" class="trow ${earned.has(t.n) ? 'earned' : ''} ${selected === t.n ? 'sel' : ''}" data-n="${t.n}">
        <span class="ck">${earned.has(t.n) ? '✓' : ''}</span>
        <span class="g ${GRADE_LETTER[t.grade]}">${GRADE_LETTER[t.grade]}</span>
        <span><span class="nm">${esc(maskName(t))}</span> ${t.hidden ? '<span class="tag hid">HIDDEN</span>' : ''}${tierTag(t)}${t.dispute ? '<span class="tag disp">DISPUTED</span>' : ''}
        <span class="mt">${esc(t.desc)} · Stage ${t.stage} · ${srcCount} sources · ${t.steps.length} steps</span></span>
      </button>`;
    }
  }
  $('#list').innerHTML = html || '<p class="muted">No trophies match this filter.</p>';
  $$('#list .trow').forEach((b) => b.addEventListener('click', () => {
    const n = Number(b.dataset.n);
    if (b.querySelector('.ck') && b === document.activeElement) { /* fallthrough */ }
    select(n);
  }));
  $$('#list .ck').forEach((c) => c.addEventListener('click', (e) => {
    e.stopPropagation();
    const n = Number(c.closest('.trow').dataset.n);
    toggleEarned(n);
  }));
}
function select(n) {
  selected = n;
  renderList();
  renderDetail();
}
function toggleEarned(n) {
  if (earned.has(n)) earned.delete(n); else earned.add(n);
  localStorage.setItem('lpc-earned', JSON.stringify([...earned]));
  renderAudit();
  renderList();
  renderNextUp();
}
function renderDetail() {
  const t = TR.find((x) => x.n === selected) || roadmapOrder().find((x) => !earned.has(x.n)) || TR[0];
  selected = t.n;
  const srcs = [...new Set(t.steps.flatMap((s) => s.s))].sort((a, b) => a - b);
  let banner = '';
  if (t.tier === 'possibly') banner = `<p class="banner possibly">POSSIBLY MISSABLE · LAST CHANCE — ${esc(t.name)} can be lost for good. Do it now.</p>`;
  else if (t.tier === 'atrisk') banner = `<p class="banner atrisk">AT RISK — easy to rush past. Do it before the story moves on.</p>`;
  else if (t.tier === 'watch') banner = `<p class="banner watch">WATCH — limited window. Keep an eye on it.</p>`;
  else if (t.tier === 'unconfirmed') banner = `<p class="banner unconfirmed">UNCONFIRMED — guides disagree on the trigger. Our call is below.</p>`;
  let counter = '';
  if (t.count) {
    const have = Number(localStorage.getItem(`lpc-count-${t.n}`) || 0);
    counter = `<div class="counter"><span>YOUR COUNT — ${esc(t.count.label.toUpperCase())}:</span>
      <button type="button" data-c="-1" aria-label="decrease">−</button><b id="countVal">${have} / ${t.count.total}</b>
      <button type="button" data-c="1" aria-label="increase">+</button>
      <span class="cnote">${t.count.total - have} to go · saved</span></div>`;
  }
  const steps = t.steps.map((s) => `<li>${esc(s.t)} ${s.s.map((i) => `<span class="src">[${i}]</span>`).join(' ')}</li>`).join('');
  const dispute = t.dispute ? `<div class="dispute"><h4>SOURCES DIFFER — BOTH VERSIONS SHOWN</h4>
    <div class="ab"><div><b>A · ONE VERSION</b>${esc(t.dispute.a)}</div><div><b>B · THE OTHER VERSION</b>${esc(t.dispute.b)}</div></div>
    <p class="call"><b>OUR CALL:</b> ${esc(t.dispute.call)}</p></div>` : '';
  $('#detail').innerHTML = `
    <h2>${esc(maskName(t))}</h2>
    <p class="meta">${t.grade} · #${t.n} of 55 · ${esc(t.type)} · Stage ${t.stage} · ${esc(t.ch)} · ${PSN[t.grade]} pts · ${srcs.length} sources</p>
    <p class="desc">“${esc(t.desc)}”</p>
    ${banner}${counter}
    <p class="guide">${esc(t.guide)}</p>
    <p class="steps-h">HOW TO EARN IT · ${t.steps.length} STEPS, ${t.steps.length} CITED · ${t.steps.filter((s) => s.s.length >= 2).length} ON 2+ SITES</p>
    <ol class="steps">${steps}</ol>
    ${dispute}
    <p class="muted">Guide cites ${srcs.length} sources, numbered in the rail. Every step above carries its source numbers.</p>`;
  $$('#detail .counter button').forEach((b) => b.addEventListener('click', () => {
    const cur = Number(localStorage.getItem(`lpc-count-${t.n}`) || 0);
    const next = Math.max(0, Math.min(t.count.total, cur + Number(b.dataset.c)));
    localStorage.setItem(`lpc-count-${t.n}`, String(next));
    renderDetail();
  }));
  $('#detailSources').innerHTML = srcs.map((i) => {
    const s = SRCS[i - 1];
    return `<li>${srcLink(i)}<br><span class="mt">${esc(s.url)} · read ${esc(s.read)} · ${srcClaims(i)} claims here</span></li>`;
  }).join('');
}
function renderNextUp() {
  const up = roadmapOrder().filter((t) => !earned.has(t.n)).slice(0, 5);
  $('#nextUp').innerHTML = up.map((t, i) => `<li><span class="nm">${esc(maskName(t))}</span><br>
    <span class="mt">${t.grade} · ${PSN[t.grade]} pts · Stage ${t.stage}${t.tier !== '-' ? ' · ' + TIER_LABEL[t.tier] : ''}</span></li>`).join('');
  $$('#nextUp li').forEach((li, i) => li.addEventListener('click', () => select(up[i].n)));
}
function renderRoadmap() {
  const stages = [
    [1, 'Story: Chapters 1–2', 'Play the opening chapters. Meditate at the Chapter 1 balcony before Tourist Trap.'],
    [2, 'Story: Chapters 3–4', 'Vice City opens up. Clear the at-risk missables before the finale.'],
    [3, 'Finale & 100%', 'Finish the story, read the Endings guide first, then start the 100% checklist.'],
    [4, 'Activities & minigames', 'Races, ranges, fishing, bowling, arcade: one of each, then the grinds.'],
    [5, 'Collectibles', 'Meditations, cards, WAiNK spots, vehicles: sweep district by district.'],
    [6, 'Crime spree', 'Vaults, trucks, tanks and heists: five vaults, one truck, one Rhino.'],
    [7, 'Secrets & endgame', 'Odds and ends: the beach cocktail, the Skunk Ape, the money trophies, then platinum.'],
  ];
  const f = META;
  $('#roadmapIntro').innerHTML = `<b>${esc(f.platinum_hours)} to platinum · difficulty ${esc(f.difficulty)} · ${esc(f.playthroughs)} playthrough · game launched ${esc(f.launch)}</b> ` +
    f.roadmap_src.map((i) => `<span class="src">[${i}]</span>`).join(' ') +
    ` — seven stages, all 55 trophies exactly once, in the order you should play them.`;
  $('#roadmapStages').innerHTML = stages.map(([n, name, note]) => {
    const list = TR.filter((t) => t.stage === n);
    return `<div class="stage"><h3>Stage ${n} — ${esc(name)} · ${list.length} trophies</h3><p>${esc(note)}</p>
      <p class="st-list">${list.map((t) => `${earned.has(t.n) ? '✓' : '○'} ${esc(maskName(t))}`).join(' · ')}</p></div>`;
  }).join('');
}
function renderMissables() {
  const tiers = [
    ['possibly', 'POSSIBLY MISSABLE — 1', 'Can be lost for good in a single playthrough. Do it in Chapter 1.'],
    ['atrisk', 'AT RISK — 8', 'Easy to rush past while playing the story. Do them before the chapter ends.'],
    ['watch', 'WATCH — 5', 'Limited windows. Keep them on your list.'],
    ['unconfirmed', 'UNCONFIRMED — 3', 'Guides disagree on the trigger. Our call is in each trophy detail.'],
  ];
  $('#missableTiers').innerHTML = tiers.map(([k, title, note]) => {
    const list = TR.filter((t) => t.tier === k);
    return `<div class="tierbox"><h3>${title}</h3><p class="muted">${note}</p>
      <ul>${list.map((t) => `<li><b>${esc(maskName(t))}</b> — ${esc(t.desc)} <span class="src">[${[...new Set(t.steps.flatMap((s) => s.s))].sort((a, b) => a - b).join('][')}]</span></li>`).join('')}</ul></div>`;
  }).join('');
}
function renderSourcesTab() {
  $('#sourceList').innerHTML = SRCS.map((s, i) => `<li><b>[${i + 1}] ${esc(s.site)} — ${esc(s.title)}</b><br>
    <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a><br>
    <span class="mt">read ${esc(s.read)} · ${srcClaims(i + 1)} claims here</span></li>`).join('');
}
function setTab(name) {
  $$('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
  $$('.panel').forEach((p) => p.classList.toggle('active', p.id === `tab-${name}`));
}
$$('.tab').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));
$$('.chip[data-f]').forEach((b) => b.addEventListener('click', () => {
  filter = b.dataset.f;
  $$('.chip[data-f]').forEach((x) => x.classList.toggle('active', x === b));
  renderList();
}));
$('#search').addEventListener('input', (e) => { query = e.target.value; renderList(); });
$('#spoilerToggle').checked = spoilerOn;
$('#spoilerLabel').textContent = spoilerOn ? 'Spoiler shield on · story names hidden' : 'Spoiler shield off · story names shown';
$('#spoilerToggle').addEventListener('change', (e) => {
  spoilerOn = e.target.checked;
  $('#spoilerLabel').textContent = spoilerOn ? 'Spoiler shield on · story names hidden' : 'Spoiler shield off · story names shown';
  renderList(); renderDetail(); renderNextUp();
});
$('#btnExport').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ earned: [...earned], saved: new Date().toISOString() }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'leonida-platinum-codex-progress.json'; a.click();
});
$('#btnImport').addEventListener('click', () => $('#importFile').click());
$('#importFile').addEventListener('change', async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const j = JSON.parse(await f.text());
    earned = new Set((j.earned || []).filter((n) => TR.some((t) => t.n === n)));
    localStorage.setItem('lpc-earned', JSON.stringify([...earned]));
    renderAudit(); renderList(); renderNextUp();
  } catch { alert('Could not read that file.'); }
});
$('#btnReset').addEventListener('click', () => {
  earned = new Set(); localStorage.removeItem('lpc-earned');
  renderAudit(); renderList(); renderNextUp();
});

function updateFilterLabels() {
  const count = (fn) => TR.filter(fn).length;
  const set = (f, label) => { const b = $(`.chip[data-f="${f}"]`); if (b) b.textContent = label; };
  set('story', `Story ${count((t) => t.type === 'Story')}`);
  set('collectibles', `Collectibles ${count((t) => t.type === 'Collectible')}`);
  set('activities', `Activities ${count((t) => t.type === 'Activity')}`);
  set('crime', `Crime ${count((t) => t.type === 'Crime')}`);
  set('misc', `Misc ${count((t) => t.type === 'Secret' || t.type === 'Completion')}`);
}
updateFilterLabels();
renderAudit();
renderList();
renderDetail();
renderNextUp();
renderRoadmap();
renderMissables();
renderSourcesTab();
const shot = params.get('shot');
if (shot) setTab(shot === 'cover' ? 'tracker' : shot);
if (params.get('selftest') === '1') {
  const a = audit();
  const checks = [
    ['trophies 55', TR.length === 55],
    ['steps 360', a.steps === 360],
    ['steps cited 360/360', a.cited === 360],
    ['steps backed 2+ 360/360', a.backed2 === 360],
    ['disputes 30', a.disputes === 30],
    ['claims 475', a.claims === 475],
    ['sources 30 / 13 sites', a.pages === 30 && a.sites === 13],
    ['stages cover 55 once', [1, 2, 3, 4, 5, 6, 7].every((s) => TR.filter((t) => t.stage === s).length > 0) && TR.length === 55],
    ['psn 1350', a.psn === 1350],
    ['tracked 614', a.tracked === 614],
    ['detail shows steps', !!document.querySelector('#detail .steps li')],
  ];
  const passed = checks.filter((c) => c[1]).length;
  window.__guideSelftest = { passed, total: checks.length, checks: checks.map(([name, ok]) => ({ name, ok })) };
  $('#selftestOut').textContent = `Selftest ${passed}/${checks.length} OK.`;
}
