/**
 * TOUR COUPOLE, ex-Tour Elf / Tour Total (WZMH with Roche-Dinkeloo, 1985; 187 m, 48 storeys), La Défense. A cluster
 * of chamfered prisms of sky-mirror glass stepping up to the middle one: OSM's building:part rings of relation
 * 3071549 (local pbf) are the lobes, each topped at the IGN LiDAR HD MNS height above the dalle (tools/ign-mns.ts,
 * 2026-11-16): main 179 m with the plant to 183, north 161, south 135, east 110, north-west podium 44, south-west 34,
 * two 4 m lobby pavilions. The glass is a blue-grey sky mirror in silver frames (fr.wikipedia photo
 * Tour-Total.jpg; owner's note 2026-11-05): darker low where it reflects neighbours, pale toward the top. Shading is per face; a silver mullion up every crease.
 * Coordinates are metres east/north of the outline's centroid (48.892814, 2.24336), registered on fit.ring by
 * museums/enframe.ts. The skyline keeps batch7/defense.ts's `tourCoupoleFar`.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'
import { ccwEN, hull, mix, registerRing, tools, type P2, type V3 } from '../museums/enframe.ts'

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const GLASS = surfaceTag('glass')
const METAL = surfaceTag('metal')

// tunables
const CP_DARK = '#4a5866'        // the mirror glass low down / on shaded faces, reflecting neighbours
const CP_SKY = '#a9bdd0'         // the sky it mirrors on faces turned to it
const CP_TOP_LIFT = 0.3         // extra sky toward the top of each face
const CP_BAND = '#3d4954'        // floor line
const CP_FRAME = '#d3d8dc'       // silver crease mullions and coping
const CP_ROOF = '#55585a'
const CP_PLANT = '#6c7073'
const CP_PAVILION = '#4a5560'
const CP_FLOOR = 3.8             // storey height, m
const CP_BAND_H = 0.5
const CP_FOOT = -6               // walls run below the dalle so the foot never floats
const CP_SKY_DIR: P2 = [0.35, -0.94] // E/N direction whose faces catch most sky (south-ish, the bright side)

/** lobe rings (E/N metres) with MNS tops above the dalle */
const LOBES: { top: number; ring: P2[] }[] = [
  { top: 179, ring: [[-12.9, -0.2], [-10.5, -8.2], [-1.1, -13.2], [11.5, -19.3], [12.4, -18.9], [17.4, -10.4], [8.0, 18.0], [-1.2, 21.8], [-2.2, 21.4], [-8.4, 8.9]] },
  { top: 110, ring: [[8.0, 18.0], [17.4, -10.4], [21.9, -2.8], [25.0, 2.4], [21.1, 12.1], [15.9, 14.7]] },
  { top: 161, ring: [[-24.9, 28.3], [-21.8, 19.2], [-11.6, 14.0], [-8.4, 8.9], [-2.2, 21.4], [-1.2, 21.8], [-6.8, 36.2], [-4.9, 40.0], [-4.0, 41.8], [-6.8, 49.2], [-7.8, 49.7], [-15.6, 47.1]] },
  { top: 135, ring: [[-4.5, -29.8], [-1.3, -39.1], [18.2, -48.5], [25.7, -45.8], [26.5, -44.8], [25.1, -40.7], [24.1, -36.8], [18.4, -33.9], [12.4, -18.9], [11.5, -19.3], [-1.1, -13.2], [0.5, -19.4]] },
  { top: 44, ring: [[-41.9, 4.9], [-39.2, -2.8], [-38.2, -3.4], [-28.4, -8.0], [-19.3, -12.3], [-10.5, -8.2], [-12.9, -0.2], [-8.4, 8.9], [-11.6, 14.0], [-21.8, 19.2], [-24.9, 28.3], [-32.3, 25.0]] },
  { top: 34, ring: [[-31.6, -24.7], [-28.9, -31.8], [-8.5, -41.5], [-1.3, -39.1], [-4.5, -29.8], [0.5, -19.4], [-1.1, -13.2], [-10.5, -8.2], [-19.3, -12.3], [-28.4, -8.0], [-26.3, -14.0], [-31.2, -23.8]] },
]
const PAVILIONS: P2[][] = [
  [[12.4, -18.9], [18.4, -33.9], [24.1, -36.8], [25.1, -40.7], [27.2, -37.0], [40.6, -44.3], [45.5, -42.6], [44.3, -39.1], [47.9, -37.7], [46.6, -34.1], [50.1, -32.9], [48.3, -27.7], [39.7, -23.9], [42.1, -18.8], [32.5, -13.9], [34.6, -9.2], [21.9, -2.8], [17.4, -10.4]],
  [[-6.8, 36.2], [-1.2, 21.8], [8.0, 18.0], [15.9, 14.7], [17.3, 17.4], [7.5, 22.3], [9.6, 26.7], [0.3, 31.3], [2.5, 36.4], [-4.9, 40.0]],
]
const PAVILION_H = 5
const PLANT: P2[] = [[-3, -8], [9, -13], [12, -6], [0, -1]] // the plant box on the main roof
const PLANT_H = 4

const hullArea = (r: P2[]): number => { const h = hull(r); let A = 0; for (let i = 0; i < h.length; i++) { const p = h[i], q = h[(i + 1) % h.length]; A += p[0] * q[1] - q[0] * p[1] }; return Math.abs(A) / 2 }

export function tourCoupole(out: MeshBuilder, fit: Fit): void {
  // the loader hands either the relation's own outline (the main lobe) or the parts' hull: register on whichever matches
  const all = [...LOBES.flatMap((l) => l.ring), ...PAVILIONS.flat()]
  let reg: P2[] = all
  if (fit.ring && fit.ring.length >= 3) {
    const g = hullArea(fit.ring.map((q) => [q.x, q.z] as P2))
    if (Math.abs(g - hullArea(LOBES[0].ring)) < Math.abs(g - hullArea(all))) reg = LOBES[0].ring
  }
  const F = registerRing(reg, fit), T = tools(out, F)
  const dark = hex(CP_DARK), sky = hex(CP_SKY), band = hex(CP_BAND), frame = hex(CP_FRAME)

  const walls = (ring: P2[], top: number, glass: (f: number, up: number) => Rgb, floors: boolean): void => {
    const r = ccwEN(ring)
    for (let i = 0; i < r.length; i++) {
      const a = r[i], b = r[(i + 1) % r.length]
      const L = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (L < 0.3) continue
      const ne: P2 = [(b[1] - a[1]) / L, -(b[0] - a[0]) / L] // outward for an anticlockwise ring
      const n = F.n([ne[0], ne[1], 0])
      const facing = 0.5 + 0.5 * (ne[0] * CP_SKY_DIR[0] + ne[1] * CP_SKY_DIR[1])
      const at = (p: P2, h: number, o: number): V3 => F.p(p[0] + ne[0] * o, p[1] + ne[1] * o, h)
      // three tone bands up the face, brightening with height (the sky's reflection)
      const cuts = [CP_FOOT, top * 0.4, top * 0.75, top]
      for (let k = 0; k < 3; k++) {
        const y0 = cuts[k], y1 = cuts[k + 1]
        if (y1 <= y0) continue
        out.quad([at(a, y0, 0), at(b, y0, 0), at(b, y1, 0), at(a, y1, 0)], n, UV, glass(facing, k / 2), GLASS)
      }
      if (floors) for (let y = CP_FLOOR; y < top - 1; y += CP_FLOOR) out.quad([at(a, y, 0.05), at(b, y, 0.05), at(b, y + CP_BAND_H, 0.05), at(a, y + CP_BAND_H, 0.05)], n, UV, band, METAL)
      // crease mullion at the face's start, and the coping
      const t: P2 = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], a2: P2 = [a[0] + t[0] * 1.0, a[1] + t[1] * 1.0]
      out.quad([at(a, CP_FOOT, 0.12), at(a2, CP_FOOT, 0.12), at(a2, top, 0.12), at(a, top, 0.12)], n, UV, frame, METAL)
      out.quad([at(a, top - 1, 0.12), at(b, top - 1, 0.12), at(b, top, 0.12), at(a, top, 0.12)], n, UV, frame, METAL)
    }
  }
  const tower = (f: number, up: number): Rgb => mix(dark, sky, Math.min(1, 0.2 + 0.45 * f + CP_TOP_LIFT * up))
  for (const l of LOBES) {
    walls(l.ring, l.top, tower, true)
    T.cap(l.ring, l.top, hex(CP_ROOF))
  }
  walls(PLANT, LOBES[0].top + PLANT_H, () => hex(CP_PLANT), false)
  T.cap(PLANT, LOBES[0].top + PLANT_H, hex(CP_PLANT))
  const pav = hex(CP_PAVILION)
  for (const p of PAVILIONS) {
    walls(p, PAVILION_H, (f) => mix(pav, sky, 0.3 * f), false)
    T.cap(p, PAVILION_H, hex(CP_ROOF))
  }
}
