/**
 * Kit batch 1 (docs/sf-batches/BRIEF-KIT-BATCH.md): 20 unclaimed SF ways, mostly unnamed towers of 84-225 m with
 * no builder and no photograph at all. Per the owner's instruction for this batch — "it's fine in nearly all
 * cases if the results are just facade kit generators that aren't perfect" — a plausible `facade()` treatment
 * derived from the real footprint, the tagged height and the classifier's own style/archetype guess (baked into
 * `public/cities/san-francisco/tiles/*.json` as `style`/`archetype`) is a clear improvement over nothing.
 *
 * Only three of the twenty have a Mapillary reference (`docs/shots/refs/sf-mapillary/way-*.jpg`):
 * `way/436648569`, `way/320721969`, `way/432712476`. `436648569` and `432712476` are escalated below (see their
 * comments) so only `320721969` is actually built from a photograph; the rest here are built BLIND, from the
 * plan, the height and the baked style/archetype only — noted per builder.
 *
 * Kept (11, `kit`): 681442044, 79377162, 118480406, 1365382601, 159280395, 91626348, 1410929341, 320721969,
 * 197462674, 436473931, 255960463.
 *
 * Escalated (9, no builder — see the report): 288717109, 1330586852, 260320982, 432712476/477/478/479,
 * 436648569, 783200255.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { facade } from '../../facade.ts'

export const B1: Record<string, (out: MeshBuilder, fit: Fit) => void> = {

  /**
   * way/79377162 — 12 m, 3 levels, baked style "brick"/archetype "loft". A small SoMa brick loft building:
   * shopfront ground floor, plain brick storeys above, no top or crown — three storeys is not enough for one.
   * No photograph. Built BLIND.
   */
  b1_loft_79377162: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 4, storeys: 1, material: 'dark-brick' },
      shaft: { storeys: 2, windows: 'balanced', material: 'brick' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 0 },
      material: 'brick',
    })
  },

  /**
   * way/118480406 — 16 m, 4 levels, baked archetype "sfapartment". A plain small apartment building: a modest
   * street door, plain brick storeys, a string course under the cornice. No photograph. Built BLIND.
   */
  b1_apartment_118480406: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'stucco' },
      shaft: { storeys: 3, windows: 'balanced', material: 'stucco' },
      top: null,
      bands: { aboveGround: null, belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 2 },
      material: 'stucco',
    })
  },

  /**
   * way/1365382601 — 32 m, 8 levels, baked style "chicago"/archetype "prewarOffice". A small pre-war Chicago-
   * school office building: a rusticated stone base, a plain brick shaft with vertical bays, a dentilled
   * cornice reading as composed rather than extruded. No photograph. Built BLIND.
   */
  b1_prewarOffice_1365382601: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'rusticated', storeys: 2, material: 'limestone' },
      shaft: { storeys: 5, windows: 'vertical', material: 'brick' },
      top: { kind: 'attic', storeys: 1, material: 'limestone' },
      bands: { aboveGround: 'string', belowTop: 'string', top: 'dentil' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 3 },
      material: 'brick',
    })
  },

  /**
   * way/320721969 — the ONE building in this batch actually built from a photograph
   * (`docs/shots/refs/sf-mapillary/way-320721969-01.jpg`, geotag-verified): a plain glass residential tower on
   * a rust/oxide-coloured metal-clad podium of about 8 storeys, glass curtain wall above with balcony rails
   * reading as horizontal bands, a plain flat top (no crown visible in the photo). Two OSM parts confirm the
   * split: way/485966925 (24 m, 6 levels — the podium) and way/437695648 (91 m, 32 levels — the tower above
   * it), height taken from the tagged total via `fit.height`.
   */
  b1_tower_320721969: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 6, material: 'bronze' },
      shaft: { storeys: 30, windows: 'horizontal', material: 'glass' },
      top: null,
      bands: { aboveGround: 'cornice', belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 0 },
      material: 'bronze',
    })
  },



}
