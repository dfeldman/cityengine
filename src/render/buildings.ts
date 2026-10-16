/**
 * Footprint + facade plan → geometry.
 *
 * The plan (`src/city/facade.ts`) has already decided everything interesting; this file only has to build it,
 * and the one judgement it makes is **what gets geometry and what gets paint**. Openings are painted, because
 * a window reveal drawn in the atlas costs nothing and reads correctly at the distance a rider sees it.
 * Everything that breaks the SILHOUETTE is built:
 *
 *      cornice ────────►  a lip proud of the wall at the roofline
 *      balcony ────────►  a slab with a rail, the thing you see first on a Haussmann street
 *      string course ──►  the band that makes a ground floor read as a base
 *      slab bands ─────►  the floor edges a brutalist building leaves showing
 *
 * That split is deliberate. A city of flat extrusions with good textures still looks flat, because at a
 * grazing angle — which is how you see a street when you are on it — the only thing that says a building has
 * depth is its edge against the sky and against the building next door. Ten triangles of cornice buy more
 * than a doubling of texture resolution.
 *
 * Everything for one style is merged into one `VertexData` per tile, so a city is a handful of draw calls
 * rather than one per building. Trail Trainer learned that lesson the expensive way: a triangle budget goes
 * not on detail but on things drawn separately.
 */
import type { WaterFeature } from './water.ts'
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData'
import earcut from 'earcut'
import { KIND_ATLAS, KIND_RAIL, KIND_WALL } from './facade-material.ts'
import { planWall, rng, type Cell, type FacadePlan, type Feature } from '../city/facade.ts'
import { addRoofscape, buildRoof, buildRoofAroundCourts, type Roofscape } from './roofs.ts'
import type { RoofShape } from '../city/package.ts'
import type { PlacedSign } from './landmarks/signage.ts'

/** How many metres of wall one tile of the seamless wall page covers. */
export const WALL_PAGE_METRES = 2.4

export interface AtlasManifest {
  elements: Record<string, { u0: number; v0: number; u1: number; v1: number }[]>
}

/** A footprint ring in local metres, counter-clockwise, first point not repeated. */
export type Ring = { x: number; z: number }[]

/**
 * A growable set of buffers. Babylon wants flat arrays; building them by pushing is far cheaper than
 * concatenating a VertexData per building.
 */
export class MeshBuilder {
  readonly positions: number[] = []
  readonly normals: number[] = []
  readonly uvs: number[] = []
  readonly colors: number[] = []
  readonly indices: number[] = []

  /**
   * Signs the model asked for (render/landmarks/signage.ts), which are NOT geometry.
   *
   * A sign is its own mesh with its own textured, alpha-blended material, because it has to be gated by
   * distance and a landmark's geometry is one mesh that never is. So `sign()` records the request here and
   * whoever placed the model realises it: render/landmarks.ts in the city, model-showcase.ts under `?model=`.
   * Empty and untouched for everything else that builds a mesh, including the whole facade generator.
   */
  readonly signs: PlacedSign[] = []
  /**
   * The clock faces the model carries (render/landmarks/parts.ts `clockFace`), in its own frame: the centre, the
   * horizontal direction the face looks, and the dial's radius. The hands are NOT geometry — they turn with the real
   * time in the region's own time zone (render/clocks.ts), so they are raised as their own nodes when the model is
   * placed (owner, 2026-10-04: "the huge public clocks … actually show correct time … there will be public clocks
   * in every city we ever do").
   */
  readonly clocks: { x: number; y: number; z: number; nx: number; nz: number; r: number; hands?: [number, number, number] }[] = []
  /**
   * The parts of the model that TURN (render/rotors.ts): each drawn into its own builder about its hub at the origin,
   * placed at (x, y, z) in the model's frame and spun about (nx, ny, nz) at `rpm` turns a minute — a windmill's sails.
   */
  readonly rotors: { x: number; y: number; z: number; nx: number; ny?: number; nz: number; mb: MeshBuilder; rpm: number }[] = []
  /** the model's moving water — jets, sheets, pools, splashes (render/water.ts), in its own frame */
  readonly water: WaterFeature[] = []

  /**
   * A raised deck this model plants (render/plants.ts, docs/SKYPARKS.md): a ring in the model's own local
   * frame and the height its ground sits at, LOCAL to the model's own origin (before it is placed and scaled
   * into the city). A skypark's ground is not the terrain — Salesforce Park is 21 m up, on the Transit
   * Center's roof — so a builder that draws such a deck records it here, and whoever places the model
   * (render/landmarks.ts) turns it into world-space planting the same way it turns the mesh itself into a
   * placed landmark: same rotation, same translation, same scale. Empty and untouched for everything else.
   */
  // (`keepOff`: how far in from the ring's edge trees stand — 6.5 m unless a bed says; `trees`/`shrubs`: which
  // planting layers plant it, both unless false — a designed garden plants its beds, not its paths)
  /**
   * Ground the landmark PAVES at street level, in its own frame: draped on the terrain by the city's ground pass
   * (render/city.ts `paveGround`), over the grass the city's ground otherwise is. The concourse under the Transit
   * Center, which a model cannot floor itself — the terrain rises 4 m along it, and a flat floor is buried at one end.
   */
  readonly grounds: { x: number; z: number }[][] = []
  /** `spacing`: trees at this pitch, past the area density (park-planting.ts `deckRow`) — a row along a path */
  readonly decks: { ring: { x: number; z: number }[]; y: number; keepOff?: number; trees?: boolean; shrubs?: boolean; spacing?: number }[] = []

  /** One quad, wound so its face points along `n`. `uv` is the four corners, in order bl, br, tr, tl. */
  quad(
    p: [number, number, number][],
    n: [number, number, number],
    uv: [number, number][],
    tint: [number, number, number],
    kind: number,
  ): void {
    const base = this.positions.length / 3
    for (let i = 0; i < 4; i++) {
      this.positions.push(p[i][0], p[i][1], p[i][2])
      this.normals.push(n[0], n[1], n[2])
      this.uvs.push(uv[i][0], uv[i][1])
      this.colors.push(tint[0], tint[1], tint[2], kind)
    }
    // Wound to face its normal, whatever order the corners came in: the drawn side is the one where
    // (p1 − p0) × (p2 − p0) points AGAINST it (see pushUpward). Every band's top — each cornice, string course
    // and balcony slab in the city — came in wound the other way, so from above the top was culled and the
    // dark soffit showed through it: a black line along every building (BUGS.md #23). A quad with no normal
    // keeps its order.
    const e1 = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]]
    const e2 = [p[2][0] - p[0][0], p[2][1] - p[0][1], p[2][2] - p[0][2]]
    const facing = (e1[1] * e2[2] - e1[2] * e2[1]) * n[0] + (e1[2] * e2[0] - e1[0] * e2[2]) * n[1] + (e1[0] * e2[1] - e1[1] * e2[0]) * n[2]
    if (facing > 0) this.indices.push(base, base + 2, base + 1, base, base + 3, base + 2)
    else this.indices.push(base, base + 1, base + 2, base, base + 2, base + 3)
  }

  get triangles(): number { return this.indices.length / 3 }

  toVertexData(): VertexData {
    // typed arrays: a quarter to a half the memory of JS number arrays while the upload is in flight
    const vd = new VertexData()
    vd.positions = new Float32Array(this.positions)
    vd.normals = new Float32Array(this.normals)
    vd.uvs = new Float32Array(this.uvs)
    vd.colors = new Float32Array(this.colors)
    vd.indices = this.positions.length / 3 > 65535 ? new Uint32Array(this.indices) : new Uint16Array(this.indices)
    return vd
  }
}

const rgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]
}

/**
 * Pick which painting of an element this cell gets. The grammar hands over a 0–1 `variant`; the atlas may
 * hold one, two or three paintings of that element, and neither side should have to know the other's count.
 */
function uvFor(atlas: AtlasManifest, element: string, variant: number): { u0: number; v0: number; u1: number; v1: number } | null {
  const set = atlas.elements[element]
  if (!set || set.length === 0) return null
  return set[Math.min(set.length - 1, Math.floor(variant * set.length))]
}

/** How far the ring runs inward from the middle of edge i, along its inward normal (to the first other edge hit). */
function depthBehind(ring: { x: number; z: number }[], i: number): number {
  const a = ring[i], b = ring[(i + 1) % ring.length]
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, dx = -(b.z - a.z) / L, dz = (b.x - a.x) / L   // inward, CCW ring
  let best = Infinity
  for (let j = 0; j < ring.length; j++) {
    if (j === i) continue
    const p = ring[j], q = ring[(j + 1) % ring.length]
    const ex = q.x - p.x, ez = q.z - p.z, den = dx * ez - dz * ex
    if (Math.abs(den) < 1e-9) continue
    const t = ((p.x - mx) * ez - (p.z - mz) * ex) / den, u = ((p.x - mx) * dz - (p.z - mz) * dx) / den
    if (t > 0.05 && u >= 0 && u <= 1) best = Math.min(best, t)
  }
  return best
}

/** Build one wall of a building, from corner `a` to corner `b`, at the plan's storey heights. */
function wall(
  out: MeshBuilder,
  a: { x: number; z: number },
  b: { x: number; z: number },
  plan: FacadePlan,
  atlas: AtlasManifest,
  seed: number,
  baseY: number,
  street: StreetFacing | null = null,
  /** where a passage goes through this wall: its centre `t` along it, half-width, and the arch's height */
  arches: Arch[] = [],
  /** how far the building runs back behind this wall's middle (a front gable's roof may not run further) */
  depth = Infinity,
): void {
  const dx = b.x - a.x
  const dz = b.z - a.z
  const len = Math.hypot(dx, dz)
  if (len < 0.4) return
  const ux = dx / len
  const uz = dz / len
  // Outward normal for a counter-clockwise ring in a right-handed y-up frame.
  const nx = uz
  const nz = -ux

  const w = planWall(plan, len, seed)
  const tint = rgb(plan.palette.wall)
  // the ground storey's own paint, where the palette gives one: its cells are the ones drawn with the style's
  // ground element (a shopfront, an arcade, a stoop, a glazed front) rather than the wall's
  const groundTint = plan.palette.ground ? rgb(plan.palette.ground) : tint
  const groundEls = new Set([`${plan.style}/${plan.ground}`, `${plan.style}/carriage`])
  const tintOf = (el: string): [number, number, number] => (groundEls.has(el) ? groundTint : tint)
  const at = (t: number, y: number): [number, number, number] => [a.x + ux * t, baseY + y, a.z + uz * t]

  // the cells an arch passes through are left out: the opening is a real hole, and what is left of those cells
  // round the arch is filled with plain wall below
  const cut = (c: Cell): Arch | undefined => arches.find((h) => c.x1 > h.t - h.half && c.x0 < h.t + h.half && c.y0 < h.top)
  const holes = new Map<Arch, { x0: number; x1: number; y1: number }>()
  for (const c of w.cells) {
    const h = cut(c)
    if (h) {
      const got = holes.get(h) ?? { x0: Infinity, x1: -Infinity, y1: 0 }
      holes.set(h, { x0: Math.min(got.x0, c.x0), x1: Math.max(got.x1, c.x1), y1: Math.max(got.y1, c.y1) })
      continue
    }
    const uv = uvFor(atlas, c.element, c.variant)
    if (uv) {
      out.quad(
        [at(c.x0, c.y0), at(c.x1, c.y0), at(c.x1, c.y1), at(c.x0, c.y1)],
        [nx, 0, nz],
        [[uv.u0, uv.v1], [uv.u1, uv.v1], [uv.u1, uv.v0], [uv.u0, uv.v0]],
        tintOf(c.element), KIND_ATLAS,
      )
    } else {
      // No painting for this element: fall back to the seamless wall page, in metres so it tiles honestly.
      const s = WALL_PAGE_METRES
      out.quad(
        [at(c.x0, c.y0), at(c.x1, c.y0), at(c.x1, c.y1), at(c.x0, c.y1)],
        [nx, 0, nz],
        [[c.x0 / s, c.y1 / s], [c.x1 / s, c.y1 / s], [c.x1 / s, c.y0 / s], [c.x0 / s, c.y0 / s]],
        tintOf(c.element), KIND_WALL,
      )
    }
  }

  // the wall round each arch: plain wall page from the hole's edges in to the arch's curve
  const s0 = WALL_PAGE_METRES
  const wq = (p: [number, number][]): void => {
    out.quad(p.map(([t, y]) => at(t, y)) as [number, number, number][], [nx, 0, nz],
      p.map(([t, y]) => [t / s0, y / s0]) as [number, number][], tint, KIND_WALL)
  }
  for (const [h, r] of holes) {
    const l = h.t - h.half
    const rr = h.t + h.half
    const spring = h.top * 0.7
    if (l > r.x0) wq([[r.x0, 0], [l, 0], [l, r.y1], [r.x0, r.y1]])
    if (r.x1 > rr) wq([[rr, 0], [r.x1, 0], [r.x1, r.y1], [rr, r.y1]])
    const seg = 10
    for (let i = 0; i < seg; i++) {
      const a0 = Math.PI * (i / seg)
      const a1 = Math.PI * ((i + 1) / seg)
      const p0: [number, number] = [h.t - Math.cos(a0) * h.half, spring + Math.sin(a0) * h.top * 0.3]
      const p1: [number, number] = [h.t - Math.cos(a1) * h.half, spring + Math.sin(a1) * h.top * 0.3]
      wq([p0, p1, [p1[0], r.y1], [p0[0], r.y1]])
    }
  }

  for (const f of w.features) {
    // nothing that sticks out may cross the opening (a sill, a string course low enough to cut it)
    if (arches.some((h) => f.y0 < h.top && (f.x1 ?? len) > h.t - h.half && (f.x0 ?? 0) < h.t + h.half)) continue
    if (f.kind === 'bay') bay(out, f, at, ux, uz, nx, nz, plan, atlas, seed, tint)
    else if (f.kind === 'fireEscape') fireEscape(out, f, at, nx, nz)
    else if (f.kind === 'gable') gable(out, f, at, nx, nz, len, rgb(plan.palette.trim), depth)
    else feature(out, f, a, b, ux, uz, nx, nz, len, baseY, plan)
  }
  if (street && arches.length === 0) awnings(out, w.cells, plan, seed, at, ux, uz, nx, nz, street)
}

/**
 * A bay window: three small walls standing out from the facade — a front parallel to it and two cheeks at
 * 45° — each with a window from the style's own cells, and a cap on top. The one feature that needed the
 * grammar to grow (IMPROVEMENTS §2.6); it is what a San Francisco Victorian is.
 */
function bay(out: MeshBuilder, f: Feature, at: (t: number, y: number) => [number, number, number],
             ux: number, uz: number, nx: number, nz: number, plan: FacadePlan, atlas: AtlasManifest, seed: number,
             tint: [number, number, number]): void {
  const x0 = f.x0!
  const x1 = f.x1!
  const d = f.depth
  const p = (t: number, y: number, off: number): [number, number, number] => {
    const q = at(t, y)
    return [q[0] + nx * off, q[1], q[2] + nz * off]
  }
  const uv = uvFor(atlas, `${plan.style}/window`, (seed >>> 3) % 97 / 97)
  const faces: [number, number, number, number][] = [
    // [t0, off0, t1, off1]
    [x0, 0, x0 + d, d], [x0 + d, d, x1 - d, d], [x1 - d, d, x1, 0],
  ]
  const trim = rgb(plan.palette.trim)
  for (const [t0, o0, t1, o1] of faces) {
    // outward normal of this face: its direction along the wall turned outward
    const ex = ux * (t1 - t0) + nx * (o1 - o0)
    const ez = uz * (t1 - t0) + nz * (o1 - o0)
    const el = Math.hypot(ex, ez) || 1
    const n: [number, number, number] = [ez / el, 0, -ex / el]
    const quad: [number, number, number][] = [p(t0, f.y0, o0), p(t1, f.y0, o1), p(t1, f.y1, o1), p(t0, f.y1, o0)]
    if (uv) out.quad(quad, n, [[uv.u0, uv.v1], [uv.u1, uv.v1], [uv.u1, uv.v0], [uv.u0, uv.v0]], tint, KIND_ATLAS)
    else out.quad(quad, n, [[0, 0], [1, 0], [1, 1], [0, 1]], tint, KIND_WALL)
  }
  // the cap over it and the soffit under it, in the trim colour
  const cap = (y: number, up: boolean): void => {
    const pts: [number, number, number][] = [p(x0 - 0.05, y, 0), p(x0 + d, y, d + 0.08), p(x1 - d, y, d + 0.08), p(x1 + 0.05, y, 0)]
    out.quad(up ? pts : [...pts].reverse(), [0, up ? 1 : -1, 0], [[0, 0], [0.3, 0], [0.3, 0.1], [0, 0.1]], trim, KIND_WALL)
  }
  cap(f.y1, true)
  cap(f.y0, false)
  // a band of trim between storeys on the bay's front
  out.quad([p(x0 + d, f.y1 - 0.25, d + 0.02), p(x1 - d, f.y1 - 0.25, d + 0.02), p(x1 - d, f.y1, d + 0.02), p(x0 + d, f.y1, d + 0.02)],
    [nx, 0, nz], [[0, 0], [0.3, 0], [0.3, 0.1], [0, 0.1]], trim, KIND_WALL)
}

/** A fire escape storey: an iron platform, its railing, and a stair up to the platform above. */
function fireEscape(out: MeshBuilder, f: Feature, at: (t: number, y: number) => [number, number, number],
                    nx: number, nz: number): void {
  const iron: [number, number, number] = [0.12, 0.12, 0.13]
  const x0 = f.x0!
  const x1 = f.x1!
  const d = f.depth
  const p = (t: number, y: number, off: number): [number, number, number] => {
    const q = at(t, y)
    return [q[0] + nx * off, q[1], q[2] + nz * off]
  }
  const y = f.y0 + 0.05
  const flat: [number, number][] = [[0, 0], [0.1, 0], [0.1, 0.1], [0, 0.1]]
  // the platform, top and underside
  out.quad([p(x0, y, 0), p(x1, y, 0), p(x1, y, d), p(x0, y, d)].reverse(), [0, 1, 0], flat, iron, KIND_WALL)
  out.quad([p(x0, y - 0.06, 0), p(x1, y - 0.06, 0), p(x1, y - 0.06, d), p(x0, y - 0.06, d)], [0, -1, 0], flat, iron, KIND_WALL)
  // the railing: a top rail and a bottom rail on three sides, and uprights
  for (const ry of [0.95, 0.45]) {
    out.quad([p(x0, y + ry, d), p(x1, y + ry, d), p(x1, y + ry + 0.05, d), p(x0, y + ry + 0.05, d)], [nx, 0, nz], flat, iron, KIND_WALL)
    for (const t of [x0, x1]) {
      out.quad([p(t, y + ry, 0), p(t, y + ry, d), p(t, y + ry + 0.05, d), p(t, y + ry + 0.05, 0)], [0, 0, 0], flat, iron, KIND_WALL)
    }
  }
  for (let t = x0; t <= x1 + 0.01; t += 0.5) {
    out.quad([p(t - 0.02, y, d), p(t + 0.02, y, d), p(t + 0.02, y + 1.0, d), p(t - 0.02, y + 1.0, d)], [nx, 0, nz], flat, iron, KIND_WALL)
  }
  // the stair: a diagonal strip from this platform's left end to the next one's right end
  const h = f.y1 - f.y0
  const s0 = x0 + 0.2
  const s1 = x1 - 0.2
  const o = d * 0.55
  out.quad([p(s0, y, o - 0.3), p(s0, y, o + 0.3), p(s1, y + h, o + 0.3), p(s1, y + h, o - 0.3)], [0, 1, 0], flat, iron, KIND_WALL)
}

/** A gable on the street wall: a triangle above the cornice, in the wall colour, edged in the trim. */
function gable(out: MeshBuilder, f: Feature, at: (t: number, y: number) => [number, number, number],
               nx: number, nz: number, len: number, trim: [number, number, number], depth = Infinity): void {
  const off = (q: [number, number, number], o: number): [number, number, number] => [q[0] + nx * o, q[1], q[2] + nz * o]
  const apex = at(len / 2, f.y1)
  const tint = rgb(f.colour)
  const flat: [number, number][] = [[0, 0], [0.4, 0], [0.4, 0.2], [0, 0.2]]
  out.quad([off(at(0, f.y0), 0.02), off(at(len, f.y0), 0.02), off(apex, 0.02), off(apex, 0.02)], [nx, 0, nz], flat, tint, KIND_WALL)
  // the raking cornices along its two top edges
  for (const [a0, a1] of [[at(-0.15, f.y0 - 0.05), apex], [apex, at(len + 0.15, f.y0 - 0.05)]] as const) {
    out.quad([off(a0, 0.03), off(a1, 0.03), off([a1[0], a1[1] + 0.22, a1[2]], 0.03), off([a0[0], a0[1] + 0.22, a0[2]], 0.03)],
      [nx, 0, nz], flat, trim, KIND_WALL)
  }
  /*
   * …and the ROOF behind it (owner, 2026-10-02: "victorians have a facade that's one-dimensional and gabled. this looks
   * weird even from the ground"). The gable was a cut-out on the street wall with the flat roof behind: seen at any
   * angle, a triangle of card. Now two shingled slopes run back from its raking edges along a ridge, and a second gable
   * closes them at the back — a front-gabled house, as the Italianates and Stick houses are. As deep as the front is
   * wide, within 3–7 m: the street sees a roof, and it does not run out over a short lot.
   */
  // …and never past the back of the building: on a short lot it ran out over the neighbour, a roof in mid-air
  // (owner, 2026-10-16, upper Kearny: "dormer disconnected from house")
  const deep = Math.min(Math.max(3, Math.min(7, len)), Math.max(1, depth - 0.3))
  const back = (q: [number, number, number]): [number, number, number] => [q[0] - nx * deep, q[1], q[2] - nz * deep]
  const l0 = at(-0.1, f.y0 - 0.05)
  const r0 = at(len + 0.1, f.y0 - 0.05)
  const top: [number, number, number] = [apex[0], apex[1] + 0.12, apex[2]]
  const roof: [number, number, number] = [0.3, 0.29, 0.3]
  // each slope's normal: up and out to its side
  const across = [r0[0] - l0[0], 0, r0[2] - l0[2]]
  const al = Math.hypot(across[0], across[2]) || 1
  const rise = Math.max(0.1, f.y1 - f.y0)
  const run = len / 2
  const k = 1 / Math.hypot(rise, run)
  const sideN = (s: number): [number, number, number] => [(-across[0] / al) * s * rise * k, run * k, (-across[2] / al) * s * rise * k]
  out.quad([l0, top, back(top), back(l0)], sideN(1), flat, roof, KIND_WALL)
  out.quad([top, r0, back(r0), back(top)], sideN(-1), flat, roof, KIND_WALL)
  out.quad([back(at(0, f.y0)), back(at(len, f.y0)), back(apex), back(apex)], [-nx, 0, -nz], flat, tint, KIND_WALL)
}

/**
 * What a street-facing wall is on: `rate` is the share of its shop runs with an awning (the region's, lower
 * off the main streets), `main` whether it is a through street — where the awnings are deep café blinds.
 */
/** A passage through a wall (render/passages.ts draws its vault): centre along the wall, half-width, crown height. */
export interface Arch { t: number; half: number; top: number }

export interface StreetFacing {
  rate: number
  main: boolean
  /** how far the pavement in front of this wall is above the building's base (a hillside's uphill side) */
  rise?: number
  /** wall to kerb (m): an awning stops short of it, so a narrow street's blinds do not roof the road */
  pavement?: number | null
}

const AWNING_COLOURS: [number, number, number][] = [
  [0.62, 0.14, 0.12], [0.14, 0.34, 0.22], [0.13, 0.19, 0.36], [0.52, 0.1, 0.16], [0.66, 0.48, 0.16],
]
const CREAM: [number, number, number] = [0.92, 0.89, 0.8]

/**
 * Canvas awnings — the stores bannes — over the shopfronts of a street-facing wall: a sloping cloth from
 * the wall out over the pavement, a valance off its front edge, the two triangular cheeks. The shopfront
 * bays are taken in runs of one to three, because a café's blind spans its whole front, not one window;
 * each run gets one with the street's `rate`. On a main street they are deep (up to 2.2 m, over the café
 * tables) and often striped with cream; elsewhere shallow and plain. Anchored just under the fascia board
 * where the shop's name hangs (signs.ts puts it at max(2.8, ground top − 0.85)), and never lower at the
 * front than head height.
 */
function awnings(out: MeshBuilder, cells: Cell[], plan: FacadePlan, seed: number,
                 at: (t: number, y: number) => [number, number, number],
                 ux: number, uz: number, nx: number, nz: number, street: StreetFacing): void {
  const ground = plan.storeys.find((s) => s.index === 0)
  if (!ground || street.rate <= 0) return
  const fascia = Math.max(2.8, ground.y1 - 0.85)
  // no higher than 3.1 m at the wall, however tall the shop: the chase camera rides at 3.5 m and passed
  // under the cloth of a tall ground floor's blind (BUGS.md #16)
  const top = Math.min(fascia - 0.47, 3.1)
  const valance = 0.25
  const off = (p: [number, number, number], d: number, dy: number): [number, number, number] =>
    [p[0] + nx * d, p[1] + dy, p[2] + nz * d]
  // a patch of the wall page small enough to read as flat canvas, not as the stone's joints
  const FLAT: [number, number][] = [[0.02, 0.02], [0.03, 0.02], [0.03, 0.03], [0.02, 0.03]]
  const shops = cells.filter((c) => c.element.endsWith('/shopfront') && c.y0 <= 0.5).sort((p, q) => p.x0 - q.x0)
  const r = rng(seed ^ 0x0a3b1e5)
  for (let i = 0; i < shops.length;) {
    // a run of adjacent shop bays
    let j = i + 1
    const want = 1 + Math.floor(r() * 3)
    while (j < shops.length && j - i < want && Math.abs(shops[j].x0 - shops[j - 1].x1) < 0.3) j++
    const run = shops.slice(i, j)
    i = j
    if (r() >= street.rate) continue
    let depth = street.main ? 1.5 + r() * 0.7 : 0.9 + r() * 0.3
    if (street.pavement != null) depth = Math.min(depth, Math.max(0.6, street.pavement - 0.3))
    // on a slope the uphill walls' shopfronts are partly buried; an awning there would lie on the pavement
    const room = top - valance - 2.3 - Math.max(0, street.rise ?? 0)
    if (room < 0.15) continue
    let drop = Math.min(depth * 0.36, room)
    if (drop < depth * 0.2) depth = drop / 0.2
    const pick = r()
    const tint: [number, number, number] = pick < 0.25 ? rgb(plan.palette.accent)
      : AWNING_COLOURS[Math.floor(r() * AWNING_COLOURS.length)]
    const stripes = street.main && r() < 0.5
    const x0 = run[0].x0 + 0.08
    const x1 = run[run.length - 1].x1 - 0.08
    const n = stripes ? Math.max(3, Math.round((x1 - x0) / 0.32)) : 1
    for (let k = 0; k < n; k++) {
      const a0 = x0 + ((x1 - x0) * k) / n
      const a1 = x0 + ((x1 - x0) * (k + 1)) / n
      const c = stripes && k % 2 === 1 ? CREAM : tint
      const wl = at(a0, top)
      const wr = at(a1, top)
      const fl = off(wl, depth, -drop)
      const fr = off(wr, depth, -drop)
      // the cloth, both faces, so it reads from the pavement below and the street beyond
      out.quad([fl, fr, wr, wl], [nx * 0.36, 0.93, nz * 0.36], FLAT, c, KIND_WALL)
      out.quad([wl, wr, fr, fl], [0, -1, 0], FLAT, [c[0] * 0.6, c[1] * 0.6, c[2] * 0.6], KIND_WALL)
      // the valance
      const vl = off(fl, 0, -valance)
      const vr = off(fr, 0, -valance)
      out.quad([vl, vr, fr, fl], [nx, 0, nz], FLAT, c, KIND_WALL)
      out.quad([fl, fr, vr, vl], [-nx, 0, -nz], FLAT, c, KIND_WALL)
    }
    // the cheeks, as degenerate quads (a triangle each), both faces
    const wl = at(x0, top)
    const wr = at(x1, top)
    const fl = off(wl, depth, -drop)
    const fr = off(wr, depth, -drop)
    out.quad([wl, fl, fl, off(wl, 0, 0)], [-ux, 0, -uz], FLAT, tint, KIND_WALL)
    out.quad([wl, off(wl, 0, 0), fl, fl], [-ux, 0, -uz], FLAT, tint, KIND_WALL)
    out.quad([fr, wr, off(wr, 0, 0), fr], [ux, 0, uz], FLAT, tint, KIND_WALL)
    out.quad([fr, fr, off(wr, 0, 0), wr], [ux, 0, uz], FLAT, tint, KIND_WALL)
  }
}

/**
 * The things that stick out. Each is a small box: a face proud of the wall, a soffit underneath it that
 * catches the shadow, and a top the sun lands on. The top and soffit are what make a cornice read as a
 * cornice rather than as a painted stripe.
 */
function feature(
  out: MeshBuilder,
  f: Feature,
  a: { x: number; z: number },
  _b: { x: number; z: number },
  ux: number, uz: number, nx: number, nz: number,
  len: number, baseY: number, plan: FacadePlan,
): void {
  /**
   * A band that runs the whole wall is extended past both ends by its own depth, so it MITRES at the corner.
   *
   * A cornice stands proud of the wall; where two walls meet, each one's cornice stopped exactly at the
   * corner and left a square notch the size of its own projection — a chip out of the roofline at every
   * corner of every building in the city, and very visible against the sky. Running each one a little past
   * the end lets the two overlap and close it. Features that cover only part of a wall — a sill, a balcony
   * on one bay — are left alone, because they have no neighbour to meet.
   */
  const full = f.x0 === undefined && f.x1 === undefined
  const x0 = full ? -f.depth : (f.x0 ?? 0)
  const x1 = full ? len + f.depth : (f.x1 ?? len)
  if (x1 - x0 < 0.05) return
  const d = f.depth
  const tint = rgb(f.colour)
  const s = WALL_PAGE_METRES
  const uvq: [number, number][] = [[0, 0], [(x1 - x0) / s, 0], [(x1 - x0) / s, d / s], [0, d / s]]

  const at = (t: number, y: number, off: number): [number, number, number] =>
    [a.x + ux * t + nx * off, baseY + y, a.z + uz * t + nz * off]

  if (f.kind === 'balcony') {
    // A balcony is a THIN slab you stand on plus an openwork rail to lean over — not a solid metre of wall.
    // Drawn as one it reads as a black stripe across the building, which is what it did on the first pass.
    const slabTop = f.y0 + 0.14
    const railTop = f.y0 + 0.95
    const railTint = tint
    // the slab is STONE, the facade's trim — in the rail's dark iron it was a black band seen from any angle
    const slab = rgb(plan.palette.trim)
    // the slab: edge, top, soffit
    out.quad([at(x0, f.y0, d), at(x1, f.y0, d), at(x1, slabTop, d), at(x0, slabTop, d)],
      [nx, 0, nz], uvq, slab, KIND_WALL)
    out.quad([at(x0, slabTop, 0), at(x1, slabTop, 0), at(x1, slabTop, d), at(x0, slabTop, d)],
      [0, 1, 0], uvq, slab, KIND_WALL)
    out.quad([at(x0, f.y0, d), at(x1, f.y0, d), at(x1, f.y0, 0), at(x0, f.y0, 0)],
      [0, -1, 0], uvq, shadeRgb(slab, 0.8), KIND_WALL)
    // the rail, set at the slab's outer edge, with a lighter cap along the top
    out.quad([at(x0, slabTop, d), at(x1, slabTop, d), at(x1, railTop, d), at(x0, railTop, d)],
      [nx, 0, nz], [[x0, 0], [x1, 0], [x1, 1], [x0, 1]], railTint, KIND_RAIL)
    out.quad([at(x0, railTop, d - 0.05), at(x1, railTop, d - 0.05), at(x1, railTop, d), at(x0, railTop, d)],
      [0, 1, 0], uvq, rgb(plan.palette.trim), KIND_WALL)
    return
  }

  // Everything else is a band proud of the wall: a face, a top the sun lands on, and a soffit in shadow.
  out.quad([at(x0, f.y0, d), at(x1, f.y0, d), at(x1, f.y1, d), at(x0, f.y1, d)],
    [nx, 0, nz], [[0, 0], [(x1 - x0) / s, 0], [(x1 - x0) / s, (f.y1 - f.y0) / s], [0, (f.y1 - f.y0) / s]],
    tint, KIND_WALL)
  out.quad([at(x0, f.y1, 0), at(x1, f.y1, 0), at(x1, f.y1, d), at(x0, f.y1, d)],
    [0, 1, 0], uvq, tint, KIND_WALL)
  out.quad([at(x0, f.y0, d), at(x1, f.y0, d), at(x1, f.y0, 0), at(x0, f.y0, 0)],
    [0, -1, 0], uvq, tint, KIND_WALL)
}

/**
 * A flat roof: the footprint, capped.
 *
 * Properly triangulated, not fanned about the centroid. A fan is only correct for a convex polygon, and city
 * blocks are anything but — an L-shaped building or a courtyard block fanned from its centre throws triangles
 * right across the block and out the other side. With relation multipolygons in the bake, which are mostly
 * courtyard blocks, that put several enormous grey slabs across the sky at roof height.
 */
/**
 * A polygon with holes, capped. The road surface of a city block is exactly this: one outline with a hole in
 * it for every block the streets go round.
 */
export function capPolygonWithHoles(out: MeshBuilder, rings: { x: number; z: number }[][], y: number,
                                    tint: [number, number, number], kind: number,
                                    uvScale = WALL_PAGE_METRES, maxEdge?: number): void {
  if (rings.length === 0 || rings[0].length < 3) return
  const flat: number[] = []
  const holes: number[] = []
  const all: { x: number; z: number }[] = []
  for (let r = 0; r < rings.length; r++) {
    if (r > 0) holes.push(all.length)
    for (const p of rings[r]) { flat.push(p.x, p.z); all.push(p) }
  }
  const tris = earcut(flat, holes)
  const base = out.positions.length / 3
  for (const p of all) {
    out.positions.push(p.x, y, p.z)
    out.normals.push(0, 1, 0)
    out.uvs.push(p.x / uvScale, p.z / uvScale)
    out.colors.push(tint[0], tint[1], tint[2], kind)
  }
  // Wound by the outer ring's own orientation. Note that the ground materials also draw with back-face
  // culling OFF, and that is not belt-and-braces: a polygon clipper's ring winding is not something worth
  // depending on, the normals here are set explicitly to point up so lighting does not care, and when the
  // winding did go the other way the entire road network and every pavement in the city became invisible
  // while remaining present, ready and in the active mesh list — which is a very expensive thing to debug.
  const indexStart = out.indices.length
  pushUpward(out, base, tris, all)
  if (maxEdge) subdivideLastTriangles(out, indexStart, y, tint, kind, uvScale, maxEdge)
}

/**
 * Earcut on a flat polygon gives the MINIMAL triangulation — a 200 m water tile becomes two triangles
 * 200 m+ on a side. That is fine far out on open water (nobody gets there, nothing occludes anything) but
 * breaks depth precision and per-vertex interpolation right at a shoreline, where the rider actually is
 * (BUGS.md #154). This is opt-in (`maxEdge` on `capPolygonWithHoles`) rather than automatic, because the
 * same function draws every park, plaza and paved area in the city, and those do not need it.
 *
 * Splits every triangle just pushed (from `base` to the end of `out.indices`) whose longest edge exceeds
 * `maxEdge`, by repeated longest-edge bisection — the standard scheme that always terminates and never
 * produces a sliver worse than its parent. The surface is flat, so this adds no silhouette detail, only
 * resolution: every new vertex is a plain interpolation of x/z (and therefore y, uv, colour) along an edge
 * that was already perfectly straight.
 */
function subdivideLastTriangles(out: MeshBuilder, indexStart: number, y: number, tint: [number, number, number],
                                kind: number, uvScale: number, maxEdge: number): void {
  const oldIndices = out.indices.splice(indexStart, out.indices.length - indexStart)
  const get = (i: number): { x: number; z: number } => ({ x: out.positions[i * 3], z: out.positions[i * 3 + 2] })
  const bisect = (a: { x: number; z: number }, b: { x: number; z: number }, c: { x: number; z: number },
                  depth: number): { x: number; z: number }[][] => {
    const dAB = Math.hypot(a.x - b.x, a.z - b.z)
    const dBC = Math.hypot(b.x - c.x, b.z - c.z)
    const dCA = Math.hypot(c.x - a.x, c.z - a.z)
    const m = Math.max(dAB, dBC, dCA)
    if (m <= maxEdge || depth > 12) return [[a, b, c]]
    if (m === dAB) {
      const mid = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 }
      return [...bisect(a, mid, c, depth + 1), ...bisect(mid, b, c, depth + 1)]
    }
    if (m === dBC) {
      const mid = { x: (b.x + c.x) / 2, z: (b.z + c.z) / 2 }
      return [...bisect(b, mid, a, depth + 1), ...bisect(mid, c, a, depth + 1)]
    }
    const mid = { x: (c.x + a.x) / 2, z: (c.z + a.z) / 2 }
    return [...bisect(c, mid, b, depth + 1), ...bisect(mid, a, b, depth + 1)]
  }
  for (let i = 0; i < oldIndices.length; i += 3) {
    const a = get(oldIndices[i]), b = get(oldIndices[i + 1]), c = get(oldIndices[i + 2])
    for (const [p0, p1, p2] of bisect(a, b, c, 0)) {
      const nbase = out.positions.length / 3
      for (const p of [p0, p1, p2]) {
        out.positions.push(p.x, y, p.z)
        out.normals.push(0, 1, 0)
        out.uvs.push(p.x / uvScale, p.z / uvScale)
        out.colors.push(tint[0], tint[1], tint[2], kind)
      }
      out.indices.push(nbase, nbase + 1, nbase + 2)
    }
  }
}

/**
 * Each triangle wound to face UP, decided per triangle from its own corners rather than from the ring's
 * orientation. The ring-sign rule had it backwards: EVERY flat roof in the city (and every flat top of a
 * hipped roof) was wound to face down and culled — hollow boxes, chimneys and dormers standing on nothing
 * (user: "drawn with no roof"). Measured in the renderer: the side drawn is the one where the y of
 * (b − a) × (c − a) is negative.
 */
function pushUpward(out: MeshBuilder, base: number, tris: number[], pts: { x: number; z: number }[]): void {
  for (let i = 0; i < tris.length; i += 3) {
    const a = pts[tris[i]]
    const b = pts[tris[i + 1]]
    const c = pts[tris[i + 2]]
    // the y of (b − a) × (c − a); NEGATIVE is the side the renderer draws (see above)
    const ny = (b.z - a.z) * (c.x - a.x) - (b.x - a.x) * (c.z - a.z)
    if (ny <= 0) out.indices.push(base + tris[i], base + tris[i + 1], base + tris[i + 2])
    else out.indices.push(base + tris[i], base + tris[i + 2], base + tris[i + 1])
  }
}


export function capPolygon(out: MeshBuilder, ring: Ring, y: number, tint: [number, number, number],
                           kind: number, uvScale = WALL_PAGE_METRES): void {
  if (ring.length < 3) return
  const flat: number[] = []
  for (const p of ring) flat.push(p.x, p.z)
  const tris = earcut(flat)
  const base = out.positions.length / 3
  for (const p of ring) {
    out.positions.push(p.x, y, p.z)
    out.normals.push(0, 1, 0)
    out.uvs.push(p.x / uvScale, p.z / uvScale)
    out.colors.push(tint[0], tint[1], tint[2], kind)
  }
  pushUpward(out, base, tris, ring)
}



/**
 * One building: every wall of the ring, plus its roof.
 *
 * The roof is not an afterthought here. A city of flat-topped extrusions reads as a model however good the
 * walls are, because the line a building makes against the sky is the first thing the eye picks up — and a
 * Paris mansard or a suburban gable is most of what says where you are. See `roofs.ts`.
 */
export function buildBuilding(
  out: MeshBuilder,
  ring: Ring,
  plan: FacadePlan,
  atlas: AtlasManifest,
  seed: number,
  baseY = 0,
  roofSpec?: { shape: RoofShape; height: number; direction?: number; colour: [number, number, number] },
  /** what the region puts on its roofs — chimneys, dormers (roofs.ts `addRoofscape`) */
  roofscape?: Roofscape,
  /** whether wall i (ring[i] → ring[i+1]) faces a street, and what kind; the shop awnings go only there */
  facesStreet?: (i: number) => StreetFacing | null,
  /** courtyards: clockwise inner rings, whose walls face into the court (PackedBuilding.holes) */
  holes: Ring[] = [],
  /** the arches cut through each outer wall i by passages (render/passages.ts `passageArches`) */
  arches?: (i: number) => Arch[],
): void {
  for (let i = 0; i < ring.length; i++) {
    wall(out, ring[i], ring[(i + 1) % ring.length], plan, atlas, seed ^ (i * 0x9e3779b1), baseY,
      facesStreet?.(i) ?? null, arches?.(i) ?? [], depthBehind(ring, i))
  }
  // the court walls: a clockwise ring's outward normal (uz, −ux) points into the court
  holes.forEach((h, k) => {
    for (let i = 0; i < h.length; i++) {
      wall(out, h[i], h[(i + 1) % h.length], plan, atlas, seed ^ ((k + 7) * 0x85ebca6b) ^ (i * 0x9e3779b1), baseY, null)
    }
  })
  const eaves = baseY + plan.height
  // no mansard on a single storey: on a 4 m pavilion by the Châtelet it did not form, and its dormers stood
  // in the air over a flat top (BUGS.md #25) — a low building keeps a flat roof and no lucarnes
  const low = plan.height < 7 && roofSpec?.shape === 'mansard'
  const spec = {
    shape: low ? 'flat' : roofSpec?.shape ?? 'flat',
    y: eaves,
    height: low ? 0 : roofSpec?.height ?? 0,
    direction: roofSpec?.direction,
    // (a FLAT stucco roof is tar and gravel: the palette's roof is the colour of its tiles, and on a flat top it painted
    //  the Sunset and the Marina as acres of orange slabs from any hill — Golden Gate Heights, 2026-10-06)
    colour: roofSpec?.colour ?? ((low || (roofSpec?.shape ?? 'flat') === 'flat') && plan.style === 'stucco'
      ? [0.5, 0.49, 0.47] as [number, number, number] : rgb(plan.palette.roof)),
  }
  if (holes.length > 0) buildRoofAroundCourts(out, ring, holes, spec)
  else buildRoof(out, ring, spec)
  // a modern building carries no chimney pots, whatever the city's roofs do
  const modern = plan.style === 'opera' || plan.style === 'operaGlass' || plan.style === 'skyscraper'
  if (roofscape && !modern && (roofscape.chimneys || roofscape.dormers || roofscape.waterTanks)) {
    addRoofscape(out, ring, spec, roofscape, {
      wall: rgb(plan.palette.wall), bayWidth: plan.bayWidth, seed, levels: plan.levels,
      dormerUV: uvFor(atlas, `${plan.style}/dormer`, 0) ?? uvFor(atlas, `${plan.style}/window`, 0),
    })
  }
}

/** A rectangular footprint, which is what the showcase uses and what most of OSM looks like anyway. */
export function rectangle(width: number, depth: number, cx = 0, cz = 0): Ring {
  const w = width / 2
  const d = depth / 2
  return [
    { x: cx - w, z: cz - d }, { x: cx + w, z: cz - d },
    { x: cx + w, z: cz + d }, { x: cx - w, z: cz + d },
  ]
}



const shadeRgb = (c: [number, number, number], k: number): [number, number, number] => [c[0] * k, c[1] * k, c[2] * k]
