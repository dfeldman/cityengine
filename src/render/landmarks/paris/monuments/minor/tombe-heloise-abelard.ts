import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade, prism } from '../../../kit.ts'
import { beam } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'

/*
 * LE MONUMENT FUNÉRAIRE D'HÉLOÏSE ET ABÉLARD (Père-Lachaise, division 7; Wikidata Q3323370; OSM way 313811735, a 5.4 x 5.9 m
 * ring that is the iron fence). Alexandre Lenoir's neo-Gothic chapel of 1817, built from salvaged medieval stone: an open
 * canopy on corner piers and slender colonnettes, pointed arcades (3 bays on the gable fronts, 4 on the sides), a deep
 * entablature, a steep slate roof ending in two gables, each with a trefoil window, two portrait roundels, a relief of
 * saints and a cluster of pinnacles; gargoyles at the gable feet. Inside, on a stone chest, the two recumbent effigies
 * (Modly `heloise-abelard-gisants`, attached at EFFIGY_AT). Frame: −z a gable front, x across, y up from the ground (G).
 * All dimensions are scaled by eye off Commons photographs (and the OSM ring), not surveyed.
 */
export const HX = 2.7
export const HZ = 2.95

// tunables (metres above the ground)
const BW = 1.55, BD = 1.95                                // body half-width (across the gables) and half-depth
const PIER = 0.32, PIER_UP = 3.25                         // corner pier thickness; the arcade/entablature line
const SPRING = 2.45, N_FRONT = 3, N_SIDE = 4              // arch springing height; bays per gable front / per side
const COL_R = 0.085, COL_BASE = 0.3                       // colonnette radius and the floor it stands on
const ENT_H = 0.28, ENT_OUT = 0.12                        // entablature band depth and projection
const GABLE_H = 1.85                                      // roof rise above the entablature
const CHEST_HW = 0.5, CHEST_HD = 1.05, CHEST_H = 0.85    // tomb chest half-width/half-length/height above the floor
const FENCE_H = 1.35, BAR_PITCH = 0.17, KERB_H = 0.2     // iron railing round the ring
export const EFFIGY_AT: [number, number, number] = [0, G + COL_BASE + CHEST_H + 0.15, 0]

const STONE: Rgb = hex('#bdb6a2')
const PALE: Rgb = hex('#cbc4b0')
const DARK: Rgb = hex('#8b8675')
const SLATE: Rgb = hex('#55585e')
const VOID: Rgb = hex('#23211f')
const IRON: Rgb = hex('#1b1c1e')
const GROUND: Rgb = hex('#8a8466')
const UVS: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** A flat vertical disc in the plane z = zc, facing sign s (-1 front), n sides. */
function discZ(q: MeshBuilder, cx: number, cy: number, zc: number, r: number, s: number, c: Rgb, n = 14): void {
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2
    q.quad([[cx, cy, zc], [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, zc], [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, zc], [cx, cy, zc]],
      [0, 0, s], UVS, c, 0)
  }
}

/** A pointed (equilateral) arcade across [a, b] divided in `n` bays, its wall filled round the openings, in slices.
 *  `put(u0,u1,y0,y1)` writes one block in the wall's own coordinates (u along the wall). */
function arcade(put: (u0: number, u1: number, y0: number, y1: number) => void, a: number, b: number, n: number, spring: number, top: number, slices = 7): void {
  const w = (b - a) / n
  const rise = w * 0.866
  for (let i = 0; i < n; i++) {
    const xa = a + i * w, xb = xa + w
    const dy = rise / slices
    for (let k = 0; k < slices; k++) {
      const ym = (k + 0.5) * dy
      const s = Math.sqrt(Math.max(0, w * w - ym * ym))          // the arc of each side
      const left = xb - s, right = xa + s                         // the opening is between these
      const y0 = spring + k * dy, y1 = y0 + dy
      if (left - xa > 0.005) put(xa, left, y0, y1)
      if (xb - right > 0.005) put(right, xb, y0, y1)
    }
    put(xa, xb, spring + rise, top)                               // wall over the crown
  }
}

function pinnacle(q: MeshBuilder, x: number, z: number, y0: number, h: number, r: number): void {
  prism(q, x, z, y0, y0 + h * 0.55, r, 4, STONE, 0, r, true, Math.PI / 4)
  prism(q, x, z, y0 + h * 0.55, y0 + h * 0.62, r * 1.25, 4, PALE, 0, r * 1.25, true, Math.PI / 4)   // the collar
  prism(q, x, z, y0 + h * 0.62, y0 + h, r * 1.1, 4, STONE, 0, 0, true, Math.PI / 4)                  // the spire
}

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  // ground inside the fence, kerb and railing
  block(q, -HX, HX, -HZ, HZ, y(-0.02), y(0.03), GROUND)
  block(q, -HX, HX, -HZ, -HZ + 0.18, y(0), y(KERB_H), DARK)
  block(q, -HX, HX, HZ - 0.18, HZ, y(0), y(KERB_H), DARK)
  block(q, -HX, -HX + 0.18, -HZ, HZ, y(0), y(KERB_H), DARK)
  block(q, HX - 0.18, HX, -HZ, HZ, y(0), y(KERB_H), DARK)
  const bar = (x: number, z: number): void => block(q, x - 0.012, x + 0.012, z - 0.012, z + 0.012, y(KERB_H), y(FENCE_H), IRON)
  const fx = HX - 0.09, fz = HZ - 0.09
  for (let x = -fx; x <= fx + 0.01; x += BAR_PITCH) { bar(x, -fz); bar(x, fz) }
  for (let z = -fz + BAR_PITCH; z < fz; z += BAR_PITCH) { bar(-fx, z); bar(fx, z) }
  block(q, -fx, fx, -fz - 0.02, -fz + 0.02, y(FENCE_H - 0.25), y(FENCE_H - 0.2), IRON)
  block(q, -fx, fx, fz - 0.02, fz + 0.02, y(FENCE_H - 0.25), y(FENCE_H - 0.2), IRON)
  block(q, -fx - 0.02, -fx + 0.02, -fz, fz, y(FENCE_H - 0.25), y(FENCE_H - 0.2), IRON)
  block(q, fx - 0.02, fx + 0.02, -fz, fz, y(FENCE_H - 0.25), y(FENCE_H - 0.2), IRON)
  block(q, -fx, fx, -fz - 0.025, -fz + 0.025, y(FENCE_H - 0.03), y(FENCE_H), IRON)
  block(q, -fx, fx, fz - 0.025, fz + 0.025, y(FENCE_H - 0.03), y(FENCE_H), IRON)
  block(q, -fx - 0.025, -fx + 0.025, -fz, fz, y(FENCE_H - 0.03), y(FENCE_H), IRON)
  block(q, fx - 0.025, fx + 0.025, -fz, fz, y(FENCE_H - 0.03), y(FENCE_H), IRON)

  // two steps and the floor
  block(q, -BW - 0.5, BW + 0.5, -BD - 0.5, BD + 0.5, y(0.03), y(0.17), DARK)
  block(q, -BW - 0.25, BW + 0.25, -BD - 0.25, BD + 0.25, y(0.17), y(COL_BASE), shade(DARK, 1.05))

  // corner piers (a flush buttress each), then the four arcades
  const pe = PIER
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x0 = sx > 0 ? BW - pe : -BW, z0 = sz > 0 ? BD - pe : -BD
    block(q, x0, x0 + pe, z0, z0 + pe, y(COL_BASE), y(PIER_UP), STONE)
    block(q, x0 - 0.04 * (sx > 0 ? 0 : 1), x0 + pe + 0.04 * (sx > 0 ? 1 : 0), z0 - 0.04 * (sz > 0 ? 0 : 1), z0 + pe + 0.04 * (sz > 0 ? 1 : 0), y(COL_BASE), y(COL_BASE + 0.35), DARK)
  }
  const T = 0.28
  // front and back arcades (walls along x at z = ∓BD)
  for (const s of [-1, 1]) {
    const z0 = s < 0 ? -BD : BD - T, z1 = s < 0 ? -BD + T : BD
    arcade((u0, u1, y0, y1) => block(q, u0, u1, z0, z1, y(y0), y(y1), STONE), -BW + pe, BW - pe, N_FRONT, SPRING, PIER_UP)
    // dark soffit behind each opening so the interior reads as depth
  }
  // side arcades (walls along z at x = ∓BW)
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? -BW : BW - T, x1 = s < 0 ? -BW + T : BW
    arcade((u0, u1, y0, y1) => block(q, x0, x1, u0, u1, y(y0), y(y1), STONE), -BD + pe, BD - pe, N_SIDE, SPRING, PIER_UP)
  }
  // colonnettes in each opening (on the wall line) with bases and capitals
  const col = (x: number, z: number): void => {
    block(q, x - 0.13, x + 0.13, z - 0.13, z + 0.13, y(COL_BASE), y(COL_BASE + 0.18), DARK)
    prism(q, x, z, y(COL_BASE + 0.18), y(SPRING - 0.15), COL_R, 8, PALE)
    block(q, x - 0.15, x + 0.15, z - 0.15, z + 0.15, y(SPRING - 0.15), y(SPRING), PALE)
  }
  for (const sz of [-1, 1]) for (let i = 1; i < N_FRONT; i++) col(-BW + pe + (i * (2 * BW - 2 * pe)) / N_FRONT, sz * (BD - T / 2))
  for (const sx of [-1, 1]) for (let i = 1; i < N_SIDE; i++) col(sx * (BW - T / 2), -BD + pe + (i * (2 * BD - 2 * pe)) / N_SIDE)
  // a dark ceiling slab inside and the entablature round the top
  block(q, -BW + T, BW - T, -BD + T, BD - T, y(PIER_UP), y(PIER_UP + ENT_H), VOID)
  block(q, -BW - ENT_OUT, BW + ENT_OUT, -BD - ENT_OUT, BD + ENT_OUT, y(PIER_UP), y(PIER_UP + ENT_H), PALE)
  for (let i = 0; i < 12; i++) {   // corbel table under it
    const x = -BW + 0.1 + (i * (2 * BW - 0.2)) / 11
    block(q, x - 0.05, x + 0.05, -BD - ENT_OUT - 0.03, -BD - ENT_OUT, y(PIER_UP - 0.1), y(PIER_UP), DARK)
    block(q, x - 0.05, x + 0.05, BD + ENT_OUT, BD + ENT_OUT + 0.03, y(PIER_UP - 0.1), y(PIER_UP), DARK)
  }

  // roof: steep slate, ridge along z, gable triangles in stone on both ends
  const yb = PIER_UP + ENT_H
  const rx = BW + ENT_OUT, rz = BD + ENT_OUT
  const apex = yb + GABLE_H
  // slate planes
  for (const sx of [-1, 1]) {
    q.quad([[sx * rx, y(yb), -rz], [sx * rx, y(yb), rz], [0, y(apex), rz], [0, y(apex), -rz]], [sx * GABLE_H, rx, 0], UVS, SLATE, 0)
  }
  for (const s of [-1, 1]) {
    const zf = s * rz
    q.quad([[-rx, y(yb), zf], [rx, y(yb), zf], [0, y(apex), zf], [0, y(apex), zf]], [0, 0, s], UVS, STONE, 0)
    // rake mouldings along both slopes
    for (const sx of [-1, 1]) beam(q, [sx * rx, y(yb + 0.04), zf + s * 0.03], [sx * 0.05, y(apex - 0.03), zf + s * 0.03], 0.055, PALE)
    // trefoil window: a pale ring, three dark lobes
    const wz = zf + s * 0.02, wy = y(yb + 0.9)
    discZ(q, 0, wy, wz, 0.5, s, PALE)
    for (let i = 0; i < 3; i++) {
      const a = Math.PI / 2 + (i * Math.PI * 2) / 3
      discZ(q, Math.cos(a) * 0.2, wy + Math.sin(a) * 0.2, wz + s * 0.012, 0.19, s, VOID)
    }
    // roundels with portrait heads either side of the window
    for (const sx of [-1, 1]) {
      discZ(q, sx * 1.02, y(yb + 0.18), wz, 0.2, s, PALE, 12)
      discZ(q, sx * 1.02, y(yb + 0.18), wz + s * 0.012, 0.14, s, DARK, 12)
      block(q, sx * 1.02 - 0.05, sx * 1.02 + 0.05, wz + (s < 0 ? -0.04 : 0), wz + (s < 0 ? 0 : 0.04), y(yb + 0.1), y(yb + 0.28), STONE)
      // a gargoyle at each gable foot, jutting forwards
      block(q, sx * (rx - 0.03) - 0.07, sx * (rx - 0.03) + 0.07, zf + (s < 0 ? -0.45 : 0), zf + (s < 0 ? 0 : 0.45), y(yb - 0.16), y(yb - 0.02), DARK)
    }
    // the saints' relief near the apex
    block(q, -0.36, 0.36, zf + (s < 0 ? -0.035 : 0), zf + (s < 0 ? 0 : 0.035), y(yb + 1.4), y(yb + 1.68), DARK)
    for (let i = 0; i < 3; i++) block(q, -0.26 + i * 0.26, -0.18 + i * 0.26, zf + (s < 0 ? -0.06 : 0), zf + (s < 0 ? 0 : 0.06), y(yb + 1.42), y(yb + 1.64), PALE)
    // pinnacles: a tall cluster at the apex, a slim one on each shoulder
    pinnacle(q, 0, zf - s * 0.06, y(apex - 0.35), 1.0, 0.14)
    for (const sx of [-1, 1]) pinnacle(q, sx * (rx - 0.1), zf - s * 0.08, y(yb), 1.15, 0.09)
  }
  // ridge crest
  block(q, -0.05, 0.05, -rz, rz, y(apex - 0.04), y(apex + 0.06), PALE)

  // the tomb chest on the floor, with its lid
  block(q, -CHEST_HW - 0.07, CHEST_HW + 0.07, -CHEST_HD - 0.07, CHEST_HD + 0.07, y(COL_BASE), y(COL_BASE + 0.12), DARK)
  block(q, -CHEST_HW, CHEST_HW, -CHEST_HD, CHEST_HD, y(COL_BASE + 0.12), y(COL_BASE + CHEST_H), STONE)
  block(q, -CHEST_HW - 0.06, CHEST_HW + 0.06, -CHEST_HD - 0.06, CHEST_HD + 0.06, y(COL_BASE + CHEST_H), y(COL_BASE + CHEST_H + 0.15), PALE)
  // the two recumbent effigies, side by side on the lid (heads toward −z, hands joined): a procedural stand-in, shrouded
  // bodies tapering to the feet, pillowed heads in coifs (the Modly attempts failed, see the manifest note)
  const ly = COL_BASE + CHEST_H + 0.15
  for (const s of [-1, 1]) {
    const cx = s * 0.22, hw = 0.15, z0 = -0.9, z1 = 0.9, c = s < 0 ? shade(PALE, 1.04) : PALE
    block(q, cx - hw - 0.04, cx + hw + 0.04, z0 - 0.02, z0 + 0.34, y(ly), y(ly + 0.07), DARK)                     // pillow
    block(q, cx - 0.09, cx + 0.09, z0 + 0.04, z0 + 0.3, y(ly + 0.07), y(ly + 0.2), c)                           // head
    block(q, cx - 0.1, cx + 0.1, z0 + 0.04, z0 + 0.12, y(ly + 0.17), y(ly + 0.22), STONE)                        // coif
    block(q, cx - hw, cx + hw, z0 + 0.34, z0 + 1.1, y(ly), y(ly + 0.17), c)                                      // body
    block(q, cx - hw * 0.7, cx + hw * 0.7, z0 + 1.1, z1, y(ly), y(ly + 0.12), c)                                 // legs to the feet
    block(q, cx - 0.06, cx + 0.06, z0 + 0.5, z0 + 0.72, y(ly + 0.17), y(ly + 0.21), STONE)                       // joined hands
  }
  for (const s of [-1, 1]) {   // sunk arcade panels down each long side
    for (let i = 0; i < 4; i++) {
      const z0 = -CHEST_HD + 0.12 + i * ((2 * CHEST_HD - 0.2) / 4)
      block(q, s > 0 ? CHEST_HW : -CHEST_HW - 0.02, s > 0 ? CHEST_HW + 0.02 : -CHEST_HW, z0, z0 + 0.38, y(COL_BASE + 0.25), y(COL_BASE + CHEST_H - 0.15), DARK)
    }
  }
}

export function tombeHeloiseAbelard(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
