/**
 * Writes public/landmarks/paris/civic.json: every exception OSM tags in the box, named by its kind and date, for the Paris
 * kit (render/landmarks/paris/kit/). Reads the Île-de-France extract, APUR (the date and height) and the bake's package (the
 * streets, to say which side is the front). Rerun after a bake; an entry it wrote may be hand-corrected by moving it to
 * another manifest, and any way another manifest claims is left alone.
 *   node --experimental-strip-types tools/paris-civic.ts [--limit=20] [--dry]
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { APUR_FILE, type ApurRow } from './paris-apur.ts'

const ROOT = resolve(import.meta.dirname, '..')
const arg = (n: string): string | undefined => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=')[1]
const X = (lon: number): number => (lon - 2.332) * 73270
const Z = (lat: number): number => (lat - 48.8605) * 111320

type Tags = Record<string, string>
/** the kind, by OSM's tags; null is not an exception */
function kindOf(t: Tags): string | null {
  const a = t.amenity, b = t.building, n = t.name ?? ''
  if (a === 'place_of_worship' || /^(church|chapel|cathedral|temple|synagogue|mosque)$/.test(b ?? '')) return 'eglise'
  if (a === 'townhall') return 'mairie'
  if (a === 'courthouse') return 'tribunal'
  if (a === 'fire_station' || b === 'fire_station') return 'caserne'
  if (a === 'police') return 'police'
  if (a === 'post_office') return 'poste'
  if (a === 'library') return 'bibliotheque'
  if (/^(theatre|cinema|arts_centre|community_centre)$/.test(a ?? '') || b === 'theatre' || b === 'cinema') return 'salle'
  if (a === 'hospital' || a === 'clinic' || a === 'social_facility' || b === 'hospital') return /hospice|institution nationale/i.test(n) ? 'hospice' : 'hopital'
  if (a === 'university' || b === 'university' || a === 'college' || b === 'college') return 'fac'
  if (a === 'school' || a === 'kindergarten' || b === 'school' || b === 'kindergarten') return /lyc[ée]e|coll[èe]ge/i.test(n) ? 'lycee' : 'ecole'
  // (an embassy is as often a floor of an apartment block, which is what the block should go on being, unless it has the house)
  if (t.office === 'diplomatic' || a === 'embassy') return /^h[ôo]tel/i.test(n) ? 'hotel' : null
  if (t.office === 'government') return /^h[ôo]tel/i.test(n) ? 'hotel' : 'ministere'
  if (b === 'government' || b === 'civic' || b === 'public') return /^h[ôo]tel/i.test(n) ? 'hotel' : 'equipement'
  return null
}
const WORD: Record<string, string> = { ecole: 'ÉCOLE', lycee: 'LYCÉE', mairie: 'MAIRIE', hopital: 'HÔPITAL', hospice: 'HOSPICE', caserne: 'SAPEURS-POMPIERS', police: 'POLICE',
  poste: 'POSTE', bibliotheque: 'BIBLIOTHÈQUE', tribunal: 'PALAIS DE JUSTICE' }
const MIN_AREA = 120

// ---- OSM, by osmium
const dir = mkdtempSync(resolve(tmpdir(), 'paris-civic-'))
const box = '2.21,48.81,2.42,48.91'
const pbf = resolve(ROOT, 'tools/cache/osm/ile-de-france-latest.osm.pbf')
execFileSync('osmium', ['extract', '-b', box, pbf, '-o', `${dir}/box.pbf`, '--overwrite'], { stdio: 'ignore' })
execFileSync('osmium', ['tags-filter', `${dir}/box.pbf`, 'w/building', '-o', `${dir}/b.pbf`, '--overwrite'], { stdio: 'ignore' })
execFileSync('osmium', ['export', `${dir}/b.pbf`, '-f', 'geojsonseq', '-o', `${dir}/b.geojsonseq`, '--overwrite', '--add-unique-id=type_id', '--geometry-types=polygon'], { stdio: 'ignore' })
const lines = readFileSync(`${dir}/b.geojsonseq`, 'utf8').split('\n')
rmSync(dir, { recursive: true })

// ---- what is claimed already
const lm = resolve(ROOT, 'public/landmarks')
const claimed = new Set<string>()
for (const f of [resolve(lm, 'paris.json'), ...readdirSync(resolve(lm, 'paris')).filter((n) => n !== 'civic.json').map((n) => resolve(lm, 'paris', n))]) {
  const d = JSON.parse(readFileSync(f, 'utf8')) as { osm?: string | string[] }[] | { landmarks: { osm?: string | string[] }[] }
  for (const e of Array.isArray(d) ? d : d.landmarks) for (const r of e.osm ? (Array.isArray(e.osm) ? e.osm : [e.osm]) : []) claimed.add(r)
}

// ---- APUR, by the nearest footprint's centre within 25 m
const apur = JSON.parse(readFileSync(APUR_FILE, 'utf8')) as ApurRow[]
const cells = new Map<string, ApurRow[]>()
const cellOf = (lon: number, lat: number): string => `${Math.floor(X(lon) / 50)},${Math.floor(Z(lat) / 50)}`
for (const r of apur) { const k = cellOf(r[0], r[1]); const l = cells.get(k); if (l) l.push(r); else cells.set(k, [r]) }
const apurAt = (lon: number, lat: number): ApurRow | null => {
  let best: ApurRow | null = null, d0 = 25
  const cx = Math.floor(X(lon) / 50), cz = Math.floor(Z(lat) / 50)
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const r of cells.get(`${cx + i},${cz + j}`) ?? []) {
    const d = Math.hypot(X(r[0]) - X(lon), Z(r[1]) - Z(lat))
    if (d < d0) { d0 = d; best = r }
  }
  return best
}

// ---- the streets, from the bake
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'tools/cache/bake/paris-centre/package.json'), 'utf8')) as {
  edges: { points: number[]; foot?: boolean; tunnel?: boolean; bridge?: boolean; width: number }[]
  buildings: { id: number; height?: number; levels?: number }[]
}
const inPackage = new Map(pkg.buildings.map((b) => [b.id, b]))
const segs = new Map<string, [number, number, number, number, number][]>()
for (const e of pkg.edges) {
  if (e.foot || e.tunnel) continue
  for (let i = 2; i < e.points.length; i += 2) {
    const s: [number, number, number, number, number] = [e.points[i - 2], e.points[i - 1], e.points[i], e.points[i + 1], e.width]
    const n = Math.ceil(Math.hypot(s[2] - s[0], s[3] - s[1]) / 25) + 1
    const seen = new Set<string>()
    for (let k = 0; k <= n; k++) {
      const key = `${Math.floor((s[0] + ((s[2] - s[0]) * k) / n) / 50)},${Math.floor((s[1] + ((s[3] - s[1]) * k) / n) / 50)}`
      if (seen.has(key)) continue
      seen.add(key)
      const l = segs.get(key); if (l) l.push(s); else segs.set(key, [s])
    }
  }
}
/** a place of worship's faith, where it is not a parish church */
function faith(t: Tags): string {
  const n = t.name ?? ''
  if (t.religion === 'jewish' || t.building === 'synagogue') return 'synagogue'
  if (t.religion === 'muslim' || t.building === 'mosque') return 'mosque'
  if (/protestant|lutheran|reformed|baptist|methodist|evangelical|pentecostal/.test(t.denomination ?? '') || t.building === 'temple') return 'temple'
  if (t.building === 'chapel' || /^chapelle/i.test(n)) return 'chapelle'
  return ''
}

/** how far along the outward normal from a point the first street's kerb lies, within 30 m */
function streetAhead(x: number, z: number, nx: number, nz: number): number {
  for (let d = 1; d <= 30; d += 2) {
    const px = x + nx * d, pz = z + nz * d
    for (const s of segs.get(`${Math.floor(px / 50)},${Math.floor(pz / 50)}`) ?? []) {
      const dx = s[2] - s[0], dz = s[3] - s[1]
      const t = Math.max(0, Math.min(1, ((px - s[0]) * dx + (pz - s[1]) * dz) / (dx * dx + dz * dz || 1)))
      if (Math.hypot(s[0] + dx * t - px, s[1] + dz * t - pz) < s[4] / 2 + 1) return d
    }
  }
  return Infinity
}
/** the world bearing the front looks along: the longest wall with a street before it, else the longest wall */
function frontBearing(ring: number[][], shortEnd = false): number | null {
  let a2 = 0
  for (let i = 0; i + 1 < ring.length; i++) a2 += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
  const sgn = a2 > 0 ? 1 : -1
  let best = -1, bearing = 0
  let longest = 0
  for (let i = 0; i + 1 < ring.length; i++) longest = Math.max(longest, Math.hypot(ring[i + 1][0] - ring[i][0], ring[i + 1][1] - ring[i][1]))
  for (let i = 0; i + 1 < ring.length; i++) {
    const [ax, az] = ring[i], [bx, bz] = ring[i + 1]
    const L = Math.hypot(bx - ax, bz - az)
    if (L < 4 || (shortEnd && L > longest * 0.8)) continue
    const nx = (sgn * (bz - az)) / L, nz = (-sgn * (bx - ax)) / L
    const b = (Math.atan2(nx, nz) * 180) / Math.PI
    const score = L / (1 + streetAhead((ax + bx) / 2, (az + bz) / 2, nx, nz) / 15)
    if (streetAhead((ax + bx) / 2, (az + bz) / 2, nx, nz) < 30 && score > best) { best = score; bearing = b }
  }
  // (none: it stands in a court or a block's middle, where the rider never sees it)
  return best >= 0 ? Math.round(bearing) : null
}

// ---- the entries
const out: Record<string, unknown>[] = []
const counts: Record<string, number> = {}
for (const l of lines) {
  if (!l.trim()) continue
  const f = JSON.parse(l.replace(/^\x1e/, '')) as { id: string; properties: Tags; geometry: { coordinates: number[][][][] } }
  const t = f.properties
  const kind = kindOf(t)
  // (osmium numbers its areas twice the way's id; an odd one is a relation's, which a kit building does not take)
  const area = Number(f.id.slice(1))
  if (!kind || area % 2) continue
  const wayId = area / 2
  const ref = `way/${wayId}`
  if (claimed.has(ref) || !inPackage.has(wayId)) continue
  const r = f.geometry.coordinates[0][0]
  const ring = r.map(([lo, la]) => [X(lo), Z(la)])
  let a = 0
  for (let i = 0; i + 1 < ring.length; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
  if (Math.abs(a) / 2 < MIN_AREA) continue
  const lon = r.reduce((s, p) => s + p[0], 0) / r.length, lat = r.reduce((s, p) => s + p[1], 0) / r.length
  const ap = apurAt(lon, lat)
  // (outside Paris proper APUR says nothing: undated, as the bake's default is)
  const p = ap ? (ap[2] || 99) : 99
  const height = ap?.[5] && ap[5] >= 3 ? ap[5] : inPackage.get(wayId)!.height ?? 12
  const front = frontBearing(ring, kind === 'eglise') ?? (kind === 'eglise' ? frontBearing(ring) : null)
  if (front === null) continue
  const name = t.name
  const word = kind === 'eglise' ? faith(t) : name && name.length <= 34 ? name.toUpperCase() : WORD[kind]
  counts[kind] = (counts[kind] ?? 0) + 1
  out.push({
    osm: [ref], name: name ?? `${kind} ${wayId}`, procedural: 'parisCivic',
    kit: { kind, p, ...(word ? { word } : {}), seed: wayId % 9973 },
    height: Math.round(height * 10) / 10, front, sign: false,
    note: `Written by tools/paris-civic.ts: ${kind}, APUR period ${p}.`,
  })
}
console.log(counts, out.length)
const limit = Number(arg('limit') ?? 0)
const chosen = limit ? out.filter((_, i) => i % Math.floor(out.length / limit) === 0).slice(0, limit) : out
if (!process.argv.includes('--dry')) writeFileSync(resolve(lm, 'paris/civic.json'), JSON.stringify(chosen, null, 1) + '\n')
