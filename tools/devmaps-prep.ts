/**
 * devmaps prep: the post-bake step behind devmaps.html (docs/DEVMAPS.md). Reads a city's shipped v3 bake one tile at a
 * time and writes a scaled-down copy for the 2D viewer to public/devmaps/<city>/:
 *   meta.json       the index's small parts in ONE frame (v2 metres: x east, z north) — box, detail squares, zones, water,
 *                   landmarks, skyline, walls, roundabouts, per-tile stats, field census, tours routed on the ride graph
 *   major.json      the far view: big roads, rail, water, in metres, simplified
 *   search.json     [name, type, x, z, tileKey, ref] for everything with a name or a ref
 *   terrain.png     the coarse ground (terrain.bin) as a hillshade, georeferenced by meta.terrain
 *   chunk/<cx>_<cy>.json   the mid view: CHUNK×CHUNK tiles of streets (with level per segment), footprints, areas,
 *                   items, places, decks, boats, courts and ride-graph edges, each pointing back at its tile + index
 * Near in, the viewer fetches the RAW tiles (/cities/<id>/v3/<key>.json), so every field of the bake is shown there.
 *   node --max-old-space-size=8192 --experimental-strip-types tools/devmaps-prep.ts --city=bir-hakeim-mini [--city=…] | --all
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { PNG } from 'pngjs'
import { Projection } from '../src/city/geo.ts'
import { unpackRide, type RideFile } from '../src/city/ridefile.ts'
import type { RideEdge, RideGraph } from '../src/city/ridegraph.ts'
import { isTunnel, nearestOnGraph, planRoute, tourEdgeCost, type Route } from '../src/sim/route.ts'
import { SF_TOURS } from '../src/city/sf/tours.ts'
import { PARIS_TOURS } from '../src/city/paris/tours.ts'
import { SF as SFLAG, RF } from '../src/map/format.ts'
import { restyleInfo } from '../src/city/hand-looks.ts'
import { lookFor } from '../src/city/appearance.ts'
import type { MapIndex, MapTile, Way } from '../src/map/format.ts'

// ---- tunables ----
/** tiles per chunk side for the mid view */
const CHUNK = 8
/** |way z − ground| under this (m) is "at grade" — tools/level-map.ts LM_TOL */
const LEVEL_TOL = 0.7
/** footprint / area simplification in the mid view (m) */
const EPS_BUILDING = 0.4
const EPS_AREA = 1.0
/** far-view simplification (m) and which kinds count as major */
const EPS_MAJOR = 4
const MAJOR_KINDS = new Set(['motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'primary_link', 'secondary'])
/** a tour stop further than this from the ride graph is not on this city: the tour is skipped */
const TOUR_STOP_REACH = 200

const ROOT = resolve(import.meta.dirname, '..')
const CITIES = resolve(ROOT, 'public/cities')
const OUT = resolve(ROOT, 'public/devmaps')

const args = process.argv.slice(2)
const cities = args.includes('--all')
  ? readdirSync(CITIES).filter((c) => existsSync(resolve(CITIES, c, 'v3/index.json')))
  : args.filter((a) => a.startsWith('--city=')).map((a) => a.slice(7))
if (!cities.length) { console.error('usage: devmaps-prep.ts --city=<id> [--city=…] | --all'); process.exit(1) }

const r1 = (v: number): number => Math.round(v * 10) / 10
const r2 = (v: number): number => Math.round(v * 100) / 100

/** Ramer–Douglas–Peucker over a flat [x,z,…] list; `closed` keeps the ring's start */
function simplify(p: number[], eps: number): number[] {
  const n = p.length / 2
  if (n <= 3) return p
  const keep = new Uint8Array(n); keep[0] = keep[n - 1] = 1
  const stack: [number, number][] = [[0, n - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()!
    const ax = p[2 * a], az = p[2 * a + 1], bx = p[2 * b], bz = p[2 * b + 1]
    const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1e-9
    let best = -1, bi = -1
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((p[2 * i] - ax) * dz - (p[2 * i + 1] - az) * dx) / L
      if (d > best) { best = d; bi = i }
    }
    if (best > eps) { keep[bi] = 1; stack.push([a, bi], [bi, b]) }
  }
  const out: number[] = []
  for (let i = 0; i < n; i++) if (keep[i]) out.push(p[2 * i], p[2 * i + 1])
  return out
}

/** level class codes — the viewer's palette indexes these (tools/level-map.ts colours) */
const LV = { grade: 0, raised: 1, buried: 2, bridge: 3, tunnel: 4, trench: 5, unknown: 6 } as const

function prep(city: string): void {
  const t0 = Date.now()
  const dir = resolve(CITIES, city, 'v3')
  const idx = JSON.parse(readFileSync(resolve(dir, 'index.json'), 'utf8')) as MapIndex & Record<string, unknown>
  const out = resolve(OUT, city)
  if (existsSync(out)) rmSync(out, { recursive: true })
  mkdirSync(resolve(out, 'chunk'), { recursive: true })
  const T = idx.tile
  const zF = idx.zFloor
  const proj = new Projection(idx.origin)
  const kinds = idx.dict.kinds, names = idx.dict.names, items = idx.dict.items
  const vH = (zcm: number): number => (zcm + zF) / 100 // v3 cm above zFloor → v2 metres

  const chunks = new Map<string, Record<string, unknown[]>>()
  const chunkOf = (tx: number, ty: number): Record<string, unknown[]> => {
    const k = `${Math.floor(tx / CHUNK)}_${Math.floor(ty / CHUNK)}`
    let c = chunks.get(k)
    if (!c) { c = { streets: [], buildings: [], areas: [], items: [], places: [], decks: [], boats: [], courts: [], ride: [] }; chunks.set(k, c) }
    return c
  }
  const major: { k: string; f: number; p: number[] }[] = []
  const search: (string | number)[][] = []
  const tileStats: Record<string, Record<string, number>> = {}
  /** every key seen at each path, and how often: what the bake actually carries (the viewer lists it) */
  const census: Record<string, Record<string, number>> = {}
  const see = (path: string, o: Record<string, unknown>): void => {
    const c = (census[path] ??= {})
    for (const k of Object.keys(o)) c[k] = (c[k] ?? 0) + 1
  }
  const levelCount = [0, 0, 0, 0, 0, 0, 0]
  /** OSM id → the bake building that carries it as `b<id>` (for the landmark catalogue's footprints) */
  const byOsm = new Map<number, { t: string; i: number; x: number; z: number; k: string }>()
  /** OSM id → the render-time restyle (src/city/hand-looks.ts restyleInfo; SF street-photo labels via appearance.ts lookFor) */
  const restyles: Record<string, unknown> = {}

  // the coarse ground (terrain.bin, Int16 dm in v2 metres, row 0 south): the level fallback where a tile has no fine ground
  const tr = idx.terrain
  let dm: Int16Array | null = null
  if (tr?.bin && existsSync(resolve(dir, tr.bin))) {
    const buf = readFileSync(resolve(dir, tr.bin))
    dm = new Int16Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + tr.cols * tr.rows * 2))
  }
  const coarse = (x: number, z: number): number | null => {
    if (!dm || !tr) return null
    const fx = Math.max(0, Math.min(tr.cols - 1.001, (x - tr.x0) / tr.step)), fz = Math.max(0, Math.min(tr.rows - 1.001, (z - tr.z0) / tr.step))
    const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, n = tr.cols
    return (dm[j * n + i] * (1 - u) * (1 - v) + dm[j * n + i + 1] * u * (1 - v) + dm[(j + 1) * n + i] * (1 - u) * v + dm[(j + 1) * n + i + 1] * u * v) / 10
  }

  const keys = idx.tiles.map((t) => t.key)
  for (const key of keys) {
    const f = resolve(dir, key.replace(',', '_') + '.json')
    if (!existsSync(f)) continue
    const tile = JSON.parse(readFileSync(f, 'utf8')) as MapTile & Record<string, unknown>
    see('tile', tile)
    const ox = tile.tx * T, oy = tile.ty * T
    const N = tile.nodes
    const X = (i: number): number => r2(ox + N[3 * i] / 100)
    const Z = (i: number): number => r2(oy + N[3 * i + 1] / 100)
    const g = tile.terrain
    /** ground at tile-local cm, v2 metres (bilinear on the tile's own fine ground) */
    const ground = (xc: number, yc: number): number | null => {
      if (!g || !g.cols) return coarse(ox + xc / 100, oy + yc / 100)
      const s = g.step * 100, n = g.cols
      const fx = Math.max(0, Math.min(n - 1.001, xc / s)), fy = Math.max(0, Math.min(n - 1.001, yc / s))
      const i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j
      const a = g.z[j * n + i], b = g.z[j * n + i + 1], c = g.z[(j + 1) * n + i], d = g.z[(j + 1) * n + i + 1]
      return vH(a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v)
    }
    const ch = chunkOf(tile.tx, tile.ty)
    const st: Record<string, number> = { bytes: 0 }
    const bump = (k: string, n = 1): void => { st[k] = (st[k] ?? 0) + n }

    tile.ways.forEach((w0, wi) => {
      const w = w0 as Way & Record<string, unknown>
      see('way', w)
      bump('way.' + w.role)
      if (w.role === 'footprint' || w.role === 'hole' || w.role === 'area' || w.role === 'zone') return
      const p: number[] = []
      for (const n of w.nodes) p.push(X(n), Z(n))
      const kind = w.kind != null ? kinds[w.kind] : w.role
      const fl = w.flags ?? 0
      // per node: way height, ground, and the level of each segment
      const hz: number[] = [], dz: number[] = []
      w.nodes.forEach((n, j) => {
        const zc = w.z?.[j] ?? N[3 * n + 2]
        const h = vH(zc), gr = ground(N[3 * n], N[3 * n + 1])
        hz.push(r2(h)); dz.push(gr == null ? NaN : r2(h - gr))
      })
      const isRail = w.role === 'rail'
      const fixed = isRail ? (fl & RF.bridge ? LV.bridge : -1)
        : fl & SFLAG.trench ? LV.trench : fl & (SFLAG.tunnel | SFLAG.bore | SFLAG.cut) ? LV.tunnel
        : fl & SFLAG.bridge || w.role === 'bridge' || w.role === 'deck' ? LV.bridge : -1
      const lv: number[] = []
      for (let j = 1; j < w.nodes.length; j++) {
        let c: number = fixed
        if (c < 0) {
          const d = (dz[j - 1] + dz[j]) / 2
          c = Number.isNaN(d) ? LV.unknown : d > LEVEL_TOL ? LV.raised : d < -LEVEL_TOL ? LV.buried : LV.grade
        }
        lv.push(c); levelCount[c]++
      }
      const rec: Record<string, unknown> = { t: key, i: wi, r: w.role, k: kind, f: fl, p, h: hz, d: dz, lv }
      if (!g || !g.cols) rec.gc = 1 // levels judged against the COARSE ground: this tile ships none of its own
      if (w.layer) rec.L = w.layer
      if (w.z) rec.oz = 1 // this way overrides its nodes' z: the multi-level signal
      if (w.name != null) rec.n = names[w.name]
      if (w.width) rec.w = w.width / 100
      ch.streets.push(rec)
      if ((isRail || MAJOR_KINDS.has(kind)) && w.role !== 'wall') major.push({ k: isRail ? 'rail' : kind, f: fl, p: simplify(p, EPS_MAJOR).map(r1) })
      if (w.name != null) search.push([names[w.name], kind, p[0], p[1], key, w.ref ?? ''])
    })

    for (const [bi, b] of tile.buildings.entries()) {
      see('building', b as unknown as Record<string, unknown>)
      bump('building.' + b.kind)
      const ring = (wi?: number): number[] | null => {
        if (wi == null || !tile.ways[wi]) return null
        const p: number[] = []
        for (const n of tile.ways[wi].nodes) p.push(X(n), Z(n))
        return simplify(p, EPS_BUILDING).map(r1)
      }
      const rings: number[][] = []
      const main = ring(b.way)
      if (main) rings.push(main)
      if (b.parts) for (const pt of b.parts) { see('part', pt as unknown as Record<string, unknown>); const r = ring(pt.way); if (r) rings.push(r) }
      const rec: Record<string, unknown> = { t: key, i: bi, k: b.kind, x: r1(ox + b.cx / 100), z: r1(oy + b.cy / 100), rs: rings, ht: b.h != null ? b.h / 100 : undefined }
      if (b.lod) rec.lod = b.lod
      // style/archetype: the building's own, else its first part's (dict.styles / dict.archetypes indices)
      const st = b.style ?? b.parts?.find((q) => q.style != null)?.style, ar = b.archetype ?? b.parts?.find((q) => q.archetype != null)?.archetype
      if (st != null) rec.st = st
      if (ar != null) rec.ar = ar
      bump('style.' + (st != null ? idx.dict.styles[st] : '(none)'))
      ch.buildings.push(rec)
      const om = /^b(\d+)$/.exec(b.ref)
      if (om) {
        const id = Number(om[1])
        byOsm.set(id, { t: key, i: bi, x: rec.x as number, z: rec.z as number, k: b.kind })
        // restyles are applied at render time, so the bake doesn't carry them: ask the same functions the renderer asks
        const ri = restyleInfo(id)
        const sfl = idx.region === 'paris' ? null : lookFor(id, idx.dict.styles[b.style ?? -1] as never)
        if (ri || sfl) {
          const look = (ri?.look ?? sfl) as { style?: string; palette?: { wall?: string } } | null
          rec.lk = { w: look?.palette?.wall, s: look?.style, src: ri?.entry ? 'hand' : ri?.label ? 'label' : 'sf-label', on: ri ? ri.applied : false, ...((ri?.label as { confidence?: number } | undefined)?.confidence != null ? { c: (ri!.label as { confidence: number }).confidence } : {}) }
          restyles[id] = { ...(ri ?? {}), ...(sfl ? { sfLabelLook: sfl, sfNote: 'SF street-photo labels apply only with ?looks=labels' } : {}) }
        }
      }
      search.push([b.ref, 'building:' + b.kind, rec.x as number, rec.z as number, key, b.ref])
      if (b.proc) search.push([b.proc.name, 'procedural', rec.x as number, rec.z as number, key, b.ref])
      if (b.mesh) search.push([b.mesh.file, 'mesh', rec.x as number, rec.z as number, key, b.ref])
    }

    for (const [ai, a] of (tile.areas ?? []).entries()) {
      see('area', a as unknown as Record<string, unknown>)
      bump('area.' + a.kind)
      const w = tile.ways[a.way]
      if (!w) continue
      const p: number[] = []
      for (const n of w.nodes) p.push(X(n), Z(n))
      const holes = (a.holes ?? []).map((h) => { const q: number[] = []; for (const n of tile.ways[h]?.nodes ?? []) q.push(X(n), Z(n)); return simplify(q, EPS_AREA).map(r1) })
      ch.areas.push({ t: key, i: ai, k: a.kind, p: simplify(p, EPS_AREA).map(r1), ...(holes.length ? { ho: holes } : {}), ...(a.parking ? { pk: 1 } : {}) })
    }
    for (const [di, d] of (tile.decks ?? []).entries()) {
      see('deck', d as unknown as Record<string, unknown>)
      bump('deck')
      const w = tile.ways[d.way]; if (!w) continue
      const p: number[] = []
      for (const n of w.nodes) p.push(X(n), Z(n))
      ch.decks.push({ t: key, i: di, p: simplify(p, EPS_BUILDING).map(r1), h: r2(vH(d.z)) })
    }
    if (tile.items) {
      see('items', tile.items as unknown as Record<string, unknown>)
      const D = tile.items.data
      const flat: number[] = []
      for (let i = 0; i < D.length; i += 8) {
        flat.push(r1(ox + D[i] / 100), r1(oy + D[i + 1] / 100), D[i + 4])
        bump('item.' + (items[D[i + 4]] ?? D[i + 4]))
      }
      ch.items.push({ t: key, d: flat })
    }
    for (const [pi, pl] of (tile.places ?? []).entries()) {
      see('place', pl as unknown as Record<string, unknown>)
      bump('place.' + pl.kind)
      const x = r1(ox + pl.x / 100), z = r1(oy + pl.y / 100)
      ch.places.push({ t: key, i: pi, k: pl.kind, n: names[pl.name], x, z, ...(pl.tier ? { tier: pl.tier } : {}) })
      search.push([names[pl.name], 'place:' + pl.kind, x, z, key, pl.ref ?? ''])
    }
    for (const [bi, b] of (tile.boats ?? []).entries()) {
      see('boat', b as unknown as Record<string, unknown>)
      bump('boat')
      const p: number[] = []
      for (let i = 0; i < b.ring.length; i += 2) p.push(r1(ox + b.ring[i] / 100), r1(oy + b.ring[i + 1] / 100))
      ch.boats.push({ t: key, i: bi, p, ...(b.name ? { n: b.name } : {}) })
      if (b.name) search.push([b.name, 'boat', p[0], p[1], key, ''])
    }
    for (const [ci, c] of (tile.courts ?? []).entries()) {
      see('court', c as unknown as Record<string, unknown>)
      bump('court.' + c.sport)
      ch.courts.push({ t: key, i: ci, s: c.sport, x: r1(ox + c.x / 100), z: r1(oy + c.y / 100), hd: c.heading, l: c.len / 100, w: c.wid / 100 })
    }
    if (tile.terrain) bump('terrain.step' + tile.terrain.step)
    // any other top-level array the format doesn't know yet: count it so the viewer can say it exists
    for (const [k, v] of Object.entries(tile)) {
      if (!['v', 'key', 'tx', 'ty', 'nodes', 'nodeIds', 'ways', 'buildings', 'decks', 'areas', 'items', 'places', 'terrain', 'boats', 'courts'].includes(k)) bump('other.' + k, Array.isArray(v) ? v.length : 1)
    }
    st.bytes = idx.tiles.find((t) => t.key === key)?.bytes ?? 0
    tileStats[key] = st
  }

  // ---- ride graph (bike + run) into chunks ----
  let ride: RideGraph | null = null
  for (const mode of ['bike', 'run']) {
    const f = resolve(dir, `ride-${mode}.json`)
    if (!existsSync(f)) continue
    const rf = JSON.parse(readFileSync(f, 'utf8')) as RideFile
    for (const e of rf.edges) {
      if (!e) continue
      const mid = e.points.length >> 1 & ~1
      const tx = Math.floor(e.points[mid] / T), ty = Math.floor(e.points[mid + 1] / T)
      const { points, heights, over, ...rest } = e as unknown as Record<string, unknown> & { points: number[]; heights?: number[]; over: number[] }
      void over
      chunkOf(tx, ty).ride.push({ m: mode, p: points.map(r1), ...(heights ? { h: heights.map(r1) } : {}), a: rest })
    }
    // (unpackRide consumes the file's edges, so it goes last)
    if (mode === 'bike') ride = unpackRide(rf)
  }

  // ---- tours, routed the way tools/check-tours.ts routes them ----
  const tours: unknown[] = []
  if (ride) {
    const g = ride
    const sub = (e: RideEdge, from: number, to: number): { p: number[]; h: number[] } => {
      const p: number[] = [], h: number[] = []
      const fwd = to >= from, lo = Math.min(from, to), hi = Math.max(from, to)
      const pts: { x: number; z: number; h: number }[] = []
      let run = 0
      for (let i = 0; i < e.points.length; i++) {
        if (i) run += Math.hypot(e.points[i].x - e.points[i - 1].x, e.points[i].z - e.points[i - 1].z)
        if (run >= lo && run <= hi) pts.push({ ...e.points[i], h: e.heights?.[i] ?? NaN })
      }
      if (!fwd) pts.reverse()
      for (const q of pts) { p.push(r1(q.x), r1(q.z)); h.push(r1(q.h)) }
      return { p, h }
    }
    const along = (s: { edgeId: number; s: number }, r: Route): { p: number[]; h: number[] } => {
      const out = { p: [] as number[], h: [] as number[] }
      const add = (q: { p: number[]; h: number[] }): void => { out.p.push(...q.p); out.h.push(...q.h) }
      const first = g.edges.get(s.edgeId)!
      if (!r.nodes.length) { add(sub(first, s.s, r.target.s)); return out }
      add(sub(first, s.s, first.a === r.nodes[0] ? 0 : first.length))
      for (let i = 0; i < r.nodes.length; i++) {
        const n = r.nodes[i], e = g.edges.get(r.leave.get(n)!)
        if (!e) continue
        const fromA = e.a === n, last = i === r.nodes.length - 1
        add(sub(e, fromA ? 0 : e.length, last ? r.target.s : fromA ? e.length : 0))
      }
      return out
    }
    for (const t of [...SF_TOURS, ...PARIS_TOURS]) {
      const pts = t.stops.map((s) => proj.toLocal({ lat: s.lat, lon: s.lon }))
      // a mini holds only part of a tour: route each leg whose two stops are on this graph; km −1 = a leg not routed here
      const near = pts.map((p) => { const n = nearestOnGraph(g, p, isTunnel); return n && n.d <= TOUR_STOP_REACH ? n : null })
      if (!near.some(Boolean)) continue
      const legs: { p: number[]; h: number[]; km: number }[] = []
      for (let i = 1; i < pts.length; i++) {
        const s = near[i - 1], e = near[i]
        const route = s && e ? planRoute(g, { edgeId: s.edgeId, s: s.s, reversed: false }, pts[i], e, tourEdgeCost) : null
        legs.push(route && s ? { ...along(s, route), km: r2(route.length / 1000) } : { p: [], h: [], km: -1 })
      }
      if (!legs.some((l) => l.km >= 0)) continue
      tours.push({ id: t.id, name: t.name, blurb: t.blurb, partial: near.some((n) => !n), stops: t.stops.map((s, i) => ({ ...s, x: r1(pts[i].x), z: r1(pts[i].z), ...(near[i] ? {} : { off: true }) })), legs })
      for (const [i, s] of t.stops.entries()) if (s.name) search.push([s.name, 'tour stop: ' + t.name, r1(pts[i].x), r1(pts[i].z), '', t.id])
    }
  }

  // ---- custom builds: the landmark catalogues (procedural builders, kits), GLB statues, fountains ----
  const custom = customBuilds(idx, proj, byOsm, T)
  for (const c of custom) search.push([c.name, 'custom:' + c.kind + (c.proc ? ' ' + c.proc : ''), c.x, c.z, c.bld?.t ?? '', c.src])

  // ---- index parts, all in v2 metres ----
  const zones = (idx.zones ?? []).map((z) => ({ ref: z.ref, priority: z.priority, props: z.props, ring: z.ring.map((v) => r1(v / 100)) }))
  for (const z of zones) search.push([z.ref, 'zone', z.ring[0], z.ring[1], '', z.ref])
  const L = idx.legacy
  for (const l of L.landmarks) search.push([l.name, 'landmark:' + l.kind, l.x, l.z, '', String(l.id)])
  for (const s of idx.skyline ?? []) search.push([s.name, 'skyline', s.x, s.z, '', ''])
  const water = L.water.map((w) => ({ ...w, ring: simplify(w.ring as number[], EPS_AREA).map(r1) }))
  let river: unknown = null
  if (existsSync(resolve(dir, 'river.json'))) river = JSON.parse(readFileSync(resolve(dir, 'river.json'), 'utf8'))

  // ---- coarse terrain hillshade ----
  let terrain: unknown = null
  if (dm && tr) {
    const png = new PNG({ width: tr.cols, height: tr.rows })
    let lo = Infinity, hi = -Infinity
    for (const v of dm) { if (v < lo) lo = v; if (v > hi) hi = v }
    for (let r = 0; r < tr.rows; r++) for (let c = 0; c < tr.cols; c++) {
      const at = (rr: number, cc: number): number => dm[Math.max(0, Math.min(tr.rows - 1, rr)) * tr.cols + Math.max(0, Math.min(tr.cols - 1, cc))] / 10
      const gx = (at(r, c + 1) - at(r, c - 1)) / (2 * tr.step), gz = (at(r + 1, c) - at(r - 1, c)) / (2 * tr.step)
      const shade = Math.max(0, Math.min(1, 0.6 + (-gx + gz) * 1.2))
      const e = (dm[r * tr.cols + c] - lo) / Math.max(1, hi - lo)
      const o = ((tr.rows - 1 - r) * tr.cols + c) * 4 // image row 0 is NORTH
      png.data[o] = Math.round((180 + 60 * e) * shade); png.data[o + 1] = Math.round((200 - 30 * e) * shade); png.data[o + 2] = Math.round((170 - 40 * e) * shade); png.data[o + 3] = 255
    }
    writeFileSync(resolve(out, 'terrain.png'), PNG.sync.write(png))
    terrain = { x0: tr.x0, z0: tr.z0, step: tr.step, cols: tr.cols, rows: tr.rows, lo: lo / 10, hi: hi / 10, src: tr.src, resM: tr.resM }
  }

  const { tiles: _t, zones: _z, legacy: _l, terrain: _tr, dict, ...rest } = idx
  void _t; void _z; void _l; void _tr
  const meta = {
    prepVersion: 1, prepped: new Date().toISOString(), chunk: CHUNK, levelTol: LEVEL_TOL,
    index: rest, dict, terrain, zones, water, river,
    landmarks: L.landmarks, walls: L.walls ?? [], roundabouts: L.roundabouts ?? [],
    quayWalls: (L.quayWalls ?? []).length, garden: Object.fromEntries(Object.entries(L.garden ?? {}).map(([k, v]) => [k, (v as unknown[]).length])),
    tiles: idx.tiles.map((t) => ({ ...t, ...tileStats[t.key] })),
    chunks: [...chunks.keys()], census, tours, levelCount,
    legacyCensus: Object.fromEntries(Object.entries(L).map(([k, v]) => [k, Array.isArray(v) ? v.length : Object.keys(v as object)])),
  }
  writeFileSync(resolve(out, 'meta.json'), JSON.stringify(meta))
  writeFileSync(resolve(out, 'major.json'), JSON.stringify(major))
  writeFileSync(resolve(out, 'custom.json'), JSON.stringify(custom))
  writeFileSync(resolve(out, 'restyles.json'), JSON.stringify(restyles))
  // the index's legacy geometry the viewer draws (v2 metres): quay walls (ax,az,bx,bz,top,low,cap), and the gardens
  const G = L.garden
  writeFileSync(resolve(out, 'legacy.json'), JSON.stringify({
    quay: (L.quayWalls ?? []).flatMap((q) => [q.ax, q.az, q.bx, q.bz, q.top, q.low, q.cap].map(r2)),
    hedges: (G?.hedges ?? []).map((h) => ({ ...h, points: h.points.map(r1) })),
    flats: (G?.flats ?? []).map((f) => ({ ...f, ring: f.ring.map(r1) })),
    topiary: (G?.topiary ?? []).map(r1),
    formal: (G?.formal ?? []).map((f) => f.map(r1)),
  }))
  writeFileSync(resolve(out, 'search.json'), JSON.stringify(search))
  for (const [k, c] of chunks) writeFileSync(resolve(out, 'chunk', k + '.json'), JSON.stringify(c))
  console.log(`${city}: ${keys.length} tiles, ${chunks.size} chunks, ${tours.length} tours, ${search.length} names, ${((Date.now() - t0) / 1000).toFixed(1)} s`)
}

interface Custom { kind: 'builder' | 'statue' | 'fountain'; name: string; src: string; x: number; z: number; proc?: string; model?: string; rect?: number[]; bld?: { t: string; i: number; k: string }; approx?: string; entry: Record<string, unknown> }

/**
 * Where the hand-made things stand, from the catalogues src/render/landmarks.ts and render/statues.ts read
 * (public/landmarks/<region>.json, <region>/*.json, <region>-statues.json, <region>-fountains.json). A builder named by OSM
 * id is tied to the bake building carrying that id (its footprint is the one drawn); one at a lat/lon with a size gets
 * that rectangle, turned by `front` the way landmarks.ts turns it. This is an APPROXIMATION of landmarks.ts's fit
 * (`approx` says which way it was placed) — enough to find them, not to measure them.
 */
function customBuilds(idx: MapIndex, proj: Projection, byOsm: Map<number, { t: string; i: number; x: number; z: number; k: string }>, T: number): Custom[] {
  const region = idx.region === 'paris' ? 'paris' : 'san-francisco'
  const L = resolve(ROOT, 'public/landmarks')
  const read = (f: string): unknown => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null)
  const where = ((read(resolve(L, `${region}.where.json`)) as { at?: Record<string, [number, number]> } | null)?.at) ?? {}
  const files: [string, Record<string, unknown>[]][] = []
  const main = read(resolve(L, `${region}.json`)); if (Array.isArray(main)) files.push([`${region}.json`, main])
  if (existsSync(resolve(L, region))) for (const f of readdirSync(resolve(L, region)).filter((f) => f.endsWith('.json')).sort()) {
    const j = read(resolve(L, region, f)); if (Array.isArray(j)) files.push([`${region}/${f}`, j])
  }
  const tiles = new Set(idx.tiles.map((t) => t.key))
  const here = (x: number, z: number): boolean => tiles.has(`${Math.floor(x / T)},${Math.floor(z / T)}`)
  const rect = (x: number, z: number, w: number, d: number, deg: number): number[] => {
    const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a), out: number[] = []
    for (const [lx, lz] of [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]]) out.push(r1(x + lx * c + lz * s), r1(z - lx * s + lz * c))
    return out
  }
  const out: Custom[] = []
  const byName = new Map<string, { x: number; z: number }>()
  for (const [src, list] of files) for (const e of list) {
    const name = String(e.name ?? e.procedural ?? '?')
    let x: number | undefined, z: number | undefined, approx = '', bld: Custom['bld'], r: number[] | undefined
    const ids = ((e.osm as string[] | undefined) ?? []).map((o) => Number(o.split('/')[1]))
    const hit = ids.map((id) => byOsm.get(id)).find(Boolean)
    if (typeof e.lat === 'number' && typeof e.lon === 'number') {
      const p = proj.toLocal({ lat: e.lat, lon: e.lon }); x = p.x; z = p.z; approx = 'lat/lon'
      const size = e.size as number[] | undefined
      if (size) r = rect(x, z, size[0], size[1], typeof e.front === 'number' ? e.front + 180 : Number(e.rotateDeg ?? 0))
    } else if (hit) { x = hit.x; z = hit.z; bld = { t: hit.t, i: hit.i, k: hit.k }; approx = 'bake building' }
    else {
      const at = ((e.osm as string[] | undefined) ?? []).map((o) => where[o]).find(Boolean)
      if (at) { const p = proj.toLocal({ lat: at[0], lon: at[1] }); x = p.x; z = p.z; approx = 'where.json (no bake building)' }
    }
    if (x === undefined || z === undefined) continue
    byName.set(name, { x, z })
    if (!here(x, z)) continue
    out.push({ kind: 'builder', name, src, x: r1(x), z: r1(z), ...(e.procedural ? { proc: String(e.procedural) } : {}), ...(r ? { rect: r } : {}), ...(bld ? { bld } : {}), approx, entry: e })
  }
  const statues = read(resolve(L, `${region}-statues.json`))
  if (Array.isArray(statues)) for (const e of statues as Record<string, unknown>[]) {
    let p: { x: number; z: number } | undefined
    if (typeof e.lat === 'number' && typeof e.lon === 'number') p = proj.toLocal({ lat: e.lat, lon: e.lon })
    const att = e.attach as { to?: string } | undefined
    if (!p && att?.to) p = byName.get(att.to)
    if (!p || !here(p.x, p.z)) continue
    out.push({ kind: 'statue', name: String(e.name ?? e.id), src: `${region}-statues.json`, x: r1(p.x), z: r1(p.z), model: String(e.asset ?? e.model ?? ''), approx: att?.to && !e.lat ? `attached to ${att.to}` : 'lat/lon', entry: e })
  }
  const fountains = read(resolve(L, `${region}-fountains.json`))
  if (Array.isArray(fountains)) for (const e of fountains as Record<string, unknown>[]) {
    const p = byName.get(String(e.landmark))
    if (!p || !here(p.x, p.z)) continue
    out.push({ kind: 'fountain', name: `fountain: ${e.landmark}`, src: `${region}-fountains.json`, x: r1(p.x), z: r1(p.z), approx: `at ${e.landmark}`, entry: e })
  }
  return out
}

// every city prepped, for the viewer's picker
for (const c of cities) prep(c)
const list = readdirSync(OUT).filter((c) => existsSync(resolve(OUT, c, 'meta.json'))).map((c) => {
  const m = JSON.parse(readFileSync(resolve(OUT, c, 'meta.json'), 'utf8'))
  return { id: c, name: m.index.name, bake: m.index.bake, prepped: m.prepped }
})
writeFileSync(resolve(OUT, 'cities.json'), JSON.stringify(list, null, 1))
