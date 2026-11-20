[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/ChristaNavisa/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/ChristaNavisa/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Platinum Codex — GTA 6 Trophy Guide

**475 claims cited · 360/360 steps backed by 2+ sources · 30 SOURCES DIFFER panels · 30 sources across 13 sites, read 20 Nov 2026**

The complete GTA VI trophy guide for PlayStation 5: all 55 trophies, every step cited, every dispute shown both ways, a 7-stage roadmap to platinum (~200 h · difficulty 4/10 · 1 playthrough), missable risk tiers computed from the data, and an offline tracker with export/import.

## What it is

A static web app (`app/`, no build step) that turns the official trophy list into a working platinum tracker:

- **Tracker** — every trophy with its full text guide, numbered cited steps with inline `[n]` source chips, SOURCES DIFFER panels where guides disagree, per-trophy counters, and a spoiler shield toggle.
- **Roadmap** — 7 stages covering all 55 trophies exactly once, with cited roadmap facts.
- **Missables** — risk tiers: 1 possibly missable · 8 at risk · 5 watch · 3 unconfirmed.
- **Sources** — 30 sources across 13 sites, each verified to resolve, dated 20 Nov 2026, with per-source claim counts.
- **Audit** — every number on the cover is computed from the data at runtime (claims, steps, sources, tiers, PSN points, tracked counts), never typed by hand.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Hand it in (writes `/output`, or `MAKEFUN_OUTPUT_DIR` outside the grader):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` validates the guide data (55 trophies, 360 cited steps, 30 disputes, 475 claims) and the screenshots (4 images, each ≤ 256 KiB), then writes `dossier.json` via the kit's `buildDossier` and refuses to finish unless a fresh rebuild is byte-identical.

## Bounty

Built for the [gta6-trophy-guide-01 bounty on make.fun](https://make.fun/bounty/gta6-trophy-guide-01) — build the best GTA 6 trophy guide.
