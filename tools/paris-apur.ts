/**
 * Paris's buildings by AGE, from APUR (Atelier parisien d'urbanisme), for the bake (PARIS_PARITY.md §1; owner,
 * 2026-10-29: "There is some variation between modern cream hausmann-ish facades and real original ones" — "We can get
 * that from construction date" — "Most of the others are brick with a cream first floor"). OSM dates 4,804 of the box's
 * 130,970 buildings; APUR's "emprise bâtie" layer dates every one of Paris's ~128,000 by a field survey of its front
 * (ODbL, © Apur), and says which are public facilities (`b_ee`: the schools, hospitals, libraries, the ministries —
 * the city's real exceptions to its cream).
 *
 *   node --experimental-strip-types tools/paris-apur.ts          # fetch (cached) and summarise
 *
 * Writes tools/cache/apur/emprise-paris.json: one row a footprint — [lon, lat, c_perconst, an_const, b_ee, h_med,
 * roof material, morphology] at the footprint's centroid. The bake reads it (`apurFor`) and gives each OSM building the
 * row whose centroid is nearest its own, within its footprint's reach.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const LAYER = 'https://carto2.apur.org/apur/rest/services/OPENDATA/EMPRISE_BATIE_PARIS/MapServer/0'
const DIR = resolve(import.meta.dirname, 'cache', 'apur')
export const APUR_FILE = resolve(DIR, 'emprise-paris.json')
const FIELDS = ['n_sq_eb', 'c_perconst', 'an_const', 'b_ee', 'h_med', 'c_toiture_mat', 'c_morpho']

/**
 * The construction periods (`c_perconst`), as the layer codes them — checked against its own `an_const` years
 * (2026-10-29): 4 is not used; 99 is undated (most of them post-war, by APUR's own note).
 */
export const PERIODS: Record<number, string> = {
  1: 'before 1800', 2: '1801–1850', 3: '1851–1914', 4: '1915–1918', 5: '1919–1939', 6: '1940–1967', 7: '1968–1975',
  8: '1976–1981', 9: '1982–1989', 10: '1990–1999', 11: '2000–2007', 12: '2008 on', 99: 'undated',
}

export type ApurRow = [lon: number, lat: number, period: number, year: number, facility: 0 | 1, height: number, roof: string, morpho: number]

async function page(offset: number): Promise<{ rows: ApurRow[]; more: boolean }> {
  const q = new URLSearchParams({
    where: '1=1', outFields: FIELDS.join(','), returnGeometry: 'true', outSR: '4326', geometryPrecision: '6',
    maxAllowableOffset: '0.00002', orderByFields: 'OBJECTID', resultOffset: String(offset), resultRecordCount: '3000', f: 'json',
  })
  for (let attempt = 0; ; attempt++) {
    try {
      const r = await fetch(`${LAYER}/query?${q}`)
      if (!r.ok) throw new Error(`${r.status}`)
      const d = await r.json() as { features?: { attributes: Record<string, unknown>; geometry?: { rings?: number[][][] } }[]; exceededTransferLimit?: boolean; error?: unknown }
      if (d.error || !d.features) throw new Error(JSON.stringify(d.error ?? 'no features'))
      const rows: ApurRow[] = []
      for (const f of d.features) {
        const ring = f.geometry?.rings?.[0]
        if (!ring || ring.length < 3) continue
        // the outer ring's area centroid
        let a = 0, cx = 0, cy = 0
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const k = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]
          a += k; cx += (ring[j][0] + ring[i][0]) * k; cy += (ring[j][1] + ring[i][1]) * k
        }
        if (Math.abs(a) < 1e-14) { cx = ring[0][0]; cy = ring[0][1] } else { cx /= 3 * a; cy /= 3 * a }
        const t = f.attributes
        rows.push([+cx.toFixed(6), +cy.toFixed(6), Number(t.c_perconst ?? 99), Number(t.an_const ?? 0), t.b_ee === 'O' || t.b_ee === '1' || t.b_ee === 'oui' ? 1 : 0,
          Math.round(Number(t.h_med ?? 0) * 10) / 10, String(t.c_toiture_mat ?? ''), Number(t.c_morpho ?? 0)])
      }
      return { rows, more: d.features.length > 0 && (d.exceededTransferLimit ?? d.features.length === 3000) }
    } catch (e) {
      if (attempt >= 4) throw e
      await new Promise((ok) => setTimeout(ok, 2000 * (attempt + 1)))
    }
  }
}

export async function fetchApur(): Promise<ApurRow[]> {
  if (existsSync(APUR_FILE)) return JSON.parse(readFileSync(APUR_FILE, 'utf8')) as ApurRow[]
  mkdirSync(DIR, { recursive: true })
  const all: ApurRow[] = []
  for (let off = 0; ; off += 3000) {
    const { rows, more } = await page(off)
    all.push(...rows.slice(0))
    process.stdout.write(`\r  apur: ${all.length} footprints`)
    if (!more) break
  }
  process.stdout.write('\n')
  writeFileSync(APUR_FILE, JSON.stringify(all))
  return all
}

/**
 * A building's APUR record, by its outline (lat/lon): the footprints whose centroids fall inside it — the commonest
 * period among them, a facility if any is — else the nearest centroid within ~15 m of its own. The record's shape is
 * the bake's (BuildingFacts.record).
 */
export function apurIndex(rows: ApurRow[]): (ring: { lat: number; lon: number }[]) => { year?: number; stories?: number; construction?: string; use?: string; units: number; parcels: number } | null {
  const C = 0.0005
  const key = (lon: number, lat: number): number => Math.floor(lon / C) * 1e6 + Math.floor(lat / C)
  const cells = new Map<number, ApurRow[]>()
  for (const r of rows) { const k = key(r[0], r[1]); const l = cells.get(k); if (l) l.push(r); else cells.set(k, [r]) }
  const inside = (ring: { lat: number; lon: number }[], x: number, y: number): boolean => {
    let hit = false
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i], b = ring[j]
      if ((a.lat > y) !== (b.lat > y) && x < ((b.lon - a.lon) * (y - a.lat)) / (b.lat - a.lat) + a.lon) hit = !hit
    }
    return hit
  }
  return (ring) => {
    if (ring.length < 3) return null
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, cx = 0, cy = 0
    for (const p of ring) { x0 = Math.min(x0, p.lon); x1 = Math.max(x1, p.lon); y0 = Math.min(y0, p.lat); y1 = Math.max(y1, p.lat); cx += p.lon; cy += p.lat }
    cx /= ring.length; cy /= ring.length
    const pad = 0.0002
    const hits: ApurRow[] = []
    let near: ApurRow | null = null, best = pad * pad
    for (let i = Math.floor((x0 - pad) / C); i <= Math.floor((x1 + pad) / C); i++) {
      for (let j = Math.floor((y0 - pad) / C); j <= Math.floor((y1 + pad) / C); j++) {
        for (const r of cells.get(i * 1e6 + j) ?? []) {
          if (inside(ring, r[0], r[1])) hits.push(r)
          const d = ((r[0] - cx) * 0.66) ** 2 + (r[1] - cy) ** 2
          if (d < best) { best = d; near = r }
        }
      }
    }
    const pool = hits.length ? hits : near ? [near] : []
    if (!pool.length) return null
    const votes = new Map<number, number>()
    for (const r of pool) if (r[2] !== 99) votes.set(r[2], (votes.get(r[2]) ?? 0) + 1)
    const period = [...votes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 99
    const year = pool.find((r) => r[2] === period && r[3] > 0)?.[3]
    return { construction: String(period), ...(year ? { year } : {}), ...(pool.some((r) => r[4] === 1) ? { use: 'facility' } : {}), units: 0, parcels: 1 }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = await fetchApur()
  const by: Record<string, number> = {}
  let fac = 0
  for (const r of rows) { by[PERIODS[r[2]] ?? String(r[2])] = (by[PERIODS[r[2]] ?? String(r[2])] ?? 0) + 1; fac += r[4] }
  console.log(`${rows.length} footprints; facilities ${fac}`)
  for (const [k, n] of Object.entries(by).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(12)} ${n}`)
  const ee = new Map<string, number>()
  console.log('  b_ee sample values are counted as facilities when O/1/oui')
  void ee
}
