/**
 * Star junctions (BUGS.md #40): ride-graph nodes where the rider has more than three ways on, and what makes
 * them — for untangling. Lists the count by degree and the worst `--n` with their arms (name, kind, length).
 *   node --experimental-strip-types tools/stars.ts [city] [--n=20]
 */
import { readFileSync } from 'node:fs'
import { unpackRide, type RideFile } from '../src/city/ridefile.ts'
import { rideExits } from '../src/city/ridegraph.ts'
import { Projection } from '../src/city/geo.ts'
const city = process.argv[2]?.startsWith('--') ? 'paris-centre' : (process.argv[2] ?? 'paris-centre')
const n = Number((process.argv.find((a) => a.startsWith('--n=')) ?? '--n=20').slice(4))
const index = JSON.parse(readFileSync(`public/cities/${city}/index.json`, 'utf8'))
const g = unpackRide(JSON.parse(readFileSync(`public/cities/${city}/ride-bike.json`, 'utf8')) as RideFile)
const proj = new Projection(index.origin)
const byDeg = new Map<number, number>()
const stars: { id: number; exits: number; arms: string[] }[] = []
for (const [id, node] of g.nodes) {
  // the most choices offered arriving from any arm
  let most = 0
  for (const arr of node.edges) most = Math.max(most, rideExits(g, id, arr).length)
  byDeg.set(most, (byDeg.get(most) ?? 0) + 1)
  if (most >= 4) stars.push({ id, exits: most, arms: node.edges.map((eid) => { const e = g.edges.get(eid)!; return `${e.name ?? '(' + e.kind + ')'} ${Math.round(e.length)}m` }) })
}
console.log('choices at a junction → nodes:', [...byDeg].sort((a, b) => a[0] - b[0]).map(([d, c]) => `${d}:${c}`).join('  '))
stars.sort((a, b) => b.exits - a.exits)
for (const s of stars.slice(0, n)) {
  const at = proj.toLatLon(g.nodes.get(s.id)!.at)
  console.log(`${at.lat.toFixed(6)}, ${at.lon.toFixed(6)}  ${s.exits} choices  ${s.arms.join(' | ')}`)
}
