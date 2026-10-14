/**
 * Every leg of every preplanned route (src/city/scenic.ts) must have a route on the baked ride graph, and the
 * waypoints must be near it (within 200 m: a stop may be a monument, and the leg ends at the nearest street).
 *   node --experimental-strip-types tools/check-scenic.ts [city]
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { shippedDir } from './bake-files.ts'
import { unpackRide, type RideFile } from '../src/city/ridefile.ts'
import { Projection } from '../src/city/geo.ts'
import { SCENIC } from '../src/city/scenic.ts'
import { nearestOnGraph, planRoute } from '../src/sim/route.ts'
const city = process.argv[2] ?? 'paris-centre'
// the shipped files, as the game reads them: the v3 index (origin, region) and the bike ride graph
const index = JSON.parse(readFileSync(resolve(shippedDir(city), 'index.json'), 'utf8'))
const g = unpackRide(JSON.parse(readFileSync(resolve(shippedDir(city), 'ride-bike.json'), 'utf8')) as RideFile)
const proj = new Projection(index.origin)
let bad = 0
for (const r of SCENIC[index.region] ?? []) {
  let total = 0
  const pts = r.waypoints.map(([lat, lon]) => proj.toLocal({ lat, lon }))
  for (let i = 0; i < pts.length; i++) {
    const n = nearestOnGraph(g, pts[i])!
    if (n.d > 200) { console.log(`  ${r.name}: stop ${i + 1} is ${Math.round(n.d)} m from the ride graph`); bad++ }
  }
  for (let i = 1; i < pts.length; i++) {
    const s = nearestOnGraph(g, pts[i - 1])!
    const route = planRoute(g, { edgeId: s.edgeId, s: s.s, reversed: false }, pts[i])
    if (!route) { console.log(`  ${r.name}: no route from stop ${i} to ${i + 1}`); bad++; continue }
    total += route.length
  }
  console.log(`${r.name}: ${pts.length} stops, ${(total / 1000).toFixed(1)} km`)
}
process.exit(bad ? 1 : 0)
