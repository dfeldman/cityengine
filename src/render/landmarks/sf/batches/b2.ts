/**
 * Kit batch 2 (docs/sf-batches/BRIEF-KIT-BATCH.md): 20 given SF ways.
 *
 * One line per building, decided BEFORE any code, from real OSM tag data (`tools/cache/osm/cuts/*.opl`,
 * queried by way id) plus the baked tile footprints (`public/cities/san-francisco/tiles/*.json`) and any
 * reference photo under `docs/shots/refs/`:
 *
 *   494810841   escalate — building:part=yes, height 56-60m, a 36/37-point (non-rectangular) footprint
 *               IDENTICAL to way/494810787's — two stacked height-slices of one complex-plan tower whose
 *               lower floors (0-46m) are not in this batch. No parent outline resolves either.
 *   225193440   escalate — way/225193440 is Saint Ignatius Roman Catholic Church itself (building=church,
 *               amenity=place_of_worship) — nave, tower, apse. There is a church() kit; this is it.
 *   1028575826  escalate — a 6-point sub-footprint sitting INSIDE Saint Ignatius Church's own bounding box
 *               (way/225193440, above): a building:part of the same church complex, not a standalone building.
 *   1028575827  escalate — the same: a second building:part of the Saint Ignatius Church complex.
 *   256730074   kit — "Mandarin Tower", building=yes, height 57m. Photographed
 *               (docs/shots/refs/sf-mapillary/way-256730074-*.jpg): a round-arched two-storey arcade
 *               (dark shopfront glass, a canopy) under a plain cream/stucco residential tower with punched
 *               windows, flat top.
 *   4561913     bail — does not resolve as a way, node or relation in the current OSM extract
 *               (tools/cache/osm/cuts/*.opl and tools/cache/osm/norcal-latest.osm.pbf both queried; not
 *               found). All that exists is a stale baked tile fragment with an interior hole in its ring and
 *               no name/type tags recoverable — not a usable reference.
 *   1160773277  escalate — "Hotel Kabuki" (name tag), but its OSM outline is SUPERSEDED: two building:part
 *               ids (681442041, 1411410563) carry `partOf: 1160773277` in the baked tiles, the same pattern
 *               BUGS.md #100/the Salesforce Tower note describes — the real massing is in the parts, not
 *               this outline, and the kit cannot say a building it does not have the plan for.
 *   494810787   escalate — see 494810841 above; its lower-floor twin (0-46m of the same stack).
 *   1487162811  escalate — building:part=yes, no min_height (rises from ground), footprint ~1845-1860 ×
 *               -235..-249 — essentially the SAME ~20x15m footprint as way/1487162810 (~1842-1862 ×
 *               -232..-252), just 14 vs 13 levels: two massing volumes stacked on one plan, not two towers.
 *   112878589   kit — Aronson Building, 706 Mission St, 1903, building=office, height 55m, 10 levels.
 *               Photographed (docs/shots/refs/batch2/way-112878589.jpg): rusticated stone base with round-
 *               arched openings, plain brick shaft in vertical bays, ornamented cornice. Per the owner's
 *               triage this one is NOT flagged for special treatment — kit it as a box.
 *   256029744   kit — City College of San Francisco Downtown Campus, 88 4th St, height 54m. Photographed
 *               (docs/shots/refs/batch2/way-256029744*.jpg): a plain tan mid-rise, canopy/shopfront ground
 *               floor, punched windows above. Per the owner's triage this one is also NOT flagged — kit it.
 *   256029750   kit — building=yes, height "54 m", no name. Photographed
 *               (docs/shots/refs/batch2/way-256029750*.jpg): a plain dark curtain-glass office box.
 *   1389914425  escalate — "general building outline for Transbay Block 2 East" (note tag), building=
 *               construction/apartments, height 68m/17 levels. Tried as `kit` first: the real ring
 *               (8 points, not 4) turned out NOT to be a plain rectangle — a deep re-entrant notch cut fully
 *               through the plan, confirmed by rendering it (`docs/shots/models/b2_tower_1389914425-top.png`):
 *               two towers joined at a corner around a real light-well/courtyard void, not a box. The OSM
 *               note also says this outline itself "can be refined once imagery reflects current conditions"
 *               — an admittedly provisional shape. Escalated: a notch that deep, that a single `facade()`
 *               composition (one centred entrance, one band set) cannot honestly say across both prongs.
 *   136104349   kit — "Foundry Square II" / Orrick Building, 405 Howard St, height 55m. Photographed
 *               (docs/shots/refs/batch2/way-136104349*.jpg): a dark glass office box, ground-floor retail
 *               glazing under awnings.
 *   1474571838  escalate — "BayCrest Towers" (name tag), building=yes, but the outline is SUPERSEDED: SIX
 *               building:part ids (1474571839/40/41, 1487195805/06, 260318802) carry `partOf: 1474571838` —
 *               a genuinely multi-body complex, not a box.
 *   1282042031  escalate — "Clementina Towers" (name tag), building=apartments, outline SUPERSEDED by three
 *               building:part ids (288717103, 288717112, 684194103) with `partOf: 1282042031`.
 *   1487162810  escalate — see 1487162811 above; the other half of the same stacked pair.
 *   1418972816  escalate — building:part=yes, height 51m but min_height 46m: a bare 5 m TOP SLICE of a taller
 *               tower whose base (0-46m) is not in this batch and does not resolve anywhere else either — a
 *               kit builder here can only draw a floating box, which is exactly the "approximate with a plain
 *               wall" trap the brief calls out.
 *   944986473   kit, WITH A CORRECTED HEIGHT — building:part=yes, height 50m/13 levels per the tag/bake, but
 *               photographed (docs/shots/refs/sf-mapillary/way-944986473-*.jpg) as a low brick industrial/loft
 *               building with a tall round-arched multi-pane window and a corbelled brick cornice — nothing
 *               like a 50 m tower, and its own footprint is a plain ~20x20m rectangle. Per the brief ("if the
 *               reference disagrees with the tagged height, believe the reference"), built at ~14m instead.
 *   407324074   escalate — "140 South Van Ness" (name tag), building=residential, height 33m tagged, but the
 *               outline is SUPERSEDED: three building:part ids (132605515, 407324071, 407324072) carry
 *               `partOf: 407324074` — the real massing is in the parts.
 *
 * Kept (6, `kit`): 256730074, 112878589, 256029744, 256029750, 136104349, 944986473.
 * Escalated (13, no builder): 494810841, 225193440, 1028575826, 1028575827, 1160773277, 494810787,
 * 1487162811, 1474571838, 1282042031, 1487162810, 1418972816, 407324074, 1389914425.
 * Bailed (1, no builder, no usable reference): 4561913.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { facade } from '../../facade.ts'

export const B2: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /**
   * way/256730074 — "Mandarin Tower", 57 m, no OSM level tag, baked style "bauhaus". Photographed: a
   * round-arched two-storey base at street level (dark shopfront glass under a canopy in the photo), a plain
   * cream/stucco residential shaft above with balanced punched windows, a small flat-topped attic storey (the
   * mechanical penthouse visible in the photo), no crown.
   *
   * `ground: arcade` is the true shape of the photo — a round-arched two-storey base. It was tried first,
   * hit BUGS.md #96 (`arcade()` drew no visible arches) and was swapped for `shopfronts` to work around the
   * bug. #96 is fixed (see BUGS.md), so this is back to `arcade`.
   */
  b2_tower_256730074: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'arcade', arches: 6, storeys: 2, material: 'terracotta' },
      shaft: { storeys: 11, windows: 'balanced', material: 'stucco' },
      top: { kind: 'attic', storeys: 1, material: 'stucco' },
      bands: { aboveGround: 'cornice', belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'portal', steps: 2 },
      material: 'stucco',
    })
  },

  /**
   * way/112878589 — Aronson Building, 706 Mission St, 1903, 55 m, 10 levels, baked style "chicago"/archetype
   * "prewarOffice". Photographed: a rusticated stone base with round-arched ground-floor openings, a plain
   * brick shaft with vertical bays, a dentilled cornice. Kept per the owner's triage — kit it as a box.
   */
  b2_prewarOffice_112878589: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'rusticated', storeys: 2, material: 'limestone' },
      shaft: { storeys: 6, windows: 'vertical', material: 'brick' },
      top: { kind: 'attic', storeys: 2, material: 'limestone' },
      bands: { aboveGround: 'string', belowTop: 'string', top: 'dentil' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 3 },
      material: 'brick',
    })
  },

  /**
   * way/256029744 — City College of San Francisco Downtown Campus, 88 4th St, 54 m, baked style
   * "chicago"/archetype "prewarOffice". Photographed: a plain tan mid-rise, a canopy/shopfront ground floor,
   * plain punched windows above in horizontal bands, no crown. Kept per the owner's triage — kit it as a box.
   */
  b2_college_256029744: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 6, storeys: 1, material: 'concrete' },
      shaft: { storeys: 11, windows: 'balanced', material: 'stucco' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 2 },
      material: 'stucco',
    })
  },

  /**
   * way/256029750 — unnamed, building=yes, height "54 m", baked style "chicago". Photographed: a plain dark
   * curtain-glass office box, flat top, no ornament — the honest kit answer for an ordinary building this
   * plain.
   */
  b2_office_256029750: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 2, material: 'glass' },
      shaft: { storeys: 10, windows: 'continuous', material: 'glass' },
      top: null,
      bands: { aboveGround: null, belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 0 },
      material: 'glass',
    })
  },

  /**
   * way/136104349 — "Foundry Square II" / Orrick Building, 405 Howard St, 55 m, baked style
   * "skyscraper"/archetype "tower". Photographed: a dark glass office box, ground-floor retail glazing under
   * awnings, a continuous curtain shaft, plain flat top.

  /**
   * way/944986473 — building:part=yes, tagged/baked as 50 m over 13 levels, but photographed
   * (docs/shots/refs/sf-mapillary/way-944986473-*.jpg) as a low brick industrial/loft building with a tall
   * round-arched, multi-pane window and a corbelled brick cornice — nothing like a 50 m tower, and its own
   * footprint is a plain ~20x20 m rectangle consistent with a small building, not a highrise plate. Built at
   * a corrected ~14 m (the brief: believe the reference over the tag) — a two-storey brick loft with the
   * photo's big round-arched windows.
   *
   * `ground: arcade` was tried first and, like 256730074 above, hit BUGS.md #96 (`arcade()` drew no visible
   * arches) — swapped for a plain brick ground with an `arched` window shaft as a workaround. #96 is fixed
   * (see BUGS.md), so this is back to `arcade`, true to the photo's round-arched openings.
   */
  b2_loft_944986473: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'arcade', arches: 3, storeys: 1, material: 'dark-brick' },
      shaft: { storeys: 1, windows: 'arched', material: 'brick' },
      top: null,
      bands: { aboveGround: null, belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 0 },
      material: 'dark-brick',
    })
  },
}
