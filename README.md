[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/ChristaNavisa/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/ChristaNavisa/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Platinum Codex — GTA VI Trophy Guide & Tracker

An offline, open-source trophy guide and tracker for **Grand Theft Auto VI** (PlayStation 5): all **55 official trophies** with full-text guides, a roadmap to the platinum, missable flags, and a progress tracker that saves in your browser.

## What wins here

- **489 claims cited, computed from the data** — 360 numbered steps, every one cited (360/360 backed by **2+ sources**), 55 full-text guides, 37 **SOURCES DIFFER** panels. The audit strip at the top of the app is computed from `app/data/trophies.json` at runtime; no number in it is typed by hand.
- **Every dispute shown openly** — where the trophy lists disagree (hidden split 28/27, the missable count, the unconfirmed trophies), the guide shows both versions and its own call, instead of hiding the disagreement.
- **Tracker first** — earned counter and PSN points bar (1,350 pts total), per-trophy counters (meditations 0/18, vehicles 0/200, challenges 0/70…), filters by kind/grade/hidden/missable, search, spoiler shield for hidden trophies, Export/Import of progress as JSON, and a **Next Up** planner that lists the cheapest unearned trophies.
- **Roadmap in 4 stages** — story (Ch 1–2), story + contacts (Ch 3–4), finale + 100% Completion checklist (35 tasks), cleanup. The one possibly missable trophy — the Chapter 1 balcony meditation for **Positive Mental Attitude** — is flagged in red everywhere it appears.
- **Honest about the unknown** — The Truth Is Out There has no proven unlock method yet; Ten Pin and Personal Best are still being confirmed. This guide marks them unconfirmed instead of inventing a method.

## Facts (all verified against the trophy lists, read 20 Nov 2026)

- 55 trophies: 1 platinum, 2 gold, 6 silver, 46 bronze. 1,350 PSN points.
- 28 hidden, 27 shown. 1 possibly missable (the Chapter 1 meditation).
- Difficulty 4/10, ~200 hours to platinum (PowerPyx). All 55 offline, single-player.
- 100% Completion: 35 tasks — 70 of 80 challenges, 15 card sets, 100 WAiNK locations, 33 underwater discoveries, 100 Cocaine Flamingos, 200 of 277 vehicles scanned, 100 of 255 animals studied, 39 gang operations, 8 bank vault robberies, 42 Drone Time Trials.
- 27 sources, all read 20 Nov 2026 (PowerPyx, PSNProfiles, Exophase, KeenGamer, EGamers, GTA Vice City Hub, GTA Spotter, GamesFuze, GameTrek, TrueTrophies, PlayStationTrophies.org, Game-Checklists, OutputLag, IGN, GamesRadar, Push Square, Dexerto, Insider Gaming, Rockstar Games, Beebom, TechWiser, GTABase).

## Run it

```sh
node serve.ts        # http://localhost:8080
```

Or build the submission output:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, stdlib only) validates `app/data/trophies.json` (55 trophies, unique names, every guide full text, every step cited, grades 1P/2G/6S/46B), validates the 4 screenshots (≤256 KiB each, JPEG/PNG), copies `app/` + `screenshots/` to the output dir (emptying its contents, never removing the dir itself — safe on mount points), and writes `dossier.json` via the vendored `buildDossier`, byte-compared against a fresh build.

## Screenshots

1. **Cover** — tracker open on Positive Mental Attitude (the missable meditation trophy) with its SOURCES DIFFER panel and progress counter.
2. Roadmap — the 4-stage plan to platinum.
3. Missables — the one missable trophy, and why there is only one.
4. Sources — all 27 dated sources with per-source citation counts.

## Disclaimer

Unofficial fan guide. Not affiliated with Rockstar Games, Take-Two Interactive, Sony Interactive Entertainment or PlayStation. Trophy names and descriptions are the official list. Guide text is written in our own words; sources are cited, never copied.

## License

MIT — see [LICENSE](LICENSE).
