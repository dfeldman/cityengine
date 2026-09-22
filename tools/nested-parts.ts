/**
 * For each landmark manifest entry that replaces a building: the other buildings whose centre lies inside
 * that building's outline — parts the manifest should replace too, or they draw through the model.
 *   node --experimental-strip-types tools/nested-parts.ts [city]
 */
import { existsSync, readFileSync } from 'node:fs'
// (landmarks.ts imports Babylon, which plain node cannot load: its two helpers, restated)
type LandmarkEntry = { name: string; osm?: string | string[]; procedural?: string; file?: string; restyle?: string }
const packedIds = (e: LandmarkEntry): number[] => !e.osm ? [] : (Array.isArray(e.osm) ? e.osm : [e.osm])
  .map((ref) => { const [k, n] = ref.split('/'); return k === 'relation' ? Number(n) * 2 + 1 : Number(n) })
const entryKind = (e: LandmarkEntry): string => e.restyle ? 'restyle' : (e.procedural || e.file) && packedIds(e).length ? 'replace' : 'other'
const city = process.argv[2] ?? 'paris-marais'
const pkg = JSON.parse(readFileSync(`public/cities/${city}.json`, 'utf8'))
// the city's own manifest, else its region's (Paris's cities share public/landmarks/paris.json)
const manifestFile = [`public/landmarks/${city}.json`, `public/landmarks/${city.split('-')[0]}.json`].find((f) => existsSync(f))!
const manifest: LandmarkEntry[] = JSON.parse(readFileSync(manifestFile, 'utf8'))
const byId = new Map(pkg.buildings.map((b: { id: number }) => [b.id, b]))
const inside = (x: number, z: number, r: number[]): boolean => {
  let o = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) o = !o
  }
  return o
}
for (const e of manifest) {
  if (entryKind(e) !== 'replace') continue
  const ids = new Set(packedIds(e))
  const outline = packedIds(e).map((id) => byId.get(id)).find(Boolean) as { ring: number[] } | undefined
  if (!outline) continue
  const missing: string[] = []
  for (const b of pkg.buildings as { id: number; ring: number[]; height?: number }[]) {
    if (ids.has(b.id)) continue
    let x = 0, z = 0
    for (let i = 0; i < b.ring.length; i += 2) { x += b.ring[i]; z += b.ring[i + 1] }
    x /= b.ring.length / 2; z /= b.ring.length / 2
    if (inside(x, z, outline.ring)) missing.push(`way/${b.id} (${b.height ?? '?'} m)`)
  }
  if (missing.length) console.log(`${e.name}: ${missing.join(', ')}`)
}
