/**
 * SF's neoclassical bank-and-civic temples — five buildings the owner reviewed together and gave the same
 * verdict (docs/LADDER.md, treatment 4, 2026-09-24), because they share one vocabulary: a colonnade of GIANT
 * columns on a raised base, an esplanade stair, an entablature, sometimes a dome or a set-back tower. That
 * vocabulary is `bankTemple()` in `src/render/landmarks/facade.ts` — one call, instanced five times below —
 * built on the kit's existing `giant-order` (already the Pacific Exchange's move, `b5_bank_256066230`) plus
 * two things that were missing: a monumental stair spanning the WHOLE portico front (`stair()`'s
 * `'esplanade'` preset existed but nothing wired it to a giant-order front) and a `dome` crown (the `Crown`
 * type already had `'dome'`, unused on any bank). See docs/KIT.md for the picture.
 *
 * Evidence per building — what a photograph could confirm, what a web search by name confirmed (San
 * Francisco is the READ, not any same-named building elsewhere), and where evidence ran out.
 *
 *  - `way/32947510` Old Federal Reserve Bank, 400 Sansome St. No usable street photo (Mapillary: junk).
 *    Confirmed by name (Wikipedia, National Register, SF Chronicle): built 1924, George W. Kelham; "an Ionic
 *    colonnade that is pure Beaux-Arts" for the lower building, "the upper building is in the new Moderne
 *    fashion" — i.e. exactly the owner's note, a giant colonnade with a FLAT entablature (no pediment
 *    mentioned anywhere) and a distinct tower above/behind in a plainer, Moderne register. 8 columns and the
 *    "tall black window verticals" are the owner's own read of the tower and are followed directly. No source
 *    describes a podium stair at this address, so the esplanade is a modest one flush with the pavement.
 *  - `way/32863779` Old San Francisco Mint ("The Granite Lady"), 88 Fifth St. No usable street photo
 *    (Mapillary: junk; Commons fetch for this id not yet in `sf-commons/`). Confirmed by name (Wikipedia,
 *    US Mint history pages, SEAONC): Alfred B. Mullett, 1869-74, "conservative Greek Revival... sober Doric
 *    order... central pedimented portico flanked by projecting wings" — i.e. `flanks: true`, `pediment: true`,
 *    `order: 'doric'`, exactly the Pacific Exchange's `in antis` move but WITH a pediment. Raised basement
 *    (built to resist tunnelling into the vaults) reached by a broad stair — the esplanade. Sandstone-faced
 *    over a granite basement/foundation.
 *  - `way/115944818` San Francisco Mint (current, "New Mint"), 155 Hermann St — a SEPARATE, later building;
 *    not to be confused with the Old Mint above. No usable street photo (Mapillary: junk; not yet in
 *    `sf-commons/`). Confirmed by name (Living New Deal, NPS): built 1937, Gilbert Stanley Underwood,
 *    Stripped Classicism — reinforced concrete faced in granite, four storeys around a central court. No
 *    source describes free-standing columns or a portico on this building (unlike its 1874 predecessor) —
 *    Stripped Classicism reads as flattened, simplified giant pilasters, not a colonnade, so it gets
 *    `engaged: true` and no pediment, dome or esplanade. This is the more conservative reading the evidence
 *    supports; there was not enough to justify inventing a portico.
 *  - `way/32946683` Savings Union Bank Building. Mapillary frame `way-32946683-02.jpg`: the corridor holds a
 *    single-storey granite temple on a corner site — six (visible) fluted Ionic columns under a pedimented
 *    portico, and, set back above and behind it, a large hemispherical DOME. This is the photograph the
 *    `dome` crown kind was added for.
 *  - `relation/3492808` Mills Building (and Mills Tower, the 1931 addition the relation also covers). Commons
 *    photo `relation-3492808-01.jpg`: a marble ground floor of fluted pilasters/columns framing round-arched
 *    openings (`MILLS TOWER` over the door), a plain terracotta shaft of tall narrow window bays above, and
 *    an arcaded attic of round-arched windows under the cornice. Classical facade at the base, "large tower"
 *    above — the owner's own note — so this is `facade()` with a giant-order BASE and a punched shaft, not
 *    `bankTemple()` (there is no temple front to the whole building, only its ground floor).
 *
 *  - `way/332374374` Academy of Art University - Liberal Arts. RESOLVED by the owner's direct observation
 *    (2026-09-24), not by a photograph — this was initially postponed because the Mapillary frames for this
 *    id (`way-332374374-0{1,2,3}.jpg`) show a low two-storey block with a small entrance portico, and a name
 *    search returned only other Academy-owned buildings (St. Brigid, First Congregational) with no address
 *    confirmation for this way. Both of those checks were correctly inconclusive — the name collides with
 *    other buildings, exactly as warned — but the owner has since seen the building in person and stated
 *    plainly: "academy of art university liberal arts campus IS a neoclassical bank temple former church, i
 *    saw it," and that "our pics are not accurate." A direct observation outranks an ambiguous frame, so this
 *    is built from the owner's description, NOT reconciled to the Mapillary frames, which are now known to
 *    be misleading for this id. A single dominant frontal portico (its former life as a church), not a
 *    corner colonnade like the Savings Union Bank — `on: 'street'` still used to avoid the `longestEdge`
 *    trap, but resolves here to one edge. No dome: not described, not added.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { bankTemple } from '../../facade.ts'
import { facade } from '../../facade.ts'
import { towerRing, insetRing, tower } from '../../tower.ts'

export const BANK_TEMPLES: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** way/32947510 — Old Federal Reserve Bank. 8-column flat Ionic colonnade, Moderne tower set back behind. */
  b4_bank_32947510: (out: MeshBuilder, fit: Fit): void => {
    const groundStoreys = 4
    bankTemple(out, fit, {
      columns: 8, order: 'ionic', storeys: groundStoreys, windows: 'balanced',
      engaged: false, flanks: false, pediment: false, material: 'limestone',
      top: null, bands: { aboveGround: null, belowTop: null, top: 'cornice' },
      esplanade: null, dome: null, on: 'street',
    })
    // the Moderne tower behind the temple front, set back on every side and rising the full height, with the
    // owner's "tall black window verticals" — a dark punched wall, narrow piers, thin dark glass.
    const behind = insetRing(towerRing(fit), 4)
    tower(out, { ...fit, ring: behind }, {
      height: fit.height,
      tiers: [{
        to: 1,
        face: { kind: 'punched', wall: [0.3, 0.3, 0.32], glass: [0.06, 0.06, 0.07], floor: 3.4, pitch: 2.2, solid: 0.72, material: 'granite' },
      }],
    })
  },

  /** way/32863779 — Old San Francisco Mint, "The Granite Lady". Doric portico in antis, pediment, esplanade. */
  b5_civic_32863779: (out: MeshBuilder, fit: Fit): void => {
    bankTemple(out, fit, {
      columns: 6, order: 'doric', storeys: 2, windows: 'dressed',
      engaged: false, flanks: true, pediment: true, material: 'sandstone',
      top: { kind: 'attic', storeys: 1, material: 'sandstone' },
      bands: { aboveGround: null, belowTop: 'string', top: 'cornice' },
      esplanade: null, dome: null, on: 'street',
    })
  },


  /** way/32946683 — Savings Union Bank Building. Ionic hexastyle portico, pediment, dome behind. */
  savingsUnionBank_32946683: (out: MeshBuilder, fit: Fit): void => {
    bankTemple(out, fit, {
      columns: 6, order: 'ionic', storeys: 1, windows: 'dressed',
      engaged: false, flanks: false, pediment: true, material: 'granite',
      top: null,
      bands: { aboveGround: null, belowTop: null, top: 'cornice' },
      esplanade: null, dome: { height: 8, radius: Math.min(fit.hx, fit.hz) * 0.7, colour: [0.5, 0.5, 0.52], drum: 2 },
      on: 'street',
    })
  },

  /**
   * way/332374374 — Academy of Art University - Liberal Arts, a former church in the bank-temple neoclassical
   * style, per the owner's direct observation (not the misleading Mapillary frames for this id — see the
   * file doc comment). Huge free-standing columns, a pedimented temple front, one dominant frontal portico.
   */
  academyOfArtLiberalArts_332374374: (out: MeshBuilder, fit: Fit): void => {
    bankTemple(out, fit, {
      columns: 6, order: 'corinthian', storeys: 4, windows: 'balanced',
      engaged: false, flanks: false, pediment: true, material: 'limestone',
      top: null,
      bands: { aboveGround: null, belowTop: null, top: 'cornice' },
      esplanade: null, dome: null, on: 'street',
    })
  },

  /** relation/3492808 — Mills Building (+ Mills Tower). Classical marble ground floor, tall punched shaft, arcaded attic. */
  millsBuilding_3492808: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: {
        kind: 'giant-order', columns: 6, storeys: 1, order: 'corinthian', windows: 'dressed',
        engaged: true, flanks: false, pediment: false, material: 'marble',
      },
      shaft: { storeys: Math.max(4, Math.round(fit.height / 3.6) - 3), windows: 'vertical', material: 'terracotta' },
      top: { kind: 'arcaded', storeys: 2, material: 'terracotta' },
      bands: { aboveGround: 'cornice', belowTop: 'string', top: 'bracketed' },
      crown: { kind: 'balustrade', height: 1, material: 'terracotta' },
      frame: null,
      entrance: { at: 'centre', kind: 'portal', steps: 2 },
      material: 'terracotta',
    })
  },
}
