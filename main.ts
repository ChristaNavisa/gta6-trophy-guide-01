// Leonida Platinum Codex v4 — gta6-trophy-guide-01 entry (Node 22, standard
// library only). The guide is this directory's app/ folder: plain static files
// a browser opens at app/index.html (ES modules, CSS, no build step), offline.
// It hands the app in: copies app/ and screenshots/ from beside this file to
// /output and writes /output/dossier.json with the vendored make.fun library.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Before copying, it validates the guide data and the screenshots against the
// gate's shapes, and after writing it rebuilds the dossier fresh and refuses
// to finish unless the two are byte-identical.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function fail(msg: string): never {
  console.error(`main.ts: ${msg}`);
  process.exit(1);
}

// --- Validate the guide data (same numbers the app computes at runtime). ---
const data = JSON.parse(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8'));
const trophies = data.trophies;
const sources = data.sources;
if (!Array.isArray(trophies) || trophies.length !== 55) fail(`expected 55 trophies, got ${trophies?.length}`);
if (!Array.isArray(sources) || sources.length !== 30) fail(`expected 30 sources, got ${sources?.length}`);
let steps = 0;
let disputes = 0;
for (const t of trophies) {
  if (typeof t.guide !== 'string' || !t.guide.trim()) fail(`trophy #${t.n} has no text guide`);
  if (!Array.isArray(t.steps) || t.steps.length === 0) fail(`trophy #${t.n} has no steps`);
  for (const s of t.steps) {
    if (!Array.isArray(s.s) || s.s.length < 2) fail(`trophy #${t.n} has a step cited by fewer than 2 sources`);
    for (const i of s.s) {
      if (!Number.isInteger(i) || i < 1 || i > sources.length) fail(`trophy #${t.n} cites source #${i}, which does not exist`);
    }
    steps++;
  }
  if (t.dispute) disputes++;
}
if (steps !== 360) fail(`expected 360 cited steps, got ${steps}`);
if (disputes !== 30) fail(`expected 30 SOURCES DIFFER panels, got ${disputes}`);
// Every source must be cited by at least one step: an unread source in the
// list would be a headline number the guide does not actually use.
const citedSources = new Set<number>();
for (const t of trophies) for (const s of t.steps) for (const i of s.s) citedSources.add(i);
for (let i = 1; i <= sources.length; i++) {
  if (!citedSources.has(i)) fail(`source #${i} (${sources[i - 1].site}) is never cited by any step`);
}
const claims = steps + trophies.length + disputes * 2;
if (claims !== 475) fail(`expected 475 claims, got ${claims}`);

// --- Validate the screenshots (gate: 3-4 images, each at most 256 KiB). ---
const shotDir = join(here, 'screenshots');
if (!existsSync(shotDir)) fail('screenshots/ is missing');
const shots = readdirSync(shotDir).filter((f) => !f.startsWith('.')).sort();
if (shots.length < 3 || shots.length > 4) fail(`expected 3-4 screenshots, got ${shots.length}`);
for (const f of shots) {
  const size = statSync(join(shotDir, f)).size;
  if (size > 262144) fail(`screenshot ${f} is ${size} bytes, over the 256 KiB cap`);
}

// --- Hand in: clear the output dir's contents (never the dir itself: the
// grader mounts it, and rmSync on a mount point throws EBUSY), then copy. ---
mkdirSync(out, { recursive: true });
for (const f of readdirSync(out)) rmSync(join(out, f), { recursive: true, force: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotDir, join(out, 'screenshots'), { recursive: true });

const opts = { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 };
const dossier = buildDossier(out, opts);
writeFileSync(join(out, 'dossier.json'), dossier);

// --- Byte-compare against a fresh build of the same dossier. ---
const fresh = buildDossier(out, opts);
const a = Buffer.from(dossier as unknown as Uint8Array);
const b = Buffer.from(fresh as unknown as Uint8Array);
if (!a.equals(b)) fail('dossier.json is not byte-identical to a fresh buildDossier run');

console.log(`Leonida Platinum Codex: 55 trophies, ${steps} cited steps (${steps} backed by 2+ sources), ${disputes} SOURCES DIFFER panels, ${claims} claims cited; ${shots.length} screenshots; dossier ${a.length} bytes, byte-identical to a fresh build.`);
