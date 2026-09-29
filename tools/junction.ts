/**
 * BUGS.md #52's guarantee, checked rather than assumed: a boulevard with service lanes is ONE junction.
 * Prints the ride-graph nodes within a radius of a place and the turns offered at each.
 *   node --experimental-strip-types tools/junction.ts 37.7752,-122.4234,40 [city]
 */
import { readFileSync } from 'node:fs'
import { resolve as rpath } from 'node:path'
import type { CityPackage } from '../src/city/package.ts'
import { Terrain } from '../src/city/terrain.ts'
import { mapEdges, rideFor } from '../src/city/ridefile.ts'
import { rideExits } from '../src/city/ridegraph.ts'
import { distance, Projection } from '../src/city/geo.ts'
const [lat, lon, rad] = (process.argv[2] ?? '').split(',').map(Number)
const id = process.argv.slice(3).find((a) => !a.startsWith('--')) ?? 'san-francisco'
const OUT = rpath(import.meta.dirname, '..', 'public', 'cities')
const pkg = JSON.parse(readFileSync(rpath(OUT, `${id}.json`), 'utf8')) as CityPackage
const terrain = new Terrain(pkg.terrain)
const proj = new Projection(pkg.origin)
const c = proj.toLocal({ lat, lon })
const g = rideFor(pkg.id, pkg.origin, mapEdges(pkg.edges, terrain), 'bike', (x, z) => terrain.heightAt(x, z), pkg.region,
  pkg.buildings.filter((b) => (b.minHeight ?? 0) < 2).map((b) => b.ring))
let junctions = 0
for (const [nid, n] of g.nodes) {
  if (distance(n.at, c) > rad) continue
  const names = [...new Set(n.edges.map((e) => g.edges.get(e)!.name ?? '-'))]
  const offered = n.edges.length > 2
    ? Math.max(...n.edges.map((arr) => rideExits(g, nid, arr).length)) : 0
  if (n.edges.length > 2) junctions++
  if (process.argv.includes('--exits')) {
    for (const arr of n.edges) {
      const ae = g.edges.get(arr)!
      console.log(`   arriving on e${arr} "${ae.name ?? '-'}" → ${rideExits(g, nid, arr).map((x) => `${g.edges.get(x.edgeId)!.name ?? '-'}@${Math.round((x.angle * 180) / Math.PI)}°`).join(', ') || '(nothing)'}`)
    }
  }
  console.log(`node ${nid} ${distance(n.at, c).toFixed(1)} m out, ${n.edges.length} edges, max ${offered} turns offered: ${names.join(' | ')}`)
}
console.log(`${junctions} junction node(s) within ${rad} m`)
