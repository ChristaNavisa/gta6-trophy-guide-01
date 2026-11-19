// Leonida Platinum Codex — tracker, filters, spoiler setting, roadmap and missables.
// Data: app/data/trophies.json (official names, descriptions, grades + our own guides).
// Progress: localStorage only, exportable to JSON and importable back. No network at run time.

const STORAGE_KEY = 'leonida-platinum-codex-progress-v1';
const SPOILER_KEY = 'leonida-platinum-codex-spoilers-v1';
const DATA_URL = 'data/trophies.json';

const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];
const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const KIND_LABEL = {
  story: 'Story', side: 'Side strand', collectibles: 'Collectible', activities: 'Activity',
  combat: 'Combat', exploration: 'Exploration', misc: 'Odd job', completion: 'Completion',
};

const STAGES = [
  { title: 'Play the story — Chapters 1–4 and the finale', stage: 1,
    text: 'Follow the story missions in order. Every chapter trophy and every named-mission trophy pops from story progress alone — no side objective is needed. Finish each chapter before moving on; the 12 story trophies and the gold final-mission trophy all land here.' },
  { title: 'Character strands and strangers', stage: 2,
    text: 'Work the side chains while the story is fresh: the final missions for Andy, Kenton, Billy, Randy and Tyrone, the hunt for Bret, and 8 stranger strands across Leonida. Strangers appear as markers on the map — talk to every one you find and finish each chain.' },
  { title: 'Collectibles and exploration', stage: 3,
    text: 'Sweep Leonida once, properly: 18 meditation spots, 3 collectible card sets, 100 WAiNK locations, 100 vehicles discovered, all 52 areas explored, and all 8 garage properties bought. These share the same long drives, so do them together and tick them off as you go.' },
  { title: 'Activities and challenges', stage: 4,
    text: 'Sample every activity, then grind the counted ones: 250 stunts, gold in all 42 Shooting Range challenges, drone-race wins at all 14 locations, 20 different race wins, 50 challenges, plus fishing against Cal, one arcade game, bowling at Kolt & Associates, and one melee drive-by.' },
  { title: 'Combat, heists and heat', stage: 5,
    text: 'The loud half of the list: 5 enemies in one Combat Focus, 3 shops back-to-back with your partner, a 4-star escape with your partner, 5 bank vaults, one armored truck, one illegal operation per gang, a stealth jewelry-store robbery, a Rhino encounter and an unscheduled departure at VCIA.' },
  { title: 'Money, moments and the platinum', stage: 6,
    text: 'Spend $100,000 across all shops, launder $250,000 of marked bills, register 10 vehicles to the Scooter Bros app, enjoy the Ocean Beach cocktail, smash out of a showroom, and let the slow counters (500 choices, the strange sighting, the second-try moment) finish. 100% completion and the platinum pop last.' },
];

let trophies = [];
let earned = new Set();
let selectedId = null;
let activeKind = 'all';
let hideSpoilers = false;

const $ = (id) => document.getElementById(id);

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) earned = new Set(JSON.parse(raw).filter((n) => Number.isInteger(n)));
  } catch { earned = new Set(); }
  hideSpoilers = localStorage.getItem(SPOILER_KEY) === '1';
  $('spoilerToggle').checked = hideSpoilers;
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

function saveSpoilerSetting() {
  localStorage.setItem(SPOILER_KEY, hideSpoilers ? '1' : '0');
}

function trophyById(id) {
  return trophies.find((t) => t.id === id);
}

function isSpoilerHidden(t) {
  return hideSpoilers && t.kind === 'story' && !earned.has(t.id);
}

function displayName(t) {
  return isSpoilerHidden(t) ? 'Hidden trophy — earn it to reveal' : t.name;
}

function displayDesc(t) {
  return isSpoilerHidden(t) ? 'A story trophy. Its name and description stay hidden until you earn it.' : t.description;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function medalHtml(t) {
  const short = { platinum: 'PLAT', gold: 'GOLD', silver: 'SILV', bronze: 'BRNZ' }[t.grade];
  return `<span class="medal ${t.grade}" aria-hidden="true">${short}</span>`;
}

function tagHtml(t) {
  const tags = [`<span class="tag grade-${t.grade}">${GRADE_LABEL[t.grade]}</span>`];
  tags.push(`<span class="tag">${KIND_LABEL[t.kind] || t.kind}</span>`);
  if (t.missable) tags.push('<span class="tag miss">Missable</span>');
  if (t.target) tags.push(`<span class="tag">${escapeHtml(String(t.target))} ${escapeHtml(t.targetUnit || '')}</span>`);
  if (t.difficulty) tags.push(`<span class="tag">${escapeHtml(t.difficulty)}</span>`);
  return tags.join('');
}

function itemHtml(t) {
  const checked = earned.has(t.id) ? ' checked' : '';
  const sel = selectedId === t.id ? ' selected' : '';
  const done = earned.has(t.id) ? ' earned' : '';
  return `<li class="trophy-item${sel}${done}" data-id="${t.id}" role="button" tabindex="0">
    <input type="checkbox" data-check="${t.id}"${checked} aria-label="Mark ${escapeHtml(displayName(t))} as earned" tabindex="-1">
    <span><span class="trophy-name">${escapeHtml(displayName(t))}</span>
    <span class="trophy-desc">${escapeHtml(displayDesc(t))}</span>
    <span class="tag-row">${tagHtml(t)}</span></span>
    ${medalHtml(t)}
  </li>`;
}

function filteredTrophies() {
  const q = $('searchBox').value.trim().toLowerCase();
  const grade = $('gradeFilter').value;
  const show = $('earnedFilter').value;
  return trophies.filter((t) => {
    if (activeKind === 'missable' ? !t.missable : activeKind !== 'all' && t.kind !== activeKind) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (show === 'todo' && earned.has(t.id)) return false;
    if (show === 'done' && !earned.has(t.id)) return false;
    if (q) {
      const hay = `${t.name} ${t.description} ${t.guide} ${KIND_LABEL[t.kind] || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderList() {
  const list = filteredTrophies();
  $('trophyList').innerHTML = list.length
    ? list.map(itemHtml).join('')
    : '<li class="no-results">No trophies match these filters. Clear the search or pick another kind.</li>';
  $('resultCount').textContent = `Showing ${list.length} of 55`;
  renderMissables();
}

function renderProgress() {
  const total = trophies.length || 55;
  const n = earned.size;
  const pct = Math.round((n / total) * 100);
  $('statEarned').textContent = `${n} / ${total}`;
  $('statPct').textContent = `${pct}%`;
  $('ringPct').textContent = `${pct}%`;
  $('ringCount').textContent = `${n} / ${total}`;
  $('ringFg').style.strokeDashoffset = String(389.6 * (1 - n / total));
  $('gradeBars').innerHTML = GRADE_ORDER.map((g) => {
    const all = trophies.filter((t) => t.grade === g);
    const got = all.filter((t) => earned.has(t.id)).length;
    const p = all.length ? Math.round((got / all.length) * 100) : 0;
    return `<div class="grade-bar"><span>${GRADE_LABEL[g]} · ${got}/${all.length}</span>
      <span class="track"><span class="fill ${g}" style="display:block;width:${p}%"></span></span>
      <span>${p}%</span></div>`;
  }).join('');
}

function renderDetail() {
  const pane = $('detailPane');
  const t = selectedId ? trophyById(selectedId) : null;
  if (!t) {
    pane.innerHTML = '<p class="detail-empty">Select a trophy to read its guide, sources and tips.</p>';
    return;
  }
  const hidden = isSpoilerHidden(t);
  const sources = (t.sources && t.sources.length ? t.sources : [
    'Exophase — Grand Theft Auto VI trophy list: https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/',
    'PSNProfiles — Grand Theft Auto VI trophy list: https://psnprofiles.com/trophies/43531-grand-theft-auto-vi',
  ]);
  const sourceLinks = sources.map((s) => {
    const m = s.match(/(https?:\/\/\S+)/);
    if (!m) return `<li>${escapeHtml(s)}</li>`;
    const url = m[1].replace(/\/$/, '');
    return `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(s.replace(m[1], '').replace(/^ — |^ - /, '') || url)}</a></li>`;
  }).join('');
  pane.innerHTML = `
    <h2>${escapeHtml(displayName(t))}</h2>
    <p class="official">“${escapeHtml(displayDesc(t))}” — official description, as PlayStation publishes it.</p>
    <div class="meta">${tagHtml(t)}</div>
    <h3>Guide</h3>
    <p>${escapeHtml(t.guide)}</p>
    ${t.target ? `<p><strong>PSN target:</strong> ${escapeHtml(String(t.target))} ${escapeHtml(t.targetUnit || '')}.</p>` : ''}
    ${t.time ? `<p><strong>Rough time:</strong> ${escapeHtml(t.time)}.</p>` : ''}
    ${t.missable ? '<div class="warn">Missable: this trophy is tied to a story chapter or mission. Replay the mission from the mission replay menu if you miss it — finish each chapter before moving on and you will not need to.</div>' : ''}
    <h3>Sources</h3>
    <ul class="sources">${sourceLinks}</ul>
    <p class="sources">Guides are written in our own words for this entry. Where a guide says “not yet verified in play”, its advice is drawn from the official description alone.</p>
    <button type="button" class="btn primary earned-btn" id="detailToggle">${earned.has(t.id) ? '✓ Earned — unmark' : 'Mark as earned'}</button>`;
  $('detailToggle').addEventListener('click', () => toggleEarned(t.id));
}

function renderRoadmap() {
  $('roadmapList').innerHTML = STAGES.map((s) => {
    const members = trophies.filter((t) => t.stage === s.stage);
    const chips = members.map((t) => {
      const done = earned.has(t.id) ? ' done' : '';
      return `<button type="button" class="mini${done}" data-goto="${t.id}">${escapeHtml(t.name)}</button>`;
    }).join('');
    return `<li class="stage"><h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.text)}</p>
      <div class="stage-trophies">${chips}</div></li>`;
  }).join('');
}

function renderMissables() {
  const miss = trophies.filter((t) => t.missable);
  $('missCount').textContent = String(miss.length);
  $('statMiss').textContent = String(miss.length);
  const el = $('missableList');
  if (!el) return;
  el.innerHTML = miss.map(itemHtml).join('');
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
}

function toggleEarned(id) {
  if (earned.has(id)) earned.delete(id); else earned.add(id);
  saveProgress();
  renderAll();
}

function showView(name) {
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${name}`));
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
}

function selectTrophy(id) {
  selectedId = id;
  renderList();
  renderDetail();
  document.querySelectorAll('.trophy-item.selected').forEach((el) => el.scrollIntoView({ block: 'nearest' }));
}

function exportProgress() {
  const data = { app: 'Leonida Platinum Codex', game: 'Grand Theft Auto VI', exportedAt: new Date().toISOString(), earned: [...earned].sort((a, b) => a - b) };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
  $('saveNote').textContent = `Exported ${earned.size} earned trophies to gta6-trophy-progress.json.`;
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      const ids = Array.isArray(data) ? data : data.earned;
      if (!Array.isArray(ids)) throw new Error('no earned list');
      const valid = new Set(trophies.map((t) => t.id));
      earned = new Set(ids.filter((n) => valid.has(n)));
      saveProgress();
      renderAll();
      $('saveNote').textContent = `Imported ${earned.size} earned trophies from ${file.name}.`;
    } catch {
      $('saveNote').textContent = `Could not read ${file.name}: it is not a progress file from this guide.`;
    }
  };
  reader.readAsText(file);
}

async function boot() {
  loadProgress();
  const res = await fetch(DATA_URL);
  const data = await res.json();
  trophies = data.trophies;
  if (selectedId === null && trophies.length) selectedId = trophies[0].id;

  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => showView(b.dataset.view)));
  $('searchBox').addEventListener('input', renderList);
  $('gradeFilter').addEventListener('change', renderList);
  $('earnedFilter').addEventListener('change', renderList);
  $('spoilerToggle').addEventListener('change', (e) => {
    hideSpoilers = e.target.checked;
    saveSpoilerSetting();
    renderAll();
  });
  $('kindChips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    activeKind = chip.dataset.kind;
    document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === chip));
    renderList();
  });
  $('exportBtn').addEventListener('click', exportProgress);
  $('importFile').addEventListener('change', (e) => { if (e.target.files[0]) importProgress(e.target.files[0]); e.target.value = ''; });
  $('resetBtn').addEventListener('click', () => {
    if (window.confirm('Clear every earned tick? This cannot be undone — export first if you want a backup.')) {
      earned = new Set();
      saveProgress();
      renderAll();
    }
  });

  document.addEventListener('click', (e) => {
    const check = e.target.closest('[data-check]');
    if (check) {
      e.preventDefault();
      e.stopPropagation();
      toggleEarned(Number(check.dataset.check));
      return;
    }
    const item = e.target.closest('.trophy-item');
    if (item) { selectTrophy(Number(item.dataset.id)); return; }
    const mini = e.target.closest('[data-goto]');
    if (mini) {
      showView('tracker');
      selectTrophy(Number(mini.dataset.goto));
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const item = e.target.closest && e.target.closest('.trophy-item');
    if (item) { e.preventDefault(); selectTrophy(Number(item.dataset.id)); }
  });

  renderAll();
}

boot();
