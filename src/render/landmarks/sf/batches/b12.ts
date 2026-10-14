/**
 * Kit batch 12 (docs/sf-batches/BRIEF-KIT-BATCH.md): 22 ids from docs/sf-batches/B12-IDS.txt.
 *
 * **Seven of the 22 ids are stale**: the numeric OSM way id in the list no longer refers to the named
 * building at all. Fetching each one directly from `api.openstreetmap.org` (`way/<id>.json`) returned a
 * completely unrelated feature — mostly `tiger:*`-tagged US rural roads or foreign residential streets, one
 * (`way/11009073`, "Fort Point") returning nothing (the way no longer exists). None of the seven appear
 * anywhere in `tools/cache/bake/san-francisco/tiles/*.json` either (checked by numeric id across every tile).
 * There is no ring, no tags, and nothing to model — these are `bail`, not `escalate`, because there is no
 * building-shaped thing to hand up:
 *
 *  - `way/12960861` "Stanford Court San Francisco Hotel" -> now East Munyon Road, Washington Co., Arkansas.
 *  - `way/19474123` "Hilton" -> now Beech Hill Road, Giles Co., Tennessee.
 *  - `way/15629393` "Cathedral of Saint Mary of the Assumption" -> now a private service road, Preston Co., WV.
 *  - `way/11009073` "Fort Point" -> way no longer exists (404 from the OSM API).
 *  - `way/7309505` "Temple Emanu-el" -> now Viitostie, a Finnish trunk road (E63).
 *  - `way/7657843` "San Francisco Day School" -> now a private service road, Escambia Co., Alabama.
 *  - `way/6878543` "San Francisco Zen Center" -> now Van Verschuerplein, a residential street in the Netherlands.
 *
 * The remaining 15 ids resolved to real SF buildings. Rings and tags came from
 * `tools/cache/bake/san-francisco/tiles/*.json` (numeric `id` match — the baked, metres-projected ring, per the
 * brief's "judge the plan from the baked ring" section) for every one of them except the lighthouse, which is
 * too small to appear as a tile `building` entry; for that one the ring came from `way/291189057/full` on the
 * OSM API directly, projected locally.
 *
 * Of those 15: 9 are `kit`, 6 are `escalate`.
 *
 * ESCALATED (6):
 *  - `way/274428408` Saint John the Baptist Serbian Orthodox Church — church-shaped (nave/dome); brief's
 *    standing rule to hand churches to `church()`.
 *  - `way/261301014` Third Baptist Church — same rule, church-shaped.
 *  - `way/260320985` Sailors' Union of the Pacific, 450 Harrison St — baked ring has a genuine continuous
 *    curved corner: six consecutive edges (1.1-4.2 m chords) with headings sweeping monotonically
 *    18.6 -> 36.2 -> 42.8 -> 49.1 -> 57.4 -> 85.9 degrees, ~67 degrees of continuous rotation, not a jog. This
 *    is the Art Deco building's well-known rounded corner pylon. `facade()` is flat-wall-only; a curved plan
 *    is out of the kit's vocabulary.
 *  - `way/286277781` Alexandria (former Alexandria Theatre, 5400 Geary Blvd) — baked ring shows the same
 *    signature on its front corner: seven consecutive short edges (1.6-3.4 m chords) sweeping headings
 *    20.3 -> 38.7 -> 54.1 -> 75.0 -> 93.2 -> 123.4 degrees, over 100 degrees of continuous rotation — a curved
 *    Art Deco marquee corner, not survey noise (noise is small AND directionless; this rotates monotonically
 *    edge after edge). Curved plan, out of the kit's vocabulary.
 *  - `way/273587509` Richard A Gleeson Library, USF — added here AFTER a render caught it, not from the
 *    chord/heading table alone. The heading table on this corner (8.9, 13.9, 25.5, 30.7, 38.9, 44.2, 48.8,
 *    59.3, 69.8 degrees over nine 1.3-3.1 m chords) reads as a plausible steady sweep and was first read as an
 *    "angled entrance recess", kept as `kit`. Its FIRST render (`b12_gleesonLibrary_273587509-top.png`) showed
 *    `towerRing()`'s own corner-rounding turning that run into a visibly smooth curved bay with a curved
 *    colonnade wrapped around it — this building genuinely has a rounded corner reading pavilion, and the
 *    raw table alone did not settle it either way. Pulled: no builder, no manifest entry. This is exactly the
 *    brief's warning that "a building that looks plain may have a real repeating rhythm" cutting the other
 *    way — a corner that reads as a rhythm on paper can still be an actual curve, and only the render caught
 *    it here.
 *  - `way/257934707` Hotel Majestic, 1500 Sutter St (1902 Edwardian) — same pattern, same way pulled AFTER a
 *    render, not kept as first modelled. Initially built `kit` (the bay jogs in the table are individually
 *    under 2 m, which read as noise on paper). Its render (`b12_hotelMajestic_257934707-top.png`, before
 *    deletion) showed `towerRing()` turning that run into a visibly, continuously curved near corner AND a
 *    scalloped wave along the whole roofline where the small per-bay jogs are — this is the brief's "depth
 *    that varies per BAY" case (the building's actual projecting Edwardian bay windows), not survey noise,
 *    and it is web-confirmed the Majestic is known for exactly this. Pulled: no builder, no manifest entry.
 *
 * KEPT (9, `kit`):
 *  - `way/135620221` White Swan Inn, 845 Bush St. Height tag 17 m / building:levels 4. Ring (8 vertices):
 *    headings all in the family {99.1, -171, -80.9, 9.1} (90 degrees apart, rotated ~9) — plain rectangular
 *    box with one small notch. Small boutique inn, English-country styling web-confirmed (leaded bay windows,
 *    cream/white trim) — plain punched shaft, shopfront-level ground entrance, string course.
 *  - `way/291189057` Yerba Buena Island Lighthouse (1873/1875, NRHP). `height=5` tag is not credible for a
 *    lighthouse tower; web-confirmed real figure is a ~25 ft (7.6 m) tower, so the manifest carries 8 m
 *    instead of the tag. Raw way geometry (fetched directly, 8 unique vertices, ~1.5-2 m chords) is a small
 *    regular octagon ~4-5 m across — matches "White Octagonal Tower" in the OSM `seamark:information` tag
 *    exactly. Modelled as the brief's suggested starting point: the smock-tower taper technique in
 *    `districts/parks.ts` (`frustumBand` between a full-size base ring and a `scaleRing`-shrunk top ring),
 *    built on an 8-sided ring rather than a round one, with a small lantern gallery on top.
 *  - `way/165846552` UC Law San Francisco (tall tower, 198 McAllister campus), height 45 m / levels 14. Ring
 *    (9 vertices): headings in family {9.0, 98.9-99.3, -170.8 to -171.0, -80.8} — orthogonal box with a few
 *    small notches. Plain modern academic tower: punched windows, minimal ornament.
 *  - `way/165846555` UC Law San Francisco (198 McAllister St building), height 19 m / levels 6. Ring (5
 *    vertices), same 9/99/-171/-81 family — plain box.
 *  - `way/397007754` UC Law San Francisco Cotchett Law Center, 333 Golden Gate Ave, height 19 m / levels 6.
 *    Ring (6 vertices), same family with one notch — plain box, public university building (not a federal
 *    building despite "Law Center" in the name — no government/court tag, `building=university`).
 *  - `way/73348851` Millennium Lofts, height 44 m / levels 11. Ring (10 vertices): family
 *    {-135.4, -45.3, 44.6, 134.6}, 90 degrees apart — orthogonal tower with notches. Modern loft/condo tower,
 *    punched windows, flat roof.
 *  - `way/32947542` 350 Sansome, height 41 m / levels 9. Ring (5 vertices), family {9.5, 99.5, -170.5, -80.5}
 *    — plain rectangular commercial tower, punched windows, minimal ornament.
 *  - `way/288794272` 170 Otis Street, height 45 m / levels 11. Ring (32 vertices) has TWO orthogonal families
 *    ~35 degrees apart (one near {-174, -85.8, -1.4, 94.9/171}, a second near {34.9, 124.9, -144.6, -55}) —
 *    a two-wing plan meeting at an angle, every edge still a straight flat segment (no curve, no per-height
 *    change) so `facade()` on the fitted ring is still the right tool. Plain modern commercial/industrial
 *    block, wide grid windows.
 *  - `way/288633744` Kalmanovitz Library (UCSF, 530 Parnassus Ave), height 15 m / levels 5. Ring (38
 *    vertices): family {109.6-109.7, -160.3 to -160.8, -70.3 to -70.8, 19.5-20.2}, 90 degrees apart — an
 *    orthogonal wing-and-courtyard plan with jogs of varying size (0.7-19.5 m, not a repeating rhythm),
 *    consistent with a mid-century academic library with setback wings, not a bay/sawtooth rhythm.
 *
 * No fetched Mapillary/street reference exists for any id in this batch (`docs/shots/refs/sf-fetch/done.csv`
 * has no non-junk rows for these ids), so every judgement above rests on the baked ring plus a short,
 * targeted web check for anything named (Hotel Majestic's bay windows, the lighthouse's real height, the
 * Sailors' Union and Alexandria's known Art Deco curved corners).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { facade } from '../../facade.ts'

export const B12: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** way/135620221 — White Swan Inn, 845 Bush St. Plain box, small boutique inn. */
  b12_whiteSwanInn_135620221: (out: MeshBuilder, fit: Fit): void =>
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 2, storeys: 1, material: 'brick' },
      shaft: { storeys: 3, windows: 'balanced', material: 'stucco' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: { kind: 'parapet', height: 0.6 },
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'stucco',
    }),

  // (way/291189057, the Yerba Buena Island lighthouse, moved to sf/ybi-light.ts from the owner's photograph, 2026-10-04)

  /** way/165846552 — UC Law San Francisco (198 McAllister campus tower). Plain modern academic tower. */
  b12_ucLawSfTower_165846552: (out: MeshBuilder, fit: Fit): void =>
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'concrete' },
      shaft: { storeys: 12, windows: 'balanced', material: 'concrete' },
      top: { kind: 'glazed', storeys: 1, material: 'concrete' },
      bands: { aboveGround: null, belowTop: 'string', top: null },
      crown: { kind: 'parapet', height: 0.8 },
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'concrete',
    }),

  /** way/165846555 — UC Law San Francisco (198 McAllister St). Plain box. */
  b12_ucLawSf198McAllister_165846555: (out: MeshBuilder, fit: Fit): void =>
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'concrete' },
      shaft: { storeys: 5, windows: 'balanced', material: 'concrete' },
      top: null,
      bands: { aboveGround: null, belowTop: null, top: 'cornice' },
      crown: { kind: 'parapet', height: 0.6 },
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'concrete',
    }),

  /** way/397007754 — UC Law San Francisco Cotchett Law Center, 333 Golden Gate Ave. Plain box. */
  b12_ucLawSfCotchett_397007754: (out: MeshBuilder, fit: Fit): void =>
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'concrete' },
      shaft: { storeys: 5, windows: 'balanced', material: 'concrete' },
      top: null,
      bands: { aboveGround: null, belowTop: null, top: 'cornice' },
      crown: { kind: 'parapet', height: 0.6 },
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'concrete',
    }),

  /** way/73348851 — Millennium Lofts. Modern loft/condo tower, punched windows. */
  b12_millenniumLofts_73348851: (out: MeshBuilder, fit: Fit): void =>
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'concrete' },
      shaft: { storeys: 9, windows: 'wide', material: 'concrete' },
      top: { kind: 'attic', storeys: 1, material: 'concrete' },
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: { kind: 'parapet', height: 0.8 },
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'concrete',
    }),

  /** way/32947542 — 350 Sansome. Plain rectangular commercial tower. */
  b12_350sansome_32947542: (out: MeshBuilder, fit: Fit): void =>
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'limestone' },
      shaft: { storeys: 7, windows: 'balanced', material: 'concrete' },
      top: { kind: 'attic', storeys: 1, material: 'concrete' },
      bands: { aboveGround: 'string', belowTop: 'string', top: null },
      crown: { kind: 'parapet', height: 0.8 },
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'concrete',
    }),

  /**
   * way/288794272 — 170 Otis Street. Two-wing plan meeting at ~35 degrees (checked: two distinct orthogonal
   * families in the baked ring, not a curve or a rhythm) — still flat-wall-only, so `facade()` on the fitted
   * ring is correct. Plain modern commercial/industrial block, wide grid windows.
   */
  b12_170otisStreet_288794272: (out: MeshBuilder, fit: Fit): void =>
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'concrete' },
      shaft: { storeys: 9, windows: 'wide', material: 'concrete' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: { kind: 'parapet', height: 0.8 },
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'concrete',
    }),

  /** way/288633744 — Kalmanovitz Library, UCSF. Wing-and-courtyard academic library. */
  b12_kalmanovitzLibrary_288633744: (out: MeshBuilder, fit: Fit): void =>
    facade(out, fit, {
      ground: { kind: 'recessed', storeys: 1, depth: 1.2, material: 'concrete' },
      shaft: { storeys: 4, windows: 'balanced', material: 'concrete' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: { kind: 'parapet', height: 0.6 },
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 2 },
      material: 'concrete',
    }),

}
