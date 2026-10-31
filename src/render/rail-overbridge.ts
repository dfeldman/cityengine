/**
 * A STREET OVER A STATION'S THROAT (owner, 2026-10-31, the Place de l'Europe, 48.8788, 2.3234: "a crater under the roundabout"; PARIS_BUGS.md's first after the rail audit). The Pont de l'Europe, Caillebotte's,
 * is a star of steel beams over the tracks into Saint-Lazare: OSM has it as one `man_made=bridge bridge:structure=beam` outline, and the tracks under it as `tunnel=yes`. So the bake drew no track under it, a stone
 * tunnel mouth stood at every end, the outline's star failed `straightOutline` and drew nothing, and the lidar's ground fell from the street to the tracks' bed in one 4 m cell: the crater. It is not one bridge's
 * trouble: OSM outlines 69 bridges in the box with main-line tracks under them, the Est's under the Rue La Fayette and the Nord's under the Boulevard de la Chapelle among them.
 *
 * So every outline a street stands on with tracks below it is drawn from the outline itself, whatever its shape, here and not as a Seine bridge's arches:
 *
 *        railing  ┬──┬──┬──┬──┬──┬     where the ground beyond its edge falls away, and only there
 *   the deck ─────┴──┴──┴──┴──┴──┴     a slab over whatever of the outline's ground is lower than the street: the crater goes under it
 *    plate girder ████████████████     a riveted plate, flanges and stiffeners
 *                 ▓▓▓▌▐▓▓▓▌▐▓▓▓▌▐▓     where the ground behind it is solid: dark, on steel posts, where a track goes in, and a stone abutment where none does
 *                                      where the ground behind it is cut too: nothing, and the tracks run on under it
 *
 * The ways on it keep drawing their own running surfaces (bridges.ts `deck`, `structured`). Paris only: `styles` (game.ts) is empty elsewhere.
 */
import type { MeshBuilder } from './buildings.ts'
import { unpackPoints, type PackedEdge, type PackedRail } from '../city/package.ts'
import type { Terrain } from '../city/terrain.ts'

type Rgb = [number, number, number]
type P = { x: number; z: number }
type V3 = [number, number, number]
const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

const PLATE: Rgb = [0.27, 0.31, 0.3]
const FLANGE: Rgb = [0.21, 0.24, 0.23]
const RAILING: Rgb = [0.17, 0.2, 0.19]
const DARK: Rgb = [0.05, 0.05, 0.055]
// (as with the paving, the bridges' material brightens what it is given)
const ABUTMENT: Rgb = [0.41, 0.39, 0.35]
// (the deck's material is brighter than the painted ground's: the place's own pavement, as it comes out)
const PAVING: Rgb = [0.312, 0.312, 0.29]
const SOFFIT: Rgb = [0.2, 0.2, 0.2]

/** how deep the plate is under the deck */
const GIRDER = 1.25
/** the ground beyond an edge this far under the deck: that edge is a drop, with a railing and a girder */
const DROP = 2
/** …looked for this far out: past the 4 m ground's slope at the foot of the street's corridor */
const LOOK_OUT = 3
/** …and this far in, for whether it stands over solid ground or over the cut */
const LOOK_IN = 4.5
/** the ground this far under the deck goes under the slab */
const FILL = 0.15
/** how near a drawn track a stretch of edge counts as where the track goes in */
const TRACK_NEAR = 9
/** the steel posts along a face, and how far off a track's centre one may stand */
const POST_EVERY = 9
const POST_CLEAR = 1.7
/** a track this far under the street is under the bridge, not on it */
const CLEAR = 3
/** an outline with a track standing this near the street's level on it is a railway's bridge */
const ON_IT = 1.2

const inRing = (r: P[], x: number, z: number): boolean => {
  let o = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    if ((r[i].z > z) !== (r[j].z > z) && x < ((r[j].x - r[i].x) * (z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) o = !o
  }
  return o
}

const nearRing = (r: P[], x: number, z: number, pad: number): boolean => {
  if (inRing(r, x, z)) return true
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const a = r[j], dx = r[i].x - a.x, dz = r[i].z - a.z
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)))
    if (Math.hypot(a.x + dx * t - x, a.z + dz * t - z) < pad) return true
  }
  return false
}

export interface DeckPost { x: number; z: number; y: number }

/** Along a rail every 4 m, with its own height if it has one. */
function alongRail(r: Pick<PackedRail, 'points' | 'heights'>, visit: (x: number, z: number, h: number | undefined) => void): void {
  const p = r.points
  for (let i = 2; i < p.length; i += 2) {
    const n = Math.ceil(Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]) / 4) || 1
    for (let k = i === 2 ? 0 : 1; k <= n; k++) {
      const h0 = r.heights?.[i / 2 - 1], h1 = r.heights?.[i / 2]
      visit(p[i - 2] + ((p[i] - p[i - 2]) * k) / n, p[i - 1] + ((p[i + 1] - p[i - 1]) * k) / n, h0 === undefined || h1 === undefined ? undefined : h0 + ((h1 - h0) * k) / n)
    }
  }
}

/** The heights of the streets on an outline: what its deck's level is read from. Pavements OSM maps as ways of their own lie on the ground under it, and a road under the bridge is under it. */
export function deckPosts(ring: P[], edges: Pick<PackedEdge, 'points' | 'heights' | 'foot' | 'tunnel'>[]): DeckPost[] {
  const out: DeckPost[] = []
  for (const e of edges) {
    if (e.foot || e.tunnel || !e.heights) continue
    const p = unpackPoints(e.points)
    for (let i = 1; i < p.length; i++) {
      // (along it: OSM's straight street over a bridge has its two points off either end)
      const n = Math.ceil(Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z) / 4) || 1
      for (let k = i === 1 ? 0 : 1; k <= n; k++) {
        const x = p[i - 1].x + ((p[i].x - p[i - 1].x) * k) / n, z = p[i - 1].z + ((p[i].z - p[i - 1].z) * k) / n
        if (nearRing(ring, x, z, 2)) out.push({ x, z, y: e.heights[i - 1] + ((e.heights[i] - e.heights[i - 1]) * k) / n })
      }
    }
  }
  if (out.length < 3) return out
  // (a road under the deck is the odd one out: the middle of them is the deck, and what lies well below that is not on it)
  const ys = out.map((q) => q.y).sort((a, b) => a - b), mid = ys[ys.length >> 1]
  return out.filter((q) => q.y > mid - 2.5)
}

/** The deck's level at a point: nearest posts count most, so the arms of a star keep each its own street's slope. */
export function deckLevel(posts: DeckPost[], x: number, z: number): number {
  let w = 0, v = 0
  for (const q of posts) {
    const d = Math.max(0.5, Math.hypot(q.x - x, q.z - z)), k = 1 / (d * d * d)
    w += k
    v += k * q.y
  }
  return v / (w || 1)
}

/**
 * Does this outline carry a street over a railway? A street stands on it, a track at the ground runs in under it (or stops at its edge, going under), and no track rides on it at the street's level: a railway's own
 * bridge over a street has an outline too. `ground` is what a track without heights of its own lies on.
 */
export function overRailway(ring: P[], posts: DeckPost[], rails: Pick<PackedRail, 'points' | 'heights' | 'kind'>[], ground: (x: number, z: number) => number): boolean {
  if (posts.length < 2) return false
  let under = 0
  for (const r of rails) {
    if (r.kind !== 'rail') continue
    let hit = false
    alongRail(r, (x, z, h) => {
      if (hit || !nearRing(ring, x, z, 3)) return
      const y = h ?? ground(x, z)
      const deck = deckLevel(posts, x, z)
      if (h !== undefined && y > deck - ON_IT) hit = true
      else if (deck - y >= CLEAR) under++
    })
    if (hit) return false
  }
  return under > 0
}

/** Track segments (drawn at the ground, or on a deck well below this one) near a point: within `r`? */
function trackNear(segs: { ax: number; az: number; bx: number; bz: number }[], x: number, z: number, r: number): boolean {
  for (const s of segs) {
    const dx = s.bx - s.ax, dz = s.bz - s.az, t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / (dx * dx + dz * dz || 1)))
    if (Math.hypot(s.ax + dx * t - x, s.az + dz * t - z) < r) return true
  }
  return false
}

const face = (out: MeshBuilder, a: V3, b: V3, y0a: number, y0b: number, y1a: number, y1b: number, n: V3, c: Rgb): void => {
  out.quad([[a[0], y0a, a[2]], [b[0], y0b, b[2]], [b[0], y1b, b[2]], [a[0], y1a, a[2]]], n, UV, c, FIXED)
}

const post = (out: MeshBuilder, x: number, z: number, y0: number, y1: number, ux: number, uz: number, a: number, c: Rgb): void => {
  const vx = -uz, vz = ux
  const k = (sa: number, sc: number, y: number): V3 => [x + ux * a * sa + vx * a * sc, y, z + uz * a * sa + vz * a * sc]
  const faces: [V3[], V3][] = [
    [[k(-1, 1, y0), k(1, 1, y0), k(1, 1, y1), k(-1, 1, y1)], [vx, 0, vz]],
    [[k(1, -1, y0), k(-1, -1, y0), k(-1, -1, y1), k(1, -1, y1)], [-vx, 0, -vz]],
    [[k(1, 1, y0), k(1, -1, y0), k(1, -1, y1), k(1, 1, y1)], [ux, 0, uz]],
    [[k(-1, -1, y0), k(-1, 1, y0), k(-1, 1, y1), k(-1, -1, y1)], [-ux, 0, -uz]],
  ]
  for (const [q, n] of faces) out.quad(q, n, UV, c, FIXED)
}

/** The slab: the outline in bands, each cut where its edges cross it, laid only where the ground under it is lower than the street. */
export function deckSlab(out: MeshBuilder, ring: P[], level: (x: number, z: number) => number, ground: (x: number, z: number) => number, step = 1, painted: (x: number, z: number) => boolean = () => false): void {
  const zs = [...new Set(ring.map((q) => q.z))].sort((a, b) => a - b)
  const cuts: number[] = []
  for (let i = 1; i < zs.length; i++) {
    const n = Math.max(1, Math.ceil((zs[i] - zs[i - 1]) / step))
    for (let k = 0; k < n; k++) cuts.push(zs[i - 1] + ((zs[i] - zs[i - 1]) * k) / n)
  }
  cuts.push(zs[zs.length - 1])
  for (let b = 1; b < cuts.length; b++) {
    const z0 = cuts[b - 1], z1 = cuts[b], zm = (z0 + z1) / 2
    if (z1 - z0 < 1e-3) continue
    const crossing: { x0: number; x1: number; xm: number }[] = []
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const p = ring[j], q = ring[i]
      if ((p.z > zm) === (q.z > zm)) continue
      const at = (z: number): number => p.x + ((q.x - p.x) * (z - p.z)) / (q.z - p.z)
      crossing.push({ x0: at(z0), x1: at(z1), xm: at(zm) })
    }
    crossing.sort((u, v) => u.xm - v.xm)
    for (let c = 0; c + 1 < crossing.length; c += 2) {
      const l = crossing[c], r = crossing[c + 1], w = r.xm - l.xm
      if (w <= 0) continue
      // the runs along the band that want a slab
      const n = Math.max(1, Math.round(w / step))
      let start = -1
      const run = (u0: number, u1: number): void => {
        const x = (u: number, z: 0 | 1): number => { const a = z ? l.x1 : l.x0, e = z ? r.x1 : r.x0; return a + (e - a) * u }
        const yAt = (px: number, pz: number): number => level(px, pz) - 0.1
        const c0: V3 = [x(u0, 0), yAt(x(u0, 0), z0), z0], c1: V3 = [x(u1, 0), yAt(x(u1, 0), z0), z0]
        const c2: V3 = [x(u1, 1), yAt(x(u1, 1), z1), z1], c3: V3 = [x(u0, 1), yAt(x(u0, 1), z1), z1]
        out.quad([c0, c1, c2, c3], [0, 1, 0], UV, PAVING, FIXED)
        const dn = (v: V3): V3 => [v[0], v[1] - GIRDER + 0.1, v[2]]
        out.quad([dn(c0), dn(c1), dn(c2), dn(c3)], [0, -1, 0], UV, SOFFIT, FIXED)
      }
      for (let k = 0; k <= n; k++) {
        const u = (k + 0.5) / n
        const px = l.xm + w * u
        const want = k < n && ground(px, zm) < level(px, zm) - FILL && !painted(px, zm)
        if (want && start < 0) start = k / n
        if (!want && start >= 0) { run(start, k / n); start = -1 }
      }
    }
  }
}

/** The outline's edges: a railing, a girder and what stands under it, wherever the ground beyond falls away. */
export function deckFaces(out: MeshBuilder, ring: P[], level: (x: number, z: number) => number, ground: (x: number, z: number) => number, rails: Pick<PackedRail, 'points' | 'heights' | 'kind'>[]): void {
  let area = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) area += ring[j].x * ring[i].z - ring[i].x * ring[j].z
  const orient = area > 0 ? 1 : -1
  const segs: { ax: number; az: number; bx: number; bz: number }[] = []
  for (const r of rails) {
    if (r.kind !== 'rail' && r.kind !== 'tram') continue
    const p = r.points
    for (let i = 2; i < p.length; i += 2) segs.push({ ax: p[i - 2], az: p[i - 1], bx: p[i], bz: p[i + 1] })
  }
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[j], b = ring[i]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.5) continue
    const ux = (b.x - a.x) / L, uz = (b.z - a.z) / L
    // outward: right of a→b on an anticlockwise ring
    const nx = (uz * orient), nz = (-ux * orient)
    const n3: V3 = [nx, 0, nz]
    const count = Math.max(1, Math.round(L / 2))
    const at = (k: number): P => ({ x: a.x + ((b.x - a.x) * k) / count, z: a.z + ((b.z - a.z) * k) / count })
    let lastPost = -Infinity
    for (let k = 0; k < count; k++) {
      const p = at(k), q = at(k + 1), m = at(k + 0.5)
      const yM = level(m.x, m.z)
      const below = ground(m.x + nx * LOOK_OUT, m.z + nz * LOOK_OUT)
      if (yM - below < DROP) continue
      const yp = level(p.x, p.z), yq = level(q.x, q.z)
      const off = 0.12
      const pa: V3 = [p.x + nx * off, 0, p.z + nz * off], qa: V3 = [q.x + nx * off, 0, q.z + nz * off]
      // the plate, its two flanges and a stiffener
      face(out, pa, qa, yp - GIRDER, yq - GIRDER, yp - 0.05, yq - 0.05, n3, PLATE)
      const fl = 0.28
      const pf: V3 = [p.x + nx * fl, 0, p.z + nz * fl], qf: V3 = [q.x + nx * fl, 0, q.z + nz * fl]
      face(out, pf, qf, yp - 0.2, yq - 0.2, yp - 0.05, yq - 0.05, n3, FLANGE)
      face(out, pf, qf, yp - GIRDER, yq - GIRDER, yp - GIRDER + 0.15, yq - GIRDER + 0.15, n3, FLANGE)
      out.quad([[pa[0], yp - 0.05, pa[2]], [qa[0], yq - 0.05, qa[2]], [qf[0], yq - 0.05, qf[2]], [pf[0], yp - 0.05, pf[2]]], [0, 1, 0], UV, FLANGE, FIXED)
      post(out, m.x + nx * 0.2, m.z + nz * 0.2, yM - GIRDER + 0.15, yM - 0.2, ux, uz, 0.05, FLANGE)
      // the railing
      const ry = 1.15
      post(out, p.x, p.z, yp - 0.05, yp + ry, ux, uz, 0.045, RAILING)
      face(out, [p.x + nx * 0.05, 0, p.z + nz * 0.05], [q.x + nx * 0.05, 0, q.z + nz * 0.05], yp + ry - 0.06, yq + ry - 0.06, yp + ry, yq + ry, n3, RAILING)
      face(out, [p.x - nx * 0.05, 0, p.z - nz * 0.05], [q.x - nx * 0.05, 0, q.z - nz * 0.05], yp + ry - 0.06, yq + ry - 0.06, yp + ry, yq + ry, [-nx, 0, -nz], RAILING)
      out.quad([[p.x + nx * 0.05, yp + ry, p.z + nz * 0.05], [q.x + nx * 0.05, yq + ry, q.z + nz * 0.05], [q.x - nx * 0.05, yq + ry, q.z - nz * 0.05], [p.x - nx * 0.05, yp + ry, p.z - nz * 0.05]], [0, 1, 0], UV, RAILING, FIXED)
      face(out, [p.x + nx * 0.03, 0, p.z + nz * 0.03], [q.x + nx * 0.03, 0, q.z + nz * 0.03], yp + 0.35, yq + 0.35, yp + 0.42, yq + 0.42, n3, RAILING)
      face(out, [p.x - nx * 0.03, 0, p.z - nz * 0.03], [q.x - nx * 0.03, 0, q.z - nz * 0.03], yp + 0.35, yq + 0.35, yp + 0.42, yq + 0.42, [-nx, 0, -nz], RAILING)
      // under the girder
      const footP = Math.min(ground(p.x + nx * LOOK_OUT, p.z + nz * LOOK_OUT), yp - GIRDER) - 1.2
      const footQ = Math.min(ground(q.x + nx * LOOK_OUT, q.z + nz * LOOK_OUT), yq - GIRDER) - 1.2
      // (a track that runs on under the deck can be seen under it, and nothing else stands there; where every track stops at the edge the ground behind is the street's, slope and all: a dark wall set back from the plate is the way under)
      const through = trackNear(segs, m.x - nx * LOOK_IN * 3, m.z - nz * LOOK_IN * 3, 3.5)
      const solid = !through && ground(m.x - nx * LOOK_IN * 2, m.z - nz * LOOK_IN * 2) > yM - DROP - 2
      const footX = m.x + nx * LOOK_OUT, footZ = m.z + nz * LOOK_OUT
      const going = trackNear(segs, footX, footZ, TRACK_NEAR) || trackNear(segs, m.x, m.z, TRACK_NEAR)
      const dist = ((k + 0.5) * L) / count
      if (solid) {
        const back = -0.15
        face(out, [p.x + nx * back, 0, p.z + nz * back], [q.x + nx * back, 0, q.z + nz * back], footP, footQ, yp - GIRDER + 0.05, yq - GIRDER + 0.05, n3, going ? DARK : ABUTMENT)
        out.quad([[p.x + nx * back, yp - GIRDER, p.z + nz * back], [q.x + nx * back, yq - GIRDER, q.z + nz * back], [qf[0], yq - GIRDER, qf[2]], [pf[0], yp - GIRDER, pf[2]]], [0, -1, 0], UV, SOFFIT, FIXED)
      }
      if ((solid ? going : true) && dist - lastPost >= POST_EVERY) {
        const cx = m.x + nx * 0.5, cz = m.z + nz * 0.5
        if (!trackNear(segs, cx, cz, POST_CLEAR)) {
          post(out, cx, cz, Math.min(ground(cx, cz), yM - GIRDER) - 0.5, yM - GIRDER, ux, uz, 0.22, FLANGE)
          lastPost = dist
        }
      }
    }
  }
}

/** One outline, whole. `edges` and `rails` are what the tile round its centre can see. Returns false when it does not stand over a railway, and the caller draws it as it would. */
export function railOverbridge(out: MeshBuilder, ring: P[], edges: PackedEdge[], rails: PackedRail[], terrain: Terrain): boolean {
  const ground = (x: number, z: number): number => terrain.heightAt(x, z)
  const posts = deckPosts(ring, edges)
  if (!overRailway(ring, posts, rails, ground)) return false
  const level = (x: number, z: number): number => deckLevel(posts, x, z)
  // (a street on the ground is painted, and this is drawn over whatever is painted: it stops at the pavement's edge)
  const painted: { a: P; b: P; half: number }[] = []
  for (const e of edges) {
    if (e.foot || e.tunnel || e.bridge || e.ramp) continue
    const p = unpackPoints(e.points)
    const half = e.width / 2 + Math.max(0.6, e.walk)
    for (let i = 1; i < p.length; i++) if (nearRing(ring, p[i - 1].x, p[i - 1].z, half + 8) || nearRing(ring, p[i].x, p[i].z, half + 8)) painted.push({ a: p[i - 1], b: p[i], half })
  }
  const onStreet = (x: number, z: number): boolean => painted.some(({ a, b, half }) => {
    const dx = b.x - a.x, dz = b.z - a.z, t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)))
    return Math.hypot(a.x + dx * t - x, a.z + dz * t - z) < half
  })
  deckSlab(out, ring, level, ground, 1, onStreet)
  deckFaces(out, ring, level, ground, rails)
  return true
}

/**
 * Which of a list of tunnel mouths stand at a street's bridge, not at a tunnel (tools/paris-portals.ts): within `pad` of an outline with a street on it and no track on it at the street's level. OSM calls the way under
 * it a tunnel, and a stone arch was drawn at each of them: nine in the Place de l'Europe's two faces, one on the tracks under the Rue La Fayette. `deckFaces` draws the way in.
 */
export function mouthsAtDecks<M extends P>(mouths: M[], outlines: { ring: number[] }[], edges: Pick<PackedEdge, 'points' | 'heights' | 'foot' | 'tunnel'>[], rails: Pick<PackedRail, 'points' | 'heights' | 'kind'>[], pad = 14): Set<M> {
  const out = new Set<M>()
  const CELL = 200
  const bucket = <T>(m: Map<string, T[]>, x: number, z: number, v: T): void => { const k = `${Math.floor(x / CELL)},${Math.floor(z / CELL)}`; (m.get(k) ?? m.set(k, []).get(k)!).push(v) }
  const roads = new Map<string, typeof edges>(), decks = new Map<string, typeof rails>()
  // (by every cell the line passes: OSM's straight street has its two points off either end of a bridge)
  const file = <T>(m: Map<string, T[]>, p: number[], v: T): void => {
    const seen = new Set<string>()
    for (let i = 2; i < p.length; i += 2) {
      const n = Math.ceil(Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]) / (CELL / 2)) || 1
      for (let k = 0; k <= n; k++) {
        const x = p[i - 2] + ((p[i] - p[i - 2]) * k) / n, z = p[i - 1] + ((p[i + 1] - p[i - 1]) * k) / n, c = `${Math.floor(x / CELL)},${Math.floor(z / CELL)}`
        if (!seen.has(c)) { seen.add(c); bucket(m, x, z, v) }
      }
    }
  }
  for (const e of edges) if (!e.foot && !e.tunnel && e.heights) file(roads, e.points, e)
  for (const r of rails) if (r.heights) file(decks, r.points, r)
  for (const o of outlines) {
    const ring = unpackPoints(o.ring)
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const q of ring) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
    const near = mouths.filter((m) => m.x >= x0 - pad && m.x <= x1 + pad && m.z >= z0 - pad && m.z <= z1 + pad && nearRing(ring, m.x, m.z, pad))
    if (!near.length) continue
    const gather = <T>(m: Map<string, T[]>): Set<T> => { const s = new Set<T>(); for (let a = Math.floor(x0 / CELL); a <= Math.floor(x1 / CELL); a++) for (let b = Math.floor(z0 / CELL); b <= Math.floor(z1 / CELL); b++) for (const v of m.get(`${a},${b}`) ?? []) s.add(v); return s }
    const posts = deckPosts(ring, [...gather(roads)])
    if (posts.length < 2) continue
    let railway = false
    for (const r of gather(decks)) alongRail(r, (x, z, h) => { if (!railway && h !== undefined && nearRing(ring, x, z, 3) && h > deckLevel(posts, x, z) - ON_IT) railway = true })
    if (railway) continue
    // (a main line's, as `overRailway` asks, or no face would be drawn for the mouth that goes: the T2's portals at Suresnes are tunnels under their road)
    let mainLine = false
    for (const r of rails) {
      if (r.kind !== 'rail' || r.heights) continue
      let a = Infinity, b = -Infinity, c = Infinity, d = -Infinity
      for (let i = 0; i < r.points.length; i += 2) { a = Math.min(a, r.points[i]); b = Math.max(b, r.points[i]); c = Math.min(c, r.points[i + 1]); d = Math.max(d, r.points[i + 1]) }
      if (b < x0 - pad || a > x1 + pad || d < z0 - pad || c > z1 + pad) continue
      alongRail(r, (x, z) => { if (!mainLine && nearRing(ring, x, z, 3)) mainLine = true })
      if (mainLine) break
    }
    if (!mainLine) continue
    for (const m of near) out.add(m)
  }
  return out
}

export interface MouthLine { x: number; z: number; ox: number; oz: number; half: number }

/** a mouth this wide is a bundle's, and two of them this far apart are the two sides of one street's deck */
const DECK_WIDE = 8
const DECK_LONG = 130
const DECK_PAST = 6

/**
 * The bridges nobody outlined. At the Boulevard des Batignolles (48.8822, 2.3208) OSM has the tracks in a tunnel from one mouth to the other, 40 m apart, and no `man_made=bridge`: in the aerial a boulevard over an open
 * trench. Two wide mouths that face each other across a street, this near, are the sides of its deck: returns each such deck's ring and the two mouths, which go. A longer tunnel between them is a tunnel, and keeps its mouths.
 */
export function decksBetweenMouths<M extends MouthLine>(mouths: M[], streets: Pick<PackedEdge, 'points' | 'foot' | 'tunnel' | 'heights'>[]): { ring: number[]; a: M; b: M }[] {
  const wide = mouths.filter((m) => m.half >= DECK_WIDE)
  const used = new Set<M>()
  const out: { ring: number[]; a: M; b: M }[] = []
  // pairs nearest first: a throat has several
  const pairs: { a: M; b: M; d: number }[] = []
  for (let i = 0; i < wide.length; i++) for (let j = i + 1; j < wide.length; j++) {
    const a = wide[i], b = wide[j]
    if (a.ox * b.ox + a.oz * b.oz > -0.7) continue
    const along = -((b.x - a.x) * a.ox + (b.z - a.z) * a.oz)
    if (along <= 4 || along > DECK_LONG) continue
    const across = Math.abs((b.x - a.x) * a.oz - (b.z - a.z) * a.ox)
    if (across > a.half + b.half) continue
    pairs.push({ a, b, d: along })
  }
  pairs.sort((p, q) => p.d - q.d)
  for (const { a, b } of pairs) {
    if (used.has(a) || used.has(b)) continue
    const vx = a.oz, vz = -a.ox
    // (the mouth's width is its tracks': the bed's banks and the street's own ends of the deck are past them; and a metre out, in front of the tracks' ends)
    const across = (m: M, s: number): P => ({ x: m.x + vx * s * (m.half + DECK_PAST) + m.ox, z: m.z + vz * s * (m.half + DECK_PAST) + m.oz })
    const ring = [across(a, 1), across(a, -1), across(b, -1), across(b, 1)]
    let streetOn = false
    for (const e of streets) {
      if (e.foot || e.tunnel || !e.heights) continue
      const p = unpackPoints(e.points)
      for (let i = 0; i < p.length && !streetOn; i++) if (inRing(ring, p[i].x, p[i].z)) streetOn = true
      for (let i = 1; i < p.length && !streetOn; i++) {
        const n = Math.ceil(Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z) / 5)
        for (let k = 1; k < n && !streetOn; k++) if (inRing(ring, p[i - 1].x + ((p[i].x - p[i - 1].x) * k) / n, p[i - 1].z + ((p[i].z - p[i - 1].z) * k) / n)) streetOn = true
      }
      if (streetOn) break
    }
    if (!streetOn) continue
    used.add(a)
    used.add(b)
    out.push({ ring: ring.flatMap((q) => [Math.round(q.x * 10) / 10, Math.round(q.z * 10) / 10]), a, b })
  }
  return out
}

/** how far under a deck's street a pavement may lie and be taken for that street's: the walks along the tracks below it, going under, are further down */
const FOOT_ON_DECK = 3.5

/**
 * The pavements on a street's bridge, at its level (the bake, Paris). OSM maps them as foot ways of their own, and they lay on the ground: 2 m under the Place de l'Europe's deck along its faces (245297: 10.8 m beside a street
 * at 13), the rider and the crowd under the slab. A foot way's points on such an outline take the deck's level; each of a node's ways does the same at that node. Returns how many ways moved.
 */
export function levelFootOnDecks(outlines: { ring: number[] }[], edges: Pick<PackedEdge, 'points' | 'heights' | 'foot' | 'tunnel'>[], rails: Pick<PackedRail, 'points' | 'heights' | 'kind'>[], ground: (x: number, z: number) => number): number {
  let moved = 0
  const foot = edges.filter((e) => e.foot && !e.tunnel && e.heights)
  for (const o of outlines) {
    const ring = unpackPoints(o.ring)
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const q of ring) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
    const nearBox = (p: number[]): boolean => {
      let a = Infinity, b = -Infinity, c = Infinity, d = -Infinity
      for (let i = 0; i < p.length; i += 2) { a = Math.min(a, p[i]); b = Math.max(b, p[i]); c = Math.min(c, p[i + 1]); d = Math.max(d, p[i + 1]) }
      return b >= x0 - 3 && a <= x1 + 3 && d >= z0 - 3 && c <= z1 + 3
    }
    const posts = deckPosts(ring, edges.filter((e) => !e.foot && nearBox(e.points)))
    const near = rails.filter((r) => nearBox(r.points))
    if (!near.length || !overRailway(ring, posts, near, ground)) continue
    for (const e of foot) {
      if (!nearBox(e.points)) continue
      const p = unpackPoints(e.points)
      let any = false
      for (let i = 0; i < p.length; i++) {
        if (!nearRing(ring, p[i].x, p[i].z, 1)) continue
        const y = deckLevel(posts, p[i].x, p[i].z)
        if (e.heights![i] < y - 0.1 && e.heights![i] >= y - FOOT_ON_DECK) { e.heights![i] = Math.round(y * 100) / 100; any = true }
      }
      if (any) moved++
    }
  }
  return moved
}
