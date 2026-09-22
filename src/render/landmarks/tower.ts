/**
 * The tower grammar (SF_PLAN.md §10: every building of ten storeys and over, one by one). Most downtown buildings
 * are their own footprint raised — OSM's outline is the building's — so what makes one recognisable is how it is
 * dressed: the stone or the glass, how the windows are cut into it, where it steps in, the cornice, the podium
 * and its shopfronts, the crown. A `TowerSpec` says that for one building, and this raises it from its fitted
 * footprint. Shared: any city's towers.
 *
 * A spec is a stack of TIERS, bottom up, each with its own facade (`Face`), each drawn in from the one below by
 * its `inset`; a `base` (podium, shopfronts, a canopy) under them; `cornice` ledges where a tier ends; and a
 * `crown` on top. Heights are metres; a tier's `to` is a fraction of the building's height when ≤ 1.5, metres above.
 *
 * Faces, and what each costs (a 40-storey tower is 2–8k triangles):
 * - `punched`  windows cut into a solid wall, one per bay per floor, with a reveal (the 1920s towers, the hotels);
 * - `bands`    alternating strips of wall and glass a floor apart (the 1960s–80s slabs);
 * - `fins`     vertical piers or fins proud of the glass (555 California, the Embarcadero Center);
 * - `curtain`  glass with a thin mullion grid (the 2000s towers);
 * - `xbrace`   a curtain wall behind exterior X-bracing, a brace per `pitch` bay per `brace` floors (One Maritime);
 * - `blank`    solid wall (a garage, a service core, the back of a podium).
 *
 * Local frame: the fitted footprint's, +y up.
 */
import { capPolygon, type MeshBuilder } from '../buildings.ts'
import { box, type Rgb } from '../models.ts'
import type { Fit } from './fit.ts'
import { surfaceTag, type Surface } from '../cartoon-material.ts'

type P2 = { x: number; z: number }

export interface Face {
  /** `bays`: projecting bay windows, one per bay, all the way up — San Francisco's own facade */
  kind: 'punched' | 'bands' | 'fins' | 'curtain' | 'xbrace' | 'blank' | 'bays'
  wall: Rgb
  glass?: Rgb
  /** floor to floor, metres (default 3.6) */
  floor?: number
  /** bay width, fin spacing, mullion spacing, metres (default 3) */
  pitch?: number
  /** the wall's share of each bay (punched, fins) or floor (bands), 0..1 */
  solid?: number
  /** how far fins or piers stand proud, metres (default 0.3) */
  depth?: number
  /** xbrace: floors per brace (default 6) */
  brace?: number
  /** punched: arched window heads (the 1910s–20s) */
  arched?: boolean
  /** bays: how far a bay projects (default 0.8 m), and whether it is angled (default) or rounded */
  bay?: { depth?: number; round?: boolean }
  /**
   * What the wall is made of, from the landmark surface library (cartoon-material.ts SURFACES): drawn as a
   * procedural pattern — courses of brick, ashlar blocks, granite panels, glazed terracotta, precast concrete,
   * metal seams. Default by kind: punched ashlar, the rest concrete; the glass is always glass.
   */
  material?: Surface
}

export interface Tier {
  /** the top of this tier: a fraction of the height (≤ 1.5) or metres */
  to: number
  face: Face
  /** metres drawn in from the tier below (a setback) */
  inset?: number
  /** a cornice at the top of this tier: how far it projects (m), its colour (default the wall's) */
  cornice?: { depth: number; height?: number; colour?: Rgb }
}

export type Crown =
  | { kind: 'flat' }
  | { kind: 'parapet'; height: number; colour?: Rgb; material?: Surface }
  | { kind: 'hip' | 'mansard'; height: number; inset: number; colour: Rgb; material?: Surface; dormers?: number }
  | { kind: 'pyramid' | 'spire'; height: number; inset?: number; colour: Rgb; material?: Surface }
  | { kind: 'dome'; height: number; radius?: number; colour: Rgb; drum?: number; material?: Surface }
  | { kind: 'lantern'; height: number; inset: number; face: Face; cap?: Crown }
  | { kind: 'stepped'; steps: number; height: number; inset: number; face?: Face; material?: Surface }
  | { kind: 'mast'; height: number; colour?: Rgb; width?: number; material?: Surface }
  /** a jagged parapet of points or battlements round the roof (201 Mission, 199 Fremont) */
  | { kind: 'sawtooth'; height: number; pitch?: number; colour: Rgb; material?: Surface }
  /** tapered needles standing off the roof: `n` of them along the long axis (345 California's twins) */
  | { kind: 'spires'; height: number; n?: number; radius?: number; colour: Rgb; material?: Surface }
  /** the roof sliced on a diagonal, to a ridge or a point (505 Montgomery) */
  | { kind: 'sliced'; height: number; colour: Rgb; material?: Surface }

export interface TowerSpec {
  /** used when the manifest's (OSM's) height is missing or implausible */
  height: number
  /** podium: shopfronts to `height`, an awning or canopy along the front */
  base?: { height: number; face: Face; canopy?: { depth: number; colour: Rgb } }
  tiers: Tier[]
  roof?: Rgb
  crown?: Crown
  /** mechanical penthouse boxes on the roof: how many (default 0) */
  penthouse?: number
}

const DARK_GLASS: Rgb = [0.22, 0.25, 0.29]

/** The ring drawn in by d metres toward its centroid (near enough for a tower's setbacks). */
export function insetRing(ring: P2[], d: number): P2[] {
  let cx = 0
  let cz = 0
  for (const p of ring) { cx += p.x; cz += p.z }
  cx /= ring.length
  cz /= ring.length
  return ring.map((p) => {
    const dx = p.x - cx
    const dz = p.z - cz
    const l = Math.hypot(dx, dz) || 1
    const k = Math.max(0.15, (l - d) / l)
    return { x: cx + dx * k, z: cz + dz * k }
  })
}

function centroid(ring: P2[]): P2 {
  let cx = 0
  let cz = 0
  for (const p of ring) { cx += p.x; cz += p.z }
  return { x: cx / ring.length, z: cz / ring.length }
}

const quadAt = (out: MeshBuilder, p: [number, number, number][], n: [number, number, number], c: Rgb, tag = 0,
                uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]): void =>
  out.quad(p as [[number, number, number], [number, number, number], [number, number, number], [number, number, number]], n, uv, c, tag)

const GLASS = surfaceTag('glass')
/** a face's wall surface: its own, or the default for its kind */
export const wallTag = (f: Face): number =>
  surfaceTag(f.material ?? (f.kind === 'punched' ? 'ashlar' : f.kind === 'curtain' || f.kind === 'xbrace' ? 'metal' : 'concrete'))

/** One face between y0 and y1 on every edge of the ring. */
export function faceBand(out: MeshBuilder, ring: P2[], y0: number, y1: number, f: Face): void {
  const glass = f.glass ?? DARK_GLASS
  const floor = f.floor ?? 3.6
  const pitch = f.pitch ?? 3
  const depth = f.depth ?? 0.3
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.2) continue
    const tx = (b.x - a.x) / L
    const tz = (b.z - a.z) / L
    const nx = tz
    const nz = -tx
    const n: [number, number, number] = [nx, 0, nz]
    const floors = Math.max(1, Math.round((y1 - y0) / floor))
    const fh = (y1 - y0) / floors
    const bays = Math.max(1, Math.round(L / pitch))
    const bw = L / bays
    /** a rectangle on this face: along u0..u1 metres, up ya..yb, `o` metres out */
    const W = wallTag(f)
    // uv in ROOMS: bays along, floors up, so the landmark shader lights a whole window after dark (floor(uv) is
    // the room) — see cartoon-material.ts, surface 6
    const R = (u: number, y: number): [number, number] => [u / bw, (y - y0) / fh]
    const rect = (u0: number, u1: number, ya: number, yb: number, c: Rgb, o = 0, tag = c === glass ? GLASS : W): void => {
      const P = (u: number, y: number): [number, number, number] => [a.x + tx * u + nx * o, y, a.z + tz * u + nz * o]
      quadAt(out, [P(u0, ya), P(u1, ya), P(u1, yb), P(u0, yb)], n, c, tag, [R(u0, ya), R(u1, ya), R(u1, yb), R(u0, yb)])
    }
    /** a block proud of the face by `o`: its front and two cheeks (and a top ledge when `top`) */
    const proud = (u0: number, u1: number, ya: number, yb: number, c: Rgb, o: number, top = false): void => {
      rect(u0, u1, ya, yb, c, o)
      for (const [u, s] of [[u0, -1], [u1, 1]] as const) {
        const x = a.x + tx * u
        const z = a.z + tz * u
        quadAt(out, [[x, ya, z], [x + nx * o, ya, z + nz * o], [x + nx * o, yb, z + nz * o], [x, yb, z]], [tx * s, 0, tz * s], c, W)
      }
      if (top) {
        const P = (u: number, oo: number): [number, number, number] => [a.x + tx * u + nx * oo, yb, a.z + tz * u + nz * oo]
        quadAt(out, [P(u0, 0), P(u1, 0), P(u1, o), P(u0, o)], [0, 1, 0], c, W)
      }
    }
    switch (f.kind) {
      case 'blank':
        rect(0, L, y0, y1, f.wall)
        break
      case 'punched': {
        // the wall, then the windows set into it: a dark pane just behind a reveal, one per bay per floor
        rect(0, L, y0, y1, f.wall)
        const solid = f.solid ?? 0.45
        const ww = bw * (1 - solid)
        for (let fl = 0; fl < floors; fl++) {
          const ya = y0 + fl * fh + fh * 0.22
          const yb = y0 + fl * fh + fh * 0.84
          for (let k = 0; k < bays; k++) {
            const u0 = k * bw + (bw - ww) / 2
            rect(u0, u0 + ww, ya, yb, glass, 0.03)
            if (f.arched) rect(u0 + ww * 0.15, u0 + ww * 0.85, yb, yb + fh * 0.08, glass, 0.03)
          }
        }
        break
      }
      case 'bands': {
        const solid = f.solid ?? 0.45
        for (let fl = 0; fl < floors; fl++) {
          const ya = y0 + fl * fh
          const ys = ya + fh * solid
          proud(0, L, ya, ys, f.wall, 0.12, true)
          rect(0, L, ys, ya + fh, glass)
        }
        break
      }
      case 'fins': {
        const solid = f.solid ?? 0.35
        rect(0, L, y0, y1, glass)
        for (let k = 0; k <= bays; k++) {
          const u = k * bw
          const w = bw * solid / 2
          proud(Math.max(0, u - w), Math.min(L, u + w), y0, y1, f.wall, depth)
        }
        // the spandrels between the fins, a floor apart, so it is not a set of stripes
        for (let fl = 1; fl < floors; fl++) rect(0, L, y0 + fl * fh - 0.35, y0 + fl * fh + 0.35, f.wall, 0.02)
        break
      }
      case 'bays': {
        // the wall, then a bay window standing out of it in every bay: three faces if angled, five if rounded
        rect(0, L, y0, y1, f.wall)
        const d = f.bay?.depth ?? 0.8
        const faces = f.bay?.round ? 5 : 3
        for (let k = 0; k < bays; k++) {
          const u0 = k * bw + bw * 0.12
          const u1 = (k + 1) * bw - bw * 0.12
          const pts: [number, number][] = []
          for (let i = 0; i <= faces; i++) {
            const t = i / faces
            // a flat-sided or rounded plan, out to `d` in the middle
            pts.push([u0 + (u1 - u0) * t, d * (f.bay?.round ? Math.sin(Math.PI * t) : Math.min(1, Math.min(t, 1 - t) * (faces / 1.2)))])
          }
          for (let i = 0; i < faces; i++) {
            const [ua, oa] = pts[i]
            const [ub, ob] = pts[i + 1]
            const P = (u: number, o: number, y: number): [number, number, number] => [a.x + tx * u + nx * o, y, a.z + tz * u + nz * o]
            const mx = (oa + ob) / 2
            const nn: [number, number, number] = [nx * 0.85 + tx * (ob - oa) * 0.15, 0, nz * 0.85 + tz * (ob - oa) * 0.15]
            // the bay's glass, floor by floor, and the spandrel between
            for (let fl = 0; fl < floors; fl++) {
              const ya = y0 + fl * fh
              quadAt(out, [P(ua, oa, ya + fh * 0.18), P(ub, ob, ya + fh * 0.18), P(ub, ob, ya + fh * 0.86), P(ua, oa, ya + fh * 0.86)], nn, glass, GLASS)
              quadAt(out, [P(ua, oa, ya + fh * 0.86), P(ub, ob, ya + fh * 0.86), P(ub, ob, ya + fh * 1.18), P(ua, oa, ya + fh * 1.18)], nn, f.wall, W)
            }
            void mx
          }
          // the bay's cheeks and its cap
          const P = (u: number, o: number, y: number): [number, number, number] => [a.x + tx * u + nx * o, y, a.z + tz * u + nz * o]
          for (const [u, o, sgn] of [[u0, 0, -1], [u1, 0, 1]] as const) {
            quadAt(out, [P(u, o, y0), P(u, d * 0.0, y0), P(u, 0, y1), P(u, o, y1)], [tx * sgn, 0, tz * sgn], f.wall, W)
          }
          quadAt(out, [P(u0, 0, y1), P(u1, 0, y1), P(u1, d, y1), P(u0, d, y1)], [0, 1, 0], f.wall, W)
        }
        break
      }
      case 'curtain':
      case 'xbrace': {
        rect(0, L, y0, y1, glass)
        const m = f.wall
        for (let k = 1; k < bays; k++) rect(k * bw - 0.06, k * bw + 0.06, y0, y1, m, 0.04)
        for (let fl = 1; fl < floors; fl++) rect(0, L, y0 + fl * fh - 0.1, y0 + fl * fh + 0.1, m, 0.04)
        if (f.kind === 'xbrace') {
          // the braces: a diagonal strut each way across each bay-and-a-half, `brace` floors tall
          const span = (f.brace ?? 6) * fh
          const w = Math.max(bw * 1.5, span * 0.9)
          const nb = Math.max(1, Math.round(L / w))
          const bwid = L / nb
          for (let yb = y0; yb + span <= y1 + 0.01; yb += span) {
            for (let k = 0; k < nb; k++) {
              const u0 = k * bwid
              const u1 = u0 + bwid
              for (const [ua, ub] of [[u0, u1], [u1, u0]]) {
                const P = (u: number, y: number, o: number): [number, number, number] => [a.x + tx * u + nx * o, y, a.z + tz * u + nz * o]
                const t = 0.45
                const dy = span
                const du = ub - ua
                const l = Math.hypot(du, dy)
                const ox = (-dy / l) * t
                const oy = (du / l) * t
                quadAt(out, [P(ua + ox, yb + oy, 0.35), P(ub + ox, yb + dy + oy, 0.35), P(ub - ox, yb + dy - oy, 0.35), P(ua - ox, yb - oy, 0.35)], n, f.wall, W)
              }
            }
          }
        }
        break
      }
    }
  }
}

/** A cornice round the ring at y: a projecting slab `depth` out, `h` tall. */
function cornice(out: MeshBuilder, ring: P2[], y: number, depth: number, h: number, c: Rgb): void {
  const outer = insetRing(ring, -depth)
  faceBand(out, outer, y - h, y, { kind: 'blank', wall: c })
  // the soffit and the top, as rings between the two outlines
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const A = outer[i]
    const B = outer[(i + 1) % ring.length]
    quadAt(out, [[a.x, y, a.z], [b.x, y, b.z], [B.x, y, B.z], [A.x, y, A.z]], [0, 1, 0], c)
    quadAt(out, [[A.x, y - h, A.z], [B.x, y - h, B.z], [b.x, y - h, b.z], [a.x, y - h, a.z]], [0, -1, 0], c)
  }
}

/** A frustum from ring r0 at y0 to ring r1 at y1 (hip and mansard roofs, domes' courses, spires). */
function frustum(out: MeshBuilder, r0: P2[], y0: number, r1: P2[], y1: number, c: Rgb, tag = 0): void {
  for (let i = 0; i < r0.length; i++) {
    const j = (i + 1) % r0.length
    const a = r0[i]
    const b = r0[j]
    const e = { x: b.x - a.x, z: b.z - a.z }
    const L = Math.hypot(e.x, e.z) || 1
    const up = Math.max(0.2, (y1 - y0) / Math.max(0.5, Math.hypot(r1[i].x - a.x, r1[i].z - a.z)))
    const n: [number, number, number] = [e.z / L, 1 / up, -e.x / L]
    const nl = Math.hypot(n[0], n[1], n[2])
    quadAt(out, [[a.x, y0, a.z], [b.x, y0, b.z], [r1[j].x, y1, r1[j].z], [r1[i].x, y1, r1[i].z]], [n[0] / nl, n[1] / nl, n[2] / nl], c, tag)
  }
}

function crown(out: MeshBuilder, ring: P2[], H: number, c: Crown, roof: Rgb): void {
  const ctr = centroid(ring)
  // the crown's own material (copper on a dome, tile on a hip, stone on a parapet), or none
  const tag = 'material' in c && c.material ? surfaceTag(c.material) : 0
  switch (c.kind) {
    case 'flat':
      return
    case 'parapet': {
      const inner = insetRing(ring, 0.35)
      faceBand(out, ring, H, H + c.height, { kind: 'blank', wall: c.colour ?? roof, material: c.material })
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i]
        const b = ring[(i + 1) % ring.length]
        const A = inner[i]
        const B = inner[(i + 1) % ring.length]
        quadAt(out, [[a.x, H + c.height, a.z], [b.x, H + c.height, b.z], [B.x, H + c.height, B.z], [A.x, H + c.height, A.z]], [0, 1, 0], c.colour ?? roof, tag)
      }
      return
    }
    case 'hip':
    case 'mansard': {
      const top = insetRing(ring, c.inset)
      frustum(out, ring, H, top, H + c.height, c.colour, tag)
      capPolygon(out, top, H + c.height, c.colour, tag)
      // dormers set into the slope, evenly round the longest edges
      for (let d = 0; d < (c.dormers ?? 0); d++) {
        let best = { a: ring[0], b: ring[1], L: 0, i: 0 }
        for (let i = 0; i < ring.length; i++) {
          const a = ring[i]
          const b = ring[(i + 1) % ring.length]
          const L = Math.hypot(b.x - a.x, b.z - a.z)
          if (L > best.L) best = { a, b, L, i }
        }
        const t = (d + 0.5) / (c.dormers ?? 1)
        const px = best.a.x + (best.b.x - best.a.x) * t
        const pz = best.a.z + (best.b.z - best.a.z) * t
        const nx = (best.b.z - best.a.z) / best.L
        const nz = -(best.b.x - best.a.x) / best.L
        box(out, px + nx * 0.25, H + c.height * 0.45, pz + nz * 0.25, 0.7, 0.9, 0.7, c.colour, tag)
        box(out, px + nx * 0.4, H + c.height * 0.45, pz + nz * 0.4, 0.45, 0.6, 0.06, [0.2, 0.22, 0.24], GLASS)
      }
      return
    }
    case 'pyramid':
    case 'spire': {
      const base = c.inset ? insetRing(ring, c.inset) : ring
      if (c.inset) capPolygon(out, ring, H, roof, 0)
      frustum(out, base, H, base.map(() => ctr), H + c.height, c.colour, tag)
      return
    }
    case 'dome': {
      const r = c.radius ?? Math.min(...ring.map((p) => Math.hypot(p.x - ctr.x, p.z - ctr.z))) * 0.8
      const drum = c.drum ?? 0
      const seg = 16
      const circle = (rr: number): P2[] => Array.from({ length: seg }, (_, k) => ({ x: ctr.x + Math.cos((k / seg) * Math.PI * 2) * rr, z: ctr.z + Math.sin((k / seg) * Math.PI * 2) * rr }))
      if (drum > 0) faceBand(out, circle(r), H, H + drum, { kind: 'blank', wall: c.colour, material: c.material })
      const courses = 6
      for (let k = 0; k < courses; k++) {
        const a0 = (k / courses) * (Math.PI / 2)
        const a1 = ((k + 1) / courses) * (Math.PI / 2)
        frustum(out, circle(r * Math.cos(a0) + 0.001), H + drum + c.height * Math.sin(a0), circle(r * Math.cos(a1) + 0.001), H + drum + c.height * Math.sin(a1), c.colour, tag)
      }
      return
    }
    case 'lantern': {
      const r = insetRing(ring, c.inset)
      faceBand(out, r, H, H + c.height, c.face)
      capPolygon(out, r, H + c.height, roof, 0)
      if (c.cap) crown(out, r, H + c.height, c.cap, roof)
      return
    }
    case 'stepped': {
      let r = ring
      let y = H
      const each = c.height / c.steps
      for (let k = 0; k < c.steps; k++) {
        r = insetRing(r, c.inset)
        faceBand(out, r, y, y + each, c.face ?? { kind: 'blank', wall: roof })
        y += each
        capPolygon(out, r, y, roof, 0)
      }
      return
    }
    case 'sawtooth': {
      // a row of points along every edge, each a little pyramid of two faces
      const pitch = c.pitch ?? 2.4
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i]
        const b = ring[(i + 1) % ring.length]
        const L = Math.hypot(b.x - a.x, b.z - a.z)
        const n = Math.max(1, Math.round(L / pitch))
        for (let k = 0; k < n; k++) {
          const t0 = k / n
          const t1 = (k + 1) / n
          const tm = (t0 + t1) / 2
          const P = (t: number, y: number): [number, number, number] => [a.x + (b.x - a.x) * t, y, a.z + (b.z - a.z) * t]
          const nx = (b.z - a.z) / (L || 1)
          const nz = -(b.x - a.x) / (L || 1)
          quadAt(out, [P(t0, H), P(tm, H + c.height), P(tm, H + c.height), P(t0, H)], [nx, 0.4, nz], c.colour, tag)
          quadAt(out, [P(tm, H + c.height), P(t1, H), P(t1, H), P(tm, H + c.height)], [nx, 0.4, nz], c.colour, tag)
          quadAt(out, [P(t0, H), P(t1, H), P(tm, H + c.height), P(tm, H + c.height)], [0, 1, 0], c.colour, tag)
        }
      }
      return
    }
    case 'spires': {
      const n = c.n ?? 2
      const r = c.radius ?? 1.6
      // along the ring's long axis, spaced evenly
      let far = { a: ring[0], b: ring[0], d: 0 }
      for (const p of ring) for (const q of ring) { const d = Math.hypot(p.x - q.x, p.z - q.z); if (d > far.d) far = { a: p, b: q, d } }
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0.5 : 0.3 + (0.4 * i) / (n - 1)
        const px = far.a.x + (far.b.x - far.a.x) * t
        const pz = far.a.z + (far.b.z - far.a.z) * t
        const base: P2[] = Array.from({ length: 6 }, (_, k) => ({ x: px + Math.cos((k / 6) * Math.PI * 2) * r, z: pz + Math.sin((k / 6) * Math.PI * 2) * r }))
        frustum(out, base, H, base.map(() => ({ x: px, z: pz })), H + c.height, c.colour, tag)
      }
      return
    }
    case 'sliced': {
      // the roof cut on a diagonal: one edge stays, the opposite rises
      let far = { a: ring[0], b: ring[0], d: 0 }
      for (const p of ring) for (const q of ring) { const d = Math.hypot(p.x - q.x, p.z - q.z); if (d > far.d) far = { a: p, b: q, d } }
      const axis = { x: (far.b.x - far.a.x) / (far.d || 1), z: (far.b.z - far.a.z) / (far.d || 1) }
      const at = (p: P2): number => ((p.x - far.a.x) * axis.x + (p.z - far.a.z) * axis.z) / (far.d || 1)
      const top = ring.map((p) => ({ p, y: H + c.height * at(p) }))
      for (let i = 0; i < ring.length; i++) {
        const j = (i + 1) % ring.length
        const a = top[i]
        const b = top[j]
        quadAt(out, [[a.p.x, H, a.p.z], [b.p.x, H, b.p.z], [b.p.x, b.y, b.p.z], [a.p.x, a.y, a.p.z]],
          [(b.p.z - a.p.z), 0, -(b.p.x - a.p.x)], c.colour, tag)
      }
      for (let i = 1; i < top.length - 1; i++) {
        quadAt(out, [[top[0].p.x, top[0].y, top[0].p.z], [top[i].p.x, top[i].y, top[i].p.z], [top[i + 1].p.x, top[i + 1].y, top[i + 1].p.z], [top[0].p.x, top[0].y, top[0].p.z]],
          [0, 1, 0], c.colour, tag)
      }
      return
    }
    case 'mast':
      box(out, ctr.x, H + c.height / 2, ctr.z, (c.width ?? 1) / 2, c.height / 2, (c.width ?? 1) / 2, c.colour ?? [0.6, 0.6, 0.62], tag)
      return
  }
}

/** The footprint, anticlockwise in (x, z) so each edge's (dz, −dx) is its outward normal. */
/**
 * An outline fit to build from: points closer than `min` metres merged, and a point dropped when it barely bends
 * the line. An OSM footprint traced round a curve can be a hundred points, and a face per point is a hundred
 * bands of facade — the Opera House came out at 95 (reported by the market-west batch).
 */
export function simplifyRing(ring: P2[], min = 1.5, bend = 0.06): P2[] {
  const out: P2[] = []
  for (const p of ring) {
    const last = out[out.length - 1]
    if (last && Math.hypot(p.x - last.x, p.z - last.z) < min) continue
    out.push(p)
  }
  if (out.length > 3 && Math.hypot(out[0].x - out[out.length - 1].x, out[0].z - out[out.length - 1].z) < min) out.pop()
  if (out.length < 4) return out.length >= 3 ? out : ring
  const kept: P2[] = []
  for (let i = 0; i < out.length; i++) {
    const a = out[(i - 1 + out.length) % out.length]
    const b = out[i]
    const c = out[(i + 1) % out.length]
    const a1 = Math.atan2(b.z - a.z, b.x - a.x)
    const a2 = Math.atan2(c.z - b.z, c.x - b.x)
    let d = Math.abs(a2 - a1)
    if (d > Math.PI) d = Math.PI * 2 - d
    if (d > bend) kept.push(b)
  }
  return kept.length >= 3 ? kept : out
}

export function towerRing(fit: Fit): P2[] {
  const given = fit.ring && fit.ring.length >= 3
    ? simplifyRing(fit.ring)
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < given.length; i++) { const a = given[i]; const b = given[(i + 1) % given.length]; area += a.x * b.z - b.x * a.z }
  return area >= 0 ? given : [...given].reverse()
}

export function tower(out: MeshBuilder, fit: Fit, spec: TowerSpec): void {
  const ring0 = towerRing(fit)
  // the building's own height from the manifest (OSM's) when it is plausible, the spec's when not
  const H = fit.height > 0.6 * spec.height && fit.height < 1.6 * spec.height ? fit.height : spec.height
  const roof = spec.roof ?? [0.42, 0.42, 0.44]
  let y = 0
  let ring = ring0
  if (spec.base) {
    faceBand(out, ring, 0, spec.base.height, spec.base.face)
    if (spec.base.canopy) cornice(out, ring, spec.base.height - 0.4, spec.base.canopy.depth, 0.3, spec.base.canopy.colour)
    y = spec.base.height
  }
  for (const t of spec.tiers) {
    const top = t.to <= 1.5 ? t.to * H : t.to
    if (t.inset) {
      const next = insetRing(ring, t.inset)
      // the ledge the setback leaves: the old outline's roof, where the new one does not cover it (drawn whole: the
      // new tier's walls stand on it)
      capPolygon(out, ring, y, roof, 0)
      ring = next
    }
    if (top > y) faceBand(out, ring, y, top, t.face)
    if (t.cornice) cornice(out, ring, top, t.cornice.depth, t.cornice.height ?? 0.8, t.cornice.colour ?? t.face.wall)
    y = Math.max(y, top)
  }
  capPolygon(out, ring, y, roof, 0)
  for (let k = 0; k < (spec.penthouse ?? 0); k++) {
    const c = centroid(ring)
    const s = Math.sqrt(Math.abs(ring.reduce((acc, p, i) => { const q = ring[(i + 1) % ring.length]; return acc + p.x * q.z - q.x * p.z }, 0)) / 2) * 0.22
    box(out, c.x + (k - (spec.penthouse! - 1) / 2) * s * 1.3, y + 2, c.z, s / 2, 2, s / 2, [0.55, 0.55, 0.56], 0)
  }
  if (spec.crown) crown(out, ring, y, spec.crown, roof)
}
