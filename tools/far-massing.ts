/**
 * FAR MASSING: the whole city's buildings as a coarse height grid, for the views from high up (the top of the
 * Grande Arche, the Ballon Generali, Sutro Tower) that look far past the streamed tiles (render/far-massing.ts).
 *
 *   node_modules/.bin/vite-node tools/far-massing.ts -- --city=paris-centre       (reads public/cities/<city>/v3 from disk)
 *   … --server=http://localhost:5200/                                               (or through a running dev server)
 *
 * The last stage of every bake (tools/bake.ts `farMassStage`, and tools/map-v3.ts after a v3 rewrite).
 *
 * Every tile is read through the game's own loader. Each building is rasterised onto a grid per LEVEL: a cell takes the
 * tallest top whose footprint covers its centre (or that holds the building's centroid, so a small building is not
 * lost), and that building's wall colour. Like neighbours are merged into rectangles (tops) and long runs (walls), and
 * a wall is written only where a cell stands above its neighbour. Two levels: CELL near, 2 × CELL far — on a grid,
 * every diagonal street front is a staircase of walls, so the coarse level is what keeps the far city cheap.
 *
 * Output: public/cities/<city>/v3/farmass.bin (format in render/far-massing.ts `readFarMassing`). A bake output,
 * re-made from the tiles each time, never kept as an intermediate.
 */
import { writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { openV3 } from '../src/map/store.ts'
import { unpackPoints } from '../src/city/package.ts'

type Point = { x: number; z: number }
import { Terrain } from '../src/city/terrain.ts'
import { paletteFor, style as styleOf, type Palette } from '../src/city/facade.ts'
import { region } from '../src/city/region.ts'
import { CHUNK, Q_XZ, Q_Y } from '../src/city/farmass-format.ts'

const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const city = arg('city', 'paris-centre')
const ROOT = resolve(import.meta.dirname, '..')
/** grid cell of the near level, metres (the far level is twice it): 20 m is ~4 px at 5 km in a 70° view */
const CELL = Number(arg('cell', '20'))
/** buildings lower than this are left out (the street's low sheds never show from a tower) */
const MIN_H = Number(arg('minh', '6'))
/** tops are rounded to this, metres, so neighbouring fronts of nearly equal height merge */
const TOP_STEP = Number(arg('step', '2'))
/** colours this close (sum of |Δ| over r, g, b, 0–765) merge into one quad: past 2 km a wall's tint is a few pixels */
const COLOUR_TOL = Number(arg('tol', '60'))
/** wall feet are snapped down to this, metres (under the ground, which hides them), so a run down a slope is one quad */
const FOOT_STEP = Number(arg('foot', '8'))
/** fetches in flight */
const PAR = 16

/*
 * From disk unless --server is given: `openV3` fetches, so file: URLs are answered from public/ here (query strings
 * dropped, JSON labelled as such, which the loader checks). No dev server needed inside a bake.
 */
let server = arg('server')
if (!server) {
  server = pathToFileURL(resolve(ROOT, 'public')).href + '/'
  const real = globalThis.fetch
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input)
    if (!url.startsWith('file:')) return real(input, init)
    try {
      const path = fileURLToPath(url.split('?')[0])
      const json = path.endsWith('.json')
      // (async reads: with readFileSync here Paris took 326 s, against 30 s through the dev server)
      const body = json ? await readFile(path, 'utf8') : await readFile(path)
      return new Response(body, { status: 200, headers: { 'content-type': json ? 'application/json' : 'application/octet-stream' } })
    } catch { return new Response(null, { status: 404 }) }
  }) as typeof fetch
}

const src = await openV3(server, city)
if (!src) { console.error(`far massing: no v3 city at ${server}cities/${city}/v3`); process.exit(1) }
const idx = await (await fetch(`${server}cities/${city}/v3/index.json`)).json() as { tiles: { key: string }[]; region?: string }
const terrain = new Terrain(src.index.terrain)
const reg = region(idx.region ?? city)

const hexRgb = (c: unknown): number => {
  if (typeof c === 'string') return parseInt(c.replace('#', '').slice(0, 6), 16)
  if (Array.isArray(c)) return (Math.round(c[0] * (c[0] <= 1 ? 255 : 1)) << 16) | (Math.round(c[1] * (c[1] <= 1 ? 255 : 1)) << 8) | Math.round(c[2] * (c[2] <= 1 ? 255 : 1))
  return 0xb8ad9a
}
const colourOf = (id: number, st: string): number => {
  try {
    const pals: readonly Palette[] = (reg.palettes as Record<string, Palette[]>)[st] ?? styleOf(st as never).palettes
    return hexRgb(paletteFor(id, pals).wall)
  } catch { return 0xb8ad9a }
}
const like = (a: number, b: number): boolean =>
  Math.abs((a >> 16) - (b >> 16)) + Math.abs(((a >> 8) & 255) - ((b >> 8) & 255)) + Math.abs((a & 255) - (b & 255)) <= COLOUR_TOL

// ---- every building once, as what the grid needs
interface Bld { ring: Point[]; x0: number; x1: number; z0: number; z1: number; cx: number; cz: number; top: number; foot: number; rgb: number }
const blds: Bld[] = []
function addBuilding(id: number, flat: number[], height: number, minH: number, baseY: number | undefined, st: string): void {
  if (height < MIN_H) return
  if (minH > 0 && minH > height * 0.5) return   // a part floating on another: its host already stands there
  const ring = unpackPoints(flat)
  if (ring.length < 3) return
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, sx = 0, sz = 0, low = Infinity
  for (const p of ring) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); sx += p.x; sz += p.z }
  if (baseY === undefined) for (const p of ring) low = Math.min(low, terrain.heightAt(p.x, p.z))
  const foot = baseY ?? low
  blds.push({ ring, x0, x1, z0, z1, cx: sx / ring.length, cz: sz / ring.length, top: Math.round((foot + height) / TOP_STEP) * TOP_STEP, foot, rgb: colourOf(id, st) })
}

const keys = idx.tiles.map((t) => t.key)
let done = 0
const t0 = Date.now()
async function worker(): Promise<void> {
  for (;;) {
    const k = keys.pop()
    if (!k) return
    const t = await src!.load(k)
    src!.forget(k)
    if (t) {
      for (const b of t.buildings) addBuilding(b.id, b.ring, b.height ?? (b.levels ?? 5) * 3.2, b.minHeight ?? 0, b.baseY, b.style)
      for (const f of t.fringe) addBuilding(f.id, f.ring, f.height, (f as { minHeight?: number }).minHeight ?? 0, f.baseY, f.style)
    }
    if (++done % 2000 === 0) console.log(`  far massing: ${done}/${idx.tiles.length} tiles, ${Math.round((Date.now() - t0) / 1000)} s`)
  }
}
await Promise.all(Array.from({ length: PAR }, worker))

// ---- one level: grid, then quads. kind 0 = top, 1 = wall facing +x, 2 = −x, 3 = +z, 4 = −z
interface Cell { top: number; foot: number; rgb: number }
interface Quad { kind: number; rgb: number; x0: number; z0: number; x1: number; z1: number; y0: number; y1: number }
const OFF = 1 << 15
const ck = (i: number, j: number): number => (i + OFF) * 65536 + (j + OFF)

function level(cell: number): Quad[] {
  const grid = new Map<number, Cell>()
  const put = (i: number, j: number, b: Bld): void => {
    const k = ck(i, j)
    const c = grid.get(k)
    if (!c) grid.set(k, { top: b.top, foot: b.foot, rgb: b.rgb })
    else { if (b.top > c.top) { c.top = b.top; c.rgb = b.rgb } c.foot = Math.min(c.foot, b.foot) }
  }
  for (const b of blds) {
    const ring = b.ring
    let hit = false
    for (let i = Math.ceil(b.x0 / cell - 0.5); (i + 0.5) * cell <= b.x1; i++) {
      const cx = (i + 0.5) * cell
      for (let j = Math.ceil(b.z0 / cell - 0.5); (j + 0.5) * cell <= b.z1; j++) {
        const cz = (j + 0.5) * cell
        let inside = false
        for (let a = 0, p = ring.length - 1; a < ring.length; p = a++) {
          const pa = ring[a], pb = ring[p]
          if ((pa.z > cz) !== (pb.z > cz) && cx < (pb.x - pa.x) * (cz - pa.z) / (pb.z - pa.z) + pa.x) inside = !inside
        }
        if (inside) { put(i, j, b); hit = true }
      }
    }
    if (!hit) put(Math.floor(b.cx / cell), Math.floor(b.cz / cell), b)
  }

  const quads: Quad[] = []
  const at = (i: number, j: number): Cell | undefined => grid.get(ck(i, j))
  const rows = new Map<number, number[]>(), cols = new Map<number, number[]>()
  for (const k of grid.keys()) {
    const i = Math.floor(k / 65536) - OFF, j = (k % 65536) - OFF
    const r = rows.get(j) ?? []; r.push(i); rows.set(j, r)
    const c = cols.get(i) ?? []; c.push(j); cols.set(i, c)
  }
  for (const l of rows.values()) l.sort((a, b) => a - b)
  for (const l of cols.values()) l.sort((a, b) => a - b)

  // tops: runs along +x of equal top and like colour, then runs of the same span and top in consecutive rows stacked
  // into one rectangle (greedy). A rectangle keeps its first row's colour.
  interface Rect { i0: number; i1: number; j0: number; j1: number; top: number; rgb: number }
  const open = new Map<string, Rect>()
  const rects: Rect[] = []
  for (const j of [...rows.keys()].sort((a, b) => a - b)) {
    const is = rows.get(j)!
    for (let s = 0; s < is.length;) {
      const c = at(is[s], j)!
      let e = s
      while (e + 1 < is.length && is[e + 1] === is[e] + 1 && at(is[e + 1], j)!.top === c.top && like(at(is[e + 1], j)!.rgb, c.rgb)) e++
      const k = `${is[s]},${is[e]},${c.top}`
      const r = open.get(k)
      if (r && r.j1 === j - 1 && like(r.rgb, c.rgb)) r.j1 = j
      else { const n = { i0: is[s], i1: is[e], j0: j, j1: j, top: c.top, rgb: c.rgb }; open.set(k, n); rects.push(n) }
      s = e + 1
    }
  }
  for (const r of rects) quads.push({ kind: 0, rgb: r.rgb, x0: r.i0 * cell, x1: (r.i1 + 1) * cell, z0: r.j0 * cell, z1: (r.j1 + 1) * cell, y0: r.top, y1: r.top })

  // walls: for each face direction, the exposed span [max(neighbour top, own foot), top], merged along the face
  const span = (c: Cell, n: Cell | undefined): [number, number] | null => {
    const lo = Math.max(Math.floor((c.foot - 1) / FOOT_STEP) * FOOT_STEP, n ? n.top : -Infinity)
    return c.top - lo > 0.5 ? [lo, c.top] : null
  }
  // ±x faces run along z (in each column); ±z faces run along x (in each row)
  for (const [dir, di, dj] of [[1, 1, 0], [2, -1, 0], [3, 0, 1], [4, 0, -1]] as const) {
    const lines = di !== 0 ? cols : rows
    for (const [l, ms] of lines) {
      const cellAt = (m: number): Cell => (di !== 0 ? at(l, m) : at(m, l))!
      const nb = (m: number): Cell | undefined => (di !== 0 ? at(l + di, m) : at(m + dj, l + dj))
      for (let s = 0; s < ms.length; s++) {
        const sp = span(cellAt(ms[s]), nb(ms[s]))
        if (!sp) continue
        let e = s
        while (e + 1 < ms.length && ms[e + 1] === ms[e] + 1) {
          const n = span(cellAt(ms[e + 1]), nb(ms[e + 1]))
          if (!n || n[0] !== sp[0] || n[1] !== sp[1] || !like(cellAt(ms[e + 1]).rgb, cellAt(ms[s]).rgb)) break
          e++
        }
        const rgb = cellAt(ms[s]).rgb
        if (di !== 0) {
          const x = (di > 0 ? l + 1 : l) * cell
          quads.push({ kind: dir, rgb, x0: x, x1: x, z0: ms[s] * cell, z1: (ms[e] + 1) * cell, y0: sp[0], y1: sp[1] })
        } else {
          const z = (dj > 0 ? l + 1 : l) * cell
          quads.push({ kind: dir, rgb, x0: ms[s] * cell, x1: (ms[e] + 1) * cell, z0: z, z1: z, y0: sp[0], y1: sp[1] })
        }
        s = e
      }
    }
  }
  console.log(`  far massing: ${cell} m grid, ${grid.size} cells -> ${quads.length} quads (${rects.length} tops)`)
  return quads
}

// ---- chunks of CHUNK metres per level, each quad by its first corner; int16 offsets from the chunk's corner
const chunks = new Map<string, Quad[]>()
for (const [lv, cell] of [CELL, CELL * 2].entries()) {
  for (const q of level(cell)) {
    const k = `${lv},${Math.floor(q.x0 / CHUNK)},${Math.floor(q.z0 / CHUNK)}`
    const l = chunks.get(k) ?? []
    l.push(q)
    chunks.set(k, l)
  }
}
const REC = 16
let size = 8
for (const l of chunks.values()) size += 20 + l.length * REC
const buf = Buffer.alloc(size)
let o = 0
buf.write('FMS2', o); o += 4
buf.writeUInt32LE(chunks.size, o); o += 4
for (const [k, l] of chunks) {
  const [lv, ci, cj] = k.split(',').map(Number)
  const ox = ci * CHUNK, oz = cj * CHUNK
  let yMin = Infinity
  for (const q of l) yMin = Math.min(yMin, q.y0)
  buf.writeInt32LE(ci, o); buf.writeInt32LE(cj, o + 4); buf.writeFloatLE(yMin, o + 8); buf.writeUInt32LE(l.length, o + 12); buf.writeUInt32LE(lv, o + 16); o += 20
  for (const q of l) {
    buf.writeUInt8(q.kind, o); buf.writeUInt8((q.rgb >> 16) & 255, o + 1); buf.writeUInt8((q.rgb >> 8) & 255, o + 2); buf.writeUInt8(q.rgb & 255, o + 3)
    buf.writeInt16LE(Math.round((q.x0 - ox) / Q_XZ), o + 4); buf.writeInt16LE(Math.round((q.z0 - oz) / Q_XZ), o + 6)
    buf.writeInt16LE(Math.round((q.x1 - ox) / Q_XZ), o + 8); buf.writeInt16LE(Math.round((q.z1 - oz) / Q_XZ), o + 10)
    buf.writeUInt16LE(Math.round((q.y0 - yMin) / Q_Y), o + 12); buf.writeUInt16LE(Math.round((q.y1 - yMin) / Q_Y), o + 14)
    o += REC
  }
}
const out = resolve(ROOT, `public/cities/${city}/v3/farmass.bin`)
writeFileSync(out, buf)
console.log(`  → public/cities/${city}/v3/farmass.bin  ${blds.length} buildings, ${chunks.size} chunks, ${(size / 1e6).toFixed(1)} MB, ${((Date.now() - t0) / 1000).toFixed(0)} s`)
