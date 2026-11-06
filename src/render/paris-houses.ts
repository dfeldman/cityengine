/**
 * Suburban single-family houses of the Paris city (Ville-d'Avray, Chaville, Sèvres, Versailles: owner, 2026-11-05, photographs of the Rue de
 * Versailles corridor). The bake files them as archetype `parishouse` (city/paris/house.ts) and the facade grammar skips them: this layer
 * draws each, per tile, from its footprint and the streets round it. Two renderers share the parts:
 *
 *   DETACHED  hipped or gabled tile roof, shutters on every window, a door with a porch, dormers and skylights, a chimney; and on the plot's
 *             frontage a street WALL (cream render, or low with iron railings) with a GARAGE gap and a pedestrian GATE gap, and a HEDGE
 *             behind it.
 *   ROW       a house sharing a side wall with a neighbour: the facade on the street line, party walls blind, a ridge parallel to the street,
 *             a door and a garage door below, no front wall.
 *
 * Every number is in HOUSES / LOOKS below.
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import { cartoonMaterial, surfaceTag, type Surface } from './cartoon-material.ts'
import { buildRoof, longestEdgeDirection } from './roofs.ts'
import { unpackPoints, type PackedBuilding, type PackedEdge } from '../city/package.ts'
import type { Terrain } from '../city/terrain.ts'
import { buildingFooting, simplifyRing } from '../map/footing.ts'
import type { TileLayer } from './city.ts'
import { ROOF_RGB } from '../city/paris/materials.ts'

type P = { x: number; z: number }
type Rgb = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** the archetype the bake gives a house (city/paris/house.ts); the facade grammar skips it */
export const PARIS_HOUSE = 'parishouse'
export const isParisHouse = (b: { archetype?: string }): boolean => b.archetype === PARIS_HOUSE

/** the numbers; tune here (metres unless said) */
export const HOUSES = {
  /** bay pitch of the windows, and the margin kept at each end of a wall */
  bay: 2.7, margin: 0.8,
  /** window: width, upper-storey height, ground-storey height, ground sill */
  win: { w: 0.95, h: 1.55, hGround: 1.45, sill: 0.95, frame: 0.07, shutterW: 0.44 },
  /** share of houses with shutters, percent */
  shutters: 80,
  door: { w: 1.0, h: 2.15, porchShare: 55 },
  /** the ground-floor plinth band */
  plinth: 0.55,
  /** a roof's rise over half its width (about 38 degrees), its clamp, and how many hip roofs of 100 */
  pitch: 0.78, riseMin: 1.5, riseMax: 4.6, hipShare: 60,
  /** a dormer's width and wall height; a skylight's */
  dormer: { w: 1.1, h: 1.3 }, skylight: { w: 0.8, h: 1.1 },
  /** dormers per side of a roof of this width, percent that have any */
  dormerShare: 55,
  /** a ring this close to a rectangle gets dormers and a ridge chimney */
  rectFill: 0.82,
  /** a wall this close (m) to another building's outline is a PARTY wall */
  party: 0.6,
  /** a neighbour only makes a party wall (and so a ROW house) at this floor area (m²) and height (m): a garage or lean-to annex against a villa does not */
  partyMinArea: 45, partyMinHeight: 5,
  /** the street wall: height range, thickness, coping, pier; share with railings on a low wall; the gap widths */
  wall: { h: [1.8, 2.5] as [number, number], t: 0.22, coping: 0.08, pier: 0.4, railShare: 25, lowH: 0.6, railH: 1.6, gate: 1.05, garage: 2.9, garageShare: 70,
    /** plot margin each side of the house front (m), and the least wall (m) */
    side: [3, 6] as [number, number], least: 12, most: 30 },
  /** the setback (pavement edge to house front) under which a house stands ON the street and gets no wall, and over which the plot is not fenced */
  onStreet: 0.9, farthest: 18,
  /** the hedge behind the wall: width, extra height over the wall, share of walls that have one */
  hedge: { w: 0.85, over: [0.3, 0.9] as [number, number], share: 60, behind: 0.65 },
  /** a street this far from the house front is not its street (m) */
  streetReach: 40,
  /** the eaves' overhang (m) */
  eave: 0.3,
}

const WALLS: Record<string, { colours: Rgb[]; surface: Surface; trim: Rgb }> = {
  brick: { colours: [[0.66, 0.31, 0.22], [0.6, 0.28, 0.2], [0.7, 0.4, 0.28]], surface: 'brick', trim: [0.9, 0.87, 0.8] },
  render: { colours: [[0.92, 0.86, 0.74], [0.9, 0.82, 0.68], [0.95, 0.92, 0.85], [0.88, 0.8, 0.66]], surface: 'stucco', trim: [0.97, 0.95, 0.9] },
  millstone: { colours: [[0.72, 0.64, 0.5], [0.66, 0.58, 0.46]], surface: 'ashlar', trim: [0.66, 0.32, 0.23] },
  stone: { colours: [[0.84, 0.8, 0.72], [0.8, 0.77, 0.7]], surface: 'ashlar', trim: [0.94, 0.92, 0.87] },
}
const SHUTTER: Rgb[] = [[0.27, 0.38, 0.32], [0.35, 0.42, 0.5], [0.92, 0.9, 0.85], [0.38, 0.3, 0.24], [0.5, 0.2, 0.17], [0.55, 0.57, 0.55]]
const GLASS: Rgb = [0.2, 0.26, 0.31]
const DOOR: Rgb[] = [[0.25, 0.3, 0.28], [0.4, 0.27, 0.2], [0.2, 0.24, 0.32], [0.55, 0.2, 0.18], [0.9, 0.88, 0.82]]
const IRON: Rgb = [0.13, 0.14, 0.15]
const HEDGE: Rgb[] = [[0.18, 0.34, 0.17], [0.22, 0.4, 0.2], [0.16, 0.3, 0.16]]
const PLINTH: Rgb = [0.55, 0.53, 0.5]
const WALL_RENDER: Rgb[] = [[0.88, 0.83, 0.72], [0.9, 0.88, 0.8], [0.82, 0.78, 0.7]]
const DRIVE: Rgb = [0.5, 0.49, 0.47]
const TILE_COLOURS: Rgb[] = [[0.6, 0.32, 0.23], [0.66, 0.38, 0.26], [0.52, 0.28, 0.22]]
const SLATE: Rgb = [0.27, 0.29, 0.33]
const CHIMNEY: Rgb = [0.6, 0.38, 0.3]

function rngOf(seed: number): () => number {
  let s = (seed ^ 0x9e3779b9) >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const pick = <T>(r: () => number, l: readonly T[]): T => l[Math.floor(r() * l.length) % l.length]
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

function inside(r: P[], x: number, z: number): boolean {
  let o = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    if ((r[i].z > z) !== (r[j].z > z) && x < ((r[j].x - r[i].x) * (z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) o = !o
  }
  return o
}
function distToSeg(px: number, pz: number, ax: number, az: number, bx: number, bz: number): { d: number; t: number } {
  const dx = bx - ax, dz = bz - az
  const L2 = dx * dx + dz * dz || 1
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / L2))
  return { d: Math.hypot(px - (ax + dx * t), pz - (az + dz * t)), t }
}
const ringArea = (r: P[]): number => Math.abs(r.reduce((a, p, i) => { const q = r[(i + 1) % r.length]; return a + p.x * q.z - q.x * p.z }, 0) / 2)

type V3 = [number, number, number]
/** a quad on the wall plane of a→c: `along` metres from a, `y` up, `off` metres out along the normal */
class Wall {
  readonly tx: number; readonly tz: number; readonly nx: number; readonly nz: number; readonly L: number
  readonly a: P
  constructor(a: P, c: P) {
    this.a = a
    this.L = Math.hypot(c.x - a.x, c.z - a.z) || 1
    this.tx = (c.x - a.x) / this.L; this.tz = (c.z - a.z) / this.L
    // the ring is anticlockwise: the outward normal of a→c is (ez, −ex)
    this.nx = this.tz; this.nz = -this.tx
  }
  at(along: number, y: number, off: number): V3 { return [this.a.x + this.tx * along + this.nx * off, y, this.a.z + this.tz * along + this.nz * off] }
  rect(out: MeshBuilder, a0: number, a1: number, y0: number, y1: number, off: number, c: Rgb, tag = 0): void {
    out.quad([this.at(a0, y0, off), this.at(a1, y0, off), this.at(a1, y1, off), this.at(a0, y1, off)], [this.nx, 0, this.nz], UV, c, tag)
  }
}

/** a vertical box along a wall line, between two ground-following heights */
function box(out: MeshBuilder, w: Wall, a0: number, a1: number, off0: number, off1: number, y0: number, y1: number, c: Rgb, tag: number): void {
  const p = (a: number, o: number, y: number): V3 => w.at(a, y, o)
  const side = (pa: V3, pb: V3, ya: number, yb: number, n: V3): void => out.quad([[pa[0], ya, pa[2]], [pb[0], ya, pb[2]], [pb[0], yb, pb[2]], [pa[0], yb, pa[2]]], n, UV, c, tag)
  side(p(a0, off1, 0), p(a1, off1, 0), y0, y1, [w.nx, 0, w.nz])
  side(p(a1, off0, 0), p(a0, off0, 0), y0, y1, [-w.nx, 0, -w.nz])
  side(p(a0, off0, 0), p(a0, off1, 0), y0, y1, [-w.tx, 0, -w.tz])
  side(p(a1, off1, 0), p(a1, off0, 0), y0, y1, [w.tx, 0, w.tz])
  out.quad([p(a0, off0, y1), p(a1, off0, y1), p(a1, off1, y1), p(a0, off1, y1)], [0, 1, 0], UV, c, tag)
}

interface Street { e: PackedEdge; pts: P[] }
interface Near1 { tile: { buildings: PackedBuilding[] }; around: { buildings: PackedBuilding[]; edges: PackedEdge[] }; key: string }

/** the nearest street segment to a point: its centreline's closest point, tangent, and the half-corridor (carriageway and pavement) */
function nearestStreet(streets: Street[], x: number, z: number, reach: number): { qx: number; qz: number; tx: number; tz: number; d: number; half: number } | null {
  let best: ReturnType<typeof nearestStreet> = null
  for (const s of streets) {
    for (let i = 1; i < s.pts.length; i++) {
      const a = s.pts[i - 1], b = s.pts[i]
      const { d, t } = distToSeg(x, z, a.x, a.z, b.x, b.z)
      if (d > reach || (best && d >= best.d)) continue
      const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
      best = { qx: a.x + (b.x - a.x) * t, qz: a.z + (b.z - a.z) * t, tx: (b.x - a.x) / L, tz: (b.z - a.z) / L, d, half: s.e.width / 2 + s.e.walk }
    }
  }
  return best
}

export function parisHousesLayer(scene: Scene, terrain: Terrain): TileLayer {
  return {
    name: 'parisHouses',
    build(near: Near1, _rect) {
      const houses = near.tile.buildings.filter((b) => isParisHouse(b) && (b.minHeight ?? 0) < 2)
      if (houses.length === 0) return []
      const out = new MeshBuilder()
      const others = near.around.buildings.filter((b) => (b.minHeight ?? 0) < 2).map((b) => ({ id: b.id, ring: unpackPoints(b.ring), house: isParisHouse(b), h: b.height ?? 9 }))
      const streets: Street[] = near.around.edges.filter((e) => !e.foot && !e.park && e.width > 2).map((e) => ({ e, pts: unpackPoints(e.points) }))
      for (const b of houses) {
        try { drawHouse(out, b, others, streets, terrain) } catch { /* a bad outline is one house missing, not a tile */ }
      }
      if (out.triangles === 0) return []
      const m = new Mesh(`parisHouses:${near.key}`, scene)
      out.toVertexData().applyToMesh(m)
      const mat = cartoonMaterial(scene, 'cartoonLandmark', false)
      m.material = mat
      m.renderingGroupId = 3
      m.isPickable = false
      m.freezeWorldMatrix()
      return [m]
    },
  }
}

function shoelace(r: P[]): number { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j].x - r[i].x) * (r[j].z + r[i].z); return a / 2 }
type Other = { id: number; ring: P[]; house: boolean; h: number }

export function drawHouse(out: MeshBuilder, b: PackedBuilding, others: Other[], streets: Street[], terrain: Terrain): void {
  const ring0 = unpackPoints(b.ring)
  const ring = simplifyRing(ring0) as P[]
  if (ring.length < 3) return
  const r = rngOf(b.id)
  const { foot } = b.baseY === undefined ? buildingFooting(ring, (x, z) => terrain.heightAt(x, z)) : { foot: b.baseY }
  const y0 = 0.16 + foot
  const H = Math.max(2.8, b.height ?? (b.levels ? b.levels * 3.1 : 6))
  const storeys = Math.max(1, Math.min(3, Math.round((H - 0.4) / 2.9)))
  const sh = H / storeys
  const look = WALLS[b.wall ?? 'render'] ?? WALLS.render
  const wallC = pick(r, look.colours)
  const tag = surfaceTag(look.surface)
  const shuttered = r() * 100 < HOUSES.shutters
  const shutterC = pick(r, SHUTTER)
  const doorC = pick(r, DOOR)
  const centroid = ring.reduce((s, p) => ({ x: s.x + p.x / ring.length, z: s.z + p.z / ring.length }), { x: 0, z: 0 })
  const walls = ring.map((a, i) => new Wall(a, ring[(i + 1) % ring.length]))

  // which walls are shared with a neighbour (their outline close along the wall's length), and with what
  const party = walls.map((w) => {
    if (w.L < 1.5) return null
    let hit: Other | null = null
    for (const o of others) {
      if (o.id === b.id || o.h < HOUSES.partyMinHeight || Math.abs(shoelace(o.ring)) < HOUSES.partyMinArea) continue
      let n = 0
      for (const f of [0.2, 0.5, 0.8]) {
        const x = w.a.x + w.tx * w.L * f, z = w.a.z + w.tz * w.L * f
        for (let i = 0, j = o.ring.length - 1; i < o.ring.length; j = i++) {
          if (distToSeg(x, z, o.ring[j].x, o.ring[j].z, o.ring[i].x, o.ring[i].z).d < HOUSES.party) { n++; break }
        }
      }
      if (n >= 2) { hit = o; break }
    }
    return hit
  })
  const row = party.some((p) => p !== null)

  // the front: the wall facing the nearest street (longest on a tie); row houses never front a party wall
  const st = nearestStreet(streets, centroid.x, centroid.z, HOUSES.streetReach + 20)
  let front = -1, bestScore = -Infinity
  walls.forEach((w, i) => {
    if (w.L < 2.5 || party[i]) return
    let score = w.L * 0.05
    if (st) {
      const dx = st.qx - (w.a.x + w.tx * w.L / 2), dz = st.qz - (w.a.z + w.tz * w.L / 2)
      const d = Math.hypot(dx, dz) || 1
      score += (w.nx * dx + w.nz * dz) / d * 3
    }
    if (score > bestScore) { bestScore = score; front = i }
  })
  if (front < 0) front = walls.reduce((bi, w, i) => (party[i] === null && w.L > (walls[bi]?.L ?? 0) ? i : bi), 0)
  const fw = walls[front]

  // ---- walls, windows, shutters, door
  const doorBay = Math.floor(r() * 3)
  const doorAt = (): number => {
    const bays = Math.max(1, Math.floor((fw.L - 2 * HOUSES.margin) / HOUSES.bay))
    return HOUSES.margin + ((Math.min(doorBay, bays - 1) + 0.5) * (fw.L - 2 * HOUSES.margin)) / bays
  }
  const doorAlong = doorAt()
  const garageDoor = row && r() < 0.3
  walls.forEach((w, i) => {
    const h = H
    w.rect(out, 0, w.L, y0 - 0.4, y0 + h, 0, wallC, tag)
    if (party[i]) return
    if (b.wall !== 'stone') w.rect(out, 0, w.L, y0 - 0.4, y0 + HOUSES.plinth, 0.012, PLINTH, surfaceTag('ashlar'))
    if (w.L < 1.9) return
    const nb = Math.max(1, Math.floor((w.L - 2 * HOUSES.margin) / HOUSES.bay))
    const pitch = (w.L - 2 * HOUSES.margin) / nb
    for (let k = 0; k < nb; k++) {
      const c = HOUSES.margin + (k + 0.5) * pitch
      const isDoor = i === front && k === Math.min(doorBay, nb - 1)
      for (let s = 0; s < storeys; s++) {
        const ground = s === 0
        if (ground && isDoor) { doorAndPorch(out, w, c, y0, doorC, r, !row); continue }
        if (ground && i === front && garageDoor && k === (nb > 1 ? (Math.min(doorBay, nb - 1) === 0 ? 1 : 0) : -1)) {
          w.rect(out, c - 1.2, c + 1.2, y0, y0 + 2.1, 0.03, pick(r, DOOR), surfaceTag('planks'))
          continue
        }
        // a side wall's ground floor is blind more often than the front's
        if (i !== front && r() < 0.18) continue
        windowAt(out, w, c, y0 + s * sh, sh, ground, wallC, look.trim, shuttered, shutterC)
      }
    }
  })

  // ---- the roof: a hip or a gable drawn here on a rectangular outline (eaves a little proud, gable ends in the wall), the generic roof otherwise
  // a row house's ridge runs along the street, its gables on the party walls
  const dir = row ? Math.atan2(fw.tx, fw.tz) : longestEdgeDirection(ring)
  const ux = Math.sin(dir), uz = Math.cos(dir), vx = Math.cos(dir), vz = -Math.sin(dir)
  let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity
  for (const p of ring) { const u = p.x * ux + p.z * uz, v = p.x * vx + p.z * vz; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v) }
  const hu = (u1 - u0) / 2, hv = (v1 - v0) / 2, um = (u0 + u1) / 2, vm = (v0 + v1) / 2
  const rect = ringArea(ring) / Math.max(1, 4 * hu * hv) >= HOUSES.rectFill && ring.length <= 8
  const hip = !row && r() * 100 < HOUSES.hipShare
  const rise = Math.max(HOUSES.riseMin, Math.min(HOUSES.riseMax, (hip ? Math.min(hu, hv) : hv) * HOUSES.pitch))
  const base: Rgb = r() < 0.62 ? pick(r, TILE_COLOURS) : SLATE
  const known = b.roofColour && [...TILE_COLOURS, SLATE, ROOF_RGB.tile, ROOF_RGB.slate].some((c) => Math.hypot(c[0] - b.roofColour[0], c[1] - b.roofColour[1], c[2] - b.roofColour[2]) < 0.04)
  const k0 = known ? b.roofColour : base
  const jig = 0.92 + r() * 0.16
  const colour: Rgb = [k0[0] * jig, k0[1] * jig, k0[2] * jig]
  const tile = surfaceTag('tile')
  const P3 = (u: number, v: number, y: number): V3 => [ux * (um + u) + vx * (vm + v), y, uz * (um + u) + vz * (vm + v)]
  const N3 = (nu: number, ns: number, ny: number): V3 => { const l = Math.hypot(nu, ns, ny); return [(ux * nu + vx * ns) / l, ny / l, (uz * nu + vz * ns) / l] }
  const ye = y0 + H
  let ridgeY = ye + rise
  let roofY = (_u: number, _s: number): number => ye + rise
  if (rect) {
    const kk = rise / hv
    const ov = HOUSES.eave
    const HU = hu + ov, HV = hv + ov, yE = ye - ov * kk, yR = ye + rise
    if (hip) {
      const rl = Math.max(0, hu - hv)
      for (const sg of [-1, 1]) {
        out.quad([P3(-HU, sg * HV, yE), P3(HU, sg * HV, yE), P3(rl, 0, yR), P3(-rl, 0, yR)], N3(0, sg * kk, 1), UV, colour, tile)
        out.quad([P3(sg * HU, HV, yE), P3(sg * HU, -HV, yE), P3(sg * rl, 0, yR), P3(sg * rl, 0, yR)], N3(sg * kk, 0, 1), UV, colour, tile)
      }
      roofY = (u, s) => ye + Math.max(0, Math.min(rise * (1 - Math.abs(s) / hv), rise * (hu - Math.abs(u)) / hv))
    } else {
      for (const sg of [-1, 1]) {
        out.quad([P3(-HU, sg * HV, yE), P3(HU, sg * HV, yE), P3(HU, 0, yR), P3(-HU, 0, yR)], N3(0, sg * kk, 1), UV, colour, tile)
        // the gable end, in the wall's own material
        out.quad([P3(sg * hu, -hv, ye - 0.05), P3(sg * hu, hv, ye - 0.05), P3(sg * hu, 0, yR), P3(sg * hu, 0, yR)], N3(sg, 0, 0), UV, wallC, tag)
      }
      roofY = (_u, s) => ye + rise * (1 - Math.abs(s) / hv)
    }
  } else {
    const mark = out.colors.length
    ridgeY = buildRoof(out, ring, { shape: hip ? 'hipped' : 'gabled', y: ye, height: rise, direction: dir, colour })
    for (let i = mark + 3; i < out.colors.length; i += 4) out.colors[i] = tile
  }

  // ---- dormers, skylights, a chimney (rectangular outlines only)
  if (rect) {
    const rh = ridgeY - ye
    const frontV = (fw.nx * vx + fw.nz * vz) >= 0 ? 1 : -1
    const free = Math.max(0, hu - (hip ? hv * 1.05 : 0.9)) // along the ridge, clear of hips and gable ends
    if (free > 0.9 && r() * 100 < HOUSES.dormerShare + (storeys === 1 ? 15 : 0) && rh > 1.7) {
      const n = Math.min(3, Math.floor(free * 2 / 3.2) + 1)
      for (let k = 0; k < n; k++) {
        const u = n === 1 ? (r() - 0.5) * free : -free + (k + 0.5) * (2 * free) / n
        const sF = frontV * hv * 0.6
        const yb = roofY(u, sF)
        const dh = HOUSES.dormer.h, dw = HOUSES.dormer.w / 2
        const yt = yb + dh
        const sBack = frontV * hv * (1 - (yt - ye) / rh)
        out.quad([P3(u - dw, sF, yb - 0.1), P3(u + dw, sF, yb - 0.1), P3(u + dw, sF, yt), P3(u - dw, sF, yt)], [fw.nx, 0, fw.nz], UV, wallC, tag)
        out.quad([P3(u - dw * 0.62, sF + frontV * 0.02, yb + 0.2), P3(u + dw * 0.62, sF + frontV * 0.02, yb + 0.2), P3(u + dw * 0.62, sF + frontV * 0.02, yt - 0.2),
          P3(u - dw * 0.62, sF + frontV * 0.02, yt - 0.2)], [fw.nx, 0, fw.nz], UV, GLASS, surfaceTag('glass'))
        for (const sg of [-1, 1]) {
          out.quad([P3(u + sg * dw, sF, yb - 0.1), P3(u + sg * dw, sBack, yt), P3(u + sg * dw, sBack, yt), P3(u + sg * dw, sF, yt)], N3(sg, 0, 0), UV, wallC, tag)
        }
        out.quad([P3(u - dw - 0.1, sF + frontV * 0.12, yt + 0.02), P3(u + dw + 0.1, sF + frontV * 0.12, yt + 0.02), P3(u + dw + 0.1, sBack, yt + 0.02),
          P3(u - dw - 0.1, sBack, yt + 0.02)], [0, 1, 0], UV, colour, tile)
      }
    }
    // skylights on the back slope
    if (free > 0.8 && rh > 1.2 && r() < 0.5) {
      const k = r() < 0.5 ? 1 : 2
      const kk = rh / hv
      for (let i = 0; i < k; i++) {
        const u = (k === 1 ? 0 : (i - 0.5) * 2) * Math.min(free, 1.6) + (r() - 0.5) * 0.4
        const sa = -frontV * hv * 0.25, sb = -frontV * hv * (0.25 + HOUSES.skylight.h / Math.hypot(hv, rh))
        const w2 = HOUSES.skylight.w / 2
        const q = (uu: number, s: number): V3 => P3(uu, s, roofY(uu, s) + 0.05)
        out.quad([q(u - w2, sa), q(u + w2, sa), q(u + w2, sb), q(u - w2, sb)], N3(0, -frontV * kk, 1), UV, [0.18, 0.24, 0.3], surfaceTag('glass'))
      }
    }
    // a chimney on the ridge, near an end (brick, a cap)
    if (r() < 0.85) {
      const u = (r() < 0.5 ? -1 : 1) * Math.max(0, hu - Math.max(1.2, hv * (hip ? 1.2 : 0.35))) * (0.6 + r() * 0.4)
      const c = P3(u, 0, 0)
      chimney(out, c[0], c[2], ridgeY - 0.6, ridgeY + 1.1)
    }
  } else if (r() < 0.8) {
    chimney(out, centroid.x, centroid.z, ye, ridgeY + 0.9)
  }

  // ---- the plot's street wall, garage and gate gaps, and hedge: DETACHED houses only
  if (row || !st) return
  const mx = fw.a.x + fw.tx * fw.L / 2, mz = fw.a.z + fw.tz * fw.L / 2
  const here = nearestStreet(streets, mx, mz, HOUSES.streetReach)
  if (!here) return
  const setback = here.d - here.half
  if (setback < HOUSES.onStreet || setback > HOUSES.farthest) return
  // the wall line: along the street's tangent, at the pavement's edge, centred on the house front's foot
  let nx = mx - here.qx, nz = mz - here.qz
  const nl = Math.hypot(nx, nz) || 1
  nx /= nl; nz /= nl
  // the tangent, signed so that the house door's side is positive
  const tx = here.tx, tz = here.tz
  const o = here.half + 0.2
  const Lw = Math.min(HOUSES.wall.most, Math.max(HOUSES.wall.least, fw.L + 2 * lerp(HOUSES.wall.side[0], HOUSES.wall.side[1], r())))
  const wallBase: P = { x: here.qx + nx * o, z: here.qz + nz * o }
  // (the wall is a Wall running a→c along the tangent, its normal toward the house)
  // (a Wall's normal is (tz, −tx): the line runs so that normal faces the STREET, which is what a gate's face needs)
  const wallDir = tz * nx - tx * nz > 0 ? { x: -tx, z: -tz } : { x: tx, z: tz }
  const wl = new Wall({ x: wallBase.x - wallDir.x * Lw / 2, z: wallBase.z - wallDir.z * Lw / 2 }, { x: wallBase.x + wallDir.x * Lw / 2, z: wallBase.z + wallDir.z * Lw / 2 })
  // a positive `off` is OUT to the street, so INTO the plot is negative
  const intoPlot = -1
  const doorWorld: P = { x: fw.a.x + fw.tx * doorAlong, z: fw.a.z + fw.tz * doorAlong }
  const pDoor = (doorWorld.x - wl.a.x) * wl.tx + (doorWorld.z - wl.a.z) * wl.tz
  const gateAt = Math.max(1.2, Math.min(Lw - 1.2, pDoor))
  // the wall shall not run into another building: shorten to the first sample inside one, from the gate outward
  const blocked = (p: number): boolean => {
    const x = wl.a.x + wl.tx * p, z = wl.a.z + wl.tz * p
    return others.some((q) => q.id !== b.id && inside(q.ring, x, z))
  }
  let p0 = gateAt, p1 = gateAt
  while (p0 > 0 && !blocked(p0 - 0.5)) p0 -= 0.5
  while (p1 < Lw && !blocked(p1 + 0.5)) p1 += 0.5
  if (p1 - p0 < 6) return
  const wallH = lerp(HOUSES.wall.h[0], HOUSES.wall.h[1], r())
  const railed = r() * 100 < HOUSES.wall.railShare
  const gaps: { a: number; b: number; kind: 'gate' | 'garage' }[] = [{ a: gateAt - HOUSES.wall.gate / 2, b: gateAt + HOUSES.wall.gate / 2, kind: 'gate' }]
  if (r() * 100 < HOUSES.wall.garageShare) {
    const room = (side: number): number => (side > 0 ? p1 - (gateAt + HOUSES.wall.gate / 2) : gateAt - HOUSES.wall.gate / 2 - p0)
    const side = room(1) >= room(-1) ? 1 : -1
    if (room(side) > HOUSES.wall.garage + 1.6) {
      const gc = gateAt + side * (HOUSES.wall.gate / 2 + 0.8 + HOUSES.wall.garage / 2 + r() * Math.min(1.5, room(side) - HOUSES.wall.garage - 1.6))
      gaps.push({ a: gc - HOUSES.wall.garage / 2, b: gc + HOUSES.wall.garage / 2, kind: 'garage' })
    }
  }
  gaps.sort((g, h) => g.a - h.a)
  const fenceC = pick(r, WALL_RENDER)
  const hedgeOn = r() * 100 < HOUSES.hedge.share + (railed ? 25 : 0)
  const hedgeC = pick(r, HEDGE)
  const hedgeH = lerp(HOUSES.hedge.over[0], HOUSES.hedge.over[1], r())
  const gY = (p: number): number => terrain.heightAt(wl.a.x + wl.tx * p, wl.a.z + wl.tz * p)
  const off = (d: number): number => d * intoPlot
  const pieceSpans: [number, number][] = []
  let cur = p0
  for (const g of gaps) { if (g.a > cur + 0.05) pieceSpans.push([cur, g.a]); cur = g.b }
  if (p1 > cur + 0.05) pieceSpans.push([cur, p1])
  const T = HOUSES.wall.t
  const pillar = (p: number): void => {
    const y = gY(p)
    box(out, wl, p - HOUSES.wall.pier / 2, p + HOUSES.wall.pier / 2, off(-HOUSES.wall.pier / 2), off(HOUSES.wall.pier / 2), y - 0.3, y + wallH + 0.25, fenceC, surfaceTag('stucco'))
    box(out, wl, p - HOUSES.wall.pier / 2 - 0.04, p + HOUSES.wall.pier / 2 + 0.04, off(-HOUSES.wall.pier / 2 - 0.04), off(HOUSES.wall.pier / 2 + 0.04), y + wallH + 0.25, y + wallH + 0.33, [0.8, 0.78, 0.72], 0)
  }
  for (const [s0, s1] of pieceSpans) {
    const ya = gY(s0), yb = gY(s1)
    const base = Math.min(ya, yb) - 0.3
    const hh = railed ? HOUSES.wall.lowH : wallH
    const topY = Math.max(ya, yb) + hh
    box(out, wl, s0, s1, off(-T / 2), off(T / 2), base, topY, fenceC, surfaceTag('stucco'))
    box(out, wl, s0, s1, off(-T / 2 - 0.04), off(T / 2 + 0.04), topY, topY + HOUSES.wall.coping, [0.8, 0.78, 0.72], 0)
    if (railed) {
      const rail = HOUSES.wall.railH
      const nbar = Math.max(2, Math.floor((s1 - s0) / 0.16))
      for (let k = 0; k <= nbar; k++) {
        const p = s0 + ((s1 - s0) * k) / nbar
        box(out, wl, p - 0.012, p + 0.012, off(-0.012), off(0.012), topY, topY + rail - HOUSES.wall.lowH, IRON, 0)
      }
      for (const yy of [topY + 0.05, topY + rail - HOUSES.wall.lowH - 0.05]) box(out, wl, s0, s1, off(-0.02), off(0.02), yy - 0.025, yy + 0.025, IRON, 0)
    }
    if (hedgeOn && s1 - s0 > 1.2) {
      const hy = topY + (railed ? 0.2 + hedgeH : hedgeH)
      box(out, wl, s0 + 0.1, s1 - 0.1, off(HOUSES.hedge.behind - HOUSES.hedge.w / 2), off(HOUSES.hedge.behind + HOUSES.hedge.w / 2), base + 0.4, hy, hedgeC, surfaceTag('clipped'))
    }
  }
  for (const g of gaps) {
    pillar(g.a - HOUSES.wall.pier / 2 + 0.0); pillar(g.b + HOUSES.wall.pier / 2)
    const ym = gY((g.a + g.b) / 2)
    const gate = (g.b - g.a)
    if (g.kind === 'gate') {
      wl.rect(out, g.a, g.b, ym, ym + Math.min(wallH, 1.9), off(0), pick(r, DOOR), surfaceTag(r() < 0.5 ? 'planks' : 'metal'))
      box(out, wl, g.a, g.b, off(-T / 2), off(T / 2), ym - 0.05, ym + 0.02, [0.62, 0.6, 0.57], 0)
    } else {
      if (r() < 0.7) wl.rect(out, g.a + 0.05, g.b - 0.05, ym, ym + Math.min(wallH, 2.1), off(0), pick(r, DOOR), surfaceTag(r() < 0.6 ? 'planks' : 'metal'))
      // the drive: a strip of paving from the pavement to the house
      const d = Math.min(setback + 0.3, 6)
      out.quad([wl.at(g.a, ym + 0.04, off(0.1)), wl.at(g.b, ym + 0.04, off(0.1)), wl.at(g.b, ym + 0.04, off(d)), wl.at(g.a, ym + 0.04, off(d))], [0, 1, 0], UV, DRIVE, surfaceTag('concrete'))
    }
    void gate
  }
}

function windowAt(out: MeshBuilder, w: Wall, c: number, yBase: number, sh: number, ground: boolean, _wall: Rgb, trim: Rgb, shutters: boolean, shutterC: Rgb): void {
  const { win } = HOUSES
  const h = ground ? win.hGround : win.h
  const sill = yBase + (ground ? win.sill : sh * 0.18)
  const hw = win.w / 2
  w.rect(out, c - hw - win.frame, c + hw + win.frame, sill - win.frame, sill + h + win.frame, 0.015, trim)
  w.rect(out, c - hw, c + hw, sill, sill + h, 0.03, GLASS, surfaceTag('glass'))
  w.rect(out, c - 0.02, c + 0.02, sill, sill + h, 0.04, trim)
  w.rect(out, c - hw - 0.03, c + hw + 0.03, sill + h * 0.5 - 0.02, sill + h * 0.5 + 0.02, 0.04, trim)
  // the sill, a little proud
  out.quad([w.at(c - hw - 0.1, sill - 0.04, 0.12), w.at(c + hw + 0.1, sill - 0.04, 0.12), w.at(c + hw + 0.1, sill - 0.04, 0.0), w.at(c - hw - 0.1, sill - 0.04, 0.0)], [0, -1, 0], UV, trim, 0)
  if (shutters) {
    const sw = win.shutterW
    w.rect(out, c - hw - 0.04 - sw, c - hw - 0.04, sill - 0.02, sill + h + 0.02, 0.045, shutterC, surfaceTag('planks'))
    w.rect(out, c + hw + 0.04, c + hw + 0.04 + sw, sill - 0.02, sill + h + 0.02, 0.045, shutterC, surfaceTag('planks'))
  }
}

function doorAndPorch(out: MeshBuilder, w: Wall, c: number, y0: number, doorC: Rgb, r: () => number, porchOk: boolean): void {
  const { door } = HOUSES
  const hw = door.w / 2
  w.rect(out, c - hw - 0.08, c + hw + 0.08, y0, y0 + door.h + 0.08, 0.015, [0.95, 0.93, 0.88])
  w.rect(out, c - hw, c + hw, y0 + 0.02, y0 + door.h, 0.035, doorC, surfaceTag('planks'))
  w.rect(out, c - hw * 0.6, c + hw * 0.6, y0 + door.h * 0.62, y0 + door.h * 0.92, 0.045, GLASS, surfaceTag('glass'))
  // two steps up to it
  box(out, w, c - hw - 0.3, c + hw + 0.3, 0, 0.45, y0 - 0.3, y0 + 0.08, [0.66, 0.64, 0.6], surfaceTag('concrete'))
  if (porchOk && r() * 100 < door.porchShare) {
    // a flat canopy on two brackets
    box(out, w, c - hw - 0.35, c + hw + 0.35, 0.02, 0.95, y0 + door.h + 0.15, y0 + door.h + 0.25, [0.45, 0.46, 0.48], 0)
  }
}

function chimney(out: MeshBuilder, x: number, z: number, y0: number, y1: number): void {
  const h = 0.32
  const sides: [number, number, V3][] = [[1, 0, [1, 0, 0]], [-1, 0, [-1, 0, 0]], [0, 1, [0, 0, 1]], [0, -1, [0, 0, -1]]]
  for (const [sx, sz, n] of sides) {
    const px = -sz, pz = sx
    out.quad([[x + sx * h + px * h, y0, z + sz * h + pz * h], [x + sx * h - px * h, y0, z + sz * h - pz * h], [x + sx * h - px * h, y1, z + sz * h - pz * h], [x + sx * h + px * h, y1, z + sz * h + pz * h]], n, UV, CHIMNEY, surfaceTag('brick'))
  }
  const c = 0.4
  out.quad([[x - c, y1, z - c], [x + c, y1, z - c], [x + c, y1, z + c], [x - c, y1, z + c]], [0, 1, 0], UV, [0.4, 0.4, 0.42], 0)
}
