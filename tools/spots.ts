/**
 * Picks places in a baked city worth photographing.
 *
 * Road rendering goes wrong at junctions, not on straights, and the city's own start point is deliberately a
 * quiet street. So the spots are chosen for awkwardness: the busiest crossroads, the widest streets meeting
 * the narrowest, the forks, and a couple of dead ends — the cases a union of messy OSM geometry is most
 * likely to get wrong.
 *
 *   node --experimental-strip-types tools/spots.ts san-francisco
 */
import type { CityPackage } from '../src/city/package.ts'
import { readPackage } from './bake-files.ts'

export interface Spot { edgeId: number; why: string }

export function spotsFor(pkg: CityPackage, count = 8): Spot[] {
  const degree = new Map<number, number>()
  const widest = new Map<number, number>()
  const narrowest = new Map<number, number>()
  for (const e of pkg.edges) {
    for (const n of [e.a, e.b]) {
      degree.set(n, (degree.get(n) ?? 0) + 1)
      widest.set(n, Math.max(widest.get(n) ?? 0, e.width))
      narrowest.set(n, Math.min(narrowest.get(n) ?? 99, e.width))
    }
  }

  const byNode = new Map<number, number>()   // a node → an edge arriving at it
  for (const e of pkg.edges) if (!byNode.has(e.b)) byNode.set(e.b, e.id)

  const scored: { edgeId: number; why: string; score: number }[] = []
  for (const [node, deg] of degree) {
    const edgeId = byNode.get(node)
    if (edgeId === undefined) continue
    const spread = (widest.get(node) ?? 0) - (narrowest.get(node) ?? 0)
    if (deg >= 5) scored.push({ edgeId, why: `${deg}-way junction`, score: 100 + deg * 10 + spread })
    else if (deg === 4 && spread > 5) scored.push({ edgeId, why: `crossroads, widths ${spread.toFixed(0)} m apart`, score: 80 + spread })
    else if (deg === 3 && spread > 6) scored.push({ edgeId, why: `fork off a much wider street`, score: 60 + spread })
    else if (deg === 1) scored.push({ edgeId, why: 'dead end', score: 20 })
  }
  scored.sort((a, b) => b.score - a.score)

  // spread the picks out, so eight shots are not eight views of the same corner
  const picked: Spot[] = []
  const used: { x: number; z: number }[] = []
  const at = (id: number) => {
    const e = pkg.edges.find((x) => x.id === id)!
    return { x: e.points[0], z: e.points[1] }
  }
  for (const s of scored) {
    const p = at(s.edgeId)
    if (used.some((q) => Math.hypot(q.x - p.x, q.z - p.z) < 120)) continue
    used.push(p)
    picked.push({ edgeId: s.edgeId, why: s.why })
    if (picked.length >= count) break
  }
  return picked
}

/** the whole city from the bake-private package (tools/bake-files.ts), checked fresh */
export function loadCity(id: string): CityPackage {
  return readPackage(id)
}

if (process.argv[1]?.endsWith('spots.ts')) {
  const city = process.argv[2] ?? 'san-francisco'
  for (const s of spotsFor(loadCity(city))) console.log(`  edge ${s.edgeId}  ${s.why}`)
}
