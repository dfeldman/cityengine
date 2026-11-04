/**
 * Can the shipped bike graph reach Versailles? Dijkstra over public/cities/<city>/v3/ride-bike.json from a start
 * in Paris to each target, printing the ride km and how far the nearest graph node is from each point.
 *   node --experimental-strip-types tools/versailles/route-check.ts [dir]
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { unpackRide, type RideFile } from '../../src/city/ridefile.ts'
import { Projection } from '../../src/city/geo.ts'
import { city } from '../cities.ts'

const dir = process.argv[2] ?? 'public/cities/paris-centre/v3'
const g = unpackRide(JSON.parse(readFileSync(resolve(dir, 'ride-bike.json'), 'utf8')) as RideFile)
const proj = new Projection(city('paris-centre').centre)

// node positions from edge ends
const pos = new Map<number, { x: number; z: number }>()
const adj = new Map<number, [number, number][]>()
for (const e of g.edges.values()) {
  pos.set(e.a, e.points[0]); pos.set(e.b, e.points[e.points.length - 1])
  ;(adj.get(e.a) ?? adj.set(e.a, []).get(e.a)!).push([e.b, e.length])
  ;(adj.get(e.b) ?? adj.set(e.b, []).get(e.b)!).push([e.a, e.length])
}
const nearest = (lat: number, lon: number): [number, number] => {
  const p = proj.toLocal({ lat, lon })
  let best = -1, d = Infinity
  for (const [id, q] of pos) { const k = Math.hypot(q.x - p.x, q.z - p.z); if (k < d) { d = k; best = id } }
  return [best, d]
}
function dijkstra(src: number): Map<number, number> {
  const dist = new Map([[src, 0]]), heap: [number, number][] = [[0, src]]
  while (heap.length) {
    let bi = 0
    for (let i = 1; i < heap.length; i++) if (heap[i][0] < heap[bi][0]) bi = i
    const [d, n] = heap[bi]; heap[bi] = heap[heap.length - 1]; heap.pop()
    if (d > (dist.get(n) ?? Infinity)) continue
    for (const [m, w] of adj.get(n) ?? []) if (d + w < (dist.get(m) ?? Infinity)) { dist.set(m, d + w); heap.push([d + w, m]) }
  }
  return dist
}
const START: [string, number, number] = ['Boulogne, Pont de Saint-Cloud east end', 48.8430, 2.2290]
const TARGETS: [string, number, number][] = [
  ['Palais-Royal', 48.8635, 2.3370],
  ['Domaine de Saint-Cloud, Grande Cascade', 48.8389, 2.2134],
  ['Ville-d\'Avray, the étangs', 48.8247, 2.1720],
  ['Place d\'Armes', 48.8044, 2.1269],
  ['Cathédrale Saint-Louis', 48.7998, 2.1259],
  ['Grand Trianon', 48.8148, 2.1050],
  ['the Hameau', 48.8172, 2.1100],
  ['Grand Canal, west end', 48.8130, 2.0880],
]
const [s, sd] = nearest(START[1], START[2])
const dist = dijkstra(s)
console.log(`graph: ${g.edges.size} edges, ${pos.size} nodes; from ${START[0]} (node ${sd.toFixed(0)} m off) ${dist.size} nodes reachable`)
let fail = 0
for (const [n, lat, lon] of TARGETS) {
  const [t, td] = nearest(lat, lon)
  const km = dist.get(t)
  if (km === undefined || td > 150) fail++
  console.log(`${km === undefined ? 'UNREACHABLE' : (km / 1000).toFixed(1).padStart(6) + ' km'}  ${n} (nearest node ${td.toFixed(0)} m)`)
}
process.exit(fail ? 1 : 0)
