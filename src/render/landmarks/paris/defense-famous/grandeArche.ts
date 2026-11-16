import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { beam, block, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted } from '../palaces/common.ts'
import { surfaceTag } from '../../../cartoon-material.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/**
 * LA GRANDE ARCHE DE LA DÉFENSE (Johan Otto von Spreckelsen and Paul Andreu, 1985–89): a hollow cube 110.9 m high,
 * 108 m wide and 112 m deep (Wikipedia), turned 6.33° off the historic axis — the twist comes from OSM way 19441489's
 * own box (entry rotateDeg). The frame in white Carrara marble drawn plain (owner, 2026-11-03: no window grid), the faces
 * inside the opening plain pale blue-grey glass, the roof's soffit stepping down to 100 m (OSM parts), the Grand Escalier's
 * 13 treads up to the platform on both faces, the Nuage (Peter Rice) hung in the void and the glass panoramic lifts.
 * Frame: legs at x ±34.7…±53.4, the opening through along z, −z toward Paris.
 */
const AX = 53.4
const AZ = 56.1
const IN_GLASS: Rgb = [0.66, 0.74, 0.8]

export function grandeArche(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, AX, AZ, (q) => arche(q))
}

function arche(out: MeshBuilder): void {
  const marble: Rgb = [0.93, 0.93, 0.92]
  const xi = 34.7
  const top = 110
  // the steps on both faces, and the platform between the legs
  for (let k = 0; k < 13; k++) {
    const t = k / 12
    const hz = AZ - t * (AZ - 36.5)
    block(out, -xi, xi, -hz, hz, 0, 0.63 * (k + 1), k % 2 ? [0.82, 0.8, 0.77] : [0.86, 0.84, 0.8])
  }
  // the legs, from the ground to the roof's soffit, and the roof slab with its soffit stepping in (OSM: 100 → 108)
  for (const s of [-1, 1]) block(out, s > 0 ? xi : -AX, s > 0 ? AX : -xi, -AZ, AZ, 0, 100, marble)
  block(out, -AX, AX, -36.6, 36.6, 100, top, marble)
  for (let k = 0; k < 9; k++) {
    const z0 = 36.6 + k * 2.17
    const z1 = z0 + 2.17
    for (const s of [-1, 1]) block(out, -AX, AX, s > 0 ? z0 : -z1, s > 0 ? z1 : -z0, 100 + k, top, marble)
  }
  // every face plain: the owner (2026-11-03) — no windows read on it, outside or in the opening. A smooth marble skin
  // just proud of the blocks, tagged stucco so the landmark material does not draw ashlar courses on it.
  const skin = surfaceTag('stucco')
  const face = (f: 'x' | 'z', plane: number, s: number, t0: number, t1: number, y0: number, y1: number, c: Rgb, tag = skin): void => {
    const P = (t: number, y: number): [number, number, number] => (f === 'z' ? [t, y, plane + s * 0.06] : [plane + s * 0.06, y, t])
    out.quad([P(t0, y0), P(t1, y0), P(t1, y1), P(t0, y1)], f === 'z' ? [0, 0, s] : [s, 0, 0], UV, c, tag)
  }
  for (const s of [-1, 1]) {
    face('x', s * AX, s, -AZ, AZ, 0, top, marble)
    for (const f of [-1, 1]) face('z', f * AZ, f, s > 0 ? xi : -AX, s > 0 ? AX : -xi, 0, top, marble)
    face('x', s * xi, -s, -AZ, AZ, 0, 100, IN_GLASS, surfaceTag('glass'))
  }
  for (const f of [-1, 1]) face('z', f * AZ, f, -xi, xi, 100, top, marble)
  {
    const y = 99.98
    out.quad([[-xi, y, -36.6], [xi, y, -36.6], [xi, y, 36.6], [-xi, y, 36.6]], [0, -1, 0], UV, shade(marble, 0.94), skin)
  }
  // the parapet round the roof
  for (const [x0, x1, z0, z1] of [[-AX, AX, -AZ, -AZ + 0.6], [-AX, AX, AZ - 0.6, AZ], [-AX, -AX + 0.6, -AZ, AZ], [AX - 0.6, AX, -AZ, AZ]]) block(out, x0, x1, z0, z1, top, top + 1.2, marble)
  block(out, -20, 20, -14, 14, top, top + 3.5, shade(marble, 0.92))                       // the rooftop pavilion

  // the cloud: a white membrane in ridges and valleys, hung on cables from the legs, over the platform
  const cw = 31
  const cz0 = -24
  const cz1 = 22
  const ridges = 6
  const yc = 26
  const sail: Rgb = [0.97, 0.97, 0.96]
  for (let i = 0; i < ridges; i++) {
    const za = cz0 + ((cz1 - cz0) * i) / ridges
    const zb = cz0 + ((cz1 - cz0) * (i + 0.5)) / ridges
    const zc = cz0 + ((cz1 - cz0) * (i + 1)) / ridges
    for (let j = 0; j < 4; j++) {
      const xa = -cw + (2 * cw * j) / 4
      const xb = -cw + (2 * cw * (j + 1)) / 4
      const lift = (j % 2) * 1.2
      out.quad([[xa, yc + lift, za], [xb, yc + 1.2 - lift, za], [xb, yc + 2.6 - lift, zb], [xa, yc + 1.4 + lift, zb]], [0, 0.8, -0.5], UV, sail, FIXED)
      out.quad([[xa, yc + 1.4 + lift, zb], [xb, yc + 2.6 - lift, zb], [xb, yc + 1.2 - lift, zc], [xa, yc + lift, zc]], [0, 0.8, 0.5], UV, sail, FIXED)
    }
  }
  for (const s of [-1, 1]) for (const z of [cz0, (cz0 + cz1) / 2, cz1]) {
    beam(out, [s * cw, yc + 1, z], [s * xi, yc + 9, z], 0.06, [0.3, 0.3, 0.32])
    beam(out, [s * cw, yc + 1, z], [s * (cw - 4), 8.3, z], 0.05, [0.3, 0.3, 0.32])
  }
  // the panoramic lifts: a steel mast from the cloud to the roof, two glass cabins on it
  const steel: Rgb = [0.55, 0.57, 0.6]
  for (const x of [-3.2, 3.2]) {
    prism(out, x, 6, yc + 2, 100, 0.25, 6, steel, FIXED)
    prism(out, x, 8.4, yc + 2, 100, 0.25, 6, steel, FIXED)
  }
  for (let y = yc + 6; y < 99; y += 7) beam(out, [-3.2, y, 6], [3.2, y + 3.5, 8.4], 0.08, steel)
  for (const [x, y] of [[-3.2, 48], [3.2, 71]]) box(out, x, y, 9.4, 1.3, 1.5, 1.0, [0.62, 0.72, 0.78], FIXED)
}
