import { readFileSync } from 'node:fs'
import { Projection } from '../src/city/geo.ts'
const pkg = JSON.parse(readFileSync('public/cities/paris-centre.json', 'utf8'))
const proj = new Projection(pkg.origin)
const [lat, lon, R] = process.argv.slice(2).map(Number)
const c = proj.toLocal({ lat, lon })
const out: string[] = []
for (const b of pkg.buildings) {
  let cx = 0, cz = 0; const n = b.ring.length / 2
  for (let i = 0; i < b.ring.length; i += 2) { cx += b.ring[i]; cz += b.ring[i + 1] }
  const d = Math.hypot(cx / n - c.x, cz / n - c.z)
  if (d < R) { console.log(b.id % 2 ? `relation/${(b.id - 1) / 2}` : `way/${b.id}`, Math.round(d), b.height, b.minHeight, b.roof, n); out.push(b.id % 2 ? `relation/${(b.id - 1) / 2}` : `way/${b.id}`) }
}
console.log(JSON.stringify(out))
