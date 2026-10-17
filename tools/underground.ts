/**
 * STREETS UNDER THE GROUND (owner, 2026-10-16, BUGS.md #298: "more underground path here 37.790516, -122.410527" — "we
 * should do some checks for underground paths on steep hills"). Every way on the surface (not a tunnel, a bore, a cut or
 * underground layer) walked every metre against the RAW ground under it — the hillside the renderer draws round a
 * street, before any levelling — and every stretch more than `--depth` below it reported, deepest first, with the
 * street's grade there, so the steep ones are seen to be the steep ones.
 *
 *   npx tsx tools/underground.ts [city=san-francisco] [--depth=0.6] [--top=40] [--near=lat,lon,radius]
 *
 * Arithmetic on the baked package, not a render: the same heights the rider rides and the renderer draws.
 */
import { readPackage } from './bake-files.ts'
import { Projection } from '../src/city/geo.ts'
import { Terrain } from '../src/city/terrain.ts'
import { unpackPoints } from '../src/city/package.ts'

const args = process.argv.slice(2)
const city = args.find((a) => !a.startsWith('--')) ?? 'san-francisco'
const opt = (k: string): string | undefined => args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1]
const DEPTH = Number(opt('depth') ?? 0.6)
const TOP = Number(opt('top') ?? 40)
const near = opt('near')?.split(',').map(Number)

const pkg = readPackage(city)
const proj = new Projection(pkg.origin)
const terrain = new Terrain(pkg.terrain)
const centre = near ? proj.toLocal({ lat: near[0], lon: near[1] }) : null

type Hit = { id: number; name: string; depth: number; len: number; grade: number; lat: number; lon: number; foot: boolean }
const hits: Hit[] = []
let walked = 0
for (const e of pkg.edges) {
  if (!e.heights || e.tunnel || e.bore || e.cut || (e.layer ?? 0) < 0) continue
  const p = unpackPoints(e.points)
  if (centre && Math.min(...p.map((q) => Math.hypot(q.x - centre.x, q.z - centre.z))) > near![2]) continue
  // along the way every metre: how far under the raw ground, and over what length
  let run: { depth: number; len: number; at: { x: number; z: number }; grade: number } | null = null
  const flush = (): void => {
    if (run && run.len >= 2) {
      const ll = proj.toLatLon(run.at)
      hits.push({ id: e.id, name: e.name ?? e.kind, depth: run.depth, len: run.len, grade: run.grade, lat: ll.lat, lon: ll.lon, foot: !!e.foot })
    }
    run = null
  }
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1], b = p[i]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    const n = Math.max(1, Math.ceil(L))
    const grade = L > 0.5 ? Math.abs(e.heights[i] - e.heights[i - 1]) / L : 0
    for (let k = 0; k < n; k++) {
      const t = k / n
      const x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t
      const h = e.heights[i - 1] + (e.heights[i] - e.heights[i - 1]) * t
      const d = terrain.rawHeightAt(x, z) - h
      walked += L / n
      if (d > DEPTH) {
        if (!run) run = { depth: d, len: 0, at: { x, z }, grade }
        run.len += L / n
        if (d > run.depth) { run.depth = d; run.at = { x, z }; run.grade = Math.max(run.grade, grade) }
      } else flush()
    }
  }
  flush()
}
hits.sort((a, b) => b.depth * Math.sqrt(b.len) - a.depth * Math.sqrt(a.len))
const total = hits.reduce((s, h) => s + h.len, 0)
console.log(`${city}: ${(walked / 1000).toFixed(0)} km of surface ways walked; ${hits.length} stretches more than ${DEPTH} m under the ground, ${(total / 1000).toFixed(2)} km in all`)
const steep = hits.filter((h) => h.grade >= 0.1)
console.log(`  of them on grades of 10 % and more: ${steep.length} (${(steep.reduce((s, h) => s + h.len, 0) / 1000).toFixed(2)} km)`)
for (const h of hits.slice(0, TOP)) {
  console.log(`  ${String(h.id).padEnd(7)} ${h.name.padEnd(28).slice(0, 28)} ${h.foot ? 'foot' : '    '} ${h.depth.toFixed(1).padStart(5)} m deep over ${h.len.toFixed(0).padStart(3)} m, grade ${(h.grade * 100).toFixed(0).padStart(3)} % at ${h.lat.toFixed(6)}, ${h.lon.toFixed(6)}`)
}
