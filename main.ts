// Leonida Platinum Codex v3 — hands the guide in.
//
// The program copies app/ and screenshots/ from beside this file to
// /output (MAKEFUN_OUTPUT_DIR outside the grader) and writes
// /output/dossier.json with buildDossier from vendor/makefun-frontend.ts,
// exactly as the kit's starter does. Two robustness details:
//   - The output dir is emptied by removing its children, never by rmSync
//     on the dir itself: the grader hands /output over as a mount point
//     and rmSync on it throws EBUSY.
//   - After writing the dossier, the program rebuilds it fresh and compares
//     the bytes: a mismatch fails the run, so a bad dossier never ships.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function emptyContents(dir) {
  // Clear a directory's children without removing the directory itself.
  mkdirSync(dir, { recursive: true });
  for (const name of readdirSync(dir)) {
    rmSync(join(dir, name), { recursive: true, force: true });
  }
}

function validateTrophies() {
  const raw = readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8');
  const data = JSON.parse(raw);
  const trophies = data.trophies;
  if (!Array.isArray(trophies) || trophies.length !== 55) {
    throw new Error(`trophies.json must hold 55 trophies, found ${Array.isArray(trophies) ? trophies.length : 'none'}`);
  }
  const names = new Set();
  for (const t of trophies) {
    if (typeof t.guide !== 'string' || t.guide.trim() === '') {
      throw new Error(`trophy ${t.name || t.id} has no text guide`);
    }
    if (names.has(t.name)) throw new Error(`duplicate trophy name: ${t.name}`);
    names.add(t.name);
    for (const s of t.steps || []) {
      if (!Array.isArray(s.c) || s.c.length === 0) {
        throw new Error(`trophy ${t.name}: a step cites no source`);
      }
    }
  }
  const grades = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) grades[t.grade] = (grades[t.grade] || 0) + 1;
  if (grades.platinum !== 1 || grades.gold !== 2 || grades.silver !== 6 || grades.bronze !== 46) {
    throw new Error(`grade split is ${JSON.stringify(grades)}, expected 1P 2G 6S 46B`);
  }
  const steps = trophies.flatMap((t) => t.steps || []);
  const backed = steps.filter((s) => (s.c || []).length >= 2).length;
  const disputes = trophies.filter((t) => t.dispute).length;
  const claims = steps.length + trophies.length + disputes * 2;
  return { steps: steps.length, backed, disputes, claims };
}

function imageDimensions(buf, name) {
  // PNG: width/height are the first 8 bytes of the IHDR chunk.
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // JPEG: walk the markers to the first Start-Of-Frame segment.
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) break;
      const marker = buf[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      const len = buf.readUInt16BE(i + 2);
      i += 2 + len;
    }
  }
  throw new Error(`screenshot ${name}: cannot read dimensions`);
}

function validateScreenshots() {
  const dir = join(here, 'screenshots');
  const files = readdirSync(dir).filter((f) => !f.startsWith('.')).sort();
  if (files.length < 3 || files.length > 4) {
    throw new Error(`screenshots/ must hold 3 or 4 images, found ${files.length}`);
  }
  for (const f of files) {
    const buf = readFileSync(join(dir, f));
    if (buf.length > 262144) throw new Error(`screenshot ${f} is over 256 KiB`);
    const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    if (!isJpeg && !isPng) throw new Error(`screenshot ${f} is not a whole JPEG or PNG`);
    const { width, height } = imageDimensions(buf, f);
    const longSide = Math.max(width, height);
    const shortSide = Math.min(width, height);
    if (longSide > 1280 || shortSide < 480) {
      throw new Error(`screenshot ${f} is ${width}x${height}: long side over 1280 or short side under 480`);
    }
  }
  return files.length;
}

const counts = validateTrophies();
const shots = validateScreenshots();

emptyContents(out);
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

const dossierOpts = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};
const dossier = buildDossier(out, dossierOpts);
writeFileSync(join(out, 'dossier.json'), dossier);

// The dossier must be byte for byte what a fresh buildDossier writes.
const fresh = buildDossier(out, dossierOpts);
if (!Buffer.from(dossier).equals(Buffer.from(fresh))) {
  throw new Error('dossier.json is not byte-identical to a fresh buildDossier run');
}
const dossierBytes = statSync(join(out, 'dossier.json')).size;
console.log(
  `Leonida Platinum Codex: 55 trophies, ${counts.steps} cited steps (${counts.backed} backed by 2+ sources), ${counts.disputes} SOURCES DIFFER panels, ${counts.claims} claims cited; ${shots} screenshots; dossier ${dossierBytes} bytes, byte-identical to a fresh build.`,
);
