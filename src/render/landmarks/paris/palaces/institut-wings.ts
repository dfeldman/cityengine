import type { MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { shade } from '../../kit.ts'
import { extrude, fitted, palette, pavilionRoof, pts, range, slabOn, type Pal } from './common.ts'
import { wallOn, type Wall } from './wall.ts'

/** the design footprint: OSM relation 967665's box turned 18.5° to the Institut's axes (local −z faces bearing 18.5, the quai) */
const HX = 87.2
const HZ = 85.6
/** the dome's centre in this frame (the `institutDome` entry draws the chapel front, drum and dome there) */
const DOME = { x: 21.7, z: -45.9 }

/** OSM's outline and its two courts in this frame (relation 967665, osmium 2026-11-04), simplified to 0.6 m */
const PLAN = [
  pts([87.2, -64.3, 86.6, -64.3, 61.8, -64.2, 60.5, -61.2, 54.6, -46.6, 52.5, -41.6, 48.7, -32.3, 47.6, -29.6, 28.0, -29.6, 28.0, -28.3, 26.3, -28.3, 26.4, -27.6, 20.9, -27.6, 7.1, -27.7, 6.4, -26.7, 3.6, -22.5, -4.0, -11.1, -19.2, 11.7, -32.5, 31.7, -48.0, 55.1, -61.0, 74.5, -62.5, 76.7, -68.4, 85.6, -87.2, 72.9, -83.5, 67.2, -71.9, 75.2, -69.7, 71.9, -54.5, 49.2, -56.9, 47.7, -56.3, 46.8, -53.3, 42.6, -50.7, 38.6, -49.6, 39.4, -20.5, -4.2, -21.7, -5.0, -21.1, -5.9, -17.9, -10.4, -15.7, -13.8, -27.3, -21.3, -34.6, -26.1, -36.7, -27.7, -38.9, -24.4, -42.5, -18.9, -43.3, -18.7, -50.8, -7.4, -48.9, -6.2, -49.4, -5.4, -51.7, -2.3, -55.3, 3.5, -59.8, 10.2, -62.4, 14.0, -64.3, 12.7, -66.6, 15.9, -67.1, 17.0, -69.2, 19.9, -69.7, 20.9, -72.0, 24.4, -72.0, 25.5, -74.2, 28.7, -77.3, 33.6, -83.2, 29.5, -74.4, 15.4, -53.5, -17.2, -54.5, -18.8, -49.3, -31.2, -47.4, -35.5, -43.0, -32.7, -40.7, -36.3, -42.0, -36.1, -42.3, -37.7, -42.5, -60.8, -42.8, -84.2, -42.8, -84.8, -41.3, -84.8, -24.8, -84.9, -22.6, -85.0, -22.6, -83.3, -22.7, -68.6, -11.8, -68.8, -11.4, -67.9, -10.4, -65.8, -9.2, -63.8, -7.9, -61.9, -6.3, -60.2, -4.8, -58.6, -3.2, -57.3, -0.9, -55.8, 1.3, -54.6, 3.6, -53.6, 6.0, -52.8, 8.4, -52.2, 8.4, -53.2, 13.5, -53.2, 13.5, -58.4, 15.4, -58.4, 15.4, -60.3, 20.4, -60.3, 20.5, -58.5, 22.3, -58.5, 24.1, -58.5, 24.0, -60.3, 29.0, -60.3, 29.0, -58.4, 31.0, -58.4, 32.1, -54.4, 31.0, -53.3, 36.1, -53.3, 36.1, -52.3, 36.8, -52.4, 39.1, -53.0, 41.3, -53.8, 43.4, -54.8, 45.5, -55.9, 46.4, -56.5, 48.3, -57.9, 50.0, -59.4, 50.7, -60.2, 51.6, -61.1, 53.1, -63.0, 54.0, -64.3, 54.4, -64.9, 55.5, -67.0, 56.4, -69.1, 67.3, -69.2, 67.3, -80.0, 67.2, -84.5, 67.2, -85.4, 87.1, -85.6]),
  pts([45.0, -42.8, 43.7, -46.2, 35.9, -46.0, 36.0, -35.3, 42.1, -35.3]),
  pts([8.3, -38.9, 8.3, -42.9, 8.3, -46.1, 4.9, -48.5, 2.8, -45.5, -6.7, -52.0, -14.2, -57.0, -12.4, -59.8, -16.0, -62.3, -22.2, -59.4, -31.8, -44.6, -32.2, -36.8, -28.9, -34.7, -27.1, -37.5, -19.6, -32.4, -10.1, -26.1, -11.9, -23.4, -8.2, -20.9, -1.9, -23.7, -0.3, -26.1, 3.3, -31.4, 6.7, -36.5]),
]

// ---- tunables: heights (m) and the quai front's rhythm
const EAVES = 12.2 // the wings' cornice; the back ranges share it under their mansards
const RISE = 3.6 // the mansard over the whole plan
const COURSE = 5.0 // the string course between the rusticated ground floor and the piano nobile
const BAY = 3.9 // the window rhythm along the two curved wings
const PAV_EAVES = 15.6 // the end pavilions, a storey higher than the wings
const PAV_ROOF = 7.5 // and their steep square slate roofs
/** the end pavilions on the quai (x0, x1, z0, z1): to the Rue de Seine (east in this frame, as OSM is mirrored into it) and the Monnaie */
const PAVILIONS: [number, number, number, number][] = [[67.3, 87.2, -85.6, -64.3], [-42.8, -22.6, -85.0, -68.6]]
/** the chapel's front between the wings, which `institutDome` dresses */
const CHAPEL = [8.0, 31.5]

/**
 * The Institut de France (Le Vau, 1662–88, the Collège des Quatre-Nations) on the Quai de Conti, facing the Louvre over
 * the Pont des Arts. The chapel front and dome are `institutDome`; this is the rest:
 *
 * - the two CURVED WINGS of the hemicycle reaching out from the chapel to the quai, in Le Vau's dress: a rusticated
 *   ground floor of round-headed openings, a string course, the tall windows of the piano nobile between pilasters, the
 *   cornice and a balustrade before the slate;
 * - the END PAVILIONS where the wings meet the quai, a storey higher, quoined, with giant pilasters to the river and
 *   steep square slate roofs;
 * - the ranges behind round the Cour d'honneur and the second court to the Rue Mazarine, OSM's plan extruded.
 */
export function institutWings(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#e2d8c3', '#4b5359')
  extrude(out, PLAN, p, { eaves: EAVES, rise: RISE, bay: 3.6, win: 1.4, storeys: [{ y: 0, h: 3.0, sill: 1.0 }, { y: COURSE, h: 3.4, sill: 1.0 }, { y: 9.0, h: 1.6, sill: 0.4 }] })
  hemicycle(out, p)
  for (const [x0, x1, z0, z1] of PAVILIONS) pavilion(out, p, x0, x1, z0, z1)
}

type P2 = { x: number; z: number }

/** The quai fronts of the curved wings: every outline edge ahead of the dome that faces the river, outside the chapel and pavilions. */
function frontRuns(): P2[][] {
  const ring = PLAN[0]
  const runs: P2[][] = []
  let cur: P2[] = []
  const inPav = (m: P2): boolean => PAVILIONS.some(([x0, x1, z0, z1]) => m.x > x0 - 0.5 && m.x < x1 + 0.5 && m.z > z0 - 0.5 && m.z < z1 + 0.5)
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const m = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 }
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    // facing the quai: the edge's normal (either side) mostly along z, the wall ahead of the dome
    const facing = Math.abs(b.x - a.x) / L > 0.35
    const ok = facing && L > 0.8 && m.z < DOME.z - 2 && m.z > -72 && !(m.x > CHAPEL[0] && m.x < CHAPEL[1]) && !inPav(m)
    if (ok) {
      if (!cur.length) cur.push(a)
      cur.push(b)
    } else if (cur.length) { runs.push(cur); cur = [] }
  }
  if (cur.length) runs.push(cur)
  return runs.filter((r) => r.length > 2)
}

function hemicycle(out: MeshBuilder, p: Pal): void {
  const rust = shade(p.stone, 0.8)
  const voidc: Rgb = [0.2, 0.21, 0.23]
  for (const run of frontRuns()) {
    // walls whose outward normal faces −z (the quai)
    const walls: Wall[] = []
    for (let i = 0; i + 1 < run.length; i++) {
      let a = run[i]
      let b = run[i + 1]
      const w0 = wallOn(out, a, b)
      const o = w0.at(0, 1)
      if (o.z > a.z) { const t = a; a = b; b = t }
      walls.push(a === run[i] ? w0 : wallOn(out, a, b))
    }
    // the wall-wide courses: rustication, string course, cornice, balustrade
    for (const w of walls) {
      for (let y = 0.6; y < COURSE; y += 0.62) w.rect(0, w.L, y, y + 0.07, rust, 0.05)
      w.slab(0, w.L, COURSE, COURSE + 0.35, 0.22, p.trim)
      w.slab(0, w.L, EAVES - 0.7, EAVES, 0.5, p.trim)
      w.slab(0, w.L, EAVES, EAVES + 0.18, 0.12, p.trim)
      w.slab(0, w.L, EAVES + 0.95, EAVES + 1.12, 0.14, p.trim)
    }
    // the bays, laid along the run's length so the rhythm carries across OSM's short edges
    const lens = walls.map((w) => w.L)
    const total = lens.reduce((s, l) => s + l, 0)
    const n = Math.max(1, Math.round(total / BAY))
    const step = total / n
    const find = (s: number): [Wall, number] => {
      let k = 0
      while (k < walls.length - 1 && s > lens[k]) { s -= lens[k]; k++ }
      return [walls[k], Math.min(Math.max(s, 0), lens[k])]
    }
    // a run is drawn from whichever end; walls were flipped to face the quai, so place by the wall's own `u` near s
    for (let j = 0; j <= n; j++) {
      // the pilasters at the bay joints, up the piano nobile to the cornice
      const [w, u] = find(j * step)
      w.slab(u - 0.36, u + 0.36, COURSE + 0.35, EAVES - 0.7, 0.26, p.stone)
      w.slab(u - 0.44, u + 0.44, EAVES - 1.15, EAVES - 0.7, 0.32, p.trim)
      // balusters over the joints and between
      if (j < n) {
        for (let b = 0; b < 6; b++) {
          const [wb, ub] = find(j * step + (b + 0.5) * (step / 6))
          wb.slab(ub - 0.11, ub + 0.11, EAVES + 0.18, EAVES + 0.95, 0.1, p.stone)
        }
      }
    }
    for (let j = 0; j < n; j++) {
      const [w, u] = find((j + 0.5) * step)
      // the ground floor's round-headed openings in the rustication
      w.arch(u, 0.4, 1.7, 3.9, voidc, 0.08)
      // the piano nobile: a tall window, its frame and its cornice
      w.rect(u - 0.92, u + 0.92, COURSE + 0.95, COURSE + 4.65, p.trim, 0.08)
      w.rect(u - 0.72, u + 0.72, COURSE + 1.1, COURSE + 4.45, p.glass, 0.11)
      w.slab(u - 1.05, u + 1.05, COURSE + 4.75, COURSE + 5.0, 0.24, p.trim)
      // the attic's small window under the cornice
      w.rect(u - 0.5, u + 0.5, EAVES - 2.3, EAVES - 1.35, p.glass, 0.1)
    }
  }
}

/** An end pavilion: three storeys, quoined, giant pilasters to the quai, a steep square slate roof. */
function pavilion(out: MeshBuilder, p: Pal, x0: number, x1: number, z0: number, z1: number): void {
  range(out, x0 - 0.3, x1 + 0.3, z0 - 0.3, z1 + 0.3, p, {
    eaves: PAV_EAVES, bay: 3.3, win: 1.5, rustic: 0.62, rusticTo: COURSE, courses: true, quoins: true, cornice: 0.6,
    storeys: [{ y: 0, h: 3.0, sill: 0.9, arched: true }, { y: COURSE, h: 3.6, sill: 1.0 }, { y: 10.2, h: 2.8, sill: 0.8 }],
  })
  const w = x1 - x0
  for (const f of [0.08, 0.32, 0.68, 0.92]) {
    const t = x0 + w * f
    slabOn(out, '-z', z0 - 0.3, t - 0.42, t + 0.42, COURSE + 0.35, PAV_EAVES - 0.6, 0.28, p.stone)
  }
  pavilionRoof(out, x0 - 0.3, x1 + 0.3, z0 - 0.3, z1 + 0.3, PAV_EAVES, PAV_ROOF, p, { top: Math.min(w, z1 - z0) * 0.25 })
}
