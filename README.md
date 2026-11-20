# Leonida Platinum Codex

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/ChristaNavisa/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/ChristaNavisa/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI — built for the [gta6-trophy-guide-01 bounty on make.fun](https://make.fun/bounty/gta6-trophy-guide-01).

**What it is:** a light, paper-bright tracker that reads at a glance. 55 trophies with their official names, descriptions and grades; 360 numbered steps, every one cited and every one backed by 2+ sources; 30 SOURCES DIFFER panels that show both versions of a disputed claim plus our call; an audit strip computed from the data (never typed by hand); missable risk tiers (1 possibly missable · 8 at risk · 5 watch · 3 unconfirmed); a 7-stage roadmap to the platinum; PSN points and collectible counters; filters, search, a spoiler shield, and export/import of progress — all saved in the browser, all working with the network off.

**How to try it:** `node serve.ts`, then open http://localhost:8080. Add `?demo=1` for the cover state (12/55 earned) or `?selftest=1` to run the built-in checks.

**How it is handed in:** `MAKEFUN_OUTPUT_DIR=out node main.ts` copies `app/` and `screenshots/` to the output dir and writes `dossier.json` with the kit's `buildDossier`; the program verifies the dossier is byte-identical to a fresh build.
