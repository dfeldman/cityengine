/**
 * PARC ZOOLOGIQUE DE PARIS — the GRANDE SERRE (1934, renewed 2014): the tropical glasshouse, a long lozenge of glass
 * Refs: Commons "Greenhouse @ Parc Zoologique de Paris" (docs/landmarks/refs/vincennes/zoo/): a full elliptical glass
 * dome from near the ground, a diamond steel lattice, a white ring band low on the skin.
 * on a slim steel lattice, its roof swelling in a flattened vault from a low plinth to a crown ~16 m up. Plan: OSM
 * relation 522886224 (building=conservatory, glass, wall=no); the vault is lofted from fit.ring toward its centre.
 * Buildings only (owner): no animals. The Grande volière (below) is a rock rampart under a net on leaning masts;
 * the Grand Rocher stays in ../batch4/bois.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'
import { quadN } from '../venues/bowl.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { registerRingEN, type P2 } from '../museums/enframe.ts'
import { rockField } from './grand-rocher.ts'

const GLASS_TAG = surfaceTag('glass')

const GLASS: Rgb = [0.42, 0.52, 0.56], GLASS_IN: Rgb = [0.22, 0.27, 0.28], RIB: Rgb = hex('#4a524f'), PLINTH: Rgb = hex('#8c867c'), BAND: Rgb = hex("#e8e8e4")

// plinth height, vault crown height, loft rings, profile exponent (lower = fuller shoulders), crown fraction, rib width
const GS_PLINTH = 0.4, GS_CROWN = 17, GS_RINGS = 10, GS_POW = 2.6, GS_TOP_F = 0.05, GS_RIB = 0.14, GS_STEP = 3.5, GS_BAND_K = 1, GS_BAND = 0.6

type P = { x: number; z: number }
type V = [number, number, number]

export function grandeSerre(out: MeshBuilder, fit: Fit): void {
  const given: P[] = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  // the outline walked at an even GS_STEP, so the lattice's diamonds are all of a size along the long sides
  const ring: P[] = []
  for (let i = 0; i < given.length; i++) {
    const a = given[i], b = given[(i + 1) % given.length], m = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.z - a.z) / GS_STEP))
    for (let j = 0; j < m; j++) ring.push({ x: a.x + (b.x - a.x) * j / m, z: a.z + (b.z - a.z) * j / m })
  }
  const n = ring.length, c = { x: ring.reduce((s, p) => s + p.x, 0) / n, z: ring.reduce((s, p) => s + p.z, 0) / n }
  // ring k: shrink factor s (1 → GS_TOP_F), height from a superellipse-ish profile
  const lv = Array.from({ length: GS_RINGS + 1 }, (_, k) => {
    const t = k / GS_RINGS, s = 1 - t * (1 - GS_TOP_F)
    return { s, y: GS_PLINTH + (GS_CROWN - GS_PLINTH) * Math.pow(1 - Math.pow(s, GS_POW), 1 / GS_POW) }
  })
  const at = (p: P, k: number): V => [c.x + (p.x - c.x) * lv[k].s, lv[k].y, c.z + (p.z - c.z) * lv[k].s]
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n], ox = (a.x + b.x) / 2 - c.x, oz = (a.z + b.z) / 2 - c.z
    quadN(out, [[a.x, 0, a.z], [b.x, 0, b.z], [b.x, GS_PLINTH, b.z], [a.x, GS_PLINTH, a.z]], [ox, 0, oz], PLINTH)
    for (let k = 0; k < GS_RINGS; k++) {
      const A = at(a, k), B = at(b, k), B2 = at(b, k + 1), A2 = at(a, k + 1)
      const up = (k + 0.5) / GS_RINGS * 3
      quadN(out, [A, B, B2, A2], [ox, up, oz], GLASS, GLASS_TAG)
      quadN(out, [A2, B2, B, A], [-ox, -up, -oz], GLASS_IN)
      // steel: the diamond lattice, a strut across each cell both ways, and the white band low on the skin
      const L = Math.hypot(ox, oz) || 1, e = 0.05
      const lift = (v: V): V => [v[0] + ox / L * e, v[1] + e, v[2] + oz / L * e]
      const strut = (p: V, q: V): void => {
        const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2]
        // across the strut, in the skin: (strut) × (outward)
        let wx = dy * oz / L - dz * up / 3, wy = dz * ox / L - dx * oz / L, wz = dx * up / 3 - dy * ox / L
        const wl = Math.hypot(wx, wy, wz) || 1; wx *= GS_RIB / wl; wy *= GS_RIB / wl; wz *= GS_RIB / wl
        quadN(out, [[p[0] - wx, p[1] - wy, p[2] - wz], [p[0] + wx, p[1] + wy, p[2] + wz], [q[0] + wx, q[1] + wy, q[2] + wz], [q[0] - wx, q[1] - wy, q[2] - wz]], [ox, up, oz], RIB)
      }
      strut(lift(A), lift(B2)); strut(lift(B), lift(A2))
      if (k === GS_BAND_K) { const a0 = lift(A), b0 = lift(B); quadN(out, [a0, b0, [b0[0], b0[1] + GS_BAND, b0[2]], [a0[0], a0[1] + GS_BAND, a0[2]]], [ox, up, oz], BAND) }
    }
    const T = at(a, GS_RINGS), U = at(b, GS_RINGS), y = lv[GS_RINGS].y
    quadN(out, [T, U, [c.x, y + 0.4, c.z], [c.x, y + 0.4, c.z]], [0, 1, 0], GLASS)          // crown cap
  }
}

/**
 * LA GRANDE VOLIÈRE (OSM relation 3729363, man_made=rock "Grande volière"): a walk-through aviary of rock, water and
 * planting. Refs: Commons "Parc zoologique de Paris depuis le Grand Rocher, horizontal, MNHN" (from the Grand Rocher,
 * looking west), the IGN 0.2 m ortho and the LiDAR MNS (tools/ign-mns.ts, 2026-11-20): a rampart of pale grey faux rock
 * rings it, high on the east (8-12 m) and west (4-6 m) and dropping to a parapet on the south, where the flamingo pond
 * (outside, so the rider sees the flock) laps against it; some sixteen steel masts stand on the rampart LEANING INWARD,
 * and a dark stainless net hangs from the rampart's crest to their tips and spans the whole between, two ponds and a
 * zigzag boardwalk under it. The net is the NET surface (23), a screen door, so the inside reads through it.
 * Everything is measured in metres EAST/NORTH of 48.83358, 2.4187 and registered onto fit.ring (enframe.ts).
 */
/** OSM's outer way, for the registration only */
const GV_OSM: P2[] = [[-21, 2], [-15, -15], [-14, -16], [-13, -19], [-12, -21], [7, -21], [18, -15], [21, -10], [27, -1], [34, 3], [26, 32], [15, 37], [-6, 30], [-14, 25], [-20, 11]]
/** the rampart's outer foot off the ortho, anticlockwise, with its crest height (m) from the MNS: [e, n, h] */
const GV_RIM: [number, number, number][] = [
  [-11, -21, 1.2], [0, -21.5, 1.0], [11, -21, 1.2], [18, -17, 3], [23, -11, 8], [27.5, -2, 11], [28.5, 8, 11], [28, 17, 9],
  [25, 27, 7], [16, 33.5, 6], [6, 33, 5.5], [-4.5, 30, 5.5], [-13, 25, 5.5], [-18.5, 15, 5], [-20, 2, 4.5], [-17, -11, 2.5],
]
/** OSM's hole: the ponds and the boardwalk, kept clear of rocks */
const GV_HOLE: P2[] = [[-15, 3], [-13, 16], [-5, 21], [0, 22], [11, 22], [14, 20], [18, 7], [17, -4], [10, -10], [0, -14], [-7, -13]]
// rim resampling step; rampart thickness = GV_W0 + GV_WK x height; crest noise (fraction of h), outward jitter (m)
const GV_STEP = 1.6, GV_W0 = 1.2, GV_WK = 0.45, GV_NOISE = 0.14, GV_JIT = 0.35
/** the rampart's outer foot stays this far inside OSM's outline (m), past the outward jitter */
const GV_IN = 0.6
// masts: count, tip height above the ground, how far the tip leans in (m), radius; net sag at the middle, droop between tips
const GV_MASTS = 16, GV_TIP = 15, GV_LEAN = 5, GV_MAST_R = 0.22, GV_SAG = 2.2, GV_DROOP = 1.4, GV_ROOF_RINGS = 6
const GV_CABLE = 0.05, GV_ROCKS = 14, GV_ROCK_R = 2.2
const NETC: Rgb = hex('#3d4246'), MAST: Rgb = hex('#c4c8c8'), CABLE: Rgb = hex('#9aa0a2')
const RAMP: Rgb = hex('#8f8c86'), RAMP2: Rgb = hex('#7c7a75'), VROCK: Rgb = hex('#8d8a80'), VROCK2: Rgb = hex('#6f7060')
const ROCK_TAG = surfaceTag('rock'), NET_TAG = surfaceTag('net')

export function grandeVoliere(out: MeshBuilder, fit: Fit): void {
  const F = registerRingEN(GV_OSM, fit), y0 = F.y0
  // P takes an ABSOLUTE local y (y0 is the base the loader measured; gnd the terrain under a point, so the rampart hugs it)
  const P = (e: number, n: number, y: number): V => { const q = F.xz(e, n); return [q.x, y, q.z] }
  const gnd = (e: number, n: number): number => { if (!fit.groundAt) return y0; const q = F.xz(e, n); return fit.groundAt(q.x, q.z) }
  const Q = (q: V[], hint: V, c: Rgb, tag = 0): void => quadN(out, q, F.n(hint) as V, c, tag)
  const two = (q: V[], hint: V, c: Rgb, tag = 0): void => { Q(q, hint, c, tag); Q([q[3], q[2], q[1], q[0]], [-hint[0], -hint[1], -hint[2]], c, tag) }
  let seed = 11; const rnd = (): number => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
  // the rim walked at an even step, each point with its crest height and its inward normal
  const rim: { e: number; n: number; h: number }[] = []
  for (let i = 0; i < GV_RIM.length; i++) {
    const a = GV_RIM[i], b = GV_RIM[(i + 1) % GV_RIM.length], m = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / GV_STEP))
    for (let j = 0; j < m; j++) { const t = j / m; rim.push({ e: a[0] + (b[0] - a[0]) * t, n: a[1] + (b[1] - a[1]) * t, h: a[2] + (b[2] - a[2]) * t }) }
  }
  // the rim kept GV_IN inside OSM's outline (fit.ring): the frame fit put the north-west foot 2–4 m out, over the zoo's
  // ridden path along it (2026-11-22, a ray probe of the bike graph)
  const ring = fit.ring
  if (ring && ring.length >= 3) {
    const inRing = (x: number, z: number): boolean => { let o = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const a = ring[i], b = ring[j]; if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) o = !o } return o }
    const edgeD = (x: number, z: number): number => { let d = Infinity; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const a = ring[j], b = ring[i], dx = b.x - a.x, dz = b.z - a.z, t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1))); d = Math.min(d, Math.hypot(x - a.x - dx * t, z - a.z - dz * t)) } return d }
    const me = rim.reduce((s, p) => s + p.e, 0) / rim.length, mn = rim.reduce((s, p) => s + p.n, 0) / rim.length
    for (const p of rim) {
      for (let s = 1; s > 0.5; s -= 0.01) {
        const e = me + (p.e - me) * s, n = mn + (p.n - mn) * s, q = F.xz(e, n)
        if (inRing(q.x, q.z) && edgeD(q.x, q.z) >= GV_IN) { p.e = e; p.n = n; break }
      }
    }
  }
  const N = rim.length
  const inward = rim.map((_, i) => {
    const a = rim[(i + N - 1) % N], b = rim[(i + 1) % N], te = b.e - a.e, tn = b.n - a.n, L = Math.hypot(te, tn) || 1
    return { e: -tn / L, n: te / L }   // left of an anticlockwise walk: inside
  })
  // the masts' and the net's heights are over the mean ground round the rim, not the loader's base (the lowest ground)
  const yT = rim.reduce((s, p) => s + gnd(p.e, p.n), 0) / N
  const ce = rim.reduce((s, p) => s + p.e, 0) / N, cn = rim.reduce((s, p) => s + p.n, 0) / N
  // RAMPART: a lofted section at each rim point, foot / shoulder / crest / shoulder / foot, crest and face jittered
  const SEC_W = [0, 0.18, 0.5, 0.82, 1], SEC_H = [0, 0.82, 1, 0.86, 0]
  // smooth undulation along the rim (a few metres' wavelength), not per-point noise, which read as a saw-tooth crenellation
  const wave = (s: number, ph: number): number => 0.6 * Math.sin(s * 0.55 + ph) + 0.4 * Math.sin(s * 1.37 + 2.1 * ph)
  const sec = rim.map((p, i) => {
    const s = i * GV_STEP, h = Math.max(0.8, p.h * (1 + GV_NOISE * wave(s, 0.7))), w = GV_W0 + GV_WK * p.h, j = GV_JIT * wave(s, 2.3), g = gnd(p.e, p.n)
    return SEC_W.map((f, k) => P(p.e + inward[i].e * (f * w - (k === 0 ? j : 0)), p.n + inward[i].n * (f * w - (k === 0 ? j : 0)), k === 0 || k === 4 ? g - 0.4 : g + SEC_H[k] * h * (k === 1 || k === 3 ? 0.97 + 0.08 * wave(s, 4.1 + k) : 1)))
  })
  for (let i = 0; i < N; i++) {
    const A = sec[i], B = sec[(i + 1) % N], io = inward[i]
    for (let k = 0; k < SEC_W.length - 1; k++) {
      const outv: V = k < 2 ? [-io.e, 0.6 + k * 0.4, -io.n] : [io.e, 1.4 - (k - 2) * 0.6, io.n]
      Q([A[k], B[k], B[k + 1], A[k + 1]], [outv[0], outv[1], outv[2]] as V, (i + k) % 3 ? RAMP : RAMP2, ROCK_TAG)
    }
  }
  // the crest line the net is anchored along (a little inside the very top)
  const crest = rim.map((p, i) => { const w = GV_W0 + GV_WK * p.h; return { e: p.e + inward[i].e * w * 0.55, n: p.n + inward[i].n * w * 0.55, y: gnd(p.e, p.n) + p.h * 0.97 } })
  // MASTS, evenly round the rim by index: foot on the crest, tip leaning in toward the middle
  const mi = Array.from({ length: GV_MASTS }, (_, k) => Math.round(k * N / GV_MASTS) % N)
  const tips = mi.map(i => {
    const c = crest[i], de = ce - c.e, dn = cn - c.n, L = Math.hypot(de, dn) || 1
    return { e: c.e + de / L * GV_LEAN, n: c.n + dn / L * GV_LEAN, h: GV_TIP }
  })
  const tube = (a: V, b: V, r: number, col: Rgb): void => {
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(d[0], d[1], d[2]) || 1, u = d.map(x => x / L)
    const s0 = Math.abs(u[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]
    let px = [u[1] * s0[2] - u[2] * s0[1], u[2] * s0[0] - u[0] * s0[2], u[0] * s0[1] - u[1] * s0[0]]
    const pl = Math.hypot(px[0], px[1], px[2]); px = px.map(x => x / pl)
    const py = [u[1] * px[2] - u[2] * px[1], u[2] * px[0] - u[0] * px[2], u[0] * px[1] - u[1] * px[0]]
    const ring = (o: V, k: number): V => { const t = k * Math.PI / 3, c = Math.cos(t) * r, s = Math.sin(t) * r; return [o[0] + px[0] * c + py[0] * s, o[1] + px[1] * c + py[1] * s, o[2] + px[2] * c + py[2] * s] }
    for (let k = 0; k < 6; k++) {
      const t = (k + 0.5) * Math.PI / 3, hint: V = [px[0] * Math.cos(t) + py[0] * Math.sin(t), px[1] * Math.cos(t) + py[1] * Math.sin(t), px[2] * Math.cos(t) + py[2] * Math.sin(t)]
      quadN(out, [ring(a, k), ring(a, k + 1), ring(b, k + 1), ring(b, k)], hint, col)
    }
  }
  for (let k = 0; k < GV_MASTS; k++) {
    const c = crest[mi[k]], t = tips[k]
    tube(P(c.e, c.n, c.y - 0.5), P(t.e, t.n, yT + t.h + 0.3), GV_MAST_R, MAST)
  }
  // the NET's top edge: tip to tip along each bay, drooping between, sampled at every rim point of the bay
  const edge: { e: number; n: number; h: number }[] = new Array(N)
  for (let k = 0; k < GV_MASTS; k++) {
    const i0 = mi[k], i1 = mi[(k + 1) % GV_MASTS], span = (i1 - i0 + N) % N || N, a = tips[k], b = tips[(k + 1) % GV_MASTS]
    for (let j = 0; j < span; j++) { const t = j / span; edge[(i0 + j) % N] = { e: a.e + (b.e - a.e) * t, n: a.n + (b.n - a.n) * t, h: GV_TIP - GV_DROOP * Math.sin(Math.PI * t) } }
  }
  // the sides: crest up to the edge; the roof: the edge drawn in to the middle, sagging
  const ER = Math.max(...edge.map(p => Math.hypot(p.e - ce, p.n - cn)))
  const roofAt = (p: { e: number; n: number; h: number }, r: number): V => {
    const s = 1 - r / GV_ROOF_RINGS * 0.97, e = ce + (p.e - ce) * s, n = cn + (p.n - cn) * s
    const sag = GV_SAG * (1 - Math.pow(Math.hypot(e - ce, n - cn) / ER, 2))
    return P(e, n, yT + p.h * s + (GV_TIP - GV_DROOP * 0.5) * (1 - s) - sag)
  }
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N, c0 = crest[i], c1 = crest[j], e0 = edge[i], e1 = edge[j], io = inward[i]
    two([P(c0.e, c0.n, c0.y), P(c1.e, c1.n, c1.y), P(e1.e, e1.n, yT + e1.h), P(e0.e, e0.n, yT + e0.h)], [-io.e, 0.3, -io.n], NETC, NET_TAG)
    for (let r = 0; r < GV_ROOF_RINGS; r++) two([roofAt(e0, r), roofAt(e1, r), roofAt(e1, r + 1), roofAt(e0, r + 1)], [0, 1, 0], NETC, NET_TAG)
  }
  // cables: the edge between tips, and a radial from each tip toward the middle, so the net's shape reads from afar
  const cable = (a: V, b: V): void => {
    const d = [b[0] - a[0], b[2] - a[2]], L = Math.hypot(d[0], d[1]) || 1, wx = -d[1] / L * GV_CABLE, wz = d[0] / L * GV_CABLE
    two([[a[0] - wx, a[1], a[2] - wz], [a[0] + wx, a[1], a[2] + wz], [b[0] + wx, b[1], b[2] + wz], [b[0] - wx, b[1], b[2] - wz]], [0, 1, 0], CABLE)
  }
  for (let i = 0; i < N; i++) { const a = edge[i], b = edge[(i + 1) % N]; cable(P(a.e, a.n, yT + a.h), P(b.e, b.n, yT + b.h)) }
  for (const i of mi) for (let r = 0; r < GV_ROOF_RINGS; r++) cable(roofAt(edge[i], r), roofAt(edge[i], r + 1))
  // ROCKS between the rampart and the ponds
  const inside = (poly: P2[], e: number, n: number): boolean => { let r = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) if ((poly[i][1] > n) !== (poly[j][1] > n) && e < (poly[j][0] - poly[i][0]) * (n - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0]) r = !r; return r }
  const inner: P2[] = rim.map((p, i) => { const w = GV_W0 + GV_WK * p.h; return [p.e + inward[i].e * (w + 0.5), p.n + inward[i].n * (w + 0.5)] })
  let placed = 0
  for (let tries = 0; tries < 900 && placed < GV_ROCKS; tries++) {
    const e = -20 + rnd() * 50, n = -22 + rnd() * 56, r = GV_ROCK_R * (0.5 + rnd())
    if (!inside(inner, e, n) || inside(GV_HOLE, e, n)) continue
    placed++
    const hh = r * (0.6 + rnd() * 0.8), K = 7, ph = rnd() * 6
    for (let i = 0; i < K; i++) {
      const a0 = ph + i / K * 2 * Math.PI, a1 = ph + (i + 1) / K * 2 * Math.PI, r0 = r * (0.8 + rnd() * 0.4), r1 = r * (0.8 + rnd() * 0.4), am = (a0 + a1) / 2
      const g = gnd(e, n), top = P(e + (rnd() - 0.5) * r * 0.3, n + (rnd() - 0.5) * r * 0.3, g + hh)
      Q([P(e + Math.cos(a0) * r0, n + Math.sin(a0) * r0, g - 0.3), P(e + Math.cos(a1) * r1, n + Math.sin(a1) * r1, g - 0.3), top, top], [Math.cos(am), 0.7, Math.sin(am)], i % 2 ? VROCK : VROCK2, ROCK_TAG)
    }
  }
}

/**
 * THE BELVÉDÈRE (OSM way/280560862, building=yes man_made=rock): the zoo's 1934 sprayed-concrete lookout just south-east
 * of the aviary, between the flamingo pond (west) and a planted pool (east). It is a hooked ridge: a bowl in the middle
 * with its floor at 4 m, a 9–14 m crest with a viewing platform running south-east, a low 1–4 m rock arm north between
 * the two pools, and the footpath's passage left open at the south. Measured like the Grand Rocher: IGN MNS
 * (tools/ign-mns.ts at 48.833237, 2.419175, radius 32) on a 2 m grid masked to OSM's outline, tree canopy capped
 * (4 m on the north arm, 14 m elsewhere), empty cells inside the outline raised to 1 m. Generated by the session's
 * scratchpad bgen.py; to re-measure, re-run ign-mns and re-emit.
 */
const BV_OSM: P2[] = [[-17, 23], [-16, 19], [-13, 14], [-12, 12], [-12, 11], [-10, 10], [-6, 5], [-5, 3], [-9, 1], [-11, -2], [-14, -5], [-12, -11], [0, -19], [7, -21], [24, -24], [25, -15], [21, -11], [19, -12], [18, -12], [12, -9], [9, -7], [5, -6], [4, -4], [-3, 3], [6, 13], [6, 15], [-14, 28]]
// the grid's west edge and north edge (m east/north of the lidar centre)
const BV_E0 = -20, BV_N0 = 26
const BV_HF = [
  '000430000000000000000000',
  '004211100000000000000000',
  '001111120000000000000000',
  '001111211100000000000000',
  '000111232120000000000000',
  '000111124411200000000000',
  '000011112444100000000000',
  '000011111444200000000000',
  '000001244442000000000000',
  '000000144430000000000000',
  '000000045400000000000000',
  '000000006000000000000000',
  '0000000aa000000000000000',
  '0000009a8a00000000000000',
  '00000a944490000000000000',
  '0000a9444699000000000000',
  '0000a4444999900000000000',
  '0000ab446999971100000000',
  '00001a879999999380000000',
  '0000089a999999aaabb0c000',
  '00000001388899a9a97eed00',
  '00000000578869aab7deeec0',
  '00000000001111aabcdeeea0',
  '0000000000001119acdded70',
  '00000000000000000aabdd50',
  '000000000000000000000000',
]

export function belvedere(out: MeshBuilder, fit: Fit): void {
  rockField(out, registerRingEN(BV_OSM, fit), BV_HF, BV_E0, BV_N0)
}
