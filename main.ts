// Leonida Platinum Codex — the entry program for gta6-trophy-guide-01 (Node 22, standard
// library only). The guide itself is this directory's app/ folder: plain static files that
// open at app/index.html in a desktop browser and work with the network off. Its trophy
// list and guides live in app/data/trophies.json, its tracker in app/app.js, its look in
// app/style.css. This program hands the guide in: it copies app/ and screenshots/ from
// beside this file into /output and writes /output/dossier.json, the summary the judge
// reads (the screenshots, the first load's files and bytes, and the source outline),
// using the vendored make.fun library. Leave vendor/makefun-frontend.ts untouched: the
// scorer requires dossier.json to be byte for byte what its own copy of the library writes.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the
// other limits refuse an entry the scorer would refuse anyway (more than 4 screenshots
// or one over 256 KiB; more than 993 files and directories in app/ or 48 MiB of app
// files — app/ counts beside /output's own 1000-entry cap, together with screenshots/
// and dossier.json).
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
