/**
 * A small, shared helper for a ROUND tiered/tapering pagoda spire — a stack of tiers, each a slender drum
 * under a shallow flared roof-disc with a projecting eave, narrowing as it rises, the whole thing topped by a
 * finial. This is the shape `docs/sf-batches/ESCALATIONS.md` calls a known kit gap for `way/1458363734`
 * (Peace Pagoda, Japantown): no `Tower['top']`/`Crown` case in `../tower.ts` produces a ROUND multi-tier
 * taper (`dome()`/`crown` shrink monotonically in ONE step, not several stepped tiers), and this is a
 * distinct shape from `../portsmouth.ts`'s `tieredPagodaRoof` (a SQUARE pavilion roof that kicks up at its
 * four corners and dips at each side's middle — a different silhouette entirely, for a different plan).
 *
 * Built here (not inlined into a single scratch file) so a later five-storey pagoda tower can reuse it
 * directly: the Japanese Tea Garden's `japaneseTeaGardenPagoda` in
 * `src/render/landmarks/sf/districts/parks.ts` currently fakes this shape with a plain `crown: 'hip'`
 * (docs/PROGRESS.md), and Portsmouth Square's own two pavilions stay on `tieredPagodaRoof` since their plan
 * really is square. Deliberately a small named function, not a subsystem: one helper, one job.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { prism, disc, type Rgb } from '../../models.ts'

export interface PagodaTierSpec {
  r: number        // drum radius at this tier's base
  drumH: number     // slender drum height
  roofH: number     // roof-disc rise, drum top to this tier's ridge
  eave?: number      // how far the eave oversails the drum, metres (default r * 0.55)
}

/**
 * One round pagoda tier: a slender drum, then a shallow roof-disc that flares OUT past the drum (the eave)
 * before tapering back in to the next tier's drum radius — the "roof form IS the building" silhouette a
 * single monotonic `dome()`/cone cannot say. Returns the y of the roof's ridge, where the next tier's drum
 * should start (narrower, per the caller's own shrink factor).
 */
export function pagodaTier(out: MeshBuilder, cx: number, cz: number, y0: number, spec: PagodaTierSpec,
                           nextR: number, drumColour: Rgb, roofColour: Rgb, sides = 20): number {
  const eave = spec.eave ?? spec.r * 0.55
  const outerR = spec.r + eave
  const drumTop = y0 + spec.drumH
  // drum: a plain slender cylinder
  prism(out, cx, cz, y0, drumTop, spec.r, sides, drumColour, 0, spec.r, false)
  // eave: flares out from the drum's own radius to the oversailing eave radius in a short rise, giving the
  // roof a projecting lip rather than starting the taper flush off the wall
  const eaveY = drumTop + spec.roofH * 0.18
  prism(out, cx, cz, drumTop, eaveY, spec.r, sides, roofColour, 0, outerR, false)
  // roof-disc proper: tapers from the oversailing eave down to the next tier's (narrower) drum radius,
  // capped flat where the next drum will stand
  const ridgeY = drumTop + spec.roofH
  prism(out, cx, cz, eaveY, ridgeY, outerR, sides, roofColour, 0, nextR, true)
  return ridgeY
}

/** A slim gilded finial spire with a couple of ring bands (a sōrin), for the top of the topmost tier. */
export function pagodaFinial(out: MeshBuilder, cx: number, cz: number, y0: number, h: number, r: number, colour: Rgb): void {
  prism(out, cx, cz, y0, y0 + h * 0.7, r, 8, colour, 0, r * 0.18, false)
  disc(out, cx, y0 + h * 0.35, cz, r * 1.3, colour, 0, 10)
  disc(out, cx, y0 + h * 0.55, cz, r * 1.05, colour, 0, 10)
  prism(out, cx, cz, y0 + h * 0.7, y0 + h, r * 0.18, 6, colour, 0, 0.02, false)
}
