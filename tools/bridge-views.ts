/**
 * A side view of every named bridge (BUGS.md #37), written into views/<city>.json as group "bridge": from the
 * river, off one side of the outline's long axis, looking at its middle — the arches, piers and parapet in
 * one frame. Replaces the group each run.
 *   node --experimental-strip-types tools/bridge-views.ts [city]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Projection } from '../src/city/geo.ts'
import { unpackPoints } from '../src/city/package.ts'
import { axisOf } from '../src/city/bridge-axis.ts'
import { readPackage } from './bake-files.ts'

const city = process.argv[2] ?? 'paris-centre'
const ROOT = resolve(import.meta.dirname, '..')
// the bridges from the bake-private package (tools/bake-files.ts), checked fresh
const pkg = readPackage(city)
const proj = new Projection(pkg.origin)
const file = resolve(ROOT, 'views', `${city}.json`)
const views = (JSON.parse(readFileSync(file, 'utf8')) as { group?: string }[]).filter((v) => v.group !== 'bridge')
const seen = new Set<string>()
const r6 = (n: number): number => Math.round(n * 1e6) / 1e6
for (const b of (pkg.bridges ?? []).filter((q) => q.name)) {
  const ax = axisOf(unpackPoints(b.ring))
  if (!ax || ax.L < 40) continue
  const name = seen.has(b.name!) ? `${b.name} (${b.id})` : b.name!
  seen.add(b.name!)
  const c = { x: ax.o.x + ax.ux * ax.L / 2, z: ax.o.z + ax.uz * ax.L / 2 }
  const off = Math.max(60, ax.L * 0.75)
  const from = proj.toLatLon({ x: c.x - ax.uz * off + ax.ux * ax.L * 0.12, z: c.z + ax.ux * off + ax.uz * ax.L * 0.12 })
  const to = proj.toLatLon(c)
  views.push({ name: `${name} — side`, group: 'bridge', from: [r6(from.lat), r6(from.lon), 9], to: [r6(to.lat), r6(to.lon), -3] } as never)
}
writeFileSync(file, JSON.stringify(views, null, 1) + '\n')
console.log(`${views.filter((v) => v.group === 'bridge').length} bridge views → ${file}`)
