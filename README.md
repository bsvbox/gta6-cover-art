[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/bsvbox/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/bsvbox/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Sunset Cover Studio

Built for [make.fun's GTA 6 Cover Art bounty](https://make.fun/bounty/gta6-cover-art-01).

A GTA 6-style poster maker that runs offline in a desktop browser. Load your
own photos (up to three), crop and position each one, pick a multi-panel
layout and a Vice City sunset or neon grade, letter the caption, and export
the cover as a PNG in 1080×1080, 1080×1350 or 1920×1080.

Photos are read on your own machine and never uploaded. Everything the app
draws — the synthwave sun, palm silhouettes, skyline, frames and lettering —
is made with canvas paths in `app/src/cover.js`. The title font is Anton,
vendored under `app/fonts/` under the SIL Open Font License
(`app/fonts/OFL.txt`). No Rockstar logo, artwork or font is used.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

## Hand it in (make.fun, gta6-cover-art-01)

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored `vendor/makefun-app.ts`.

## Screenshots

`shots.json` lists the four scenes. `1-cover.jpg` is a wide exported cover,
`2-editor.jpg` is the editor with photos loaded, `3-cover.jpg` is a portrait
cover and `4-cover.jpg` is a square cover in another layout.
