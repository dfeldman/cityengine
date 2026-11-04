import { MeshBuilder, capPolygonWithHoles } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { block, hex, roof, shade } from '../../kit.ts'
import { boxAlong, edgeAt, offsetRing } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { fitted, palette, pts, type Pal } from './common.ts'

const FIXED = 0
/**
 * The design frame: centre 48.861371, 2.318255, turned 8.5° (local −z faces bearing 188.5, the Rue de l'Université and
 * the Place du Palais-Bourbon, as `bourbonGate`); half-extents of the claimed parts' box.
 */
const HX = 73.5
const HZ = 70

type P2 = { x: number; z: number }

/**
 * OSM's outlines in this frame (osmium on the Île-de-France extract, 2026-11-03). The western block is relation
 * 19981961 (the outer ring and its three courts); the rest are building:parts of relation 1019368.
 */
const WEST_BLOCK = [
  pts([-73.3, -31.6, -61.1, -31.7, -61.1, -39.8, -61.2, -49.0, -60.5, -49.0, -60.2, -61.3, -58.0, -61.2, -7.0, -59.0, -7.9, -45.2, -8.2, -40.0, -9.0, -27.7, -8.0, -27.6, -8.5, -20.3, -7.6, -20.3, -8.4, -8.6, -9.3, -8.6, -9.8, -1.2, -10.8, -1.2, -12.0, 17.2, -9.8, 17.3, -8.7, 24.6, -13.6, 24.6, -53.1, 24.7, -59.9, 24.7, -59.9, 21.5, -60.2, 8.6, -72.4, 8.6, -72.9, 8.8]),
  pts([-64.6, -19.2, -64.6, -2.5, -55.9, -2.4, -55.9, -19.2]),
  pts([-49.8, -49.1, -49.9, -31.5, -18.0, -31.5, -17.9, -49.0]),
  pts([-46.8, -16.0, -47.0, 8.9, -42.9, 8.9, -42.8, 12.1, -25.1, 12.1, -25.2, 8.9, -22.2, 9.0, -22.3, -16.0, -25.2, -16.1, -25.3, -19.8, -42.9, -19.6, -42.9, -16.1]),
]
/** the ranges round the Cour d'honneur: west (1459919808, 1460019025), east (1459866034–37), the outer east range (1460019024) */
const WINGS = [
  pts([-11.8, 55.5, -13.1, 51.9, -13.2, 41.0, -11.9, 40.4, -11.2, 22.6, 1.7, 22.7, 1.6, 55.3]),
  pts([3.2, 29.0, 1.7, 29.0, -11.4, 27.6, -13.6, 24.6, -12.0, 17.2, -9.7, 16.0, 1.9, 15.9, 1.9, 17.5, 3.5, 17.5]),
  pts([34.8, 55.9, 34.7, 28.9, 34.9, 22.4, 48.3, 22.3, 48.5, 29.0, 49.8, 55.7]),
  pts([62.7, 69.8, 51.7, 69.6, 49.5, 63.0, 49.6, 60.1, 59.9, 60.4, 52.0, 25.4, 63.0, 26.2, 72.8, 66.6, 72.0, 68.5, 69.5, 69.8]),
  pts([33.1, 28.9, 48.5, 29.0, 52.0, 25.4, 51.8, 17.8, 45.9, 17.5, 45.9, 15.9, 34.3, 15.8, 33.1, 17.4]),
  pts([63.0, 26.2, 52.0, 25.4, 48.9, 25.3, 48.4, 17.6, 47.4, -0.9, 46.3, -0.8, 46.0, -8.2, 44.9, -8.1, 44.2, -20.0, 45.3, -20.1, 44.7, -27.7, 49.9, -28.2]),
  pts([52.0, 25.4, 52.5, 63.3, 63.9, 63.7, 60.6, 26.0]),
]
/** the cour d'honneur's paving, between the gate, the wings and the palace's steps */
const COURT = pts([-7.9, -45.2, 46.0, -45.3, 49.9, -28.2, 44.7, -27.7, 44.2, -20.0, 48.4, 17.6, 33.1, 17.4, 33.1, 28.9, 34.8, 28.9, 34.8, 44.0,
  1.6, 44.0, 1.7, 29.0, 3.2, 29.0, 1.9, 15.9, -9.7, 16.0, -9.8, -1.2, -8.4, -8.6, -9.0, -27.7])

/**
 * The Palais Bourbon's RANGES and its COUR D'HONNEUR (the Assemblée nationale; the wings mostly of the 1720s, raised and
 * refronted in the 19th century). What OSM gave as plain mansard boxes is drawn as the fronts they are: three storeys of
 * tall windows in pale stone (a tall ground floor, the piano nobile, a lower second floor) with string courses, the
 * cornice and a balustrade at the eaves, the steep slate mansard behind it with a dormer in every bay, and the green
 * copper leads on top that the aerial shows across the whole complex. The western block's ranges round their courts
 * are the same front; the glazed court among them has its glass roof over a ring of low galleries, a small hipped
 * block stands in the westernmost court, and the south-west corner pavilion is a storey higher under its pyramid.
 *
 * In the court, from the palace's steps toward the gate (`bourbonGate`): the cobbles; the ROUND LAWN with the dark
 * granite SPHERE on its square pedestal; the low curved stone bench-wall behind it with its dark inscribed plaques; the
 * two rectangular LAWNS either side of the cobbled path, bordered with red flowers and set with clipped pyramid yews;
 * and the lamp standards. The palace itself, its portico, the hemicycle and the gate are other entries' and OSM's.
 */
export function bourbonCourts(out: MeshBuilder, fit: Fit): void {
  // the court stands on the city's ground, which climbs a little from the model's base (sunk to the lowest point
  // under the whole footprint): lifted to the highest ground under the court, so the cobbles and lawns are not buried
  let lift = 0
  if (fit.groundAt) {
    const samples = [...COURT, { x: 18, z: 15 }, { x: 18, z: -20 }, { x: 0, z: -40 }, { x: 40, z: -40 }]
    for (const s of samples) lift = Math.max(lift, fit.groundAt(s.x, s.z))
  }
  fitted(out, fit, HX, HZ, (q) => draw(q, lift))
}

const EAVES = 12.6
const RISE = 3.4
const INSET = 1.7
const STOREYS = [{ y: 0, h: 3.3, sill: 0.45 }, { y: 4.4, h: 3.1, sill: 0.7 }, { y: 8.6, h: 2.2, sill: 0.7 }]

function draw(out: MeshBuilder, lift: number): void {
  const p = palette('#e2d8c3', '#4f575d')
  const copper = hex('#5f8c73')
  ranges(out, WEST_BLOCK, p, copper)
  for (const r of WINGS) ranges(out, [r], p, copper)
  pavilion(out, p, copper)
  glassCourt(out, p)
  innerBlock(out, p)
  const c = new MeshBuilder()
  court(c, p)
  for (let i = 1; i < c.positions.length; i += 3) c.positions[i] += lift
  const base = out.positions.length / 3
  for (const v of c.positions) out.positions.push(v)
  for (const v of c.normals) out.normals.push(v)
  for (const v of c.uvs) out.uvs.push(v)
  for (const v of c.colors) out.colors.push(v)
  for (const i of c.indices) out.indices.push(base + i)
}

/** Drop the jogs under ~1 m that OSM's outlines carry, so the mansard's inset ring stays simple. */
function simplify(r: P2[], tol = 0.9): P2[] {
  let ring = r
  for (let pass = 0; pass < 4; pass++) {
    const keep: P2[] = []
    for (let i = 0; i < ring.length; i++) {
      const a = ring[(i - 1 + ring.length) % ring.length]
      const b = ring[i]
      const c = keep.length ? keep[keep.length - 1] : a
      const d = ring[(i + 1) % ring.length]
      const L = Math.hypot(d.x - c.x, d.z - c.z) || 1
      const off = Math.abs((d.x - c.x) * (c.z - b.z) - (c.x - b.x) * (d.z - c.z)) / L
      if (off < tol && Math.hypot(b.x - a.x, b.z - a.z) < 4) continue
      keep.push(b)
    }
    ring = keep
  }
  return ring
}

const area = (r: P2[]): number => {
  let a = 0
  for (let i = 0; i < r.length; i++) { const p = r[i]; const q = r[(i + 1) % r.length]; a += p.x * q.z - q.x * p.z }
  return a / 2
}

/**
 * A plan of RANGES: every wall of the outline (and its courts) up to the eaves, its windows in three storeys, string
 * courses, the cornice, the balustrade, the slate mansard skirt with a dormer per bay, the copper leads over it.
 */
function ranges(out: MeshBuilder, raw: P2[][], p: Pal, copper: Rgb): void {
  const rings = raw.map((r, i) => {
    const s = simplify(r)
    return (area(s) > 0) === (i === 0) ? s : [...s].reverse()
  })
  const inner = rings.map((r) => offsetRing(r, -INSET))
  const bay = 3.5
  const win = 1.45
  const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  for (let k = 0; k < rings.length; k++) {
    const r = rings[k]
    for (let i = 0; i < r.length; i++) {
      const e = edgeAt(r, i)
      const P = (u: number, y: number, d: number): [number, number, number] => [e.a.x + e.tx * u + e.nx * d, y, e.a.z + e.tz * u + e.nz * d]
      const n: [number, number, number] = [e.nx, 0, e.nz]
      const q = (u0: number, u1: number, y0: number, y1: number, d: number, c: Rgb, tag = FIXED): void =>
        out.quad([P(u0, y0, d), P(u1, y0, d), P(u1, y1, d), P(u0, y1, d)], n, UV, c, tag)
      q(0, e.L, 0, EAVES, 0, p.stone)
      // the plinth, the string courses, the cornice
      q(0, e.L, 0, 0.6, 0.08, p.deep)
      for (const y of [4.1, 8.3]) boxAlong(out, e.mid.x + e.nx * 0.08, y, e.mid.z + e.nz * 0.08, e.L / 2, 0.13, 0.12, e.heading, p.trim)
      boxAlong(out, e.mid.x + e.nx * 0.2, EAVES - 0.35, e.mid.z + e.nz * 0.2, e.L / 2 + 0.25, 0.35, 0.5, e.heading, p.trim)
      // the balustrade on the cornice: plinth, rail, a pedestal every bay and balusters between
      const bx = e.mid.x - e.nx * 0.05
      const bz = e.mid.z - e.nz * 0.05
      boxAlong(out, bx, EAVES + 0.11, bz, e.L / 2, 0.11, 0.26, e.heading, p.trim)
      boxAlong(out, bx, EAVES + 0.92, bz, e.L / 2, 0.09, 0.28, e.heading, p.trim)
      const nb = Math.max(1, Math.round((e.L - 1.2) / bay))
      const step = (e.L - 1.2) / nb
      if (e.L > 1.5) {
        const nbal = Math.max(2, Math.round(e.L / 0.5))
        for (let j = 0; j <= nbal; j++) {
          const u = (e.L * j) / nbal
          const c = P(u, 0, -0.05)
          boxAlong(out, c[0], EAVES + 0.52, c[2], 0.07, 0.3, 0.08, e.heading, p.trim)
        }
      }
      // the mansard skirt from the eaves to the inset line
      const ia = inner[k][i]
      const ib = inner[k][(i + 1) % r.length]
      out.quad([[e.a.x, EAVES, e.a.z], [e.b.x, EAVES, e.b.z], [ib.x, EAVES + RISE, ib.z], [ia.x, EAVES + RISE, ia.z]],
        [e.nx * 0.9, INSET / Math.hypot(INSET, RISE), e.nz * 0.9], UV, p.slate, FIXED)
      if (e.L < 3) continue
      for (let j = 0; j < nb; j++) {
        const u = 0.6 + step * (j + 0.5)
        for (const s of STOREYS) {
          const sill = s.y + s.sill
          q(u - win / 2 - 0.2, u + win / 2 + 0.2, sill - 0.18, sill + s.h + 0.16, 0.05, p.trim)
          q(u - win / 2, u + win / 2, sill, sill + s.h, 0.09, p.glass)
          if (s === STOREYS[1]) boxAlong(out, P(u, 0, 0)[0] + e.nx * 0.18, sill + s.h + 0.35, P(u, 0, 0)[2] + e.nz * 0.18, win / 2 + 0.35, 0.12, 0.2, e.heading, p.trim)
        }
        // a stone dormer in the skirt: its face, cheeks back into the slope, a round or triangular head by turns
        if (step > 2.4) {
          const yd = EAVES + 0.5
          const set = INSET * (0.5 / RISE) + 0.15
          const c = P(u, 0, -set - 0.55)
          boxAlong(out, c[0], yd + 0.95, c[2], 0.62, 0.95, 0.55, e.heading, p.trim)
          q(u - 0.38, u + 0.38, yd + 0.25, yd + 1.6, -set + 0.02, p.glass)
          if (j % 2 === 0) {
            const t = P(u, 0, -set - 0.4)
            boxAlong(out, t[0], yd + 2.05, t[2], 0.7, 0.16, 0.45, e.heading, p.trim)
          } else {
            const t = P(u, 0, -set - 0.4)
            prism(out, t[0], t[2], yd + 1.9, yd + 2.35, 0.62, 10, p.trim, FIXED, 0.25)
          }
        }
      }
    }
  }
  // the copper leads over the mansard, and a ridge of slate along their edge
  capPolygonWithHoles(out, inner, EAVES + RISE, copper, surfaceTag('copper'))
}

/** The south-west corner pavilion on the Rue de l'Université (part 1459919803): a storey higher, under its pyramid. */
function pavilion(out: MeshBuilder, p: Pal, copper: Rgb): void {
  const [x0, x1, z0, z1] = [-73.2, -60.3, -61.9, -49.0]
  block(out, x0, x1, z0, z1, 0, 15.6, p.stone)
  for (const y of [4.1, 8.3, 12.5]) block(out, x0 - 0.12, x1 + 0.12, z0 - 0.12, z1 + 0.12, y - 0.12, y + 0.12, p.trim)
  block(out, x0 - 0.5, x1 + 0.5, z0 - 0.5, z1 + 0.5, 15.0, 15.6, p.trim)
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) block(out, x - 0.3, x + 0.3, z - 0.3, z + 0.3, 0, 15.0, p.trim)
  const storeys = [...STOREYS, { y: 12.6, h: 1.6, sill: 0.4 }]
  for (const [f, plane, t0, t1] of [['-z', z0, x0, x1], ['+z', z1, x0, x1], ['-x', x0, z0, z1], ['+x', x1, z0, z1]] as const) {
    for (let j = 0; j < 3; j++) {
      const t = t0 + ((t1 - t0) * (j + 0.5)) / 3
      for (const s of storeys) {
        const y0 = s.y + s.sill
        const w = 1.5
        const d = f === '-z' || f === '-x' ? -0.09 : 0.09
        if (f === '-z' || f === '+z') block(out, t - w / 2, t + w / 2, plane + d - 0.02, plane + d, y0, y0 + s.h, p.glass)
        else block(out, plane + d - 0.02, plane + d, t - w / 2, t + w / 2, y0, y0 + s.h, p.glass)
      }
    }
  }
  roof(out, x0 - 0.2, x1 + 0.2, z0 - 0.2, z1 + 0.2, 15.6, 3.8, (x1 - x0) / 2 + 0.2, (z1 - z0) / 2 + 0.2, p.slate)
  block(out, (x0 + x1) / 2 - 0.4, (x0 + x1) / 2 + 0.4, (z0 + z1) / 2 - 0.4, (z0 + z1) / 2 + 0.4, 19.2, 19.5, copper)
}

/** The glazed court of the western block: a ring of low galleries (parts 1460019027–30) and the glass roof inside. */
function glassCourt(out: MeshBuilder, p: Pal): void {
  for (const [x0, x1, z0, z1] of [[-47.0, -42.9, -16.0, 8.9], [-42.9, -25.2, -19.7, -16.1], [-25.2, -22.2, -16.0, 9.0], [-42.9, -25.2, 8.9, 12.1]]) {
    block(out, x0, x1, z0, z1, 0, 4.0, p.stone)
    block(out, x0 - 0.1, x1 + 0.1, z0 - 0.1, z1 + 0.1, 3.7, 4.0, p.trim)
  }
  const glass: Rgb = [0.42, 0.55, 0.6]
  const [x0, x1, z0, z1] = [-42.9, -25.2, -16.1, 8.9]
  block(out, x0, x1, z0, z1, 4.0, 9.0, shade(p.stone, 0.9))
  roof(out, x0, x1, z0, z1, 9.0, 2.6, (x1 - x0) / 2, 0.01, glass)
  // the glazing bars
  for (let z = z0 + 1.5; z < z1; z += 1.5) {
    for (const s of [-1, 1]) {
      const xa = (x0 + x1) / 2 + s * (x1 - x0) / 4
      boxAlong(out, xa, 10.3, z, (x1 - x0) / 4, 0.05, 0.05, 0, [0.3, 0.33, 0.34])
    }
  }
}

/** The small hipped block in the westernmost court (part 1460019026, 13 m). */
function innerBlock(out: MeshBuilder, p: Pal): void {
  const [x0, x1, z0, z1] = [-64.6, -55.9, -19.2, -2.5]
  block(out, x0, x1, z0, z1, 0, 9.8, p.stone)
  block(out, x0 - 0.4, x1 + 0.4, z0 - 0.4, z1 + 0.4, 9.4, 9.8, p.trim)
  for (const [f, plane, t0, t1] of [['-x', x0, z0, z1], ['+x', x1, z0, z1]] as const) {
    for (let t = t0 + 1.8; t < t1 - 1; t += 3.3) {
      for (const s of STOREYS.slice(0, 2)) {
        const d = f === '-x' ? -0.09 : 0.09
        block(out, plane + d - 0.02, plane + d, t - 0.7, t + 0.7, s.y + s.sill, s.y + s.sill + s.h, p.glass)
      }
    }
  }
  roof(out, x0 - 0.3, x1 + 0.3, z0 - 0.3, z1 + 0.3, 9.8, 3.2, 3.6, 3.6, p.slate)
}

/** The cour d'honneur and what stands in it. */
function court(out: MeshBuilder, p: Pal): void {
  // the cobbles (granite setts), the cobbled path between the lawns a little lighter
  capPolygonWithHoles(out, [COURT], 0.06, hex('#7f786e'), surfaceTag('granite'))
  const cx = 18.2
  const cz = 15.0
  // ---- the round lawn in its stone curb, the sphere on its pedestal
  prism(out, cx, cz, 0.06, 0.26, 5.0, 40, p.trim, FIXED)
  prism(out, cx, cz, 0.26, 0.3, 4.6, 40, hex('#57893f'), surfaceTag('foliage'))
  block(out, cx - 0.8, cx + 0.8, cz - 0.8, cz + 0.8, 0.3, 0.55, p.trim)
  block(out, cx - 0.62, cx + 0.62, cz - 0.62, cz + 0.62, 0.55, 2.2, p.deep)
  block(out, cx - 0.75, cx + 0.75, cz - 0.75, cz + 0.75, 2.2, 2.4, p.trim)
  sphere(out, cx, 2.4 + 1.25, cz, 1.3, hex('#5d6266'), surfaceTag('granite'))
  // ---- the curved bench-wall behind it, on the gate's side, with its dark plaques facing the palace
  const R = 8.2
  const n = 22
  const a0 = -1.35
  const a1 = 1.35
  for (let i = 0; i < n; i++) {
    const t0 = a0 + ((a1 - a0) * i) / n
    const t1 = a0 + ((a1 - a0) * (i + 1)) / n
    const tm = (t0 + t1) / 2
    // angle measured from −z (the gate side): point = centre + R·(sin t, −cos t)
    const x = cx + Math.sin(tm) * R
    const z = cz - Math.cos(tm) * R
    const half = (R * (t1 - t0)) / 2 + 0.02
    const heading = Math.atan2(-Math.sin(tm), Math.cos(tm))  // faces the centre
    boxAlong(out, x, 0.5, z, half, 0.45, 0.35, heading, p.stone)
    boxAlong(out, x, 1.02, z, half + 0.03, 0.07, 0.45, heading, p.trim)
    if (i % 2 === 0) {
      const xi = cx + Math.sin(tm) * (R - 0.37)
      const zi = cz - Math.cos(tm) * (R - 0.37)
      boxAlong(out, xi, 0.62, zi, Math.min(half, 0.55), 0.22, 0.02, heading, hex('#2d3134'), surfaceTag('granite'))
    }
  }
  // ---- the two lawns either side of the path, red borders, clipped pyramid yews at their corners
  const green = hex('#57893f')
  const red = hex('#c2332b')
  for (const [x0, x1] of [[2.5, 15.6], [20.8, 35.5]]) {
    const z0 = -37
    const z1 = -1.5
    block(out, x0, x1, z0, z1, 0.06, 0.24, p.trim)
    boxAlong(out, (x0 + x1) / 2, 0.26, (z0 + z1) / 2, (x1 - x0) / 2 - 0.25, 0.02, (z1 - z0) / 2 - 0.25, 0, green, surfaceTag('foliage'))
    for (const [a, b, c, d] of [[x0 + 0.3, x1 - 0.3, z0 + 0.3, z0 + 1.1], [x0 + 0.3, x1 - 0.3, z1 - 1.1, z1 - 0.3],
      [x0 + 0.3, x0 + 1.1, z0 + 1.1, z1 - 1.1], [x1 - 1.1, x1 - 0.3, z0 + 1.1, z1 - 1.1]]) {
      boxAlong(out, (a + b) / 2, 0.39, (c + d) / 2, (b - a) / 2, 0.11, (d - c) / 2, 0, red, surfaceTag('blossom'))
    }
    for (const x of [x0 + 1.6, x1 - 1.6]) {
      for (const z of [z0 + 1.6, (z0 + z1) / 2, z1 - 1.6]) yew(out, x, z)
    }
  }
  // ---- the lamp standards: at the lawns' ends by the path, and either side of the round lawn
  for (const [x, z] of [[16.4, -0.8], [20.0, -0.8], [16.4, -37.8], [20.0, -37.8], [11.0, 18.5], [25.4, 18.5]]) lamp(out, x, z)
}

function yew(out: MeshBuilder, x: number, z: number): void {
  const g = hex('#2f5a2c')
  prism(out, x, z, 0.28, 0.6, 0.35, 8, hex('#4a3a2a'), FIXED)
  prism(out, x, z, 0.6, 2.6, 0.62, 8, g, surfaceTag('clipped'), 0.04)
}

function lamp(out: MeshBuilder, x: number, z: number): void {
  const iron = hex('#2c3330')
  prism(out, x, z, 0.06, 0.6, 0.28, 8, iron, FIXED, 0.2)
  prism(out, x, z, 0.6, 3.6, 0.07, 6, iron, FIXED)
  box(out, x, 3.95, z, 0.2, 0.32, 0.2, hex("#f1e2a8"))
  prism(out, x, z, 4.27, 4.6, 0.3, 6, iron, FIXED, 0.03)
}

/** A sphere of stacked rings. */
function sphere(out: MeshBuilder, x: number, y: number, z: number, r: number, c: Rgb, tag: number): void {
  const rings = 10
  for (let k = 0; k < rings; k++) {
    const p0 = -Math.PI / 2 + (k / rings) * Math.PI
    const p1 = -Math.PI / 2 + ((k + 1) / rings) * Math.PI
    prism(out, x, z, y + Math.sin(p0) * r, y + Math.sin(p1) * r, Math.max(0.01, Math.cos(p0) * r), 20, c, tag,
      Math.max(0.01, Math.cos(p1) * r), k === 0 || k === rings - 1)
  }
}
