/**
 * The Église Saint-Nicolas-et-Saint-Marc, Ville-d'Avray (Trou, 1789–91; Corot painted inside it). OSM's outline (way/129455533)
 * is the church and the presbytery wing east of it in one ring, so a church fitted to the whole ring ran 54 m long and through
 * the maison paroissiale next door. Here the ring is cut across its long axis: the church on the nave's part, a plain two-storey
 * house on the rest.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { church } from '../../church.ts'
import { extrude, palette } from '../palaces/common.ts'

type P2 = { x: number; z: number }

/** the nave's share of the ring's long axis, and which end it is at (−1 low, +1 high, in the fit's frame); the wing's house */
const NAVE = { share: 0.62, end: 1 as -1 | 1 }
const WING = { stone: '#e2d6bd', slate: '#5a5e60', eaves: 7, rise: 2.6, inset: 2 }

/** Sutherland–Hodgman: the part of ring r where k(p) ≥ 0, for k linear */
function clip(r: P2[], k: (p: P2) => number): P2[] {
  const out: P2[] = []
  for (let i = 0; i < r.length; i++) {
    const a = r[i], b = r[(i + 1) % r.length], ka = k(a), kb = k(b)
    if (ka >= 0) out.push(a)
    if ((ka >= 0) !== (kb >= 0)) { const t = ka / (ka - kb); out.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }) }
  }
  return out
}

export function avrayEglise(out: MeshBuilder, fit: Fit): void {
  const ring = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  const xs = ring.map((p) => p.x), zs = ring.map((p) => p.z)
  const alongX = Math.max(...xs) - Math.min(...xs) >= Math.max(...zs) - Math.min(...zs)
  const t = (p: P2): number => (alongX ? p.x : p.z)
  const lo = Math.min(...ring.map(t)), hi = Math.max(...ring.map(t))
  const cut = NAVE.end < 0 ? lo + (hi - lo) * NAVE.share : hi - (hi - lo) * NAVE.share
  const nave = clip(ring, (p) => NAVE.end * (cut - t(p)))
  const wing = clip(ring, (p) => NAVE.end * (t(p) - cut))
  church(out, { ...fit, ring: nave, holes: undefined }, {
    nave: { bays: 5, storeys: 1, roof: 'gable', pitch: 'low' },
    aisles: null, transept: null, chancel: { kind: 'apse' }, tower: null,
    front: { kind: 'pediment', portal: 'porch', window: 'none', steps: 3 },
    walls: { material: 'limestone', openings: 'round', buttresses: 'none' },
  } as Parameters<typeof church>[2])
  if (wing.length >= 3) {
    extrude(out, [wing], palette(WING.stone, WING.slate), { eaves: WING.eaves, storeys: [{ y: 0, h: 1.6, sill: 0.9 }, { y: 3.4, h: 1.5, sill: 0.8 }],
      bay: 3.4, win: 1.2, rise: WING.rise, inset: WING.inset, dormers: false })
  }
}
