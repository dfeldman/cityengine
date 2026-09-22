/**
 * Audit the ride graph for the glitches riders hit: dead ends inside the city (not at its edge), ride edges
 * that pass through buildings, and hairpins within an edge. Built exactly as the game builds it.
 *   node --experimental-strip-types tools/audit-ride.ts [city] [--list]
 */
import { readFileSync } from 'node:fs'
import { rideGraph, rideExits } from '../src/city/ridegraph.ts'
import { unpackPoints, type CityPackage } from '../src/city/package.ts'
import type { Edge } from '../src/city/graph.ts'
import { Terrain } from '../src/city/terrain.ts'
import { Projection } from '../src/city/geo.ts'
import { RIDE_OVERRIDES } from '../src/city/overrides.ts'

const city = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'paris-marais'
const list = process.argv.includes('--list')
const pkg = JSON.parse(readFileSync(`public/cities/${city}.json`, 'utf8')) as CityPackage
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
const g = rideGraph(edges, 'bike', {
  roundabouts: ((RIDE_OVERRIDES[city] ?? RIDE_OVERRIDES[pkg.region ?? ''])?.roundabouts ?? []).map((r) => {
    const p = proj.toLocal({ lat: r.lat, lon: r.lon })
    return { name: r.name, r: r.r, R: r.R, x: p.x, z: p.z }
  }),
  heightAt: (x, z) => terrain.heightAt(x, z),
  buildings: pkg.buildings.filter((b) => (b.minHeight ?? 0) < 2).map((b) => b.ring),
})
const R = pkg.radius
const B = pkg.box ?? { x0: -R, x1: R, z0: -R, z1: R }
const ll = (x: number, z: number): string => { const q = proj.toLatLon({ x, z }); return `${q.lat.toFixed(6)}, ${q.lon.toFixed(6)}` }

// dead ends away from the box's edge
const dead: string[] = []
for (const n of g.nodes.values()) {
  if (n.edges.length !== 1) continue
  if (n.at.x < B.x0 + 40 || n.at.x > B.x1 - 40 || n.at.z < B.z0 + 40 || n.at.z > B.z1 - 40) continue
  const e = g.edges.get(n.edges[0])!
  dead.push(`${ll(n.at.x, n.at.z)}  ${e.name ?? '(unnamed ' + (e.kind ?? '') + ')'}  ${Math.round(e.length)} m`)
}

// ride edges through buildings: sampled every 2 m, a run of 4 m or more inside one footprint
const rings = pkg.buildings.filter((b) => (b.minHeight ?? 0) < 2).map((b) => {
  const r = b.ring
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (let i = 0; i < r.length; i += 2) { x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); z0 = Math.min(z0, r[i + 1]); z1 = Math.max(z1, r[i + 1]) }
  return { r, x0, x1, z0, z1, id: b.id }
})
const grid = new Map<string, typeof rings>()
for (const b of rings) for (let gx = Math.floor(b.x0 / 50); gx <= Math.floor(b.x1 / 50); gx++) for (let gz = Math.floor(b.z0 / 50); gz <= Math.floor(b.z1 / 50); gz++) {
  const k = `${gx},${gz}`; (grid.get(k) ?? grid.set(k, []).get(k)!).push(b)
}
const inside = (x: number, z: number, r: number[]): boolean => {
  let o = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) o = !o
  }
  return o
}
// the map's passages (arches, covered ways), whose points are inside buildings by definition
const passagePts: { x: number; z: number }[] = []
for (const e of edges) if (e.passage) for (let i = 1; i < e.points.length; i++) {
  const a = e.points[i - 1], b = e.points[i]
  const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 1.5))
  for (let k = 0; k <= n; k++) passagePts.push({ x: a.x + ((b.x - a.x) * k) / n, z: a.z + ((b.z - a.z) * k) / n })
}
const onPassage = (x: number, z: number): boolean => passagePts.some((p) => Math.abs(p.x - x) < 3 && Math.abs(p.z - z) < 3)
const through: string[] = []
for (const e of g.edges.values()) {
  // a passage goes through its building by definition (drawn as an arch, render/passages.ts)
  if (e.bridge || e.tunnel || (e as { passage?: boolean }).passage) continue
  let run = 0
  let worst = 0
  let at = { x: 0, z: 0 }
  for (let i = 1; i < e.points.length; i++) {
    const a = e.points[i - 1]
    const b = e.points[i]
    const seg = Math.hypot(b.x - a.x, b.z - a.z)
    for (let s = 0; s < seg; s += 2) {
      const x = a.x + ((b.x - a.x) * s) / seg
      const z = a.z + ((b.z - a.z) * s) / seg
      const hit = !onPassage(x, z) && (grid.get(`${Math.floor(x / 50)},${Math.floor(z / 50)}`) ?? []).some((q) => x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1 && inside(x, z, q.r))
      run = hit ? run + 2 : 0
      if (run > worst) { worst = run; at = { x, z } }
    }
  }
  if (worst >= 4) through.push(`${ll(at.x, at.z)}  ${e.name ?? '(unnamed ' + (e.kind ?? '') + ')'}  ${worst} m inside  ride edge ${e.id}${e.over.length === 0 ? ' (synthetic)' : ''}`)
}

// junctions with a choice
let choices = 0
for (const [id, n] of g.nodes) if (n.edges.some((arr) => rideExits(g, id, arr).length >= 2)) choices++

console.log(`${city}: ${g.edges.size} ride edges, ${choices} junctions with a choice`)
console.log(`  dead ends inside the city: ${dead.length}`)
console.log(`  ride edges passing through buildings: ${through.length}`)
if (list) {
  console.log('\n-- dead ends'); for (const d of dead.slice(0, 60)) console.log('  ' + d)
  console.log('\n-- through buildings'); for (const t of through.sort().slice(0, 60)) console.log('  ' + t)
}
