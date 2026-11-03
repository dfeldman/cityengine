/**
 * Paris's children's carousels (owner, 2026-11-03: "around 15 small children's carousels… interesting street texture"): every
 * `attraction=carousel` OSM maps in the box, as a turning `parisManege` entry (render/landmarks/paris/carousels.ts) in
 * public/landmarks/paris/carousels.json. Reads the local extract with osmium (tools/cache/osm/ile-de-france-latest.osm.pbf),
 * writes nothing else.
 *
 * - an outline (a way) is placed at its centre and sized by its own breadth; a point, which says nothing of size, takes 7 m;
 * - a point within 12 m of an outline is the same carousel mapped twice, and gives way to it;
 * - a carousel already modelled by hand (the Ranelagh's, Square Boucicaut's, the Jardin d'Acclimatation's Grand Carrousel:
 *   any entry within 25 m whose builder or name says carousel) is left to its own model.
 *
 *   node --experimental-strip-types tools/paris-carousels.ts
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const PBF = join(ROOT, 'tools/cache/osm/ile-de-france-latest.osm.pbf')
const OUT = join(ROOT, 'public/landmarks/paris/carousels.json')
// the paris-centre box, a little inside the bake's own (tools/cities.ts)
const BOX = { s: 48.815, n: 48.905, w: 2.25, e: 2.42 }
const M_LAT = 111320, M_LON = 73228

interface Found { lat: number; lon: number; d: number; id: string; name?: string; way: boolean }

const dir = mkdtempSync(join(tmpdir(), 'paris-carousels-'))
const found: Found[] = []
try {
  execFileSync('osmium', ['tags-filter', '-O', '-o', join(dir, 'c.osm.pbf'), PBF, 'nwr/attraction=carousel'], { stdio: 'pipe' })
  execFileSync('osmium', ['export', '-O', '-a', 'type,id', '-f', 'geojsonseq', '-o', join(dir, 'c.geojsonseq'), join(dir, 'c.osm.pbf')], { stdio: 'pipe' })
  for (const raw of readFileSync(join(dir, 'c.geojsonseq'), 'utf8').split('\n')) {
    const line = raw.replace(/^\x1e/, '').trim()
    if (!line) continue
    const g = JSON.parse(line) as { geometry: { type: string; coordinates: unknown }; properties: Record<string, string> }
    const t = g.properties
    const id = `${t['@type']}/${t['@id']}`
    // a closed way comes out as its polygon and its line: the polygon only
    if (g.geometry.type === 'LineString') continue
    let pts: [number, number][]
    if (g.geometry.type === 'Point') pts = [g.geometry.coordinates as [number, number]]
    else pts = (g.geometry.coordinates as [number, number][][][]).flat(2) as unknown as [number, number][]
    const lon = pts.reduce((s, p) => s + p[0], 0) / pts.length
    const lat = pts.reduce((s, p) => s + p[1], 0) / pts.length
    if (lat < BOX.s || lat > BOX.n || lon < BOX.w || lon > BOX.e) continue
    const xs = pts.map((p) => p[0] * M_LON), zs = pts.map((p) => p[1] * M_LAT)
    const d = pts.length > 1 ? Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs)) : 7
    if (found.some((f) => f.id === id)) continue
    found.push({ lat, lon, d, id, name: t.name, way: pts.length > 1 })
  }
} finally {
  rmSync(dir, { recursive: true, force: true })
}

const metres = (a: { lat: number; lon: number }, b: { lat: number; lon: number }): number =>
  Math.hypot((a.lon - b.lon) * M_LON, (a.lat - b.lat) * M_LAT)

// the carousels already modelled, from every Paris manifest file
const modelled: { lat: number; lon: number }[] = []
for (const f of readdirSync(join(ROOT, 'public/landmarks/paris'))) {
  if (!f.endsWith('.json') || f === 'carousels.json') continue
  const list = JSON.parse(readFileSync(join(ROOT, 'public/landmarks/paris', f), 'utf8')) as { name?: string; procedural?: string; lat?: number; lon?: number }[]
  if (!Array.isArray(list)) continue
  for (const e of list) {
    if (e.lat === undefined || e.lon === undefined) continue
    if (/manege|carrousel/i.test(e.procedural ?? '') || /carousel|carrousel|manège/i.test(e.name ?? '')) modelled.push({ lat: e.lat, lon: e.lon })
  }
}

const ways = found.filter((f) => f.way)
// (and of two outlines whose carousels would stand in each other — the ride inside its fenced enclosure — the larger)
const clash = (a: Found, b: Found): boolean => metres(a, b) < a.d / 2 + b.d / 2 + 2
const keep = found.filter((f) => (f.way || !ways.some((w) => metres(w, f) < 12)) && !modelled.some((m) => metres(m, f) < 25)
  && !(f.way && ways.some((w) => w !== f && (w.d > f.d || (w.d === f.d && w.id < f.id)) && clash(w, f))))
keep.sort((a, b) => a.lat - b.lat || a.lon - b.lon)
const entries = keep.map((f) => {
  const d = Math.round(Math.max(5, Math.min(11, f.d)) * 10) / 10
  return {
    name: f.name ? `Carousel: ${f.name}` : `Carousel (${f.id})`,
    procedural: 'parisManege',
    lat: Math.round(f.lat * 1e6) / 1e6,
    lon: Math.round(f.lon * 1e6) / 1e6,
    size: [d, d],
    height: 6,
    front: 0,
    kind: 'monument',
    shadow: false,
    sign: false,
    note: `OSM ${f.id}, attraction=carousel; ${f.way ? 'sized by its outline' : 'a point: 7 m'} (tools/paris-carousels.ts).`,
    madeBy: 'claude-opus-5-5',
  }
})
writeFileSync(OUT, JSON.stringify(entries, null, 2) + '\n')
console.log(`${found.length} carousels mapped in the box, ${modelled.length} modelled already, ${entries.length} written to ${OUT}`)
