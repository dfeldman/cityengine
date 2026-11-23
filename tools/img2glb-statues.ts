/**
 * Places assetkit's photo-made Paris statues (tools/img2glb, ~720 models in review batches paris-001…) in the game:
 * writes public/landmarks/paris-statues-img2glb.json, which statueManifest() (src/render/statues.ts) loads beside
 * paris-statues.json. One entry per model that is in the assetmgr index assetkit-models-paris (so has a height and was
 * uploaded), not given up, not already drawn by the game, and not inside a building. Rerunning gives the same file plus
 * any newly published statues: hand fixes go in data/statues/paris-img2glb-overrides.json, never in the output.
 *
 * Per statue:
 *  - WHERE: the work's own point (OSM / Wikidata, meta.json `extra.model.location`), checked against OSM: a point a few
 *    metres inside a building wall or a carriageway is moved out onto open ground (said so in its note); one deep inside
 *    a building, or on a procedural landmark's façade, is skipped.
 *  - FACING (`bearing`): the model's +z is the side seen in the photograph it was made from (img2glb's clean stage), so
 *    the best bearing is from the statue to that photo's camera (Commons GPS, cached in tools/cache/commons-camera.json).
 *    Otherwise away from a wall right behind it, otherwise towards the nearest street or path. The method is in the note.
 *  - PEDESTAL, SIZE, MATERIAL: not written here; statues.ts reads them from the index (`extra.model.plinth`, `scale`,
 *    `material`), so the review page's values stay the one source. An override may still give `plinth`/`plinthColour`.
 *  - DOUBLES: skipped when paris-statues.json already has it (name, or within DOUBLE_M), or a procedural landmark draws it
 *    (its name, near it), or the name says it is a relief / façade piece.
 *
 *   node --experimental-strip-types tools/img2glb-statues.ts [--batch=paris-001,…] [--report=out.json] [--dry] [--preview]
 *   (--preview: every sized model counts as published, to look before an upload; use it with --dry)
 *   (--batch only narrows the report printed; the output file always holds every placeable statue)
 */
import { execFileSync } from 'node:child_process'
import { createReadStream, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { Projection } from '../src/city/geo.ts'

const ROOT = resolve(import.meta.dirname, '..')
const AK = resolve(ROOT, '..', 'assetkit')
const arg = (n: string): string | undefined => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=').slice(1).join('=')
const OUT = resolve(ROOT, 'public', 'landmarks', 'paris-statues-img2glb.json')
const OVERRIDES = resolve(ROOT, 'data', 'statues', 'paris-img2glb-overrides.json')
const CAMERA_CACHE = resolve(ROOT, 'tools', 'cache', 'commons-camera.json')
const PBF = resolve(ROOT, 'tools', 'cache', 'osm', 'ile-de-france-latest.osm.pbf')
const PARIS_BOX = '2.20,48.80,2.43,48.92'
const CELL = 100
/** paris-centre's DETAIL box (tools/cities.ts), metres from its origin on the Palais-Royal: the city is modelled only inside */
const DETAIL = { west: 8355, east: 5715, north: 4175, south: 4510 }
const UA = 'cityengine-reference/0.1 (placing statue models; low volume, serial)'

// ---- tunables
/** a paris-statues.json entry this close is the same statue */
const DOUBLE_M = 15
/** a name match with a statue entry or landmark counts within this distance */
const NAME_MATCH_M = 80
/** a small procedural landmark (largest side ≤ SMALL_LANDMARK_M) within its half-size + this draws what stands there */
const LANDMARK_NEAR_M = 4
const SMALL_LANDMARK_M = 45
/** inside a building by at most this much: moved out of the wall (OSM's point a little off); deeper: skipped (a façade
 *  piece or an interior). Not counting the statue's own outline: the cadastre maps many a monument as a `building` */
const SNAP_BUILDING_M = 1.5
/** a `building` polygon smaller than this (m²), or tagged as an artwork or monument, is a statue's or monument's own outline */
const OWN_OUTLINE_M2 = 60
/** …or, tagged as one, smaller than this (the Arc de Triomphe is a tagged monument too, and a building) */
const TAGGED_OUTLINE_M2 = 300
/** …and one of those this tall (OSM `height`, m) is a pylon or column the statue stands on top of (`raise`) */
const PYLON_M = 8
/** clearance kept from a wall or a kerb after a move */
const CLEAR_M = 0.8
/** a camera nearer or further than this gives no bearing (GPS error / long lens) */
const CAMERA_MIN_M = 4
const CAMERA_MAX_M = 350
/** …nor one with a building on the line to it within this many metres */
const SIGHT_M = 25
/** a wall this close behind the statue: it faces away from it */
const WALL_NEAR_M = 6
/** the nearest street or path, searched this far */
const STREET_NEAR_M = 60
/** LOD ranges by the model's height h: LOD0 within max(LOD0_MIN, LOD0_PER_M·h), LOD1 within max(LOD1_MIN, LOD1_PER_M·h) ≤ LOD1_MAX */
const LOD0_MIN = 30, LOD0_PER_M = 10, LOD1_MIN = 90, LOD1_PER_M = 40, LOD1_MAX = 300
/** half the carriageway of a car road with no `width` tag (m) */
const HALF_WIDTH: Record<string, number> = {
  motorway: 12, trunk: 10, primary: 8, secondary: 7, tertiary: 5.5, unclassified: 4, residential: 4, living_street: 3,
  motorway_link: 4, trunk_link: 4, primary_link: 3.5, secondary_link: 3.5, tertiary_link: 3.5, busway: 3.5, service: 2.5,
}
/** names that say the piece is not a free-standing statue (a relief, a façade figure): skipped */
const NOT_FREE = /\b(bas[- ]relief|haut[- ]relief|relief|medaillon|cariatide|atlante|fronton|facade|plaque|mascaron|frise)s?\b/
const STOP = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'l', 'd', 'a', 'au', 'aux', 'et', 'en', 'the', 'of', 'statue', 'monument', 'fontaine',
  'buste', 'saint', 'sainte', 'place', 'paris', 'square', 'jardin', 'groupe', 'sculpture', 'memorial', 'hommage'])

// ---- inputs
const proj = new Projection({ lat: 48.8605, lon: 2.332 })
type P = { x: number; z: number }
const L = (lat: number, lon: number): P => proj.toLocal({ lat, lon })
const json = <T>(p: string): T => JSON.parse(readFileSync(p, 'utf8')) as T

const batch = json<{ reviewBatches: Record<string, string[]>; items: { id: string; giveUp?: boolean }[] }>(resolve(AK, 'models/img2glb/paris.json'))
const giveUp = new Set(batch.items.filter((i) => i.giveUp).map((i) => i.id))
const batchOf = new Map<string, string>()
for (const [b, ids] of Object.entries(batch.reviewBatches)) for (const id of ids) batchOf.set(id, b)
interface Size { height?: number; plinth?: string; plinthSize?: number[]; geometry?: { bbox: number[] } }
const sizes = json<Record<string, Size>>(resolve(AK, 'models/img2glb/paris.sizes.json'))
interface IndexAsset { id: string; isDeleted?: boolean; extra?: { model?: { scale?: { metres: number }; plinth?: { state: string; size?: number[] } } } }
const indexed = new Map<string, IndexAsset>()
for (const a of json<{ assets: IndexAsset[] }>(resolve(AK, 'indexes/asset-index-assetkit-models-paris.json')).assets) {
  if (!a.isDeleted && a.extra?.model?.scale) indexed.set(a.id, a)
}
// --preview: every sized model counts as published (its sizes-file height and plinth), to check placements before an upload
if (process.argv.includes('--preview')) {
  for (const [id, s] of Object.entries(sizes)) {
    if (!indexed.has(id) && s.height) {
      indexed.set(id, { id, extra: { model: { scale: { metres: s.height }, plinth: s.plinth ? { state: s.plinth, size: s.plinthSize } : undefined } } })
    }
  }
}
interface Meta {
  name: string
  extra: { model: { location?: { lat: number; lon: number } }; img2glb: { subject?: { wikidata?: string }; image?: { imageTitle?: string; licenseFlags?: string[] } } }
}
const metaOf = (id: string): Meta | null => {
  const p = resolve(AK, 'public/img2glb/paris', id, 'meta.json')
  return existsSync(p) ? json<Meta>(p) : null
}
interface Override {
  skip?: string; keep?: boolean; bearing?: number
  /** degrees added to the bearing found: 180 for a model the review found turned backwards (its render shows the photo's other side) */
  turn?: number
  /** the photo shows the statue's back: a bearing from a wall or street (which wants the front) turns 180 */
  photo?: 'back'
  lat?: number; lon?: number; plinth?: [number, number, number]; plinthColour?: string; note?: string }
const overrides = existsSync(OVERRIDES) ? json<Record<string, Override>>(OVERRIDES) : {}

interface StatueEntry { id: string; name: string; lat?: number; lon?: number; asset?: string; model?: string; attach?: { to: string } }
const statues = json<StatueEntry[]>(resolve(ROOT, 'public/landmarks/paris-statues.json'))
interface Landmark { name: string; lat?: number; lon?: number; size?: number[]; osm?: string[]; procedural?: string }
const landmarks: Landmark[] = []
for (const f of ['paris.json', ...readdirSync(resolve(ROOT, 'public/landmarks/paris')).filter((n) => n.endsWith('.json')).map((n) => `paris/${n}`)]) {
  const d = json<unknown>(resolve(ROOT, 'public/landmarks', f))
  if (Array.isArray(d)) landmarks.push(...(d as Landmark[]))
}

const norm = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const tokens = (s: string): Set<string> => new Set(norm(s).split(' ').filter((t) => t.length > 1 && !STOP.has(t) && !/^\d+$/.test(t)))
function nameMatch(a: string, b: string): number {
  const ta = tokens(a), tb = tokens(b)
  if (!ta.size || !tb.size) return 0
  let n = 0
  for (const t of ta) if (tb.has(t)) n++
  return n / Math.min(ta.size, tb.size)
}

// ---- the candidates
const candidates: { id: string; meta: Meta; at: P; lat: number; lon: number }[] = []
const report: Record<string, { batch: string; status: string; reason?: string; note?: string }> = {}
for (const id of [...batchOf.keys()].sort()) {
  const meta = metaOf(id)
  const b = batchOf.get(id)!
  if (!meta) { report[id] = { batch: b, status: 'unmade', reason: 'no model on the Mac (not made, or not copied from ml1)' }; continue }
  if (giveUp.has(id)) { report[id] = { batch: b, status: 'skipped', reason: 'given up in review' }; continue }
  const o = overrides[id] ?? {}
  if (o.skip) { report[id] = { batch: b, status: 'skipped', reason: `override: ${o.skip}` }; continue }
  if (!indexed.has(id)) {
    const sa = (meta.extra.img2glb.image?.licenseFlags ?? []).some((f) => /share-alike/.test(f))
    report[id] = { batch: b, status: 'unpublished', reason: !sizes[id]?.height ? 'no height yet' : sa ? 'share-alike photo: waits for the licence decision' : 'not in the index yet' }
    continue
  }
  const loc = o.lat !== undefined && o.lon !== undefined ? { lat: o.lat, lon: o.lon } : meta.extra.model.location
  if (!loc) { report[id] = { batch: b, status: 'skipped', reason: 'no location' }; continue }
  const at = L(loc.lat, loc.lon)
  if (at.x < -DETAIL.west || at.x > DETAIL.east || at.z < -DETAIL.south || at.z > DETAIL.north) {
    report[id] = { batch: b, status: 'skipped', reason: loc.lon < 2.2 ? 'Versailles: out of scope for now' : 'outside the paris-centre detail box (no city modelled there)' }
    continue
  }
  candidates.push({ id, meta, at, lat: loc.lat, lon: loc.lon })
}

// ---- OSM around them: buildings (polygons), roads and paths (lines), and features named by landmark entries
interface Poly { rings: P[][]; id: string; tags: Record<string, string> }
interface Line { pts: P[]; tags: Record<string, string> }
const buildings: Poly[] = [], lines: Line[] = [], pylons: Poly[] = []
/** the buildings and lines by the 100 m cells they touch */
const grid = new Map<string, { b: Poly[]; l: Line[] }>()
function file(pts: P[], put: (g: { b: Poly[]; l: Line[] }) => void): void {
  const xs = pts.map((p) => p.x), zs = pts.map((p) => p.z)
  const seen = new Set<string>()
  for (let x = Math.floor(Math.min(...xs) / CELL); x <= Math.floor(Math.max(...xs) / CELL); x++) {
    for (let z = Math.floor(Math.min(...zs) / CELL); z <= Math.floor(Math.max(...zs) / CELL); z++) {
      const k = `${x},${z}`
      if (seen.has(k)) continue
      seen.add(k)
      if (!grid.has(k)) grid.set(k, { b: [], l: [] })
      put(grid.get(k)!)
    }
  }
}
/** what is filed in p's cell and the eight round it */
function around(p: P): { b: Poly[]; l: Line[] } {
  const b = new Set<Poly>(), l = new Set<Line>()
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const g = grid.get(cellKey(p.x + dx * CELL, p.z + dz * CELL))
    for (const x of g?.b ?? []) b.add(x)
    for (const x of g?.l ?? []) l.add(x)
  }
  return { b: [...b], l: [...l] }
}
const osmFeature = new Map<string, P[][]>()
const cellKey = (x: number, z: number): string => `${Math.floor(x / CELL)},${Math.floor(z / CELL)}`
const near = new Set<string>()
for (const c of candidates) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) near.add(cellKey(c.at.x + dx * CELL, c.at.z + dz * CELL))
const wantIds = new Set(landmarks.flatMap((l) => (l.lat === undefined ? l.osm ?? [] : [])))
if (candidates.length) {
  const dir = mkdtempSync(resolve(tmpdir(), 'i2gs-'))
  try {
    execFileSync('osmium', ['extract', '-b', PARIS_BOX, PBF, '-o', `${dir}/box.pbf`, '-s', 'smart'], { stdio: 'ignore' })
    execFileSync('osmium', ['tags-filter', `${dir}/box.pbf`, 'w/building', 'r/building', 'w/building:part', 'r/building:part', 'w/highway', 'nwr/amenity=fountain', 'nwr/historic', 'nwr/tourism=artwork', '-o', `${dir}/f.pbf`], { stdio: 'ignore' })
    execFileSync('osmium', ['export', `${dir}/f.pbf`, '-f', 'geojsonseq', '-o', `${dir}/f.geojsonseq`, '-a', 'type,id'], { stdio: 'ignore' })
    const rl = createInterface({ input: createReadStream(`${dir}/f.geojsonseq`) })
    for await (const raw of rl) {
      const line = raw.replace(/^\x1e/, '')
      if (!line) continue
      const f = JSON.parse(line) as { geometry: { type: string; coordinates: unknown }; properties: Record<string, string | number> }
      const g = f.geometry
      const tags = f.properties as Record<string, string>
      const oid = `${tags['@type']}/${tags['@id']}`
      const toP = (c: number[]): P => L(c[1], c[0])
      let rings: P[][] = []
      if (g.type === 'Polygon') rings = (g.coordinates as number[][][]).map((r) => r.map(toP))
      else if (g.type === 'MultiPolygon') rings = (g.coordinates as number[][][][]).flat().map((r) => r.map(toP))
      else if (g.type === 'LineString') rings = [(g.coordinates as number[][]).map(toP)]
      else if (g.type === 'Point') rings = [[toP(g.coordinates as number[])]]
      if (!rings.length || !rings[0].length) continue
      const owned = wantIds.has(oid) || wantIds.has(oid.replace(/^way/, 'way'))
      const hit = rings.some((r) => r.some((p) => near.has(cellKey(p.x, p.z))))
      if (owned) osmFeature.set(oid, rings)
      if (!hit) continue
      if (tags.building && (g.type === 'Polygon' || g.type === 'MultiPolygon')) {
        if (tags.layer && +tags.layer < 0) continue
        const bd = { rings, id: oid, tags }
        // (a monument's own outline is not a wall: the cadastre maps statues, plinths and fountains as buildings; a tall
        //  small one is the pylon or column a statue stands on)
        if (ringArea(rings[0]) < OWN_OUTLINE_M2 && parseFloat(tags.height ?? '') >= PYLON_M && !tags.artwork_type && tags.building !== 'monument') pylons.push(bd)
        const area = ringArea(rings[0])
        if (area < OWN_OUTLINE_M2 || area < TAGGED_OUTLINE_M2 && (tags.artwork_type || tags.tourism === 'artwork' || tags.building === 'monument'
          || tags.historic === 'memorial' || tags.historic === 'monument' || tags.amenity === 'fountain')) continue
        buildings.push(bd)
        file(rings[0], (g) => g.b.push(bd))
      } else if (tags.highway && g.type === 'LineString') {
        if (tags.tunnel === 'yes' || tags.covered === 'yes' || tags.indoor === 'yes' || tags.highway === 'corridor') continue
        const ln = { pts: rings[0], tags }
        lines.push(ln)
        file(ln.pts, (g) => g.l.push(ln))
      }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}
console.log(`OSM: ${buildings.length} buildings, ${lines.length} streets and paths near ${candidates.length} statues`)

// ---- geometry
function ringArea(r: P[]): number {
  let a = 0
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j].x + r[i].x) * (r[j].z - r[i].z)
  return Math.abs(a / 2)
}
function inRing(p: P, r: P[]): boolean {
  let inside = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    if ((r[i].z > p.z) !== (r[j].z > p.z) && p.x < ((r[j].x - r[i].x) * (p.z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) inside = !inside
  }
  return inside
}
/** inside a polygon given as rings (outer and inner alike: even-odd) */
const inPoly = (p: P, rings: P[][]): boolean => rings.filter((r) => inRing(p, r)).length % 2 === 1
function nearestOn(p: P, pts: P[]): { q: P; d: number } {
  let best = { q: pts[0], d: Infinity }
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1]
    const dx = b.x - a.x, dz = b.z - a.z
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz || 1)))
    const q = { x: a.x + t * dx, z: a.z + t * dz }
    const d = Math.hypot(p.x - q.x, p.z - q.z)
    if (d < best.d) best = { q, d }
  }
  return best
}
const nearestOnRings = (p: P, rings: P[][]): { q: P; d: number } => rings.map((r) => nearestOn(p, r)).reduce((a, b) => (b.d < a.d ? b : a))
const bearingTo = (a: P, b: P): number => ((Math.atan2(b.x - a.x, b.z - a.z) * 180) / Math.PI + 360) % 360
const halfWidth = (t: Record<string, string>): number | null => {
  if (!(t.highway in HALF_WIDTH) || t.bridge === 'yes' || t.area === 'yes') return null
  const w = parseFloat(t.width ?? '')
  return w > 0 ? w / 2 : HALF_WIDTH[t.highway]
}
/** no building on the line from a towards b, over its first `upTo` metres (a camera behind a wall is a GPS error; a street
 *  behind a building is not the one the statue faces) */
function clearTo(a: P, b: P, upTo: number): boolean {
  const d = Math.hypot(b.x - a.x, b.z - a.z)
  for (let t = 1; t < Math.min(d, upTo); t += 1) if (buildingAt({ x: a.x + ((b.x - a.x) * t) / d, z: a.z + ((b.z - a.z) * t) / d })) return false
  return true
}
const buildingAt = (p: P): Poly | undefined => around(p).b.find((b) => inPoly(p, b.rings))
function roadAt(p: P, r: number): { line: Line; q: P; d: number; hw: number } | undefined {
  for (const line of around(p).l) {
    const hw = halfWidth(line.tags)
    if (hw === null) continue
    const n = nearestOn(p, line.pts)
    if (n.d < hw + r) return { line, ...n, hw }
  }
  return undefined
}

// ---- the landmarks' positions (their own lat/lon, or their OSM feature's centre)
const landmarkAt = landmarks.map((l) => {
  if (l.lat !== undefined && l.lon !== undefined) return { l, at: L(l.lat, l.lon), r: Math.max(...(l.size ?? [10])) / 2 }
  const rings = (l.osm ?? []).flatMap((id) => osmFeature.get(id) ?? [])
  if (!rings.length) return { l, at: null, r: 0 }
  const pts = rings.flat()
  const xs = pts.map((p) => p.x), zs = pts.map((p) => p.z)
  return { l, at: { x: (Math.min(...xs) + Math.max(...xs)) / 2, z: (Math.min(...zs) + Math.max(...zs)) / 2 }, r: Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs)) / 2 }
})
const statueAt = statues.map((s) => {
  if (s.lat !== undefined && s.lon !== undefined) return { s, at: L(s.lat, s.lon) as P | null }
  const host = landmarkAt.find((x) => x.l.name === s.attach?.to)
  return { s, at: host?.at ?? null }
})

// ---- Commons cameras for the photos the models were made from
const cameras = existsSync(CAMERA_CACHE) ? json<Record<string, { lat: number; lon: number } | null>>(CAMERA_CACHE) : {}
const titles = [...new Set(candidates.map((c) => c.meta.extra.img2glb.image?.imageTitle).filter((t): t is string => !!t && !(t in cameras)))]
for (let i = 0; i < titles.length; i += 50) {
  const chunk = titles.slice(i, i + 50)
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=extmetadata&iiextmetadatafilter=GPSLatitude|GPSLongitude&titles='
    + encodeURIComponent(chunk.map((t) => `File:${t}`).join('|'))
  const r = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!r.ok) { console.warn(`Commons: ${r.status}; cameras for ${chunk.length} photos wait for the next run`); break }
  const d = (await r.json()) as { query: { normalized?: { from: string; to: string }[]; pages: Record<string, { title: string; imageinfo?: { extmetadata?: Record<string, { value: string }> }[] }> } }
  const back = new Map((d.query.normalized ?? []).map((n) => [n.to, n.from]))
  for (const p of Object.values(d.query.pages)) {
    const t = (back.get(p.title) ?? p.title).replace(/^File:/, '')
    const m = p.imageinfo?.[0]?.extmetadata
    const lat = parseFloat(m?.GPSLatitude?.value ?? ''), lon = parseFloat(m?.GPSLongitude?.value ?? '')
    cameras[t] = Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null
  }
  for (const t of chunk) if (!(t in cameras)) cameras[t] = null
  await new Promise((res) => setTimeout(res, 1000))
}
mkdirSync(resolve(CAMERA_CACHE, '..'), { recursive: true })
writeFileSync(CAMERA_CACHE, JSON.stringify(Object.fromEntries(Object.entries(cameras).sort()), null, 0) + '\n')

// ---- place each
interface Out { id: string; name: string; asset: string; lat: number; lon: number; bearing: number; raise?: number; lodRanges: number[]; beside?: string; plinth?: [number, number, number]; plinthColour?: string; note: string }
const out: Out[] = []
const sheet: Record<string, unknown> = {}
for (const c of candidates) {
  const { id, meta } = c
  const b = batchOf.get(id)!
  const o = overrides[id] ?? {}
  const name = meta.name
  const skip = (reason: string): void => { report[id] = { batch: b, status: 'skipped', reason } }
  if (!o.keep && NOT_FREE.test(norm(name))) { skip('the name says relief/façade piece, not a free-standing statue'); continue }
  // doubles: the hand-placed statues, then the procedural landmarks
  if (!o.keep) {
    const dup = statueAt.find(({ s, at }) => at && (Math.hypot(at.x - c.at.x, at.z - c.at.z) < DOUBLE_M && !s.attach
      || Math.hypot(at.x - c.at.x, at.z - c.at.z) < NAME_MATCH_M && (nameMatch(s.name, name) >= 0.6 || nameMatch(s.attach?.to ?? '', name) >= 0.6)))
    if (dup) { skip(`already in paris-statues.json: ${dup.s.id}${dup.s.attach ? ` (on ${dup.s.attach.to})` : ''}`); continue }
    const lm = landmarkAt.find(({ l, at, r }) => at && Math.hypot(at.x - c.at.x, at.z - c.at.z) < Math.min(NAME_MATCH_M, Math.max(r + LANDMARK_NEAR_M, 25)) && nameMatch(l.name, name) >= 0.6)
    if (lm) { skip(`drawn by the landmark "${lm.l.name}"`); continue }
    const small = landmarkAt.find(({ l, at, r }) => at && l.procedural && r * 2 <= SMALL_LANDMARK_M && Math.hypot(at.x - c.at.x, at.z - c.at.z) < r + LANDMARK_NEAR_M
      && /\b(fontaine|colonne|monument|obelisque)\b/.test(norm(name)))
    if (small) { skip(`a monument where the landmark "${small.l.name}" stands`); continue }
  }
  const s = sizes[id] ?? {}
  const h = indexed.get(id)!.extra!.model!.scale!.metres
  const ip = indexed.get(id)!.extra!.model!.plinth
  const plinth = o.plinth ?? (ip?.state === 'needed' && ip.size ? ip.size : undefined)
  const bb = s.geometry?.bbox
  const radius = Math.max(0.5, plinth ? Math.max(plinth[0], plinth[1]) / 2 + 0.35 : bb ? (h * Math.max(bb[0], bb[2])) / bb[1] / 2 : 0.6)
  const notes: string[] = []
  let p = { ...c.at }
  // out of a building wall
  const inside = buildingAt(p)
  if (inside && !o.keep && o.lat === undefined) {
    const n = nearestOnRings(p, inside.rings)
    const lmk = landmarkAt.find(({ l, at }) => l.osm?.includes(inside.id) || (at && inPoly(at, inside.rings)))
    if (lmk) { skip(`on the landmark "${lmk.l.name}" (${n.d.toFixed(1)} m inside its outline): a façade piece is its builder's to attach`); continue }
    if (n.d > SNAP_BUILDING_M) { skip(`${n.d.toFixed(1)} m inside a building (${inside.id}${inside.tags.name ? `, ${inside.tags.name}` : ''})`); continue }
    const k = (n.d + CLEAR_M + radius) / Math.max(0.01, n.d)
    p = { x: c.at.x + (n.q.x - c.at.x) * k, z: c.at.z + (n.q.z - c.at.z) * k }
    notes.push(`moved ${(n.d + CLEAR_M + radius).toFixed(1)} m out of ${inside.id}`)
  }
  // out of a carriageway (twice: a corner)
  for (let i = 0; i < 2 && o.lat === undefined; i++) {
    const r = roadAt(p, radius)
    if (!r) break
    const away = r.d > 0.05 ? { x: (p.x - r.q.x) / r.d, z: (p.z - r.q.z) / r.d } : { x: 1, z: 0 }
    const np = { x: r.q.x + away.x * (r.hw + CLEAR_M + radius), z: r.q.z + away.z * (r.hw + CLEAR_M + radius) }
    if (buildingAt(np)) { notes.push(`CHECK: in the ${r.line.tags.highway} ${r.line.tags.name ?? ''}, no room to move`); break }
    notes.push(`moved ${Math.hypot(np.x - p.x, np.z - p.z).toFixed(1)} m off the ${r.line.tags.highway}${r.line.tags.name ? ` (${r.line.tags.name})` : ''}`)
    p = np
  }
  const bridge = around(p).l.find((l) => l.tags.bridge === 'yes' && nearestOn(p, l.pts).d < (HALF_WIDTH[l.tags.highway] ?? 2) + radius)
  if (bridge) notes.push(`CHECK: on or by the bridge ${bridge.tags.name ?? bridge.tags.highway} (it stands on the ground under it)`)
  const pylon = pylons.find((y) => inPoly(p, y.rings))
  const raise = pylon ? parseFloat(pylon.tags.height) : 0
  if (pylon) notes.push(`on top of the ${raise} m structure ${pylon.id} under it`)
  const moved = Math.hypot(p.x - c.at.x, p.z - c.at.z)
  if (moved > 8) notes.push('CHECK: moved far')
  // facing
  let bearing: number | null = o.bearing ?? null
  let how = o.bearing !== undefined ? 'override' : ''
  const wall = around(p).b.map((bd) => ({ bd, ...nearestOnRings(p, bd.rings) })).filter((w) => w.d < WALL_NEAR_M).sort((x, y) => x.d - y.d)[0]
  const title = meta.extra.img2glb.image?.imageTitle
  const cam = title ? cameras[title] : null
  if (bearing === null && cam) {
    const cp = L(cam.lat, cam.lon)
    const d = Math.hypot(cp.x - p.x, cp.z - p.z)
    const bc = bearingTo(p, cp)
    if (d >= CAMERA_MIN_M && d <= CAMERA_MAX_M && clearTo(p, cp, SIGHT_M)) { bearing = bc; how = `towards the camera of its photo (${d.toFixed(0)} m)` }
  }
  if (bearing === null && wall) { bearing = bearingTo(wall.q, p); how = `away from the wall ${wall.d.toFixed(1)} m behind` }
  if (bearing === null) {
    const st = around(p).l.filter((l) => !/^(steps|corridor|elevator|construction|proposed)$/.test(l.tags.highway))
      .map((l) => ({ l, ...nearestOn(p, l.pts) })).filter((x) => x.d > 1 + radius && x.d < STREET_NEAR_M && clearTo(p, x.q, x.d)).sort((x, y) => x.d - y.d)[0]
    if (st) { bearing = bearingTo(p, st.q); how = `towards the nearest ${st.l.tags.highway}${st.l.tags.name ? ` (${st.l.tags.name})` : ''}, ${st.d.toFixed(0)} m` }
  }
  if (bearing === null) { bearing = 180; how = 'CHECK: no clue, faces south' }
  if (o.photo === 'back' && !/camera|override/.test(how)) { bearing += 180; how += ', turned: its photo shows the back' }
  if (o.turn) { bearing += o.turn; how += `, turned ${o.turn}° (review)` }
  bearing = ((bearing % 360) + 360) % 360
  const ll = proj.toLatLon(p)
  const lod0 = Math.round(Math.max(LOD0_MIN, LOD0_PER_M * h)), lod1 = Math.round(Math.min(LOD1_MAX, Math.max(LOD1_MIN, LOD1_PER_M * h)))
  const e: Out = {
    id, name, asset: id, lat: +ll.lat.toFixed(7), lon: +ll.lon.toFixed(7), bearing: Math.round(bearing), lodRanges: [lod0, lod1],
    ...(raise ? { raise } : {}), ...(o.plinth ? { plinth: o.plinth } : {}), ...(o.plinthColour ? { plinthColour: o.plinthColour } : {}),
    note: `img2glb ${b}; facing ${how}${notes.length ? `; ${notes.join('; ')}` : ''}${o.note ? `; ${o.note}` : ''}`,
  }
  // a procedural monument or hand statue it stands beside (the nonbuildings audit's 15 m check)
  const nb = [...landmarkAt.filter((x) => x.l.lat !== undefined).map((x) => ({ name: x.l.name, at: x.at })), ...statueAt.map((x) => ({ name: x.s.name, at: x.at }))]
    .filter((x) => x.at && Math.hypot(x.at.x - p.x, x.at.z - p.z) < DOUBLE_M).sort((x, y) => Math.hypot(x.at!.x - p.x, x.at!.z - p.z) - Math.hypot(y.at!.x - p.x, y.at!.z - p.z))[0]
  if (nb) e.beside = nb.name
  out.push(e)
  report[id] = { batch: b, status: 'placed', note: e.note }
  sheet[id] = {
    name, at: p, from: c.at, bearing: e.bearing, radius, h, camera: cam ? L(cam.lat, cam.lon) : null,
    buildings: around(p).b.filter((bd) => nearestOnRings(p, bd.rings).d < 30).map((bd) => bd.rings),
    roads: around(p).l.filter((l) => nearestOn(p, l.pts).d < 30).map((l) => ({ pts: l.pts, hw: halfWidth(l.tags) })),
  }
}
// placed statues within DOUBLE_M of one another (a group in a garden): each says the nearest as `beside`
for (const e of out) {
  if (e.beside) continue
  const a = L(e.lat, e.lon)
  const o = out.filter((x) => x !== e).map((x) => ({ x, d: Math.hypot(L(x.lat, x.lon).x - a.x, L(x.lat, x.lon).z - a.z) })).filter((x) => x.d < DOUBLE_M).sort((p, q) => p.d - q.d)[0]
  if (o) e.beside = o.x.name
}

out.sort((a, b) => a.id.localeCompare(b.id))
if (!process.argv.includes('--dry')) writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n')
const only = arg('batch')?.split(',')
const shown = Object.entries(report).filter(([, r]) => !only || only.includes(r.batch))
const count = (st: string): number => shown.filter(([, r]) => r.status === st).length
console.log(`${out.length} statues in ${process.argv.includes('--dry') ? '(dry) ' : ''}${OUT.replace(ROOT + '/', '')}; ${only ? only.join(',') : 'all'}: placed ${count('placed')}, skipped ${count('skipped')}, unpublished ${count('unpublished')}, unmade ${count('unmade')}`)
for (const [id, r] of shown) if (r.status === 'skipped' || /CHECK/.test(r.note ?? '')) console.log(`  ${id}: ${r.status} — ${r.reason ?? r.note}`)
const rp = arg('report')
if (rp) writeFileSync(rp, JSON.stringify({ report: Object.fromEntries(shown), sheet: Object.fromEntries(Object.entries(sheet).filter(([id]) => !only || only.includes(batchOf.get(id)!))) }, null, 0))
