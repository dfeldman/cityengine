import type { MeshBuilder } from '../../../../buildings.ts'
import { type Rgb } from '../../../../models.ts'
import { beam, block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { basin, G } from '../plaza-common.ts'

/*
 * THE FONTAINE DU COQ (avenue du Coq, 9e, at the avenue's dead end by the rue Saint-Lazare; Wikidata Q41621277, frwiki
 * "Fontaine du Coq"): the last scrap of the château des Porcherons (destroyed 1854). A free-standing stone aedicule: two
 * rusticated piers under a cornice, between them a shell-headed niche (cul-de-four) whose arch is carved with a shell frieze
 * and, above the keystone, a bas-relief of a fish bearing a trident; in the niche a small cast-iron wall fountain (a Modly
 * piece: statues manifest coq-fontaine) pouring into a half-round stone basin. Frame: −z the front (the avenue is north of
 * it: the front faces ~345°), x across, y up, pavement at G. Sizes are scaled off one Commons photograph (Fontaine du Coq.jpg)
 * at 121 px/m, taking the whole aedicule as ~3.8 m wide: not surveyed, so ±15 %.
 */
export const HX = 1.9
export const HZ = 1.3

// tunables
const PIER_W = 0.85          // each pier's width
const FRONT_Z = 0.3          // the aedicule's front face
const BACK_Z = 1.3           // its back
const NICHE_BACK = 0.75      // niche back plane
const SPRING = 2.95          // arch springing
const ARCH_R = 0.8           // opening half-width = arch radius
const TOP = 3.75             // under the entablature
const COURSE = 0.46          // rusticated course height
const FRIEZE_H = 0.3
const CORNICE_H = 0.4
const CORNICE_OUT = 0.22
const FLOOR = 0.5            // niche floor above G
const BASIN_R = 1.12         // half-round basin radius
const BASIN_H = 0.5          // its rim height above G
const RIM = 0.13

const STONE: Rgb = hex('#c9c0ad')
const WEATHERED: Rgb = hex('#b4aa95')
const CARVED: Rgb = hex('#bfb5a0')
const WATER: Rgb = hex('#5f7a60')   // the photo's basin is green with algae

/** where the cast-iron fountain stands (landmark frame), for the statues manifest */
export const STELE_AT: [number, number, number] = [0, G + FLOOR, 0.5 * (FRONT_Z + NICHE_BACK) + 0.1]

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  const W = ARCH_R + 0.25
  // the two piers, with joint courses on their fronts and inner faces
  for (const s of [-1, 1]) {
    const xa = s > 0 ? ARCH_R : -ARCH_R - PIER_W + 0.25, xb = s > 0 ? ARCH_R + PIER_W - 0.25 : -ARCH_R
    const x0 = s > 0 ? ARCH_R : -(HX), x1 = s > 0 ? HX : -ARCH_R
    block(q, x0, x1, FRONT_Z, BACK_Z, y(0), y(TOP), STONE)
    block(q, x0 - (s > 0 ? 0 : 0.0), x1, FRONT_Z - 0.06, FRONT_Z, y(0), y(0.35), WEATHERED)   // base course, a little proud
    for (let c = COURSE; c < TOP - 0.2; c += COURSE) block(q, x0, x1, FRONT_Z - 0.025, FRONT_Z, y(c), y(c + 0.03), shade(STONE, 0.7))
    void xa; void xb
  }
  // the wall behind the niche, the niche floor, the walls above the arch
  block(q, -ARCH_R, ARCH_R, NICHE_BACK, BACK_Z, y(0), y(SPRING + ARCH_R), shade(STONE, 0.9))
  block(q, -ARCH_R, ARCH_R, NICHE_BACK - 0.03, NICHE_BACK, y(FLOOR), y(SPRING), shade(STONE, 0.78))
  block(q, -ARCH_R, ARCH_R, FRONT_Z - 0.04, NICHE_BACK, y(0), y(FLOOR), WEATHERED)
  // the front above the arch: columns of stone from the arch ring to the entablature, the ring itself a lighter band
  const N = 24
  for (let i = 0; i < N; i++) {
    const xa = -ARCH_R + (2 * ARCH_R * i) / N, xb = -ARCH_R + (2 * ARCH_R * (i + 1)) / N, xm = (xa + xb) / 2
    const ri = Math.sqrt(Math.max(0, ARCH_R * ARCH_R - xm * xm))
    block(q, xa, xb, FRONT_Z, NICHE_BACK + 0.05, y(SPRING + ri), y(TOP), STONE)
    block(q, xa, xb, FRONT_Z - 0.05, FRONT_Z, y(SPRING + ri), y(SPRING + ri + 0.2), CARVED)   // the carved archivolt band
  }
  // the shell in the head: ribs fanning from the springing centre
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * Math.PI
    beam(q, [0, y(SPRING), NICHE_BACK - 0.05], [Math.cos(a) * (ARCH_R - 0.03), y(SPRING + Math.sin(a) * (ARCH_R - 0.03)), NICHE_BACK - 0.05], 0.035, shade(STONE, 1.08))
  }
  // the keystone and the fish-and-trident bas-relief over it (shallow relief: procedural)
  const yk = SPRING + ARCH_R + 0.22
  block(q, -0.1, 0.1, FRONT_Z - 0.07, FRONT_Z, y(yk - 0.2), y(yk + 0.1), CARVED)
  const fy = yk + 0.1
  for (let i = 0; i < 5; i++) block(q, -0.32 + i * 0.12 - 0.0, -0.2 + i * 0.12, FRONT_Z - 0.05, FRONT_Z, y(fy + 0.04 + 0.03 * (2 - Math.abs(i - 2))), y(fy + 0.12 + 0.05 * (2 - Math.abs(i - 2))), CARVED)   // the fish
  block(q, 0.35, 0.37, FRONT_Z - 0.05, FRONT_Z, y(fy - 0.02), y(fy + 0.3), CARVED)       // trident shaft
  block(q, 0.31, 0.41, FRONT_Z - 0.05, FRONT_Z, y(fy + 0.26), y(fy + 0.3), CARVED)
  // the shell frieze: a row of small ribbed shells along the entablature's band
  const fz0 = TOP, fz1 = TOP + FRIEZE_H
  block(q, -HX, HX, FRONT_Z - 0.04, BACK_Z, y(fz0), y(fz1), shade(STONE, 0.95))
  for (let i = 0; i < 14; i++) {
    const x = -HX + 0.2 + (i * (2 * HX - 0.4)) / 13
    block(q, x - 0.07, x + 0.07, FRONT_Z - 0.08, FRONT_Z - 0.04, y(fz0 + 0.05), y(fz1 - 0.05), CARVED)
  }
  // the cornice with dentils, projecting
  const c0 = fz1
  block(q, -HX - CORNICE_OUT, HX + CORNICE_OUT, FRONT_Z - CORNICE_OUT, BACK_Z + 0.05, y(c0), y(c0 + CORNICE_H), shade(STONE, 1.04))
  for (let i = 0; i < 22; i++) {
    const x = -HX + 0.1 + (i * (2 * HX - 0.2)) / 21
    block(q, x - 0.05, x + 0.05, FRONT_Z - 0.08, FRONT_Z, y(c0 - 0.05), y(c0), shade(STONE, 0.8))
  }
  block(q, -HX - CORNICE_OUT, HX + CORNICE_OUT, FRONT_Z - CORNICE_OUT - 0.04, FRONT_Z - CORNICE_OUT, y(c0 + CORNICE_H - 0.08), y(c0 + CORNICE_H), shade(STONE, 1.1))
  void W
  // the half-round basin against the niche's foot
  const arc = (r: number): { x: number; z: number }[] => {
    const pts: { x: number; z: number }[] = []
    for (let i = 0; i <= 18; i++) {
      const a = (i / 18) * Math.PI
      pts.push({ x: Math.cos(a) * r, z: FRONT_Z - 0.15 - Math.sin(a) * r })
    }
    return pts
  }
  const outer = [...arc(BASIN_R), { x: -BASIN_R, z: FRONT_Z + 0.2 }, { x: BASIN_R, z: FRONT_Z + 0.2 }].reverse()
  const inner = [...arc(BASIN_R - RIM), { x: -(BASIN_R - RIM), z: FRONT_Z + 0.2 }, { x: BASIN_R - RIM, z: FRONT_Z + 0.2 }].reverse()
  basin(q, outer, inner, y(0), y(BASIN_H), shade(STONE, 1.02), WATER)
  // a dark spill stain under the lip of the basin (the bowl is mossy)
  // the iron fountain is the Modly piece (coq-fontaine): nothing drawn here
}

export function fontaineDuCoq(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
