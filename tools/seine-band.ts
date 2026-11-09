/*
 * THE SEINE BAND (2026-11-08, plan of record in plans/bridgeheads/NOTES.md; BDTOPO_BAND=1 only, the default bake is unchanged).
 * One data-defined zone instead of hand rings: the river's water (BD TOPO `surface_hydrographique`, nature Ecoulement naturel)
 * buffered BAND_WATER m, plus every bridge over it (BD TOPO road and rail troncons at sol '1' touching the water) buffered
 * BAND_BRIDGE m, which carries the band that far past each bridge's ends. Inside it the ground, the walls and the matched ways are
 * BD TOPO's (tools/bdtopo-zones.ts bdTopoBand), the inference passes stand down (tools/bake.ts `bandAt`), and it eases into the
 * normal map over BT_EASE m at its edge. A bridge named in regions.json `paris.bandExclude` (or BAND_EXCLUDE) is carved out with
 * everything within BAND_BRIDGE of it: the regression control. Nothing here is persisted; the BD TOPO pages are cached.
 * The shape is a distance field (no polygon union): two chamfer distance transforms on a BAND_CELL grid, read bilinearly.
 */
import { fetchBdTopo, btSol, btName, bdTopoZone, type BtFeature } from './bdtopo-zones.ts'
import type { DeckZoneSpec } from './deck-zones.ts'

/** the buffer round the water and round each bridge (m); the grid cell (m); water bodies smaller than this (m²) are not the river */
export const BAND_WATER = 120, BAND_BRIDGE = 90, BAND_CELL = 4, BAND_WATER_MIN_AREA = 30000
/** the river's BD TOPO nature */
export const BAND_WATER_NATURE = /^Ecoulement naturel$/
/** THE RIVERBED LINE (2026-11-08, per place): posts under it inside the band are the river and its bed, left alone. It stands
 *  BAND_RIVERBED_OVER m over the water's surface there, so a lower quai ~1.5 m over the water is still ground (Pont National's hand
 *  zone had 28.4 NGF = 26.9 + 1.5). The surface: the region's `riverLevel` (Paris 26.9 NGF, the Suresnes pool), or, where the
 *  nearest BD TOPO water polygon's own z (its BAND_LEVEL_Q quantile: some rings are draped on the bank, 26.9..38.9 with a median
 *  of 30.8 at Garigliano; BD TOPO gives whole metres, ±1.5 m) differs from it by more than
 *  BAND_LEVEL_TRUST, that z (another pool: below the Suresnes dam ~3 m lower). BAND_RIVER_LEVEL when the region has none. */
export const BAND_RIVERBED_OVER = 1.5, BAND_LEVEL_TRUST = 2, BAND_RIVER_LEVEL = 26.9, BAND_LEVEL_Q = 0.1
/** the old single line (Pont National's), kept for a zone built without a band */
export const BAND_RIVERBED = BAND_RIVER_LEVEL + BAND_RIVERBED_OVER
/** bridges never in the band (by name, case and accents ignored); regions.json bandExclude adds to it */
export const BAND_EXCLUDE: string[] = []
/** EXCLUSION BY LOCATION (2026-11-08): an exclude entry names an OSM bridge (its man_made=bridge outline, its bridge-tagged deck
 *  ways); the band is carved out within BAND_EXCLUDE_PAD m of those shapes. BD TOPO troncons of that name are carved too; when no
 *  OSM bridge has the name, only they are (the old rule; Pont de Sèvres's troncons over the water are unnamed) */
export const BAND_EXCLUDE_PAD = Number(process.env.BAND_EXCLUDE_PAD ?? 90), BAND_EXCLUDE_UNDER = 12
/** an OSM bridge's shape in local metres: its outline ring or a deck way's polyline */
export interface BandBridgeShape { name: string; pts: { x: number; z: number }[]; ring?: boolean }

type LL = (lat: number, lon: number) => { x: number; z: number }
export interface SeineBand {
  /** metres outside the band (0 inside); in an excluded bridge's carve-out, metres inside the carve's edge (BAND_EXCLUDE_PAD m from
   *  the bridge), so the band eases out over BT_EASE there as at its other edges (a hard 1e9 cut stepped Quai Alphonse Le Gallo) */
  out(x: number, z: number): number
  inside(x: number, z: number): boolean
  /** local box [x0, z0, x1, z1] of the band's cells */
  box: [number, number, number, number]
  /** lat/lon box [s, w, n, e] */
  boxLL: [number, number, number, number]
  bridges: string[]; excluded: string[]; waters: number
  /** the riverbed line (NGF) at a local point: the nearest water's surface + BAND_RIVERBED_OVER */
  riverbed(x: number, z: number): number
}
const norm = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const area = (r: number[][]): number => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] - r[i][0]) * (r[j][1] + r[i][1]); return Math.abs(a / 2) }

/** two-pass chamfer distance (m) from the seed cells (d = 0); `lv`, if given, carries each seed's value to the cells nearest it */
function chamfer(d: Float32Array, c: number, r: number, h: number, lv?: Float32Array): void {
  const dg = h * Math.SQRT2
  const relax = (k: number, o: number, s: number): void => { if (d[o] + s < d[k]) { d[k] = d[o] + s; if (lv) lv[k] = lv[o] } }
  for (let j = 0; j < r; j++) for (let i = 0; i < c; i++) {
    const k = j * c + i
    if (i) relax(k, k - 1, h)
    if (j) { relax(k, k - c, h); if (i) relax(k, k - c - 1, dg); if (i < c - 1) relax(k, k - c + 1, dg) }
  }
  for (let j = r - 1; j >= 0; j--) for (let i = c - 1; i >= 0; i--) {
    const k = j * c + i
    if (i < c - 1) relax(k, k + 1, h)
    if (j < r - 1) { relax(k, k + c, h); if (i < c - 1) relax(k, k + c + 1, dg); if (i) relax(k, k + c - 1, dg) }
  }
}

/** the band over the lat/lon box [s, w, n, e] (a city's), from BD TOPO alone: the same in the bake and in `bake --rides` */
export async function seineBand(boxLL: [number, number, number, number], toLocal: LL, exclude: string[], log: (s: string) => void, riverLevel = BAND_RIVER_LEVEL, osm: BandBridgeShape[] = []): Promise<SeineBand> {
  const [s, w, n, e] = boxLL
  const water = (await fetchBdTopo('surface_hydrographique', s, w, n, e)).filter((f) => BAND_WATER_NATURE.test(String(f.props.nature)) && btSol(f) === '0')
  // each ring with its surface: the region's level unless BD TOPO's own z (median) is another pool's
  const ringLv: number[] = []
  const rings = water.flatMap((f) => {
    const zs = f.coords.flat().map((v) => v[2]).filter((v) => typeof v === 'number' && v > -100).sort((a, b) => a - b), zm = zs.length ? zs[Math.floor(zs.length * BAND_LEVEL_Q)] : riverLevel
    const lv = Math.abs(zm - riverLevel) > BAND_LEVEL_TRUST ? zm : riverLevel
    return f.coords.map((pt) => pt.map(([lo, la]) => { const q = toLocal(la, lo); return [q.x, q.z] })).filter((r) => area(r) >= BAND_WATER_MIN_AREA).map((r) => { ringLv.push(lv); return r })
  })
  const a = toLocal(s, w), b = toLocal(n, e)
  const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), z0 = Math.min(a.z, b.z), z1 = Math.max(a.z, b.z)
  const c = Math.ceil((x1 - x0) / BAND_CELL) + 1, r = Math.ceil((z1 - z0) / BAND_CELL) + 1
  const lvW = new Float32Array(c * r).fill(riverLevel)
  const dW = new Float32Array(c * r).fill(1e9), dB = new Float32Array(c * r).fill(1e9), carve = new Float32Array(c * r).fill(1e9)
  // water cells (holes, the islands, count as water: they are inside the band anyway)
  // (scanline fill, even-odd: per row the ring's crossings, sorted; a cell-by-cell inRing over the Seine's bbox was
  //  rows x cols x vertices, minutes on paris-centre)
  for (const [ri, ring] of rings.entries()) {
    let rz0 = Infinity, rz1 = -Infinity
    for (const [, z] of ring) { rz0 = Math.min(rz0, z); rz1 = Math.max(rz1, z) }
    for (let j = Math.max(0, Math.floor((rz0 - z0) / BAND_CELL)); j <= Math.min(r - 1, Math.ceil((rz1 - z0) / BAND_CELL)); j++) {
      const zz = z0 + j * BAND_CELL, xs: number[] = []
      for (let a = 0, b = ring.length - 1; a < ring.length; b = a++) if ((ring[a][1] > zz) !== (ring[b][1] > zz)) xs.push((ring[b][0] - ring[a][0]) * (zz - ring[a][1]) / (ring[b][1] - ring[a][1]) + ring[a][0])
      xs.sort((p, q) => p - q)
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let i = Math.max(0, Math.ceil((xs[k] - x0) / BAND_CELL)); i <= Math.min(c - 1, Math.floor((xs[k + 1] - x0) / BAND_CELL)); i++) {
          if (x0 + i * BAND_CELL >= xs[k + 1]) break
          dW[j * c + i] = 0; lvW[j * c + i] = ringLv[ri]
        }
    }
  }
  const wet = (x: number, z: number): boolean => { const i = Math.round((x - x0) / BAND_CELL), j = Math.round((z - z0) / BAND_CELL); return i >= 0 && j >= 0 && i < c && j < r && dW[j * c + i] === 0 }
  // the bridges: sol-1 road and rail troncons with a vertex over the water, grouped by name (an unnamed one by its id)
  const decks = [...await fetchBdTopo('troncon_de_route', s, w, n, e), ...await fetchBdTopo('troncon_de_voie_ferree', s, w, n, e)].filter((f) => btSol(f) === '1')
  const ex = new Set([...BAND_EXCLUDE, ...exclude].map(norm)), names = new Set<string>(), excluded = new Set<string>()
  const stamp = (f: BtFeature, d: Float32Array) => {
    for (const pt of f.coords) for (let k = 1; k < pt.length; k++) {
      const p = toLocal(pt[k - 1][1], pt[k - 1][0]), q = toLocal(pt[k][1], pt[k][0]), m = Math.max(1, Math.ceil(Math.hypot(q.x - p.x, q.z - p.z) / (BAND_CELL / 2)))
      for (let t = 0; t <= m; t++) {
        const i = Math.round((p.x + (q.x - p.x) * t / m - x0) / BAND_CELL), j = Math.round((p.z + (q.z - p.z) * t / m - z0) / BAND_CELL)
        if (i >= 0 && j >= 0 && i < c && j < r) d[j * c + i] = 0
      }
    }
  }
  const stampLocal = (pts: { x: number; z: number }[], ring: boolean, d: Float32Array) => {
    for (let k = ring ? 0 : 1; k < pts.length; k++) {
      const p = pts[k === 0 ? pts.length - 1 : k - 1], q = pts[k], m = Math.max(1, Math.ceil(Math.hypot(q.x - p.x, q.z - p.z) / (BAND_CELL / 2)))
      for (let t = 0; t <= m; t++) {
        const i = Math.round((p.x + (q.x - p.x) * t / m - x0) / BAND_CELL), j = Math.round((p.z + (q.z - p.z) * t / m - z0) / BAND_CELL)
        if (i >= 0 && j >= 0 && i < c && j < r) d[j * c + i] = 0
      }
    }
  }
  const osmHit = new Map<string, number>()
  for (const b of osm) if (ex.has(norm(b.name)) && b.pts.length) { stampLocal(b.pts, !!b.ring, carve); excluded.add(b.name); osmHit.set(b.name, (osmHit.get(b.name) ?? 0) + 1) }
  // (a troncon lying wholly within BAND_EXCLUDE_UNDER m of an excluded OSM bridge's shapes is that bridge's, named or not)
  const carve0 = carve.slice(); if (osmHit.size) chamfer(carve0, c, r, BAND_CELL)
  for (const f of decks) {
    if (!f.coords.some((pt) => pt.some(([lo, la]) => { const q = toLocal(la, lo); return wet(q.x, q.z) }))) continue
    const nm = btName(f) || f.id
    if (osmHit.size && f.coords.every((pt) => pt.every(([lo, la]) => { const q = toLocal(la, lo), i = Math.round((q.x - x0) / BAND_CELL), j = Math.round((q.z - z0) / BAND_CELL); return i < 0 || j < 0 || i >= c || j >= r || carve0[j * c + i] <= BAND_EXCLUDE_UNDER }))) { excluded.add(`${nm} (under)`); stamp(f, carve); continue }
    if (ex.has(norm(nm))) { excluded.add(nm); stamp(f, carve); continue }
    names.add(nm); stamp(f, dB)
  }
  chamfer(dW, c, r, BAND_CELL, lvW); chamfer(dB, c, r, BAND_CELL); if (excluded.size) chamfer(carve, c, r, BAND_CELL)
  if (osmHit.size) log(`seine band: excluded by OSM bridge (${BAND_EXCLUDE_PAD} m): ${[...osmHit].map(([k, v]) => `${k} ×${v}`).join(', ')}`)
  const out = new Float32Array(c * r)
  for (let k = 0; k < c * r; k++) out[k] = Math.max(0, Math.min(dW[k] - BAND_WATER, dB[k] - BAND_BRIDGE), BAND_EXCLUDE_PAD - carve[k])
  const at = (x: number, z: number): number => {
    const fx = (x - x0) / BAND_CELL, fz = (z - z0) / BAND_CELL, i = Math.floor(fx), j = Math.floor(fz)
    if (i < 0 || j < 0 || i >= c - 1 || j >= r - 1) return 1e9
    const tx = fx - i, tz = fz - j
    return (out[j * c + i] * (1 - tx) + out[j * c + i + 1] * tx) * (1 - tz) + (out[(j + 1) * c + i] * (1 - tx) + out[(j + 1) * c + i + 1] * tx) * tz
  }
  let bx0 = Infinity, bx1 = -Infinity, bz0 = Infinity, bz1 = -Infinity, cells = 0
  for (let j = 0; j < r; j++) for (let i = 0; i < c; i++) if (out[j * c + i] === 0) { cells++; bx0 = Math.min(bx0, x0 + i * BAND_CELL); bx1 = Math.max(bx1, x0 + i * BAND_CELL); bz0 = Math.min(bz0, z0 + j * BAND_CELL); bz1 = Math.max(bz1, z0 + j * BAND_CELL) }
  const riverbed = (x: number, z: number): number => {
    const i = Math.min(c - 1, Math.max(0, Math.round((x - x0) / BAND_CELL))), j = Math.min(r - 1, Math.max(0, Math.round((z - z0) / BAND_CELL)))
    return lvW[j * c + i] + BAND_RIVERBED_OVER
  }
  const lvs = [...new Set(ringLv)].map((v) => (v + BAND_RIVERBED_OVER).toFixed(1))
  log(`seine band: riverbed line ${lvs.join(' / ')} NGF (surface ${riverLevel} + ${BAND_RIVERBED_OVER}${lvs.length > 1 ? '; another pool' : ''})`)
  log(`seine band: ${rings.length} water rings, ${names.size} bridges (${[...names].join(', ')})${excluded.size ? `, excluded: ${[...excluded].join(', ')}` : ''}; ${Math.round(cells * BAND_CELL * BAND_CELL / 1e4)} ha inside`)
  return { out: (x, z) => { const v = at(x, z); return v < 0.01 ? 0 : v }, inside: (x, z) => at(x, z) < 0.01, box: cells ? [bx0, bz0, bx1, bz1] : [0, 0, 0, 0], boxLL, bridges: [...names], excluded: [...excluded], waters: rings.length, riverbed }
}

/** the deck zones of a BDTOPO_BAND=1 bake (and of `bake --rides` with it): the band first, then each hand zone's BD TOPO version as
 *  an OVERRIDE inside its own ring (no 90 m band of its own: the Seine band is that now). The band's box is the city's. */
export const BAND_BOX_PAD = 1.1
export async function bandDeckZones(centre: { lat: number; lon: number }, radius: number, hands: DeckZoneSpec[], exclude: string[], toLocal: LL, log: (s: string) => void, riverLevel?: number, osm: BandBridgeShape[] = []): Promise<{ zones: DeckZoneSpec[]; band: SeineBand }> {
  const dLa = radius * BAND_BOX_PAD / 111200, dLo = radius * BAND_BOX_PAD / (111200 * Math.cos(centre.lat * Math.PI / 180))
  const band = await seineBand([centre.lat - dLa, centre.lon - dLo, centre.lat + dLa, centre.lon + dLo], toLocal, exclude, log, riverLevel, osm)
  const lg: string[] = []
  const zones: DeckZoneSpec[] = [await bdTopoZone({ name: 'Seine band', ring: [], levels: [] } as unknown as DeckZoneSpec, lg, band)]
  for (const h of hands) {
    // a hand zone off the band's box (another mini's) or round an excluded bridge stays out
    const [la, lo] = h.ring[0] ?? [0, 0]
    if (la < band.boxLL[0] || la > band.boxLL[2] || lo < band.boxLL[1] || lo > band.boxLL[3]) continue
    zones.push({ ...await bdTopoZone(h, lg), band: [0, 0] })
  }
  for (const t of lg) log(t)
  return { zones, band }
}
