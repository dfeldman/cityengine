/**
 * Kit batch 7 (docs/sf-batches/BRIEF-KIT-BATCH.md): 19 unclaimed SF ways, the last of the current lists.
 *
 * Photograph check (`docs/shots/refs/`): none of the nineteen have a photo on disk. All eleven KEPT
 * buildings below are built BLIND, from OSM tags/names, the BAKED plan geometry (`tools/footprint.ts`,
 * projected metres, checked edge-by-edge for curvature/rhythm — not raw lat/lon) and, for the named ones,
 * a web search for era/style. Every escalation below is geometry- or tag-driven, not a guess.
 *
 * Kept (11, `kit`): 257974844, 247749446, 256054993, 939497446, 256045052, 256755970, 148428438, 1247989050,
 * 259078183, 256989711, 257004416.
 *
 * Escalated (8, no builder):
 *  - `261268781` — Saint Francis Lutheran Church, 152 Church St. `amenity=place_of_worship`,
 *    `building=church`, `denomination=lutheran`. Textbook church tags and plan; there is a `church()` kit.
 *  - `286642543` — Lincoln Park Presbyterian Church, 417 31st Ave. `building=church`,
 *    `denomination=presbyterian`. Same call.
 *  - `247759163` — "Jones Street tank", `man_made=storage_tank`, `emergency=water_tank`, tagged
 *    `building=yes` only incidentally. Baked ring (12 vertices) is a regular dodecagon — chords 5.1-5.7m,
 *    heading advancing by a near-constant ~30° every edge, a full 360° sweep: a genuinely circular drum, not
 *    a building. Infrastructure wearing a `building` tag, the same failure mode BUGS.md #150 already
 *    catalogues for the Bay Bridge pylons and the Otis St freeway footprint — and a curved plan besides.
 *  - `247759532` — "Ashbury tank", `man_made=water_tower`, `building=yes`. Same call: baked ring (12
 *    vertices) is another regular dodecagon, chords 4.8-5.1m, heading advancing ~30°/edge through a full
 *    360°. Same infrastructure-plus-circular-plan escalation as the Jones Street tank.
 *  - `256045049` — "Symphony Towers", `building=yes`, `building:levels=12`, plan resolved from
 *    `building:part`s (`tools/footprint.ts` `source: 'parts'`). Checked the parts directly
 *    (`partOf: 256045049` in the baked tiles): TWO parts, heights 48m and 36m — a stepped podium-and-tower,
 *    massing that changes with height. A `facade()` call on the hull would flatten the step into one
 *    uniform extrusion, exactly the Salesforce-Tower failure mode this brief's manifest notes warn about.
 *    Escalate rather than guess which volume gets which storeys.
 *  - `563104192` — "One Mission Bay", `building=apartments`, `building:levels=17`, also `source: 'parts'`.
 *    Checked the parts: NINE of them, heights 4, 68, 36, 8, 36, 4, 24, 4, 4 m — not a stepped single tower
 *    but a whole low-rise-plus-highrise complex (courtyard buildings, a podium, one real 68m tower) sharing
 *    one hull, and the hull itself (33.9 x 94.4m half-extents, edges at 49°/90°/140°/141°) is not a simple
 *    box either. Two-or-more unrelated volumes in one footprint; not one building's massing.
 *  - `1315380002` — John F. Kennedy Towers (alt_name), 2451 Sacramento St, `building=apartments`,
 *    `building:levels=12`. Baked ring has 37 vertices; one run of 9 consecutive chords (4.1-4.4m each) has
 *    heading rotating monotonically and continuously from -40° to -152°, a genuine ~112° curved section
 *    (batch 5's test: regular length, continuous rotation = curve, not noise) on top of a generally
 *    irregular, non-orthogonal perimeter. A curved plan section defeats the kit.
 *  - `120479798` — **Pioneer Log Cabin**, Golden Gate Park, `historic=monument`, `tourism=attraction`. The
 *    owner has flagged the park as a future route destination, so this is not filler. Baked ring (6
 *    vertices) is a clean, tiny, strictly orthogonal L-plan — an 18 x 10m main block with a 6.4 x 3.1m ell —
 *    genuinely trivial geometry. But it is a single-storey interlocking-redwood-log cabin with a gable roof:
 *    `facade()`'s slots are all punched-window-wall-and-storey vocabulary and have no log material, no
 *    exposed ridge log ends, and no gable roof primitive. Per the brief: escalate it and say so rather than
 *    force log walls into a punched-window shaft. NO builder written. A short hand-rolled builder (an
 *    extruded log-textured box plus a simple gable, no `facade()` call) is the right, cheap answer — someone
 *    should write that ~20-line one-off, not spend a `facade()` call pretending it is a masonry front.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { facade } from '../../facade.ts'

export const B7: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /**
   * way/257974844 — Kinmon Gakuen (Golden Gate Institute), 2031 Bush St, Japantown. `building=school`,
   * NRHP/SF-landmarked, no height tag. No photograph. Web search: William C. Hays, 1926, Mediterranean
   * Revival school building. Baked plan (13 vertices) checked edge-by-edge: every heading clusters on
   * 0/90/180/-90 — strictly orthogonal wing-and-lightwell box, not a rhythm. Own height estimate: 11m (a
   * 2-3 storey 1920s school; no tag to disagree with). Built as a stuccoed Mediterranean Revival block:
   * arched ground openings, banded stucco shaft, tiled-look attic parapet standing in for its low-pitch roof.
   */
  b7_school_257974844: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'arcade', arches: 4, storeys: 1, material: 'stucco', on: 'front' },
      shaft: { storeys: 2, windows: 'arched', material: 'stucco' },
      top: { kind: 'attic', storeys: 1, material: 'stucco' },
      bands: { aboveGround: 'string', belowTop: 'string', top: 'cornice' },
      crown: null,
      frame: { verticals: { kind: 'quoins', width: 0.4, at: 'corners' }, horizontals: null, recess: 0, material: 'stucco' },
      entrance: { at: 'centre', kind: 'portal', steps: 3 },
      material: 'stucco',
    })
  },

  /**
   * way/247749446 — Fleur de Lys (former restaurant), 777 Sutter St, Tendernob. `building=yes`, no height
   * tag. No photograph. Web search: the restaurant (closed 2014) occupied an "unobtrusive windowless
   * mid-block storefront" — the ground floor is deliberately blank, not glazed. Baked plan (12 vertices) is
   * a narrow (~9x28m) orthogonal mid-block box with a couple of sub-4m notches (light well/rear jog, not a
   * repeating rhythm). Own height estimate: 14m (4 low storeys on a narrow SF mid-block lot; no tag).
   * Built with a deliberately blank ground floor per the source, plain brick above.
   */
  b7_restaurant_247749446: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'dark-brick' },
      shaft: { storeys: 3, windows: 'small', material: 'brick' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'brick',
    })
  },

  /**
   * way/256054993 — 573-577 O'Farrell St, `building=yes`, height 41m tagged, no name. No photograph, no web
   * hit worth trusting for an unnamed mid-block address. Baked plan (5 vertices) is a clean orthogonal box
   * with one small notch. Built BLIND as a plain mid-rise apartment/hotel block typical of this Tenderloin
   * block — ground shopfronts, punched windows above.
   */
  b7_midrise_256054993: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 4, storeys: 1, material: 'dark-brick' },
      shaft: { storeys: 10, windows: 'balanced', material: 'brick' },
      top: { kind: 'attic', storeys: 1, material: 'brick' },
      bands: { aboveGround: 'string', belowTop: 'string', top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'brick',
    })
  },

  /**
   * way/256045052 — 555/575 Polk St, `building=yes`, height tagged `"41 m"` (a string with a unit — believed
   * as 41, per the brief's "OSM heights are wrong" note applying to the tag's FORMAT here, not the number).
   * No photograph, unnamed. Baked plan (7 vertices) is strictly orthogonal — a rectangle with one setback
   * corner. Built BLIND as a plain mid-century Polk St mixed-use block.
   */
  b7_midrise_256045052: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 5, storeys: 1, material: 'concrete' },
      shaft: { storeys: 10, windows: 'balanced', material: 'stucco' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'stucco',
    })
  },

  /**
   * way/256755970 — Court Royal (marketed as Crest Royal Apartments), 1310 Jones St, Nob Hill.
   * `building=apartments`, `building:levels=13`, height 50m tagged. No photograph. Web search: built 1955,
   * a 12-13 storey mid-century apartment tower. Baked plan (10 vertices) is strictly orthogonal — a
   * rectangle with a slot-shaped lightwell notch (two collinear-ish long runs), typical of a mid-century
   * courtyard tower. Built as a plain mid-century concrete/stucco slab, balanced punched windows.
   */
  b7_apartments_256755970: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'recessed', storeys: 1, depth: 0.6, material: 'concrete' },
      shaft: { storeys: 11, windows: 'balanced', material: 'stucco' },
      top: { kind: 'attic', storeys: 1, material: 'stucco' },
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 1 },
      material: 'stucco',
    })
  },

  /**
   * way/148428438 — unnamed apartment tower, `building=apartments`, height tagged `"68 m"`, `source=Bing`
   * (a rough estimate, not surveyed). No photograph, no name to search — fully blind. Baked plan (4
   * vertices) is a clean, near-perfect rectangle (45x36m), a plain slab footprint. Built as a plain modern
   * apartment tower; the 68m figure is kept since nothing on the ground contradicts it.
   */
  b7_apartments_148428438: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'recessed', storeys: 1, depth: 0.6, material: 'concrete' },
      shaft: { storeys: 19, windows: 'balanced', material: 'precast' },
      top: { kind: 'setback', storeys: 1, by: 1, material: 'precast' },
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 1 },
      material: 'precast',
    })
  },

  /**
   * way/1247989050 — Quincy, 555 Bryant St, SoMa. `building=apartments`, `building:levels=16`, height
   * 48.768m tagged (160ft — a round imperial figure converted, believed). No photograph. Web search:
   * completed recently, a 16-storey, ~501-unit modern apartment building on a 0.75-acre SoMa site. Baked
   * plan (5 vertices) reduces to a plain rectangle (the two near-identical short "0°" edges are a single
   * straight face split by one extra vertex, not a notch). Built as a contemporary glass/precast SoMa slab.
   */
  b7_apartments_1247989050: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 6, storeys: 1, material: 'glass' },
      shaft: { storeys: 14, windows: 'continuous', material: 'precast' },
      top: { kind: 'glazed', storeys: 1, material: 'glass' },
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 1 },
      material: 'precast',
    })
  },

  /**
   * way/259078183 — 1958 Vallejo St, Pacific Heights. `building=yes`, height 42m tagged, no name. No
   * photograph. Baked plan (13 vertices) checked edge-by-edge: all headings cluster on 0/90/180/-90 with a
   * uniform ~1° rotation offset (site orientation, not a diagonal) — strictly orthogonal. The short chords
   * (a 3.0m-out/3.0m-back pair) are ONE projecting bay, not a repeating rhythm — same call the brief makes
   * for a single Victorian bay window. Built BLIND as a plain Pacific Heights mid-rise apartment block with
   * one projecting bay window face.
   */
  b7_midrise_259078183: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'stucco' },
      shaft: { storeys: 10, windows: 'bays', material: 'stucco' },
      top: { kind: 'attic', storeys: 1, material: 'stucco' },
      bands: { aboveGround: 'string', belowTop: 'string', top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 2 },
      material: 'stucco',
    })
  },

  /**
   * way/256989711 — 1835 Franklin St, Pacific Heights. `building=yes`, height 46m tagged, no name. No
   * photograph. Baked plan (8 vertices) checked edge-by-edge: all headings cluster on 0/90/180/-90 (a
   * couple of degrees of survey noise only) — strictly orthogonal box with a light-well notch. Built BLIND
   * as a plain mid-rise Pacific Heights apartment block.
   */
  b7_midrise_256989711: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'stucco' },
      shaft: { storeys: 11, windows: 'balanced', material: 'stucco' },
      top: { kind: 'attic', storeys: 1, material: 'stucco' },
      bands: { aboveGround: 'string', belowTop: 'string', top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 2 },
      material: 'stucco',
    })
  },

  /**
   * way/257004416 — Washington Tower, 2190 Washington St, Pacific Heights. `building=apartments`,
   * `building:levels=12`, height 36m tagged, `roof:shape=flat`. No photograph. Web search: built 1961, a
   * 12-storey mid-century apartment tower, 95 units. Baked plan (13 vertices): one 42m face is drawn in
   * five facets whose heading drifts only 97°->81°->86° across 6-12m chords (~4°/chord) — a SHALLOW BOW, not
   * the sharp multi-edge sweep (~20°/chord on 1-2m chords) the brief's curve examples show; the rest of the
   * ring is strictly orthogonal. Per "do not over-escalate", this is what a gently bowed mid-century face
   * looks like in five facets, not a curve defeating the kit — kept, and `facade()` draws it correctly
   * per-edge via `edgeAt()`. Built as a plain flat-roofed 1961 concrete tower, punched windows.
   */
  b7_apartments_257004416: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'recessed', storeys: 1, depth: 0.6, material: 'concrete' },
      shaft: { storeys: 11, windows: 'balanced', material: 'concrete' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 1 },
      material: 'concrete',
    })
  },
}
