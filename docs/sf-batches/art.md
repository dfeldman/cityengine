# SF public art and fountains — procedural batch

Builders: `src/render/landmarks/sf/art.ts`, registered as `ART` in `src/render/landmarks/sf/index.ts`.
Manifest: `public/landmarks/san-francisco/art.json`, included from `san-francisco.json` above the reface-* includes.
Screenshots: `docs/shots/models/art/` (`front`, `three-quarter`, `top` for each, via `tools/model-shots.ts --views=small`).

All ten entries are standalone (`lat`/`lon`/`size`, no OSM footprint) — none of them has an OSM way to fit to,
and all are freestanding on their own ground (nothing here is on or in a building).

## Built

- **vaillancourtFountain** — Justin Herman Plaza. A tangle of square concrete "tubes" (boxes/boxAlong, no
  curves) over a basin, stacked and cantilevered at several heights. Genuinely procedural-friendly, as the doc
  said; reads as a boxy brutalist mass in the model shots.
- **lottasFountain** — Market/Kearny/Geary. Tapered iron column (prism, several diameters), banded, on a basin
  with four lion-head spout stubs, small lamp finial on top.
- **cupidsSpan** — Rincon Park. Bow built from a chain of `beam` segments along an arc (no single curved
  primitive existed, so it's approximated as ~14 straight segments), a taut string, and an arrow shaft plunging
  into the ground at an angle with fletching in the air. `beam` (from `golden-gate.ts`) was the right tool here —
  `boxAlong` can't do a true diagonal in 3D and there is no arch helper.
- **mlkWaterfall** — Yerba Buena Gardens. A long wall of alternating-shade granite "blocks" (`box`, coursed),
  a water-sheet plane over the front, a plain back wall and two end walls, leaving a walkable gap behind —
  matches "you can walk behind it."
- **heartsInSanFrancisco** — one model, two placements in the manifest (Union Square and the Ferry Building) as
  the doc asked for ("several placements, different colours"). **Colour is NOT actually parameterised** — see
  "Bailed on" below.
- **languageOfTheBirds** — Broadway/Columbus. Five poles (`box`) of varying height at points scattered under an
  imagined canopy, each with one or two flat pale panels near the top standing in for the translucent suspended
  books. Simplified a lot — see below.
- **francisScottKeyCanopy** — Golden Gate Park. Canopy ONLY, per the doc's own note ("architecture more than
  figure"): a small four-column classical pavilion with an entablature and a stepped dome, on a low platform.
  No figure is placed under it — the real Key figure is a separate model entry elsewhere in MODELS_NEEDED.md.
- **stevensonMemorial** — Portsmouth Square. Granite plinth + tapering shaft + capital, with a tiny galleon
  (hull box, mast beam, two angled sail panels) on top.

## Built as basin-only (figures coming from the owner)

Per a mid-task correction: the owner is hand-modelling the mermaids/sea-creatures and the frog/children, so
these two builders now place **only the fixed masonry the figures will stand in** — no bronze stand-ins.

- **asawaMermaidFountain** — Ghirardelli Square. Round stepped granite basin (`basin()` helper) plus a low
  two-tier granite plinth at the centre, clear of the water, sized for the incoming mermaid group.
- **redwoodParkBronzes** — Transamerica Redwood Park. A small granite-rimmed pool (same `basin()` helper, tiny
  radius) plus three flat paving/puddle discs nearby, sized for the incoming frog and "Puddle Jumpers" children.
  Kept the manifest key name `redwoodParkBronzes` even though it's basin-only now, so the manifest entry didn't
  need touching twice.

## Bailed on / simplified — kit gaps

- **Hearts recolour**: the task said "different colours per instance." There is no per-manifest-entry way to
  pass a colour into a procedural builder — `PROCEDURAL[e.procedural]` is called as `build(mb, fit)`, and `Fit`
  carries geometry, not styling. Short of adding a colour field to `Fit`/the manifest plumbing (out of scope —
  it would touch `src/render/landmarks.ts`, not just this file), the two Hearts placements currently render
  identically red. Whoever wires that up: the natural spot is an optional `tint?: Rgb` on `Fit`, defaulted in
  `landmarks.ts` from a new manifest field (e.g. `"tint": [r,g,b]`), read by `heartsInSanFrancisco` in place of
  the hardcoded `RED` constant.
- **Language of the Birds**: the real piece is a dense flock of ~23 books on ~11 poles of varying height, pages
  visibly fluttering open, resin panels that read as glassy and back-lit. This build has 5 poles and 1-2 flat
  panels each — a much sparser gesture at the idea, not a faithful count. Good enough to be recognisable as
  "poles with pale panels overhead" at riding speed, not a close likeness.
- **Cupid's Span bow curve**: no arc/curve primitive exists in the shared kit, so the bow is a chain of ~14
  straight `beam` segments. It reads fine as a bow at the distances a rider sees it, but a true curve helper
  (a generic "polyline of beams along a parametric curve") would be reusable for Vaillancourt-style tangles too.
- No reference photographs were fetched for this batch (no OSM way/node ids exist for any of these ten pieces,
  and a live web-image search pass was not run given the batch's scope) — geometry is built from general
  knowledge of each piece's well-known appearance and dimensions in MODELS_NEEDED.md, then checked against
  screenshots in `docs/shots/models/art/`. Worth a follow-up photo pass if these look off once seen at
  street level in-game.

## Belongs to its building

None found. Every piece on this list is freestanding on its own ground — none is a niche figure, pediment
group, caryatid, or relief attached to a building's wall.

## Not attempted

None — all ten pieces named in MODELS_NEEDED.md's "not models" paragraph (as revised) now have a procedural
builder (two of them basin-only, by design, per the owner's note above).
