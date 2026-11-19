# Leonida Platinum Codex — GTA VI Trophy Guide & Tracker

![gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)
![rank](https://make.fun/badge/gta6-trophy-guide-01/ChristaNavisa/gta6-trophy-guide-01/rank.svg)
![reward](https://make.fun/badge/gta6-trophy-guide-01/ChristaNavisa/gta6-trophy-guide-01/reward.svg)

An offline guide and tracker for all **55 PlayStation 5 trophies of Grand Theft Auto VI** — entered in the [gta6-trophy-guide-01 competition on make.fun](https://make.fun/c/gta6-trophy-guide-01).

## What it is

A static web app (`app/`) that opens in a desktop browser and works with the network off:

- **Every trophy** with its official name, description and grade exactly as PlayStation publishes it, plus a guide in our own words that cites its sources.
- **Tracker**: tick trophies off as you earn them; progress is saved in the browser (localStorage), exportable to a JSON file and importable back.
- **Filters** by kind (story, missable, collectibles, activities, side strands, combat, exploration, odd jobs), by grade, by earned state, plus full-text search.
- **Spoiler setting** that hides the names and descriptions of un-earned story trophies until you earn them.
- **Roadmap to the platinum** in six stages, built from the official descriptions — story, character strands, collectibles, activities, combat, then money and cleanup.
- **Missables page**: the 17 trophies tied to a specific story chapter or mission, with the note that GTA VI's mission replay recovers any of them.

## Sources

The official list comes from [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/) and [PSNProfiles](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi), which agree on every name, description and grade. PSNProfiles is also the source of the PSN progress counts (e.g. 42 Shooting Range challenges, 18 meditation spots, 100 WAiNK locations). Each trophy's guide names its sources beside it. Where a guide says "not yet verified in play", its advice is drawn from the official description alone — GTA VI launched on 19 November 2026.

## Run it

```sh
node serve.ts   # serves app/ at http://localhost:8080
```

Or open `app/index.html` directly from any static file server with `app/` at its root. No build step, no network requests at run time.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE). The design is our own; no Rockstar Games logo, official artwork, box art or screenshot of the game is used. Grand Theft Auto VI © Rockstar Games. Trophy names and descriptions © PlayStation / Sony Interactive Entertainment, shown as published. This is an unofficial fan guide.
