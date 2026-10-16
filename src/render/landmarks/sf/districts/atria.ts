/**
 * GLASS ROOFS that OSM maps as a building:part with `roof:material=glass` and a pitched shape: drawn by the city as an
 * opaque slab, and over a courtyard with nothing under it, a grey plane in the air (owner, 2026-10-16, BUGS.md #269:
 * "roof not connected to building here"). Here as what they are — glass on a light frame, walls down to the ground.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { boxAlong } from '../../parts.ts'

type P2 = { x: number; z: number }
type V3 = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/**
 * A skillion glass atrium on its own ring: glass walls from the ground to `eave`, a single glass slope rising along the
 * ring's long axis to `ridge`, a mullion every 2.5 m. Heights from the fit (the entry's `height` is the ridge).
 */
function glassAtrium(out: MeshBuilder, fit: Fit, eave: number): void {
  const GLASS: Rgb = [0.55, 0.68, 0.74], FRAME: Rgb = [0.82, 0.83, 0.84]
  const GL = surfaceTag('glass'), MT = surfaceTag('metal')
  let ring: P2[] = fit.ring && fit.ring.length >= 3 ? fit.ring.slice() : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  if (ring.length > 3 && Math.hypot(ring[0].x - ring[ring.length - 1].x, ring[0].z - ring[ring.length - 1].z) < 0.3) ring = ring.slice(0, -1)
  let area = 0
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a.x * b.z - b.x * a.z }
  if (area < 0) ring.reverse()
  const ridge = fit.height
  // the slope runs along the fit's long axis: y rises from eave at its low end to the ridge at the other
  const along = fit.hx >= fit.hz ? 'x' : 'z', half = Math.max(fit.hx, fit.hz)
  const yAt = (p: P2): number => eave + (ridge - eave) * ((along === 'x' ? p.x : p.z) + half) / (2 * half)
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.3) continue
    const nx = (b.z - a.z) / L, nz = -(b.x - a.x) / L
    out.quad([[a.x, 0, a.z], [b.x, 0, b.z], [b.x, yAt(b), b.z], [a.x, yAt(a), a.z]], [nx, 0, nz], UV, GLASS, GL)
    const n = Math.max(1, Math.round(L / 2.5))
    for (let k = 0; k <= n; k++) {
      const t = k / n, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t, y = yAt({ x, z })
      boxAlong(out, x + nx * 0.05, y / 2, z + nz * 0.05, 0.06, y / 2, 0.06, 0, FRAME, MT)
    }
  }
  // the slope itself: a fan from the ring's first point (convex-enough rings), glass, with frame bars across it
  const c = ring.reduce((s, p) => ({ x: s.x + p.x / ring.length, z: s.z + p.z / ring.length }), { x: 0, z: 0 })
  const up = along === 'x' ? { x: -(ridge - eave) / (2 * half), y: 1, z: 0 } : { x: 0, y: 1, z: -(ridge - eave) / (2 * half) }
  const ul = Math.hypot(up.x, up.y, up.z), nrm: V3 = [up.x / ul, up.y / ul, up.z / ul]
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    out.quad([[c.x, yAt(c), c.z], [a.x, yAt(a), a.z], [b.x, yAt(b), b.z], [b.x, yAt(b), b.z]], nrm, UV, GLASS, GL)
  }
  for (let s = -half + 2.5; s < half; s += 2.5) {
    const p = along === 'x' ? { x: s, z: 0 } : { x: 0, z: s }
    boxAlong(out, p.x, yAt(p) + 0.08, p.z, along === 'x' ? 0.06 : Math.min(fit.hx, fit.hz) * 1.6, 0.06, along === 'x' ? Math.min(fit.hx, fit.hz) * 1.6 : 0.06, 0, FRAME, MT)
  }
}

export const ATRIA: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** the atrium in the courtyard of the medical complex by Geary at Webster (way/1340831358: glass skillion 5→20 m) */
  glassAtrium_1340831358: (out, fit) => glassAtrium(out, fit, 9),
}
