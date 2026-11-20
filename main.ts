// Leonida Platinum Codex — gta6-trophy-guide-01 entry (Node 22, standard library only).
// Developed from the kit starter: the guide is this directory's app/ folder, plain static
// files a browser opens at app/index.html, offline — it loads nothing over the network, and
// its trophy list and guides are app/data/trophies.json. The program hands it in: it copies
// app/ and screenshots/ from beside this file to /output and writes /output/dossier.json,
// the summary the judge reads (your screenshots, the first load's files and bytes, and your
// source), with the vendored make.fun library. Leave vendor/makefun-frontend.ts as it is:
// the scorer requires dossier.json to be byte for byte what its own copy writes.
//
// Differences from the starter, all deliberate:
//  - The output dir is never removed: its CONTENTS are emptied instead, so main.ts works
//    when /output is a mount point (rmSync(outputDir) throws EBUSY there).
//  - trophies.json is validated before anything is copied: 55 trophies, unique names,
//    every guide a non-empty string, every step cited, grades 1P/2G/6S/46B.
//  - Screenshots are validated: 3-4 files, each <= 256 KiB, JPEG or PNG by magic bytes.
//  - The dossier is built twice and byte-compared: the written dossier.json must equal a
//    fresh buildDossier run, or the program fails instead of handing in a stale file.
//  - A one-line audit summary is printed (claims, steps backed by 2+ sources, disputes).
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const SHOT_MAX = 4;
const SHOT_MAX_BYTES = 262144;
const APP_MAX_FILES = 993;
const APP_MAX_BYTES = 50331648;
const DOSSIER_TEXT_MAX = 163840;

function fail(message: string): never {
  throw new Error('main.ts: ' + message);
}

// Empty a directory's contents without removing the directory itself: safe when the
// output directory is a mount point, where rmSync(dir, { recursive: true }) throws EBUSY.
function emptyContents(dir: string): void {
  mkdirSync(dir, { recursive: true });
  for (const name of readdirSync(dir)) {
    rmSync(join(dir, name), { recursive: true, force: true });
  }
}

function validateTrophies(): { trophies: number; steps: number; claims: number; backed2: number; disputes: number } {
  const dataPath = join(here, 'app', 'data', 'trophies.json');
  if (!existsSync(dataPath)) fail('app/data/trophies.json is missing');
  const data = JSON.parse(readFileSync(dataPath, 'utf8')) as any;
  const trophies = data.trophies as any[];
  if (!Array.isArray(trophies) || trophies.length !== 55) fail('trophies.json must hold exactly 55 trophies, found ' + (trophies?.length ?? 0));
  const names = new Set<string>();
  const grades: Record<string, number> = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  let steps = 0, backed2 = 0, disputes = 0;
  for (const t of trophies) {
    if (typeof t.name !== 'string' || !t.name) fail('trophy ' + t.id + ' has no name');
    if (names.has(t.name)) fail('duplicate trophy name: ' + t.name);
    names.add(t.name);
    if (typeof t.guide !== 'string' || !t.guide.trim()) fail('trophy ' + t.name + ' has an empty guide (guides must be full text, never stubs)');
    if (!(t.grade in grades)) fail('trophy ' + t.name + ' has an unknown grade: ' + t.grade);
    grades[t.grade]++;
    if (!Array.isArray(t.steps) || t.steps.length === 0) fail('trophy ' + t.name + ' has no steps');
    for (const s of t.steps) {
      steps++;
      if (!Array.isArray(s.s) || s.s.length === 0) fail('trophy ' + t.name + ' has an uncited step: ' + s.t);
      if (s.s.length >= 2) backed2++;
    }
    if (t.dispute) disputes++;
  }
  if (grades.platinum !== 1 || grades.gold !== 2 || grades.silver !== 6 || grades.bronze !== 46) {
    fail('grade split must be 1P/2G/6S/46B, found ' + JSON.stringify(grades));
  }
  const claims = steps + trophies.length + disputes * 2;
  return { trophies: trophies.length, steps, claims, backed2, disputes };
}

function validateScreenshots(): string[] {
  const dir = join(here, 'screenshots');
  if (!existsSync(dir)) fail('screenshots/ is missing (need 3-4 screenshots, first by name is the cover)');
  const files = readdirSync(dir).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
  if (files.length < 3 || files.length > SHOT_MAX) fail('need 3-4 screenshots, found ' + files.length);
  for (const f of files) {
    const p = join(dir, f);
    const size = statSync(p).size;
    if (size > SHOT_MAX_BYTES) fail('screenshot ' + f + ' is ' + size + ' bytes, over the 256 KiB cap');
    const magic = readFileSync(p).subarray(0, 8);
    const isJpeg = magic[0] === 0xff && magic[1] === 0xd8 && magic[2] === 0xff;
    const isPng = magic[0] === 0x89 && magic[1] === 0x50 && magic[2] === 0x4e && magic[3] === 0x47;
    if (!isJpeg && !isPng) fail('screenshot ' + f + ' is not a JPEG or PNG (bad magic bytes)');
  }
  return files;
}

const audit = validateTrophies();
const shots = validateScreenshots();

emptyContents(out);
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
const caps = { text_max_bytes: DOSSIER_TEXT_MAX, screenshots: { max: SHOT_MAX, max_bytes: SHOT_MAX_BYTES }, app_max_files: APP_MAX_FILES, app_max_bytes: APP_MAX_BYTES };
const dossier = buildDossier(out, caps);
writeFileSync(join(out, 'dossier.json'), dossier);

// Byte-compare: the written dossier must equal a fresh buildDossier run, or fail loudly.
// (Compare BYTES, not object identity: two Uint8Arrays with identical bytes are still
// !== as objects — the first version of this check failed every run for exactly that reason.)
const fresh = buildDossier(out, caps);
const sameBytes = fresh.length === dossier.length && fresh.every((b, i) => b === dossier[i]);
if (!sameBytes) fail('dossier.json is not byte-equal to a fresh buildDossier run — refusing to hand in a stale dossier');

console.log(
  'Leonida Platinum Codex: ' + audit.trophies + ' trophies, ' + audit.steps + ' cited steps (' +
  audit.backed2 + ' backed by 2+ sources), ' + audit.disputes + ' SOURCES DIFFER panels, ' +
  audit.claims + ' claims cited; ' + shots.length + ' screenshots; dossier ' + dossier.length + ' bytes, byte-identical to a fresh build.',
);
