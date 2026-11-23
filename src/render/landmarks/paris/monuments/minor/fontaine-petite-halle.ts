import type { MeshBuilder } from '../../../../buildings.ts'
import { type Rgb } from '../../../../models.ts'
import { beam, block, hex, roof, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'

/*
 * LA FONTAINE DE LA PETITE-HALLE (also Fontaine de Montreuil; rue du Faubourg-Saint-Antoine at the rue de Montreuil, 11e;
 * Beausire, 1719, listed 1962; Wikidata Q3076204): a free-standing little ashlar pavilion, about 4.5 x 4.5 m, a stepped plinth,
 * corner pilasters carrying a cornice, a low pediment on each face and a hipped roof behind them. The front (−z here) holds a
 * deep arched niche (OSM's footprint dents 0.95 m in there) with the bronze bearded mascaron (a Modly model: statues manifest
 * `montreuil-mascaron`) over a little trough; the two sides carry a blind arch with a round oculus, one a tall sunk panel, and the
 * back a plain door. Which face is which, the heights and the door side are read off two Commons photos (Fontaine Montreuil
 * vue.jpg; ...Southwest Corner on Rue du Faubourg Saint-Antoine.jpg) against the door (~2 m): not surveyed. The footprint is OSM
 * way 63649496 (claimed), 4.5 x 5.2 m with the pilasters and niche dent. Frame: −z the niche front, x across, y up, pavement at G.
 */
export const HX = 2.26
export const HZ = 2.58

// tunables
const BX = 2.1                // half-width of the wall body (pilasters stand proud of it)
const BZ = 2.42
const PIL_W = 0.32
const PIL_PROUD = 0.12
const PLINTH_H = 0.55
const WALL_H = 4.3            // to the cornice
const CORN_H = 0.35
const CORN_OUT = 0.14
const PED_H = 1.0
const PED_DEPTH = 0.3
const HIP_H = 1.5
const NICHE_A = 0.9           // half-width of the niche opening
const NICHE_SPRING = 2.35
const NICHE_D = 0.95          // its depth
const OCULUS_Y = 3.2
const OCULUS_R = 0.34
const DOOR_W = 0.5
const DOOR_H = 2.05

const STONE: Rgb = hex('#cdbd9a')
const PALE: Rgb = hex('#d9cba9')
const DARK: Rgb = hex('#9c8f74')
const DEEP: Rgb = hex('#a8997c')
const WATER: Rgb = hex('#6d93a0')
const WOOD: Rgb = hex('#4d4a44')

/** Attach point of the bronze mascaron: on the back of the niche (landmark frame, y includes G) */
export const MASK_AT: [number, number, number] = [0, G + 1.45, -BZ + NICHE_D + 0.03]

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  const top = WALL_H
  // plinth: two steps
  block(q, -BX - 0.3, BX + 0.3, -BZ - 0.3, BZ + 0.3, y(-0.2), y(0.25), DARK)
  block(q, -BX - 0.14, BX + 0.14, -BZ - 0.14, BZ + 0.14, y(0.2), y(PLINTH_H), shade(STONE, 0.92))
  // wall courses: the four faces as ashlar, the front pierced by the niche
  const course = (x0: number, x1: number, z0: number, z1: number, c: Rgb, f: number): void => {
    block(q, x0, x1, z0, z1, y(PLINTH_H), y(top), shade(c, f))
  }
  // sides and back: solid body
  course(-BX, BX, -BZ + NICHE_D, BZ, STONE, 1)
  // front: two jambs and the arched head over the opening, the arch as stepped voussoir slices
  course(-BX, -NICHE_A, -BZ, -BZ + NICHE_D + 0.05, STONE, 1)
  course(NICHE_A, BX, -BZ, -BZ + NICHE_D + 0.05, STONE, 1)
  const N = 10
  for (let i = 0; i < N; i++) {
    const x0 = -NICHE_A + (i / N) * 2 * NICHE_A, x1 = x0 + (2 * NICHE_A) / N
    const xc = (x0 + x1) / 2
    const h = NICHE_SPRING + Math.sqrt(Math.max(0, NICHE_A * NICHE_A - xc * xc))
    block(q, x0, x1, -BZ, -BZ + NICHE_D + 0.05, y(h), y(top), shade(STONE, 1))
  }
  // the niche's dark back, floor and archivolt
  block(q, -NICHE_A, NICHE_A, -BZ + NICHE_D - 0.03, -BZ + NICHE_D + 0.05, y(PLINTH_H), y(NICHE_SPRING), DEEP)
  for (let i = 0; i < N; i++) {
    const x0 = -NICHE_A + (i / N) * 2 * NICHE_A, x1 = x0 + (2 * NICHE_A) / N
    const xc = (x0 + x1) / 2
    const h = NICHE_SPRING + Math.sqrt(Math.max(0, NICHE_A * NICHE_A - xc * xc))
    block(q, x0, x1, -BZ + NICHE_D - 0.03, -BZ + NICHE_D + 0.05, y(NICHE_SPRING), y(h), DEEP)
  }
  const M = 14
  for (let i = 0; i < M; i++) {
    const a0 = (i / M) * Math.PI, a1 = ((i + 1) / M) * Math.PI
    const r = NICHE_A + 0.1
    beam(q, [Math.cos(a0) * r, y(NICHE_SPRING + Math.sin(a0) * r), -BZ - 0.04], [Math.cos(a1) * r, y(NICHE_SPRING + Math.sin(a1) * r), -BZ - 0.04], 0.07, PALE)
  }
  block(q, -NICHE_A - 0.05, NICHE_A + 0.05, -BZ - 0.05, -BZ + NICHE_D, y(PLINTH_H), y(PLINTH_H + 0.12), PALE) // threshold slab
  // trough under the mascaron
  block(q, -0.55, 0.55, -BZ + NICHE_D - 0.5, -BZ + NICHE_D - 0.02, y(PLINTH_H), y(PLINTH_H + 0.55), shade(STONE, 0.9))
  block(q, -0.47, 0.47, -BZ + NICHE_D - 0.44, -BZ + NICHE_D - 0.08, y(PLINTH_H + 0.5), y(PLINTH_H + 0.54), WATER)
  beam(q, [0, y(1.4), -BZ + NICHE_D - 0.1], [0, y(PLINTH_H + 0.55), -BZ + NICHE_D - 0.24], 0.02, hex('#c4d8dc'))

  // corner pilasters (every face), with a moulded cap
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const cx = sx * (BX - PIL_W / 2 + PIL_PROUD), cz = sz * (BZ - PIL_W / 2 + PIL_PROUD)
    block(q, cx - PIL_W / 2 - PIL_PROUD / 2, cx + PIL_W / 2 + PIL_PROUD / 2, cz - PIL_W / 2 - PIL_PROUD / 2, cz + PIL_W / 2 + PIL_PROUD / 2, y(PLINTH_H), y(top), shade(PALE, 0.97))
    block(q, cx - PIL_W / 2 - PIL_PROUD / 2 - 0.05, cx + PIL_W / 2 + PIL_PROUD / 2 + 0.05, cz - PIL_W / 2 - PIL_PROUD / 2 - 0.05, cz + PIL_W / 2 + PIL_PROUD / 2 + 0.05, y(top - 0.18), y(top), PALE)
  }
  // string course at springing height round the body
  block(q, -BX - 0.04, BX + 0.04, -BZ - 0.04, BZ + 0.04, y(NICHE_SPRING - 0.05), y(NICHE_SPRING + 0.05), shade(PALE, 0.95))
  // cornice
  block(q, -BX - CORN_OUT - PIL_PROUD, BX + CORN_OUT + PIL_PROUD, -BZ - CORN_OUT - PIL_PROUD, BZ + CORN_OUT + PIL_PROUD, y(top), y(top + CORN_H), PALE)

  // side faces (±x): blind arch with oculus on −x... a sunk panel on +x ; back (+z): the door
  for (const sx of [-1, 1]) {
    const xf = sx * (BX + 0.02)
    const pw = 1.1
    // sunk panel
    block(q, Math.min(xf, xf + sx * 0.05), Math.max(xf, xf + sx * 0.05), -pw, pw, y(PLINTH_H + 0.4), y(2.7), shade(PALE, 1.02))
    block(q, Math.min(xf, xf + sx * 0.03), Math.max(xf, xf + sx * 0.03), -pw + 0.08, pw - 0.08, y(PLINTH_H + 0.48), y(2.62), shade(STONE, 0.93))
    if (sx < 0) oculus(q, xf, y(OCULUS_Y), sx)
    else oculus(q, xf, y(OCULUS_Y), sx)
  }
  // door in the back face
  const zf = BZ + 0.02
  block(q, -DOOR_W - 0.12, DOOR_W + 0.12, zf, zf + 0.06, y(PLINTH_H), y(PLINTH_H + DOOR_H + 0.12), PALE)
  block(q, -DOOR_W, DOOR_W, zf + 0.03, zf + 0.09, y(PLINTH_H), y(PLINTH_H + DOOR_H), WOOD)
  block(q, -1.0, 1.0, zf, zf + 0.04, y(PLINTH_H + 0.9), y(2.8), shade(PALE, 1.02))
  block(q, -0.92, 0.92, zf, zf + 0.06, y(PLINTH_H + 0.98), y(2.72), shade(STONE, 0.93))
  block(q, -DOOR_W - 0.12, DOOR_W + 0.12, zf, zf + 0.06, y(PLINTH_H + DOOR_H + 0.12), y(PLINTH_H + DOOR_H + 0.2), shade(DARK, 0.9))
  oculus(q, 0, y(OCULUS_Y), 0, zf, true)

  // roof: a hip behind four pediments
  const ry = top + CORN_H
  roof(q, -BX - CORN_OUT, BX + CORN_OUT, -BZ - CORN_OUT, BZ + CORN_OUT, y(ry), HIP_H, BX - 0.6, BZ - 0.6, shade(STONE, 0.86))
  for (const sz of [-1, 1]) {
    const w = BX + 0.05
    const zc = sz * (BZ + CORN_OUT)
    roof(q, -w, w, Math.min(zc, zc - sz * PED_DEPTH), Math.max(zc, zc - sz * PED_DEPTH), y(ry), PED_H, w, 0, shade(STONE, 1.03))
  }
  for (const sx of [-1, 1]) {
    const w = BZ + 0.05
    const xc = sx * (BX + CORN_OUT)
    roof(q, Math.min(xc, xc - sx * PED_DEPTH), Math.max(xc, xc - sx * PED_DEPTH), -w, w, y(ry), PED_H, 0, w, shade(STONE, 1.03))
  }
  // a little ridge cap
  block(q, -0.5, 0.5, -0.5, 0.5, y(ry + HIP_H), y(ry + HIP_H + 0.12), shade(DARK, 0.9))
}

/** A round oculus in a blind arch: a dark disc ringed in pale stone, on a face at x (or at z when `onZ`), facing `s` (−1/+1). */
function oculus(q: MeshBuilder, c: number, yc: number, s: number, z?: number, onZ = false): void {
  const a = (u: number, v: number): [number, number, number] => onZ ? [u, v, z! + 0.07] : [c + s * 0.06, v, u]
  const n = 14
  const r = OCULUS_R
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2
    const p0 = a(Math.cos(a0) * r, yc + Math.sin(a0) * r), p1 = a(Math.cos(a1) * r, yc + Math.sin(a1) * r)
    beam(q, p0, p1, 0.05, PALE)
  }
  if (onZ) block(q, -r * 0.8, r * 0.8, z! + 0.04, z! + 0.08, yc - r * 0.8, yc + r * 0.8, DEEP)
  else block(q, Math.min(c, c + s * 0.08), Math.max(c, c + s * 0.08), -r * 0.8, r * 0.8, yc - r * 0.8, yc + r * 0.8, DEEP)
}

export function fontainePetiteHalle(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
