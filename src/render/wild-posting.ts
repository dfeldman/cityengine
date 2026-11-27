/**
 * WILD POSTING (owner, 2026-11-27: "double the size of the library and work on the flyers"): what is glued and taped
 * to the street walls of both cities, beside the furniture's framed ads (render/affiches.ts). Two habits:
 * - the BILL ROW: one concert or show poster pasted edge to edge two to five times, now and then a second row of
 *   another above it — Paris's affichage sauvage, the Mission's wheatpaste;
 * - the FLYER PATCH: lost cats, gigs, rooms, lessons, taped up one over another, none quite straight.
 * A handful of fixed variants (models are built once each, render/city.ts MODEL_MEMO); which bill and which flyers a
 * wall wears is picked by where it stands. The placer (city.ts, beside the wall lamps) picks the walls: street-facing,
 * an everyday style, more often where the ground floor has no shops.
 */
import type { MeshBuilder } from './buildings.ts'
import { affiche } from './affiches.ts'
import type { StyleId } from '../city/facade.ts'

export const WILD = {
  /** the share of street-facing walls carrying something: with shops on the ground floor, and without */
  rate: 0.035, rateBlank: 0.12,
  /** SF's walls more (its lots are narrow and its walls short, and the Mission is papered), a multiplier */
  sfBoost: 2.5,
  /** the shortest wall that gets any, metres, and the share of its length kept clear at each end */
  minWall: 6, margin: 0.22,
  /** a bill's half size (≈ 60 × 88 cm, the fly-poster's sheet) and its centre's height */
  bill: { hw: 0.3, hh: 0.44, y: 1.45 },
  /** a flyer's half size, and the band of heights the patch spreads over */
  flyer: { hw: 0.108, hh: 0.14, y0: 1.05, y1: 1.7, spread: 1.4 },
  /** off the wall, and between one sheet and the one pasted over it */
  lift: 0.03, layer: 0.005,
  /** how many different models; the most a flyer is turned off straight, radians */
  variants: 12, tilt: 0.16,
}
/** the walls that get it: everyday buildings, not the palaces, churches and offices */
export const WILD_STYLES = new Set<StyleId>(['haussmann', 'marais', 'brick', 'tenement', 'bauhaus', 'brutalist', 'towerblock',
  'stucco', 'sfapartment', 'victorian', 'edwardian', 'chinatown'])

const h01 = (v: number, i: number): number => ((Math.imul((v * 2654435761) ^ Math.imul(i + 1, 0x9e3779b1), 0x85ebca6b) >>> 0) % 1000) / 1000

function wildPosting(out: MeshBuilder, v: number): void {
  const { bill, flyer, lift, layer } = WILD
  const habit = v % 4
  if (habit <= 1) {
    // the row: the same bill each time (the same seed and k), the second row another (k 1), half a sheet along
    const n = 2 + (v * 3) % 4
    for (let i = 0; i < n; i++) affiche(out, 'portrait', (i - (n - 1) / 2) * bill.hw * 2, bill.y, lift, 0, 1, bill.hw, bill.hh, v, false, 'event').k = 0
    if (habit === 1) {
      const m = Math.max(1, n - 1)
      for (let i = 0; i < m; i++) affiche(out, 'portrait', (i - (m - 1) / 2) * bill.hw * 2 + bill.hw * 0.4, bill.y + bill.hh * 2, lift + layer, 0, 1, bill.hw, bill.hh, v, false, 'event').k = 1
    }
    // and a flyer or two taped over the corner of it
    for (let i = 0; i < v % 3; i++) {
      const f = affiche(out, 'flyer', (h01(v, i) - 0.5) * n * bill.hw * 1.6, bill.y - bill.hh * 0.5 + h01(v, i + 5) * 0.4, lift + layer * 2, 0, 1, flyer.hw, flyer.hh, v * 7 + i, false)
      f.tilt = (h01(v, i + 11) - 0.5) * 2 * WILD.tilt
    }
    return
  }
  // the patch: three to six flyers, each pasted over the last, and on one habit a bill among them
  const n = 3 + v % 4
  if (habit === 3) affiche(out, 'portrait', (h01(v, 40) - 0.5) * 0.6, bill.y, lift, 0, 1, bill.hw, bill.hh, v, false, 'event')
  for (let i = 0; i < n; i++) {
    const f = affiche(out, 'flyer', (h01(v, i) - 0.5) * flyer.spread, flyer.y0 + h01(v, i + 9) * (flyer.y1 - flyer.y0), lift + layer * (i + 1), 0, 1,
      flyer.hw, flyer.hh, v * 7 + i, false)
    f.tilt = (h01(v, i + 17) - 0.5) * 2 * WILD.tilt
  }
}

/** the variants, made once (their identity is the model memo's key), each facing local +z */
export const WILD_MODELS: ((o: MeshBuilder) => void)[] = Array.from({ length: WILD.variants }, (_, v) => (o: MeshBuilder) => wildPosting(o, v))
