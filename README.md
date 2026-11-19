[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/yi948383-arch/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/yi948383-arch/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Neon Shore — GTA-style cover maker

Entry for make.fun bounty `gta6-cover-art-01`: an offline web app that turns
any photo and a caption into GTA 6-style poster cover art — the multi-panel
poster look with bold caption lettering and a Vice City neon-sunset grade —
and exports it as a PNG to share.

## Run

```sh
node serve.ts            # serves app/ at http://localhost:8080
```

Open the page in desktop Chrome. No build step, no network requests, no
account: photos are read on your own machine and never uploaded.

## How it works

1. **Photos** — load up to four photos from your machine (or try the two
   included samples). Tap a slot to make it active, then tap a panel in the
   preview to fill that panel with it, or “Fill all panels” to use one photo
   everywhere.
2. **Layout** — four poster layouts: Hero + three, Four-panel grid, Triple
   strip, Full bleed.
3. **Colour grade** — four grades: Vice Sunset, Neon Night, Golden Hour,
   Mono Noir. Each is a canvas filter plus a gradient colour wash.
4. **Caption** — a title in heavy condensed capitals with a sunset gradient
   fill, an italic subtitle, and a tilted ribbon badge.
5. **Crop** — click a panel to select it, drag to move its photo, scroll (or
   the zoom slider) to zoom.
6. **Export** — one click writes a PNG in Square 1080×1080, Portrait
   1080×1350 or Wide 1920×1080.

## The art

Everything on the cover is drawn in code on a 2D canvas — no Rockstar logo,
artwork or font anywhere:

- `drawTitleBand` paints the sunset title band: a gradient sky, a slatted
  synthwave sun, and palm silhouettes at the edges.
- `drawPhotoPanel` cover-fits each photo into its panel with per-panel zoom
  and pan, then `applyGrade` washes it with the chosen grade.
- `drawFilmGrain` adds seeded speckle and `drawVignette` pulls the eye to
  the middle; a thin white poster frame finishes the cover.

## Files

- `app/index.html` — the editor page
- `app/style.css` — the dark neon editor theme
- `app/src/cover.js` — the cover engine (`drawCover`, layouts, grades, title band, palms, sun, grain)
- `app/src/main.js` — editor wiring, panel cropping, PNG export
- `app/src/shots.js` — fixed `?shot=` scenes for the screenshots
- `app/samples/` — two kit sample photos (image-model made, free to use)
- `main.ts` — the make.fun entry program (copies `app/` + `screenshots/`, writes `dossier.json`)
- `serve.ts` — tiny static server for local trying
- `LICENSE` — MIT (from the kit's starter)
