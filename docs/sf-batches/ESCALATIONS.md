# Escalations from the kit batches — the buildings the kit could not say

Each batch reports what defeated the kit. That list is the most valuable output of a cheap batch, and it
accumulates here so nothing is lost. **Grouped by what should happen next, not by batch.**

## CHURCHES — four, and we have a `church()` kit they never reached

The kit exists (`src/render/landmarks/church.ts`, ~946 lines, `nave | aisles | transept | chancel | tower |
front | walls`). These were correctly escalated on FORM — the owner: *"Churches are interesting because they
almost NEVER are boxy facade buildings."*

| osm | name | note |
|---|---|---|
| `way/225193440` | **Saint Ignatius** | batch 2; `building=church`, plus two of its own `building:part`s |
| `way/267102407` | **Saint Anne of the Sunset** | batch 4; textbook nave/aisle/apse/tower, 45 vertices |
| `way/160163535` | **Saint Joseph's Arts Society** | batch 4; now secular but unaltered — domed bell tower, round-arched nave windows, `old_name` confirms |
| `way/261273676` | **Macang Monastery** (old St Patrick's) | batch 4; twin ornate bell towers over a classical front |

## CHURCHES — round two, from batch 5

| osm | name |
|---|---|
| `way/286435447` | **Holy Virgin Cathedral** — Russian Orthodox, nave and tower |
| `way/274615294` | **Saint John's Presbyterian Church** |

Same treatment as the first four: the `church()` kit, not `facade()`. **Holy Virgin Cathedral has onion
domes** — check whether `church()`'s tower tops can say one; if not, that is a kit gap worth recording
rather than approximating with a `dome` or `lantern`.

## NOT KIT-MODELLABLE — genuine scratch work

| osm | what defeats the kit |
|---|---|
| `way/1458363734` | **Peace Pagoda** — `building=pagoda`, tiered tapering spire; the roof form IS the building |
| `way/260320985` | **Sailors' Union of the Pacific** — last six edges rotate smoothly through ~66°: a real curved corner, not noise |
| `way/35973054` | **San Francisco Armory** — castellated corner towers rising above the main roofline |
| `way/71739089` | 840 Post St — ~30 of 33 vertices form a repeating 2–6 m bay rhythm |
| `way/288717109` | **Woolf House** — 132-corner plan; the owner called it *"simple repeating but interesting… deserves a little effort"* |
| `way/1330586852` | a hull-of-parts footprint whose parts span 13 m to 225 m — a multi-tower complex, not one building |
| `way/260320982` | 195 m, 42-corner plan, base widening well beyond the tower — massing changes with height |
| `way/783200255` | 92 m, 40-corner plan with many small notches — depth varies per bay |
| `way/436648569` | 110×75 m envelope, fill ratio 0.37, 21 corners — several connected volumes |
| `way/112072207` | **Round House Café** — a literally circular plan: 34-vertex ring, continuous 360° heading sweep, 1.4–1.9 m chords |
| `way/286277781` | **The Alexandria** (former cinema) — a smooth curved corner, 8 short chords rotating continuously through ~160° |
| `way/288396169` | **Aquarium of the Bay**, Pier 39 — irregular non-orthogonal multi-wing pier structure, 47 vertices |
| `way/32947069` | **Pacific Union Club** (Flood Mansion) — a repeating 45° bay-wing rhythm across 9 consecutive 6–16 m edges |
| `way/288633744` | **Kalmanovitz Library**, UCSF — dense alternating 90°/180° jogs with no long wall runs: genuinely stepped hillside massing |

## DISCARDED — not buildings

`way/432712476/477/478/479` — Bay Bridge suspension pylons (BUGS.md #150/#151). `tools/bake.ts` now drops
this class. `way/12960731` (a deleted Arkansas road), `way/30672537` (a Golden Gate Park bike path),
`way/1389915136` and `way/1389914425` (`building=construction`, provisional outlines). The batch lists now
filter all of these.

## KIT GAPS the batches found

- **`Top`'s `attic` kind carries no independent window style** — batch 4 had a building with arched windows
  on the top floor only and could not say it; the attic inherits the shaft's punched windows.
- **`church()`'s `Material` union has no wood/shingle** — St Mary the Virgin is a shingled church and had to
  take `dark-brick` as the nearest tone.
- **`SignSource {kind:'image'}` is dead code** — blocks murals, billboards and the YBCA hexagon logo.

---

## RESOLVED 2026-09-24 — the four churches

All four built on the `church()` kit (`src/render/landmarks/sf/churches-3.ts`, registered, manifest
appended last). None needed primitives — unlike the Fellowship Church, all four are traditional
nave/tower forms the kit says directly.

| church | triangles | note |
|---|---|---|
| Saint Anne of the Sunset | 1,654 | no photograph; built from the batch's plan description, restrained |
| Saint Ignatius | 1,914 | no photograph; **built with ONE tower** — see the flag below |
| Saint Joseph's Arts Society | 1,458 | photographed; height corrected 47 m → ~16 m nave ridge |
| Macang Monastery | 2,542 | photographed; twin octagonal towers with lantern tops |

**Two OSM heights corrected against evidence** (BUGS.md #126's pattern): Saint Ignatius 58 m → 22 m, because
the tag includes the tower and cross while `church()`'s convention is the **nave ridge**; Saint Joseph's
47 m → 16 m against a photograph showing a modest 3–4 storey mass.

**Saint Ignatius's two `building:part`s** (`1028575826`, `1028575827`) are claimed in the entry's `osm`
array, after the real outline so `place()` still fits the outline first — the #156 fix applied correctly at
the point of building, rather than discovered later.

### ⚠ FLAG FOR REVIEW — Saint Ignatius's towers

The run had **no photograph** and so *"restrained to one tower rather than guessing the real building's twin
towers."* That is the right call with no evidence, and it is honest about the uncertainty.

**But it is probably wrong.** Saint Ignatius is a prominent landmark visible across San Francisco and my
recollection is that it has **two** towers — which is exactly why the run hesitated. **I am not asserting
this from memory**; a wrong confident claim is the failure mode this project keeps logging. It needs a
photograph, and the building is conspicuous enough that one should be easy to get.

**Action**: request a reference for `way/225193440` and, if it is twin-towered, change one slot. Cheap fix,
visible building.

### Kit gap found
`church()`'s **stucco roof colour is a fixed terracotta-brown with no gold/gilt option**, so Saint Joseph's
gilded dome renders brown. Documented in the builder and the manifest note rather than hacked around.

---

## RESOLVED (2026-09-24) — KIT GAP found by batch 6 — no PER-EDGE material or shaft

The **Walt Disney Family Museum** (`way/288340246`) was escalated for a reason worth acting on:

> *"the plan does NOT defeat the kit — a 24-vertex baked ring, strictly orthogonal, matching the real
> two-wing 1897 brick Army barracks. But the real building has a preserved BRICK front facing the parade
> ground on one long face and a 2009-added two-storey GLASS CURTAIN WALL filling the opposite face…
> `FacadeSpec` gives one `material` per call and no per-edge `on` for `Shaft`, and a second `facade()` call
> on the same ring double-draws shared walls. Forcing it into one material would repeat the SFMOMA mistake."*

**This is general, not one museum.** A building with two eras on two faces is common — an old front and a
modern rear, a refaced side, a party wall. `facade()` already has **`on: 'front' | 'street' | 'all' |
number`** on some slots (`ground`, and it was just extended for `arcade`), so the concept exists. **`Shaft`
and `material` need the same.**

Until then the honest outcomes are: escalate it, or kit the dominant face and say plainly which face is
wrong. **Do not average two materials into one** — that is the SFMOMA error in miniature.

**Closed.** `Shaft` (`src/render/landmarks/facade.ts`) now takes an optional `by: { on: On; windows: Windows;
material: Material | null }[]`, the same `On` vocabulary (`'front' | 'street' | 'all' | number`) as `Ground`'s
`on`. It partitions the ring's edges rather than overlaying a second pass: `facade()` computes each override's
edges with the existing `edgesFor()` and hands them to a new `Tier.faceOverrides` on `tower.ts`'s `Tier`
(`{ edges: number[]; face: Face }[]`); `tower()` draws the tier's base `face` on whatever edges no override
names, and each override's `face` on exactly its own edges — every edge belongs to one or the other, never
both, so a shared wall is never drawn twice. `faceBand()` grew a matching optional `edges?: number[]`
parameter (default: every edge, i.e. unchanged). All three additions are optional/defaulted, so every existing
call — none of which mentions `by` or `faceOverrides` or passes `edges` — produces byte-identical geometry;
verified by sampling 60 of the 111 registered SF builders' raw `positions`/`indices`/coordinate-sum before and
after the change (all identical) plus the full `npx vitest run` (1170/1172 passing, the same 2 failures the
brief already knew about — one pre-existing in `fifteenHundredMission`, one from a concurrent, off-limits edit
to `portsmouth.ts`).

Proved on the museum itself: `src/render/landmarks/sf/scratch-2.ts` (`waltDisneyFamilyMuseum`, registered in
`sf/index.ts`, placed by `public/landmarks/san-francisco/scratch-2.json`) builds the real 24-vertex two-wing
ring as one `facade()` call — brick, arched windows on the parade-ground-facing wall and both short return
walls, `shaft.by` swapping in a full-height glass curtain on the opposite long wall. No reference photograph
exists for `way/288340246` (`docs/shots/refs/sf-fetch/done.csv` marks its one Mapillary frame "junk"), so the
model is restrained, built from this escalation's own researched description rather than a photo.
`model-shots.ts --entry="Walt Disney Family Museum"` renders show the brick/arched-window wall running into
the glazed curtain wall at the shared corner with no gap, no seam z-fighting and no doubled geometry.

## More churches — batch 6 escalated five

| osm | name |
|---|---|
| `way/223211125` | church, `amenity=place_of_worship` |
| `way/277035386` | church |
| `way/286297924` | church |
| `way/260152155` | church |
| `way/274858124` | **Star of the Sea** — tag AND geometry: two monotonic heading sweeps (curved apse/tower, curved corner) plus a chamfered bay rhythm |

**Seven churches now await the `church()` kit** — these five plus Holy Virgin Cathedral and Saint John's
Presbyterian from batch 5. Enough for one batch.

## Infrastructure wearing a building tag — a second catch

`way/288794272`: tagged `building=yes`, **height 45 m**, and the only two photographs on file show **a
freeway overpass girder and pier directly over the site** — not a building at all. Its ring also carries a
second grid rotated ~31° over the orthogonal one. Escalated under the #150 precedent rather than built.

**That is twice now** (after the four Bay Bridge pylons) that a 45–160 m "building" turned out to be freeway
or bridge structure. `tools/bake.ts` now drops `bridge:support` and unnamed `man_made` towers, but this one
carries neither tag — **a tall unnamed `building=yes` with no photograph is worth a second look.**

---

## RESOLVED — the seven churches (`sf/churches-4.ts`), and one confirmed kit gap

All seven built, registered, manifest appended last. **None had a usable photograph**, so all were built
restrained and plainly massed — the right answer, and stated as such rather than padded with invented detail.

### KIT GAP CONFIRMED: `church()` cannot say an ONION DOME

Precisely diagnosed, not guessed:

> *"`churchTower()`'s `top: 'dome'` calls `kit.ts`'s `dome()`, whose radius shrinks MONOTONICALLY
> (`cos(a)`, a 0→90°) — a hemisphere. An onion dome needs a non-monotonic bulge-then-neck profile, which no
> `Tower['top']` value produces."*

So `dome` and `lantern` both read as **the wrong architectural tradition** for a Russian Orthodox cathedral.
Holy Virgin Cathedral's dome and drum were hand-built with an explicit bulge profile, placed using the same
`towerRing(fit)` transform `church()` computes internally — and restrained to **one** dome rather than a
guessed five-dome cluster.

**To fix properly**: add `Tower['top'] = 'onion'` with a non-monotonic radius profile. San Francisco has more
than one Orthodox church, and any future city with an Orthodox or Mughal tradition needs it.

### NOT a gap: Star of the Sea's curves

The kit handles both measured sweeps without primitives — `Chancel.kind: 'apse'` is already a faceted
half-octagon that reads round, and `Tower.plan: 'octagon'` approximates the other. Only the **chamfered bay
rhythm** is omitted (no per-bay chamfer in `Walls`), declared as a restraint and unconfirmed by any photo.

**Worth noting**: the batch escalated this one partly for its curves, and the curves turned out to be
sayable. **Escalation is a cheap bet, not a verdict** — the kit tier refusing something does not prove the
next tier needs primitives, and checking is the specialist's job.

### Running gap list for `church()`
1. **No `'onion'` tower top** (this run).
2. **No wood/shingle material** — a shingled church took `dark-brick` as the nearest tone.
3. **Stucco roof colour is fixed terracotta-brown, no gold/gilt** — a gilded dome renders brown.
4. **No per-bay chamfer in `Walls`.**

## Batch 8 — new escalations

| osm | what defeats the kit |
|---|---|
| `way/288391070` | **The Cannery** — 1907 brick warehouse remodelled 1963-67 into "winding corridors and a courtyard reminiscent of a European marketplace" (web search, no photo on disk). Baked ring confirms it: 60 vertices, not a simple perimeter — a real multi-wing courtyard complex, not noise. |
| `way/80296749` | **690 Folsom Street** — web search (Archinect/Architizer/Architectural Record; no photo on disk) shows the 2016 Bloszies remodel wraps the old garage in an intricately cut, backlit perforated-aluminum screen and pulls the ground floor back into an 8½-ft arcade on slender free-standing steel columns — geometry (the loggia columns) clear of the footprint, plus a facade material the kit has no slot for. |

Also confirmed rather than re-escalated (already listed above from earlier batches, same reasoning holds):
`way/1330586852` (hull-of-parts, multi-tower), `way/260320982` (One Rincon Hill, massing changes with height).

## Batch 9 — new escalations

Full detail (ring reconstruction + photo evidence) lives in the header comment of
`src/render/landmarks/sf/batches/b9.ts`; summarised here for the running log.

| osm | what defeats the kit |
|---|---|
| `way/1282042031` | Unnamed tower, 52 m. Reconstructed ring: **158 vertices**, dozens of 0.1-2.8 m chords rotating continuously — not survey noise (regular, not directionless). Photo confirms continuous scalloped/curved balconies wrapping every floor. Depth-varies-per-bay, textbook. |
| `way/1410182008` | Unnamed tower, 48 m. Reconstructed ring: a 12-facet run (chords 2.3-9.9 m) drifting continuously through ~30° of heading — batch 5's curve test. Photo confirms a smoothly rounded glass corner. Curved corner. |
| `way/1410183655` | Unnamed tower, 44 m. Reconstructed ring has TWO continuous-rotation runs (5 facets then 11 facets, chords 2.2-10.8 m). Photo confirms a genuinely rounded glass corner tower. Curved plan. |
| `way/1474571838` | Unnamed tower, 52 m. Ring alone reduces to a few large diagonal-grid facets and could be misread as a plain rotated rectangle, but all three reference photos show an unambiguous smoothly curved white corner bay with wraparound balconies, no facets visible. Trusted the photograph over the coarsely-noded way — a smooth curved corner is the trigger either way. |

### Churches — feeding the `church()` gap list

| osm | name | what the frames show |
|---|---|---|
| `way/274428408` | Saint John the Baptist Serbian Orthodox Church | Frames show a domed/onion-adjacent tower silhouette and arched brick windows above a red-brown fenced wall (view partly obstructed by a tree and iron fence). Consistent with an Orthodox church tower form — worth checking against the existing "no `'onion'` tower top" gap (`church()` gap list, item 1) rather than assuming a plain gable. |
| `way/262577281` | Swedenborgian Church of San Francisco | A small, famous 1894–95 Arts-and-Crafts church (architect A. Page Brown with Bernard Maybeck): rubblestone/stucco walls, exposed madrone-log roof structure inside, a broad gable roof with a round window in the gable end, deep round-arched window and door openings, a rectory wing, and a large enclosing garden wall with mature trees — all visible or implied in the reference frames (round gable window, round-arched triple openings, tile-capped gable, low garden wall). This is not a nave-aisle-tower basilica type; it reads as a single-volume, steep-gabled, arts-and-crafts chapel with round-arched openings. Whatever `church()` gains from these two should treat it separately from the domed/Orthodox forms above — its defining features are the gable + round window + round-arched triplet + rustic wall material, not a tower or dome. |

Neither church has a builder. Both wait on `church()` (see the running gap list above); the Swedenborgian in
particular is unusual enough (round-arched triplet openings, exposed-log interior implied by its fame, low
garden-wall enclosure) that it may deserve its own hand-built treatment rather than a generic `church()` call
when someone picks it up.
