import type { MeshBuilder } from '../../buildings.ts'
import { disc, prism } from '../../models.ts'
import { beam, block, hex, pointedPane, roof, shade } from '../kit.ts'
import type { Fit } from '../fit.ts'

const FIXED = 0

/**
 * Notre-Dame de Paris up close (PARIS_EXPAND §5 A). The gist everyone knows:
 *
 * - the WEST FRONT: three deep pointed portals, the Gallery of Kings above them, the great rose between the
 *   towers, the open gallery at 43 m, and the two square towers with their tall paired openings, flat-topped
 *   at 69 m;
 * - the long nave under a steep lead roof, the lower aisles either side, the transept with a rose at each end;
 * - the thin lead spire at the crossing, 96 m (rebuilt 2024);
 * - the apse at the east end, rounded, ringed by FLYING BUTTRESSES — and more down both flanks.
 *
 * Local frame: the west front faces −z (the manifest turns it to the parvis); the long axis runs along z.
 * Fitted to OSM's whole footprint, so its length and width are the real ones.
 */
export function notreDameFull(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#dcd3c0')
  const shadowStone = shade(stone, 0.86)
  const lead = hex('#5b6266')
  const dark = hex('#2a2926')
  const glass = hex('#3a4660')
  const L = Math.min(Math.max(fit.hz, 50), 66)     // half the length
  const W = Math.min(Math.max(fit.hx, 18), 25)     // half the width over the aisles
  const zf = -L                                    // the west front
  const nave = 6.5                                 // half the nave's width
  const eaves = 33
  const front = 11                                 // depth of the west block
  const apseR = nave + 1.5
  const zApse = L - apseR - 4                      // centre of the apse's curve

  // --- the west front: the block between the towers and the towers themselves
  const fw = Math.min(W, 20)
  block(out, -fw, fw, zf, zf + front, 0, 43, stone)
  block(out, -fw - 0.3, fw + 0.3, zf - 0.3, zf + front, 43, 45, shadowStone)            // the open gallery
  for (const sx of [-1, 1]) {
    const x0 = sx > 0 ? 8 : -fw
    const x1 = sx > 0 ? fw : -8
    block(out, x0, x1, zf, zf + front, 45, 69, stone)                                    // a tower
    block(out, x0 - 0.3, x1 + 0.3, zf - 0.3, zf + front + 0.3, 68.2, 69.4, shadowStone)  // its balustrade
    // the tall paired openings of the belfry
    for (const t of [0.3, 0.7]) {
      const x = x0 + (x1 - x0) * t
      pointedPane(out, zf - 0.02, x, 49, 1.6, 15, dark)
    }
  }
  // the three portals, deep and pointed, the middle one widest
  for (const [x, w, h] of [[0, 5.2, 14], [-12, 4.2, 12], [12, 4.2, 12]] as const) {
    pointedPane(out, zf - 0.04, x, 0, w + 1.8, h + 2.5, shadowStone)
    pointedPane(out, zf - 0.06, x, 0, w, h, dark)
  }
  // the Gallery of Kings: a band of niches across the whole front
  block(out, -fw, fw, zf - 0.4, zf, 17.5, 18.2, shadowStone)
  for (let i = 0; i < 28; i++) {
    const x = -fw + 0.7 + ((2 * fw - 1.4) * (i + 0.5)) / 28
    block(out, x - 0.45, x + 0.45, zf - 0.05, zf, 18.4, 21.2, dark)
  }
  block(out, -fw, fw, zf - 0.4, zf, 21.4, 22.1, shadowStone)
  // the great rose, and the lancets either side of it on the towers' faces
  disc(out, 0, 31, zf - 0.05, 5.2, shadowStone, FIXED, 24)
  disc(out, 0, 31, zf - 0.08, 4.4, glass, FIXED, 24)
  for (const x of [-14, 14]) pointedPane(out, zf - 0.04, x, 26, 3.4, 10, dark)

  // --- the nave, the aisles, the transept, the apse
  const z0 = zf + front
  const zT = zf + front + (zApse - z0) * 0.55                                              // the crossing
  block(out, -nave, nave, z0, zApse, 0, eaves, stone)
  roof(out, -nave - 0.4, nave + 0.4, z0, zApse, eaves, 12, nave + 0.4, 0, lead)
  // the aisles and chapels, lower, their own sloping roofs
  for (const sx of [-1, 1]) {
    const x0 = sx > 0 ? nave : -W
    const x1 = sx > 0 ? W : -nave
    block(out, x0, x1, z0, zApse, 0, 20, stone)
    roof(out, x0 - 0.3, x1 + 0.3, z0, zApse, 20, 3.5, (x1 - x0) / 2 + 0.3, 0, lead)
  }
  // clerestory windows: on the nave's side walls between the aisle roof and the eaves
  for (const sx of [-1, 1]) {
    for (let z = z0 + 4; z < zApse - 3; z += 7) {
      block(out, sx * nave - (sx > 0 ? 0 : 0.03), sx * nave + (sx > 0 ? 0.03 : 0), z - 1.1, z + 1.1, 24.5, 31, dark)
    }
  }
  // the transept: across the whole width, as tall as the nave, a rose at each end
  const tw = 7
  block(out, -W - 1, W + 1, zT - tw, zT + tw, 0, eaves, stone)
  roof(out, -W - 1.3, W + 1.3, zT - tw, zT + tw, eaves, 12, 0, tw, lead)
  for (const sx of [-1, 1]) {
    const x = sx * (W + 1.05)
    // the rose on the transept's end wall, facing out along x
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2
      block(out, x - 0.05, x + 0.05, zT + Math.cos(a) * 4.6 - 0.6, zT + Math.cos(a) * 4.6 + 0.6, 24 + Math.sin(a) * 4.6 - 0.6, 24 + Math.sin(a) * 4.6 + 0.6, glass)
    }
    block(out, x - 0.06, x + 0.06, zT - 2.8, zT + 2.8, 21.2, 26.8, glass)
  }
  // the apse: the nave's end rounded, and round it the ambulatory, lower
  prism(out, 0, zApse, 0, eaves, apseR, 14, stone, FIXED)
  prism(out, 0, zApse, eaves, eaves + 10, apseR + 0.4, 14, lead, FIXED, 0.5)
  prism(out, 0, zApse, 0, 20, W - 2, 18, stone, FIXED)
  prism(out, 0, zApse, 20, 23, W - 1.7, 18, lead, FIXED, apseR)

  // --- the flying buttresses: a pier out beyond the aisles, a sloping flyer up to the nave wall
  const flyer = (px: number, pz: number, tx: number, tz: number): void => {
    block(out, px - 0.8, px + 0.8, pz - 0.8, pz + 0.8, 0, 24, stone)
    prism(out, px, pz, 24, 27, 0.8, 4, stone, FIXED, 0.15)                                    // its pinnacle
    beam(out, [px, 22, pz], [tx, 30, tz], 0.45, stone)
    beam(out, [px, 17, pz], [tx, 25, tz], 0.4, stone)
  }
  for (const sx of [-1, 1]) {
    for (let z = z0 + 5; z < zApse - 2; z += 7.5) {
      if (Math.abs(z - zT) < tw + 2) continue
      flyer(sx * (W + 2.2), z, sx * nave, z)
    }
  }
  for (let i = 0; i <= 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * Math.PI
    const px = Math.sin(a) * (W + 2.5)
    const pz = zApse + Math.cos(a) * (W + 2.5) * 0.9
    flyer(px, pz, Math.sin(a) * apseR, zApse + Math.cos(a) * apseR)
  }

  // --- the spire at the crossing: a lead octagon rising from the roof ridge to 96 m
  prism(out, 0, zT, eaves + 8, eaves + 20, 3.4, 8, lead, FIXED, 2.6)
  prism(out, 0, zT, eaves + 20, 96, 2.6, 8, lead, FIXED, 0.08)
}
