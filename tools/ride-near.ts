/**
 * The bike ride edges near a point: name, kind, length, and how nearly parallel they run to each other —
 * for "the paths here make no sense" (BUGS.md #27, #28).
 *   node --experimental-strip-types tools/ride-near.ts --city=paris-centre --at=48.865169,2.298839 [--r=90]
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { shippedDir } from './bake-files.ts'
import { unpackRide, type RideFile } from '../src/city/ridefile.ts'
import { Projection } from '../src/city/geo.ts'
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const city = arg('city', 'paris-centre')
// the shipped files, as the game reads them: the v3 index (only its origin is needed) and the bike ride graph
const index = JSON.parse(readFileSync(resolve(shippedDir(city), 'index.json'), 'utf8')) as { origin: { lat: number; lon: number } }
const g = unpackRide(JSON.parse(readFileSync(resolve(shippedDir(city), 'ride-bike.json'), 'utf8')) as RideFile)
const [lat, lon] = arg('at').split(',').map(Number)
const p = new Projection(index.origin).toLocal({ lat, lon })
const R = Number(arg('r', '90'))
const near = [...g.edges.values()].filter((e) => e.points.some((q) => Math.hypot(q.x - p.x, q.z - p.z) < R))
for (const e of near) {
  const a = e.points[0], b = e.points[e.points.length - 1]
  const brg = ((Math.atan2(b.x - a.x, b.z - a.z) * 180) / Math.PI + 360) % 180
  console.log(`${String(e.id).padEnd(8)} ${(e.name ?? '-').slice(0, 34).padEnd(34)} ${(e.kind ?? '').padEnd(12)} ${e.foot ? 'foot' : '    '} ${String(Math.round(e.length)).padStart(4)} m  axis ${Math.round(brg)}°  over ${e.over.length}`)
}
console.log(`${near.length} ride edges within ${R} m`)
