/**
 * France Télévisions headquarters (Maison de France Télévisions), 7 esplanade Henri-de-France, Paris 15e — Jean-Paul Viguier,
 * 1998. OSM way/30984230 (no building:part over it), traced in metres east/north of 48.83877, 2.27133. The IGN lidar MNS shows
 * two roof plates: a west wing and an east wing ~5 m higher, split near e = 17; its absolute heights read high here, so the
 * wings take OSM's 7 levels (~27 m) and the lidar's step. From the Commons photo: ribbon glazing in green-grey glass between
 * thin white spandrel bands, a dark glazed ground storey, white fins, and a thin white roof canopy overhanging the street faces.
 * Tunable in FTV.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { ccwEN, registerRing, tools, type P2 } from '../museums/enframe.ts'

const RING: P2[] = [[-71.8, -15.8], [-21.1, 68.0], [-2.7, 72.2], [8.0, 57.7], [1.6, 46.4], [5.8, 43.8], [-4.4, 26.0], [-0.6, 25.1], [3.9, 23.5], [17.8, 46.4], [18.6, 45.5], [26.3, 35.9], [35.2, 23.9], [82.4, -31.9], [108.9, -64.3], [90.0, -64.1], [74.9, -61.1], [-26.1, -30.0], [-27.5, -29.6], [-25.5, -26.0], [-30.4, -24.6], [-33.9, -23.6], [-39.2, -32.9], [-41.4, -31.6], [-44.2, -30.0], [-41.2, -25.5]]

export const FTV = {
  WEST_H: 27, EAST_H: 32, SPLIT_E: 17, FLOOR: 3.3, GROUND: 4.8, SPANDREL: 0.75, BAND_OUT: 0.25,
  FIN_EVERY: 7.5, FIN_W: 0.35, FIN_OUT: 0.6, CANOPY: 2.2, CANOPY_T: 0.5, PARAPET: 0.6, MIN_EDGE: 3,
  PLANT_H: 2.6, PLANT_INSET: 9,
}

// Sutherland–Hodgman clip of a ring to e >= s (keep = 1) or e <= s (keep = -1)
const clipE = (r: P2[], s: number, keep: 1 | -1): P2[] => {
  const o: P2[] = [], inside = (p: P2): boolean => (p[0] - s) * keep >= 0
  for (let i = 0; i < r.length; i++) {
    const a = r[i], b = r[(i + 1) % r.length]
    if (inside(a)) o.push(a)
    if (inside(a) !== inside(b)) { const t = (s - a[0]) / (b[0] - a[0]); o.push([s, a[1] + t * (b[1] - a[1])]) }
  }
  return o
}

const shrink = (r: P2[], d: number): P2[] => {
  const c = r.reduce((s, p) => [s[0] + p[0] / r.length, s[1] + p[1] / r.length], [0, 0] as P2)
  return r.map((p) => { const dx = p[0] - c[0], dy = p[1] - c[1], l = Math.hypot(dx, dy) || 1; const k = Math.max(0.2, 1 - d / l); return [c[0] + dx * k, c[1] + dy * k] as P2 })
}

export const franceTelevisions = (out: MeshBuilder, fit: Fit): void => {
  const K = FTV, T = tools(out, registerRing(RING, fit))
  const white = hex('#eef0ee'), whiteDk = hex('#d3d6d4'), glass = hex('#5f7a7c'), glassDk = hex('#34434a'), roof = hex('#9a9a96'), plant = hex('#b4b6b3')
  const ring = ccwEN(RING)
  const regions = [{ r: clipE(ring, K.SPLIT_E, -1), h: K.WEST_H }, { r: clipE(ring, K.SPLIT_E, 1), h: K.EAST_H }]
  regions.forEach((reg, ri) => {
    const r = reg.r, H = reg.h
    for (let i = 0; i < r.length; i++) {
      const a = r[i], b = r[(i + 1) % r.length], l = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (l < 0.05) continue
      if (Math.abs(a[0] - K.SPLIT_E) < 1e-6 && Math.abs(b[0] - K.SPLIT_E) < 1e-6) { // the shared cut
        if (ri === 1) T.wall(a, b, K.WEST_H, H + K.PARAPET, white)
        continue
      }
      const nx = (b[1] - a[1]) / l, ny = -(b[0] - a[0]) / l, ux = (b[0] - a[0]) / l, uy = (b[1] - a[1]) / l
      const off = (p: P2, d: number): P2 => [p[0] + nx * d, p[1] + ny * d]
      T.wall(a, b, 0, K.GROUND, glassDk)
      const top = H - 0.3
      for (let y = K.GROUND; y < top - 0.3; y += K.FLOOR) {
        const y1 = Math.min(y + K.FLOOR, top)
        T.wall(a, b, y, y1 - K.SPANDREL, glass)
        if (l >= K.MIN_EDGE) T.wall(off(a, K.BAND_OUT), off(b, K.BAND_OUT), y1 - K.SPANDREL, y1, white)
        else T.wall(a, b, y1 - K.SPANDREL, y1, white)
      }
      T.wall(a, b, top, H + K.PARAPET, white)
      if (l >= K.MIN_EDGE) {
        const n = Math.floor(l / K.FIN_EVERY)
        for (let f = 1; f < n; f++) {
          const t = (f * l) / n, c: P2 = [a[0] + ux * t, a[1] + uy * t]
          const p0: P2 = [c[0] - ux * K.FIN_W / 2, c[1] - uy * K.FIN_W / 2], p1: P2 = [c[0] + ux * K.FIN_W / 2, c[1] + uy * K.FIN_W / 2]
          T.prism([p0, p1, off(p1, K.FIN_OUT), off(p0, K.FIN_OUT)], K.GROUND, top, whiteDk, null)
        }
        // roof canopy: a thin white slab beyond the face
        T.prism([a, b, off(b, K.CANOPY), off(a, K.CANOPY)], H + K.PARAPET, H + K.PARAPET + K.CANOPY_T, white, white)
      }
    }
    T.cap(r, H + K.PARAPET, roof)
    T.prism(shrink(r, K.PLANT_INSET), H + K.PARAPET, H + K.PARAPET + K.PLANT_H, plant, whiteDk)
  })
}
