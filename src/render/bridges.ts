/**
 * Bridges, overpasses and the ramps up to them, as solid structures (IMPROVEMENTS §2.4).
 *
 * The ground is painted in layers with depth cleared between them (city.ts), which is right for a surface
 * and wrong for anything with a road underneath it: a painted deck cannot let a street pass under it. So a
 * raised edge — a bridge, or a ramp the bake lifted onto one (tools/bridges.ts) — is left out of every
 * painted layer and built here instead, at its own heights, in the building group where it writes depth:
 *
 *        parapet ▐▌                              ▐▌ parapet (bridges only)
 *        pavement ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ +0.15
 *                     carriageway
 *        slab     ███████████████████████████████████ 0.9 m deep
 *                         ▐█▌ pier every 25 m, down to the ground (bridges)
 *                   or a retaining wall down to the ground on each side (ramps)
 *
 * Never draped: the deck's heights are its own. Elevated rails (the Loop's L) are the same idea with a
 * 0.6 m deck and steel bents — two columns and a cross beam — every 15 m.
 */
import { MeshBuilder } from './buildings.ts'
import { box, prism } from './models.ts'
import type { Terrain } from '../city/terrain.ts'
import { isRaised, unpackPoints, type PackedEdge, type PackedRail } from '../city/package.ts'
import { inOutline } from './bridge-structures.ts'

type Rgb = [number, number, number]
const FIXED = 0
const ASPHALT: Rgb = [0.2, 0.2, 0.21]
const PAVING: Rgb = [0.6, 0.58, 0.54]
const STONE: Rgb = [0.72, 0.68, 0.6]
const UNDER: Rgb = [0.36, 0.35, 0.33]

interface Frame { x: number; z: number; y: number; nx: number; nz: number; s: number }

/** Per-vertex frames along a polyline with heights: position, height, and a mitred sideways normal. */
function frames(pts: { x: number; z: number }[], hs: number[]): Frame[] {
  const out: Frame[] = []
  let s = 0
  for (let i = 0; i < pts.length; i++) {
    if (i > 0) s += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)
    const a = pts[Math.max(0, i - 1)]
    const b = pts[Math.min(pts.length - 1, i + 1)]
    let dx = b.x - a.x
    let dz = b.z - a.z
    const len = Math.hypot(dx, dz) || 1
    dx /= len
    dz /= len
    // right of the direction a→b is (dz, −dx)
    out.push({ x: pts[i].x, z: pts[i].z, y: hs[i], nx: dz, nz: -dx, s })
  }
  return out
}

/** A strip between two sideways offsets, at a height offset, facing up (or down, with `down`). */
function strip(out: MeshBuilder, f: Frame[], o0: number, o1: number, dy: number, tint: Rgb, down = false): void {
  for (let i = 1; i < f.length; i++) {
    const p = f[i - 1]
    const q = f[i]
    const c = (fr: Frame, o: number): [number, number, number] => [fr.x + fr.nx * o, fr.y + dy, fr.z + fr.nz * o]
    const quad: [number, number, number][] = [c(p, o0), c(p, o1), c(q, o1), c(q, o0)]
    if (down) quad.reverse()
    out.quad(quad, [0, down ? -1 : 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], tint, FIXED)
  }
}

/** A vertical wall along an offset, from dy0 to dy1 relative to the deck (or down to the ground). */
function wall(out: MeshBuilder, f: Frame[], o: number, dy0: number, dy1: number, tint: Rgb, facing: 1 | -1,
              ground?: (x: number, z: number) => number): void {
  for (let i = 1; i < f.length; i++) {
    const p = f[i - 1]
    const q = f[i]
    const at = (fr: Frame, dy: number, toGround: boolean): [number, number, number] => {
      const x = fr.x + fr.nx * o
      const z = fr.z + fr.nz * o
      // (down to the ground — never UP to it: on a hillside the ground on the uphill side of a ramp is above its
      // edge, and the "wall" stood up from the road as a row of stone fins, the zigzag along every hillside ramp)
      return [x, toGround && ground ? Math.min(ground(x, z) - 0.3, fr.y + dy1) : fr.y + dy, z]
    }
    const lo = ground !== undefined
    const quad: [number, number, number][] = [at(p, dy0, lo), at(q, dy0, lo), at(q, dy1, false), at(p, dy1, false)]
    if (facing < 0) quad.reverse()
    out.quad(quad, [p.nx * facing, 0, p.nz * facing], [[0, 0], [1, 0], [1, 1], [0, 1]], tint, FIXED)
  }
}

/** A grassed embankment along an offset: from the deck's edge `top` above it, out and down to the ground at 1 in 2. */
const TURF: Rgb = [0.2, 0.29, 0.15]
function bank(out: MeshBuilder, f: Frame[], o: number, top: number, side: 1 | -1, ground: (x: number, z: number) => number): void {
  const at = (fr: Frame): { top: [number, number, number]; foot: [number, number, number] } => {
    const x = fr.x + fr.nx * o, z = fr.z + fr.nz * o
    const run = Math.max(0.5, 2 * (fr.y + top - ground(x, z)))
    const fx = x + fr.nx * side * run, fz = z + fr.nz * side * run
    return { top: [x, fr.y + top, z], foot: [fx, ground(fx, fz) - 0.15, fz] }
  }
  for (let i = 1; i < f.length; i++) {
    const p = at(f[i - 1]), q = at(f[i])
    const n: [number, number, number] = [f[i - 1].nx * side * 0.45, 0.9, f[i - 1].nz * side * 0.45]
    const quad: [number, number, number][] = [p.foot, q.foot, q.top, p.top]
    out.quad(side > 0 ? quad : [...quad].reverse(), n, [[0, 0], [1, 0], [1, 1], [0, 1]], TURF, FIXED)
    out.quad(side > 0 ? [...quad].reverse() : quad, n, [[0, 0], [1, 0], [1, 1], [0, 1]], TURF, FIXED)
  }
}

/** Is this edge a structure rather than a painted surface? A bridge, or lifted clear of the ground. */
export { isRaised }

const FREEWAY = new Set(['motorway', 'motorway_link'])

/**
 * A ramp that stands well clear of the ground is a viaduct, not an embankment: the freeway ramps on Yerba Buena and
 * Rincon Hill are 9 m and more up, and drawn as embankments their retaining walls were stone fins down to the
 * ground, through the roadways under them (2026-09-30). This far up anywhere along it, it is drawn as a bridge.
 */
const EMBANKMENT = 3.5
function standsClear(f: Frame[], ground: (x: number, z: number) => number): boolean {
  for (const fr of f) if (fr.y - ground(fr.x, fr.z) > EMBANKMENT) return true
  return false
}

/** One raised edge as a deck. `under(x, z, r, y)`: does a road pass within r of (x, z), below y? (for the piers) */
export function deck(out: MeshBuilder, e: PackedEdge, terrain: Terrain, walk = e.walk, drop = 0, structured = false,
                     hedged = false, under?: (x: number, z: number, r: number, y: number) => boolean,
                     beside?: (x: number, z: number, y: number) => boolean,
                     onOther?: (x: number, z: number, y: number) => boolean): void {
  const pts = unpackPoints(e.points)
  if (pts.length < 2 || !e.heights) return
  const f = frames(pts, e.heights)
  const road = e.foot ? 0 : e.width / 2
  // (a freeway has a shoulder, not a pavement — whatever an older bake gave it)
  if (FREEWAY.has(e.kind)) walk = 0
  const outer = e.foot ? e.width / 2 : e.width / 2 + Math.max(0.6, walk)
  const ground = (x: number, z: number): number => terrain.heightAt(x, z)
  // the running surfaces, a hair above the heights so the rider's wheels are on them
  if (road > 0) {
    strip(out, f, -road, road, 0.02, ASPHALT)
    /*
     * Each pavement only where it is not lying on another raised road's carriageway (Mission Bay ride samples,
     * 2026-10-05: the 4th Street bridge is two raised ways, one each direction, that converge at both ends; each
     * one's pavement ran on across the other's roadway as a cream wedge across the lanes, 15 cm proud).
     */
    // (and not where the other carriageway lies just beyond it: the narrowing median between the two, where both
    //  inner pavements met in a cream triangle over the lanes)
    for (const side of [-1, 1] as const) {
      const mid = side * (road + outer) / 2
      const past = side * (outer + 2.5)
      const runs = onOther
        ? sampledRuns(f, (fr) => !onOther(fr.x + fr.nx * mid, fr.z + fr.nz * mid, fr.y) && !onOther(fr.x + fr.nx * past, fr.z + fr.nz * past, fr.y))
        : [f]
      for (const run of runs) strip(out, run, side < 0 ? -outer : road, side < 0 ? -road : outer, 0.15, PAVING)
    }
    // the kerb faces
    wall(out, f, -road, 0.02, 0.15, PAVING, 1)
    wall(out, f, road, 0.02, 0.15, PAVING, -1)
  } else {
    strip(out, f, -outer, outer, 0.05, PAVING)
  }
  const top = road > 0 ? 0.15 : 0.05
  // a planted walk on a viaduct (the Coulée Verte, BUGS.md #32): clipped hedges along both edges, with a
  // taller shrub every few metres
  if (hedged) {
    const green: Rgb = [0.22, 0.36, 0.2]
    const dark: Rgb = [0.16, 0.28, 0.15]
    for (const side of [-1, 1] as const) {
      const o0 = side * outer
      const o1 = side * (outer + 0.7)
      wall(out, f, o0, top, top + 0.85, green, side === -1 ? 1 : -1)
      wall(out, f, o1, top, top + 0.85, dark, side)
      strip(out, f, Math.min(o0, o1), Math.max(o0, o1), top + 0.85, green)
      const total = f[f.length - 1].s
      for (let s = 2 + (side > 0 ? 1.5 : 0); s < total - 1; s += 4.5) {
        const fr = frameAt(f, s)
        const c = { x: fr.x + fr.nx * side * (outer + 0.35), z: fr.z + fr.nz * side * (outer + 0.35) }
        box(out, c.x, fr.y + top + 1.3, c.z, 0.45, 0.5, 0.45, dark, FIXED)
      }
    }
  }
  // on a bridge with its own outline the structure is drawn once, whole (render/bridge-structures.ts)
  if (structured) return
  const style = e.bridge && e.name ? BRIDGE_STYLES[e.name] : undefined
  if (style) {
    // a named bridge in its own design: parapets as ever, and under the deck its arches (see `archSpans`)
    for (const side of [-1, 1] as const) {
      const o0 = side * outer
      const o1 = side * (outer + 0.3)
      const parapet = style.kind === 'steel' ? style.colour : STONE
      if (style.kind === 'steel') {
        // an openwork iron railing: a top rail and posts, not a stone wall
        wall(out, f, o1, top + 0.95, top + 1.1, parapet, side)
        strip(out, f, Math.min(o0, o1), Math.max(o0, o1), top + 1.1, parapet)
      } else {
        wall(out, f, o0, top, top + 1.1, parapet, side === -1 ? 1 : -1)
        wall(out, f, o1, top, top + 1.1, parapet, side)
        strip(out, f, Math.min(o0, o1), Math.max(o0, o1), top + 1.1, parapet)
      }
    }
    // down to the water, which lies `drop` below the ground the elevation data gives under the river
    archSpans(out, f, style, outer + 0.3, top, (x, z) => terrain.heightAt(x, z) - drop)
  } else if (e.bridge || standsClear(f, ground)) {
    // the slab's fascia and soffit
    wall(out, f, -outer - 0.3, -0.9, top, STONE, -1)
    wall(out, f, outer + 0.3, -0.9, top, STONE, 1)
    strip(out, f, -outer - 0.3, outer + 0.3, -0.9, UNDER, true)
    // the parapets: 0.3 m wide, 1.1 m above the pavement, with their tops — only along the stretches where that side
    // is OPEN (see `openRuns`)
    for (const side of [-1, 1] as const) {
      const o0 = side * outer
      const o1 = side * (outer + 0.3)
      for (const run of openRuns(f, side * (outer + 0.8), beside)) {
        wall(out, run, o0, top, top + 1.1, STONE, side === -1 ? 1 : -1)
        wall(out, run, o1, top, top + 1.1, STONE, side)
        strip(out, run, Math.min(o0, o1), Math.max(o0, o1), top + 1.1, STONE)
      }
    }
    // piers every 25 m, down to the ground or the river bed
    const total = f[f.length - 1].s
    for (let s = 12.5; s < total - 6; s += 25) {
      let k = 1
      while (k < f.length - 1 && f[k].s < s) k++
      const p = f[k - 1]
      const q = f[k]
      const t = (s - p.s) / Math.max(1e-6, q.s - p.s)
      const x = p.x + (q.x - p.x) * t
      const z = p.z + (q.z - p.z) * t
      const yTop = p.y + (q.y - p.y) * t - 0.9
      const yBot = ground(x, z) - 1 - drop
      if (yTop - yBot < 1.2) continue
      const w = Math.max(1.2, (outer * 2) / 3) / 2
      const heading = Math.atan2(p.nx, p.nz)
      // piers stand across the deck: long side along the deck's width
      if (!under?.(x, z, w, yTop)) { pier(out, x, z, yBot, yTop, 0.6, w, heading); continue }
      /*
       * …unless a road runs under it there (a deck over a deck: the Bay Bridge's upper roadway on Rincon Hill and
       * on Yerba Buena, whose wall piers stood across the lower one, 2026-09-30). Then a bent: a column under each
       * edge of the deck, where THAT is clear, and a beam across under it.
       */
      let stood = 0
      for (const side of [-1, 1]) {
        const cx = x + p.nx * side * (outer - 0.4)
        const cz = z + p.nz * side * (outer - 0.4)
        if (under(cx, cz, 0.7, yTop)) continue
        pier(out, cx, cz, ground(cx, cz) - 1 - drop, yTop, 0.7, 0.7, heading)
        stood++
      }
      if (stood > 0) pier(out, x, z, yTop - 1.1, yTop, 0.7, outer, heading)
    }
  } else {
    /*
     * A ramp on an embankment: retaining walls from the deck edge down to the ground. Where an END stands clear of the
     * ground beyond it — the abutment, where the ramp meets its bridge over a road — the fill stops square there
     * (city/grade.ts), so the side walls are taken down only to the fill (sampled 1.5 m back from the end: at the end
     * itself they dropped to the road below, a hanging triangular fin each side), and the drop is closed by a
     * vertical abutment face across the end (Lincoln Blvd under the Presidio Parkway, 2026-10-03).
     */
    const ends = [{ at: f[0], next: f[Math.min(1, f.length - 1)] }, { at: f[f.length - 1], next: f[Math.max(0, f.length - 2)] }]
      .map(({ at, next }) => {
        const l = Math.hypot(next.x - at.x, next.z - at.z) || 1
        return { at, ix: (next.x - at.x) / l, iz: (next.z - at.z) / l }
      })
    const fill = (x: number, z: number): number => {
      for (const e of ends) {
        const along = (x - e.at.x) * e.ix + (z - e.at.z) * e.iz
        if (along < 1.5 && Math.hypot(x - e.at.x, z - e.at.z) < outer + 1) return ground(x + e.ix * (1.5 - along), z + e.iz * (1.5 - along))
      }
      return ground(x, z)
    }
    /*
     * …but in a PARK a grassed bank, sloping out about 1 in 2 to the ground (Golden Gate Park, 2026-10-05: Crossover
     * Drive's approaches to its bridge over Transverse Drive stood in the meadow as dark stone walls).
     */
    if (e.park) {
      for (const side of [-1, 1] as const) bank(out, f, side * outer, top, side, fill)
    } else {
      wall(out, f, -outer, 0, top, STONE, -1, fill)
      wall(out, f, outer, 0, top, STONE, 1, fill)
    }
    for (const e of ends) {
      const fr = e.at
      const corner = (side: number): [number, number] => [fr.x + fr.nx * side * outer, fr.z + fr.nz * side * outer]
      // the ground just beyond the end, under each corner
      const below = Math.min(...[-1, 1].map((side) => { const [x, z] = corner(side); return ground(x - e.ix * 0.6, z - e.iz * 0.6) }))
      if (fr.y - below < 1.2) continue
      const [ax, az] = corner(-1)
      const [bx, bz] = corner(1)
      const quad: [number, number, number][] = [[ax, below - 0.3, az], [bx, below - 0.3, bz], [bx, fr.y + top, bz], [ax, fr.y + top, az]]
      // facing out of the ramp, away from its fill
      const n: [number, number, number] = [-e.ix, 0, -e.iz]
      const cross = (bx - ax) * -e.iz - (bz - az) * -e.ix
      out.quad(cross > 0 ? quad : [...quad].reverse(), n, [[0, 0], [1, 0], [1, 1], [0, 1]], STONE, FIXED)
    }
  }
}

/** An upright box rotated to `heading`, from y0 to y1, half-extents hx (along heading) and hz (across). */
function pier(out: MeshBuilder, x: number, z: number, y0: number, y1: number, hx: number, hz: number, heading: number): void {
  const tmp = new MeshBuilder()
  box(tmp, 0, (y0 + y1) / 2, 0, hx, (y1 - y0) / 2, hz, UNDER, FIXED)
  const c = Math.cos(heading)
  const s = Math.sin(heading)
  const base = out.positions.length / 3
  for (let i = 0; i < tmp.positions.length; i += 3) {
    const px = tmp.positions[i]
    const pz = tmp.positions[i + 2]
    out.positions.push(x + px * c + pz * s, tmp.positions[i + 1], z - px * s + pz * c)
    const nx = tmp.normals[i]
    const nz = tmp.normals[i + 2]
    out.normals.push(nx * c + nz * s, tmp.normals[i + 1], -nx * s + nz * c)
  }
  out.uvs.push(...tmp.uvs)
  out.colors.push(...tmp.colors)
  for (const idx of tmp.indices) out.indices.push(base + idx)
}

/** An elevated railway: a 0.6 m deck under the track, and a steel bent every 15 m. */
/**
 * `rect`: only the spans whose middle is in it — a tile's share. A viaduct is kilometres long (Line 6 runs
 * 2.4 km over the Boulevard de Grenelle) and drawn whole by the tile of its first point it was off the screen
 * wherever that tile was not built (BUGS.md #34).
 */
export function railDeck(out: MeshBuilder, r: PackedRail, terrain: Terrain, colour: Rgb,
                         rect?: { x0: number; z0: number; x1: number; z1: number },
                         paris?: { stations: { x: number; z: number }[]; leaps?: { x: number; z: number }[][] }): void {
  const pts = unpackPoints(r.points)
  if (pts.length < 2 || !r.heights) return
  const f = frames(pts, r.heights)
  // (a station's platforms and canopy are the métro's: a main line's deck passing within 40 m of one is not at it)
  if (paris) { parisViaduct(out, f, terrain, colour, rect, r.kind === 'subway' ? paris.stations : [], paris.leaps); return }
  const half = 2.2
  const mine = (x: number, z: number): boolean => !rect || (x >= rect.x0 && x < rect.x1 && z >= rect.z0 && z < rect.z1)
  // the runs of consecutive segments in the rect
  for (let i = 1; i < f.length;) {
    if (!mine((f[i - 1].x + f[i].x) / 2, (f[i - 1].z + f[i].z) / 2)) { i++; continue }
    const i0 = i - 1
    while (i < f.length && mine((f[i - 1].x + f[i].x) / 2, (f[i - 1].z + f[i].z) / 2)) i++
    const run = f.slice(i0, i)
    strip(out, run, -half, half, 0, [colour[0] * 1.3, colour[1] * 1.3, colour[2] * 1.3])
    wall(out, run, -half, -0.6, 0, colour, -1)
    wall(out, run, half, -0.6, 0, colour, 1)
    strip(out, run, -half, half, -0.6, colour, true)
  }
  const total = f[f.length - 1].s
  for (let s = 7.5; s < total; s += 15) {
    let k = 1
    while (k < f.length - 1 && f[k].s < s) k++
    const p = f[k - 1]
    const q = f[k]
    const t = (s - p.s) / Math.max(1e-6, q.s - p.s)
    const x = p.x + (q.x - p.x) * t
    const z = p.z + (q.z - p.z) * t
    const y = p.y + (q.y - p.y) * t - 0.6
    if (!mine(x, z)) continue
    for (const side of [-1, 1]) {
      const cx = x + p.nx * side * (half + 0.3)
      const cz = z + p.nz * side * (half + 0.3)
      const g = terrain.heightAt(cx, cz)
      if (y - g < 1) continue
      pier(out, cx, cz, g, y, 0.2, 0.2, 0)
    }
    // the cross beam
    pier(out, x, z, y - 0.5, y, 0.25, half + 0.5, Math.atan2(p.nx, p.nz))
  }
}

/**
 * The Seine's bridges, each drawn as itself (PLAN item P). OSM names them; the generic deck — a slab on square
 * piers — made Pont Marie, a hump of five round stone arches from 1635, look like a motorway flyover.
 *   stone: `arches` round arches of pale limestone between piers with pointed cutwaters, a lighter voussoir
 *          ring round each arch, the spandrel walls filled to the parapet; `niches` puts the empty statue
 *          niches in the piers (Pont Marie's).
 *   steel: a footbridge on two shallow iron arch ribs with posts up to the deck (Pont Saint-Louis).
 */
export interface BridgeStyle {
  kind: 'stone' | 'steel'
  arches: number
  /** how high each arch rises, as a share of its half-span: 1 is a semicircle */
  rise: number
  niches?: boolean
  colour: Rgb
}

export const BRIDGE_STYLES: Record<string, BridgeStyle> = {
  'Pont Marie': { kind: 'stone', arches: 5, rise: 0.85, niches: true, colour: [0.78, 0.73, 0.63] },
  'Pont Louis-Philippe': { kind: 'stone', arches: 3, rise: 0.55, colour: [0.8, 0.76, 0.67] },
  'Pont Saint-Louis': { kind: 'steel', arches: 1, rise: 1, colour: [0.24, 0.29, 0.28] },
}

/** A frame interpolated at distance `s` along the deck. */
/**
 * The stretches of one side of a deck that are OPEN — no other raised walk alongside at about the same height — as
 * runs of frames every 2 m. Embarcadero Center's podium walks are mapped as several pedestrian ways side by side and
 * crossing, each drawn as its own deck, and every one's parapets ran straight across its neighbours' walking surface:
 * low concrete walls across the way, the rider riding through them (owner, 2026-10-03: "walls block the way").
 * Without a `beside` test every side is open, as before.
 */
/** The stretches of `f`, resampled every 2 m or so, where `open` holds at each sample. */
function sampledRuns(f: Frame[], open: (fr: Frame) => boolean): Frame[][] {
  const total = f[f.length - 1].s
  const runs: Frame[][] = []
  let cur: Frame[] = []
  const n = Math.max(1, Math.ceil(total / 2))
  for (let i = 0; i <= n; i++) {
    const fr = frameAt(f, (total * i) / n)
    if (open(fr)) cur.push(fr)
    else { if (cur.length >= 2) runs.push(cur); cur = [] }
  }
  if (cur.length >= 2) runs.push(cur)
  return runs
}

function openRuns(f: Frame[], offset: number, beside?: (x: number, z: number, y: number) => boolean): Frame[][] {
  if (!beside) return [f]
  return sampledRuns(f, (fr) => !beside(fr.x + fr.nx * offset, fr.z + fr.nz * offset, fr.y))
}

function frameAt(f: Frame[], s: number): Frame {
  let k = 1
  while (k < f.length - 1 && f[k].s < s) k++
  const p = f[k - 1]
  const q = f[k]
  const t = Math.max(0, Math.min(1, (s - p.s) / Math.max(1e-6, q.s - p.s)))
  return { x: p.x + (q.x - p.x) * t, z: p.z + (q.z - p.z) * t, y: p.y + (q.y - p.y) * t, nx: p.nx, nz: p.nz, s }
}

function archSpans(out: MeshBuilder, f: Frame[], st: BridgeStyle, half: number, top: number,
                   ground: (x: number, z: number) => number): void {
  const L = f[f.length - 1].s
  if (L < 10) return
  // the water (or the quay) under the bridge: the lowest ground along it, and never less than 3 m of arch
  let low = Infinity
  for (let s = 0; s <= L; s += 2) {
    const fr = frameAt(f, s)
    low = Math.min(low, ground(fr.x, fr.z))
  }
  const at = (s: number, o: number, y: number): [number, number, number] => {
    const fr = frameAt(f, s)
    return [fr.x + fr.nx * o, y, fr.z + fr.nz * o]
  }
  const deckY = (s: number): number => frameAt(f, s).y + top

  if (st.kind === 'steel') {
    // two ribs, one under each edge: springing low at the abutments, meeting the deck at mid-span
    const c = st.colour
    let deckMin = Infinity
    for (let s = 0; s <= L; s += 2) deckMin = Math.min(deckMin, deckY(s))
    // springing just above the water: anything lower is hidden under the river's surface
    const spring = Math.max(low + 0.8, deckMin - 4)
    // the deck's own steel fascia, a dark plate under the walkway on each side
    for (const side of [-1, 1]) {
      const o = side * half
      for (let s = 0; s < L - 1e-6; s += 1.5) {
        const s1 = Math.min(L, s + 1.5)
        const q: [number, number, number][] = [at(s, o, deckY(s) - 0.9), at(s1, o, deckY(s1) - 0.9), at(s1, o, deckY(s1) - 0.05), at(s, o, deckY(s) - 0.05)]
        out.quad(q, [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
      }
    }
    for (const side of [-1, 1]) {
      const o = side * (half - 0.4)
      let prev: [number, number, number] | null = null
      for (let s = 0; s <= L + 1e-6; s += L / 24) {
        const d = deckY(s) - 0.9
        const y = spring + (d - spring) * Math.sin((Math.PI * s) / L)
        const p = at(s, o, y)
        if (prev) ribSeg(out, prev, p, 0.4, c)
        // posts from the rib up to the deck, every other step
        if (prev && Math.round(s / (L / 24)) % 2 === 0 && d - y > 0.4) ribSeg(out, p, at(s, o, d), 0.08, c)
        prev = p
      }
    }
    return
  }

  // stone: abutments of 6 m at each end, piers between the arches
  const n = st.arches
  const abut = Math.min(8, L * 0.08)
  const pier = Math.max(2.5, (L - 2 * abut) * 0.08)
  const span = (L - 2 * abut - (n - 1) * pier) / n
  if (span < 3) return
  const r = span / 2
  // the springing line: as low as the water allows, but the crown must stay under the deck
  const minDeck = Math.min(...Array.from({ length: 20 }, (_, i) => deckY(abut + ((L - 2 * abut) * i) / 19)))
  const spring = Math.max(low + 0.5, Math.min(low + 2.5, minDeck - 1.2 - r * st.rise))
  const arch = (k: number): { a: number; b: number } => {
    const a = abut + k * (span + pier)
    return { a, b: a + span }
  }
  /*
   * Each arch's own rise, kept under the deck above it: the springing is shared, but a humped deck is lower
   * over its end arches than over the middle, and an arch sized for the middle rose through the road at the
   * ends — the rider rode through the barrel of Pont Louis-Philippe's first arch (user report).
   */
  const riseOf: number[] = []
  for (let k = 0; k < n; k++) {
    const { a, b } = arch(k)
    let deckMin = Infinity
    for (let q = 0; q <= 12; q++) deckMin = Math.min(deckMin, deckY(a + ((b - a) * q) / 12))
    riseOf.push(Math.max(0.8, Math.min(r * st.rise, deckMin - 1.1 - spring)))
  }
  /** the underside of the stone at `s`: the intrados over an arch, the water elsewhere */
  const under = (s: number): number => {
    for (let k = 0; k < n; k++) {
      const { a, b } = arch(k)
      if (s > a && s < b) {
        const u = (s - (a + b) / 2) / r
        // and never closer than 0.6 m under the deck, whatever the arithmetic above says
        return Math.min(deckY(s) - 0.6, spring + riseOf[k] * Math.sqrt(Math.max(0, 1 - u * u)))
      }
    }
    return low - 0.5
  }
  const stone = st.colour
  const ring: Rgb = [Math.min(1, stone[0] * 1.08), Math.min(1, stone[1] * 1.08), Math.min(1, stone[2] * 1.08)]
  const step = 0.6
  for (const side of [-1, 1] as const) {
    const o = side * half
    // the spandrel wall, from the underside up to the deck's top, facing out
    for (let s = 0; s < L - 1e-6; s += step) {
      const s1 = Math.min(L, s + step)
      const q: [number, number, number][] = [at(s, o, under(s)), at(s1, o, under(s1)), at(s1, o, deckY(s1)), at(s, o, deckY(s))]
      if (side < 0) q.reverse()
      const fr = frameAt(f, s)
      out.quad(q, [fr.nx * side, 0, fr.nz * side], [[0, 0], [1, 0], [1, 1], [0, 1]], stone, FIXED)
      // the voussoir ring: a lighter band just proud of the wall, following each arch
      if (under(s) > low && under(s1) > low) {
        const b0 = under(s)
        const b1 = under(s1)
        const rq: [number, number, number][] = [at(s, o + side * 0.06, b0), at(s1, o + side * 0.06, b1), at(s1, o + side * 0.06, b1 + 0.7), at(s, o + side * 0.06, b0 + 0.7)]
        if (side < 0) rq.reverse()
        out.quad(rq, [fr.nx * side, 0, fr.nz * side], [[0, 0], [1, 0], [1, 1], [0, 1]], ring, FIXED)
      }
    }
  }
  // the barrel of each arch, across the bridge, facing down
  for (let k = 0; k < n; k++) {
    const { a, b } = arch(k)
    for (let s = a; s < b - 1e-6; s += step / 2) {
      const s1 = Math.min(b, s + step / 2)
      const q: [number, number, number][] = [at(s, -half, under(s)), at(s1, -half, under(s1)), at(s1, half, under(s1)), at(s, half, under(s))]
      out.quad(q, [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [stone[0] * 0.55, stone[1] * 0.55, stone[2] * 0.55], FIXED)
    }
  }
  // the piers' cutwaters: a pointed prow each side, from the water to the springing, and a niche above
  for (let k = 0; k < n - 1; k++) {
    const mid = arch(k).b + pier / 2
    for (const side of [-1, 1]) {
      const tip = at(mid, side * (half + pier * 0.9), 0)
      const l = at(mid - pier / 2, side * half, 0)
      const rr = at(mid + pier / 2, side * half, 0)
      const y0 = low - 0.5
      const y1 = spring + 0.4
      for (const [p, q] of [[l, tip], [tip, rr]] as const) {
        const quad: [number, number, number][] = [[p[0], y0, p[2]], [q[0], y0, q[2]], [q[0], y1, q[2]], [p[0], y1, p[2]]]
        const nx = (q[2] - p[2])
        const nz = -(q[0] - p[0])
        if (side < 0) quad.reverse()
        out.quad(quad, [nx * side, 0, nz * side], [[0, 0], [1, 0], [1, 1], [0, 1]], stone, FIXED)
      }
      // the cutwater's cap: a little pyramid to the wall
      // two sloping triangles from the prow's edges up to a point on the pier's face (degenerate quads)
      const apex: [number, number, number] = [(l[0] + rr[0]) / 2, y1 + pier * 0.6, (l[2] + rr[2]) / 2]
      const capC: Rgb = [stone[0] * 0.9, stone[1] * 0.9, stone[2] * 0.9]
      out.quad([[l[0], y1, l[2]], [tip[0], y1, tip[2]], apex, apex], [0, 0.6, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], capC, FIXED)
      out.quad([[tip[0], y1, tip[2]], [rr[0], y1, rr[2]], apex, apex], [0, 0.6, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], capC, FIXED)
      if (st.niches) {
        // an empty statue niche in the pier's face, above the cutwater
        const fr = frameAt(f, mid)
        const o = side * (half + 0.04)
        const w = pier * 0.22
        const ny0 = y1 + pier * 0.7
        const ny1 = Math.min(deckY(mid) - 1, ny0 + 2.6)
        if (ny1 - ny0 > 1) {
          const q: [number, number, number][] = [at(mid - w, o, ny0), at(mid + w, o, ny0), at(mid + w, o, ny1), at(mid - w, o, ny1)]
          if (side < 0) q.reverse()
          out.quad(q, [fr.nx * side, 0, fr.nz * side], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.32, 0.3, 0.27], FIXED)
        }
      }
    }
  }
}

/** A square iron member between two points (for the steel ribs and posts). */
function ribSeg(out: MeshBuilder, a: [number, number, number], b: [number, number, number], r: number, c: Rgb): void {
  const dx = b[0] - a[0]
  const dz = b[2] - a[2]
  const l = Math.hypot(dx, dz) || 1
  const sx = (-dz / l) * r
  const sz = (dx / l) * r
  const v = (p: [number, number, number], u: number, w: number): [number, number, number] => [p[0] + sx * u, p[1] + w * r, p[2] + sz * u]
  // top, bottom, and the two sides, each with its own normal so the sun shades the member
  const faces: [number, number, number, number, [number, number, number]][] = [
    [-1, 1, 1, 1, [0, 1, 0]], [1, -1, -1, -1, [0, -1, 0]],
    [-1, -1, -1, 1, [-sx / r, 0, -sz / r]], [1, 1, 1, -1, [sx / r, 0, sz / r]],
  ]
  for (const [u0, w0, u1, w1, n] of faces) {
    out.quad([v(a, u0, w0), v(b, u0, w0), v(b, u1, w1), v(a, u1, w1)], n, [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
  }
}

/**
 * The Paris Métro's viaduct (PARIS_EXPAND §5 C: Line 6 over the Boulevards de Grenelle and Garibaldi, Line 2
 * over La Chapelle): iron girders with an ARCHED lower edge between the supports, the supports pairs of
 * slender cast-iron columns with capitals — every fourth a stone pier — and at the stations a platform each
 * side under a long glass canopy. Only the spans whose middle is in `rect` (a tile's share).
 */
function parisViaduct(out: MeshBuilder, f: Frame[], terrain: Terrain, iron: Rgb,
                      rect: { x0: number; z0: number; x1: number; z1: number } | undefined, stations: { x: number; z: number }[], leaps: { x: number; z: number }[][] = []): void {
  const half = 2.3
  const mine = (x: number, z: number): boolean => !rect || (x >= rect.x0 && x < rect.x1 && z >= rect.z0 && z < rect.z1)
  const total = f[f.length - 1].s
  const SPAN = 20
  const light: Rgb = [iron[0] * 1.35, iron[1] * 1.35, iron[2] * 1.35]
  const stone: Rgb = [0.72, 0.68, 0.6]
  const at = (s: number): Frame => frameAt(f, s)
  // the deck: its top, and each side's girder plate from the rail down to an arch between the supports
  for (let s = 0; s < total - 1e-6; s += 1) {
    const s1 = Math.min(total, s + 1)
    const a = at(s)
    const b = at(s1)
    if (!mine((a.x + b.x) / 2, (a.z + b.z) / 2)) continue
    const depth = (q: number): number => {
      const u = ((q % SPAN) + SPAN) % SPAN / SPAN
      return 0.55 + 1.1 * Math.pow(Math.abs(u - 0.5) * 2, 2.2)
    }
    const P = (fr: Frame, o: number, dy: number): [number, number, number] => [fr.x + fr.nx * o, fr.y + dy, fr.z + fr.nz * o]
    out.quad([P(a, -half, 0), P(a, half, 0), P(b, half, 0), P(b, -half, 0)], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], light, FIXED)
    // the rails on it (2026-10-31: a deck was a bare iron trough, and the track stopped and started at every bridge on a main line). Standard gauge, one pair down the middle
    for (const g of [-0.72, 0.72]) out.quad([P(a, g - 0.05, 0.16), P(a, g + 0.05, 0.16), P(b, g + 0.05, 0.16), P(b, g - 0.05, 0.16)], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.62, 0.63, 0.64], FIXED)
    for (const side of [-1, 1]) {
      const o = side * half
      const q = [P(a, o, -depth(s)), P(b, o, -depth(s1)), P(b, o, 0.35), P(a, o, 0.35)]
      if (side < 0) q.reverse()
      out.quad(q as [number, number, number][], [a.nx * side, 0, a.nz * side], [[0, 0], [1, 0], [1, 1], [0, 1]], iron, FIXED)
    }
    out.quad([P(a, half, -0.5), P(a, -half, -0.5), P(b, -half, -0.5), P(b, half, -0.5)], [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [iron[0] * 0.7, iron[1] * 0.7, iron[2] * 0.7], FIXED)
  }
  // the supports
  let k = 0
  for (let s = SPAN; s < total - 2; s += SPAN, k++) {
    const fr = at(s)
    if (!mine(fr.x, fr.z)) continue
    // (no supports under a span a bow carries: the Viaduc d'Austerlitz, render/bridge-structures.ts `RAIL_ARCHES`)
    if (leaps.some((r) => inOutline(r, fr.x, fr.z, 2))) continue
    const heading = Math.atan2(fr.nx, fr.nz)
    if (k % 4 === 0) {
      const g = terrain.heightAt(fr.x, fr.z)
      // (a deck over a shallow hole in a main line's bank has no room for a pier)
      if (fr.y - g < 2) continue
      pier(out, fr.x, fr.z, g - 0.3, fr.y - 1.6, 0.9, half + 0.5, heading)
      box(out, fr.x, fr.y - 1.55, fr.z, 1.0, 0.12, 1.0, stone, FIXED)
      continue
    }
    for (const side of [-1, 1]) {
      const cx = fr.x + fr.nx * side * (half - 0.4)
      const cz = fr.z + fr.nz * side * (half - 0.4)
      const g = terrain.heightAt(cx, cz)
      if (fr.y - g < 2) continue
      prism(out, cx, cz, g, g + 0.5, 0.42, 8, iron, FIXED, 0.36)
      prism(out, cx, cz, g + 0.5, fr.y - 2.1, 0.24, 8, light, FIXED, 0.2)
      prism(out, cx, cz, fr.y - 2.1, fr.y - 1.6, 0.2, 8, iron, FIXED, 0.45)
    }
    pier(out, fr.x, fr.z, fr.y - 1.75, fr.y - 1.5, 0.25, half, heading)
  }
  // the stations: platforms either side and a long glass canopy over the tracks
  for (const st of stations) {
    // the nearest point of this viaduct to the station, within 40 m
    let best: { s: number; d: number } | null = null
    for (let s = 0; s <= total; s += 2) {
      const fr = at(s)
      const d = Math.hypot(fr.x - st.x, fr.z - st.z)
      if (!best || d < best.d) best = { s, d }
    }
    if (!best || best.d > 40) continue
    const glass: Rgb = [0.55, 0.66, 0.7]
    for (let s = Math.max(0, best.s - 36); s < Math.min(total, best.s + 36) - 1e-6; s += 2) {
      const s1 = Math.min(total, s + 2)
      const a = at(s)
      const b = at(s1)
      if (!mine((a.x + b.x) / 2, (a.z + b.z) / 2)) continue
      const P = (fr: Frame, o: number, dy: number): [number, number, number] => [fr.x + fr.nx * o, fr.y + dy, fr.z + fr.nz * o]
      for (const side of [-1, 1]) {
        // the platform, a step up from the rails, and its edge
        const o0 = side * half
        const o1 = side * (half + 2.8)
        const lo = Math.min(o0, o1)
        const hi = Math.max(o0, o1)
        out.quad([P(a, lo, 0.9), P(a, hi, 0.9), P(b, hi, 0.9), P(b, lo, 0.9)], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.62, 0.6, 0.56], FIXED)
        const q = [P(a, o1, -0.6), P(b, o1, -0.6), P(b, o1, 0.9), P(a, o1, 0.9)]
        if (side < 0) q.reverse()
        out.quad(q as [number, number, number][], [a.nx * side, 0, a.nz * side], [[0, 0], [1, 0], [1, 1], [0, 1]], iron, FIXED)
        // the canopy's columns every 6 m, at the platform's back
        if (Math.round(s) % 6 === 0) {
          const c = P(a, side * (half + 2.5), 0.9)
          box(out, c[0], c[1] + 1.9, c[2], 0.07, 1.9, 0.07, iron, FIXED)
        }
      }
      // the canopy: a shallow barrel of glass over the whole width, on iron ribs
      const W = half + 2.8
      const seg = 6
      for (let i = 0; i < seg; i++) {
        const t0 = i / seg
        const t1 = (i + 1) / seg
        const o0 = -W + 2 * W * t0
        const o1 = -W + 2 * W * t1
        const y0 = 4.7 + Math.sin(Math.PI * t0) * 1.2
        const y1 = 4.7 + Math.sin(Math.PI * t1) * 1.2
        out.quad([P(a, o0, y0), P(a, o1, y1), P(b, o1, y1), P(b, o0, y0)], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], glass, FIXED)
      }
    }
  }
}
