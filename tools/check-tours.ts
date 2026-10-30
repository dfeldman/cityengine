/**
 * Every tour (src/city/sf/tours.ts) on the baked ride graph: each stop within 200 m of it, each leg routable — and
 * each tour's length and climb, for the picker (src/ui/tour-picker.ts). With --write, the lengths and climbs go to
 * src/city/sf/tour-stats.json, which the picker reads: it is up before the city has loaded, so it cannot route.
 *   node --experimental-strip-types tools/check-tours.ts [--write] [--legs]
 *
 * The climb is the sum of the rises along the route, from the ride edges' own heights (every edge carries them) —
 * not the terrain under the line, which is sea level under a bridge deck. Rises under a metre are not counted
 * (a hysteresis), so the noise of the height samples does not add up to a hill.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { shippedDir } from './bake-files.ts'
import { unpackRide, type RideFile } from '../src/city/ridefile.ts'
import type { RideEdge, RideGraph } from '../src/city/ridegraph.ts'
import { Projection } from '../src/city/geo.ts'
import { SF_TOURS } from '../src/city/sf/tours.ts'
import { PARIS_TOURS } from '../src/city/paris/tours.ts'
import { nearestOnGraph, planRoute, type Route } from '../src/sim/route.ts'

const city = process.argv.find((a) => a.startsWith('--city='))?.slice(7) ?? 'san-francisco'
const TOURS = city === 'paris-centre' ? PARIS_TOURS : SF_TOURS
const write = process.argv.includes('--write')
const legs = process.argv.includes('--legs')
const index = JSON.parse(readFileSync(resolve(shippedDir(city), 'index.json'), 'utf8'))
const g = unpackRide(JSON.parse(readFileSync(resolve(shippedDir(city), 'ride-bike.json'), 'utf8')) as RideFile)
const proj = new Projection(index.origin)

/** an edge's heights between two distances along it (from its `a` end), in the order from → to */
function profile(e: RideEdge, from: number, to: number): number[] {
  const hs = e.heights
  if (!hs || hs.length !== e.points.length) return []
  const out: { s: number; h: number }[] = []
  let run = 0
  const lo = Math.min(from, to)
  const hi = Math.max(from, to)
  for (let i = 0; i < e.points.length; i++) {
    if (i) run += Math.hypot(e.points[i].x - e.points[i - 1].x, e.points[i].z - e.points[i - 1].z)
    if (run >= lo && run <= hi) out.push({ s: run, h: hs[i] })
  }
  if (from > to) out.reverse()
  return out.map((q) => q.h)
}

/** the heights along a route, junction by junction, from where it starts on `start` */
function heightsAlong(g: RideGraph, start: { edgeId: number; s: number }, r: Route): number[] {
  const out: number[] = []
  const first = g.edges.get(start.edgeId)!
  if (r.nodes.length === 0) {
    out.push(...profile(first, start.s, r.target.s))
    return out
  }
  // the start edge, to whichever end the route leaves by
  out.push(...profile(first, start.s, first.a === r.nodes[0] ? 0 : first.length))
  for (let i = 0; i < r.nodes.length; i++) {
    const n = r.nodes[i]
    const e = g.edges.get(r.leave.get(n)!)
    if (!e) continue
    const fromA = e.a === n
    const last = i === r.nodes.length - 1
    const to = last ? r.target.s : fromA ? e.length : 0
    out.push(...profile(e, fromA ? 0 : e.length, to))
  }
  return out
}

function climbOf(hs: number[]): { up: number; down: number } {
  let up = 0
  let down = 0
  let anchor = hs[0] ?? 0
  for (const h of hs) {
    if (h - anchor > 1) { up += h - anchor; anchor = h }
    else if (anchor - h > 1) { down += anchor - h; anchor = h }
  }
  return { up, down }
}

let bad = 0
const stats: Record<string, { km: number; climb: number; descent: number; steepest: number }> = {}
for (const t of TOURS) {
  const pts = t.stops.map((s) => proj.toLocal({ lat: s.lat, lon: s.lon }))
  for (let i = 0; i < pts.length; i++) {
    const n = nearestOnGraph(g, pts[i])!
    if (n.d > 200) { console.log(`  ${t.name}: stop ${i + 1} (${t.stops[i].name ?? 'unannounced'}) is ${Math.round(n.d)} m from the ride graph`); bad++ }
  }
  let length = 0
  let up = 0
  let down = 0
  let steepest = 0
  for (let i = 1; i < pts.length; i++) {
    const s = nearestOnGraph(g, pts[i - 1])!
    const route = planRoute(g, { edgeId: s.edgeId, s: s.s, reversed: false }, pts[i])
    if (!route) { console.log(`  ${t.name}: no route from stop ${i} to ${i + 1}`); bad++; continue }
    const c = climbOf(heightsAlong(g, s, route))
    length += route.length
    up += c.up
    down += c.down
    // the leg's average climb rate, for "steepest leg"
    if (route.length > 300) steepest = Math.max(steepest, c.up / route.length)
    if (legs) console.log(`    ${i}→${i + 1} ${t.stops[i].name ?? '·'}: ${(route.length / 1000).toFixed(2)} km, +${Math.round(c.up)} m −${Math.round(c.down)} m`
      + `${route.turnRound ? ' (turns round)' : ''}`)
  }
  stats[t.id] = { km: +(length / 1000).toFixed(1), climb: Math.round(up), descent: Math.round(down), steepest: +(steepest * 100).toFixed(1) }
  console.log(`${t.name}: ${t.stops.length} stops (${t.stops.filter((s) => s.text).length} announced), ${(length / 1000).toFixed(1)} km, `
    + `+${Math.round(up)} m / −${Math.round(down)} m, steepest leg ${(steepest * 100).toFixed(1)} %`)
}
if (write && !bad) {
  const file = city === 'paris-centre' ? '../src/city/paris/tour-stats.json' : '../src/city/sf/tour-stats.json'
  writeFileSync(resolve(import.meta.dirname, file), JSON.stringify(stats, null, 1) + '\n')
  console.log(`wrote ${file.slice(3)}`)
}
process.exit(bad ? 1 : 0)
