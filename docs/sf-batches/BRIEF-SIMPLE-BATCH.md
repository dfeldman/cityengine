# DO THE WORK YOURSELF

**Do not spawn a sub-agent for this task.** Three runs on 2026-09-24 delegated instead of working, each
burning ~60,000 tokens to make a single tool call and adding a layer that reports second-hand. You have
everything you need. Read, build, render, report.

# Reusable brief: the "not a kit, but simple geometry" batch

You are given a list of buildings. Each is **NOT kit-sayable** — `facade()`'s slots cannot say it — **but
each is simple**: boxes, arches, tiled slopes, sheds, towers. A short hand-written builder, 50–100 lines,
is the right answer for every one.

Owner's framing, on the Presidio Theatre: *"not a kit, but super easy geometry."*

**You are not being asked for judgement.** The references answer the questions. If a building turns out to
need real judgement — an amorphous form, a curved plan you cannot approximate with a few segments, or no
usable reference — **write NO builder, say `escalate` and why, and move on.** That is a good outcome.

## For each building

1. Look at its reference (named in the dispatch). Read the shape in plain terms: how many masses, what
   roof, what is at ground level.
2. Write one builder. Boxes (`box`), walls (`faceBand`), caps (`capPolygon`), arcades (`arcade` — **use it,
   do not hand-roll arches**), stairs (`stair`), beams (`beam`). Keep it under ~120 lines.
3. Render it. Fix what the render shows. Render again.

## Rules that have cost real time

- **Headings**: always call `edgeAt()`; never hand-roll `atan2`. `edgeAt().heading` is what `boxAlong`
  expects (BUGS.md #135).
- **A lat/lon manifest entry's builder draws in LOCAL coordinates**, not world metres. Getting this wrong
  silently places the building hundreds of metres away.
- **Never `insetRing` on a concave ring** — use `offsetRing`.
- **Steps solid**, closed ends and underside.
- **Railings/mullions dark and flush**, never pale and standing proud (#134a).
- **Check for a real OSM ring before placing by lat/lon + size** (#146).
- **Do not replace a hand-made standalone entry.** Some landmarks were modelled by hand as lat/lon entries
  that claim no OSM id — e.g. the Ghirardelli sign sits on a roof at `offset [0,24,0]`. If your building has
  one, build UNDER it and leave it alone (#149).

## Manifest schema — exactly this

```json
[ { "osm": ["way/12345"], "procedural": "s<N>_name_12345", "name": "Real name", "height": 12 } ]
```

`osm` is an **array of strings**. `procedural` must match your builder's name exactly.

## Files

    src/render/landmarks/sf/batches/s<N>.ts        your builders (create; register in sf/index.ts)
    public/landmarks/san-francisco/s<N>.json       your manifest entries

**A builder written but not registered is wasted work.** Verify each appears in `sf/index.ts` AND has a
manifest entry whose `procedural` matches. State that you checked.

## Render

`node --experimental-strip-types tools/model-shots.ts --entry="<name>"` → `docs/shots/models/`.
It honours `--views` and has a `rider` set. Do not write a new shot script.
**One render per building minimum, a second after any change.** A run that changes nothing after looking
has not looked. Report what each render made you CHANGE — your opinion of your own work is not evidence.

## Checks

`node tools/typecheck.js`, `npx vitest run`. Pre-existing and NOT yours: 7 errors in
`sf/experiments/e14.ts`; `fifteenHundredMission` in `tests/audit-builders.test.ts`.

## Report

One line per building (`built` / `escalate` + reason) · triangle counts · what each render changed ·
confirmation every builder is registered and in the manifest.

## VERIFY THE FOOTPRINT — the first simple batch got this wrong on all ten

Batch s1 (2026-09-24) built ten buildings and used **`fit.ring` zero times**. Every builder drew a
fixed-size template, so four Fort Mason sheds of different real sizes came out with **identical triangle
counts**, as did three piers of different lengths. It reported *"all builders rendered cleanly on first
pass"* and *"all renders are correct per the brief."* Neither was true.

**Every builder must take its plan from `fit.ring`**, with `towerRing(fit)` as the fallback when the ring is
absent — the pattern used throughout `sf/batches/b*.ts`.

**Two checks before you report, both cheap:**

1. `grep -c "fit.ring\|towerRing" <your file>` — if it is 0, you have built templates, not buildings.
2. **Open a top or three-quarter render of anything whose footprint is not rectangular.** If it renders as
   a rectangle and the real plan is not one, the builder is ignoring the ring. Batch 6 did this and could
   say *"the Alhambra's notch, Koshland's giant-order wings and the library's flanking colonnades all
   matched their baked rings."* That is what a verified report sounds like.

**Identical triangle counts across buildings of different sizes is the tell.** If two of your buildings come
out with exactly the same count, either they are genuinely identical or you have ignored their footprints —
and the second is far more likely.

## WHERE HAIKU SUCCEEDS AND WHERE IT DOES NOT — measured, 2026-09-24

Batch s1 was the first run on Haiku. The result is a clean split, and it should decide what gets dispatched
cheaply in future.

**Succeeded — TYPE-DETERMINED forms.** Fort Mason's four transit sheds, three promenade piers, the Sutro
Baths ruins, the log cabin. For these the *type* fixes the form: a shed is a long gabled box, a pier is a
deck on piles, a ruin is roofless walls. No reference was needed and none was available. After one
correction these came out right, and the footprint fix was real and verifiable (`towerRing(fit)` 0 → 16
uses; triangle counts diverged 928 → 2588 and 1344 → 4988, which is the signature of real rings replacing
templates).

**Failed — a SPECIFIC photographed form.** The Presidio Theatre needed a gabled block with a ridge, two
roof planes and a triangular gable end, all plainly visible in two reference photographs. **Three attempts
produced a flat slab each time**, and the third *lost* geometry (3,318 → 942 triangles) while reporting
*"Perfect! Now I can see the gabled structure clearly — the ridge line, two sloping roof planes, and the
peaked gable at the front."* **None of it was there.**

### The rule
**Dispatch to Haiku when the building type determines the form. Do not when a photograph determines it.**
The second needs a model that can compare what it built against what it was shown, and Haiku reported
success three times against an image that contradicted it.

### And verify Haiku mechanically, not aesthetically
Cheap checks that caught real defects here, each a few seconds:
- `grep -c "fit.ring\|towerRing" <file>` — zero means templates, not buildings;
- **identical triangle counts across buildings of different real sizes** — the tell that footprints were
  ignored;
- **triangle count DROPPING when detail was supposedly added** — the tell that geometry was lost.

Judging a render by eye is the expensive check and the one Haiku's reports cannot be trusted on.

### A mistake of mine, recorded so it is not repeated
I called nine of these ten "pancakes" from their renders and was **wrong**. Fort Mason Shed A is
**177 × 129 m and 9 m tall — 20:1** — so a slab is exactly what it should look like. **Measure the footprint
against the height before judging proportion from an image.** I had warned two other runs about misreading
renders and then did it myself.
