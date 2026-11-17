/**
 * devmaps: a 2D debugging map of a baked city (docs/DEVMAPS.md). Canvas 2D, v2 metres (x east, z north).
 *   far  (s < MID_S px/m): coarse terrain, major roads, tile grid, box + detail squares, zones, landmarks, tours
 *   mid  (s ≥ MID_S): the prep's chunks — every street (coloured by level), footprint, area, item, place, deck, ride edge
 *   near (s ≥ NEAR_S): the raw bake tiles too — fine ground, way nodes; clicking always inspects the raw object
 */
import { CityData, type Chunk, type Street } from './data.ts'
import { tree, wayTable, itemRow, refLinks, osm, fmt, profileSvg, along, type Ctx } from './inspect.ts'
import type { Issue } from './data.ts'

// ---- tunables ----
const MID_S = 0.25
const NEAR_S = 2
const LABEL_S = 3
const ZONE_LABEL_S = 0.3
const SEARCH_PREFETCH_MS = 3000
/** a builder used this many times or more is a "mass" builder (parisCivic, the portals): drawn small and grey */
const BUILDER_MASS = 10
/** px/m past which a building is labelled with its style/archetype ('?' = a generic building: the bake guessed it) */
const STYLE_LABEL_S = 2.5
const BUILDER_TIER = { unique: { col: '#e000a0', r: 6 }, repeated: { col: '#ff8c00', r: 5 }, mass: { col: '#8a7a90', r: 3 } } as const
/** don't fetch chunks when the view spans more than this many */
const MAX_VIEW_CHUNKS = 30
/** nor raw tiles beyond this many */
const MAX_VIEW_TILES = 80
const HIT_PX = 6
const SAT_URL = (z: number, x: number, y: number): string => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`
const SAT_MAX_Z = 19
/** hover preview (status bar): at most this often (ms), and only while the view holds at most this many chunks */
const HOVER_MS = 120
const HOVER_MAX_CHUNKS = 8
/** street slope colours: grade (%) breakpoints → colour */
const SLOPE_STOPS: [number, string][] = [[0, '#2a9d4a'], [4, '#9acd32'], [8, '#ffd000'], [12, '#ff8c00'], [16, '#e02020'], [25, '#7a00a0']]
/** Δground colour: this many metres saturates (buried magenta ← grade grey → raised orange) */
const DGROUND_SAT = 6
/** a measure line's ground profile: about this many samples */
const PROFILE_SAMPLES = 200
/** pan step for the arrow keys (fraction of the view) and zoom step for +/- */
const PAN_STEP = 0.25, ZOOM_STEP = 1.6
/** level colours: tools/level-map.ts (grade black, raised orange, buried magenta, bridge blue, tunnel green) */
const LV_COL = ['#141414', '#ff8c00', '#dc00dc', '#1e50e6', '#14a03c', '#00a0a0', '#999999']
const LV_NAME = ['grade', 'raised', 'buried', 'bridge', 'tunnel', 'trench', 'unknown']
const KIND_COL: Record<string, string> = {
  motorway: '#e0306a', motorway_link: '#e0306a', trunk: '#f06030', trunk_link: '#f06030', primary: '#f0a030', primary_link: '#f0a030',
  secondary: '#d0c020', tertiary: '#a0a0a0', residential: '#707070', service: '#909090', footway: '#c07060', path: '#b08050',
  cycleway: '#3070f0', steps: '#ff3030', pedestrian: '#c0a0a0', track: '#a07040', rail: '#00b0d0', tram: '#00d0b0', subway: '#4060a0',
}
const AREA_COL: Record<string, string> = { water: '#5a8fd0', park: '#8fc080', grass: '#a8d890', wood: '#5f9f5a', forest: '#5f9f5a', square: '#d8d0c0', sand: '#e8d8a0', parking: '#c8c8d8', pitch: '#90c890', cemetery: '#a0b8a0' }
const TOUR_COL = ['#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#42d4f4', '#f032e6', '#9a6324', '#800000', '#000075']

const hue = (s: string): string => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return `hsl(${h % 360},65%,45%)` }
const $ = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T
const canvas = $<HTMLCanvasElement>('map')
const ctx = canvas.getContext('2d')!

// ---- state ----
let data: CityData
const cam = { cx: 0, cz: 0, s: 0.05 }
const layers = new Map<string, boolean>()
let colourMode: 'level' | 'kind' | 'role' | 'slope' | 'dground' = 'level'
/** what the tile grid's fill shows (a per-tile stat prefix, 'issues', or nothing) */
let tileStat = ''
/** restyle mode: draw only the restyles the renderer applies (confidence-1 labels never are) */
let hideUnapplied = false
let bldgMode: 'kind' | 'restyle' | 'height' | 'style' | 'archetype' = 'kind'
/** a fixed colour per style/archetype name (hue from the name, so it is the same in every city) */
const nameCol = (n: string | undefined): string => (n ? hue(n).replace('45%)', '62%)') : '#d8d6d0')
/** the style a building is drawn with: its applied restyle's, else the bake's */
const styleName = (b: { st?: number; lk?: { s?: string; on: boolean } }): string | undefined => (b.lk?.on && b.lk.s) || (b.st != null ? data.meta.dict.styles[b.st] : undefined)
let dirty = true
let mouse = { x: 0, z: 0, sx: 0, sy: 0 }
let measuring = false
const measure: { x: number; z: number }[] = []
type Geom = { pts?: number[]; rings?: number[][]; pt?: [number, number] }
let selected: Geom | null = null
let osmOverlay: { ways: number[][]; nodes: number[]; label: string } | null = null
const satCache = new Map<string, HTMLImageElement>()
const fineCache = new Map<string, HTMLCanvasElement>()
let coarse: Int16Array | null = null
const tourOn = new Set<string>()
/** builder name → instances in this city; hidden builders; which tiers are shown */
let builderCount = new Map<string, number>()
const hiddenBuilders = new Set<string>()
const tierOn = { unique: true, repeated: true, mass: true }
type Cust = CityData['custom'][number]
const builderOf = (c: Cust): string => c.proc ?? (c.entry.kit ? 'kit:' + String(typeof c.entry.kit === 'string' ? c.entry.kit : 'kit') : '(no builder)')
const tierOf = (c: Cust): keyof typeof BUILDER_TIER => { const n = builderCount.get(builderOf(c)) ?? 1; return n >= BUILDER_MASS ? 'mass' : n > 1 ? 'repeated' : 'unique' }
const customShown = (c: Cust): boolean => on('custom:' + c.kind) && (c.kind !== 'builder' || (tierOn[tierOf(c)] && !hiddenBuilders.has(builderOf(c))))

const on = (k: string, dflt = true): boolean => { if (!layers.has(k)) layers.set(k, dflt); return layers.get(k)! }
const W = (): number => canvas.width / devicePixelRatio, H = (): number => canvas.height / devicePixelRatio
const sx = (x: number): number => (x - cam.cx) * cam.s + W() / 2
const sy = (z: number): number => (cam.cz - z) * cam.s + H() / 2
const wx = (px: number): number => (px - W() / 2) / cam.s + cam.cx
const wz = (py: number): number => cam.cz - (py - H() / 2) / cam.s
const redraw = (): void => { dirty = true }
const toast = (t: string): void => { const e = $('toast'); e.textContent = t; e.style.display = 'block'; setTimeout(() => (e.style.display = 'none'), 1400) }
const copy = (t: string): void => { void navigator.clipboard.writeText(t); toast('copied ' + t) }
const llStr = (x: number, z: number): string => { const q = data.proj.toLatLon({ x, z }); return `${q.lat.toFixed(6)},${q.lon.toFixed(6)}` }

function coarseAt(x: number, z: number): number | null {
  const t = data.meta.terrain
  if (!t || !coarse) return null
  const c = Math.round((x - t.x0) / t.step), r = Math.round((z - t.z0) / t.step)
  if (c < 0 || r < 0 || c >= t.cols || r >= t.rows) return null
  return coarse[r * t.cols + c] / 10
}

/** ground (v2 m): the tile's own fine ground where that tile is loaded, else the coarse grid */
function groundAt(x: number, z: number): number | null {
  const T = data.meta.index.tile, tx = Math.floor(x / T), ty = Math.floor(z / T)
  const t = data.peekTile(`${tx},${ty}`), g = t?.terrain as { step: number; cols: number; z: number[] } | undefined
  if (!g || !g.cols) return coarseAt(x, z)
  const n = g.cols, fx = Math.max(0, Math.min(n - 1.001, (x - tx * T) / g.step)), fy = Math.max(0, Math.min(n - 1.001, (z - ty * T) / g.step))
  const i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j
  return data.v2(g.z[j * n + i] * (1 - u) * (1 - v) + g.z[j * n + i + 1] * u * (1 - v) + g.z[(j + 1) * n + i] * (1 - u) * v + g.z[(j + 1) * n + i + 1] * u * v)
}
const issueCol = (k: string): string => hue('issue' + k).replace('45%)', '50%)')
let hoverText = ''
/** the tile grid's heat value for one tile (per the tiles select) and the max over the city, for scaling */
let tileMax = 1
let issuesByTile = new Map<string, number>()
function tileVal(t: CityData['meta']['tiles'][number]): number {
  if (tileStat === 'issues') return issuesByTile.get(t.key) ?? 0
  if (tileStat === 'bytes') return (t.bytes as number) ?? 0
  let n = 0
  for (const [k, v] of Object.entries(t)) if (k.startsWith(tileStat) && typeof v === 'number') n += v
  return n
}
function setTileStat(v: string): void {
  tileStat = v; tileMax = 1
  if (v) for (const t of data.meta.tiles) tileMax = Math.max(tileMax, tileVal(t))
  if (v) layers.set('grid', true)
  redraw()
}

// ---------------------------------------------------------------- drawing
function path(p: number[], close = false): Path2D {
  const q = new Path2D()
  for (let i = 0; i < p.length; i += 2) (i ? q.lineTo : q.moveTo).call(q, sx(p[i]), sy(p[i + 1]))
  if (close) q.closePath()
  return q
}
const inView = (p: number[], pad = 0): boolean => {
  const x0 = wx(-pad), x1 = wx(W() + pad), z1 = wz(-pad), z0 = wz(H() + pad)
  let a = Infinity, b = -Infinity, c = Infinity, d = -Infinity
  for (let i = 0; i < p.length; i += 2) { a = Math.min(a, p[i]); b = Math.max(b, p[i]); c = Math.min(c, p[i + 1]); d = Math.max(d, p[i + 1]) }
  return b >= x0 && a <= x1 && d >= z0 && c <= z1
}

function viewTiles(): { tx0: number; tx1: number; ty0: number; ty1: number } {
  const T = data.meta.index.tile
  return { tx0: Math.floor(wx(0) / T), tx1: Math.floor(wx(W()) / T), ty0: Math.floor(wz(H()) / T), ty1: Math.floor(wz(0) / T) }
}
function viewChunks(): Chunk[] {
  if (cam.s < MID_S) return []
  const v = viewTiles(), C = data.meta.chunk
  const out: Chunk[] = []
  const cx0 = Math.floor(v.tx0 / C), cx1 = Math.floor(v.tx1 / C), cy0 = Math.floor(v.ty0 / C), cy1 = Math.floor(v.ty1 / C)
  if ((cx1 - cx0 + 1) * (cy1 - cy0 + 1) > MAX_VIEW_CHUNKS) return []
  for (let cx = cx0; cx <= cx1; cx++) for (let cy = cy0; cy <= cy1; cy++) { const c = data.chunk(`${cx}_${cy}`); if (c) out.push(c) }
  return out
}
function viewRawTiles(): [string, Record<string, unknown>][] {
  if (cam.s < NEAR_S) return []
  const v = viewTiles()
  if ((v.tx1 - v.tx0 + 1) * (v.ty1 - v.ty0 + 1) > MAX_VIEW_TILES) return []
  const out: [string, Record<string, unknown>][] = []
  for (let tx = v.tx0; tx <= v.tx1; tx++) for (let ty = v.ty0; ty <= v.ty1; ty++) { const k = `${tx},${ty}`, t = data.tile(k); if (t) out.push([k, t]) }
  return out
}

function drawSat(alpha: number): void {
  const lat = data.meta.index.origin.lat
  const mpp = 1 / cam.s
  let z = Math.round(Math.log2((156543.03 * Math.cos((lat * Math.PI) / 180)) / mpp))
  z = Math.max(1, Math.min(SAT_MAX_Z, z))
  const n = 2 ** z
  const tileOf = (la: number, lo: number): [number, number] => [((lo + 180) / 360) * n, ((1 - Math.log(Math.tan((la * Math.PI) / 180) + 1 / Math.cos((la * Math.PI) / 180)) / Math.PI) / 2) * n]
  const latOf = (y: number): number => (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI
  const lonOf = (x: number): number => (x / n) * 360 - 180
  const nw = data.proj.toLatLon({ x: wx(0), z: wz(0) }), se = data.proj.toLatLon({ x: wx(W()), z: wz(H()) })
  const [x0, y0] = tileOf(nw.lat, nw.lon), [x1, y1] = tileOf(se.lat, se.lon)
  ctx.globalAlpha = alpha
  for (let x = Math.floor(x0); x <= Math.floor(x1); x++) for (let y = Math.floor(y0); y <= Math.floor(y1); y++) {
    const key = `${z}/${x}/${y}`
    let img = satCache.get(key)
    if (!img) { img = new Image(); img.crossOrigin = 'anonymous'; img.src = SAT_URL(z, x, y); img.onload = redraw; satCache.set(key, img); if (satCache.size > 600) satCache.delete(satCache.keys().next().value!) }
    if (!img.complete || !img.naturalWidth) continue
    const a = data.proj.toLocal({ lat: latOf(y), lon: lonOf(x) }), b = data.proj.toLocal({ lat: latOf(y + 1), lon: lonOf(x + 1) })
    ctx.drawImage(img, sx(a.x), sy(a.z), sx(b.x) - sx(a.x) + 0.5, sy(b.z) - sy(a.z) + 0.5)
  }
  ctx.globalAlpha = 1
}

function fineImage(key: string, t: Record<string, unknown>): HTMLCanvasElement | null {
  const g = t.terrain as { step: number; cols: number; z: number[] } | undefined
  if (!g || !g.cols) return null
  let c = fineCache.get(key)
  if (c) return c
  c = document.createElement('canvas'); c.width = c.height = g.cols
  const cx = c.getContext('2d')!, im = cx.createImageData(g.cols, g.cols), n = g.cols
  let lo = Infinity, hi = -Infinity
  for (const v of g.z) { lo = Math.min(lo, v); hi = Math.max(hi, v) }
  for (let r = 0; r < n; r++) for (let q = 0; q < n; q++) {
    const at = (rr: number, qq: number): number => g.z[Math.max(0, Math.min(n - 1, rr)) * n + Math.max(0, Math.min(n - 1, qq))] / 100
    const gx = (at(r, q + 1) - at(r, q - 1)) / (2 * g.step), gz = (at(r + 1, q) - at(r - 1, q)) / (2 * g.step)
    const sh = Math.max(0, Math.min(1, 0.65 + (-gx + gz) * 0.8)), e = (g.z[r * n + q] - lo) / Math.max(1, hi - lo)
    const o = ((n - 1 - r) * n + q) * 4
    im.data[o] = (190 + 50 * e) * sh; im.data[o + 1] = (205 - 25 * e) * sh; im.data[o + 2] = (180 - 40 * e) * sh; im.data[o + 3] = 255
  }
  cx.putImageData(im, 0, 0)
  fineCache.set(key, c); if (fineCache.size > 200) fineCache.delete(fineCache.keys().next().value!)
  return c
}

const ramp = (v: number, stops: [number, string][]): string => { for (let i = stops.length - 1; i >= 0; i--) if (v >= stops[i][0]) return stops[i][1]; return stops[0][1] }
function streetColour(s: Street, seg: number): string {
  if (colourMode === 'level') return LV_COL[s.lv[seg]]
  if (colourMode === 'slope') {
    const len = Math.hypot(s.p[2 * seg + 2] - s.p[2 * seg], s.p[2 * seg + 3] - s.p[2 * seg + 1])
    return len < 0.5 ? '#888' : ramp((Math.abs(s.h[seg + 1] - s.h[seg]) / len) * 100, SLOPE_STOPS)
  }
  if (colourMode === 'dground') {
    const d = ((s.d[seg] ?? NaN) + (s.d[seg + 1] ?? NaN)) / 2
    if (!Number.isFinite(d)) return '#bbb'
    const k = Math.min(1, Math.abs(d) / DGROUND_SAT)
    return Math.abs(d) < 0.7 ? '#777' : d > 0 ? `hsl(30,100%,${60 - 30 * k}%)` : `hsl(300,100%,${60 - 30 * k}%)`
  }
  if (colourMode === 'kind') return KIND_COL[s.k] ?? hue(s.k)
  return hue(s.r)
}

function render(): void {
  dirty = false
  const m = data.meta
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
  ctx.fillStyle = '#e9e8e2'; ctx.fillRect(0, 0, W(), H())
  const satA = Number($<HTMLInputElement>('satop').value) / 100
  const dataA = Number($<HTMLInputElement>('dataop').value) / 100
  if (on('terrain') && data.terrainImg && m.terrain && satA < 1) {
    const t = m.terrain
    ctx.imageSmoothingEnabled = cam.s < 0.2
    ctx.drawImage(data.terrainImg, sx(t.x0 - t.step / 2), sy(t.z0 + (t.rows - 0.5) * t.step), t.cols * t.step * cam.s, t.rows * t.step * cam.s)
  }
  const raw = viewRawTiles()
  const T = m.index.tile
  if (on('fineTerrain') && satA < 1) for (const [k, t] of raw) {
    const img = fineImage(k, t)
    if (img) { const g = t.terrain as { step: number; cols: number }, ox = (t.tx as number) * T, oy = (t.ty as number) * T, ext = g.step * (g.cols - 1); ctx.drawImage(img, sx(ox), sy(oy + ext), ext * cam.s, ext * cam.s) }
  }
  if (satA > 0 && on('sat')) drawSat(satA)
  ctx.globalAlpha = dataA

  // zones (styling rings), water, detail squares, box
  if (on('zones')) for (const z of m.zones) {
    if (!inView(z.ring)) continue
    const p = path(z.ring, true); ctx.strokeStyle = hue(z.ref); ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]); ctx.stroke(p); ctx.setLineDash([])
    ctx.fillStyle = hue(z.ref).replace('45%)', '45%,0.06)').replace('hsl', 'hsla'); ctx.fill(p)
    if (cam.s > ZONE_LABEL_S && on('labels')) { ctx.fillStyle = hue(z.ref); ctx.fillText(z.ref, sx(z.ring[0]) + 3, sy(z.ring[1]) - 3) }
  }
  if (on('water')) { ctx.fillStyle = 'rgba(70,120,200,0.35)'; for (const w of m.water) if (inView(w.ring)) ctx.fill(path(w.ring, true)) }
  if (on('river') && m.river?.points) { ctx.strokeStyle = '#2050a0'; ctx.lineWidth = 1; ctx.setLineDash([2, 3]); ctx.stroke(path(m.river.points)); ctx.setLineDash([]) }

  const chunks = viewChunks()
  // areas
  for (const c of chunks) for (const a of c.areas) {
    if (!on('areas:' + a.k) || !inView(a.p)) continue
    const p = path(a.p, true); for (const h of a.ho ?? []) p.addPath(path(h, true))
    ctx.fillStyle = (AREA_COL[a.k] ?? hue(a.k)); ctx.globalAlpha = dataA * 0.45; ctx.fill(p, 'evenodd'); ctx.globalAlpha = dataA
  }
  // buildings
  for (const c of chunks) for (const b of c.buildings) {
    if (!on('buildings:' + b.k) || !on('style:' + (styleName(b) ?? '(none)')) || !b.rs.length || !inView(b.rs[0])) continue
    // (hidden: not applied, or confidence 1 — whose colours never apply; in Paris proper the renderer only forces Haussmann)
    const lk = b.lk && (!hideUnapplied || (b.lk.on && b.lk.c !== 1)) ? b.lk : undefined
    ctx.fillStyle = bldgMode === 'restyle' ? (lk ? lk.w ?? '#b0b0b0' : '#d8d6d0')
      : bldgMode === 'height' ? `hsl(${Math.max(0, 240 - (b.ht ?? 0) * 4)},60%,60%)`
      : bldgMode === 'style' ? nameCol(styleName(b))
      : bldgMode === 'archetype' ? nameCol(b.ar != null ? data.meta.dict.archetypes[b.ar] : undefined)
      : b.k === 'generic' ? '#b9b2a6' : b.k === 'restyled' ? '#c9a98a' : b.k === 'simple' ? '#a6b9c9' : b.k === 'procedural' ? '#d68a8a' : b.k === 'mesh' ? '#c98ad6' : '#9ac98a'
    ctx.strokeStyle = bldgMode === 'restyle' && lk ? (lk.on ? '#e000a0' : '#888') : '#6a6458'; ctx.lineWidth = bldgMode === 'restyle' && lk ? 2 : 0.6
    if (bldgMode === 'restyle' && lk && !lk.on) ctx.setLineDash([3, 2])
    b.rs.forEach((r, j) => { const p = path(r, true); if (j === 0) ctx.fill(p); ctx.stroke(p) })
    ctx.setLineDash([])
    if ((bldgMode === 'style' || bldgMode === 'archetype') && cam.s > STYLE_LABEL_S && on('labels')) {
      const t = bldgMode === 'style' ? styleName(b) : b.ar != null ? data.meta.dict.archetypes[b.ar] : undefined
      if (t) { ctx.fillStyle = '#222'; ctx.fillText(t + (b.k === 'generic' ? '?' : ''), sx(b.x) - 12, sy(b.z) + 3) }
    }
  }
  if (on('custom:builder')) for (const c of chunks) for (const b of c.buildings) {
    const cb = data.customBldg.get(`${b.t}|${b.i}`)
    if (!cb || !customShown(cb) || !b.rs.length || !inView(b.rs[0])) continue
    ctx.strokeStyle = BUILDER_TIER[tierOf(cb)].col; ctx.lineWidth = 2.5; for (const r of b.rs) ctx.stroke(path(r, true))
  }
  for (const c of chunks) for (const d of c.decks) {
    if (!on('decks') || !inView(d.p)) continue
    const p = path(d.p, true); ctx.fillStyle = 'rgba(30,80,230,0.18)'; ctx.fill(p); ctx.strokeStyle = '#1e50e6'; ctx.setLineDash([3, 2]); ctx.lineWidth = 1.5; ctx.stroke(p); ctx.setLineDash([])
  }
  for (const c of chunks) for (const b of c.boats) if (on('boats') && inView(b.p)) { const p = path(b.p, true); ctx.fillStyle = '#fff'; ctx.fill(p); ctx.strokeStyle = '#000'; ctx.stroke(p) }
  for (const c of chunks) for (const ct of c.courts) if (on('courts')) {
    ctx.save(); ctx.translate(sx(ct.x), sy(ct.z)); ctx.rotate(ct.hd); ctx.strokeStyle = '#c04040'; ctx.strokeRect((-ct.w / 2) * cam.s, (-ct.l / 2) * cam.s, ct.w * cam.s, ct.l * cam.s); ctx.restore()
  }

  // legacy index geometry: gardens and quay walls (mid zoom and in)
  if (cam.s >= MID_S) {
    const lg = data.legacy
    if (on('garden:formal')) { ctx.strokeStyle = '#4a7a3a'; ctx.setLineDash([2, 4]); ctx.lineWidth = 1; for (const f of lg.formal) if (inView(f)) ctx.stroke(path(f, true)); ctx.setLineDash([]) }
    if (on('garden:flats')) for (const f of lg.flats) if (inView(f.ring)) { ctx.fillStyle = f.kind === 'gravel' ? '#e4dcc4' : f.kind === 'lawn' ? '#9ccf80' : '#c88aa0'; ctx.fill(path(f.ring, true)) }
    if (on('garden:hedges')) { ctx.strokeStyle = '#2f6a2a'; for (const h of lg.hedges) if (inView(h.points)) { ctx.lineWidth = Math.max(1, h.w * cam.s); ctx.stroke(path(h.points)) } }
    if (on('garden:topiary')) { ctx.fillStyle = '#1f5a1f'; for (let i = 0; i < lg.topiary.length; i += 4) { const x = sx(lg.topiary[i]), y = sy(lg.topiary[i + 1]); if (x > -5 && y > -5 && x < W() + 5 && y < H() + 5) { const r = Math.max(1.2, 0.6 * cam.s); lg.topiary[i + 3] === 2 ? ctx.fillRect(x - r, y - r, 2 * r, 2 * r) : (ctx.beginPath(), ctx.arc(x, y, r, 0, 7), ctx.fill()) } } }
    if (on('quay')) { ctx.lineWidth = 2; const q = lg.quay; for (let i = 0; i < q.length; i += 7) { const ax = sx(q[i]), ay = sy(q[i + 1]); if (ax < -50 || ay < -50 || ax > W() + 50 || ay > H() + 50) continue; ctx.strokeStyle = q[i + 4] - q[i + 5] > 3 ? '#7a2a00' : '#c06020'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(sx(q[i + 2]), sy(q[i + 3])); ctx.stroke() } }
  }
  // far: major roads
  if (!chunks.length && on('major')) for (const r of data.major) {
    if (!inView(r.p)) continue
    ctx.strokeStyle = KIND_COL[r.k] ?? '#888'; ctx.lineWidth = r.k.startsWith('motorway') || r.k.startsWith('trunk') ? 2 : 1; ctx.stroke(path(r.p))
  }
  // streets, batched by colour and width
  const batches = new Map<string, Path2D>()
  for (const c of chunks) for (const s of c.streets) {
    if (!on('streets:' + s.r) || !inView(s.p, 20)) continue
    const px = Math.max(s.r === 'rail' ? 1 : 1.2, Math.min(40, (s.w ?? (s.r === 'rail' ? 1.5 : 2)) * cam.s))
    for (let j = 0; j + 1 < s.p.length / 2; j++) {
      if (!on('lvl:' + LV_NAME[s.lv[j]])) continue
      const key = `${streetColour(s, j)}|${px.toFixed(1)}|${s.r === 'rail' ? 1 : 0}|${s.gc ? 1 : 0}`
      let q = batches.get(key); if (!q) { q = new Path2D(); batches.set(key, q) }
      q.moveTo(sx(s.p[2 * j]), sy(s.p[2 * j + 1])); q.lineTo(sx(s.p[2 * j + 2]), sy(s.p[2 * j + 3]))
    }
  }
  ctx.lineCap = 'round'
  for (const [key, q] of batches) {
    const [col, px, rail, gc] = key.split('|')
    ctx.strokeStyle = col; ctx.lineWidth = Number(px); ctx.globalAlpha = dataA * (gc === '1' ? 0.55 : 0.9)
    if (rail === '1') ctx.setLineDash([4, 3]); ctx.stroke(q); ctx.setLineDash([])
  }
  ctx.globalAlpha = dataA; ctx.lineCap = 'butt'
  // per-node-z overrides and layer labels
  if (cam.s > LABEL_S) for (const c of chunks) for (const s of c.streets) {
    if (!on('streets:' + s.r) || !inView(s.p)) continue
    const mid = (s.p.length >> 2) << 1
    if (on('labels')) {
      const lab = [s.n, s.L ? `L${s.L}` : '', s.oz ? 'z!' : ''].filter(Boolean).join(' ')
      if (lab) { ctx.fillStyle = s.oz ? '#b00' : '#222'; ctx.fillText(lab, sx(s.p[mid]) + 4, sy(s.p[mid + 1]) - 4) }
      if (cam.s > 6) for (let j = 0; j < s.h.length; j += Math.max(1, Math.floor(8 / cam.s))) { ctx.fillStyle = '#334'; ctx.fillText(s.h[j].toFixed(1), sx(s.p[2 * j]) + 2, sy(s.p[2 * j + 1]) + 10) }
    }
  }
  // ride graph
  for (const c of chunks) for (const r of c.ride) {
    if (!on('ride:' + r.m, false) || !inView(r.p)) continue
    ctx.strokeStyle = r.m === 'bike' ? 'rgba(255,0,120,0.8)' : 'rgba(0,160,255,0.8)'; ctx.lineWidth = 1.2; ctx.setLineDash([5, 3]); ctx.stroke(path(r.p)); ctx.setLineDash([])
  }
  // nodes (near)
  if (on('nodes') && cam.s > NEAR_S * 2) for (const [, t] of raw) {
    const N = t.nodes as number[], ox = (t.tx as number) * T, oy = (t.ty as number) * T, ids = (t.nodeIds ?? {}) as Record<string, number>
    for (let i = 0; i < N.length; i += 3) { ctx.fillStyle = ids[i / 3] ? '#d00' : '#333'; ctx.fillRect(sx(ox + N[i] / 100) - 1.5, sy(oy + N[i + 1] / 100) - 1.5, 3, 3) }
  }
  // items: plants and street furniture
  const D = m.dict.items
  for (const c of chunks) for (const it of c.items) for (let i = 0; i < it.d.length; i += 3) {
    const ty = D[it.d[i + 2]] ?? String(it.d[i + 2])
    if (!on('items:' + ty)) continue
    const x = sx(it.d[i]), y = sy(it.d[i + 1])
    if (x < -5 || y < -5 || x > W() + 5 || y > H() + 5) continue
    const tree = ty.startsWith('tree')
    ctx.fillStyle = tree ? '#2e8b3a' : hue(ty)
    const r = tree ? Math.max(1.5, 2.5 * cam.s) : Math.max(1.5, Math.min(4, 0.6 * cam.s))
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill()
    if (cam.s > 8 && on('labels') && !tree) { ctx.fillStyle = '#333'; ctx.fillText(ty, x + 4, y + 3) }
  }
  for (const c of chunks) for (const p of c.places) if (on('places')) {
    ctx.fillStyle = p.tier ? '#c00' : '#6040a0'; ctx.fillRect(sx(p.x) - 2, sy(p.z) - 2, 4, 4)
    if (cam.s > 1.5 && on('labels')) ctx.fillText(p.n, sx(p.x) + 4, sy(p.z) - 2)
  }

  // tile grid
  if (on('grid')) {
    const v = viewTiles(), n = (v.tx1 - v.tx0 + 1) * (v.ty1 - v.ty0 + 1)
    ctx.lineWidth = 0.5
    for (const t of m.tiles) {
      if (n > 4000 && cam.s < 0.02) break
      if (t.tx < v.tx0 || t.tx > v.tx1 || t.ty < v.ty0 || t.ty > v.ty1) continue
      const x = sx(t.tx * T), y = sy((t.ty + 1) * T), d = T * cam.s
      if (tileStat) { const v = tileVal(t) / tileMax; if (v > 0) { ctx.fillStyle = `hsla(${240 - 240 * Math.min(1, v)},90%,50%,${0.15 + 0.35 * Math.min(1, v)})`; ctx.fillRect(x, y, d, d) } }
      else { ctx.fillStyle = t.buildings ? 'rgba(200,120,40,0.07)' : t.edges ? 'rgba(40,120,200,0.07)' : 'rgba(0,0,0,0.04)'; if (chunks.length === 0) ctx.fillRect(x, y, d, d) }
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.strokeRect(x, y, d, d)
      if (d > 70) { ctx.fillStyle = '#555'; ctx.fillText(`${t.key}${t['terrain.step1'] ? ' fine' : ''}${tileStat ? ' · ' + tileVal(t) : ''}`, x + 3, y + 11) }
    }
  }
  if (on('detail')) for (const d of m.index.detail ?? []) {
    for (const r of d.rings ?? []) {
      ctx.strokeStyle = '#d02020'; ctx.lineWidth = 2; ctx.stroke(path(r, true))
      if (d.margin) { ctx.strokeStyle = 'rgba(208,32,32,0.3)'; ctx.lineWidth = 2 * d.margin * cam.s; ctx.lineJoin = 'round'; ctx.stroke(path(r, true)); ctx.lineJoin = 'miter' }
    }
    if (d.line) {
      ctx.strokeStyle = 'rgba(208,32,32,0.25)'; ctx.lineWidth = Math.max(2, 2 * d.margin * cam.s); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(path(d.line))
      ctx.strokeStyle = '#d02020'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.stroke(path(d.line)); ctx.setLineDash([]); ctx.lineCap = 'butt'; ctx.lineJoin = 'miter'
    }
    const a = d.rings?.[0] ?? d.line
    if (a) { ctx.fillStyle = '#d02020'; ctx.fillText(`${d.name}${d.margin ? ` (+${d.margin})` : ''}`, sx(a[0]) + 3, sy(a[1]) - 4) }
  }
  if (on('box') && m.index.box) { const b = m.index.box; ctx.strokeStyle = '#800'; ctx.setLineDash([10, 6]); ctx.lineWidth = 1; ctx.strokeRect(sx(b.x0), sy(b.z1), (b.x1 - b.x0) * cam.s, (b.z1 - b.z0) * cam.s); ctx.setLineDash([]) }
  if (on('walls')) { ctx.strokeStyle = '#6b4e2e'; ctx.lineWidth = 1.5; for (const w of m.walls) if (inView(w.points)) ctx.stroke(path(w.points)) }
  if (on('roundabouts')) for (const r of m.roundabouts) { const p = data.proj.toLocal(r); ctx.strokeStyle = '#a0a'; ctx.beginPath(); ctx.arc(sx(p.x), sy(p.z), Math.max(2, r.R * cam.s), 0, 7); ctx.stroke() }

  // tours
  if (on('tours')) m.tours.forEach((t, ti) => {
    if (!tourOn.has(t.id)) return
    const col = TOUR_COL[ti % TOUR_COL.length]
    ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.globalAlpha = dataA * 0.7
    for (const l of t.legs) if (l.p.length) ctx.stroke(path(l.p))
    ctx.globalAlpha = dataA
    t.stops.forEach((s, i) => {
      ctx.fillStyle = s.off ? '#ccc' : s.name ? col : '#fff'; ctx.strokeStyle = s.off ? '#888' : col; ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(sx(s.x), sy(s.z), 7, 0, 7); ctx.fill(); ctx.stroke()
      ctx.fillStyle = s.name ? '#fff' : col; ctx.fillText(String(i + 1), sx(s.x) - 3, sy(s.z) + 4)
      if (s.name && on('labels')) { ctx.fillStyle = col; ctx.fillText(s.name, sx(s.x) + 9, sy(s.z) - 6) }
    })
  })
  // issues (the prep's checks)
  if (on('issues')) for (const q of data.issues) {
    if (!on('issue:' + q.k)) continue
    const x = sx(q.x), y = sy(q.z)
    if (x < -10 || y < -10 || x > W() + 10 || y > H() + 10) continue
    ctx.strokeStyle = issueCol(q.k); ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); ctx.stroke()
    if (cam.s > LABEL_S && on('labels')) { ctx.fillStyle = issueCol(q.k); ctx.fillText(q.k, x + 7, y - 4) }
  }
  // custom builds: catalogue builders (diamond; rectangle when placed by lat/lon + size), GLB statues (star), fountains (ring)
  for (const c of data.custom) {
    if (!customShown(c)) continue
    const x = sx(c.x), y = sy(c.z)
    if (x < -50 || y < -50 || x > W() + 50 || y > H() + 50) continue
    const tier = BUILDER_TIER[tierOf(c)]
    if (c.rect) { ctx.strokeStyle = c.kind === 'builder' ? tier.col : '#e000a0'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 3]); ctx.stroke(path(c.rect, true)); ctx.setLineDash([]) }
    ctx.fillStyle = c.kind === 'builder' ? tier.col : c.kind === 'statue' ? '#d4a000' : '#0090d0'
    ctx.beginPath()
    if (c.kind === 'builder') { const r = tier.r; ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y) }
    else if (c.kind === 'statue') for (let k = 0; k < 10; k++) { const a = (k * Math.PI) / 5 - Math.PI / 2, rr = k % 2 ? 2.5 : 6; ctx.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)) }
    else ctx.arc(x, y, 5, 0, 7)
    ctx.closePath(); ctx.fill()
    if (cam.s > (tierOf(c) === 'mass' && c.kind === 'builder' ? 3 : 0.8) && on('labels')) ctx.fillText(c.kind === 'statue' ? `${c.name} (${c.model})` : c.proc ? `${c.name} [${c.proc}]` : c.name, x + 7, y + 3)
  }
  // landmarks + skyline
  if (on('landmarks')) for (const l of m.landmarks) {
    ctx.fillStyle = l.tier === 1 ? '#c00000' : '#e06000'; ctx.beginPath(); ctx.moveTo(sx(l.x), sy(l.z) - 6); ctx.lineTo(sx(l.x) + 5, sy(l.z) + 4); ctx.lineTo(sx(l.x) - 5, sy(l.z) + 4); ctx.fill()
    if (cam.s > 0.4 && on('labels')) ctx.fillText(l.name, sx(l.x) + 6, sy(l.z))
  }
  if (on('skyline')) for (const s of (m.index.skyline as { name: string; x: number; z: number }[] | undefined) ?? []) { ctx.strokeStyle = '#000'; ctx.strokeRect(sx(s.x) - 4, sy(s.z) - 4, 8, 8) }
  ctx.globalAlpha = 1

  // OSM overlay, selection, measure
  if (osmOverlay) {
    ctx.strokeStyle = '#ff0040'; ctx.lineWidth = 3
    for (const w of osmOverlay.ways) ctx.stroke(path(w))
    ctx.fillStyle = '#ff0040'; for (let i = 0; i < osmOverlay.nodes.length; i += 2) ctx.fillRect(sx(osmOverlay.nodes[i]) - 3, sy(osmOverlay.nodes[i + 1]) - 3, 6, 6)
  }
  if (selected) {
    ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 3
    if (selected.pts) ctx.stroke(path(selected.pts))
    for (const r of selected.rings ?? []) ctx.stroke(path(r, true))
    if (selected.pt) { ctx.beginPath(); ctx.arc(sx(selected.pt[0]), sy(selected.pt[1]), 9, 0, 7); ctx.stroke() }
  }
  if (measure.length) {
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.fillStyle = '#000'
    const p = measure.flatMap((q) => [q.x, q.z]); if (measuring) p.push(mouse.x, mouse.z)
    ctx.stroke(path(p))
    let tot = 0
    for (let i = 2; i < p.length; i += 2) {
      const d = Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]); tot += d
      const brg = ((Math.atan2(p[i] - p[i - 2], p[i + 1] - p[i - 1]) * 180) / Math.PI + 360) % 360
      const ga = groundAt(p[i - 2], p[i - 1]), gb = groundAt(p[i], p[i + 1]), dh = ga != null && gb != null ? gb - ga : null
      const t = `${fmt(d, 1)} m  ${brg.toFixed(0)}°  Σ${fmt(tot, 1)}${dh != null ? `  Δh ${dh >= 0 ? '+' : ''}${dh.toFixed(1)} (${d > 0 ? ((dh / d) * 100).toFixed(1) : '0'}%)` : ''}`
      ctx.fillStyle = '#fff'; ctx.fillRect(sx((p[i] + p[i - 2]) / 2) + 2, sy((p[i + 1] + p[i - 1]) / 2) - 11, ctx.measureText(t).width + 4, 13)
      ctx.fillStyle = '#000'; ctx.fillText(t, sx((p[i] + p[i - 2]) / 2) + 4, sy((p[i + 1] + p[i - 1]) / 2) - 1)
    }
    for (let i = 0; i < p.length; i += 2) ctx.fillRect(sx(p[i]) - 2, sy(p[i + 1]) - 2, 4, 4)
  }
  if (chunks.length && (colourMode === 'slope' || colourMode === 'dground' || colourMode === 'level')) {
    const leg: [string, string][] = colourMode === 'slope' ? SLOPE_STOPS.map(([v, c]) => [c, `${v}%+`])
      : colourMode === 'dground' ? [['hsl(300,100%,30%)', `≤−${DGROUND_SAT} m`], ['hsl(300,100%,55%)', 'buried'], ['#777', 'grade'], ['hsl(30,100%,55%)', 'raised'], ['hsl(30,100%,30%)', `≥${DGROUND_SAT} m`]]
      : LV_NAME.map((n, i) => [LV_COL[i], n])
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(W() - 92, 6, 86, leg.length * 13 + 6)
    leg.forEach(([c, t], i) => { ctx.fillStyle = c; ctx.fillRect(W() - 86, 11 + i * 13, 14, 6); ctx.fillStyle = '#222'; ctx.fillText(t, W() - 68, 18 + i * 13) })
  }
  // scale bar
  const target = 120 / cam.s, pow = 10 ** Math.floor(Math.log10(target)), len = [1, 2, 5, 10].map((k) => k * pow).filter((v) => v <= target).pop()!
  ctx.fillStyle = '#000'; ctx.fillRect(10, H() - 16, len * cam.s, 3); ctx.fillText(len >= 1000 ? `${len / 1000} km` : `${len} m`, 10, H() - 20)
  status()
}

function status(): void {
  const q = data.proj.toLatLon({ x: mouse.x, z: mouse.z }), T = data.meta.index.tile
  const g = groundAt(mouse.x, mouse.z), msl = g != null ? data.msl(g) : null
  const lod = cam.s >= NEAR_S ? 'near' : cam.s >= MID_S ? 'mid' : 'far'
  const bakeWarn = data.liveBake && data.meta.index.bake && data.liveBake !== data.meta.index.bake ? `<span class="warn">prep is from bake ${data.meta.index.bake}, tiles are ${data.liveBake}: re-run devmaps:prep</span>` : ''
  $('status').innerHTML = `<span>${q.lat.toFixed(6)},${q.lon.toFixed(6)}</span><span>x ${mouse.x.toFixed(1)} z ${mouse.z.toFixed(1)}</span>`
    + `<span>tile ${Math.floor(mouse.x / T)},${Math.floor(mouse.z / T)}</span><span>ground ${g != null ? g.toFixed(1) + ' (v2)' + (msl != null ? ' / ' + msl.toFixed(1) + ' msl' : '') : '—'}</span>`
    + `<span>${cam.s.toFixed(3)} px/m · ${lod}</span><span>${data.pendingCount ? 'loading ' + data.pendingCount : ''}</span>${bakeWarn}${hoverText ? `<span style="color:#9cf">▸ ${hoverText.replace(/</g, '&lt;')}</span>` : ''}`
}

// ---------------------------------------------------------------- hit testing + inspector
type Hit = { type: string; label: string; d: number; t?: string; i?: number; geom: Geom; obj?: unknown }
const segDist = (x: number, z: number, ax: number, az: number, bx: number, bz: number): number => {
  const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz
  const u = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L)) : 0
  return Math.hypot(x - ax - u * dx, z - az - u * dz)
}
const lineDist = (x: number, z: number, p: number[]): number => { let d = Infinity; for (let i = 2; i < p.length; i += 2) d = Math.min(d, segDist(x, z, p[i - 2], p[i - 1], p[i], p[i + 1])); return d }
const inside = (x: number, z: number, p: number[]): boolean => {
  let c = false
  for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) if ((p[i + 1] > z) !== (p[j + 1] > z) && x < ((p[j] - p[i]) * (z - p[i + 1])) / (p[j + 1] - p[i + 1]) + p[i]) c = !c
  return c
}

function hitTest(x: number, z: number): Hit[] {
  const tol = HIT_PX / cam.s, hits: Hit[] = [], m = data.meta
  const chunks = viewChunks()
  for (const c of chunks) {
    for (const it of c.items) for (let i = 0; i < it.d.length; i += 3) {
      const ty = m.dict.items[it.d[i + 2]]; if (!on('items:' + ty)) continue
      const d = Math.hypot(it.d[i] - x, it.d[i + 1] - z); if (d < tol) hits.push({ type: 'item', label: ty, d, t: it.t, i: i / 3, geom: { pt: [it.d[i], it.d[i + 1]] } })
    }
    for (const [pi, p] of c.places.entries()) { void pi; const d = Math.hypot(p.x - x, p.z - z); if (on('places') && d < tol) hits.push({ type: 'place', label: `${p.k}: ${p.n}`, d, t: p.t, i: p.i, geom: { pt: [p.x, p.z] } }) }
    for (const s of c.streets) { if (!on('streets:' + s.r)) continue; const d = lineDist(x, z, s.p); if (d < Math.max(tol, (s.w ?? 0) / 2)) hits.push({ type: 'way', label: `${s.r} ${s.k}${s.n ? ' ' + s.n : ''}`, d: d + 0.1, t: s.t, i: s.i, geom: { pts: s.p }, obj: s }) }
    for (const r of c.ride) { if (!on('ride:' + r.m, false)) continue; const d = lineDist(x, z, r.p); if (d < tol) hits.push({ type: 'ride', label: `ride-${r.m} edge ${r.a.id} ${r.a.name ?? ''}`, d: d + 0.2, geom: { pts: r.p }, obj: r }) }
    for (const b of c.courts) { const d = Math.hypot(b.x - x, b.z - z); if (on('courts') && d < Math.max(tol, b.l / 2)) hits.push({ type: 'court', label: b.s, d: d + 1, t: b.t, i: b.i, geom: { pt: [b.x, b.z] } }) }
    for (const b of c.boats) if (on('boats') && inside(x, z, b.p)) hits.push({ type: 'boat', label: b.n ?? 'boat', d: 2, t: b.t, i: b.i, geom: { rings: [b.p] } })
    for (const d of c.decks) if (on('decks') && inside(x, z, d.p)) hits.push({ type: 'deck', label: `deck at ${d.h} m`, d: 3, t: d.t, i: d.i, geom: { rings: [d.p] } })
    for (const b of c.buildings) if (on('buildings:' + b.k) && on('style:' + (styleName(b) ?? '(none)')) && b.rs.some((r) => inside(x, z, r))) hits.push({ type: 'building', label: `${b.k} ${b.ht ?? ''}m${b.st != null ? ' · ' + data.meta.dict.styles[b.st] : ''}${b.ar != null ? '/' + data.meta.dict.archetypes[b.ar] : ''}${b.lk ? ` · restyle ${b.lk.src}${b.lk.s ? ' ' + b.lk.s : ''}${b.lk.c != null ? ' conf ' + b.lk.c : ''}${b.lk.on ? '' : ' (not applied)'}` : ''}`, d: 4, t: b.t, i: b.i, geom: { rings: b.rs } })
    for (const a of c.areas) if (on('areas:' + a.k) && inside(x, z, a.p)) hits.push({ type: 'area', label: a.k, d: 6, t: a.t, i: a.i, geom: { rings: [a.p] } })
  }
  for (const c of data.custom) {
    if (!customShown(c)) continue
    const d = Math.hypot(c.x - x, c.z - z)
    if (d < tol * 1.5 || (c.rect && inside(x, z, c.rect))) hits.push({ type: 'custom ' + c.kind, label: c.proc ? `${c.name} [${c.proc} ×${builderCount.get(c.proc)}]` : c.model ? `${c.name} (${c.model})` : c.name, d: Math.min(d, 2.5), geom: { pt: [c.x, c.z], ...(c.rect ? { rings: [c.rect] } : {}) }, obj: c })
  }
  if (cam.s >= MID_S) {
    const lg = data.legacy
    if (on('quay')) for (let i = 0; i < lg.quay.length; i += 7) { const q = lg.quay; const d = segDist(x, z, q[i], q[i + 1], q[i + 2], q[i + 3]); if (d < tol) hits.push({ type: 'quay wall', label: `top ${q[i + 4]} low ${q[i + 5]} cap ${q[i + 6]}`, d: d + 0.3, geom: { pts: q.slice(i, i + 2).concat(q.slice(i + 2, i + 4)) }, obj: { ax: q[i], az: q[i + 1], bx: q[i + 2], bz: q[i + 3], top: q[i + 4], low: q[i + 5], cap: q[i + 6], note: 'index legacy.quayWalls (v2 metres)' } }) }
    if (on('garden:hedges')) for (const h of lg.hedges) { const d = lineDist(x, z, h.points); if (d < Math.max(tol, h.w / 2)) hits.push({ type: 'hedge', label: `h ${h.h} w ${h.w}`, d: d + 0.4, geom: { pts: h.points }, obj: h }) }
    if (on('garden:topiary')) for (let i = 0; i < lg.topiary.length; i += 4) { const t = lg.topiary; const d = Math.hypot(t[i] - x, t[i + 1] - z); if (d < tol) hits.push({ type: 'topiary', label: ['cone', 'ball', 'cube'][t[i + 3]] ?? String(t[i + 3]), d, geom: { pt: [t[i], t[i + 1]] }, obj: { x: t[i], z: t[i + 1], height: t[i + 2], shape: t[i + 3] } }) }
    if (on('garden:flats')) for (const f of lg.flats) if (inside(x, z, f.ring)) hits.push({ type: 'garden flat', label: f.kind, d: 6.5, geom: { rings: [f.ring] }, obj: f })
  }
  if (on('issues')) for (const q of data.issues) { if (!on('issue:' + q.k)) continue; const d = Math.hypot(q.x - x, q.z - z); if (d < tol * 1.5) hits.push({ type: 'issue', label: `${q.k}: ${q.m}`, d: Math.min(d, 1), geom: { pt: [q.x, q.z] }, obj: q }) }
  for (const l of m.landmarks) { const d = Math.hypot(l.x - x, l.z - z); if (on('landmarks') && d < tol * 1.5) hits.push({ type: 'landmark', label: l.name, d, geom: { pt: [l.x, l.z] }, obj: l }) }
  m.tours.forEach((t) => { if (!tourOn.has(t.id) || !on('tours')) return; t.stops.forEach((s, i) => { const d = Math.hypot(s.x - x, s.z - z); if (d < tol * 1.5) hits.push({ type: 'tour stop', label: `${t.name} #${i + 1} ${s.name ?? ''}`, d, geom: { pt: [s.x, s.z] }, obj: { tour: t.id, stop: i + 1, ...s } }) }) })
  for (const w of m.water) if (on('water') && inside(x, z, w.ring)) hits.push({ type: 'water', label: w.kind, d: 7, geom: { rings: [w.ring] }, obj: w })
  for (const zn of m.zones) if (on('zones') && inside(x, z, zn.ring)) hits.push({ type: 'zone', label: zn.ref, d: 8, geom: { rings: [zn.ring] }, obj: zn })
  for (const d of m.index.detail ?? []) {
    for (const r of d.rings ?? []) if (inside(x, z, r) || (d.margin && lineDist(x, z, [...r, r[0], r[1]]) < d.margin)) hits.push({ type: 'detail', label: d.name, d: 9, geom: { rings: [r] }, obj: d })
    if (d.line && lineDist(x, z, d.line) < d.margin) hits.push({ type: 'detail', label: d.name, d: 9, geom: { pts: d.line }, obj: d })
  }
  const T = m.index.tile, key = `${Math.floor(x / T)},${Math.floor(z / T)}`
  const ti = m.tiles.find((t) => t.key === key)
  hits.push({ type: 'tile', label: ti ? key : `${key} (not in bake)`, d: 10, t: key, geom: { rings: [[Math.floor(x / T) * T, Math.floor(z / T) * T, (Math.floor(x / T) + 1) * T, Math.floor(z / T) * T, (Math.floor(x / T) + 1) * T, (Math.floor(z / T) + 1) * T, Math.floor(x / T) * T, (Math.floor(z / T) + 1) * T]] }, obj: ti })
  return hits.sort((a, b) => a.d - b.d).slice(0, 60)
}

function header(h: Hit, x: number, z: number): string {
  const ll = llStr(x, z)
  return `<div><b>${h.type}</b> ${h.label.replace(/</g, '&lt;')}</div>`
    + `<div><a href="#" data-copy="${ll}">${ll}</a> · <a href="#" data-copy="${x.toFixed(1)},${z.toFixed(1)}">x,z ${x.toFixed(1)},${z.toFixed(1)}</a>`
    + ` · <a target="_blank" href="${gmaps(x, z)}">Google</a> · <a target="_blank" href="${osmSite(x, z)}">OSM</a>${h.t ? ` · tile ${h.t}` : ''}</div>`
    + `<div>3D: <a target="_blank" href="${game3d(x, z)}" title="the game, started at this point (?at=), frozen">in the city</a>${proc3d(h) ? ` · <a target="_blank" href="/?model=${encodeURIComponent(proc3d(h)!)}" title="the model showcase: this builder alone, at its default size">${proc3d(h)} alone</a>` : ''}</div>`
}

async function inspect(h: Hit): Promise<void> {
  selected = h.geom; redraw()
  lastRaw = h.obj; lastHit = h; saveHash()
  const el = $('p-inspect'), cx: Ctx = { data, what: h.type }
  const [x, z] = h.geom.pt ?? (h.geom.pts ? [h.geom.pts[0], h.geom.pts[1]] : h.geom.rings ? [h.geom.rings[0][0], h.geom.rings[0][1]] : [mouse.x, mouse.z])
  let body = ''
  if (h.t && h.type !== 'tile') {
    const t = await data.tileNow(h.t)
    if (!t) { el.innerHTML = header(h, x, z) + '<div class="warn">tile not loaded</div>'; return }
    const ways = t.ways as Record<string, unknown>[]
    if (h.type === 'way') {
      const w = ways[h.i!], s = h.obj as Street | undefined
      lastRaw = w
      const st = s ?? findStreet(h.t, h.i!)
      const prof = st ? profileSvg(along(st.p), [{ v: st.h, col: '#ffb000', label: 'way' }, { v: st.h.map((v, j) => v - (st.d[j] ?? NaN)), col: '#7c7', label: 'ground' }]) : ''
      body = `<div>${w.ref ? refLinks(String(w.ref)) : ''}</div>` + prof + tree(w, { ...cx, what: w.role === 'rail' ? 'rail' : 'way' }) + wayTable(t, w as unknown as { nodes: number[]; z?: number[] }, cx, st)
    } else if (h.type === 'item') { lastRaw = itemRow(t, h.i!, cx); body = tree(lastRaw, cx) }
    else {
      const coll = ({ building: 'buildings', area: 'areas', deck: 'decks', place: 'places', boat: 'boats', court: 'courts' } as Record<string, string>)[h.type]
      const o = (t[coll] as Record<string, unknown>[])[h.i!]
      lastRaw = o
      body = tree(o, { ...cx, what: h.type })
      if (o && typeof o.way === 'number') body += `<details><summary>its way #${o.way}</summary>${tree(ways[o.way], { ...cx, what: 'way' })}</details>`
      const om = h.type === 'building' && o ? /^b(\d+)$/.exec(String(o.ref)) : null
      if (om && data.restyles[om[1]]) body = `<details open><summary>restyle (render time, src/city/hand-looks.ts)</summary>${tree(data.restyles[om[1]], { ...cx, what: 'restyle' })}</details>` + body
      if (o && h.type === 'building' && Array.isArray(o.parts)) body += `<div class="muted">${(o.parts as unknown[]).length} parts (above)</div>`
    }
  } else if (h.type === 'tile') {
    const t = h.t ? await data.tileNow(h.t) : undefined
    body = `<details open><summary>prep stats</summary>${tree(h.obj ?? {}, cx)}</details>`
    if (t) {
      lastRaw = t
      body += `<details open><summary>raw tile fields</summary>${Object.entries(t).map(([k, v]) => `<div class="kv"><span class="k">${k}</span>: ${Array.isArray(v) ? `[${v.length}]` : typeof v === 'object' && v ? `{${Object.keys(v).length} keys}` : JSON.stringify(v)}</div>`).join('')}</details>`
      body += `<details><summary>whole raw tile</summary>${tree(t, { ...cx, what: 'tile' })}</details>`
    }
  } else if (h.type === 'ride') {
    const r = h.obj as { a: Record<string, unknown>; p: number[]; h?: number[] }
    body = (r.h ? profileSvg(along(r.p), [{ v: r.h, col: '#ff4090', label: 'ride edge' }, { v: groundLine(r.p), col: '#7c7', label: 'ground' }]) : '') + tree({ ...r.a, heights: r.h, points: r.p }, { ...cx, what: 'ride' })
  } else if (h.type.startsWith('custom')) {
    const c = h.obj as import('./data.ts').Custom
    lastRaw = c.entry
    body = `<div>from <b>${c.src}</b> · placed by ${c.approx ?? '?'}${c.bld ? ` · builds bake building <a href="#" id="custbld">${c.bld.t} #${c.bld.i} (${c.bld.k})</a>` : ''}</div>`
      + `<div class="muted">position/rectangle approximate the renderer's fit (src/render/landmarks.ts)</div>` + tree(c.entry, { ...cx, what: 'catalogue' })
    el.innerHTML = header(h, x, z) + actions(h) + body
    $('custbld')?.addEventListener('click', (e) => { e.preventDefault(); void inspect({ type: 'building', label: c.name, d: 0, t: c.bld!.t, i: c.bld!.i, geom: h.geom }) })
    showPane('inspect'); return
  } else if (h.type === 'issue') {
    const q = h.obj as Issue
    body = `<div class="warn">${q.k}</div><div>${q.m.replace(/</g, '&lt;')}</div>${q.t != null && q.i != null ? `<div><a href="#" id="issway">inspect way #${q.i} in tile ${q.t}</a></div>` : q.t ? `<div><a href="#" id="issway">inspect tile ${q.t}</a></div>` : ''}<div class="muted">${issueHelp[q.k.replace(/ \(.*/, '')] ?? ''}</div>`
    el.innerHTML = header(h, x, z) + body + actions(h)
    $('issway')?.addEventListener('click', (e) => {
      e.preventDefault()
      const st = q.i != null ? findStreet(q.t!, q.i) : undefined
      void inspect(q.i != null ? { type: 'way', label: `way #${q.i}`, d: 0, t: q.t, i: q.i, geom: st ? { pts: st.p } : h.geom, obj: st } : { type: 'tile', label: q.t!, d: 0, t: q.t, geom: h.geom, obj: data.meta.tiles.find((tt) => tt.key === q.t) })
    })
    showPane('inspect'); return
  } else if (h.type === 'landmark') {
    const l = h.obj as { id: number }
    body = `<div>${osm('way', l.id)} ${osm('node', l.id)} ${osm('relation', l.id)}</div>` + tree(l, cx)
  } else body = tree(h.obj, cx)
  el.innerHTML = header(h, x, z) + actions(h) + body
  showPane('inspect')
}

/** copy-JSON / copy-link line under the inspector header */
let lastRaw: unknown = null
let lastHit: Hit | null = null
const actions = (h: Hit): string => `<div class="muted"><a href="#" data-act="json">copy JSON</a> · <a href="#" data-act="link" title="a link that reopens this view with this entity selected">copy link</a>${h.t && h.i != null ? ` · <span title="tile key | index">${h.type} ${h.t}|${h.i}</span>` : ''}</div>`
/** the street record (chunk) for a raw way, if its chunk is loaded */
function findStreet(t: string, i: number): Street | undefined {
  for (const c of data.loadedChunks()) for (const s of c.streets) if (s.t === t && s.i === i) return s
  return undefined
}
/** ground along a polyline's own points */
const groundLine = (p: number[]): number[] => { const out: number[] = []; for (let i = 0; i < p.length; i += 2) out.push(groundAt(p[i], p[i + 1]) ?? NaN); return out }
const issueHelp: Record<string, string> = {
  'junction tear': 'Two ways share this node but stand at different heights there (neither is a bridge/tunnel): a step in the road, or a crossing that should not share a node.',
  'level blip': 'A short raised/buried run between grade segments: usually the ground (coarse or fine) or a node z, not a real structure.',
  'z override no-op': 'The way carries a per-node z override that changes nothing: the multi-level pass decided a height equal to the node\'s own.',
  'unknown level on fine ground': 'Some node has no ground under it though the tile ships fine ground: a lookup bug, not missing data.',
  'steep ride': 'Ride-graph grade over a window: real hills, or a height spike (check the profile).',
  'ride island': 'A ride-graph component cut off from the biggest: unreachable while riding. Minis clip the graph, so some islands are expected at their edges.',
}

function listHits(hits: Hit[]): void {
  const el = $('p-inspect')
  el.innerHTML = `<div class="muted">${hits.length} under cursor (${llStr(mouse.x, mouse.z)}):</div>` + hits.map((h, i) => `<div class="hit" data-hit="${i}">${h.type} · ${h.label.replace(/</g, '&lt;')}</div>`).join('')
  el.querySelectorAll<HTMLElement>('[data-hit]').forEach((d) => d.addEventListener('click', () => void inspect(hits[Number(d.dataset.hit)])))
  showPane('inspect')
}

// ---------------------------------------------------------------- links, goto, search, OSM overlay
/** the game started at a point, frozen — what tools/look-at.ts opens (a full city load: slow on Paris) */
const game3d = (x: number, z: number): string => `/?city=${data.id}&at=${llStr(x, z)}&freeze=1&dev=1`
/** a procedural builder's name, for the model showcase (?model=, src/model-showcase.ts) */
const proc3d = (h: Hit): string | null => {
  const o = h.obj as { proc?: string } | undefined
  if (h.type.startsWith('custom') && o?.proc) return o.proc
  if (h.type === 'building' && h.t) { const c = data.customBldg.get(`${h.t}|${h.i}`); if (c?.proc) return c.proc }
  return null
}
const gmaps = (x: number, z: number): string => `https://www.google.com/maps/@?api=1&map_action=map&center=${llStr(x, z)}&zoom=19&basemap=satellite`
const osmSite = (x: number, z: number): string => { const q = data.proj.toLatLon({ x, z }); return `https://www.openstreetmap.org/#map=19/${q.lat.toFixed(6)}/${q.lon.toFixed(6)}` }

function goTo(x: number, z: number, s?: number): void { cam.cx = x; cam.cz = z; if (s) cam.s = s; redraw(); saveHash() }

async function loadOsm(type: string, id: string): Promise<void> {
  const url = `https://api.openstreetmap.org/api/0.6/${type}/${id}${type === 'node' ? '' : '/full'}.json`
  toast('fetching ' + type + ' ' + id)
  const j = await (await fetch(url)).json() as { elements: { type: string; id: number; lat?: number; lon?: number; nodes?: number[]; tags?: Record<string, string>; members?: unknown[] }[] }
  const nodes = new Map<number, [number, number]>()
  for (const e of j.elements) if (e.type === 'node') { const p = data.proj.toLocal({ lat: e.lat!, lon: e.lon! }); nodes.set(e.id, [p.x, p.z]) }
  const ways = j.elements.filter((e) => e.type === 'way').map((w) => w.nodes!.flatMap((n) => nodes.get(n) ?? []))
  const pts = type === 'node' ? [...nodes.values()].flat() : []
  osmOverlay = { ways, nodes: pts, label: `${type} ${id}` }
  const all = [...ways.flat(), ...pts]
  if (all.length) { let a = 0, b = 0; for (let i = 0; i < all.length; i += 2) { a += all[i]; b += all[i + 1] } goTo(a / (all.length / 2), b / (all.length / 2), Math.max(cam.s, 1)) }
  const main = j.elements.find((e) => e.type === type && String(e.id) === id)
  $('p-inspect').innerHTML = `<div><b>OSM ${type} ${id}</b> ${osm(type, id)} <a href="#" id="osmclear">clear overlay</a></div>` + tree(main ?? j, { data, what: 'osm' })
  $('osmclear')?.addEventListener('click', (e) => { e.preventDefault(); osmOverlay = null; redraw() })
  showPane('inspect')
  // is it in the bake? b<id> / s<id>-… refs
  const rows = await data.search()
  const mine = rows.filter((r) => typeof r[5] === 'string' && (r[5] === `b${id}` || (r[5] as string).includes(`${id}`))).slice(0, 30)
  $('p-inspect').innerHTML += `<div class="muted">in this bake: ${mine.length ? '' : 'nothing with that id in a ref'}</div>` + mine.map((r) => `<div class="hit" data-go="${r[2]},${r[3]}">${r[1]} · ${r[0]}</div>`).join('')
  bindGo($('p-inspect'))
}

function parseGoto(q: string): void {
  q = q.trim()
  const osmM = /^(way|node|relation|w|n|r)\s*\/?\s*(\d+)$/i.exec(q)
  if (osmM) { const t = { w: 'way', n: 'node', r: 'relation' }[osmM[1].toLowerCase()] ?? osmM[1].toLowerCase(); void loadOsm(t, osmM[2]); return }
  const num = /^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/.exec(q)
  if (num) {
    const a = Number(num[1]), b = Number(num[2]), o = data.meta.index.origin
    if (Math.abs(a - o.lat) < 2 && Math.abs(b - o.lon) < 2) { const p = data.proj.toLocal({ lat: a, lon: b }); measure.length = 0; goTo(p.x, p.z, Math.max(cam.s, 2)); selected = { pt: [p.x, p.z] } }
    else { goTo(a, b, Math.max(cam.s, 2)); selected = { pt: [a, b] } }
    return
  }
  void runSearch(q)
}

function bindGo(el: HTMLElement): void {
  el.querySelectorAll<HTMLElement>('[data-go]').forEach((d) => d.addEventListener('click', () => { const [x, z] = d.dataset.go!.split(',').map(Number); selected = { pt: [x, z] }; goTo(x, z, Math.max(cam.s, 3)) }))
}

/** every layer type the bake holds, as [layerKey, label, total]: item types, building kinds, styles, area kinds, way roles */
function layerTypes(): [string, string, number][] {
  const tot = new Map<string, number>()
  for (const t of data.meta.tiles) for (const [k, v] of Object.entries(t)) if (typeof v === 'number' && /^(item|building|style|area|way)\./.test(k)) tot.set(k, (tot.get(k) ?? 0) + v)
  const back: Record<string, [string, string]> = { item: ['items:', 'item'], building: ['buildings:', 'building kind'], style: ['style:', 'style'], area: ['areas:', 'area'], way: ['streets:', 'way role'] }
  return [...tot].map(([k, n]) => { const d = k.indexOf('.'), [pre, lab] = back[k.slice(0, d)]; return [pre + k.slice(d + 1), `${lab}: ${k.slice(d + 1)}`, n] as [string, string, number] })
}
/** the colour of a search row's type: its category (before ':' or a space), so all places, all buildings… match */
const typeCol = (t: string): string => hue(t.split(/[: ]/)[0]).replace('45%)', '50%)')

async function runSearch(q: string): Promise<void> {
  const el = $('p-find'); showPane('find')
  el.innerHTML = `<div class="bar"><input id="findq" type="text" value="${q.replace(/"/g, '&quot;')}" placeholder="name, ref (b123), type (busstop), type:x"></div><div id="findtypes"></div><div id="findres" class="muted">searching…</div>`
  const inp = $<HTMLInputElement>('findq')
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') void runSearch(inp.value) })
  if (!q) { $('findres').textContent = 'type and press Enter'; return }
  const ql = q.toLowerCase()
  // type search: `type:busstop` goes straight to the list; otherwise every type whose name matches is offered first
  const types = layerTypes()
  const tq = /^(type|item|style|kind|area|role):\s*(.+)$/i.exec(q)
  if (tq) {
    const want = tq[2].toLowerCase(), t = types.find(([, lab]) => lab.split(': ')[1].toLowerCase() === want) ?? types.find(([, lab]) => lab.toLowerCase().includes(want))
    if (t) { findType(t[0]); return }
  }
  const matchT = types.filter(([, lab]) => lab.split(': ')[1].toLowerCase().includes(tq ? tq[2].toLowerCase() : ql)).sort((a, b) => b[2] - a[2])
  $('findtypes').innerHTML = matchT.length ? `<details open><summary>types (${matchT.length})</summary>${matchT.map(([k, lab, n]) => `<div class="hit" data-type="${k}"><i style="display:inline-block;width:9px;height:9px;background:${typeCol(lab)}"></i> ${lab} <b>×${n}</b></div>`).join('')}</details>` : ''
  $('findtypes').querySelectorAll<HTMLElement>('[data-type]').forEach((d) => d.addEventListener('click', () => findType(d.dataset.type!)))
  const rows = await data.search()
  const res: (string | number)[][] = []
  for (const r of rows) { if (String(r[0]).toLowerCase().includes(ql) || String(r[5]).toLowerCase() === ql || String(r[1]).toLowerCase() === ql) res.push(r); if (res.length > 500) break }
  res.sort((a, b) => (String(a[0]).toLowerCase() === ql ? -1 : 0) - (String(b[0]).toLowerCase() === ql ? -1 : 0))
  $('findres').innerHTML = `<div class="muted">${res.length}${res.length > 500 ? '+' : ''} named matches</div>` + res.map((r) => `<div class="hit" data-go="${r[2]},${r[3]}"><i style="display:inline-block;width:9px;height:9px;background:${typeCol(String(r[1]))}"></i> ${String(r[0]).replace(/</g, '&lt;')} <span style="color:${typeCol(String(r[1]))}">${r[1]}</span> <span class="muted">${r[4]} ${r[5]}</span></div>`).join('')
  bindGo($('findres'))
}

// ---------------------------------------------------------------- panes
function showPane(p: string): void {
  document.querySelectorAll<HTMLElement>('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.p === p))
  document.querySelectorAll<HTMLElement>('.pane').forEach((e) => e.classList.toggle('on', e.id === 'p-' + p))
}

/** the restyles' own styles (skyscraper, bauhaus…) need a checkbox too, even where no bake building has them */
function addRestyleStyles(m: Map<string, number>): Map<string, number> {
  for (const r of Object.values(data.restyles) as { look?: { style?: string }; applied?: boolean }[]) if (r.applied && r.look?.style && !m.has(r.look.style)) m.set(r.look.style, 0)
  return m
}

/** a layer prefix → the per-tile stat the prep counted it under */
const STAT_OF: Record<string, string> = { 'items:': 'item.', 'buildings:': 'building.', 'areas:': 'area.', 'streets:': 'way.', 'style:': 'style.' }

/**
 * Every instance of one layer type (`items:busstop`, `buildings:mesh`, `style:bauhaus`…) in the find tab: exact positions from
 * the chunks already loaded, then every tile that holds any (from the prep's per-tile counts), most first — click to go.
 */
function findType(layerKey: string): void {
  const prefix = layerKey.slice(0, layerKey.indexOf(':') + 1), key = layerKey.slice(prefix.length)
  const stat = STAT_OF[prefix] + key, m = data.meta
  const exact: { x: number; z: number; label: string }[] = []
  const ti = m.dict.items.indexOf(key)
  for (const c of data.loadedChunks()) {
    if (prefix === 'items:') for (const it of c.items) for (let i = 0; i < it.d.length; i += 3) { if (it.d[i + 2] === ti) exact.push({ x: it.d[i], z: it.d[i + 1], label: `${key} · tile ${it.t}` }) }
    if (prefix === 'buildings:') for (const b of c.buildings) if (b.k === key) exact.push({ x: b.x, z: b.z, label: `${b.k} ${b.ht ?? ''}m · tile ${b.t}` })
    if (prefix === 'style:') for (const b of c.buildings) if ((styleName(b) ?? '(none)') === key) exact.push({ x: b.x, z: b.z, label: `${b.k} ${b.ht ?? ''}m · tile ${b.t}` })
    if (prefix === 'areas:') for (const a of c.areas) if (a.k === key) exact.push({ x: a.p[0], z: a.p[1], label: `${a.k} · tile ${a.t}` })
    if (prefix === 'streets:') for (const st of c.streets) if (st.r === key) exact.push({ x: st.p[0], z: st.p[1], label: `${st.k}${st.n ? ' ' + st.n : ''} · tile ${st.t}` })
  }
  // nearest the view first
  exact.sort((a, b) => Math.hypot(a.x - cam.cx, a.z - cam.cz) - Math.hypot(b.x - cam.cx, b.z - cam.cz))
  const T = m.index.tile
  const tiles = m.tiles.filter((t) => typeof t[stat] === 'number' && (t[stat] as number) > 0).sort((a, b) => (b[stat] as number) - (a[stat] as number))
  const total = tiles.reduce((s, t) => s + (t[stat] as number), 0)
  const el = $('p-find'); showPane('find')
  el.innerHTML = `<div class="bar"><input id="findq" type="text" value="type:${key.replace(/"/g, '&quot;')}"></div><div><i style="display:inline-block;width:9px;height:9px;background:${typeCol(STAT_OF[prefix])}"></i> <b>${layerKey}</b>: ${total} in ${tiles.length} tiles</div>`
    + `<details open><summary>${exact.length} in the chunks loaded now (nearest first)</summary>${exact.slice(0, 500).map((r) => `<div class="hit" data-go="${r.x},${r.z}">${r.label}</div>`).join('')}${exact.length > 500 ? `<div class="muted">…${exact.length - 500} more</div>` : ''}</details>`
    + `<details open><summary>by tile</summary>${tiles.slice(0, 2000).map((t) => `<div class="hit" data-go="${(t.tx + 0.5) * T},${(t.ty + 0.5) * T}">tile ${t.key}: ${t[stat]}</div>`).join('')}</details>`
  bindGo(el)
  const inp = $<HTMLInputElement>('findq'); inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') void runSearch(inp.value) })
}

function buildLayers(): void {
  const m = data.meta, c = m.census, tiles = m.tiles
  const sum = (prefix: string): Map<string, number> => {
    const out = new Map<string, number>()
    for (const t of tiles) for (const [k, v] of Object.entries(t)) if (k.startsWith(prefix) && typeof v === 'number') out.set(k.slice(prefix.length), (out.get(k.slice(prefix.length)) ?? 0) + v)
    return out
  }
  const box = (key: string, label: string, col = '', dflt = true): string => `<label class="lay"><input type="checkbox" data-l="${key}" ${on(key, dflt) ? 'checked' : ''}>${col ? `<i style="background:${col}"></i>` : ''}${label}</label>`
  const group = (title: string, prefix: string, counts: Map<string, number>, col: (k: string) => string): string =>
    `<details open><summary>${title} <a href="#" data-all="${prefix}">all</a>/<a href="#" data-none="${prefix}">none</a></summary>${[...counts].sort((a, b) => b[1] - a[1]).map(([k, n]) => box(prefix + k, `${k} ${STAT_OF[prefix] ? `<a href="#" class="muted" data-find="${prefix}${k}" title="list them all">${n}</a>` : `<span class="muted">${n}</span>`}`, col(k))).join('')}</details>`
  const items = sum('item.')
  const trees = new Map([...items].filter(([k]) => k.startsWith('tree'))), furn = new Map([...items].filter(([k]) => !k.startsWith('tree')))
  const lvl = new Map(LV_NAME.map((n, i) => [n, m.levelCount[i]]))
  $('p-layers').innerHTML =
    `<div class="bar">buildings coloured by <select id="bmode"><option value="kind">kind</option><option value="restyle">restyle (wall colour; pink = applied)</option><option value="height">height</option><option value="style">style</option><option value="archetype">archetype</option></select> <span class="muted">${Object.keys(data.restyles).length} restyled</span> <label><input type="checkbox" id="hideun" ${hideUnapplied ? 'checked' : ''}> hide confidence-1 and unapplied restyles</label></div>`
    + `<details><summary>style / archetype colours</summary><div class="muted">style = the applied restyle's, else the bake's; labels end in ? on generic buildings (guessed)</div>${m.dict.styles.map((n) => `<span style="white-space:nowrap"><i style="display:inline-block;width:10px;height:10px;background:${nameCol(n)}"></i> ${n}</span>`).join(' ')}<br>${m.dict.archetypes.map((n) => `<span style="white-space:nowrap"><i style="display:inline-block;width:10px;height:10px;background:${nameCol(n)}"></i> ${n}</span>`).join(' ')}</details>`
    + `<div class="bar">streets coloured by <select id="cmode"><option value="level">level</option><option value="slope">slope (%)</option><option value="dground">Δground (m)</option><option value="kind">kind</option><option value="role">role</option></select></div>`
    + `<div class="bar">tiles coloured by <select id="tmode"><option value="">nothing</option><option value="issues">issues</option><option value="bytes">bytes</option><option value="way.">ways</option><option value="building.">buildings</option><option value="item.">items</option><option value="item.tree">trees</option><option value="area.">areas</option><option value="terrain.step">fine terrain</option><option value="other.">unknown keys</option></select></div>`
    + `<details open><summary>base</summary>${box('sat', 'satellite (use the slider)')}${box('terrain', 'coarse terrain')}${box('fineTerrain', 'fine terrain (near)')}${box('grid', 'tile grid')}${box('detail', 'detail squares (the box)', '#d02020')}${box('box', 'bounding box', '#800')}${box('zones', `zones <span class="muted">${m.zones.length}</span>`)}${box('water', `water (index) <span class="muted">${m.water.length}</span>`)}${box('river', 'river centreline')}${box('major', 'major roads (far)')}${box('labels', 'labels')}${box('nodes', 'way nodes (near; red = OSM node)')}</details>`
    + group('street levels', 'lvl:', lvl, (k) => LV_COL[LV_NAME.indexOf(k)])
    + group('ways by role', 'streets:', sum('way.'), () => '')
    + group('buildings', 'buildings:', sum('building.'), () => '')
    + group('building styles (bake; an applied restyle overrides)', 'style:', addRestyleStyles(sum('style.')), (k) => nameCol(k))
    + group('areas', 'areas:', sum('area.'), (k) => AREA_COL[k] ?? hue(k))
    + group('plants', 'items:', trees, () => '#2e8b3a')
    + group('street furniture', 'items:', furn, hue)
    + `<details open><summary>other</summary>${box('decks', 'decks', '#1e50e6')}${box('places', 'places')}${box('courts', 'courts')}${box('boats', 'boats')}${box('ride:bike', 'ride graph: bike', '#ff0078', false)}${box('ride:run', 'ride graph: run', '#00a0ff', false)}${box('quay', `quay walls <span class="muted">${data.legacy.quay.length / 7}</span>`, '#c06020')}${box('garden:hedges', `garden hedges <span class="muted">${data.legacy.hedges.length}</span>`, '#2f6a2a')}${box('garden:topiary', `garden topiary <span class="muted">${data.legacy.topiary.length / 4}</span>`, '#1f5a1f')}${box('garden:flats', `garden beds/lawns/gravel <span class="muted">${data.legacy.flats.length}</span>`, '#c88aa0')}${box('garden:formal', `formal (no scatter) <span class="muted">${data.legacy.formal.length}</span>`, '#4a7a3a')}${box('custom:builder', `custom builders <span class="muted">${data.custom.filter((c) => c.kind === 'builder').length}</span>`, '#e000a0')}${box('custom:statue', `GLB statues <span class="muted">${data.custom.filter((c) => c.kind === 'statue').length}</span>`, '#d4a000')}${box('custom:fountain', `fountains <span class="muted">${data.custom.filter((c) => c.kind === 'fountain').length}</span>`, '#0090d0')}${box('landmarks', `landmarks <span class="muted">${m.landmarks.length}</span>`)}${box('skyline', 'skyline')}${box('walls', `walls <span class="muted">${m.walls.length}</span>`)}${box('roundabouts', 'roundabouts')}${box('tours', 'tours')}</details>`
    + `<details><summary>fields the bake carries (census)</summary>${Object.entries(c).map(([k, v]) => `<div><span class="k">${k}</span> ${Object.entries(v).map(([f, n]) => `${f}<span class="muted">:${n}</span>`).join(' ')}</div>`).join('')}</details>`
    + `<details><summary>other tile keys</summary>${[...sum('other.')].map(([k, n]) => `${k}:${n}`).join(' ') || 'none'}</details>`
  const el = $('p-layers')
  $<HTMLSelectElement>('cmode').value = colourMode
  $<HTMLSelectElement>('bmode').value = bldgMode
  $<HTMLSelectElement>('tmode').value = tileStat
  $<HTMLSelectElement>('tmode').onchange = (e) => setTileStat((e.target as HTMLSelectElement).value)
  $<HTMLInputElement>('hideun').onchange = (e) => { hideUnapplied = (e.target as HTMLInputElement).checked; redraw() }
  $<HTMLSelectElement>('bmode').onchange = (e) => { bldgMode = (e.target as HTMLSelectElement).value as typeof bldgMode; redraw() }
  $<HTMLSelectElement>('cmode').onchange = (e) => { colourMode = (e.target as HTMLSelectElement).value as typeof colourMode; redraw() }
  el.querySelectorAll<HTMLInputElement>('[data-l]').forEach((i) => i.addEventListener('change', () => { layers.set(i.dataset.l!, i.checked); redraw() }))
  const setAll = (prefix: string, v: boolean, e: Event): void => {
    e.preventDefault()
    ;(e.target as HTMLElement).closest('details')!.querySelectorAll<HTMLInputElement>(`[data-l^="${prefix}"]`).forEach((i) => { i.checked = v; layers.set(i.dataset.l!, v) }); redraw()
  }
  el.querySelectorAll<HTMLElement>('[data-find]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); findType(a.dataset.find!) }))
  el.querySelectorAll<HTMLElement>('[data-all]').forEach((a) => a.addEventListener('click', (e) => setAll(a.dataset.all!, true, e)))
  el.querySelectorAll<HTMLElement>('[data-none]').forEach((a) => a.addEventListener('click', (e) => setAll(a.dataset.none!, false, e)))
}

const uniqueOnly = (): boolean => tierOn.unique && !tierOn.repeated && !tierOn.mass && on('custom:builder')
/** unique builders only, and nothing else custom — or back to everything */
function toggleUnique(): void {
  const to = !uniqueOnly()
  tierOn.unique = true; tierOn.repeated = tierOn.mass = !to
  layers.set('custom:builder', true); layers.set('custom:statue', !to); layers.set('custom:fountain', !to)
  hiddenBuilders.clear(); buildBuilders(); buildLayers(); redraw(); toast(to ? 'unique builders only' : 'all custom builds')
}

function buildBuilders(filter = ''): void {
  const list = [...builderCount].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  const tierN = { unique: 0, repeated: 0, mass: 0 }
  for (const [, n] of list) tierN[n >= BUILDER_MASS ? 'mass' : n > 1 ? 'repeated' : 'unique'] += n
  const f = filter.toLowerCase()
  const rows = list.filter(([k]) => !f || k.toLowerCase().includes(f) || data.custom.some((c) => builderOf(c) === k && c.name.toLowerCase().includes(f)))
  const tierBox = (t: keyof typeof BUILDER_TIER, label: string): string => `<label class="lay"><input type="checkbox" data-tier="${t}" ${tierOn[t] ? 'checked' : ''}><i style="background:${BUILDER_TIER[t].col}"></i>${label} <span class="muted">${tierN[t]} instances</span></label>`
  $('p-builders').innerHTML = `<div class="muted">${list.length} builders, ${data.custom.filter((c) => c.kind === 'builder').length} instances in this city</div>`
    + `<div class="bar"><button id="uonly" class="${uniqueOnly() ? 'on' : ''}" title="u">unique builders only</button><span class="muted">our most expensive, most error-prone assets</span></div>`
    + tierBox('unique', 'unique (used once)') + tierBox('repeated', `repeated (2–${BUILDER_MASS - 1})`) + tierBox('mass', `mass (${BUILDER_MASS}+)`)
    + `<div class="bar"><input id="bfilter" type="text" placeholder="filter builders or names" value="${filter.replace(/"/g, '&quot;')}"> <a href="#" id="ball">all</a>/<a href="#" id="bnone">none</a></div>`
    + rows.slice(0, 1500).map(([k, n]) => `<details><summary><input type="checkbox" data-b="${k}" ${hiddenBuilders.has(k) ? '' : 'checked'}> <i style="display:inline-block;width:9px;height:9px;background:${BUILDER_TIER[n >= BUILDER_MASS ? 'mass' : n > 1 ? 'repeated' : 'unique'].col}"></i> ${k} <b>×${n}</b> <a href="#" data-only="${k}">only</a></summary><div data-inst="${k}"></div></details>`).join('')
  const el = $('p-builders')
  const inp = $<HTMLInputElement>('bfilter')
  $('uonly').onclick = () => toggleUnique()
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') buildBuilders(inp.value) })
  el.querySelectorAll<HTMLInputElement>('[data-tier]').forEach((i) => i.addEventListener('change', () => { tierOn[i.dataset.tier as keyof typeof tierOn] = i.checked; redraw() }))
  el.querySelectorAll<HTMLInputElement>('[data-b]').forEach((i) => {
    i.addEventListener('click', (e) => e.stopPropagation())
    i.addEventListener('change', () => { i.checked ? hiddenBuilders.delete(i.dataset.b!) : hiddenBuilders.add(i.dataset.b!); redraw() })
  })
  $('ball').onclick = (e) => { e.preventDefault(); hiddenBuilders.clear(); buildBuilders(inp.value); redraw() }
  $('bnone').onclick = (e) => { e.preventDefault(); for (const [k] of list) hiddenBuilders.add(k); buildBuilders(inp.value); redraw() }
  el.querySelectorAll<HTMLElement>('[data-only]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation()
    hiddenBuilders.clear(); for (const [k] of list) if (k !== a.dataset.only) hiddenBuilders.add(k)
    tierOn.unique = tierOn.repeated = tierOn.mass = true; layers.set('custom:builder', true)
    buildBuilders(inp.value); redraw()
    const pts = data.custom.filter((c) => builderOf(c) === a.dataset.only).flatMap((c) => [c.x, c.z])
    if (pts.length > 2) fit(pts); else if (pts.length) goTo(pts[0], pts[1], Math.max(cam.s, 2))
  }))
  // instances, filled when a builder is opened
  el.querySelectorAll<HTMLDetailsElement>('details').forEach((d) => d.addEventListener('toggle', () => {
    const box = d.querySelector<HTMLElement>('[data-inst]')!
    if (!d.open || box.childElementCount) return
    const inst = data.custom.filter((c) => builderOf(c) === box.dataset.inst)
    box.innerHTML = inst.slice(0, 500).map((c) => `<div class="hit kv" data-go="${c.x},${c.z}">${c.name.replace(/</g, '&lt;')} <span class="muted">${c.src}${c.entry.madeBy ? ' · ' + c.entry.madeBy : ''}</span></div>`).join('') + (inst.length > 500 ? `<div class="muted">…${inst.length - 500} more</div>` : '')
    bindGo(box)
  }))
}

/** the issues tab: per-kind counts with toggles, then every issue nearest the view first */
function buildIssues(): void {
  const cnt = data.meta.issueCount ?? {}, kinds = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])
  const el = $('p-issues')
  if (!data.meta.issueCount) { el.innerHTML = `<div class="warn">prepped before the issue checks: re-run npm run devmaps:prep -- --city=${data.id}</div>`; return }
  const shown = data.issues.filter((q) => on('issue:' + q.k))
  shown.sort((a, b) => Math.hypot(a.x - cam.cx, a.z - cam.cz) - Math.hypot(b.x - cam.cx, b.z - cam.cz))
  const tol = data.meta.issueTol ?? {}
  el.innerHTML = `<div class="bar"><label><input type="checkbox" data-l="issues" ${on('issues') ? 'checked' : ''}> show on map</label> <button id="issref" title="re-sort by distance from the view">nearest the view</button></div>`
    + kinds.map((k) => `<label class="lay"><input type="checkbox" data-l="issue:${k}" ${on('issue:' + k) ? 'checked' : ''}><i style="background:${issueCol(k)}"></i>${k} <b>${cnt[k]}</b>${cnt[k] > (tol.ISSUE_CAP ?? Infinity) ? ` <span class="muted">(first ${tol.ISSUE_CAP} kept)</span>` : ''}</label>`).join('')
    + (kinds.length ? '' : '<div class="muted">no issues found</div>')
    + `<details><summary>what the checks are</summary>${Object.entries(issueHelp).map(([k, v]) => `<div><b>${k}</b>: ${v}</div>`).join('')}<div class="muted">tunables (tools/devmaps-prep.ts): ${Object.entries(tol).map(([k, v]) => `${k} ${v}`).join(', ')}</div></details>`
    + `<div class="muted">${shown.length} shown, nearest the view first</div>`
    + shown.slice(0, 600).map((q) => `<div class="hit" data-iss="${data.issues.indexOf(q)}"><i style="display:inline-block;width:9px;height:9px;background:${issueCol(q.k)}"></i> ${q.m.replace(/</g, '&lt;')} <span class="muted">${Math.hypot(q.x - cam.cx, q.z - cam.cz).toFixed(0)} m</span></div>`).join('')
  el.querySelectorAll<HTMLInputElement>('[data-l]').forEach((i) => i.addEventListener('change', () => { layers.set(i.dataset.l!, i.checked); redraw(); if (i.dataset.l !== 'issues') buildIssues() }))
  $('issref').onclick = buildIssues
  el.querySelectorAll<HTMLElement>('[data-iss]').forEach((d) => d.addEventListener('click', () => {
    const q = data.issues[Number(d.dataset.iss)]
    layers.set('issues', true); goTo(q.x, q.z, Math.max(cam.s, 4))
    void inspect({ type: 'issue', label: q.k, d: 0, geom: { pt: [q.x, q.z] }, obj: q })
  }))
}

function buildTours(): void {
  const m = data.meta
  $('p-tours').innerHTML = m.tours.length ? m.tours.map((t, ti) => `<details><summary><input type="checkbox" data-t="${t.id}" ${tourOn.has(t.id) ? 'checked' : ''}> <span style="color:${TOUR_COL[ti % TOUR_COL.length]}">■</span> ${t.name} <span class="muted">${t.legs.reduce((a, l) => a + Math.max(0, l.km), 0).toFixed(1)} km${t.partial ? ' (partly on this city)' : ''}</span> <a href="#" data-fit="${t.id}">fit</a></summary>`
    + `<div class="muted">${t.blurb ?? ''}</div>${t.stops.map((s, i) => `<div class="hit" data-go="${s.x},${s.z}">${i + 1}. ${s.name ?? '<span class="muted">(unannounced)</span>'} <span class="muted">${s.lat},${s.lon}${i ? ` · leg ${t.legs[i - 1].km < 0 ? (s.off || t.stops[i - 1].off ? 'off this city' : '<span class="warn">NO ROUTE</span>') : t.legs[i - 1].km + ' km'}` : ''}</span></div>`).join('')}</details>`).join('')
    : '<div class="muted">no tour has all its stops on this city\'s ride graph</div>'
  const el = $('p-tours')
  el.querySelectorAll<HTMLInputElement>('[data-t]').forEach((i) => i.addEventListener('change', () => { i.checked ? tourOn.add(i.dataset.t!) : tourOn.delete(i.dataset.t!); redraw() }))
  el.querySelectorAll<HTMLElement>('[data-fit]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault(); const t = m.tours.find((q) => q.id === a.dataset.fit)!; tourOn.add(t.id); buildTours()
    fit(t.legs.flatMap((l) => l.p).concat(t.stops.flatMap((s) => [s.x, s.z])))
  }))
  bindGo(el)
}

function buildInfo(): void {
  const m = data.meta, cx: Ctx = { data, what: 'index' }
  const bakeWarn = data.liveBake && m.index.bake && data.liveBake !== m.index.bake ? `<div class="warn">prep bake ${m.index.bake} ≠ tiles bake ${data.liveBake}: re-run npm run devmaps:prep -- --city=${data.id}</div>` : ''
  $('p-info').innerHTML = bakeWarn + `<div>prepped ${m.prepped}</div>`
    + `<details open><summary>detail squares (${(m.index.detail ?? []).length})</summary>${(m.index.detail ?? []).map((d) => `<div class="hit" data-fitring="${(d.rings?.flat() ?? d.line ?? []).join(',')}">${d.name} <span class="muted">margin ${d.margin}, ${d.rings ? d.rings.length + ' ring(s)' : 'corridor'}</span></div>`).join('')}</details>`
    + `<details><summary>street levels</summary>${LV_NAME.map((n, i) => `<div><i style="display:inline-block;width:10px;height:10px;background:${LV_COL[i]}"></i> ${n}: ${m.levelCount[i]} segments</div>`).join('')}<div class="muted">grade = |way z − ground| &lt; ${m.levelTol} m; dimmed = judged against the coarse ground (tile ships no fine ground)</div></details>`
    + `<details><summary>landmarks (${m.landmarks.length})</summary>${m.landmarks.map((l) => `<div class="hit" data-go="${l.x},${l.z}">${l.name} <span class="muted">${l.kind} t${l.tier ?? ''}</span></div>`).join('')}</details>`
    + `<details><summary>zones (${m.zones.length})</summary>${m.zones.map((z) => `<div class="hit" data-go="${z.ring[0]},${z.ring[1]}">${z.ref} <span class="muted">${Object.keys(z.props).join(' ')}</span></div>`).join('')}</details>`
    + `<details><summary>index</summary>${tree(m.index, cx)}</details>`
    + `<details><summary>legacy (index) records</summary>${tree(m.legacyCensus, cx)} quayWalls ${m.quayWalls}; garden ${JSON.stringify(m.garden)}</details>`
    + `<details><summary>dictionaries</summary>${tree({ ...m.dict, names: `[${m.dict.names.length} names]` }, cx)}</details>`
  bindGo($('p-info'))
  $('p-info').querySelectorAll<HTMLElement>('[data-fitring]').forEach((d) => d.addEventListener('click', () => fit(d.dataset.fitring!.split(',').map(Number))))
}

function fit(p: number[]): void {
  let a = Infinity, b = -Infinity, c = Infinity, d = -Infinity
  for (let i = 0; i < p.length; i += 2) { a = Math.min(a, p[i]); b = Math.max(b, p[i]); c = Math.min(c, p[i + 1]); d = Math.max(d, p[i + 1]) }
  if (!Number.isFinite(a)) return
  goTo((a + b) / 2, (c + d) / 2, Math.min(W() / (b - a + 1), H() / (d - c + 1)) * 0.9)
}

// ---------------------------------------------------------------- hash + city loading
let hashTimer = 0
function saveHash(): void {
  clearTimeout(hashTimer)
  hashTimer = window.setTimeout(() => { history.replaceState(null, '', hashNow()) }, 300)
}
const hashNow = (): string => {
  const q = data.proj.toLatLon({ x: cam.cx, z: cam.cz }), h = lastHit
  const sel = h && h.t && (h.i != null || h.type === 'tile') && SEL_COLL[h.type] !== undefined ? `&sel=${h.type}|${h.t}|${h.i ?? ''}` : ''
  return `#city=${data.id}&ll=${q.lat.toFixed(6)},${q.lon.toFixed(6)}&s=${cam.s.toFixed(4)}${sel}`
}
/** hit type → its chunk collection (for restoring a selection from the hash) */
const SEL_COLL: Record<string, keyof Chunk | null> = { way: 'streets', building: 'buildings', area: 'areas', deck: 'decks', place: 'places', boat: 'boats', court: 'courts', item: 'items', tile: null }
/** reopen `type|tile|index` from a link: wait for its chunk, rebuild the hit, inspect it */
async function restoreSel(sel: string): Promise<void> {
  const [type, t, si] = sel.split('|'), i = Number(si)
  if (!(type in SEL_COLL) || !t) return
  const T = data.meta.index.tile, [tx, ty] = t.split(',').map(Number)
  if (type === 'tile') { void inspect({ type, label: t, d: 0, t, geom: { rings: [[tx * T, ty * T, (tx + 1) * T, ty * T, (tx + 1) * T, (ty + 1) * T, tx * T, (ty + 1) * T]] }, obj: data.meta.tiles.find((q) => q.key === t) }); return }
  const C = data.meta.chunk, ck = `${Math.floor(tx / C)}_${Math.floor(ty / C)}`
  let c: Chunk | undefined
  for (let k = 0; k < 100 && !(c = data.chunk(ck)); k++) await new Promise((r) => setTimeout(r, 50))
  if (!c) return
  if (type === 'item') {
    const it = c.items.find((q) => q.t === t)
    if (it) void inspect({ type, label: data.meta.dict.items[it.d[3 * i + 2]], d: 0, t, i, geom: { pt: [it.d[3 * i], it.d[3 * i + 1]] } })
    return
  }
  const rec = (c[SEL_COLL[type]!] as unknown as { t: string; i: number; p?: number[]; rs?: number[][]; x?: number; z?: number }[]).find((q) => q.t === t && q.i === i)
  if (!rec) return
  const geom: Geom = type === 'way' ? { pts: rec.p } : rec.rs ? { rings: rec.rs } : rec.p ? { rings: [rec.p] } : { pt: [rec.x!, rec.z!] }
  void inspect({ type, label: `${type} ${t}|${i}`, d: 0, t, i, geom, obj: rec })
}
const hashParams = (): URLSearchParams => new URLSearchParams(location.hash.slice(1))

/** fit the city's detail regions (else its box) */
function loadView(): void {
  const rings = (data.meta.index.detail ?? []).flatMap((d) => d.rings?.flat() ?? d.line ?? [])
  const b = data.meta.index.box
  fit(rings.length ? rings : b ? [b.x0, b.z0, b.x1, b.z1] : [-1000, -1000, 1000, 1000])
}
async function loadCity(id: string, keepView = false): Promise<void> {
  const next = new CityData(id)
  next.onLoad = redraw
  await next.load()
  data = next
  fineCache.clear(); selected = null; osmOverlay = null; coarse = null; tourOn.clear(); measure.length = 0
  const t = data.meta.terrain
  if (t) fetch(`cities/${id}/v3/terrain.bin`).then((r) => r.arrayBuffer()).then((b) => { if (b.byteLength >= t.cols * t.rows * 2) coarse = new Int16Array(b, 0, t.cols * t.rows) }).catch(() => {})
  builderCount = new Map(); hiddenBuilders.clear()
  for (const c of data.custom) if (c.kind === 'builder') builderCount.set(builderOf(c), (builderCount.get(builderOf(c)) ?? 0) + 1)
  buildLayers(); buildTours(); buildInfo(); buildBuilders()
  $('p-find').innerHTML = ''; $('p-inspect').innerHTML = `<div class="muted">${id}: click the map.</div>`
  setTimeout(() => { if (data === next) void next.search() }, SEARCH_PREFETCH_MS) // warm the name index (Paris: ~28 MB)
  const hp = hashParams()
  issuesByTile = new Map()
  { const T = data.meta.index.tile; for (const q of data.issues) { const k = q.t ?? `${Math.floor(q.x / T)},${Math.floor(q.z / T)}`; issuesByTile.set(k, (issuesByTile.get(k) ?? 0) + 1) } }
  lastHit = null; buildIssues(); if (tileStat) setTileStat(tileStat)
  if (keepView && hp.get('ll')) {
    const [la, lo] = hp.get('ll')!.split(',').map(Number), p = data.proj.toLocal({ lat: la, lon: lo })
    goTo(p.x, p.z, Number(hp.get('s')) || 0.05)
    if (hp.get('sel')) void restoreSel(hp.get('sel')!)
  } else loadView()
  $<HTMLSelectElement>('city').value = id
  redraw()
}

// ---------------------------------------------------------------- input
function resize(): void {
  const r = canvas.getBoundingClientRect()
  canvas.width = r.width * devicePixelRatio; canvas.height = r.height * devicePixelRatio
  ctx.font = '11px ui-monospace, Menlo, monospace'; redraw()
}
let drag: { x: number; y: number; cx: number; cz: number; moved: boolean } | null = null
canvas.addEventListener('mousedown', (e) => { if (e.button === 0) drag = { x: e.offsetX, y: e.offsetY, cx: cam.cx, cz: cam.cz, moved: false } })
window.addEventListener('mouseup', (e) => {
  if (!data?.meta) { drag = null; return }
  if (drag && !drag.moved && e.target === canvas) {
    const x = wx(e.offsetX), z = wz(e.offsetY)
    if (measuring) { measure.push({ x, z }); redraw() } else { const h = hitTest(x, z); if (h.length === 1 || (h.length && h[0].d < 3 && h[0].type !== 'tile' && h.filter((q) => q.d < 3).length === 1)) void inspect(h[0]); else listHits(h) }
  }
  drag = null
})
canvas.addEventListener('mousemove', (e) => {
  if (!data?.meta) return
  mouse = { x: wx(e.offsetX), z: wz(e.offsetY), sx: e.offsetX, sy: e.offsetY }
  if (drag) {
    if (Math.abs(e.offsetX - drag.x) + Math.abs(e.offsetY - drag.y) > 3) drag.moved = true
    cam.cx = drag.cx - (e.offsetX - drag.x) / cam.s; cam.cz = drag.cz + (e.offsetY - drag.y) / cam.s; saveHash()
    redraw()
  } else if (measuring) redraw()
  else { status(); hover() }
})
let hoverAt = 0, hoverTimer = 0
/** the top hit under the cursor, in the status bar (throttled; skipped over big views) */
function hover(): void {
  clearTimeout(hoverTimer)
  const now = performance.now()
  if (now - hoverAt < HOVER_MS) { hoverTimer = window.setTimeout(hover, HOVER_MS); return }
  hoverAt = now
  if (viewChunks().length > HOVER_MAX_CHUNKS) { hoverText = ''; return }
  const h = hitTest(mouse.x, mouse.z).find((q) => q.type !== 'tile' && q.type !== 'zone' && q.type !== 'detail')
  const t = h ? `${h.type} · ${h.label}` : ''
  if (t !== hoverText) { hoverText = t; status() }
}
canvas.addEventListener('wheel', (e) => {
  e.preventDefault()
  const x = wx(e.offsetX), z = wz(e.offsetY), k = Math.exp(-e.deltaY * 0.0015)
  cam.s = Math.max(0.002, Math.min(200, cam.s * k))
  cam.cx = x - (e.offsetX - W() / 2) / cam.s; cam.cz = z + (e.offsetY - H() / 2) / cam.s
  redraw(); saveHash()
}, { passive: false })
canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); copy(llStr(wx(e.offsetX), wz(e.offsetY))) })
window.addEventListener('keydown', (e) => {
  if ((e.target as HTMLElement).tagName === 'INPUT') return
  if (e.key === 'm') toggleMeasure()
  if (e.key === 'u') toggleUnique()
  if (e.key === 'Escape') { measure.length = 0; measuring = false; $('measure').classList.remove('on'); selected = null; lastHit = null; $('help').style.display = 'none'; saveHash(); redraw() }
  if (e.key === 'c') copy(llStr(mouse.x, mouse.z))
  if (e.key === 'x') copy(`${mouse.x.toFixed(1)},${mouse.z.toFixed(1)}`)
  if (e.key === 'Enter' && measuring) toggleMeasure()
  if (e.key === '?') $('help').style.display = $('help').style.display === 'block' ? 'none' : 'block'
  if (e.key === 'f') loadView()
  if (e.key === 'l') { layers.set('labels', !on('labels')); buildLayers(); redraw() }
  if (e.key === 'i') { layers.set('issues', !on('issues')); buildIssues(); redraw(); toast(on('issues') ? 'issues shown' : 'issues hidden') }
  if (e.key === 's') { const sl = $<HTMLInputElement>('satop'); sl.value = Number(sl.value) > 0 ? '0' : '70'; layers.set('sat', true); redraw() }
  if (e.key === 'v') { const order = ['level', 'slope', 'dground', 'kind', 'role'] as const; colourMode = order[(order.indexOf(colourMode) + 1) % order.length]; buildLayers(); redraw(); toast('streets by ' + colourMode) }
  const pan: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }
  if (pan[e.key]) { e.preventDefault(); goTo(cam.cx + pan[e.key][0] * PAN_STEP * W() / cam.s, cam.cz + pan[e.key][1] * PAN_STEP * H() / cam.s) }
  if (e.key === '+' || e.key === '=') goTo(cam.cx, cam.cz, Math.min(200, cam.s * ZOOM_STEP))
  if (e.key === '-') goTo(cam.cx, cam.cz, Math.max(0.002, cam.s / ZOOM_STEP))
})
canvas.addEventListener('dblclick', (e) => { const x = wx(e.offsetX), z = wz(e.offsetY); cam.s = Math.min(200, cam.s * 4); cam.cx = x - (e.offsetX - W() / 2) / cam.s; cam.cz = z + (e.offsetY - H() / 2) / cam.s; redraw(); saveHash() })
$('help').onclick = () => ($('help').style.display = 'none')
const toggleMeasure = (): void => { measuring = !measuring; if (measuring) measure.length = 0; else if (measure.length > 1) measureProfile(); $('measure').classList.toggle('on', measuring); redraw() }
/** the ground along the finished measure line (fine ground where its tiles are loaded, else coarse) */
function measureProfile(): void {
  const p = measure.flatMap((q) => [q.x, q.z]), d = along(p), L = d[d.length - 1]
  const step = Math.max(0.5, L / PROFILE_SAMPLES), pts: number[] = [], dist: number[] = []
  for (let i = 2; i < p.length; i += 2) {
    const seg = d[i / 2] - d[i / 2 - 1], n = Math.max(1, Math.ceil(seg / step))
    for (let k = i === 2 ? 0 : 1; k <= n; k++) { const u = k / n; pts.push(p[i - 2] + (p[i] - p[i - 2]) * u, p[i - 1] + (p[i + 1] - p[i - 1]) * u); dist.push(d[i / 2 - 1] + seg * u) }
  }
  const legs = measure.slice(1).map((q, i) => `${i + 1}: ${fmt(d[i + 1] - d[i], 1)} m`).join(' · ')
  $('p-inspect').innerHTML = `<div><b>measure</b> ${fmt(L, 1)} m in ${measure.length - 1} legs <a href="#" data-copy="${measure.map((q) => llStr(q.x, q.z)).join(' ')}">copy points (lat,lon)</a></div><div class="muted">${legs}</div>`
    + profileSvg(dist, [{ v: groundLine(pts), col: '#7c7', label: 'ground' }])
  showPane('inspect')
}
$('measure').onclick = toggleMeasure
$('gobtn').onclick = () => parseGoto($<HTMLInputElement>('goto').value)
$<HTMLInputElement>('goto').addEventListener('keydown', (e) => { if (e.key === 'Enter') parseGoto((e.target as HTMLInputElement).value) })
$('osmload').onclick = () => { const v = prompt('OSM id: way 123 | node 123 | relation 123', 'way '); if (v) parseGoto(v) }
$('gmaps').onclick = () => window.open(gmaps(cam.cx, cam.cz), '_blank')
$('osmsite').onclick = () => window.open(osmSite(cam.cx, cam.cz), '_blank')
$('copyll').onclick = () => copy(llStr(cam.cx, cam.cz))
$('satop').oninput = () => { layers.set('sat', true); redraw() }
$('dataop').oninput = redraw
document.querySelectorAll<HTMLElement>('.tabs button').forEach((b) => (b.onclick = () => showPane(b.dataset.p!)))
document.addEventListener('click', (e) => {
  // every external link opens a new tab (a target=_blank link can navigate the app's browser pane in place)
  const ext = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[target=_blank]')
  if (ext) { e.preventDefault(); window.open(ext.href, '_blank', 'noopener'); return }
  const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')
  if (act) {
    e.preventDefault()
    if (act.dataset.act === 'json') { void navigator.clipboard.writeText(JSON.stringify(lastRaw, null, 1)); toast('copied JSON') }
    else { clearTimeout(hashTimer); history.replaceState(null, '', hashNow()); copy(location.href) }
    return
  }
  const a = (e.target as HTMLElement).closest<HTMLElement>('[data-copy],[data-ll]')
  if (a) { e.preventDefault(); copy(a.dataset.copy ?? a.dataset.ll!) }
})
window.addEventListener('resize', resize)
// a pasted #city=…&ll=…&s=… link: go there (our own replaceState fires no hashchange)
window.addEventListener('hashchange', () => {
  const hp = hashParams(), id = hp.get('city')
  if (id && id !== data?.id) { void loadCity(id, true); return }
  const ll = hp.get('ll')
  if (ll) { const [la, lo] = ll.split(',').map(Number), p = data.proj.toLocal({ lat: la, lon: lo }); goTo(p.x, p.z, Number(hp.get('s')) || cam.s) }
  if (hp.get('sel')) void restoreSel(hp.get('sel')!)
})

const frame = (): void => { if (dirty && data?.meta) render(); requestAnimationFrame(frame) }

async function main(): Promise<void> {
  const list = await (await fetch('devmaps/cities.json')).json() as { id: string; name: string }[]
  const sel = $<HTMLSelectElement>('city')
  sel.innerHTML = list.map((c) => `<option value="${c.id}">${c.id}</option>`).join('')
  sel.onchange = () => { history.replaceState(null, '', `#city=${sel.value}`); void loadCity(sel.value) }
  resize()
  const want = hashParams().get('city') ?? list[0]?.id
  if (want) await loadCity(want, true)
  requestAnimationFrame(frame)
}
void main()
