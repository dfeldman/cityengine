/**
 * Kit batch 9 (docs/sf-batches/BRIEF-KIT-BATCH.md): 13 ids from `tools/batch-list.ts`'s new tag-filtered
 * list (docs/sf-batches/B9-IDS.txt). Every id here carries a real `building` tag and has 3 reference frames
 * on disk (docs/shots/refs/sf-mapillary/way-<id>-0{1,2,3}.jpg) — no "not a building" and no "no reference"
 * rejections were available or needed on this list; the new filter held.
 *
 * What is actually on the list: eleven unnamed(-in-the-queue) towers, 44-67m, plus two churches. The two
 * churches (way/274428408, way/262577281) are NOT modelled here — see docs/sf-batches/ESCALATIONS.md, they
 * belong to the `church()` kit.
 *
 * Baked-ring check: none of these eleven were in the current bake's `public/cities/san-francisco/tiles/`
 * output except way/135103722, way/574616994, way/135103725, way/135103710 (confirmed by exact height match
 * against the manifest figure). For the other seven, I reconstructed the projected-metre ring myself from
 * the OSM cut's raw node coordinates (`tools/cache/osm/cuts/*.opl`, equirectangular projection about the
 * building's own first vertex) using the same edge-by-edge heading/chord test the brief's baked-ring section
 * asks for, since they are not yet present as tiles. That reconstruction is what "checked against the
 * baked/projected ring" means for those seven below.
 *
 * KEPT (7, `kit`):
 *  - `1249412094` — Isle House, 39 Bruton St, Treasure Island. `building=apartments`, `building:levels=22`,
 *    height 67m tagged, named in the OSM tags (`name=Isle House`) though blank in the queue row. Ring (7
 *    vertices): two facets meet at non-cardinal angles (`-131m@138` then `117`/`117`) — a single pair of
 *    canted corners on an otherwise plain rectangle, not a repeating rhythm. Photo confirms: a plain flat
 *    22-storey tower with two shallow chamfered corners, dark recessed base, balanced punched windows.
 *  - `1487223700` — unnamed corner apartment tower, height 60m tagged. Ring (15 vertices): five short-to-
 *    medium facets (5.3-16.2m) at the street corner, headings zigzagging 105->45->-17->11->45 — a genuine
 *    multi-facet PROW, not a smooth curve (turn is non-monotonic and the facets are large, not the dozens of
 *    near-identical short chords a curve leaves). Photo (way-1487223700-03.jpg) confirms: the corner is
 *    visibly FACETED — flat balcony-bearing faces meeting at visible angles, not a rounded drum. `facade()`
 *    draws each face correctly per-edge via `edgeAt()`, so this is kit work: a brick-base, stucco-shaft
 *    corner tower with continuous balconies along the prow faces.
 *  - `135103722` — unnamed Mission Bay office/lab building, height 60m tagged. Present in the current bake
 *    (id matches, height 60 confirms it). Baked ring (9 vertices): headings -86/4/-85/4/94/-176/-86/-176/-85
 *    — cardinal to within survey noise, strictly orthogonal notched box. Photo: a plain glass-and-panel
 *    Mission Bay lab/office building, banded glazing.
 *  - `899281899` — unnamed Mission Bay office/lab building, height 48m tagged. Reconstructed ring (22
 *    vertices): headings cluster on -86/-176/4/92/93 etc, all within a few degrees of cardinal — strictly
 *    orthogonal, light-well notches only. Photo: plain tan-panel-and-glass office block, grid windows.
 *  - `574616994` — unnamed Mission Bay building, height 48m tagged. Present in the current bake (height 48
 *    confirms it). Baked ring (36 vertices): dominated by cardinal headings (4/-86/-176/94), one single
 *    7.3m facet at -55 degrees (one canted corner, not a repeat) — orthogonal box with light wells. Photo:
 *    dark panelled mid-rise, plain grid windows, seen from the freeway.
 *  - `135103725` — unnamed Mission Bay office building, height 47m tagged. Present in the current bake
 *    (height 47 confirms it). Baked ring (20 vertices): headings all within a few degrees of cardinal
 *    (-175/95/-87/2/-84/4/-88/94/81) — orthogonal notched box. Photo: tan-and-glass office building, banded
 *    glazing, matches its Mission Bay neighbours.
 *  - `135103710` — unnamed Mission Bay office building, height 47m tagged. Present in the current bake
 *    (height 47 confirms it). Baked ring (10 vertices): headings 4/-86/-86/4/94/-176/-86/-176/-86/-86 — all
 *    cardinal, plain notched box. Photo: glass office building corner, recessed ground floor, tree cover
 *    obscuring most of the elevation, built as a plain match to its confirmed neighbours.
 *
 * ESCALATED (4 towers, no builder — the geometry defeats the kit):
 *  - `1282042031` — unnamed tower, height 52m tagged. Reconstructed ring has **158 vertices**: dozens of
 *    0.1-2.8m chords with headings rotating continuously through the full range, not survey noise (noise is
 *    small AND directionless; this is small AND relentlessly regular). Photo (way-1282042031-01/02.jpg)
 *    confirms exactly what that vertex count implies: floor after floor of continuous SCALLOPED/CURVED
 *    balcony fronts wrapping the whole visible facade, alternating green and beige panels between them.
 *    Textbook "depth that varies per BAY — stacked projecting balconies." No builder written.
 *  - `1410182008` — unnamed tower, height 48m tagged. Reconstructed ring: a 12-facet run
 *    (-154/-151/-148/-145/-141/-139/-129/-132/-126/-132/-151/-160), chords 2.3-9.9m, drifting continuously
 *    over roughly 30 degrees before returning — batch 5's curve test (regular short chords + continuous
 *    rotation = curve). Photo confirms a glass tower with a distinctly rounded, continuously-curved corner
 *    (blue glass sweeping into an orange-trimmed curved parapet) next to a separate round drum building.
 *    Curved corner defeats the kit. No builder written.
 *  - `1410183655` — unnamed tower, height 44m tagged. Reconstructed ring has TWO curved runs: an initial
 *    5-facet sweep (156->146->134->120->103, chords 2.5-3.8m) and, later, an 11-facet sweep
 *    (-84->-78->-68->-63->-50->-48->-41->-49->-66->-79->-88, chords 2.2-10.8m) — both continuous monotonic-
 *    ish rotations, not noise. Photo confirms: a genuinely rounded glass corner tower (visible smooth curved
 *    bay, not a faceted prow) at a SoMa intersection. Curved plan defeats the kit. No builder written.
 *  - `1474571838` — unnamed tower, height 52m tagged. Reconstructed ring reduces to a handful of large
 *    diagonal-grid facets and, taken alone, could be read as a plain rotated rectangle — but the reference
 *    photos (way-1474571838-01/02/03.jpg) show an unambiguous smooth, continuously-curved white corner bay
 *    with balconies wrapping the curve, no facets visible at all. Per "judge the plan... this cuts both
 *    ways": here the photograph is the more reliable evidence of the built form than a coarsely-noded OSM
 *    way, and a smoothly curved corner is exactly the escalation trigger. No builder written.
 *
 * The two churches (way/274428408, way/262577281) are logged in docs/sf-batches/ESCALATIONS.md, not here.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { facade } from '../../facade.ts'

export const B9: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /**
   * way/1249412094 — Isle House, 39 Bruton St, Treasure Island. `building=apartments`,
   * `building:levels=22`, height 67m tagged. Plain flat tower with two shallow chamfered corners, dark
   * recessed base, balanced punched windows above.
   */
  b9_tower_1249412094: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'recessed', storeys: 1, depth: 0.8, material: 'concrete' },
      shaft: { storeys: 20, windows: 'balanced', material: 'precast' },
      top: { kind: 'attic', storeys: 1, material: 'precast' },
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 1 },
      material: 'precast',
    })
  },

  /**
   * way/1487223700 — unnamed corner apartment tower, height 60m tagged. Faceted (not curved — checked
   * against both the reconstructed ring and the photo) balcony prow at the street corner, brick base.
   */
  b9_tower_1487223700: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 4, storeys: 1, material: 'dark-brick' },
      shaft: { storeys: 9, windows: 'bays', material: 'stucco' },
      top: { kind: 'attic', storeys: 1, material: 'stucco' },
      bands: { aboveGround: 'string', belowTop: 'string', top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 2 },
      material: 'stucco',
    })
  },

  /**
   * way/135103722 — unnamed Mission Bay office/lab building, height 60m tagged. Baked ring confirmed
   * strictly orthogonal. Plain glass-and-panel lab/office block, banded glazing.
   */
  b9_office_135103722: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'recessed', storeys: 1, depth: 0.6, material: 'concrete' },
      shaft: { storeys: 13, windows: 'continuous', material: 'glass' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 1 },
      material: 'concrete',
    })
  },

  /**
   * way/899281899 — unnamed Mission Bay office/lab building, height 48m tagged. Reconstructed ring
   * strictly orthogonal. Plain tan-panel-and-glass office block, grid windows.
   */
  b9_office_899281899: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'concrete' },
      shaft: { storeys: 10, windows: 'balanced', material: 'concrete' },
      top: { kind: 'attic', storeys: 1, material: 'concrete' },
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'concrete',
    })
  },

  /**
   * way/574616994 — unnamed Mission Bay building, height 48m tagged. Baked ring: orthogonal with one
   * single canted corner facet, not a rhythm. Dark panelled mid-rise, plain grid windows.
   */
  b9_midrise_574616994: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'concrete' },
      shaft: { storeys: 9, windows: 'balanced', material: 'dark-brick' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'dark-brick',
    })
  },

  /**
   * way/135103725 — unnamed Mission Bay office building, height 47m tagged. Baked ring confirmed strictly
   * orthogonal notched box. Tan-and-glass office building with banded glazing.
   */
  b9_office_135103725: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'recessed', storeys: 1, depth: 0.6, material: 'concrete' },
      shaft: { storeys: 9, windows: 'continuous', material: 'glass' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 1 },
      material: 'concrete',
    })
  },

  /**
   * way/135103710 — unnamed Mission Bay office building, height 47m tagged. Baked ring confirmed strictly
   * orthogonal box. Plain glass office building, recessed ground floor.
   */
  b9_office_135103710: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'recessed', storeys: 1, depth: 0.6, material: 'concrete' },
      shaft: { storeys: 9, windows: 'balanced', material: 'glass' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 1 },
      material: 'concrete',
    })
  },
}
