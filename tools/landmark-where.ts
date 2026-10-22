/**
 * WHERE EVERY LANDMARK IS, for the Search screen (src/ui/search.ts).
 *
 * Most manifest entries name their building by OSM id alone (`"osm": ["way/262226218"]`) — 2 197 of San Francisco's
 * 2 414 — and the game only learns where such a building is when its tile streams in. That is why the old landmark
 * search "never worked": it could only find what had already been loaded round the rider, plus the 233 entries with
 * a lat/lon of their own. This reads the whole bake once, finds every building an entry names (its outline, its
 * parts, a patched or lidar building that replaced it), and writes the centre of each as a lat/lon:
 *
 *   public/landmarks/<region>.where.json   { "bake": "...", "at": { "way/262226218": [37.78, -122.43], ... } }
 *
 * Keyed by OSM ref, so it stays right while names and styling change; an entry added since simply has no position
 * until this is run again (the Search screen lists it anyway, marked as not placed).
 *
 *   node --experimental-strip-types tools/landmark-where.ts [city] [--bake=/path/to/public/cities]
 *
 * The bake is never committed; by default it is read from this checkout's public/cities, else the main checkout's.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Projection } from '../src/city/geo.ts'
import { readManifestFile } from '../src/city/manifest.ts'
import type { MapIndex, MapTile } from '../src/map/format.ts'

const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const city = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'san-francisco'
const ROOT = resolve(import.meta.dirname, '..')
const bakeRoot = arg('bake') || [resolve(ROOT, 'public/cities'), resolve(ROOT, '../../../public/cities')]
  .find((d) => existsSync(resolve(d, city, 'v3/index.json')))
if (!bakeRoot) throw new Error(`no bake of ${city} (public/cities/${city}/v3/): npm run bake -- ${city}, or --bake=`)
const dir = resolve(bakeRoot, city, 'v3')
const m = JSON.parse(readFileSync(resolve(dir, 'index.json'), 'utf8')) as MapIndex
const region = m.region ?? city

/** the packed id a ref names: way/N → N, relation/N → 2N+1 (render/landmarks.ts packedIds) */
const packed = (ref: string): number => { const [k, n] = ref.split('/'); return k === 'relation' ? Number(n) * 2 + 1 : Number(n) }

// every building in the bake, by packed id: the sum of its centres (a building cut by a tile edge is in both)
const sum = new Map<number, { x: number; z: number; n: number }>()
const add = (ref: string | undefined, x: number, z: number): void => {
  if (!ref || ref[0] !== 'b') return
  const id = Number(ref.slice(1))
  const s = sum.get(id) ?? { x: 0, z: 0, n: 0 }
  s.x += x; s.z += z; s.n++
  sum.set(id, s)
}
for (const f of readdirSync(dir)) {
  if (!/^-?\d+_-?\d+\.json$/.test(f)) continue
  const t = JSON.parse(readFileSync(resolve(dir, f), 'utf8')) as MapTile
  const ox = t.tx * m.tile * 100
  const oy = t.ty * m.tile * 100
  for (const b of t.buildings ?? []) {
    const x = (b.cx + ox) / 100
    const z = (b.cy + oy) / 100
    add(b.ref, x, z)
    add(b.originalRef, x, z)
    for (const c of b.covers ?? []) add(c, x, z)
    for (const p of b.parts ?? []) {
      // a part has no centre of its own: the mean of its outline's nodes
      const nodes = t.ways[p.way].nodes
      let px = 0
      let pz = 0
      for (const i of nodes) { px += t.nodes[3 * i]; pz += t.nodes[3 * i + 1] }
      add(p.ref, (px / nodes.length + ox) / 100, (pz / nodes.length + oy) / 100)
    }
  }
}

const entries = await readManifestFile<{ osm?: string | string[]; name?: string; lat?: number; lon?: number }>(resolve(ROOT, 'public/landmarks', `${region}.json`))
const proj = new Projection(m.origin)
const at: Record<string, [number, number]> = {}
let missing = 0
let wanted = 0
for (const e of entries) {
  if (!e.osm || e.lat !== undefined) continue
  for (const ref of Array.isArray(e.osm) ? e.osm : [e.osm]) {
    if (ref in at) continue
    wanted++
    const s = sum.get(packed(ref))
    if (!s) { missing++; continue }
    const ll = proj.toLatLon({ x: s.x / s.n, z: s.z / s.n })
    at[ref] = [Number(ll.lat.toFixed(6)), Number(ll.lon.toFixed(6))]
  }
}
const out = resolve(ROOT, 'public/landmarks', `${region}.where.json`)
writeFileSync(out, `${JSON.stringify({ bake: m.bake ?? m.baked, at }, null, 0).replace(/],"/g, '],\n"')}\n`)
console.log(`${region}: ${wanted - missing} of ${wanted} OSM refs placed from the ${m.bake ?? m.baked} bake (${missing} not in it) → ${out}`)
