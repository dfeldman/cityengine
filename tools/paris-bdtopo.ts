/**
 * Wall and roof MATERIAL for every building in the Paris box, from IGN's BD TOPO (owner, 2026-11-05: "i feel there are likely
 * hundreds of missing brick and concrete buildings around the outer edges" — "brick is likely red though" — "we should use
 * BD TOPO, but cache the data locally as much as possible"). The codes are the tax records' (fichiers fonciers), one digit
 * a material, two digits a mix: 1 stone, 2 millstone (meulière), 3 concrete, 4 brick, 5 breeze block, 6 wood, 9 other,
 * 0 unknown. A sample (2026-11-05): Chaville 21% pure brick, 46% with any; the 16e 5% pure, 29% with any (stone fronts on
 * brick backs, cream from the street). So only PURE brick is red; millstone, alone or with brick, is the suburban villa.
 * No colour in the data; no year (date_d_apparition is nearly always empty).
 *
 *   node --experimental-strip-types tools/paris-bdtopo.ts          # fetch the box (cached per tile) and summarise
 *
 * Caches the DOWNLOADS only, one raw page a file under tools/cache/bdtopo/ (tile and page in the name); the index is built
 * fresh each bake.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { roofKind, wallKind } from '../src/city/paris/materials.ts'

const WFS = 'https://data.geopf.fr/wfs/ows'
const DIR = resolve(import.meta.dirname, 'cache', 'bdtopo')
/** tile size in degrees (~1.1 km × 0.75 km); a dense Paris tile holds ~4 000 buildings, two or three pages */
const TILE = 0.01
const PAGE = 2000
/** BD TOPO heights under this (m) are sheds or bad measures: ignored */
const MIN_TOPO_HEIGHT = 2.5
/** (usage_1 and nombre_de_logements say who lives there: one dwelling is a single-family house, src/city/paris/house.ts) */
const PROPS = 'materiaux_des_murs,materiaux_de_la_toiture,hauteur,usage_1,nombre_de_logements,nature'
/** a cached page from before the dwelling fields (no `l` key on its first row) is fetched again; a failed refetch keeps the old page */
const PAGE_HAS_DWELLINGS = (fs: Feature[]): boolean => fs.length === 0 || 'l' in fs[0].properties

/** [lon, lat, walls, roof, height] at the footprint's centroid; walls/roof the raw two-character code, '' unknown */
export type TopoRow = [lon: number, lat: number, walls: string, roof: string, height: number, usage?: string, dwellings?: number, nature?: string]

type Feature = { geometry?: { type: string; coordinates: number[][][][] | number[][][] }; properties: Record<string, unknown> }

async function getPage(tx: number, ty: number, page: number): Promise<Feature[]> {
  const file = resolve(DIR, `t${tx}_${ty}_p${page}.json`)
  let stale: Feature[] | null = null
  if (existsSync(file)) {
    const old = JSON.parse(readFileSync(file, 'utf8')) as Feature[]
    if (PAGE_HAS_DWELLINGS(old)) return old
    stale = old
  }
  const s = ty * TILE, w = tx * TILE
  const q = new URLSearchParams({
    SERVICE: 'WFS', VERSION: '2.0.0', REQUEST: 'GetFeature', TYPENAMES: 'BDTOPO_V3:batiment', OUTPUTFORMAT: 'application/json',
    COUNT: String(PAGE), STARTINDEX: String(page * PAGE), SORTBY: 'cleabs', PROPERTYNAME: `geometrie,${PROPS}`,
    // (lat,lon order: the WFS reads EPSG:4326 axis-first; a BBOX= parameter came back empty, the CQL one works)
    CQL_FILTER: `BBOX(geometrie,${s},${w},${(s + TILE).toFixed(4)},${(w + TILE).toFixed(4)})`,
  })
  for (let attempt = 0; ; attempt++) {
    try {
      const r = await fetch(`${WFS}?${q}`)
      if (!r.ok) throw new Error(String(r.status))
      const d = await r.json() as { features?: Feature[] }
      if (!d.features) throw new Error('no features')
      // keep only what the index reads: the footprint's outer ring and the three fields
      const slim = d.features.map((f) => {
        const g = f.geometry
        const ring = !g ? [] : g.type === 'MultiPolygon' ? (g.coordinates as number[][][][])[0][0] : (g.coordinates as number[][][])[0]
        return { geometry: { type: 'Polygon', coordinates: [ring.map((p) => [+p[0].toFixed(6), +p[1].toFixed(6)])] },
          properties: { m: f.properties.materiaux_des_murs ?? '', r: f.properties.materiaux_de_la_toiture ?? '', h: f.properties.hauteur ?? 0,
            u: f.properties.usage_1 ?? '', l: f.properties.nombre_de_logements ?? null, n: f.properties.nature ?? '' } }
      })
      mkdirSync(DIR, { recursive: true })
      writeFileSync(file, JSON.stringify(slim))
      return slim as Feature[]
    } catch (e) {
      if (attempt >= 4) { if (stale) return stale; throw e }
      await new Promise((ok) => setTimeout(ok, 2000 * (attempt + 1)))
    }
  }
}

/**
 * Every building in the tiles a test accepts. `want(lat, lon)` is the bake's detail test (Paris, La Défense, the road to
 * Versailles, Versailles); a tile is fetched when any of its corners or centre passes.
 */
export async function fetchTopo(box: { south: number; north: number; west: number; east: number }, want: (lat: number, lon: number) => boolean): Promise<TopoRow[]> {
  const rows: TopoRow[] = []
  let tiles = 0
  for (let tx = Math.floor(box.west / TILE); tx * TILE < box.east; tx++) {
    for (let ty = Math.floor(box.south / TILE); ty * TILE < box.north; ty++) {
      const s = ty * TILE, w = tx * TILE
      const probe = [[0, 0], [0, 1], [1, 0], [1, 1], [0.5, 0.5], [0.5, 0], [0, 0.5], [1, 0.5], [0.5, 1]]
      if (!probe.some(([a, b]) => want(s + a * TILE, w + b * TILE))) continue
      tiles++
      for (let page = 0; ; page++) {
        const fs = await getPage(tx, ty, page)
        for (const f of fs) {
          const ring = (f.geometry?.coordinates as number[][][] | undefined)?.[0]
          if (!ring || ring.length < 3) continue
          let cx = 0, cy = 0
          for (const p of ring) { cx += p[0]; cy += p[1] }
          cx /= ring.length; cy /= ring.length
          // a building on the tile's edge comes back from both tiles: keep it in the tile its centre is in
          if (cx < w || cx >= w + TILE || cy < s || cy >= s + TILE) continue
          const t = f.properties
          rows.push([+cx.toFixed(6), +cy.toFixed(6), String(t.m ?? ''), String(t.r ?? ''), Number(t.h ?? 0),
            String(t.u ?? ''), t.l === null || t.l === undefined ? undefined : Number(t.l), String(t.n ?? '')])
        }
        if (process.stdout.isTTY) process.stdout.write(`\r  bdtopo: ${tiles} tiles, ${rows.length} buildings`)
        if (fs.length < PAGE) break
      }
    }
  }
  process.stdout.write(`${process.stdout.isTTY ? '\n' : ''}  bdtopo: ${tiles} tiles, ${rows.length} buildings\n`)
  return rows
}

/**
 * A building's BD TOPO row, by its outline: the rows whose centroid is inside it (most of a block's are), else the
 * nearest within ~15 m. Returns the raw codes.
 */
export function topoIndex(rows: TopoRow[]): (ring: { lat: number; lon: number }[]) => { walls?: string; roofMat?: string; height?: number; usage?: string; dwellings?: number; nature?: string } | null {
  const C = 0.0005
  const cells = new Map<number, TopoRow[]>()
  for (const r of rows) { const k = Math.floor(r[0] / C) * 1e6 + Math.floor(r[1] / C); const l = cells.get(k); if (l) l.push(r); else cells.set(k, [r]) }
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
    const pad = 0.00015
    const hits: TopoRow[] = []
    let near: TopoRow | null = null, best = pad * pad
    for (let i = Math.floor((x0 - pad) / C); i <= Math.floor((x1 + pad) / C); i++) {
      for (let j = Math.floor((y0 - pad) / C); j <= Math.floor((y1 + pad) / C); j++) {
        for (const r of cells.get(i * 1e6 + j) ?? []) {
          if (inside(ring, r[0], r[1])) hits.push(r)
          const d = ((r[0] - cx) * 0.66) ** 2 + (r[1] - cy) ** 2
          if (d < best) { best = d; near = r }
        }
      }
    }
    const all = hits.length ? hits : near ? [near] : []
    /*
     * the MEASURED height (owner, 2026-11-05: the road to Versailles was "every building ... a 6 story paris-like building"
     * where it is houses and low flats behind hedges): BD TOPO's hauteur, the median of the rows in the footprint
     */
    const hs = all.map((r) => r[4]).filter((h) => h >= MIN_TOPO_HEIGHT).sort((a, b) => a - b)
    const height = hs.length ? hs[hs.length >> 1] : undefined
    const pool = all.filter((r) => r[2] || r[3])
    // who lives there: the commonest usage, the most dwellings any row in the footprint records (one row a house, several an apartment block)
    const uses = new Map<string, number>()
    for (const r of all) if (r[5]) uses.set(r[5], (uses.get(r[5]) ?? 0) + 1)
    const usage = [...uses.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    const dw = all.map((r) => r[6]).filter((n): n is number => n !== undefined)
    const dwellings = dw.length ? dw.reduce((a, b) => a + b, 0) : undefined
    const nature = all[0]?.[7] || undefined
    const who = { ...(usage ? { usage } : {}), ...(dwellings !== undefined ? { dwellings } : {}), ...(nature ? { nature } : {}) }
    if (!pool.length) return height || usage ? { ...(height ? { height } : {}), ...who } : null
    // the commonest known wall code and roof code among them
    const vote = (k: 2 | 3): string | undefined => {
      const m = new Map<string, number>()
      for (const r of pool) if (r[k] && r[k] !== '00') m.set(r[k], (m.get(r[k]) ?? 0) + 1)
      return [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    }
    const walls = vote(2), roofMat = vote(3)
    return walls || roofMat || height || usage
      ? { ...(walls ? { walls } : {}), ...(roofMat ? { roofMat } : {}), ...(height ? { height } : {}), ...who } : null
  }
}

/** the rows for a city's whole detailed area: its box and its extra regions (La Défense, the road to Versailles, Versailles) */
export async function fetchTopoFor(spec: import('./cities.ts').CitySpec): Promise<TopoRow[]> {
  const { detailBboxOf } = await import('./cities.ts')
  const { detailTest, regionsOf, regionBbox } = await import('./detail.ts')
  const test = detailTest(spec)
  const boxes = [detailBboxOf(spec), ...regionsOf(spec).map((r) => regionBbox(r))]
  const box = { south: Math.min(...boxes.map((b) => b.south)), north: Math.max(...boxes.map((b) => b.north)),
    west: Math.min(...boxes.map((b) => b.west)), east: Math.max(...boxes.map((b) => b.east)) }
  return fetchTopo(box, (lat, lon) => test(lat, lon, 600))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { city } = await import('./cities.ts')
  const rows = await fetchTopoFor(city(process.env.CITY ?? 'paris-centre'))
  const walls: Record<string, number> = {}, roofs: Record<string, number> = {}
  for (const r of rows) { const w = wallKind(r[2]) ?? '-'; walls[w] = (walls[w] ?? 0) + 1; const f = roofKind(r[3]) ?? '-'; roofs[f] = (roofs[f] ?? 0) + 1 }
  console.log(`${rows.length} buildings\n  walls`, walls, '\n  roofs', roofs)
}
