/**
 * Which commercial (non-government) Paris buildings to model next (owner, 2026-11-04: "we have budget to render about 1000
 * additional buildings ... not obvious which ones"). Scores every OSM building in the box that no manifest models, on what a
 * rider sees and what the generic Haussmann front cannot say; excludes worship, schools, museums, government, palaces, park
 * buildings, stations. Writes docs/landmarks/PARIS-COMMERCIAL-PRIORITY.md and tools/cache/paris-commercial-rank.json.
 *   node --experimental-strip-types tools/paris-commercial-rank.ts [--top 1000]
 */
import { execFileSync } from 'node:child_process'
import { createReadStream, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline'

const ROOT = resolve(import.meta.dirname, '..')
const TOP = Number(process.argv[process.argv.indexOf('--top') + 1]) || 1000
const BOX = '2.20,48.80,2.42,48.91'
const CENTRE = { lon: 2.3415, lat: 48.8585 }
const DEFENSE = { lon: 2.2385, lat: 48.8920 }
// ---- tunables ----
const W = {
  wiki: 40, heritage: 25, since2000: 35, modern: 15, prewar_non_haussmann: 12, architect: 12, styleTag: 15, material: 10,
  kindCommercial: 12, marquee: 18, hotelStars: 4, brand: 8,
  marqueeStreet: 30, primary: 8, quai: 12, majorSquare: 30, square: 12,
  heightPerM: 0.7, tallOverNeighbours: 1.2, areaMax: 30, haussmannPenalty: 45,
}
const MAJOR_SQUARE_M = 7000
const FRONT_M = 22, NEIGH_M = 150, MIN_AREA = 120
const FADE_IN = 6000, FADE_OUT = 11000, DEFENSE_FADE = 0.6
const MARQUEE_STREETS = /^(Avenue des Champs-Élysées|Rue de Rivoli|Avenue de l'Opéra|Boulevard Haussmann|Boulevard Saint-Germain|Boulevard Saint-Michel|Rue de la Paix|Avenue Montaigne|Rue du Faubourg Saint-Honoré|Rue Saint-Honoré|Boulevard des Capucines|Boulevard des Italiens|Boulevard Montmartre|Boulevard Poissonnière|Boulevard de Bonne-Nouvelle|Boulevard Saint-Denis|Boulevard Saint-Martin|Boulevard de Sébastopol|Boulevard du Montparnasse|Boulevard Raspail|Avenue de la Grande Armée|Avenue Victor-Hugo|Avenue Foch|Avenue Kléber|Avenue d'Iéna|Avenue George-V|Rue Royale|Boulevard de la Madeleine|Boulevard Malesherbes|Rue de Rennes|Boulevard de Clichy|Avenue Charles-de-Gaulle|Esplanade du Général de Gaulle|Avenue de France|Rue La Fayette|Boulevard Beaumarchais|Rue de la Chaussée-d'Antin|Avenue Marceau|Avenue de Friedland|Avenue Matignon|Rue du Faubourg Saint-Antoine|Avenue des Ternes|Rue de Sèvres)$/
const MAJOR_SQUARES = /(Concorde|Charles-de-Gaulle|Étoile|République|Bastille|Nation|de l'Opéra|Vendôme|Madeleine|Trocadéro|d'Italie|Denfert|Châtelet|des Victoires|de Clichy|Saint-Michel|Hôtel-de-Ville|des Vosges|Porte Maillot|des Ternes|du Palais-Royal|Pigalle|Saint-Augustin|Victor-Hugo|de la Défense|Alma|Raoul-Dautry|du 18 Juin 1940)/
// excluded: separate systems model these
const EX_BUILDING = /^(church|cathedral|chapel|basilica|mosque|synagogue|temple|shrine|religious|monastery|convent|school|university|college|kindergarten|government|civic|public|palace|castle|train_station|transportation|hospital|museum|stadium|grandstand|roof|garage|garages|shed|kiosk|hut|toilets|greenhouse|construction|bunker|ruins|carport|service|bridge|fountain|pavilion)$/
const EX_AMENITY = /^(place_of_worship|school|university|college|kindergarten|townhall|courthouse|police|fire_station|library|hospital|clinic|prison|embassy|post_office|public_building|monastery|fountain|community_centre|social_facility|research_institute|music_school|arts_centre|exhibition_centre|theatre)$/
const EX_TOURISM = /^(museum|gallery|zoo|aquarium|theme_park)$/
const EX_HISTORIC = /^(monument|memorial|triumphal_arch|palace|castle|church|monastery|cathedral|chapel|city_gate|fort)$/
// ------------------

const X = (lon: number): number => (lon - CENTRE.lon) * 73270
const Z = (lat: number): number => (lat - CENTRE.lat) * 111320
type P = [number, number]
type Ring = P[]
const inside = (r: Ring, x: number, z: number): boolean => {
  let o = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < ((r[j][0] - r[i][0]) * (z - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) o = !o
  return o
}
const area = (r: Ring): number => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return Math.abs(a / 2) }
const segDist = (p: P, a: P, b: P): number => {
  const dx = b[0] - a[0], dz = b[1] - a[1], l = dx * dx + dz * dz
  const t = l ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / l)) : 0
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz)
}

// ---- OSM ----
const dir = mkdtempSync(resolve(tmpdir(), 'crank-'))
const box = resolve(dir, 'box.pbf'), flt = resolve(dir, 'f.pbf'), seq = resolve(dir, 'f.geojsonseq')
execFileSync('osmium', ['extract', '-b', BOX, '--overwrite', '-o', box, resolve(ROOT, 'tools/cache/osm/ile-de-france-latest.osm.pbf')], { stdio: 'ignore' })
execFileSync('osmium', ['tags-filter', box, 'a/building', 'w/highway', 'nwa/place=square', 'a/leisure=park,garden', 'a/landuse=cemetery', '--overwrite', '-o', flt], { stdio: 'ignore' })
execFileSync('osmium', ['export', flt, '-f', 'geojsonseq', '--add-unique-id=type_id', '--overwrite', '-o', seq], { stdio: 'ignore' })

interface B { ref: string; tags: Record<string, string>; rings: Ring[]; cx: number; cz: number; area: number; h: number }
const blds: B[] = []
const streets: { name: string; w: number; kind: string; a: P; b: P }[] = []
const squares: { name: string; w: number; pts: P[] }[] = []
const parks: Ring[] = []
for await (const l of createInterface({ input: createReadStream(seq) })) {
  const s = l.replace(/^\x1e/, '').trim(); if (!s) continue
  const f = JSON.parse(s) as { id: string; properties: Record<string, string>; geometry: { type: string; coordinates: any } }
  const t = f.properties, g = f.geometry
  const id = f.id, num = Number(id.slice(1)), ref = id[0] === 'a' ? (num % 2 === 0 ? `way/${num / 2}` : `relation/${(num - 1) / 2}`) : id[0] === 'w' ? `way/${num}` : `node/${num}`
  const polys: number[][][][] = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []
  const rings = polys.map((p) => p[0].map(([lo, la]) => [X(lo), Z(la)] as P))
  if (t.leisure === 'park' || t.leisure === 'garden' || t.landuse === 'cemetery') { for (const r of rings) if (area(r) > 3000) parks.push(r); continue }
  const nm = t.name ?? ''
  if (t.place === 'square' || (t.highway && /^Place /.test(nm))) {
    const pts: P[] = g.type === 'Point' ? [[X(g.coordinates[0]), Z(g.coordinates[1])]] : g.type === 'LineString' ? g.coordinates.map(([lo, la]: number[]) => [X(lo), Z(la)]) : rings.flat()
    // (a major-square name only counts within MAJOR_SQUARE_M of the centre: La Défense has its own Place des Vosges)
    squares.push({ name: nm, w: MAJOR_SQUARES.test(nm) && pts.length && Math.hypot(pts[0][0], pts[0][1]) < MAJOR_SQUARE_M ? W.majorSquare : W.square, pts })
    if (t.highway === undefined) continue
  }
  if (t.highway && g.type === 'LineString') {
    const w = MARQUEE_STREETS.test(nm) ? W.marqueeStreet : /^Quai /.test(nm) ? W.quai : /^(trunk|primary)$/.test(t.highway) ? W.primary : 0
    if (!w) continue
    const c = g.coordinates.map(([lo, la]: number[]) => [X(lo), Z(la)] as P)
    for (let i = 1; i < c.length; i++) streets.push({ name: nm, w, kind: t.highway, a: c[i - 1], b: c[i] })
    continue
  }
  if (!t.building || !rings.length) continue
  const ar = rings.reduce((s, r) => s + area(r), 0)
  if (ar < MIN_AREA) continue
  let cx = 0, cz = 0, n = 0
  for (const [x, z] of rings[0]) { cx += x; cz += z; n++ }
  const h = parseFloat(t.height) || (parseFloat(t['building:levels']) ? parseFloat(t['building:levels']) * 3.2 + 2 : 0)
  blds.push({ ref, tags: t, rings, cx: cx / n, cz: cz / n, area: ar, h })
}
rmSync(dir, { recursive: true, force: true })

// ---- what the manifests already model ----
const takenRefs = new Set<string>(), restyled = new Set<string>(), takenPts: P[] = []
const lmDir = resolve(ROOT, 'public/landmarks/paris')
const files = [resolve(ROOT, 'public/landmarks/paris.json'), ...readdirSync(lmDir).filter((f) => f.endsWith('.json')).map((f) => resolve(lmDir, f))]
for (const f of files) {
  const d = JSON.parse(readFileSync(f, 'utf8')); if (!Array.isArray(d)) continue
  for (const e of d) {
    const refs: string[] = e.osm === undefined ? [] : Array.isArray(e.osm) ? e.osm : [e.osm]
    for (const r of refs) (e.procedural || !e.restyle ? takenRefs : restyled).add(r)
    if (!refs.length && e.lat && e.lon) takenPts.push([X(e.lon), Z(e.lat)])
  }
}

// ---- grids ----
const CELL = 100
const key = (x: number, z: number): string => `${Math.floor(x / CELL)},${Math.floor(z / CELL)}`
function index<T>(items: T[], pts: (t: T) => P[]): Map<string, T[]> {
  const g = new Map<string, T[]>()
  for (const it of items) { const ks = new Set(pts(it).map(([x, z]) => key(x, z))); for (const k of ks) (g.get(k) ?? g.set(k, []).get(k)!).push(it) }
  return g
}
function near<T>(g: Map<string, T[]>, x: number, z: number, r: number): Set<T> {
  const out = new Set<T>(), n = Math.ceil(r / CELL)
  const a0 = Math.floor(x / CELL), b0 = Math.floor(z / CELL)
  for (let a = a0 - n; a <= a0 + n; a++) for (let b = b0 - n; b <= b0 + n; b++) for (const t of g.get(`${a},${b}`) ?? []) out.add(t)
  return out
}
const streetG = index(streets, (s) => { const m: P[] = [s.a, s.b]; const L = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]); for (let d = CELL / 2; d < L; d += CELL / 2) m.push([s.a[0] + ((s.b[0] - s.a[0]) * d) / L, s.a[1] + ((s.b[1] - s.a[1]) * d) / L]); return m })
const squareG = index(squares, (s) => s.pts)
const parkG = index(parks, (r) => r.filter((_, i) => i % 3 === 0))
const bldG = index(blds, (b) => [[b.cx, b.cz]])
const ptG = index(takenPts, (p) => [p])

// ---- score ----
const year = (s?: string): number => { const m = s?.match(/\d{4}/); return m ? Number(m[0]) : NaN }
const median = (v: number[]): number => { if (!v.length) return 0; const s = [...v].sort((a, b) => a - b); return s[s.length >> 1] }
interface Row { b: B; score: number; why: string[]; front: string; hauss: boolean; dist: number }
const rows: Row[] = []
for (const b of blds) {
  const t = b.tags
  if (takenRefs.has(b.ref)) continue
  if (EX_BUILDING.test(t.building) || EX_AMENITY.test(t.amenity ?? '') || EX_TOURISM.test(t.tourism ?? '') || EX_HISTORIC.test(t.historic ?? '')) continue
  if (t.government || t.office === 'government' || t.office === 'diplomatic' || t.religion || t.military || t.railway || t.public_transport || t.leisure === 'sports_centre' || t.man_made) continue
  if ([...near(ptG, b.cx, b.cz, 30)].some((p) => b.rings.some((r) => inside(r, p[0], p[1])))) continue
  if ([...near(parkG, b.cx, b.cz, 50)].some((r) => inside(r, b.cx, b.cz))) continue
  const dist = Math.hypot(b.cx, b.cz)
  const dDef = Math.hypot(b.cx - X(DEFENSE.lon), b.cz - Z(DEFENSE.lat))
  const fade = dDef < 900 ? DEFENSE_FADE : dist <= FADE_IN ? 1 : dist >= FADE_OUT ? 0 : 1 - (0.85 * (dist - FADE_IN)) / (FADE_OUT - FADE_IN)
  if (!fade) continue
  const why: string[] = []
  let s = 0
  const add = (w: number, r: string): void => { s += w; why.push(r) }
  if (t.wikidata || t.wikipedia) add(W.wiki, 'wiki')
  if (t.heritage || t['ref:mhs'] || t['heritage:operator']) add(W.heritage, 'listed')
  const y = year(t.start_date ?? t['construction_date'])
  if (y >= 2000) add(W.since2000, `built ${y}`)
  else if (y >= 1930) add(W.modern, `built ${y}`)
  else if (y && (y < 1840 || y > 1920)) add(W.prewar_non_haussmann, `built ${y}`)
  if (t.architect) add(W.architect, `architect ${t.architect}`)
  const arch = t['building:architecture'] ?? t['architecture'] ?? ''
  if (arch && !/haussmann/i.test(arch)) add(W.styleTag, arch)
  const mat = t['building:material'] ?? t['building:facade:material'] ?? ''
  if (/glass|steel|metal|concrete|brick|wood/.test(mat)) add(W.material, mat)
  if (/^(commercial|office|retail|hotel|industrial|warehouse|department_store|supermarket)$/.test(t.building)) add(W.kindCommercial, t.building)
  if (t.shop === 'department_store' || t.shop === 'mall' || t.amenity === 'cinema' || t.tourism === 'hotel' && t.stars && Number(t.stars) >= 5) add(W.marquee, t.shop ?? t.amenity ?? `${t.stars}★ hotel`)
  else if (t.tourism === 'hotel' && t.stars) add(W.hotelStars * Number(t.stars) / 2, `${t.stars}★ hotel`)
  if (t.brand || t['brand:wikidata']) add(W.brand, `brand ${t.brand ?? ''}`.trim())
  // frontage: the best street any outline vertex is within FRONT_M of
  let fw = 0, fname = ''
  for (const st of near(streetG, b.cx, b.cz, FRONT_M + 120)) if (st.w > fw && b.rings[0].some((p) => segDist(p, st.a, st.b) < FRONT_M)) { fw = st.w; fname = st.name || st.kind }
  if (fw) add(fw, `on ${fname}`)
  let sw = 0, sname = ''
  for (const sq of near(squareG, b.cx, b.cz, 160)) if (sq.w > sw && sq.pts.some((q) => b.rings[0].some((p) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 45)) || sq.pts.length > 2 && sq.w > sw && b.rings[0].some((p) => sq.pts.some((q, i) => i && segDist(p, sq.pts[i - 1], q) < 30))) { sw = sq.w; sname = sq.name }
  if (sw && !/\//.test(sname)) add(sw, `on ${sname}`)
  // height and bulk
  const neigh = median([...near(bldG, b.cx, b.cz, NEIGH_M)].filter((o) => o !== b && o.h && Math.hypot(o.cx - b.cx, o.cz - b.cz) < NEIGH_M).map((o) => o.h))
  if (b.h) { s += W.heightPerM * b.h; const over = b.h - neigh; if (over > 6) add(W.tallOverNeighbours * over, `${Math.round(b.h)} m (+${Math.round(over)})`) }
  if (b.area > 1500) add(Math.min(W.areaMax, (b.area / 10000) * W.areaMax), `${Math.round(b.area)} m²`)
  // looks like the generic front: residential, of the Haussmann years or Haussmann height, nothing else to say
  const residential = /^(yes|apartments|residential|house)$/.test(t.building)
  const hy = y >= 1850 && y <= 1914
  const hh = !b.h || (b.h >= 14 && b.h <= 27 && Math.abs(b.h - neigh) < 5)
  const strong = !!(t.wikidata || t.wikipedia || t.heritage || t['ref:mhs'] || t.architect || (arch && !/haussmann/i.test(arch)) || (y && !hy))
  const hauss = /haussmann/i.test(arch) || (residential && hh && (hy || !y) && !strong) || (t['roof:shape'] === 'mansard' && !strong)
  if (hauss) { s -= W.haussmannPenalty; why.push('looks Haussmann') }
  if (restyled.has(b.ref)) why.push('restyled already')
  if (s <= 0) continue
  rows.push({ b, score: s * fade, why, front: fname, hauss, dist })
}
rows.sort((a, b) => b.score - a.score)
// one row per building: an outline relation and its ways, or two outlines of one named tower, are the same pick
{ const kept: Row[] = []
  const kg = new Map<string, Row[]>()
  for (const r of rows) if (![...near(kg, r.b.cx, r.b.cz, 150)].some((k) => Math.hypot(k.b.cx - r.b.cx, k.b.cz - r.b.cz) < 25 || (r.b.tags.name && k.b.tags.name === r.b.tags.name && Math.hypot(k.b.cx - r.b.cx, k.b.cz - r.b.cz) < 150) || k.b.rings[0] && inside(k.b.rings[0], r.b.cx, r.b.cz))) { kept.push(r); (kg.get(key(r.b.cx, r.b.cz)) ?? kg.set(key(r.b.cx, r.b.cz), []).get(key(r.b.cx, r.b.cz))!).push(r) }
  rows.length = 0; rows.push(...kept) }
const top = rows.slice(0, TOP)

// ---- out ----
const toLL = (b: B): string => `${(CENTRE.lat + b.cz / 111320).toFixed(5)}, ${(CENTRE.lon + b.cx / 73270).toFixed(5)}`
writeFileSync(resolve(ROOT, 'tools/cache/paris-commercial-rank.json'), JSON.stringify(top.map((r) => ({ osm: r.b.ref, name: r.b.tags.name ?? null, score: Math.round(r.score), height: Math.round(r.b.h) || null, area: Math.round(r.b.area), at: toLL(r.b), why: r.why, wikidata: r.b.tags.wikidata ?? null })), null, 1))
const esc = (s: string): string => s.replace(/\|/g, '/')
const md = [
  '# Commercial buildings to model next in Paris',
  '',
  `Owner, 2026-11-04: budget for about 1000 more buildings; churches, palaces, museums, government, schools, park buildings, fountains and stations have their own systems and are excluded. Generated by \`tools/paris-commercial-rank.ts\` from the local OSM extract (box ${BOX}); rerun after adding models. ${rows.length} candidates scored, top ${top.length} listed.`,
  '',
  'Score: wiki +40, listed +25, built 2000+ +35 (1930–99 +15, other non-Haussmann date +12), architect +12, non-Haussmann style tag +15, facade material +10, commercial/office/hotel kind +12, department store/mall/cinema/5★ +18, brand +8; frontage on a marquee street +30 / quai +12 / primary +8; on a major square +30 / other square +12; 0.7/m of height plus 1.2/m over the 150 m median; up to +30 for 1.5k–10k m². **Minus 45 if it looks Haussmann** (residential, Haussmann years or no date, height within 5 m of its neighbours, nothing else notable; or tagged haussmannian / mansard with no other signal). Fade 1 to 6 km out, to 0.15 at 11 km; La Défense ×0.6. OSM heights and dates go unchecked: look before modelling. Unnamed rows may be parts of a larger building.',
  '',
  '| # | Score | Name | m | m² | Why | Where | OSM |',
  '|--|--|--|--|--|--|--|--|',
  ...top.map((r, i) => `| ${i + 1} | ${Math.round(r.score)} | ${esc(r.b.tags.name ?? r.b.tags['addr:housenumber'] ? (r.b.tags.name ?? `${r.b.tags['addr:housenumber']} ${r.b.tags['addr:street'] ?? ''}`) : '(unnamed)')} | ${Math.round(r.b.h) || ''} | ${Math.round(r.b.area)} | ${esc(r.why.join('; '))} | ${toLL(r.b)} | ${r.b.ref} |`),
  '',
]
writeFileSync(resolve(ROOT, 'docs/landmarks/PARIS-COMMERCIAL-PRIORITY.md'), md.join('\n'))
const c = (f: (r: Row) => boolean): number => top.filter(f).length
console.log(`buildings ${blds.length}, streets ${streets.length} segs, squares ${squares.length}, parks ${parks.length}, taken ${takenRefs.size}`)
console.log(`candidates ${rows.length}; top ${top.length}: wiki ${c((r) => r.why.includes('wiki'))}, listed ${c((r) => r.why.includes('listed'))}, 2000+ ${c((r) => r.why.some((w) => /built 20/.test(w)))}, marquee/square ${c((r) => r.why.some((w) => w.startsWith('on ')))}, haussmann-flagged ${c((r) => r.hauss)}, cutoff score ${Math.round(top[top.length - 1]?.score ?? 0)}`)
