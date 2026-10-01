/**
 * PATHS THAT FLY: where the ride graph takes the rider through the air, or under the ground (the owner, 2026-09-30:
 * "the rider should have a simple way to get on and off both bridges in both directions without having to fly
 * through the air. we can look for paths that fly through the air (which are usually errors)").
 *
 * A rider is ON something where what the game DRAWS passes under the wheel at the rider's own height:
 *   - a street: the ground is levelled up to it across its width;
 *   - a bridge or a ramp: drawn as a deck its own width (render/bridges.ts) — unless a bridge MODEL has taken the
 *     way (its middle is inside the model's footprint, render/city.ts `coverRaised`), when only the stretch off
 *     the model's own roadway is;
 *   - a model's roadway (`DeckDecl.model`, src/city/bridge-decks.ts);
 *   - a bored tunnel.
 * Every ride edge is walked every few metres against that; a stretch with nothing under it within a metre of its
 * height is reported, with how far it is from the nearest thing that is there, and where (paste the lat, lon into
 * the game's go-to). This is arithmetic on the baked files, by the renderer's own rules — not a render.
 *
 *   npx vite-node tools/air-paths.ts -- [city=san-francisco] [--mode=bike|run] [--near=lat,lon,radius] [--top=40]
 *   (--loose: count a rider as carried if a way at their height is within 14 m — only the gross errors)
 *
 * The usual causes: a ride edge the ride graph INVENTED (a link across a split road, a roundabout spoke, a midline
 * between two carriageways) with heights from the wrong place; two ways at different levels joined as one; a way
 * whose heights were changed after the ride graph was built (rebuild it: `npm run bake -- <city> --rides`).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Projection } from '../src/city/geo.ts'
import { unpackPoints, type PackedEdge } from '../src/city/package.ts'
import { Terrain } from '../src/city/terrain.ts'
import { existsSync } from 'node:fs'
import { MeshBuilder } from '../src/render/buildings.ts'
import { PROCEDURAL } from '../src/render/landmarks/procedural.ts'
import { placement, toWorld } from '../src/city/bridge-decks.ts'
import { decksOf } from './deck-conform.ts'

const args = process.argv.slice(2)
const city = args.find((a) => !a.startsWith('--')) ?? 'san-francisco'
const opt = (k: string): string | undefined => args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1]
const mode = opt('mode') ?? 'bike'
const top = Number(opt('top') ?? 40)
const root = resolve(import.meta.dirname, '..', 'public', 'cities')
const pkg = JSON.parse(readFileSync(resolve(root, `${city}.json`), 'utf8')) as { origin: { lat: number; lon: number }; edges: PackedEdge[]; terrain: never }
const ride = JSON.parse(readFileSync(resolve(root, city, `ride-${mode}.json`), 'utf8')) as { edges: { id: number; a: number; b: number; name?: string; kind?: string; points: number[]; heights?: number[]; over: number[] }[] }
const proj = new Projection(pkg.origin)
const terrain = new Terrain(pkg.terrain)
const nearArg = opt('near')?.split(',').map(Number)
const nearAt = nearArg ? { ...proj.toLocal({ lat: nearArg[0], lon: nearArg[1] }), r: nearArg[2] ?? 1500 } : null

const strict = !args.includes('--loose')
const region = (pkg as unknown as { region?: string }).region ?? city
const decks = decksOf(region, pkg.origin)
/*
 * The models' footprints, as the renderer takes them: the box round each `coversRaised` model's whole mesh, placed
 * (render/landmarks.ts), with its band of heights. A raised way whose middle is in one is the model's to draw.
 */
const covers: { ring: { x: number; z: number }[]; y0: number; y1: number }[] = []
{
  const dir = resolve(root, '..', 'landmarks', region)
  const file = resolve(dir, 'bridges.json')
  if (existsSync(file)) for (const e of JSON.parse(readFileSync(file, 'utf8')) as { procedural?: string; coversRaised?: boolean; lat: number; lon: number; rotateDeg?: number; baseY?: number; scale?: number; size?: [number, number]; height?: number }[]) {
    const build = e.procedural ? PROCEDURAL[e.procedural] : undefined
    if (!build || !e.coversRaised) continue
    const mb = new MeshBuilder()
    build(mb, { hx: (e.size?.[0] ?? 20) / 2, hz: (e.size?.[1] ?? 20) / 2, height: e.height ?? 30 })
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (let i = 0; i < mb.positions.length; i += 3) {
      x0 = Math.min(x0, mb.positions[i]); x1 = Math.max(x1, mb.positions[i])
      y0 = Math.min(y0, mb.positions[i + 1]); y1 = Math.max(y1, mb.positions[i + 1])
      z0 = Math.min(z0, mb.positions[i + 2]); z1 = Math.max(z1, mb.positions[i + 2])
    }
    const pl = placement(e, proj)
    covers.push({ ring: [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => toWorld(pl, { x, z })), y0: pl.baseY + y0 * pl.scale, y1: pl.baseY + y1 * pl.scale })
  }
}
const inRing = (ring: { x: number; z: number }[], x: number, z: number): boolean => {
  let hit = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j]
    if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) hit = !hit
  }
  return hit
}
/** taken by a model (render/city.ts `takeEdge`): a raised way, its middle in a footprint, at a height in its band */
const taken = (e: PackedEdge): boolean => {
  if (!(e.bridge || e.ramp) || !e.heights) return false
  const mid = Math.floor(e.points.length / 4) * 2
  const my = e.heights[mid / 2]
  return covers.some((c) => inRing(c.ring, e.points[mid], e.points[mid + 1]) && my >= c.y0 - 3 && my <= c.y1 + 3)
}

/** how close in height a drawn way has to be for the rider to be on it */
const ON = 1.0
/** …and, with --loose, how far to the side a way is still "here" (a rider on the midline of a split road) */
const BESIDE = 14
const CELL = 25
interface Seg { ax: number; az: number; bx: number; bz: number; ha: number; hb: number; half: number; model: boolean }
const cells = new Map<string, Seg[]>()
for (const e of pkg.edges) {
  // what is drawn: everything but a tunnel nobody bored
  if (!e.heights || (e.tunnel && !e.bore)) continue
  const p = e.points
  // (a street's corridor is its carriageway and pavements; a deck the same, and its parapets)
  const half = (e.foot ? e.width / 2 : e.width / 2 + Math.max(e.walk ?? 0, 0.6)) + 0.4
  const model = taken(e)
  for (let i = 2; i < p.length; i += 2) {
    const s: Seg = { ax: p[i - 2], az: p[i - 1], bx: p[i], bz: p[i + 1], ha: e.heights[i / 2 - 1], hb: e.heights[i / 2], half, model }
    const x0 = Math.floor(Math.min(s.ax, s.bx) / CELL), x1 = Math.floor(Math.max(s.ax, s.bx) / CELL)
    const z0 = Math.floor(Math.min(s.az, s.bz) / CELL), z1 = Math.floor(Math.max(s.az, s.bz) / CELL)
    for (let gx = x0; gx <= x1; gx++) for (let gz = z0; gz <= z1; gz++) {
      const k = `${gx},${gz}`
      const l = cells.get(k)
      if (l) l.push(s); else cells.set(k, [s])
    }
  }
}
/** what is under (x, z) at height h: `on` — under the wheel; `beside` — within a few metres; else how far off in height */
function under(x: number, z: number, h: number): { on: boolean; beside: boolean; off: number } {
  // a model's own roadway
  if (decks.drawn(x, z, h)) return { on: true, beside: true, off: 0 }
  let on = false
  let beside = false
  let off = Infinity
  const gx = Math.floor(x / CELL), gz = Math.floor(z / CELL)
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (const s of cells.get(`${gx + dx},${gz + dz}`) ?? []) {
    const ux = s.bx - s.ax, uz = s.bz - s.az
    const t = Math.max(0, Math.min(1, ((x - s.ax) * ux + (z - s.az) * uz) / (ux * ux + uz * uz || 1e-9)))
    const qx = s.ax + ux * t, qz = s.az + uz * t
    const d = Math.hypot(qx - x, qz - z)
    if (d > BESIDE) continue
    // a way a model has taken is drawn only where it is off the model's roadway
    if (s.model && decks.drawn(qx, qz)) continue
    const dh = h - (s.ha + (s.hb - s.ha) * t)
    if (Math.abs(dh) <= ON) { if (d <= s.half) on = true; beside = true }
    if (Math.abs(dh) < Math.abs(off)) off = dh
  }
  return { on, beside, off }
}

interface Run { id: number; name: string; kind: string; invented: boolean; len: number; worst: number; at: { x: number; z: number }; ground: number }
const runs: Run[] = []
let walked = 0
const noHeights: number[] = []
for (const e of ride.edges) {
  const p = unpackPoints(e.points)
  if (nearAt && !p.some((q) => Math.hypot(q.x - nearAt.x, q.z - nearAt.z) < nearAt.r)) continue
  // a ride edge with no heights at all puts the rider at height 0 — 82 m in the air in San Francisco
  if (!e.heights || e.heights.length !== p.length) { noHeights.push(e.id); continue }
  let run: Run | null = null
  const close = (): void => { if (run && run.len >= 8) runs.push(run); run = null }
  for (let i = 1; i < p.length; i++) {
    const d = Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z)
    const n = Math.max(1, Math.ceil(d / 4))
    for (let k = 0; k < n; k++) {
      const t = k / n
      const x = p[i - 1].x + (p[i].x - p[i - 1].x) * t
      const z = p[i - 1].z + (p[i].z - p[i - 1].z) * t
      const h = e.heights[i - 1] + (e.heights[i] - e.heights[i - 1]) * t
      walked += d / n
      const u = under(x, z, h)
      if (strict ? u.on : u.beside) { close(); continue }
      // (the ground itself is always drawn: a rider on it is on something — a median, a plaza)
      if (Math.abs(h - terrain.rawHeightAt(x, z)) <= 1.5) { close(); continue }
      // nothing drawn at this height here: how far from the ground, or from whatever is drawn
      const g = terrain.rawHeightAt(x, z)
      const gap = Math.abs(u.off) < Math.abs(h - g) ? u.off : h - g
      if (!strict && Math.abs(gap) <= ON + 0.5) { close(); continue }
      if (!run) run = { id: e.id, name: e.name ?? '', kind: e.kind ?? '', invented: e.over.length === 0, len: 0, worst: 0, at: { x, z }, ground: h - g }
      run.len += d / n
      if (Math.abs(gap) > Math.abs(run.worst)) { run.worst = gap; run.at = { x, z }; run.ground = h - g }
    }
  }
  close()
}
if (noHeights.length) console.log(`  ${noHeights.length} ride edges have NO heights (the rider rides them at 0): ${noHeights.slice(0, 20).join(' ')}`)
runs.sort((a, b) => Math.abs(b.worst) * b.len - Math.abs(a.worst) * a.len)
const total = runs.reduce((s, r) => s + r.len, 0)
console.log(`${city} (${mode}): ${(walked / 1000).toFixed(0)} km of ride graph walked; ${runs.length} stretches with nothing drawn under them, ${(total / 1000).toFixed(2)} km in all`
  + ` (${runs.filter((r) => r.worst > 0).length} in the air, ${runs.filter((r) => r.worst < 0).length} under something)`)
for (const r of runs.slice(0, top)) {
  const ll = proj.toLatLon(r.at)
  console.log(`  ${String(r.id).padStart(7)} ${(r.name || r.kind).slice(0, 34).padEnd(34)} ${r.invented ? 'INVENTED' : '        '} ${r.len.toFixed(0).padStart(5)} m, `
    + `${r.worst > 0 ? '+' : ''}${r.worst.toFixed(1)} m from the nearest way (${r.ground > 0 ? '+' : ''}${r.ground.toFixed(1)} over the ground) at ${ll.lat.toFixed(6)}, ${ll.lon.toFixed(6)}`)
}
