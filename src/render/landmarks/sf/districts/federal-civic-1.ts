/**
 * Four federal/civic buildings from docs/sf-queue.csv, all "high priority": three currently wrong or generic
 * (`restyle` placeholders standing in for real classical buildings), one — the 9th Circuit courthouse — with
 * NO model at all. None of the four is a temple-front (no free-standing portico), so `bankTemple()` does not
 * apply; all four are `facade()`'s OTHER neoclassical vocabulary — `rusticated` ground, `arched`/`pedimented`
 * windows, a pilastered `frame` — the grammar the kit's own doc comment on `Windows` names the US Appraisers
 * Building (way/32965865) as the reference example for.
 *
 * Evidence:
 *  - `way/32859013` United States Custom House, 555 Battery St. Mapillary `way-32859013-0{1,2,3}.jpg`
 *    (all kept, corridor confirmed): a long rusticated stone block, banded stonework at the base, giant
 *    fluted composite pilasters rising through the upper storeys at the corners and end bays (frame 03,
 *    the Washington/Battery corner), a heavy dentilled cornice, round-arched and pedimented window surrounds.
 *    Currently `restyle: "tenement"` in lowrise.json — plainly wrong (a tenement is a plain punched wall;
 *    this is a monumental federal building with a full order of pilasters).
 *  - `way/32965865` United States Appraisers Building, 630 Sansome St. Mapillary `way-32965865-0{1,2,3}.jpg`
 *    (all kept): the corner in 03 shows exactly the rustication bands and sculpted, pedimented window
 *    surrounds the kit's own `Windows` doc comment cites this building for — no giant order visible in any
 *    frame, a low (3-storey) rusticated block. Currently only `restyle: "classical"` with a generic note;
 *    this gives it its own procedural read of the same evidence.
 *  - `way/108389188` San Francisco Civic Center Courthouse (Hiram W. Johnson State Office Building), 455
 *    Golden Gate Ave. Mapillary `way-108389188-0{1,2,3}.jpg` (all kept): a pale rusticated podium, a tier of
 *    tall round-arched windows, plainer storeys above, a rounded corner pavilion topped with a small dome —
 *    the dome is a real feature of the building but `facade()` has no per-corner crown, so it is left off
 *    rather than invented as a whole-roof dome it does not have. Currently `restyle: "brick"` — wrong
 *    material and wrong massing (a plain brick wall reads nothing like a rusticated stone civic block).
 *  - `relation/19306325` + `way/38612651` James R. Browning U.S. Court of Appeals Building (9th Circuit),
 *    7th & Mission, a full 1905 Beaux-Arts block with a 1933-34 Kelham addition on top. No usable Mapillary
 *    frame (`way/38612651` marked junk, `relation/19306325` not fetched) — confirmed by name instead
 *    (Wikipedia, GSA, Library of Congress): white Sierra granite, "enclosed pediments, balustrades, and rows
 *    of arched windows," Italian-Renaissance-palazzo massing, NO free-standing colonnade described anywhere.
 *    That rules out `bankTemple()` even for the grandest of these four. TWO OSM ways cover the one building
 *    (the relation is the whole-block multipolygon, `way/38612651` its inner courtyard core) — modelled as
 *    ONE entry over the union, both ids in its manifest `osm` array, because the building reads from the
 *    street as a single monumental block and a second body on the courtyard way would double it. Currently
 *    nothing in any manifest references either id.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { facade } from '../../facade.ts'

export const FEDERAL_CIVIC_1: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** way/32859013 — US Custom House. Rusticated base, giant composite pilasters at the corners, pedimented windows. */
  usCustomHouse_32859013: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'rusticated', storeys: 1, material: 'limestone' },
      shaft: { storeys: 3, windows: 'dressed', material: 'limestone' },
      top: { kind: 'attic', storeys: 1, material: 'limestone' },
      bands: { aboveGround: 'cornice', belowTop: 'string', top: 'dentil' },
      crown: { kind: 'parapet', height: 0.8, material: 'granite' },
      frame: { verticals: { kind: 'pilaster', width: 1.4, at: 'bays', count: 5, order: 'corinthian' }, horizontals: null, recess: 0, material: 'limestone' },
      entrance: { at: 'centre', kind: 'portal', steps: 3 },
      material: 'limestone',
    })
  },

  /** way/32965865 — US Appraisers Building. Low rusticated block, sculpted pedimented windows, no giant order. */
  usAppraisersBuilding_32965865: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'rusticated', storeys: 2, material: 'granite' },
      shaft: null,
      top: { kind: 'attic', storeys: 1, material: 'granite' },
      bands: { aboveGround: 'cornice', belowTop: 'string', top: 'dentil' },
      crown: { kind: 'parapet', height: 0.6, material: 'granite' },
      frame: null,
      entrance: { at: 'centre', kind: 'portal', steps: 3 },
      material: 'granite',
    })
  },

  /** way/108389188 — SF Civic Center Courthouse. Rusticated podium, tall arched windows, plain upper storeys. */
  sfCivicCenterCourthouse_108389188: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'rusticated', storeys: 1, material: 'limestone' },
      shaft: { storeys: 2, windows: 'arched', material: 'limestone' },
      top: { kind: 'attic', storeys: 1, material: 'limestone' },
      bands: { aboveGround: 'cornice', belowTop: 'string', top: 'cornice' },
      crown: { kind: 'balustrade', height: 1, material: 'ashlar' },
      frame: null,
      entrance: { at: 'centre', kind: 'portal', steps: 3 },
      material: 'limestone',
    })
  },

  /**
   * relation/19306325 + way/38612651 — James R. Browning U.S. Court of Appeals Building (9th Circuit).
   * Rusticated granite base, three storeys of round-arched windows (the 1905 original), a shallower
   * pedimented-window tier above (the 1933-34 addition), a balustraded roofline. No free-standing colonnade
   * in any source — Italian-Renaissance palazzo massing on a whole-block footprint.
   */
  ninthCircuitCourthouse_19306325: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'rusticated', storeys: 1, material: 'limestone' },
      shaft: { storeys: 3, windows: 'arched', material: 'limestone' },
      top: { kind: 'attic', storeys: 2, material: 'limestone' },
      bands: { aboveGround: 'cornice', belowTop: 'cornice', top: 'dentil' },
      crown: { kind: 'parapet', height: 0.8, material: 'ashlar' },
      frame: null,
      entrance: { at: 'centre', kind: 'portal', steps: 4 },
      material: 'limestone',
    })
  },
}
