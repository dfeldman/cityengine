/**
 * THE BOSQUET DE LA SALLE DE BAL (Salle des Rocailles; Le Nôtre, 1680–85; OSM relation/23448909, an oval 59 × 47 m): a sunken
 * oval amphitheatre. On its east side (OSM's retaining walls and cascade basins lie there) a stepped cascade of brown millstone
 * rockwork studded with pale shells, a trough on every tier and the water falling lip to lip into a channel at the foot, gilded
 * lead torchères along the lips. Facing it a gravel dance floor, ringed by turf gradins (grass steps) round the rest of the
 * oval, a clipped hedge on the rim and an opening west (the footway's entrance). Drawn on the fit's ring (front 180: x east).
 * Statues are not here. Tunables are the constants below.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { dome, hex, shade } from '../../kit.ts'
import { boxAlong } from '../../parts.ts'
import { block } from '../batch2/tag.ts'
import { crag } from '../batch3/parks.ts'

type P2 = { x: number; z: number }
const hash = (a: number, b: number): number => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v) }

const SALLE = {
  /** the gradins: tiers, riser and the share of the radius the floor takes; sampled every `seg` degrees; the entrance gap's half-angle */
  tiers: 5, riser: 0.5, floor: 0.5, seg: 5, gap: 7, rimInset: 1.8,
  /** the cascade: its tiers, each tier's rise and depth, where it starts as a share of the oval's half-length, its half-width, the sector (half-angle, degrees) the gradins leave to it */
  cascade: { tiers: 5, rise: 0.85, depth: 2.7, start: 0.32, half: 17, sector: 56, trough: 0.5, wall: 0.9 },
  /** crags on each tier's face per metre of width, their size, and the share that are shells */
  crags: { per: 0.55, size: 0.95, shell: 0.25 },
  /** the torchères: spacing along a lip (m), pedestal height, bowl radius, which tiers (every n) carry them */
  vase: { every: 3.6, ped: 0.8, r: 0.32, tiers: 2 },
  hedge: { h: 2.4, w: 1.1 },
  rock: '#7b6248', shell: '#e7ddc8', stone: '#cdc4ae', turf: '#4f7634', gravel: '#c6b794', gold: '#cfa83c', green: '#3e5f2d',
  water: [0.34, 0.45, 0.43] as [number, number, number],
}

/** how far from c along angle a the ring's edge is (the nearest crossing) */
function rayHit(r: P2[], c: P2, a: number): number {
  const dx = Math.cos(a), dz = Math.sin(a)
  let best = Infinity
  for (let i = 0; i < r.length; i++) {
    const p = r[i], q = r[(i + 1) % r.length], ex = q.x - p.x, ez = q.z - p.z
    const den = dx * ez - dz * ex
    if (Math.abs(den) < 1e-9) continue
    const t = ((p.x - c.x) * ez - (p.z - c.z) * ex) / den, u = ((p.x - c.x) * dz - (p.z - c.z) * dx) / den
    if (t > 0 && u >= 0 && u <= 1 && t < best) best = t
  }
  return best
}

export function versaillesSalleDeBal(out: MeshBuilder, fit: Fit): void {
  const S = SALLE, C = S.cascade, y = fit.grade ?? 0
  const ROCK = hex(S.rock), SHELL = hex(S.shell), STONE = hex(S.stone), TURF = hex(S.turf), GRAVEL = hex(S.gravel), GOLD = hex(S.gold)
  const ring = fit.ring && fit.ring.length > 2 ? fit.ring : Array.from({ length: 40 }, (_, k) => ({ x: Math.cos((k / 40) * Math.PI * 2) * 29.5, z: Math.sin((k / 40) * Math.PI * 2) * 22.5 }))
  const xs = ring.map((p) => p.x), zs = ring.map((p) => p.z)
  const c = { x: (Math.min(...xs) + Math.max(...xs)) / 2, z: (Math.min(...zs) + Math.max(...zs)) / 2 }
  const A = (Math.max(...xs) - Math.min(...xs)) / 2, B = (Math.max(...zs) - Math.min(...zs)) / 2
  const Rr = (a: number): number => { const r = rayHit(ring, c, a); return Number.isFinite(r) ? r : Math.hypot(Math.cos(a) * A, Math.sin(a) * B) }
  // a smooth oval of the ring's mean reach (OSM's notches stay out of the steps)
  const Rs = (a: number): number => Math.min(Rr(a), (A * B) / Math.hypot(B * Math.cos(a), A * Math.sin(a)) * 1.02) - 0.3
  const N = Math.round(360 / S.seg)
  const sector = (S.cascade.sector * Math.PI) / 180, gap = (S.gap * Math.PI) / 180
  const ang = (k: number): number => (k / N) * Math.PI * 2 - Math.PI
  const inCascade = (a: number): boolean => Math.abs(a) < sector
  const inGap = (a: number): boolean => Math.PI - Math.abs(a) < gap
  const pt = (a: number, f: number): P2 => { const r = Rs(a) * f; return { x: c.x + Math.cos(a) * r, z: c.z + Math.sin(a) * r } }

  // the dance floor: gravel, a stone kerb round it
  const f0 = S.floor
  for (let k = 0; k < N; k++) {
    const a0 = ang(k), a1 = ang(k + 1), p0 = pt(a0, f0), p1 = pt(a1, f0)
    out.quad([[c.x, y + 0.04, c.z], [p1.x, y + 0.04, p1.z], [p0.x, y + 0.04, p0.z], [p0.x, y + 0.04, p0.z]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], GRAVEL, 0)
    if (inCascade((a0 + a1) / 2)) continue
    const q0 = pt(a0, f0 + 0.02), q1 = pt(a1, f0 + 0.02)
    out.quad([[q0.x, y + 0.04, q0.z], [q1.x, y + 0.04, q1.z], [q1.x, y + 0.3, q1.z], [q0.x, y + 0.3, q0.z]], [-Math.cos((a0 + a1) / 2), 0, -Math.sin((a0 + a1) / 2)], [[0, 0], [1, 0], [1, 1], [0, 1]], STONE, surfaceTag('ashlar'))
  }

  // the gradins: turf treads, pale stone risers, tier over tier outward, except under the cascade and at the entrance
  const rim = (Rs(0) - S.rimInset) / Rs(0)
  for (let k = 0; k < N; k++) {
    const a0 = ang(k), a1 = ang(k + 1), am = (a0 + a1) / 2
    if (inCascade(am) || inGap(am)) continue
    const nx = -Math.cos(am), nz = -Math.sin(am)
    for (let j = 0; j < S.tiers; j++) {
      const fa = f0 + (rim - f0) * (j / S.tiers), fb = f0 + (rim - f0) * ((j + 1) / S.tiers)
      const yb = y + j * S.riser, yt = y + (j + 1) * S.riser
      const a = pt(a0, fa), b = pt(a1, fa), d = pt(a1, fb), e = pt(a0, fb)
      out.quad([[a.x, yb, a.z], [b.x, yb, b.z], [b.x, yt, b.z], [a.x, yt, a.z]], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], shade(STONE, 0.95 + hash(k, j) * 0.1), surfaceTag('ashlar'))
      out.quad([[a.x, yt, a.z], [b.x, yt, b.z], [d.x, yt, d.z], [e.x, yt, e.z]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], shade(TURF, 0.9 + hash(j, k) * 0.2), surfaceTag('foliage'))
    }
    // the hedge on the rim, over the steps' top
    const m = pt(am, rim + 0.5 * (1 - rim)), n = pt(a1, rim + 0.5 * (1 - rim)), l = Math.hypot(n.x - m.x, n.z - m.z)
    boxAlong(out, (m.x + n.x) / 2, y + S.tiers * S.riser + S.hedge.h / 2, (m.z + n.z) / 2, l / 2 + 0.05, S.hedge.h / 2, S.hedge.w / 2, Math.atan2(-(n.z - m.z), n.x - m.x), shade(hex(S.green), 0.9 + hash(k, 5) * 0.2), surfaceTag('foliage'))
  }

  // the cascade, east: tier j's trough-topped block from its lip back to the next, the rim behind the last
  const cx0 = c.x + A * C.start
  const chord = (x: number): number => B * Math.sqrt(Math.max(0, 1 - Math.pow((x - c.x) / A, 2))) - 1.4
  let seed = 0
  const edgeX = (j: number): number => cx0 + j * C.depth
  // the channel at the foot: a trough across the cascade's width
  const hw0 = Math.min(C.half, chord(edgeX(0)))
  const rectPool = (x0: number, x1: number, hz: number, yy: number): void => {
    out.water.push({ kind: 'pool', ring: [{ x: x0, z: c.z - hz }, { x: x1, z: c.z - hz }, { x: x1, z: c.z + hz }, { x: x0, z: c.z + hz }], y: yy, colour: S.water })
  }
  block(out, edgeX(0) - 3.4, edgeX(0) - 2.6, c.z - hw0 - 0.4, c.z + hw0 + 0.4, y - 0.4, y + 0.35, STONE, surfaceTag('ashlar'))
  block(out, edgeX(0) - 3.4, edgeX(0), c.z - hw0 - 0.4, c.z - hw0, y - 0.4, y + 0.35, STONE, surfaceTag('ashlar'))
  block(out, edgeX(0) - 3.4, edgeX(0), c.z + hw0, c.z + hw0 + 0.4, y - 0.4, y + 0.35, STONE, surfaceTag('ashlar'))
  rectPool(edgeX(0) - 2.6, edgeX(0), hw0, y + 0.22)
  for (let j = 0; j < C.tiers; j++) {
    const x0 = edgeX(j), x1 = j === C.tiers - 1 ? Math.max(x0 + C.depth, c.x + A - 1.5) : edgeX(j + 1)
    const hw = Math.min(C.half, chord(x1 - 0.3)), top = (j + 1) * C.rise
    block(out, x0, x1, c.z - hw, c.z + hw, y - 0.4, y + top, shade(ROCK, 0.7), surfaceTag('rock'))
    // the lip's coping and the tier's side walls, rock
    block(out, x0 - 0.35, x0 + 0.3, c.z - hw, c.z + hw, y + top - 0.25, y + top + 0.08, shade(ROCK, 1.1), surfaceTag('rock'))
    for (const s of [-1, 1]) block(out, x0 - 0.2, x1, c.z + s * hw - (s > 0 ? 0 : C.wall * 0.8), c.z + s * hw + (s > 0 ? C.wall * 0.8 : 0), y - 0.4, y + top + 0.7 + (hash(j, s) * 0.3), shade(ROCK, 0.85), surfaceTag('rock'))
    // the trough on top and the water falling off the lip to the tier below
    const t = C.trough
    rectPool(x0 + t, x1 - 0.2, hw - t, y + top + 0.03)
    const hwl = hw - 0.2
    out.water.push({ kind: 'sheet', a: [x0 - 0.3, y + top + 0.03, c.z + hwl], b: [x0 - 0.3, y + top + 0.03, c.z - hwl], out: 0.3, drop: C.rise + (j === 0 ? 0.1 : 0.03) })
    out.water.push({ kind: 'splash', at: [x0 - 0.8, y + (j === 0 ? 0.22 : j * C.rise + 0.03), c.z], r: Math.min(hwl, 6) * 0.35 })
    // the face: crags of millstone studded with shells, foot to lip
    const n = Math.max(2, Math.round(2 * hw * S.crags.per))
    for (let i = 0; i < n; i++) {
      const zz = c.z - hw + 0.4 + (i / (n - 1)) * (2 * hw - 0.8) + (hash(i, j) - 0.5) * 0.6
      const shell = hash(i + 7, j) < S.crags.shell
      const yb = y + (j === 0 ? -0.2 : j * C.rise - 0.1)
      crag(out, x0 - 0.15, yb, zz, S.crags.size * 0.55 + hash(j, i) * 0.3, C.rise * (1.1 + hash(i, 3) * 0.5), S.crags.size * (shell ? 0.5 : 0.8) + hash(i, j) * 0.3, seed++ * 1.37,
        shade(shell ? SHELL : ROCK, 0.85 + hash(seed, 2) * 0.3))
    }
    // gilded torchères on the lips of every other tier, pedestals and flaming bowls
    if (j % S.vase.tiers === S.vase.tiers - 1 || j === C.tiers - 1) {
      const m = Math.max(2, Math.round((2 * hw) / S.vase.every))
      for (let i = 0; i <= m; i++) {
        const zz = c.z - hw + 0.5 + (i / m) * (2 * hw - 1), V = S.vase, px = x0 + 0.5
        block(out, px - 0.25, px + 0.25, zz - 0.25, zz + 0.25, y + top, y + top + V.ped, STONE, surfaceTag('ashlar'))
        dome(out, px, zz, y + top + V.ped, V.r, V.r * 1.1, GOLD, 8)
        dome(out, px, zz, y + top + V.ped + V.r * 1.1, V.r * 0.4, V.r * 1.2, shade(GOLD, 1.25), 6)
      }
    }
  }
}

export const VERSAILLES_SALLE_DE_BAL = { versaillesSalleDeBal }
