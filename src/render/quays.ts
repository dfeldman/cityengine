/**
 * The Seine's quays: the low stone parapet along the river side of every quay street, and on the right-bank
 * quays that really have them (the Quai de l'Hôtel de Ville, the Quai des Célestins) the bouquinistes — the
 * booksellers' dark-green boxes, closed, sitting in a row on top of the parapet. With the plane trees they are
 * what a Paris quay IS; without them the river was a street with water beside it.
 *
 * The river side of a quay is found, not assumed: at every sample along the street, the side whose point a
 * few metres beyond the pavement lies in water. So a parapet follows the river round the Île Saint-Louis, and
 * stops where a bridge or a lower quay's ramp leaves the water's edge.
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import { cartoonMaterial } from './cartoon-material.ts'
import { unpackPoints, waterLevels, wholeWater, type CityPackage, type QuayWall } from '../city/package.ts'
import type { TileLayer } from './city.ts'
import { waterMaterial } from './water-material.ts'
import type { Terrain } from '../city/terrain.ts'
import type { Planting } from '../city/plantings.ts'

type Rgb = [number, number, number]
const FIXED = 0
const STONE: Rgb = [0.74, 0.7, 0.62]
const CAP: Rgb = [0.8, 0.77, 0.7]
const GREEN: Rgb = [0.13, 0.29, 0.2]
const BERGE_WALL: Rgb = [0.8, 0.77, 0.7]
const SETTS: Rgb = [0.56, 0.55, 0.53]
const ASHLAR = 1
const SETT = 22
const PAVE: Rgb = [0.4, 0.38, 0.35]
/*
 * The lower quays (the "ports", 4–6 m down by the water). The terrain gives a grass slope between the two levels where
 * Paris has a vertical dressed-stone wall, with the parapet and the booksellers on top of it. Stepping out from the quay
 * street: the slope's top is where the ground first falls BERGE_TOP_FALL below the street, its foot where it stops
 * falling (less than BERGE_FOOT_FLAT per metre) or reaches the water. A fall of BERGE_MIN_DROP or more becomes a wall at
 * the foot (less BERGE_WALL_INSET) under a paved cap at the street's level that covers the slope.
 */
const BERGE_TOP_FALL = 0.8
const BERGE_FOOT_FLAT = 0.12
const BERGE_MIN_DROP = 2
const BERGE_WALL_INSET = 0.3
const BERGE_MAX_SLOPE = 15
// how far out from the street the water and the slope are looked for
const BERGE_REACH = 45
// lower quays shorter than this along the street are dropped; gaps in one shorter than BERGE_MIN_GAP are filled
const BERGE_MIN_RUN = 16
const BERGE_MIN_GAP = 24
// stairs up from the lower quay, against the wall: one every BERGE_STAIR_PITCH metres of run, BERGE_STAIR_W wide
const BERGE_STAIR_PITCH = 90
const BERGE_STAIR_W = 1.8
const BERGE_STAIR_RISE = 0.17
const BERGE_STAIR_TREAD = 0.32
// chestnuts and planes on the lower quay: one in most BERGE_TREE_PITCH metres where the paving is BERGE_TREE_MIN_W wide
const BERGE_TREE_PITCH = 40
const BERGE_TREE_MIN_W = 9
/** the share of the pitches that get a tree */
const BERGE_TREE_SHARE = 0.45
/** the trees' heights, metres (the real models, render/vegetation.ts) */
const BERGE_TREE_H = [11, 16] as const
/*
 * PARIS PLAGES (every summer since 2002): sand, parasols and deckchairs on the right bank's lower quay, the Voie
 * Georges-Pompidou from the Pont Neuf to the Pont de Sully. Local x from PLAGES_X0 to PLAGES_X1 (paris-centre frame).
 */
const PLAGES = true
const PLAGES_NAMES = /^Voie Georges[- ]Pompidou$/
const PLAGES_X0 = 650
const PLAGES_X1 = 1950
const PLAGES_W = 4.5
const PARASOL_PITCH = 7
const SAND: Rgb = [0.86, 0.76, 0.55]
const PARASOLS: Rgb[] = [[0.95, 0.95, 0.92], [0.2, 0.45, 0.8], [0.95, 0.75, 0.2], [0.9, 0.35, 0.3]]

/** the lower quay's paving out from the wall's foot (never into the water) */
const BERGE_APRON = 14
/**
 * The paved cap over the slope and the lower quay's setts as boxes: needed while the ground was a grass bank; the quays' ground is
 * the 1 m survey now (tools/bake.ts, quay detail), which has the shelf itself, and the boxes stood over it in steps.
 */
const BERGE_BOXES = false
/*
 * THE SHIPPED WALLS (tools/bake.ts, the quays' walls; CityPackage.quayWalls). A face QW_THICK thick on the high side of its line,
 * from under the low side to QW_CAP_UP over the top; a cap QW_CAP_T thick over the slope behind it; pieces overlap by QW_OVERLAP
 * at their ends so a bend shows no slot. The street's parapet stands QW_PARAPET_IN in from the first wall out from the street.
 */
const QW_THICK = 0.6
const QW_CAP_UP = 0.08
const QW_CAP_T = 0.3
const QW_OVERLAP = 0.15
const QW_PARAPET_IN = 0.3
/** a wall this tall or more carries a parapet: the street's, over the river or a lower quay; not a lower quay's edge at the water */
const QW_PARAPET_DROP = 3.2
/** a wall is a lower quay's when the ground QW_SHELF_PROBE out in front of it is dry; its trees stand QW_TREE_OUT out, clear of roads by QW_TREE_CLEAR */
const QW_SHELF_PROBE = 3
const QW_TREE_OUT = 5
const QW_TREE_CLEAR = 1.5
/** a stable 0–1 from two integers (a piece's stairs and tree don't move between loads) */
function hash01(a: number, b: number): number {
  let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b ^ 0xc2b2ae35, 0x27d4eb2f)
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d)
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296
}
/** how near a probe must be to a wall's line, and how squarely the wall must face away from the street */
const QW_FIND = 0.5
const QW_FACING = 0.5

interface WallIndex {
  /** the wall within QW_FIND of x,z whose high side faces back along (dx, dz), the way out from the street */
  near(x: number, z: number, dx: number, dz: number): QuayWall | null
  /** the pieces whose middles lie in the rect */
  inRect(r: { x0: number; z0: number; x1: number; z1: number }): QuayWall[]
}

function wallIndex(ws: QuayWall[]): WallIndex {
  const C = 25, m = new Map<string, QuayWall[]>()
  for (const w of ws) {
    for (let cx = Math.floor((Math.min(w.ax, w.bx) - QW_FIND) / C); cx <= Math.floor((Math.max(w.ax, w.bx) + QW_FIND) / C); cx++)
      for (let cz = Math.floor((Math.min(w.az, w.bz) - QW_FIND) / C); cz <= Math.floor((Math.max(w.az, w.bz) + QW_FIND) / C); cz++) {
        const k = `${cx},${cz}`
        ;(m.get(k) ?? m.set(k, []).get(k)!).push(w)
      }
  }
  return {
    near(x, z, dx, dz) {
      for (const w of m.get(`${Math.floor(x / C)},${Math.floor(z / C)}`) ?? []) {
        const vx = w.bx - w.ax, vz = w.bz - w.az, L2 = vx * vx + vz * vz || 1, L = Math.sqrt(L2)
        const t = ((x - w.ax) * vx + (z - w.az) * vz) / L2
        if (t < 0 || t > 1) continue
        if (Math.hypot(w.ax + vx * t - x, w.az + vz * t - z) > QW_FIND) continue
        // the high side (left of a→b) is (vz, -vx)/L; it must face back towards the street: against (dx, dz)
        if (-(vz * dx - vx * dz) / L < QW_FACING) continue
        return w
      }
      return null
    },
    inRect(r) {
      return ws.filter((w) => { const x = (w.ax + w.bx) / 2, z = (w.az + w.bz) / 2; return x >= r.x0 && x < r.x1 && z >= r.z0 && z < r.z1 })
    },
  }
}

/** how far in from the water's outline the quay wall looks for the top of the bank */
const WALL_TOP_REACH = 2.5
/** quays whose parapets carry bouquinistes */
const BOOKSELLERS = new Set(["Quai de l'Hôtel de Ville", 'Quai des Célestins', 'Quai de Gesvres', 'Quai de la Mégisserie',
  'Quai du Louvre', 'Quai de la Tournelle', 'Quai de Montebello', 'Quai Saint-Michel', 'Quai des Grands Augustins', 'Quai de Conti', 'Quai Malaquais', 'Quai Voltaire'])

type P = { x: number; z: number }

function inside(ring: P[], x: number, z: number): boolean {
  let o = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    if ((ring[i].z > z) !== (ring[j].z > z) && x < ((ring[j].x - ring[i].x) * (z - ring[i].z)) / (ring[j].z - ring[i].z) + ring[i].x) o = !o
  }
  return o
}

/** An upright box of half-extents (hl along the direction u, hw across it, full height h) at p, on the ground y. */
function boxAt(out: MeshBuilder, p: P, y: number, ux: number, uz: number, hl: number, hw: number, h: number, c: Rgb, sid = FIXED): void {
  const vx = -uz
  const vz = ux
  const corner = (a: number, b: number, yy: number): [number, number, number] => [p.x + ux * a * hl + vx * b * hw, yy, p.z + uz * a * hl + vz * b * hw]
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const sides: [number, number, number, number, [number, number, number]][] = [
    [1, -1, 1, 1, [ux, 0, uz]], [-1, 1, -1, -1, [-ux, 0, -uz]], [1, 1, -1, 1, [vx, 0, vz]], [-1, -1, 1, -1, [-vx, 0, -vz]],
  ]
  for (const [a0, b0, a1, b1, n] of sides) out.quad([corner(a0, b0, y), corner(a1, b1, y), corner(a1, b1, y + h), corner(a0, b0, y + h)], n, uv, c, sid)
  out.quad([corner(-1, -1, y + h), corner(1, -1, y + h), corner(1, 1, y + h), corner(-1, 1, y + h)].reverse() as [number, number, number][], [0, 1, 0], uv, c, sid)
}

/**
 * The quays as a per-tile layer (render/city.ts `TileLayer`): the WHOLE water bodies are prepared once (the
 * river's side and its level need all of it), and each tile draws the parapet and wall pieces whose middle
 * lies in it — so a piece is drawn once, by exactly one tile.
 */
export function quaysLayer(scene: Scene, pkg: Pick<CityPackage, 'areas' | 'water'>, terrain: Terrain, drop = 0, lowerQuays?: string[], quayWalls?: QuayWall[]):
  TileLayer & { plantWith(set: (key: string, ps: Planting[]) => void): void } {
  const lq = lowerQuays ? new Set(lowerQuays) : null
  const walls = quayWalls?.length ? wallIndex(quayWalls) : null
  const water = prepareWater(pkg, terrain, drop)
  // the lower quays' trees go to the tree layer (render/vegetation.ts), which game.ts makes after this one: held till then
  let plant: ((key: string, ps: Planting[]) => void) | null = null
  const pending = new Map<string, Planting[]>()
  return {
    name: 'quays',
    build(near, rect) {
      const trees: Planting[] = []
      const m = buildQuays(scene, near.tile.edges, water, terrain, drop, rect, `quays:${near.key}`, near.around.edges, lq, trees, walls)
      if (plant) plant(`quays:${near.key}`, trees); else pending.set(near.key, trees)
      return m ? [m] : []
    },
    release(k) { pending.delete(k); plant?.(`quays:${k}`, []) },
    plantWith(set) { plant = set; for (const [k, ps] of pending) set(`quays:${k}`, ps); pending.clear() },
  }
}

interface Water { ring: Point[]; holes: Point[][]; x0: number; x1: number; z0: number; z1: number; level: number }
type Point = { x: number; z: number }

function prepareWater(pkg: Pick<CityPackage, 'areas' | 'water'>, terrain: Terrain, drop: number): Water[] {
  const bodies = wholeWater(pkg)
  const levels = waterLevels(bodies, (x, z) => terrain.heightAt(x, z), drop)
  return bodies.map((a, k) => {
    const ring = unpackPoints(a.ring)
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const q of ring) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
    return { ring, holes: (a.holes ?? []).map(unpackPoints), x0, x1, z0, z1, level: levels[k] }
  })
}

function buildQuays(scene: Scene, edges: CityPackage['edges'], water: Water[], terrain: Terrain, drop: number,
  rect: { x0: number; z0: number; x1: number; z1: number }, name: string, around: CityPackage['edges'] = edges, lq: Set<string> | null = null, trees: Planting[] = [],
  walls: WallIndex | null = null): Mesh | null {
  if (water.length === 0) return null
  /*
   * A bridge's mouth is open (the Seine audit, 2026-10-30). The parapet is laid along the quay's river side and knows nothing of what leaves it: at every bridge head on a
   * quay it ran on across the roadway, a metre of stone and on the booksellers' quays a row of green boxes across the Pont Royal's mouth and the Pont Saint-Michel's.
   */
  const mouths: { p: Point[]; r: number }[] = []
  for (const e of around) {
    if (!e.bridge && !e.ramp) continue
    if (e.bridge && e.tunnel) continue
    mouths.push({ p: unpackPoints(e.points), r: e.width / 2 + (e.foot ? 0.5 : e.walk + 0.5) })
  }
  const inMouth = (x: number, z: number): boolean => {
    for (const m of mouths) {
      for (let i = 1; i < m.p.length; i++) {
        const a = m.p[i - 1], b = m.p[i], dx = b.x - a.x, dz = b.z - a.z
        const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)))
        if (Math.hypot(a.x + dx * t - x, a.z + dz * t - z) < m.r) return true
      }
    }
    return false
  }
  const mine = (x: number, z: number): boolean => x >= rect.x0 && x < rect.x1 && z >= rect.z0 && z < rect.z1
  // an island is a hole in the river: land
  const wet = (x: number, z: number): boolean => water.some((w) => x >= w.x0 && x <= w.x1 && z >= w.z0 && z <= w.z1
    && inside(w.ring, x, z) && !w.holes.some((h) => inside(h, x, z)))
  const out = new MeshBuilder()
  const seam = new MeshBuilder()
  let metres = 0
  for (const e of edges) {
    if (!e.name || !(/^Quai /.test(e.name) || lq?.has(e.name)) || e.foot || e.bridge || e.tunnel) continue
    const pts = unpackPoints(e.points)
    const d = e.width / 2 + e.walk + 0.15
    const books = BOOKSELLERS.has(e.name)
    // pass 1: every 2 m step, which side the river is, and whether a lower quay (berge) fits there
    type Step = { mx: number; mz: number; ux: number; uz: number; l: number; run: number; side: number; edge: number; top: number; foot: number; drop: number; berge: boolean; wall?: { o: number; top: number } }
    const steps: Step[] = []
    let run = 0
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]
      const b = pts[i]
      const seg = Math.hypot(b.x - a.x, b.z - a.z)
      if (seg < 0.1) continue
      const ux = (b.x - a.x) / seg
      const uz = (b.z - a.z) / seg
      const step = 2
      for (let s = 0; s < seg - 1e-6; s += step) {
        const l = Math.min(step, seg - s)
        const mx = a.x + ux * (s + l / 2)
        const mz = a.z + uz * (s + l / 2)
        run += l
        // which side is the river, and where its edge is: stepping out from the pavement up to 40 m each
        // way, the first point in water. The parapet stands a metre short of it — on the bank, which on the
        // Quai des Célestins is past a strip of lawn, not at the kerb
        let side = 0
        let edge = Infinity
        for (const sd of [-1, 1]) {
          for (let o = d; o <= d + BERGE_REACH; o += 1) {
            if (wet(mx - uz * sd * o, mz + ux * sd * o)) { if (o < edge) { edge = o; side = sd } break }
          }
        }
        let top = -1, foot = -1, drop = 0, berge = false
        if (side !== 0) {
          const at = (o: number): number => terrain.heightAt(mx - uz * side * o, mz + ux * side * o)
          const street = at(d)
          for (let o = d; o < Math.min(edge, d + BERGE_REACH); o += 1) if (at(o) < street - BERGE_TOP_FALL) { top = o; break }
          if (top > 0) {
            foot = top
            while (foot + 1 < edge && foot - top < BERGE_MAX_SLOPE && at(foot) - at(foot + 1) > BERGE_FOOT_FLAT) foot += 1
            drop = street - at(foot)
            berge = drop >= BERGE_MIN_DROP && (!lq || lq.has(e.name))
          }
        }
        if (inMouth(mx, mz) || (top > 0 && inMouth(mx - uz * side * top, mz + ux * side * top))) berge = false
        // the shipped walls (tools/bake.ts): the first one out from the street, facing away from it, carries the parapet
        let wall: Step['wall']
        if (walls && side !== 0) {
          berge = false
          for (let o = d; o < Math.min(edge + 2, d + BERGE_REACH) && !wall; o += 0.5) {
            const w = walls.near(mx - uz * side * o, mz + ux * side * o, -uz * side, ux * side)
            if (w) wall = { o, top: w.top }
          }
        }
        steps.push({ mx, mz, ux, uz, l, run, side, edge, top, foot, drop, berge, wall })
      }
    }
    // pass 2: a lower quay shorter than BERGE_MIN_RUN (or a gap in one shorter than BERGE_MIN_GAP) is patchy
    // wall-and-hill: fill short gaps, then drop short runs
    const flip = (want: boolean, min: number): void => {
      for (let i = 0; i < steps.length;) {
        if (steps[i].berge === want) { i++; continue }
        let j = i, len = 0
        while (j < steps.length && steps[j].berge !== want) { len += steps[j].l; j++ }
        const inner = i > 0 && j < steps.length
        if (len < min && (!want || inner)) for (let k = i; k < j; k++) {
          const st = steps[k]
          if (st.side === 0 || (want && inMouth(st.mx, st.mz))) continue
          if (want) {
            // a gap in a lower quay: the bank there is a hump in the terrain, not a real break. Borrow the
            // nearer side's wall line and drop
            const nb = k - i < j - k ? steps[i - 1] : steps[j]
            if (st.top <= 0 || st.drop < BERGE_MIN_DROP) { st.top = nb.top; st.foot = Math.min(nb.foot, st.edge - 1.5); st.drop = nb.drop }
            if (st.foot <= st.top) continue
          }
          st.berge = want
        }
        i = j
      }
    }
    flip(true, BERGE_MIN_GAP)
    flip(false, BERGE_MIN_RUN)
    for (const st of steps) {
      const { mx, mz, ux, uz, l, side, edge, top, foot } = st
      run = st.run
      // another tile's piece: counted along the quay (the booksellers' rhythm), not drawn here
      if (!mine(mx, mz)) continue
      if (side === 0) continue
      let off = Math.max(d, edge - 1)
      // a lower quay between the street and the water: the slope becomes a wall under a paved cap
      const at = (o: number): number => terrain.heightAt(mx - uz * side * o, mz + ux * side * o)
      const street = at(d)
      let capY = NaN
      if (st.wall) { off = st.wall.o - QW_PARAPET_IN; capY = st.wall.top + QW_CAP_UP }
      if (st.berge) {
        const footY = street - st.drop
        const wall = foot - BERGE_WALL_INSET
        const c0 = top - 1.5
        capY = street + 0.12
        const mid = (c0 + wall) / 2
        const hc = { x: mx - uz * side * mid, z: mz + ux * side * mid }
        if (!inMouth(hc.x, hc.z)) {
          // the cap over the slope, the wall's face down to the lower quay
          const v = { x: -uz * side, z: ux * side }
          const lx = v.z, lz = -v.x
          if (BERGE_BOXES) boxAt(out, hc, capY - 0.25, lx, lz, l / 2 + 0.02, (wall - c0) / 2, 0.25, PAVE)
          const wp = { x: mx - uz * side * (wall - 0.3), z: mz + ux * side * (wall - 0.3) }
          boxAt(out, wp, footY - 0.3, ux, uz, l / 2 + 0.02, 0.3, capY - footY + 0.3, BERGE_WALL, ASHLAR)
          // a flight of stairs down the wall's face, along it, every BERGE_STAIR_PITCH metres
          if (Math.floor(st.run / BERGE_STAIR_PITCH) !== Math.floor((st.run - l) / BERGE_STAIR_PITCH)) {
            const n = Math.ceil((capY - footY) / BERGE_STAIR_RISE)
            const so = wall + BERGE_STAIR_W / 2
            for (let k = 0; k < n; k++) {
              const along = (k - n) * BERGE_STAIR_TREAD
              const sp = { x: mx - uz * side * so + ux * along, z: mz + ux * side * so + uz * along }
              boxAt(out, sp, footY - 0.1, ux, uz, BERGE_STAIR_TREAD / 2, BERGE_STAIR_W / 2, (k + 1) * (capY - footY) / n + 0.1, BERGE_WALL, ASHLAR)
            }
          }
          const ap = Math.min(BERGE_APRON, edge - foot - 0.6)
          if (ap > 0.5) {
            const am = wall + ap / 2
            if (BERGE_BOXES) boxAt(out, { x: mx - uz * side * am, z: mz + ux * side * am }, footY - 0.2, ux, uz, l / 2 + 0.02, ap / 2, 0.27, SETTS, SETT)
            // the edging stone at the water: a lip barely above the setts, no wall
            const km = wall + ap - 0.25
            const tk = Math.floor(st.run / BERGE_TREE_PITCH)
            const rnd = Math.abs(Math.sin(tk * 12.9898 + mx * 0.001) * 43758.5) % 1
            if (ap >= BERGE_TREE_MIN_W && tk !== Math.floor((st.run - l) / BERGE_TREE_PITCH) && rnd < BERGE_TREE_SHARE) {
              const to = wall + ap * 0.68
              trees.push({ x: mx - uz * side * to, z: mz + ux * side * to, height: BERGE_TREE_H[0] + rnd / BERGE_TREE_SHARE * (BERGE_TREE_H[1] - BERGE_TREE_H[0]), spin: rnd * 6.283, park: false })
            }
            if (BERGE_BOXES) boxAt(out, { x: mx - uz * side * km, z: mz + ux * side * km }, footY - 0.2, ux, uz, l / 2 + 0.02, 0.3, 0.39, CAP, ASHLAR)
          }
        }
        off = wall - 0.25
      }
      const cx = mx - uz * side * off
      const cz = mz + ux * side * off
      if (inMouth(cx, cz)) continue
      const y = Number.isNaN(capY) ? terrain.heightAt(cx, cz) + 0.15 : capY + 0.03
      // the parapet: a stone wall 0.45 m thick and 1 m high, with a paler coping (a shipped wall carries its own)
      if (!walls) {
        boxAt(out, { x: cx, z: cz }, y - 0.3, ux, uz, l / 2 + 0.02, 0.22, 1.2, STONE)
        boxAt(out, { x: cx, z: cz }, y + 0.9, ux, uz, l / 2 + 0.02, 0.27, 0.1, CAP)
      } else if (!st.wall) continue
      metres += l
      // the booksellers' boxes: two metres long, in fours with a gap, lids a little sloped (drawn as boxes)
      if (books && Math.floor(run / 2) % 5 !== 4) {
        boxAt(out, { x: cx - uz * side * 0.05, z: cz + ux * side * 0.05 }, y + 1.0, ux, uz, 0.95, 0.42, 0.62, GREEN)
        boxAt(out, { x: cx - uz * side * 0.05, z: cz + ux * side * 0.05 }, y + 1.62, ux, uz, 0.98, 0.45, 0.06, [0.1, 0.22, 0.15])
      }
    }
  }
  // the shipped quay walls whose middle is this tile's: the face from under the low side to the top, the cap over the slope behind it
  const roads = around.filter((e) => !e.foot && !e.bridge && !e.tunnel).map((e) => ({ p: unpackPoints(e.points), r: e.width / 2 + e.walk + QW_TREE_CLEAR }))
  const onRoad = (x: number, z: number): boolean => roads.some(({ p, r }) => {
    for (let i = 1; i < p.length; i++) {
      const a = p[i - 1], b = p[i], dx = b.x - a.x, dz = b.z - a.z
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)))
      if (Math.hypot(a.x + dx * t - x, a.z + dz * t - z) < r) return true
    }
    return false
  })
  if (walls) for (const w of walls.inRect(rect)) {
    const len = Math.hypot(w.bx - w.ax, w.bz - w.az)
    if (len < 0.2) continue
    const ux = (w.bx - w.ax) / len, uz = (w.bz - w.az) / len, nx = uz, nz = -ux
    const mx = (w.ax + w.bx) / 2, mz = (w.az + w.bz) / 2
    const top = w.top + QW_CAP_UP
    // the face runs on under a bridge's mouth (the abutment stands on it); its cap, parapet, stairs and trees do not
    boxAt(out, { x: mx + nx * QW_THICK / 2, z: mz + nz * QW_THICK / 2 }, w.low - 0.3, ux, uz, len / 2 + QW_OVERLAP, QW_THICK / 2, top - w.low + 0.3, BERGE_WALL, ASHLAR)
    if (inMouth(mx, mz)) continue
    const c = Math.max(w.cap, QW_THICK)
    boxAt(out, { x: mx + nx * c / 2, z: mz + nz * c / 2 }, top - QW_CAP_T, ux, uz, len / 2 + QW_OVERLAP, c / 2, QW_CAP_T, PAVE)
    // a lower quay's wall (dry ground at its foot): now and then a flight of stairs down its face, and a tree out on the paving
    const shelf = !wet(mx - nx * QW_SHELF_PROBE, mz - nz * QW_SHELF_PROBE)
    if (shelf && w.top - w.low >= BERGE_MIN_DROP) {
      const rnd = hash01(Math.round(mx * 10), Math.round(mz * 10))
      if (rnd < len / BERGE_STAIR_PITCH) {
        const n = Math.ceil((w.top - w.low) / BERGE_STAIR_RISE)
        for (let k = 0; k < n; k++) {
          const along = (k + 0.5) * BERGE_STAIR_TREAD - len / 2
          const sp = { x: mx + ux * along - nx * (BERGE_STAIR_W / 2), z: mz + uz * along - nz * (BERGE_STAIR_W / 2) }
          boxAt(out, sp, w.low - 0.1, ux, uz, BERGE_STAIR_TREAD / 2, BERGE_STAIR_W / 2, (k + 1) * (top - w.low) / n + 0.1, BERGE_WALL, ASHLAR)
        }
      }
      const rt = hash01(Math.round(mz * 10) + 7, Math.round(mx * 10) + 3)
      if (rt < (len / BERGE_TREE_PITCH) * BERGE_TREE_SHARE) {
        const tx = mx - nx * QW_TREE_OUT, tz = mz - nz * QW_TREE_OUT
        if (!wet(tx, tz) && !wet(tx - nx * 2, tz - nz * 2) && !onRoad(tx, tz)) {
          trees.push({ x: tx, z: tz, height: BERGE_TREE_H[0] + rt / BERGE_TREE_SHARE * (len / BERGE_TREE_PITCH) * (BERGE_TREE_H[1] - BERGE_TREE_H[0]), spin: rt * 6.283, park: false })
        }
      }
    }
    // the parapet on a wall a street stands over (not the lower quay's own low edge at the water)
    if (w.top - w.low >= QW_PARAPET_DROP) {
      const pc = { x: mx + nx * QW_PARAPET_IN, z: mz + nz * QW_PARAPET_IN }
      boxAt(out, pc, top - 0.05, ux, uz, len / 2 + QW_OVERLAP, 0.22, 1.05, STONE)
      boxAt(out, pc, top + 0.95, ux, uz, len / 2 + QW_OVERLAP, 0.27, 0.1, CAP)
    }
  }
  if (PLAGES) for (const e of edges) {
    if (!e.name || !PLAGES_NAMES.test(e.name) || e.bridge || e.tunnel) continue
    const pts = unpackPoints(e.points)
    let run = 0
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i]
      const seg = Math.hypot(b.x - a.x, b.z - a.z)
      if (seg < 0.1) continue
      const ux = (b.x - a.x) / seg, uz = (b.z - a.z) / seg
      for (let s = 0; s < seg - 1e-6; s += 2) {
        const l = Math.min(2, seg - s)
        const mx = a.x + ux * (s + l / 2), mz = a.z + uz * (s + l / 2)
        run += l
        if (mx < PLAGES_X0 || mx > PLAGES_X1 || !mine(mx, mz) || inMouth(mx, mz)) continue
        let side = 0, edge = Infinity
        for (const sd of [-1, 1]) for (let o = e.width / 2; o <= 15; o += 0.5) {
          if (wet(mx - uz * sd * o, mz + ux * sd * o)) { if (o < edge) { edge = o; side = sd } break }
        }
        if (side === 0) continue
        const o0 = e.width / 2 + 0.2, o1 = Math.min(edge - 0.4, o0 + PLAGES_W)
        if (o1 - o0 < 1) continue
        const om = (o0 + o1) / 2
        const at = (o: number): P => ({ x: mx - uz * side * o, z: mz + ux * side * o })
        const y = terrain.heightAt(at(om).x, at(om).z)
        boxAt(out, at(om), y - 0.1, ux, uz, l / 2 + 0.02, (o1 - o0) / 2, 0.16, SAND)
        // a parasol and two deckchairs under it, every PARASOL_PITCH metres
        if (Math.floor(run / PARASOL_PITCH) !== Math.floor((run - l) / PARASOL_PITCH)) {
          const k = Math.floor(run / PARASOL_PITCH)
          const c = at(om)
          boxAt(out, c, y, ux, uz, 0.03, 0.03, 2.3, [0.85, 0.85, 0.82])
          const col = PARASOLS[k % PARASOLS.length]
          boxAt(out, c, y + 2.2, ux, uz, 1.1, 1.1, 0.1, col)
          boxAt(out, c, y + 2.3, ux, uz, 0.6, 0.6, 0.1, col)
          for (const d of [-0.7, 0.7]) {
            const q = { x: c.x + ux * d, z: c.z + uz * d }
            boxAt(out, q, y + 0.06, -uz * side, ux * side, 0.8, 0.28, 0.22, k % 2 ? [0.2, 0.4, 0.75] : [0.95, 0.95, 0.92])
          }
        }
      }
    }
  }
  /*
   * The quay walls: where the region drops its rivers below their banks (`riverDrop`), the drop has to be a
   * wall — Paris's are dressed stone, straight down from the bank to the water — or the river would be a
   * hole with nothing round its sides. Along every water body's edge, from the ground at the bank to a little
   * under the surface (which is its lowest bank less the drop, as the city draws it).
   */
  if (drop > 0) {
    const wallStone: Rgb = [0.6, 0.57, 0.51]
    for (const w of water) {
      if (w.x1 < rect.x0 || w.x0 > rect.x1 || w.z1 < rect.z0 || w.z0 > rect.z1) continue
      const level = w.level
      // the banks: the river's outline, and every island's
      for (const ring of [w.ring, ...w.holes]) {
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i]
        const b = ring[(i + 1) % ring.length]
        const len = Math.hypot(b.x - a.x, b.z - a.z)
        const n = Math.max(1, Math.ceil(len / 3))
        for (let k = 0; k < n; k++) {
          const p0 = { x: a.x + ((b.x - a.x) * k) / n, z: a.z + ((b.z - a.z) * k) / n }
          const p1 = { x: a.x + ((b.x - a.x) * (k + 1)) / n, z: a.z + ((b.z - a.z) * (k + 1)) / n }
          if (!mine((p0.x + p1.x) / 2, (p0.z + p1.z) / 2)) continue
          // not along a line between two bodies of water (the Seine is mapped as several polygons): water on
          // both sides is no bank, and each body drew its own wall there, z-fighting in the river (BUGS.md #36)
          {
            const mx = (p0.x + p1.x) / 2
            const mz = (p0.z + p1.z) / 2
            const nx = (p1.z - p0.z) / (len / n)
            const nz = -(p1.x - p0.x) / (len / n)
            if (wet(mx + nx * 1.5, mz + nz * 1.5) && wet(mx - nx * 1.5, mz - nz * 1.5)) {
              // …and the seam between the two polygons, which never quite meet, filled with a band of water
              const lv = Math.min(level, ...water.filter((q) => q !== w && q.x0 <= mx && mx <= q.x1 && q.z0 <= mz && mz <= q.z1).map((q) => q.level))
              const y = lv + 0.03
              seam.quad([[p0.x - nx * 2.5, y, p0.z - nz * 2.5], [p1.x - nx * 2.5, y, p1.z - nz * 2.5],
                [p1.x + nx * 2.5, y, p1.z + nz * 2.5], [p0.x + nx * 2.5, y, p0.z + nz * 2.5]], [0, 1, 0],
                [[0, 0], [1, 0], [1, 1], [0, 1]], [0, 0, 0], 0)
              continue
            }
          }
          // the wall's top is the bank's, a few metres in: at the outline itself the 1 m ground is partway up its own ramp
          const nx = (p1.z - p0.z) / (len / n), nz = -(p1.x - p0.x) / (len / n)
          const bankTop = (q: Point): number => {
            let h = terrain.heightAt(q.x, q.z)
            for (const sd of [-1, 1]) for (let o = 0.5; o <= WALL_TOP_REACH; o += 0.5) {
              const x = q.x + nx * sd * o, z = q.z + nz * sd * o
              if (!wet(x, z)) h = Math.max(h, terrain.heightAt(x, z))
            }
            return h
          }
          const t0 = bankTop(p0)
          const t1 = bankTop(p1)
          if (Math.max(t0, t1) - level < 0.3) continue
          out.quad([[p0.x, level - 0.4, p0.z], [p1.x, level - 0.4, p1.z], [p1.x, t1 + 0.1, p1.z], [p0.x, t0 + 0.1, p0.z]],
            [(p1.z - p0.z) / (len / n), 0, -(p1.x - p0.x) / (len / n)], [[0, 0], [1, 0], [1, 1], [0, 1]], wallStone, FIXED)
        }
      }
      }
    }
  }
  const extra: Mesh[] = []
  if (seam.triangles > 0) {
    const sm = new Mesh(`${name}:seam`, scene)
    seam.toVertexData().applyToMesh(sm)
    sm.material = waterMaterial(scene)
    sm.renderingGroupId = 1
    sm.isPickable = false
    extra.push(sm)
  }
  if (out.triangles === 0) return extra[0] ?? null
  const m = new Mesh(name, scene)
  out.toVertexData().applyToMesh(m)
  const mat = cartoonMaterial(scene, 'cartoonQuay', false)
  // drawn both sides: a water ring's winding decides which way its walls would face, and it is not reliable
  mat.backFaceCulling = false
  m.material = mat
  m.renderingGroupId = 3
  m.isPickable = false
  m.freezeWorldMatrix()
  void metres
  for (const e of extra) e.parent = m
  return m
}
