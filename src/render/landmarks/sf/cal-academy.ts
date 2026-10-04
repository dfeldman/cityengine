/**
 * CALIFORNIA ACADEMY OF SCIENCES (Renzo Piano, 2008), rebuilt on the Golden Gate Park audit, 2026-10-04: it was a
 * flat green slab with two small domes poking through. The real building is a low glass box whose 2.5-acre living
 * roof, 35 ft up, rolls over seven hills (after the city's own); the two big ones are the 90 ft domes beneath — the
 * Morrison Planetarium on the EAST side, the Osher Rainforest on the WEST — their slopes studded with round porthole
 * skylights; between them the glass roof over the central piazza; round the whole roof a wide glass canopy with
 * photovoltaic cells in it, on slender columns (Wikipedia; Dwell, "California Academy of Sciences Preview").
 *
 * Local frame (entry `front: 318`, the entrance facing the de Young across the Music Concourse, north-west): the long
 * axis is x, +x to the SOUTH-WEST (the rainforest), −x to the north-east (the planetarium); −z is the front.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { strut, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import type { Fit } from '../fit.ts'
import { tower, towerRing, insetRing } from '../tower.ts'

const LIVING: Rgb = [0.3, 0.37, 0.21]
const PORTHOLE: Rgb = [0.24, 0.3, 0.34]
const PIAZZA: Rgb = [0.42, 0.5, 0.54]
const CANOPY: Rgb = [0.4, 0.45, 0.5]
const COLUMN: Rgb = [0.78, 0.79, 0.78]

export function calAcademy(out: MeshBuilder, fit: Fit): void {
  const H = 10.7
  const ring = towerRing(fit)
  tower(out, fit, {
    height: H,
    tiers: [{ to: 1, face: { kind: 'curtain', wall: [0.62, 0.64, 0.62], glass: [0.42, 0.5, 0.5], pitch: 3, floor: 5.4, solid: 0.12, material: 'metal' } }],
    roof: LIVING,
    crown: { kind: 'flat' },
  })
  const hx = fit.hx, hz = fit.hz
  // the hills: the two domes' mounds (rainforest +x, planetarium −x), and five low ones round them
  const hills: { x: number; z: number; r: number; a: number }[] = [
    { x: hx * 0.45, z: 0, r: 25, a: 10 }, { x: -hx * 0.45, z: 0, r: 25, a: 10 },
    { x: 0, z: hz * 0.62, r: 15, a: 3.2 }, { x: hx * 0.8, z: hz * 0.6, r: 13, a: 2.6 }, { x: -hx * 0.8, z: -hz * 0.58, r: 13, a: 2.8 },
    { x: hx * 0.82, z: -hz * 0.62, r: 12, a: 2.4 }, { x: -hx * 0.8, z: hz * 0.6, r: 12, a: 2.6 },
  ]
  const lift = (x: number, z: number): number => {
    let h = 0
    for (const m of hills) {
      const d = Math.hypot(x - m.x, z - m.z) / m.r
      if (d < 1) h = Math.max(h, m.a * (0.5 + 0.5 * Math.cos(Math.PI * d)))
    }
    return h
  }
  // the roof's rolling surface over the flat roof: a 2 m grid, only where it rises off it (a cell flush with the
  // roof would fight it)
  const S = 2
  const tag = 0
  for (let x = -hx + S; x < hx - S; x += S) {
    for (let z = -hz + S; z < hz - S; z += S) {
      const c: [number, number][] = [[x, z], [x + S, z], [x + S, z + S], [x, z + S]]
      const ys = c.map(([u, v]) => lift(u, v))
      if (Math.max(...ys) < 0.2) continue
      const p = c.map(([u, v], i) => [u, H + 0.12 + ys[i], v] as [number, number, number])
      // the face's own normal (its two diagonals' cross product), up
      const ax = p[2][0] - p[0][0], ay = p[2][1] - p[0][1], az = p[2][2] - p[0][2]
      const bx = p[3][0] - p[1][0], by = p[3][1] - p[1][1], bz = p[3][2] - p[1][2]
      let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx
      const L = Math.hypot(nx, ny, nz) || 1
      nx /= L; ny /= L; nz /= L
      if (ny < 0) { nx = -nx; ny = -ny; nz = -nz }
      out.quad(p, [nx, ny, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], LIVING, tag)
    }
  }
  // the porthole skylights on the two big mounds: dark glass discs lying on the slope, a hand proud of it
  for (const m of hills.slice(0, 2)) {
    for (let ring2 = 1; ring2 <= 5; ring2++) {
      const rr = (ring2 / 6) * m.r * 0.92
      const n = Math.round((2 * Math.PI * rr) / 3.6)
      for (let k = 0; k < n; k++) {
        const t = (k + (ring2 % 2) * 0.5) / n * Math.PI * 2
        const px = m.x + Math.cos(t) * rr, pz = m.z + Math.sin(t) * rr
        const e = 0.3
        const gx = (lift(px + e, pz) - lift(px - e, pz)) / (2 * e), gz = (lift(px, pz + e) - lift(px, pz - e)) / (2 * e)
        let nx = -gx, ny = 1, nz = -gz
        const L = Math.hypot(nx, ny, nz); nx /= L; ny /= L; nz /= L
        // two tangents on the slope
        let ux = ny, uy = -nx, uz = 0
        const UL = Math.hypot(ux, uy, uz) || 1; ux /= UL; uy /= UL; uz /= UL
        const vx = ny * uz - nz * uy, vy = nz * ux - nx * uz, vz = nx * uy - ny * ux
        const y0 = H + 0.12 + lift(px, pz)
        const cx = px + nx * 0.08, cy = y0 + ny * 0.08, cz = pz + nz * 0.08
        const R = 0.75, seg = 8
        for (let s = 0; s < seg; s++) {
          const a0 = (s / seg) * Math.PI * 2, a1 = ((s + 1) / seg) * Math.PI * 2
          const q = (a: number): [number, number, number] => [cx + (ux * Math.cos(a) + vx * Math.sin(a)) * R, cy + (uy * Math.cos(a) + vy * Math.sin(a)) * R, cz + (uz * Math.cos(a) + vz * Math.sin(a)) * R]
          out.quad([[cx, cy, cz], q(a0), q(a1), [cx, cy, cz]], [nx, ny, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], PORTHOLE, surfaceTag('glass'))
        }
      }
    }
  }
  // the piazza's glass roof between the domes, and its mullions
  const px0 = -hx * 0.14, px1 = hx * 0.14, pz0 = -hz * 0.42, pz1 = hz * 0.3
  const gy = H + 0.35
  out.quad([[px0, gy, pz0], [px1, gy, pz0], [px1, gy, pz1], [px0, gy, pz1]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], PIAZZA, surfaceTag('glass'))
  for (let x = px0; x <= px1 + 0.01; x += (px1 - px0) / 6) strut(out, [x, gy + 0.08, pz0], [x, gy + 0.08, pz1], 0.12, 0.12, COLUMN)
  // the canopy: a wide glass-and-photovoltaic band all round, its edge on slender columns
  // (a BAND from the wall out, not a lid: the living roof is seen through the middle)
  const wide = insetRing(ring, -3.5)
  const cy = H + 0.6
  if (wide.length === ring.length) {
    for (let i = 0; i < ring.length; i++) {
      const j = (i + 1) % ring.length
      out.quad([[ring[i].x, cy, ring[i].z], [wide[i].x, cy, wide[i].z], [wide[j].x, cy, wide[j].z], [ring[j].x, cy, ring[j].z]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], CANOPY, surfaceTag('glass'))
    }
  }
  for (let i = 0; i < wide.length; i++) {
    const a = wide[i], b = wide[(i + 1) % wide.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    const n = Math.max(1, Math.round(L / 9))
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n
      const x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t
      strut(out, [x, 0, z], [x, H + 0.55, z], 0.25, 0.25, COLUMN)
    }
  }
}
