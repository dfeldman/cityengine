/**
 * JUNCTION SHAPE (owner, 2026-10-14: "the paths at 4-way intersections; often several of the paths are zigzaggy, not
 * meeting perpendicularly, and this throws the user off every time ... As a general principle paths shouldn't take
 * sharp turns right before a crossing"). Builds the ride graph exactly as the game does and, at every junction of
 * three or four ways, measures each approach over its last APPROACH metres:
 *
 *   stray  how far the path wanders off the straight chord from that point to the junction (m)
 *   bend   the sharpest turn between consecutive segments within it (degrees)
 *
 * and, for each pair of opposite approaches (a street running through), how far their chords are from one straight
 * line (degrees off 180). A junction is ZIGZAG when an approach strays more than STRAY m or bends more than BEND
 * degrees.
 *   node --experimental-strip-types tools/junctions.ts [city] [--list]
 */
import { rideGraph } from '../src/city/ridegraph.ts'
import { unpackPoints } from '../src/city/package.ts'
import type { CityGraph, Edge } from '../src/city/graph.ts'
import { Terrain } from '../src/city/terrain.ts'
import { Projection } from '../src/city/geo.ts'
import { RIDE_OVERRIDES } from '../src/city/overrides.ts'
import { readPackage } from './bake-files.ts'
import { APPROACH, approachShape } from '../src/city/junction-shape.ts'
import { Carriageways } from '../src/city/carriageways.ts'

const city = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'san-francisco'
const list = process.argv.includes('--list')
const STRAY = 0.75
const BEND = 20

const pkg = readPackage(city)
const terrain = new Terrain(pkg.terrain)
const proj = new Projection(pkg.origin)
const edges: Edge[] = pkg.edges.map((e) => {
  const points = unpackPoints(e.points)
  let length = 0
  for (let i = 1; i < points.length; i++) length += Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z)
  return { id: e.id, a: e.a, b: e.b, points, length, surface: e.surface, width: e.width, walk: e.walk, name: e.name,
    foot: e.foot, crossing: e.crossing, heights: e.heights, kind: e.kind, service: e.service, oneway: e.oneway,
    layer: e.layer, bridge: e.bridge, tunnel: e.tunnel, passage: e.passage }
})
const g: CityGraph = rideGraph(edges, 'bike', {
  roundabouts: ((RIDE_OVERRIDES[city] ?? RIDE_OVERRIDES[pkg.region ?? ''])?.roundabouts ?? []).map((r) => {
    const p = proj.toLocal({ lat: r.lat, lon: r.lon })
    return { name: r.name, r: r.r, R: r.R, x: p.x, z: p.z }
  }),
  heightAt: (x, z) => terrain.heightAt(x, z),
  ground: (x, z) => terrain.heightAt(x, z),
  buildings: pkg.buildings.filter((b) => (b.minHeight ?? 0) < 2).map((b) => b.ring),
  // --raw: the graph as the passes leave it, before `straightenJunctions`
  straighten: !process.argv.includes('--raw'),
})
const ll = (x: number, z: number): string => { const q = proj.toLatLon({ x, z }); return `${q.lat.toFixed(6)}, ${q.lon.toFixed(6)}` }

// the drawn streets, to tell a kink in the street itself (OSM's) from one the ride graph's own passes made
const drawn = new Carriageways(pkg.edges.filter((e) => !e.foot && !e.tunnel && !e.bridge))
/** how far the approach's span strays from the drawn streets' centrelines, sampled every metre */
const offDrawn = (pts: { x: number; z: number }[]): number => {
  let worst = 0
  for (let i = 1; i < pts.length; i++) {
    const L = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)
    for (let d = 0; d <= L; d += 1) {
      const t = L > 0 ? d / L : 0
      const x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, z = pts[i - 1].z + (pts[i].z - pts[i - 1].z) * t
      const near = drawn.near(x, z)
      worst = Math.max(worst, near.length ? Math.min(...near.map((n) => n.d)) : 99)
    }
  }
  return worst
}

let junctions = 0
const bucket = { repairable: 0, corner: 0, skewed: 0 }
const cause = { pipeline: 0, osm: 0 }
const worst: { at: string; why: string; score: number }[] = []
const strays: number[] = []
const through: number[] = []
for (const n of g.nodes.values()) {
  if (n.edges.length < 3 || n.edges.length > 4) continue
  // streets only: a footway or a path may really turn just short of where it meets another
  if (n.edges.some((id) => g.edges.get(id)!.foot)) continue
  const es = n.edges.map((id) => g.edges.get(id)!)
  const shapes = es.map((e) => approachShape(e, n.id))
  if (shapes.some((s) => s === null)) continue
  junctions++
  // the best straight-through pair: a junction whose streets do not run through near-straight is "much more
  // complicated" (the owner) and is listed apart, not judged
  let best = 180
  for (let i = 0; i < shapes.length; i++) for (let j = i + 1; j < shapes.length; j++) {
    const a = shapes[i]!, b = shapes[j]!
    const off = 180 - (Math.acos(Math.max(-1, Math.min(1, a.dx * b.dx + a.dz * b.dz))) * 180) / Math.PI
    best = Math.min(best, off)
    if (off < 25) through.push(off)
  }
  if (best > 15) { bucket.skewed++; continue }
  let kind: 'repairable' | 'corner' | null = null
  const why: string[] = []
  let score = 0
  for (let k = 0; k < shapes.length; k++) {
    const s = shapes[k]!
    // (an unnamed link under 40 m is the pipeline's own diagonal — across a split boulevard, a service mouth)
    if (!es[k].name && es[k].length < 40) continue
    strays.push(s.stray)
    if (s.stray <= STRAY && s.bend <= BEND) continue
    const corner = s.bend > 60 || s.stray > 4
    if (corner) kind = 'corner'
    else kind ??= 'repairable'
    const off = offDrawn(s.pts)
    if (!corner) { if (off > 1) cause.pipeline++; else cause.osm++ }
    score = Math.max(score, s.stray + s.bend / 20)
    why.push(`${s.name ?? '?'} strays ${s.stray.toFixed(1)} m, bends ${s.bend.toFixed(0)}°, off the drawn street ${off.toFixed(1)} m${corner ? ' (corner)' : ''}`)
  }
  if (kind) { bucket[kind]++; worst.push({ at: ll(n.at.x, n.at.z), why: why.join('; '), score: kind === 'repairable' ? score + 100 : score }) }
}
worst.sort((p, q) => q.score - p.score)
const q = (a: number[], f: number): number => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(f * (s.length - 1))] ?? 0 }
console.log(`${city}: ${junctions} street junctions of 3-4 ways (last ${APPROACH} m of each approach)`)
console.log(`  repairable zigzag (stray ${STRAY}-4 m or bend ${BEND}-60°): ${bucket.repairable} junctions — approaches off the drawn street (the ride graph's own kink): ${cause.pipeline}, on it (the street's): ${cause.osm}`)
console.log(`  real corners (bend > 60° or stray > 4 m): ${bucket.corner}; skewed (no through pair within 15°), not judged: ${bucket.skewed}`)
console.log(`  approach stray: median ${q(strays, 0.5).toFixed(2)} m, 90% ${q(strays, 0.9).toFixed(2)} m, 99% ${q(strays, 0.99).toFixed(2)} m`)
console.log(`  through streets, degrees off straight: median ${q(through, 0.5).toFixed(1)}, 90% ${q(through, 0.9).toFixed(1)}, 99% ${q(through, 0.99).toFixed(1)}`)
for (const w of worst.slice(0, list ? 300 : 14)) console.log(`  ${w.at}  ${w.why}`)
