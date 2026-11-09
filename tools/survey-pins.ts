/*
 * SURVEY PINS (2026-11-07, Pont National's right bank). Quai de Bercy dives under the bridgehead in three 40 m layer -1 tunnels;
 * the IGN bare earth (RGE ALTI) is 31.9–32.4 m all along it, Bd Poniatowski on its embankment at 37–38. The bake's fine ground
 * there is the embankment's: the quay, its tunnels and Rue Robert-Etlin all came out of the very first levelling at 5.6 (TRACE
 * "levelled"), and the quay fell 6 m in 30 m back to its real level north of the bridgehead (24 %). No bridge or plate pass did it.
 *
 * A region's `surveyPins` names a ring, the ways in it (`ways`: a name regex; `kinds`: a kind regex, unnamed ways only) and a few
 * surveyed points [lat, lon, IGN m]: every such way's points in the ring take the points' inverse-distance height less `datum`
 * (bake height = IGN − datum, ≈ 32.8 by Pont National), eased back to its own over `fade` m outside the ring. Bridges never.
 * Run last in the bake (SURVEY_PINS=0 off) and again by `bake --rides` (which rewrites the tiles of the ways it moved).
 */
import type { PackedEdge } from '../src/city/package.ts'
import type { Region } from '../src/city/region.ts'

type Pin = NonNullable<Region['surveyPins']>[number]

const inRing = (r: number[], x: number, z: number): boolean => {
  let c = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2)
    if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) c = !c
  return c
}

export function applySurveyPins(edges: PackedEdge[], pins: Pin[], toLocal: (lat: number, lon: number) => { x: number; z: number }): { moved: Set<PackedEdge>; log: string[] } {
  const moved = new Set<PackedEdge>(), log: string[] = []
  for (const sp of pins) {
    const ring = sp.ring.flatMap(([lat, lon]) => { const q = toLocal(lat, lon); return [q.x, q.z] })
    const ctl = sp.points.map(([lat, lon, y]) => ({ ...toLocal(lat, lon), y: y - sp.datum }))
    const reName = sp.ways ? new RegExp(sp.ways) : null, reKind = sp.kinds ? new RegExp(sp.kinds) : null
    const FADE = sp.fade ?? 25
    const off = (x: number, z: number): number => {
      if (inRing(ring, x, z)) return 0
      let d = Infinity
      for (let i = 0; i < ring.length; i += 2) {
        const j = (i + 2) % ring.length, dx = ring[j] - ring[i], dz = ring[j + 1] - ring[i + 1]
        const t = Math.max(0, Math.min(1, ((x - ring[i]) * dx + (z - ring[i + 1]) * dz) / (dx * dx + dz * dz || 1)))
        d = Math.min(d, Math.hypot(ring[i] + dx * t - x, ring[i + 1] + dz * t - z))
      }
      return d
    }
    const idw = (x: number, z: number): number => {
      let s = 0, w = 0
      for (const c of ctl) { const d2 = (c.x - x) ** 2 + (c.z - z) ** 2; if (d2 < 0.01) return c.y; s += c.y / d2; w += 1 / d2 }
      return s / w
    }
    let n = 0, pts = 0
    for (const e of edges) {
      if (e.bridge || e.bikeRamp || !e.heights || e.heights.length * 2 !== e.points.length) continue
      if (!((reName && reName.test(e.name ?? '')) || (reKind && !e.name && reKind.test(e.kind ?? '')))) continue
      let hit = false
      for (let i = 0; i < e.heights.length; i++) {
        const x = e.points[2 * i], z = e.points[2 * i + 1], d = off(x, z)
        if (d >= FADE) continue
        const h = e.heights[i], y = h + (idw(x, z) - h) * (1 - d / FADE)
        if (Math.abs(y - h) > 0.05) { e.heights[i] = Math.round(y * 100) / 100; pts++; hit = true }
      }
      if (hit) { n++; moved.add(e); delete e.ramp }
    }
    log.push(`survey pins, ${sp.name}: ${pts} points of ${n} ways set to the survey`)
  }
  return { moved, log }
}
