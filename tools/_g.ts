import { Projection } from '../src/city/geo.ts'
import { readPackage } from './bake-files.ts'
// the bake-private package (tools/bake-files.ts), checked fresh
const pkg = readPackage('paris-centre')
const proj = new Projection(pkg.origin)
const [lat, lon, R] = process.argv.slice(2).map(Number)
const c = proj.toLocal({ lat, lon })
const out: string[] = []
for (const b of pkg.buildings) {
  let cx = 0, cz = 0; const n = b.ring.length / 2
  for (let i = 0; i < b.ring.length; i += 2) { cx += b.ring[i]; cz += b.ring[i + 1] }
  const d = Math.hypot(cx / n - c.x, cz / n - c.z)
  if (d < R) { { const q = proj.toLatLon({ x: cx / n, z: cz / n }); console.log(b.id % 2 ? `relation/${(b.id - 1) / 2}` : `way/${b.id}`, Math.round(d), b.height, b.minHeight, b.roof, b.style, n, `${q.lat.toFixed(6)},${q.lon.toFixed(6)}`) }; out.push(b.id % 2 ? `relation/${(b.id - 1) / 2}` : `way/${b.id}`) }
}
console.log(JSON.stringify(out))
