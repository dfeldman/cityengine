/**
 * THE AUDIT OF EVERY RAILWAY IN PARIS (owner, 2026-10-31: "take a look at all the train tracks. I'm pretty sure many of the tunnels and
 * overpasses are wrong"). A list, not a sample: what OSM says of each line against what the bake drew, the suspicious spots with lat/lon.
 *
 *   node --max-old-space-size=1500 --experimental-strip-types tools/rail-audit.ts inventory <dir>    the OSM ways and their lines → <dir>/osm-rails.json
 *   node --max-old-space-size=1500 --experimental-strip-types tools/rail-audit.ts extract <dir>      the baked rails, streets, near buildings and ground → <dir>/net.json, ground.bin
 *   node --max-old-space-size=1500 --experimental-strip-types tools/rail-audit.ts check <dir> [--dry]  the spots → <dir>/spots.json, counts on stdout
 *
 * `inventory` wants, in <dir>: ways.geojsonseq (`osmium tags-filter` of the running railways, `osmium export --add-unique-id=type_id`) and
 * routes.opl (`osmium tags-filter r/route=train,subway,tram,light_rail,funicular,railway -R`, `osmium cat -f opl`). `extract` reads the v2
 * tiles one at a time, not the 200 MB package: the tiles have whole edges and rails, and it costs 150 MB, not 4 GB.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { StreetGrade } from '../src/city/grade.ts'
import type { PackedRail } from '../src/city/package.ts'
import { ignLidar } from './ign-lidar.ts'
import { bedPosts, levelParisRails, parisRailRecord, railFineTiles, railMouths, stationShells, straightDeck, type OverLine } from './rail-levels.ts'

const ROOT = resolve(import.meta.dirname, '..')
const X = (lon: number): number => (lon - 2.332) * 73270
const Z = (lat: number): number => (lat - 48.8605) * 111320
const LON = (x: number): number => +(2.332 + x / 73270).toFixed(6)
const LAT = (z: number): number => +(48.8605 + z / 111320).toFixed(6)
const BOX = { x0: -8355, x1: 5715, z0: -4510, z1: 4175 }
const inBox = (x: number, z: number, m = 0): boolean => x >= BOX.x0 - m && x <= BOX.x1 + m && z >= BOX.z0 - m && z <= BOX.z1 + m

export interface OsmRail {
  id: number
  railway: string
  points: number[]
  bridge?: string; tunnel?: string; cutting?: string; embankment?: string; layer?: number; level?: string; covered?: string
  service?: string; usage?: string; name?: string; ref?: string
  /** the lines whose route relations hold this way: "RER C", "M6", "T3a", "N", "L" */
  lines?: string[]
}

function inventory(dir: string): void {
  const lines = new Map<number, Set<string>>()
  for (const l of readFileSync(resolve(dir, 'routes.opl'), 'utf8').split('\n')) {
    if (!l.startsWith('r')) continue
    const t = / T(\S*)/.exec(l)?.[1] ?? ''
    const tag = (k: string): string | undefined => new RegExp(`(?:^|,)${k}=([^,]*)`).exec(t)?.[1]?.replace(/%20%/g, ' ').replace(/%[0-9a-f]+%/g, '')
    const route = tag('route'), ref = tag('ref'), net = tag('network') ?? ''
    if (!ref && !tag('name')) continue
    const label = route === 'subway' ? `M${ref}` : /^(tram|light_rail)$/.test(route ?? '') ? ref ?? tag('name')! : /RER/i.test(net) ? `RER ${ref}` : ref ? `Tn ${ref}` : tag('name')!
    const m = / M(\S*)/.exec(l)?.[1] ?? ''
    for (const x of m.split(',')) {
      const w = /^w(\d+)@/.exec(x)
      if (w) (lines.get(+w[1]) ?? lines.set(+w[1], new Set()).get(+w[1])!).add(label)
    }
  }
  const out: OsmRail[] = []
  const stations: { name: string; kind: string; x: number; z: number }[] = []
  const marks: { kind: string; x: number; z: number }[] = []
  const RUN = /^(rail|light_rail|tram|subway|narrow_gauge|funicular|monorail|disused|abandoned|razed|construction)$/
  for (const l of readFileSync(resolve(dir, 'ways.geojsonseq'), 'utf8').split('\n')) {
    const s = l.replace(/^\x1e/, '').trim()
    if (!s) continue
    const f = JSON.parse(s) as { id: string; geometry: { type: string; coordinates: number[][] & number[] }; properties: Record<string, string> }
    const p = f.properties
    if (f.geometry.type === 'Point') {
      if (/^(level_crossing|crossing|buffer_stop)$/.test(p.railway ?? '')) {
        const c = f.geometry.coordinates as unknown as number[]
        if (inBox(X(c[0]), Z(c[1]), 200)) marks.push({ kind: p.railway, x: Math.round(X(c[0]) * 10) / 10, z: Math.round(Z(c[1]) * 10) / 10 })
      }
      if (/^(station|halt|tram_stop)$/.test(p.railway ?? '') && p.name) {
        const c = f.geometry.coordinates as unknown as number[]
        if (inBox(X(c[0]), Z(c[1]), 200)) stations.push({ name: p.name, kind: p.subway === 'yes' || p.station === 'subway' ? 'metro' : p.railway === 'tram_stop' ? 'tram' : 'train', x: Math.round(X(c[0])), z: Math.round(Z(c[1])) })
      }
      continue
    }
    if (f.geometry.type !== 'LineString' || !RUN.test(p.railway ?? '')) continue
    const c = f.geometry.coordinates as number[][]
    if (!c.some((q) => inBox(X(q[0]), Z(q[1]), 100))) continue
    const id = +f.id.slice(1)
    const o: OsmRail = { id, railway: p.railway, points: c.flatMap((q) => [+X(q[0]).toFixed(2), +Z(q[1]).toFixed(2)]) }
    for (const k of ['bridge', 'tunnel', 'cutting', 'embankment', 'level', 'covered', 'service', 'usage', 'name', 'ref'] as const) if (p[k] && p[k] !== 'no') o[k] = p[k]
    const layer = parseInt(p.layer ?? '', 10)
    if (Number.isFinite(layer)) o.layer = layer
    const ls = lines.get(id)
    if (ls) o.lines = [...ls].sort()
    out.push(o)
  }
  writeFileSync(resolve(dir, 'osm-rails.json'), JSON.stringify({ rails: out, stations, marks }))
  const byKind = new Map<string, number>()
  for (const r of out) byKind.set(r.railway, (byKind.get(r.railway) ?? 0) + 1)
  console.log(`${out.length} ways, ${stations.length} stations:`, Object.fromEntries(byKind))
}

export interface Street { id: number; a: number; b: number; points: number[]; heights?: number[]; kind?: string; name?: string; foot?: boolean; tunnel?: boolean; bridge?: boolean; layer?: number; ramp?: boolean; cut?: boolean; width: number; walk: number; bore?: boolean; authored?: boolean }
export interface Near { id: number; ring: number[]; minHeight?: number; height?: number; name?: string }

function extract(dir: string): void {
  const tiles = resolve(ROOT, 'tools/cache/bake/paris-centre/tiles')
  const rails = new Map<number, PackedRail>()
  const edges = new Map<number, Street>()
  const buildings: Near[] = []
  const blocks: { tx: number; tz: number; step: number; cols: number; off: number }[] = []
  const dm: number[] = []
  const files = readdirSync(tiles).filter((f) => f.endsWith('.json'))
  for (const f of files) {
    const t = JSON.parse(readFileSync(resolve(tiles, f), 'utf8')) as { key: string; rails?: PackedRail[]; edges: (Street & Record<string, unknown>)[]; buildings: (Near & Record<string, unknown>)[]; terrain?: { step: number; cols: number; dm: number[] } }
    for (const r of t.rails ?? []) rails.set(r.id, r)
    for (const e of t.edges) {
      if (edges.has(e.id)) continue
      edges.set(e.id, { id: e.id, a: e.a, b: e.b, points: e.points, heights: e.heights, kind: e.kind, name: e.name, foot: e.foot, tunnel: e.tunnel, bridge: e.bridge, layer: e.layer, ramp: e.ramp, cut: e.cut, width: e.width, walk: e.walk, bore: e.bore, authored: e.authored })
    }
    for (const b of t.buildings) buildings.push({ id: b.id, ring: b.ring, minHeight: b.minHeight, height: b.height, name: b.name })
    if (t.terrain) {
      const [tx, tz] = t.key.split(',').map(Number)
      blocks.push({ tx, tz, step: t.terrain.step, cols: t.terrain.cols, off: dm.length })
      for (const v of t.terrain.dm) dm.push(v)
    }
  }
  // only what stands near a railway
  const CELL = 60
  const near = new Set<string>()
  for (const r of rails.values()) {
    const p = r.points
    for (let i = 2; i < p.length; i += 2) {
      const n = Math.ceil(Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]) / CELL) || 1
      for (let k = 0; k <= n; k++) {
        const x = p[i - 2] + ((p[i] - p[i - 2]) * k) / n, z = p[i - 1] + ((p[i + 1] - p[i - 1]) * k) / n
        for (const dx of [-CELL, 0, CELL]) for (const dz of [-CELL, 0, CELL]) near.add(`${Math.floor((x + dx) / CELL)},${Math.floor((z + dz) / CELL)}`)
      }
    }
  }
  const nearLine = (pts: number[]): boolean => { for (let i = 0; i < pts.length; i += 2) if (near.has(`${Math.floor(pts[i] / CELL)},${Math.floor(pts[i + 1] / CELL)}`)) return true; return false }
  const keptEdges = [...edges.values()].filter((e) => nearLine(e.points))
  const keptBuildings = buildings.filter((b) => nearLine(b.ring))
  const index = JSON.parse(readFileSync(resolve(ROOT, 'tools/cache/bake/paris-centre/index.json'), 'utf8')) as { terrain: { x0: number; z0: number; step: number; cols: number; rows: number } ; tile: number }
  writeFileSync(resolve(dir, 'net.json'), JSON.stringify({ tile: index.tile, coarse: index.terrain, blocks, rails: [...rails.values()], edges: keptEdges, allEdges: edges.size, buildings: keptBuildings }))
  writeFileSync(resolve(dir, 'ground.bin'), Buffer.from(Int16Array.from(dm).buffer))
  console.log(`${files.length} tiles: ${rails.size} rails, ${keptEdges.length} of ${edges.size} edges and ${keptBuildings.length} of ${buildings.length} buildings near them, ${blocks.length} ground blocks (${dm.length} samples)`)
}

export interface Net {
  tile: number; rails: PackedRail[]; edges: Street[]; buildings: Near[]
  raw: (x: number, z: number) => number
  grade: StreetGrade
  /** what the renderer drapes on: the ground, or the street's corridor (render: Terrain.heightAt) */
  drawn: (x: number, z: number) => number
}

export function loadNet(dir: string): Net {
  const n = JSON.parse(readFileSync(resolve(dir, 'net.json'), 'utf8')) as { tile: number; blocks: { tx: number; tz: number; step: number; cols: number; off: number }[]; rails: PackedRail[]; edges: Street[]; buildings: Near[] }
  const bin = readFileSync(resolve(dir, 'ground.bin'))
  const dm = new Int16Array(bin.buffer, bin.byteOffset, bin.length / 2)
  const by = new Map<string, typeof n.blocks[number]>()
  for (const b of n.blocks) by.set(`${b.tx},${b.tz}`, b)
  const raw = (x: number, z: number): number => {
    const tx = Math.floor(x / n.tile), tz = Math.floor(z / n.tile)
    const b = by.get(`${tx},${tz}`)
    if (!b) return NaN
    const fx = (x - tx * n.tile) / b.step, fz = (z - tz * n.tile) / b.step
    const ix = Math.max(0, Math.min(b.cols - 2, Math.floor(fx))), iz = Math.max(0, Math.min(b.cols - 2, Math.floor(fz)))
    const u = fx - ix, v = fz - iz, c = b.cols, o = b.off
    const a0 = dm[o + iz * c + ix] * (1 - u) + dm[o + iz * c + ix + 1] * u
    const b0 = dm[o + (iz + 1) * c + ix] * (1 - u) + dm[o + (iz + 1) * c + ix + 1] * u
    return (a0 * (1 - v) + b0 * v) / 10
  }
  const grade = new StreetGrade()
  for (const e of n.edges) grade.add(e as never)
  const drawn = (x: number, z: number): number => {
    const c = grade.cutAt(x, z)
    if (c !== null) return c
    const r = raw(x, z), g = grade.at(x, z)
    return g === null ? r : Math.max(r, g)
  }
  return { tile: n.tile, rails: n.rails, edges: n.edges, buildings: n.buildings, raw, grade, drawn }
}

/* ---- the spots */

interface Spot { type: string; lat: number; lon: number; x: number; z: number; d?: number; line?: string; rail?: number; note?: string }

/** which line a way belongs to, for the report's table */
export function lineOf(w: OsmRail): string {
  const n = w.name ?? '', ls = w.lines ?? []
  const has = (re: RegExp): boolean => ls.some((l) => re.test(l))
  if (/Ceinture|Épinettes|Raccordement de (Vaugirard|Bercy|Boulevard-Victor|Paris-Tolbiac)/i.test(n) && !has(/^RER/)) return 'Petite Ceinture'
  if (w.railway === 'funicular') return 'Funiculaire'
  for (const m of ['M1', 'M2', 'M5', 'M6', 'M13', 'M14', 'M8', 'M12', 'M4', 'M11', 'M3', 'M7', 'M9', 'M10', 'M15']) if (ls.includes(m)) return m
  for (const m of ['T1', 'T2', 'T3a', 'T3b', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'T13']) if (ls.includes(m)) return m
  if (w.railway === 'tram') return /T\d/.exec(n)?.[0] ?? 'tram'
  if (w.railway === 'subway') return 'métro (other)'
  for (const m of ['RER C', 'RER A', 'RER B', 'RER D', 'RER E']) if (ls.some((l) => l.startsWith(m))) return m
  if (/Saint-Lazare/.test(n)) return 'Saint-Lazare'
  if (/Paris-Nord/.test(n)) return 'Nord'
  if (/Paris-Est/.test(n)) return 'Est'
  if (/Paris-Lyon/.test(n)) return 'Lyon'
  if (/Austerlitz/.test(n)) return 'Austerlitz'
  if (/Montparnasse/.test(n)) return 'Montparnasse'
  return w.railway === 'rail' ? (w.service ? `yard (${w.service})` : 'other rail') : w.railway
}

/** a grid of line segments, for "what is near here" */
class Lines<T> {
  private readonly g = new Map<string, { ax: number; az: number; bx: number; bz: number; of: T }[]>()
  private readonly cell: number
  constructor(cell: number) { this.cell = cell }
  add(p: number[], of: T): void {
    for (let i = 2; i < p.length; i += 2) {
      const seg = { ax: p[i - 2], az: p[i - 1], bx: p[i], bz: p[i + 1], of }
      const n = Math.ceil(Math.hypot(seg.bx - seg.ax, seg.bz - seg.az) / this.cell) || 1
      const seen = new Set<string>()
      for (let k = 0; k <= n; k++) {
        const c = `${Math.floor((seg.ax + ((seg.bx - seg.ax) * k) / n) / this.cell)},${Math.floor((seg.az + ((seg.bz - seg.az) * k) / n) / this.cell)}`
        if (seen.has(c)) continue
        seen.add(c)
        const l = this.g.get(c)
        if (l) l.push(seg)
        else this.g.set(c, [seg])
      }
    }
  }
  /** everything in the cells round a point */
  each(x: number, z: number, f: (of: T) => void): void {
    const cx = Math.floor(x / this.cell), cz = Math.floor(z / this.cell)
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const s of this.g.get(`${cx + a},${cz + b}`) ?? []) f(s.of)
  }
  /** the nearest within d */
  near(x: number, z: number, d: number): { of: T; d: number } | null {
    const R = Math.ceil(d / this.cell)
    const cx = Math.floor(x / this.cell), cz = Math.floor(z / this.cell)
    let best: { of: T; d: number } | null = null
    for (let a = -R; a <= R; a++) for (let b = -R; b <= R; b++) for (const s of this.g.get(`${cx + a},${cz + b}`) ?? []) {
      const dx = s.bx - s.ax, dz = s.bz - s.az
      const t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / (dx * dx + dz * dz || 1)))
      const e = Math.hypot(s.ax + dx * t - x, s.az + dz * t - z)
      if (e < d && (!best || e < best.d)) best = { of: s.of, d: e }
    }
    return best
  }
}

const walk = (p: number[], step: number, f: (x: number, z: number, s: number, i: number) => void): number => {
  let s = 0, carry = 0
  for (let i = 2; i < p.length; i += 2) {
    const L = Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1])
    let d = carry
    for (; d < L; d += step) f(p[i - 2] + ((p[i] - p[i - 2]) * d) / (L || 1), p[i - 1] + ((p[i + 1] - p[i - 1]) * d) / (L || 1), s + d, i / 2)
    carry = d - L
    s += L
  }
  return s
}
const crossAt = (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number): { t: number; u: number } | null => {
  const rx = c - a, rz = d - b, sx = g - e, sz = h - f, den = rx * sz - rz * sx
  if (Math.abs(den) < 1e-9) return null
  const t = ((e - a) * sz - (f - b) * sx) / den, u = ((e - a) * rz - (f - b) * rx) / den
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? { t, u } : null
}
const inRing = (r: number[], x: number, z: number): boolean => {
  let on = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) on = !on
  }
  return on
}

export function check(net: Net, osm: OsmRail[], marks: { kind: string; x: number; z: number }[], mouths: { x: number; z: number; front: number }[]): Spot[] {
  const spots: Spot[] = []
  const osmG = new Lines<OsmRail>(30)
  for (const w of osm) if (w.railway !== 'razed' && w.railway !== 'construction') osmG.add(w.points, w)
  const lineAt = (x: number, z: number): string => { const n = osmG.near(x, z, 12); return n ? lineOf(n.of) : '?' }
  const add = (type: string, x: number, z: number, d?: number, note?: string, rail?: number): void => {
    spots.push({ type, lat: LAT(z), lon: LON(x), x: Math.round(x), z: Math.round(z), line: lineAt(x, z), ...(d !== undefined ? { d: Math.round(d * 10) / 10 } : {}), ...(note ? { note } : {}), ...(rail ? { rail } : {}) })
  }
  const drawnRails = net.rails.filter((r) => r.kind !== 'subway' || r.heights)
  const railG = new Lines<PackedRail>(20)
  for (const r of drawnRails) railG.add(r.points, r)
  const crossings = marks.filter((m) => m.kind !== 'buffer_stop')
  const stops = marks.filter((m) => m.kind === 'buffer_stop')
  const nearMark = (l: { x: number; z: number }[], x: number, z: number, d: number): boolean => l.some((m) => Math.hypot(m.x - x, m.z - z) < d)
  const hAt = (r: PackedRail, s: number): number | null => {
    if (!r.heights) return null
    let run = 0
    const p = r.points
    for (let i = 2; i < p.length; i += 2) {
      const L = Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1])
      if (run + L >= s) return r.heights[i / 2 - 1] + (r.heights[i / 2] - r.heights[i / 2 - 1]) * ((s - run) / (L || 1))
      run += L
    }
    return r.heights[r.heights.length - 1]
  }
  /** 1. ends: a track that stops, and why; 2. a deck's height against what it meets */
  const endsAt = new Map<string, { r: PackedRail; h: number | null }[]>()
  const key = (x: number, z: number): string => `${Math.round(x / 4)},${Math.round(z / 4)}`
  const ENDS = (r: PackedRail): { x: number; z: number; h: number | null; ix: number; iz: number }[] => {
    const p = r.points, n = p.length
    return [{ x: p[0], z: p[1], h: r.heights?.[0] ?? null, ix: p[2], iz: p[3] }, { x: p[n - 2], z: p[n - 1], h: r.heights?.[r.heights.length - 1] ?? null, ix: p[n - 4], iz: p[n - 3] }]
  }
  for (const r of drawnRails) for (const e of ENDS(r)) (endsAt.get(key(e.x, e.z)) ?? endsAt.set(key(e.x, e.z), []).get(key(e.x, e.z))!).push({ r, h: e.h })
  const undrawnG = new Lines<OsmRail>(20)
  for (const w of osm) {
    if (!/^(rail|tram|light_rail|subway|disused)$/.test(w.railway)) continue
    let drawn = 0, all = 0
    walk(w.points, 10, (x, z) => { all++; if (railG.near(x, z, 3)) drawn++ })
    if (drawn < all * 0.7) undrawnG.add(w.points, w)
  }
  for (const r of drawnRails) {
    if (r.funicular) continue
    for (const e of ENDS(r)) {
      let joined = false
      const mine = r
      const near = railG.near(e.x, e.z, 5) // nearest, any
      void near
      for (const a of [-1, 0, 1]) for (const b of [-1, 0, 1]) for (const o of endsAt.get(`${Math.round(e.x / 4) + a},${Math.round(e.z / 4) + b}`) ?? []) if (o.r !== mine) joined = true
      if (!joined) {
        // …or on another track's side
        const g2 = new Lines<PackedRail>(20)
        void g2
        const q = sideTrack(railG, mine, e.x, e.z)
        if (q) joined = true
      }
      if (joined) continue
      const u = undrawnG.near(e.x, e.z, 6)
      const mouth = mouths.some((m) => Math.hypot(m.x - e.x, m.z - e.z) < 14)
      if (nearMark(stops, e.x, e.z, 25)) continue
      if (!inBox(e.x, e.z, -30)) continue
      if (e.h !== null && e.h - net.raw(e.x, e.z) > 1.5) add('deck-end-in-air', e.x, e.z, e.h - net.raw(e.x, e.z), u?.of.tunnel ? 'tunnel next' : '', mine.id)
      if (u) { if (!mouth) add('stops-at-undrawn', e.x, e.z, undefined, `${u.of.railway} ${u.of.tunnel ? 'tunnel' : u.of.covered ? 'covered' : u.of.layer !== undefined && u.of.layer < 0 ? 'layer' + u.of.layer : u.of.cutting ? 'cutting' : u.of.level ? 'level' + u.of.level : 'plain'}`, mine.id) } else add('stub-end', e.x, e.z, undefined, '', mine.id)
    }
  }
  /** deck joins: a deck's end against the track it meets */
  for (const r of net.rails) {
    if (!r.heights || r.funicular) continue
    const p = r.points
    for (const e of ENDS(r)) {
      if (e.h === null) continue
      // a neighbouring deck, or a draped track
      const o: { r: PackedRail; h: number | null }[] = []
      for (const a of [-1, 0, 1]) for (const b of [-1, 0, 1]) for (const q of endsAt.get(`${Math.round(e.x / 4) + a},${Math.round(e.z / 4) + b}`) ?? []) {
        if (q.r === r) continue
        // (the node itself: the next track over is 4 m off, at its own level)
        const ee = ENDS(q.r).find((z2) => z2.h === q.h && Math.hypot(z2.x - e.x, z2.z - e.z) < 1.5)
        if (ee) o.push(q)
      }
      for (const q of o) {
        const h = q.h ?? net.drawn(e.x, e.z)
        if (Math.abs(h - e.h) > 1.2) { add('deck-step', e.x, e.z, e.h - h, `${q.h === null ? 'onto draped' : 'onto deck'} ${r.kind}${r.disused ? ' disused' : ''}`, r.id); break }
      }
    }
    // along the deck
    let s = 0, under = 0, high = 0, maxHigh = 0
    const L = walk(p, 5, (x, z, d) => { const h = hAt(r, d)!, g = net.raw(x, z); if (h < g - 1) under++; if (h - g > 11) { high++; maxHigh = Math.max(maxHigh, h - g) } })
    void s; void L
    if (under >= 3) add('deck-buried', p[p.length >> 1 & ~1], p[(p.length >> 1 & ~1) + 1], under * 5, '', r.id)
    if (high >= 3) add('deck-high', p[p.length >> 1 & ~1], p[(p.length >> 1 & ~1) + 1], maxHigh, '', r.id)
    // the grade along it
    let steep = 0
    for (let i = 1; i < r.heights.length; i++) {
      const dd = Math.hypot(p[i * 2] - p[i * 2 - 2], p[i * 2 + 1] - p[i * 2 - 1])
      if (dd > 3 && Math.abs(r.heights[i] - r.heights[i - 1]) / dd > 0.06) steep = Math.max(steep, Math.abs(r.heights[i] - r.heights[i - 1]) / dd)
    }
    if (steep) add('deck-steep', p[0], p[1], steep * 100, '', r.id)
  }
  /** the drawn level along a surface track: bumps and holes */
  for (const r of net.rails) {
    if (r.heights || r.kind === 'subway') continue
    const pr: { x: number; z: number; s: number; y: number; raw: number }[] = []
    walk(r.points, 5, (x, z, s) => pr.push({ x, z, s, y: net.drawn(x, z), raw: net.raw(x, z) }))
    if (pr.length < 8) continue
    let lastAt = -1e9
    for (let i = 0; i < pr.length; i++) {
      const w = pr.slice(Math.max(0, i - 12), i + 13).map((q) => q.y).sort((a, b) => a - b)
      const med = w[w.length >> 1], d = pr[i].y - med
      if (Math.abs(d) >= (r.kind === 'tram' ? 2 : 1.5) && pr[i].s - lastAt > 40) { add(d > 0 ? 'bump' : 'hole', pr[i].x, pr[i].z, d, pr[i].y - pr[i].raw > 1 ? 'on a street' : 'ground', r.id); lastAt = pr[i].s }
    }
    let lastSteep = -1e9
    for (let i = 8; i < pr.length; i++) {
      const g = Math.abs(pr[i].y - pr[i - 8].y) / 40
      if (g > (r.kind === 'tram' ? 0.08 : 0.05) && pr[i].s - lastSteep > 80) { add('steep', pr[i].x, pr[i].z, g * 100, '', r.id); lastSteep = pr[i].s }
    }
  }
  /** a track through a building, and along a road */
  const bG = new Map<string, Near[]>()
  for (const b of net.buildings) {
    if ((b.minHeight ?? 0) > 3) continue
    const seen = new Set<string>()
    for (let i = 0; i < b.ring.length; i += 2) {
      const c = `${Math.floor(b.ring[i] / 40)},${Math.floor(b.ring[i + 1] / 40)}`
      if (seen.has(c)) continue
      seen.add(c)
      ;(bG.get(c) ?? bG.set(c, []).get(c)!).push(b)
    }
  }
  const roadG = new Lines<Street>(30)
  for (const e of net.edges) if (!e.foot && !e.tunnel && !e.bridge) roadG.add(e.points, e)
  for (const r of drawnRails) {
    if (r.kind === 'tram') continue
    let inside = 0, along = 0, lastB = 0, lastR: Street | null = null
    walk(r.points, 4, (x, z) => {
      let hit: Near | null = null
      for (const a of [-1, 0, 1]) for (const b of [-1, 0, 1]) for (const q of bG.get(`${Math.floor(x / 40) + a},${Math.floor(z / 40) + b}`) ?? []) if (!hit && inRing(q.ring, x, z)) hit = q
      if (hit) {
        inside += 4
        if (inside === 12 && hit.id !== lastB) { add('through-building', x, z, undefined, (hit as Near).name ?? String((hit as Near).id), r.id); lastB = (hit as Near).id }
      } else inside = 0
      const q = roadG.near(x, z, 12)
      const onRoad = q && q.d < q.of.width / 2 + 1
      if (onRoad) {
        along += 4
        if (along === 24 && lastR !== q.of && !r.heights) { add('along-road', x, z, undefined, q.of.name ?? q.of.kind, r.id); lastR = q.of }
      } else along = 0
    })
  }
  /** crossings: which is on top, and is there room */
  const streetsByCell = new Lines<Street>(30)
  for (const e of net.edges) if (!e.tunnel && e.heights) streetsByCell.add(e.points, e)
  for (const r of drawnRails) {
    const p = r.points
    let run = 0
    for (let i = 2; i < p.length; i += 2) {
      const L = Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1])
      const cands = new Set<Street>()
      const n = Math.ceil(L / 15) || 1
      for (let k = 0; k <= n; k++) {
        const x = p[i - 2] + ((p[i] - p[i - 2]) * k) / n, z = p[i - 1] + ((p[i + 1] - p[i - 1]) * k) / n
        streetsByCell.each(x, z, (e) => cands.add(e))
      }
      for (const e of cands) {
        const q = e.points
        for (let j = 2; j < q.length; j += 2) {
          const c = crossAt(p[i - 2], p[i - 1], p[i], p[i + 1], q[j - 2], q[j - 1], q[j], q[j + 1])
          if (!c) continue
          const x = p[i - 2] + (p[i] - p[i - 2]) * c.t, z = p[i - 1] + (p[i + 1] - p[i - 1]) * c.t
          const sh = e.heights![j / 2 - 1] + (e.heights![j / 2] - e.heights![j / 2 - 1]) * c.u
          const rh = r.heights ? hAt(r, run + L * c.t)! : net.drawn(x, z)
          const tag = `${e.name ?? e.kind}`
          if (r.kind === 'tram' && !r.heights && !e.bridge) continue
          if (e.foot) {
            if (!r.heights && !e.bridge && !nearMark(crossings, x, z, 15) && r.kind === 'rail') add('foot-at-grade', x, z, sh - rh, tag, r.id)
            continue
          }
          if (r.heights) {
            const cl = rh - sh
            if (cl < 3.2 && !e.bridge) add('low-rail-bridge', x, z, cl, tag, r.id)
          } else if (e.bridge) {
            const cl = sh - rh
            if (cl < 3.2) add('low-street-bridge', x, z, cl, tag, r.id)
          } else if (!nearMark(crossings, x, z, 15)) {
            add('at-grade', x, z, sh - net.raw(x, z), tag, r.id)
          }
        }
      }
      run += L
    }
  }
  /** what OSM says against what was drawn */
  for (const w of osm) {
    if (!/^(rail|tram|light_rail|subway)$/.test(w.railway)) continue
    let L = 0
    const mid = { x: w.points[w.points.length >> 1 & ~1], z: w.points[(w.points.length >> 1 & ~1) + 1] }
    walk(w.points, 5, () => { L += 5 })
    if (L < 15 || !inBox(mid.x, mid.z)) continue
    const under = w.tunnel || w.covered
    let drawn = 0, all = 0, decked = 0
    walk(w.points, 5, (x, z) => { all++; const n = railG.near(x, z, 2.5); if (n) { drawn++; if (n.of.heights) decked++ } })
    if (under) continue
    if (w.service === 'yard' && w.usage === 'industrial') continue
    if (w.railway === 'subway' && !w.bridge) { if (drawn < all * 0.5 && (w.cutting || (w.layer ?? 0) >= 0)) add('metro-surface-undrawn', mid.x, mid.z, L, w.name ?? ''); continue }
    if (drawn < all * 0.5) add('surface-undrawn', mid.x, mid.z, L, `${w.railway}${(w.layer ?? 0) < 0 ? ' layer' + w.layer : ''}${w.cutting ? ' cutting' : ''}${w.level ? ' level' + w.level : ''}${w.service ? ' ' + w.service : ''}`)
    else if (w.bridge && decked < drawn * 0.5) add('osm-bridge-flat', mid.x, mid.z, L, w.name ?? '')
  }
  /** mouths: with a track, on its level */
  const mouthEnds = new Lines<PackedRail>(20)
  for (const r of drawnRails) mouthEnds.add(r.points, r)
  for (const m of mouths) {
    const n = mouthEnds.near(m.x, m.z, 10)
    if (!n) { add('mouth-no-track', m.x, m.z); continue }
    const o = (m.front * Math.PI) / 180
    // the opening looks along the track: the track there, and the ground behind the wall
    const front = net.drawn(m.x - Math.sin(o) * 8, m.z - Math.cos(o) * 8), back = net.raw(m.x + Math.sin(o) * 10, m.z + Math.cos(o) * 10)
    if (front - back > 2) add('mouth-on-a-rise', m.x, m.z, front - back)
  }
  /** the ways in the OSM's own disused network */
  return spots
}

/** another track's side at an end, not its own: a junction OSM drew to the middle of a way */
function sideTrack(g: Lines<PackedRail>, me: PackedRail, x: number, z: number): boolean {
  let found = false
  g.each(x, z, (r) => {
    if (r === me || found) return
    const p = r.points
    for (let i = 2; i < p.length; i += 2) {
      const dx = p[i] - p[i - 2], dz = p[i + 1] - p[i - 1]
      const t = Math.max(0, Math.min(1, ((x - p[i - 2]) * dx + (z - p[i - 1]) * dz) / (dx * dx + dz * dz || 1)))
      if (Math.hypot(p[i - 2] + dx * t - x, p[i - 1] + dz * t - z) < 5) { found = true; return }
    }
  })
  return found
}

/**
 * The dry run: the rail stage as the next bake will run it (rail-levels.ts `levelParisRails`), from OSM's ways, on the 4 m lidar in the tiles that will ship it, with each street near a railway
 * laid again on that ground. Streets' heights are the one approximation: the highest ground across each point, without the bake's easing.
 */
export async function dry(net: Net, osm: OsmRail[], dir: string): Promise<{ net: Net; mouths: { x: number; z: number; front: number; half: number; tight: boolean }[]; summary: string }> {
  const index = JSON.parse(readFileSync(resolve(ROOT, 'public/cities/paris-centre/v3/index.json'), 'utf8')) as { datumMsl: number }
  const lidar = await ignLidar({ south: 48.8, north: 48.91, west: 2.2, east: 2.42 })
  const CARRIED = (w: OsmRail): Record<string, string | undefined> => ({ railway: w.railway, tunnel: w.tunnel, covered: w.covered, layer: w.layer === undefined ? undefined : String(w.layer), level: w.level, cutting: w.cutting, bridge: w.bridge, service: w.service })
  const open: PackedRail[] = [], sunk: PackedRail[] = [], buried: { points: number[] }[] = []
  for (const w of osm) {
    if (!/^(rail|light_rail|tram|subway|narrow_gauge|funicular|monorail|disused)$/.test(w.railway)) continue
    if (w.service === 'yard' && w.usage === 'industrial') continue
    if (/^(abandoned|disused|razed|construction|proposed)$/.test(w.usage ?? '')) continue
    const got = parisRailRecord(CARRIED(w), w.id, w.points)
    if (got.rail) (got.fate === 'sunk' ? sunk : open).push(got.rail)
    else if (got.buried) buried.push({ points: w.points })
  }
  const fineTiles = railFineTiles([...open, ...sunk], net.tile)
  const posts = new Map<string, Float32Array>()
  const STEP = 4, N = Math.round(net.tile / STEP) + 1
  const fine = (x: number, z: number): number => {
    const tx = Math.floor(x / net.tile), tz = Math.floor(z / net.tile), k = `${tx},${tz}`
    if (!fineTiles.has(k)) return net.raw(x, z)
    let g = posts.get(k)
    if (!g) {
      g = new Float32Array(N * N)
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const px = tx * net.tile + i * STEP, pz = tz * net.tile + j * STEP
        const v = lidar.at(LAT(pz), LON(px))
        g[j * N + i] = v === null ? net.raw(px, pz) : v - index.datumMsl
      }
      posts.set(k, g)
    }
    const fx = (x - tx * net.tile) / STEP, fz = (z - tz * net.tile) / STEP
    const i = Math.min(N - 2, Math.floor(fx)), j = Math.min(N - 2, Math.floor(fz)), u = fx - i, v = fz - j
    return (g[j * N + i] * (1 - u) + g[j * N + i + 1] * u) * (1 - v) + (g[(j + 1) * N + i] * (1 - u) + g[(j + 1) * N + i + 1] * u) * v
  }
  const streets = net.edges.map((e) => {
    if (!e.heights || e.bridge || e.tunnel) return e
    const p = e.points
    const heights = e.heights.map((h, n) => {
      const x = p[n * 2], z = p[n * 2 + 1]
      if (!fineTiles.has(`${Math.floor(x / net.tile)},${Math.floor(z / net.tile)}`)) return h
      const a = p[Math.max(0, n * 2 - 2)], b = p[Math.max(1, n * 2 - 1)], c = p[Math.min(p.length - 2, n * 2 + 2)], d = p[Math.min(p.length - 1, n * 2 + 3)]
      const L = Math.hypot(c - a, d - b) || 1, nx = (d - b) / L, nz = -(c - a) / L, w = e.width / 2
      return Math.round(Math.max(fine(x, z), fine(x + nx * w, z + nz * w), fine(x - nx * w, z - nz * w)) * 100) / 100
    })
    return { ...e, heights }
  })
  let nextId = 900_000_000_000
  const got = levelParisRails(open, sunk, buried, streets as OverLine[], fine, (beds) => {
    const layered = bedPosts(beds, 0, 0, STEP)
    for (const [k, y] of layered) {
      const [c, r] = k.split(',').map(Number)
      const px = c * STEP, pz = r * STEP
      const tx = Math.floor(px / net.tile), tz = Math.floor(pz / net.tile)
      if (!fineTiles.has(`${tx},${tz}`)) continue
      fine(px + 0.1, pz + 0.1)
      const g = posts.get(`${tx},${tz}`)!
      g[(r - tz * (N - 1)) * N + (c - tx * (N - 1))] = y
      // (a post on a tile's edge is the next tile's too)
      if (c % (N - 1) === 0 && fineTiles.has(`${tx - 1},${tz}`)) { fine(px - 1, pz + 0.1); posts.get(`${tx - 1},${tz}`)![(r - tz * (N - 1)) * N + (N - 1)] = y }
      if (r % (N - 1) === 0 && fineTiles.has(`${tx},${tz - 1}`)) { fine(px + 0.1, pz - 1); posts.get(`${tx},${tz - 1}`)![(N - 1) * N + (c - tx * (N - 1))] = y }
    }
    return layered.size
  }, () => nextId++)
  for (const r of got.rails) if (r.funicular) straightDeck(r, fine)
  const grade = new StreetGrade()
  for (const e of streets) grade.add(e as never)
  const drawn = (x: number, z: number): number => {
    const c = grade.cutAt(x, z)
    if (c !== null) return c
    const r = fine(x, z), g = grade.at(x, z)
    return g === null ? r : Math.max(r, g)
  }
  const regionStations = (JSON.parse(readFileSync(resolve(ROOT, 'src/city/regions.json'), 'utf8')) as Record<string, { viaductStations?: { lat: number; lon: number }[] }>).paris?.viaductStations ?? []
  const shells = stationShells(net.buildings, got.rails, regionStations.map((q) => ({ x: X(q.lon), z: Z(q.lat) })))
  const dryNet: Net = { tile: net.tile, rails: got.rails, edges: streets, buildings: net.buildings.filter((b) => !shells.has(b.id)), raw: fine, grade, drawn }
  // what is under something: the tunnels, the roofed ways, and whatever of the rest was left undrawn
  const under = osm.filter((w) => /^(rail|light_rail|tram|subway|disused)$/.test(w.railway) && (w.tunnel || w.covered)).map((w) => ({ points: w.points }))
  for (const r of got.roofed) under.push({ points: r.points })
  const made = railMouths(under, got.rails).map((m) => ({ x: m.x, z: m.z, front: Math.round(((Math.atan2(m.ox, m.oz) * 180) / Math.PI + 540) % 360), half: m.half, tight: m.tight }))
  void dir
  return { net: dryNet, mouths: made, summary: `dry run: ${got.rails.length} rails; ${got.lying} sunk ways lying, ${got.roofed.length} roofed; ${got.holes} hole decks, ${got.posts} posts, ${shells.size} station shells; ${got.spans} spans, ${got.over} streets over, ${got.flat} flat, ${got.straight} decks on their level, ${got.dips} dips, ${got.viaducts} viaduct ways, ${got.eased} eased; ${made.length} mouths, ${made.filter((m) => m.tight).length} tight; ${fineTiles.size} fine tiles` }
}

async function runCheck(dir: string, isDry: boolean): Promise<void> {
  let net = loadNet(dir)
  const o = JSON.parse(readFileSync(resolve(dir, 'osm-rails.json'), 'utf8')) as { rails: OsmRail[]; marks: { kind: string; x: number; z: number }[] }
  const portals = JSON.parse(readFileSync(resolve(ROOT, 'public/landmarks/paris/portals.json'), 'utf8')) as { procedural: string; lat: number; lon: number; front: number }[]
  let mouths: { x: number; z: number; front: number }[] = portals.filter((p) => p.procedural === 'railPortal').map((p) => ({ x: X(p.lon), z: Z(p.lat), front: p.front }))
  if (isDry) {
    const d = await dry(net, o.rails, dir)
    net = d.net
    mouths = d.mouths
    console.log(d.summary)
    writeFileSync(resolve(dir, 'dry-rails.json'), JSON.stringify({ rails: net.rails.map((r) => ({ id: r.id, kind: r.kind, bridge: r.bridge, disused: r.disused, heights: r.heights, points: r.points })), mouths }))
  }
  const spots = check(net, o.rails, o.marks, mouths).filter((s) => inBox(s.x, s.z))
  writeFileSync(resolve(dir, isDry ? 'spots-dry.json' : 'spots.json'), JSON.stringify(spots, null, 0))
  const by = new Map<string, number>()
  for (const s of spots) by.set(s.type, (by.get(s.type) ?? 0) + 1)
  console.log([...by.entries()].sort().map(([k, v]) => `${k.padEnd(24)} ${v}`).join('\n'))
}

const [cmd, dirArg] = process.argv.slice(2)
if (import.meta.filename === resolve(process.argv[1] ?? '')) {
  const dir = resolve(dirArg ?? '.')
  if (cmd === 'inventory') inventory(dir)
  else if (cmd === 'extract') extract(dir)
  else if (cmd === 'check') await runCheck(dir, process.argv.includes('--dry'))
}
export { BOX, LAT, LON, X, Z, inBox }
