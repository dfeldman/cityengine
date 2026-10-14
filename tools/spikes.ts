/**
 * BUGS.md #194: the four aggregates, from the bake-private package (tools/bake-files.ts) via `rideFor` — no bake needed.
 *   node --experimental-strip-types tools/spikes.ts [city] [--list]
 */
import { readPackage } from './bake-files.ts'
import { Terrain } from '../src/city/terrain.ts'
import { mapEdges, rideFor } from '../src/city/ridefile.ts'
import { rideExits, rideStats, trunkName, type RideEdge } from '../src/city/ridegraph.ts'

import { Projection, angleDiff, bearing, distance } from '../src/city/geo.ts'

const id = process.argv[2]?.startsWith('--') ? 'san-francisco' : (process.argv[2] ?? 'san-francisco')
const list = process.argv.includes('--list')
const mode = process.argv.includes('--run') ? 'run' as const : 'bike' as const
// the whole city from the bake-private package (tools/bake-files.ts), checked fresh
const pkg = readPackage(id)
const terrain = new Terrain(pkg.terrain)
const edges = mapEdges(pkg.edges, terrain)
const proj = new Projection(pkg.origin)
const g = rideFor(pkg.id, pkg.origin, edges, mode, (x, z) => terrain.heightAt(x, z), pkg.region,
  pkg.buildings.filter((b) => (b.minHeight ?? 0) < 2).map((b) => b.ring))

const DEG = Math.PI / 180
const kinds = new Map<string, number>()
let spikes = 0
const spikeEdges = new Set<number>()
for (const e of g.edges.values()) {
  const p = e.points
  for (let i = 1; i < p.length - 1; i++) {
    if (distance(p[i - 1], p[i]) < 0.5 || distance(p[i], p[i + 1]) < 0.5) continue
    const t = Math.abs(angleDiff(bearing(p[i - 1], p[i]), bearing(p[i], p[i + 1])))
    if (t > 120 * DEG) {
      spikes++
      spikeEdges.add(e.id)
      if (list) {
        const ll = proj.toLatLon(p[i])
        const arms = `${distance(p[i-1],p[i]).toFixed(1)}/${distance(p[i],p[i+1]).toFixed(1)}m`
        kinds.set(`${e.kind}${e.foot ? ' (foot)' : ''}`, (kinds.get(`${e.kind}${e.foot ? ' (foot)' : ''}`) ?? 0) + (Math.min(distance(p[i-1],p[i]), distance(p[i],p[i+1])) < 30 ? 1 : 0))
        console.log(`  spike ${Math.round(t / DEG)}° arms ${arms} edge ${e.id} "${(e as RideEdge).name ?? '-'}" ${e.kind} len ${e.length.toFixed(0)}m at ${ll.lat.toFixed(6)}, ${ll.lon.toFixed(6)} over=${(e as RideEdge).over.length}`)
      }
    }
  }
}

if (list) console.log('by kind (min arm < 30 m):', [...kinds].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', '))
let arrivals = 0, straightOff = 0, leftStreet = 0
for (const [nid, node] of g.nodes) {
  for (const arr of node.edges) {
    arrivals++
    const xs = rideExits(g, nid, arr)
    if (xs.length === 0) continue
    const st = xs[0]
    if (Math.abs(st.angle) > 45 * DEG) straightOff++
    const nm = trunkName(g.edges.get(arr)!.name)
    if (nm && xs.some((x) => trunkName(g.edges.get(x.edgeId)!.name) === nm)
      && trunkName(g.edges.get(st.edgeId)!.name) !== nm) leftStreet++
  }
}
const st = rideStats(g)
console.log(`${id} ${mode}: spikes>120° ${spikes} on ${spikeEdges.size} edges | rawNearDuplicates ${st.rawNearDuplicates} | arrivals ${arrivals} | straight-on>45° ${straightOff} | left named street ${leftStreet} | edges ${st.edges} km ${st.km.toFixed(1)} decisions/km ${st.perKm.toFixed(2)}`)
