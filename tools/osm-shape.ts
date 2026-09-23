/**
 * Resolve ANY OSM way or relation to its footprint and its tags, from disk where we have already asked.
 *
 * This was inside `tools/sf-photos.ts`, which cannot be imported — it reads the queue and writes photographs
 * the moment it loads. `tools/commons.ts` needs the same lookup plus the `addr:*` tags (the bake keeps only
 * name and ring), so the lookup lives here and both tools share one copy, one cache and one set of
 * fallbacks: Overpass for a batch, the OSM API one object at a time when Overpass says 429.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')

export type Shape = {
  /** `way/123` or `relation/456`, as given */
  id: string
  tags: Record<string, string>
  /** [lat, lon] in order; a relation's OUTER member geometry concatenated */
  ring: [number, number][]
}

/** the mean of the vertices — good enough to seed a search, and what a geosearch should be centred on */
export const centroid = (ring: [number, number][]): [number, number] => [
  ring.reduce((s, p) => s + p[0], 0) / ring.length,
  ring.reduce((s, p) => s + p[1], 0) / ring.length,
]

/** metres between two lat/lon points */
export const metres = (a: [number, number], b: [number, number]): number => {
  const mLat = 111320
  const mLon = 111320 * Math.cos((a[0] * Math.PI) / 180)
  return Math.hypot((a[0] - b[0]) * mLat, (a[1] - b[1]) * mLon)
}

/** metres to the NEAREST VERTEX of the footprint, not to its centroid: a block-sized building is 100 m across */
export const metresToRing = (p: [number, number], ring: [number, number][]): number =>
  ring.length === 0 ? Infinity : Math.min(...ring.map((v) => metres(p, v)))

/** one object at a time from OSM's own API — no rate limit worth the name, and it carries the tags too */
async function fromOsmApi(ids: string[], out: Map<string, Shape>): Promise<void> {
  const cacheDir = resolve(ROOT, 'tools', 'cache', 'osm-api')
  mkdirSync(cacheDir, { recursive: true })
  for (const i of ids) {
    const [kind, num] = i.split('/')
    const file = resolve(cacheDir, `${kind}-${num}.json`)
    let text: string
    if (existsSync(file)) text = readFileSync(file, 'utf8')
    else {
      const r = await fetch(`https://api.openstreetmap.org/api/0.6/${kind}/${num}/full.json`, { headers: { 'User-Agent': 'streetrunner-ref/0.1' } })
      if (!r.ok) { console.log(`  (osm api ${r.status} for ${i})`); continue }
      text = await r.text()
      writeFileSync(file, text)
      await new Promise((ok) => setTimeout(ok, 500))
    }
    const body = JSON.parse(text) as { elements: { type: string; id: number; lat?: number; lon?: number; nodes?: number[]; members?: { type: string; ref: number; role: string }[]; tags?: Record<string, string> }[] }
    const nodes = new Map(body.elements.filter((e) => e.type === 'node').map((e) => [e.id, [e.lat!, e.lon!] as [number, number]]))
    const ways = new Map(body.elements.filter((e) => e.type === 'way').map((e) => [e.id, e]))
    const self = body.elements.find((e) => e.type === kind && e.id === Number(num))
    if (!self) continue
    const ring: [number, number][] = []
    if (kind === 'way') for (const n of self.nodes ?? []) { const p = nodes.get(n); if (p) ring.push(p) }
    // a relation's shape is on its OUTER members: the building's own walls, not a courtyard
    else for (const m of self.members ?? []) {
      if (m.type !== 'way' || m.role === 'inner') continue
      for (const n of ways.get(m.ref)?.nodes ?? []) { const p = nodes.get(n); if (p) ring.push(p) }
    }
    out.set(i, { id: i, tags: self.tags ?? {}, ring })
  }
}

/**
 * Footprint and tags for each id. Overpass first — one request for the whole batch, kept on disk — and the
 * OSM API when it refuses, which it does often enough that a single-building lookup could not be relied on.
 */
export async function resolveOsm(ids: string[]): Promise<Map<string, Shape>> {
  const out = new Map<string, Shape>()
  const want = Array.from(new Set(ids))
  if (want.length === 0) return out
  const cacheDir = resolve(ROOT, 'tools', 'cache')
  mkdirSync(cacheDir, { recursive: true })
  const file = resolve(cacheDir, `shape-${createHash('sha1').update(want.join(',')).digest('hex')}.json`)
  let body: { elements?: { type: string; id: number; tags?: Record<string, string>; geometry?: { lat: number; lon: number }[]; members?: { role?: string; geometry?: { lat: number; lon: number }[] }[] }[] }
  if (existsSync(file)) body = JSON.parse(readFileSync(file, 'utf8'))
  else {
    const ways = want.filter((i) => i.startsWith('way/')).map((i) => i.split('/')[1])
    const rels = want.filter((i) => i.startsWith('relation/')).map((i) => i.split('/')[1])
    const parts = [ways.length ? `way(id:${ways.join(',')});` : '', rels.length ? `relation(id:${rels.join(',')});` : ''].join('')
    const q = `[out:json][timeout:90];(${parts});out geom;`
    const r = await fetch('https://overpass.kumi.systems/api/interpreter', { method: 'POST', body: `data=${encodeURIComponent(q)}`, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
    const text = r.ok ? await r.text() : ''
    if (!text.startsWith('{')) {
      console.log(`  (overpass ${r.status}: falling back to the OSM API)`)
      await fromOsmApi(want, out)
      return out
    }
    writeFileSync(file, text)
    body = JSON.parse(text)
  }
  for (const e of body.elements ?? []) {
    const id = `${e.type}/${e.id}`
    const ring: [number, number][] = []
    if (e.geometry) for (const g of e.geometry) ring.push([g.lat, g.lon])
    else for (const m of (e.members ?? []).filter((m) => m.role !== 'inner' && m.geometry)) for (const g of m.geometry ?? []) ring.push([g.lat, g.lon])
    out.set(id, { id, tags: e.tags ?? {}, ring })
  }
  // anything Overpass simply did not return (a deleted or brand-new way) still gets its single-object try
  const missing = want.filter((i) => !out.has(i))
  if (missing.length > 0) await fromOsmApi(missing, out)
  return out
}
