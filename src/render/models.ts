/**
 * The model kit: every moving thing in the city, built out of boxes.
 *
 * Nothing here is loaded from a file. A car is nine boxes, a person is seven, a bird is two triangles — which
 * is the right trade for a city that wants forty cars and two hundred people on screen and has to draw them
 * all in a couple of calls. It is also why they can be recoloured per copy: the body panels are tagged so the
 * instance colour replaces them, and the glass and the wheels are tagged so it does not.
 *
 * The tag is the vertex colour's ALPHA: 1 means "this is a body panel, paint it whatever colour this copy
 * is", 0 means "keep the colour it was built with". Without that, a fleet of instanced cars is a fleet of
 * identical cars, or a fleet of cars with coloured windscreens.
 */
import { MeshBuilder } from './buildings.ts'

export type Rgb = [number, number, number]

export const BODY = 1      // recoloured per copy
export const FIXED = 0     // keeps its built colour
/**
 * A light source: keeps its built colour, and glows after dark.
 *
 * Carried in the vertex colour's alpha, like the body/fixed distinction. A street at night with dark lamp
 * heads on its lamp posts reads as a power cut, and the lamps are most of what gives a night street its
 * rhythm — a row of warm points receding down the road.
 */
export const EMIT = 0.5

/** An axis-aligned box from its centre and half-extents. Six quads, correctly wound and normalled. */
export function box(out: MeshBuilder, cx: number, cy: number, cz: number,
                    hx: number, hy: number, hz: number, colour: Rgb, tag = BODY): void {
  const faces: [[number, number, number][], [number, number, number]][] = [
    [[[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], [0, 0, 1]],
    [[[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]], [0, 0, -1]],
    [[[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]], [1, 0, 0]],
    [[[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]], [-1, 0, 0]],
    [[[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]], [0, 1, 0]],
    [[[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]], [0, -1, 0]],
  ]
  for (const [corners, n] of faces) {
    out.quad(
      corners.map(([sx, sy, sz]) => [cx + sx * hx, cy + sy * hy, cz + sz * hz] as [number, number, number]),
      n, [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag,
    )
  }
}

/**
 * A planar quad, subdivided into a grid so no single triangle's edge exceeds `maxEdge`. Only for a face big
 * enough that depth precision or per-vertex interpolation actually suffers — a bridge deck slab, not a car
 * roof (BUGS.md #154: huge polygons on the bay bridge and the water break depth sorting and smear
 * per-vertex lighting across the middle of the triangle). `p` are the four corners, wound as `quad()` wants.
 */
function quadGrid(
  out: MeshBuilder,
  p: [number, number, number][],
  n: [number, number, number],
  uv: [number, number][],
  tint: [number, number, number],
  kind: number,
  maxEdge: number,
): void {
  const lenU = Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2])
  const lenV = Math.hypot(p[3][0] - p[0][0], p[3][1] - p[0][1], p[3][2] - p[0][2])
  const nu = Math.max(1, Math.ceil(lenU / maxEdge))
  const nv = Math.max(1, Math.ceil(lenV / maxEdge))
  const at = (i: number, j: number): [number, number, number] => {
    const u = i / nu
    const v = j / nv
    // bilinear on the quad's four corners (p0..p3 in bl, br, tr, tl order, per quad()'s own convention)
    const bx = (1 - u) * (1 - v)
    const by = u * (1 - v)
    const cx2 = u * v
    const dx = (1 - u) * v
    return [
      p[0][0] * bx + p[1][0] * by + p[2][0] * cx2 + p[3][0] * dx,
      p[0][1] * bx + p[1][1] * by + p[2][1] * cx2 + p[3][1] * dx,
      p[0][2] * bx + p[1][2] * by + p[2][2] * cx2 + p[3][2] * dx,
    ]
  }
  const uvAt = (i: number, j: number): [number, number] => {
    const u = i / nu
    const v = j / nv
    return [
      uv[0][0] * (1 - u) * (1 - v) + uv[1][0] * u * (1 - v) + uv[2][0] * u * v + uv[3][0] * (1 - u) * v,
      uv[0][1] * (1 - u) * (1 - v) + uv[1][1] * u * (1 - v) + uv[2][1] * u * v + uv[3][1] * (1 - u) * v,
    ]
  }
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      out.quad(
        [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)],
        n, [uvAt(i, j), uvAt(i + 1, j), uvAt(i + 1, j + 1), uvAt(i, j + 1)], tint, kind,
      )
    }
  }
}

/**
 * A box like `box()`, but its top and bottom faces — the only ones ever wide AND long enough to matter — are
 * subdivided so no triangle's edge exceeds `maxEdge`. For long flat things: a bridge deck slab, not a strut.
 */
export function boxSubdivided(out: MeshBuilder, cx: number, cy: number, cz: number,
                              hx: number, hy: number, hz: number, colour: Rgb, tag = BODY, maxEdge = 20): void {
  const P = (sx: number, sy: number, sz: number): [number, number, number] => [cx + sx * hx, cy + sy * hy, cz + sz * hz]
  // the four side faces: always thin in one dimension (hy, the slab's own thickness), so left alone
  const sides: [[number, number, number][], [number, number, number]][] = [
    [[[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]], [1, 0, 0]],
    [[[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]], [-1, 0, 0]],
  ]
  for (const [corners, n] of sides) {
    out.quad(corners.map(([sx, sy, sz]) => P(sx, sy, sz)), n, [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
  }
  quadGrid(out, [P(-1, 1, 1), P(1, 1, 1), P(1, 1, -1), P(-1, 1, -1)], [0, 1, 0],
    [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag, maxEdge)
  quadGrid(out, [P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1), P(-1, -1, 1)], [0, -1, 0],
    [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag, maxEdge)
}

/**
 * A straight member of rectangular section from a to b: `w` across it horizontally, `h` in the vertical plane through
 * it (for a vertical member, `w` along x). Beams, poles, cables, truss diagonals.
 */
export function strut(out: MeshBuilder, a: [number, number, number], b: [number, number, number], w: number, h: number, colour: Rgb, tag = FIXED, caps = true): void {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const L = Math.hypot(d[0], d[1], d[2])
  if (L < 1e-4) return
  const t = [d[0] / L, d[1] / L, d[2] / L]
  let sv = Math.abs(t[1]) > 0.98 ? [1, 0, 0] : [t[2], 0, -t[0]]
  const sl = Math.hypot(sv[0], sv[1], sv[2])
  sv = [sv[0] / sl, sv[1] / sl, sv[2] / sl]
  const u = [t[1] * sv[2] - t[2] * sv[1], t[2] * sv[0] - t[0] * sv[2], t[0] * sv[1] - t[1] * sv[0]]
  const P = (p: [number, number, number], i: number, j: number): [number, number, number] =>
    [p[0] + sv[0] * i * w / 2 + u[0] * j * h / 2, p[1] + sv[1] * i * w / 2 + u[1] * j * h / 2, p[2] + sv[2] * i * w / 2 + u[2] * j * h / 2]
  const faces: [number, number, number, number][] = [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]
  for (const [i0, j0, i1, j1] of faces) {
    const n: [number, number, number] = [sv[0] * (i0 + i1) / 2 + u[0] * (j0 + j1) / 2, sv[1] * (i0 + i1) / 2 + u[1] * (j0 + j1) / 2, sv[2] * (i0 + i1) / 2 + u[2] * (j0 + j1) / 2]
    out.quad([P(a, i0, j0), P(a, i1, j1), P(b, i1, j1), P(b, i0, j0)], n, [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
  }
  if (!caps) return               // a thin member seen from afar: its ends are never seen
  out.quad([P(a, -1, -1), P(a, -1, 1), P(a, 1, 1), P(a, 1, -1)], [-t[0], -t[1], -t[2]], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
  out.quad([P(b, -1, -1), P(b, 1, -1), P(b, 1, 1), P(b, -1, 1)], [t[0], t[1], t[2]], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
}

/** A box with its top face inset — a car roof, a bus front, anything that should not look like a brick. */
export function wedge(out: MeshBuilder, cx: number, cy: number, cz: number,
                      hx: number, hy: number, hz: number, inset: number, colour: Rgb, tag = BODY): void {
  const y0 = cy - hy
  const y1 = cy + hy
  const i = inset
  const p = (x: number, y: number, z: number): [number, number, number] => [cx + x, y, cz + z]
  // four sloping sides
  out.quad([p(-hx, y0, hz), p(hx, y0, hz), p(hx - i, y1, hz - i), p(-hx + i, y1, hz - i)],
    [0, 0.4, 0.9], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
  out.quad([p(hx, y0, -hz), p(-hx, y0, -hz), p(-hx + i, y1, -hz + i), p(hx - i, y1, -hz + i)],
    [0, 0.4, -0.9], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
  out.quad([p(hx, y0, hz), p(hx, y0, -hz), p(hx - i, y1, -hz + i), p(hx - i, y1, hz - i)],
    [0.9, 0.4, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
  out.quad([p(-hx, y0, -hz), p(-hx, y0, hz), p(-hx + i, y1, hz - i), p(-hx + i, y1, -hz + i)],
    [-0.9, 0.4, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
  out.quad([p(-hx + i, y1, hz - i), p(hx - i, y1, hz - i), p(hx - i, y1, -hz + i), p(-hx + i, y1, -hz + i)],
    [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
  out.quad([p(-hx, y0, -hz), p(hx, y0, -hz), p(hx, y0, hz), p(-hx, y0, hz)],
    [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
}

/**
 * A short cylinder about the x axis — a wheel.
 *
 * Worth the segments where a box is not: a bicycle's wheels are the two most recognisable circles in the
 * frame, they are close to the camera the whole session, and a square wheel is the sort of thing that makes
 * everything around it look unfinished.
 */
export function wheel(out: MeshBuilder, cx: number, cy: number, cz: number, r: number, halfWidth: number,
                      colour: Rgb, segments = 14): void {
  const ring = (s: number): [number, number, number][] =>
    Array.from({ length: segments }, (_, i) => {
      const a = (i / segments) * Math.PI * 2
      return [cx + s * halfWidth, cy + Math.sin(a) * r, cz + Math.cos(a) * r] as [number, number, number]
    })
  const left = ring(-1)
  const right = ring(1)
  for (let i = 0; i < segments; i++) {
    const j = (i + 1) % segments
    const nx = 0
    const ny = (left[i][1] - cy) / r
    const nz = (left[i][2] - cz) / r
    out.quad([left[i], right[i], right[j], left[j]], [nx, ny, nz],
      [[0, 0], [1, 0], [1, 1], [0, 1]], colour, FIXED)
  }
  // the sides, as fans, so a wheel seen head-on is not a hole
  for (const [side, dir] of [[left, -1], [right, 1]] as const) {
    for (let i = 0; i < segments; i++) {
      const j = (i + 1) % segments
      const base = out.positions.length / 3
      const centre: [number, number, number] = [cx + dir * halfWidth, cy, cz]
      const tri = dir > 0 ? [centre, side[i], side[j]] : [centre, side[j], side[i]]
      for (const v of tri) {
        out.positions.push(v[0], v[1], v[2])
        out.normals.push(dir, 0, 0)
        out.uvs.push(0, 0)
        out.colors.push(colour[0], colour[1], colour[2], FIXED)
      }
      out.indices.push(base, base + 1, base + 2)
    }
  }
}

const TYRE: Rgb = [0.09, 0.09, 0.10]
const GLASS: Rgb = [0.30, 0.44, 0.52]
const LIGHT: Rgb = [1.0, 0.94, 0.72]
const RED: Rgb = [0.75, 0.13, 0.10]
const DARK: Rgb = [0.16, 0.16, 0.18]

/** Wheels, as flattened boxes. At this scale nobody counts the sides of a cylinder. */
function wheels(out: MeshBuilder, halfLength: number, halfWidth: number, r: number, axles: number[]): void {
  for (const z of axles) {
    for (const s of [-1, 1]) {
      box(out, s * halfWidth, r, z * halfLength, 0.09, r, r, TYRE, FIXED)
    }
  }
}

/**
 * A car, built from a **side profile swept across the width** rather than from stacked boxes.
 *
 * A car is one of the few shapes everybody knows by heart, and a box with a smaller box on top does not read
 * as one — it reads as a box with a smaller box on top, which is what the first version looked like. What
 * makes a silhouette a car is the profile: a low nose, a bonnet rising to a raked windscreen, a roof, a
 * faster-raked rear screen, a short boot, and wheel arches cut into the bottom. Sweeping that outline gives
 * all of it for about ninety triangles.
 *
 * The sweep is done in three slices — near side, centre, far side — with the outer slices pulled in and down
 * slightly, which rounds the body off and catches the light along the flanks instead of leaving a flat slab.
 *
 * Local frame: +z is forward, y up, origin on the road, so a vehicle's matrix is a position and a heading.
 */
export function car(out: MeshBuilder): void {
  const L = 2.1        // half length
  const W = 0.86       // half width
  const paint: Rgb = [0.8, 0.8, 0.8]

  // the profile, as (z, y) pairs running clockwise from the front bumper over the roof and back
  const profile: [number, number][] = [
    [L, 0.34], [L, 0.62], [L * 0.86, 0.74],          // nose and bonnet line
    [L * 0.42, 0.80], [L * 0.24, 1.16],              // scuttle up into the windscreen
    [-L * 0.16, 1.24], [-L * 0.52, 1.10],            // roof, then the rear screen falling away
    [-L * 0.80, 0.86], [-L, 0.78], [-L, 0.34],       // boot and tail
  ]

  // three slices across the width: the body tucks in at the sides
  const slices: [number, number, number][] = [[-W, 0.90, 0.97], [0, 1, 1], [W, 0.90, 0.97]]
  const at = (si: number, pi: number): [number, number, number] => {
    const [x, tuck, drop] = slices[si]
    const [z, y] = profile[pi]
    return [x, 0.34 + (y - 0.34) * drop, z * (si === 1 ? 1 : tuck * 0.02 + 0.98)]
  }

  // the shell: quads between neighbouring slices, all the way round the profile
  for (let si = 0; si < slices.length - 1; si++) {
    for (let pi = 0; pi < profile.length - 1; pi++) {
      const a = at(si, pi)
      const b = at(si, pi + 1)
      const c = at(si + 1, pi + 1)
      const d = at(si + 1, pi)
      // the outward normal of a shell panel points away from the car's middle
      const nz = profile[pi + 1][1] - profile[pi][1]
      const ny = profile[pi][0] - profile[pi + 1][0]
      const len = Math.hypot(ny, nz) || 1
      out.quad([a, b, c, d], [0, ny / len, nz / len], [[0, 0], [1, 0], [1, 1], [0, 1]], paint, BODY)
    }
  }

  // the flanks, capping the sweep at each side
  for (const [si, dir] of [[0, -1], [slices.length - 1, 1]] as const) {
    for (let pi = 1; pi < profile.length - 1; pi++) {
      const a = at(si, 0)
      const b = at(si, pi)
      const c = at(si, pi + 1)
      const base = out.positions.length / 3
      for (const v of dir < 0 ? [a, c, b] : [a, b, c]) {
        out.positions.push(v[0], v[1], v[2])
        out.normals.push(dir, 0, 0)
        out.uvs.push(0, 0)
        out.colors.push(paint[0], paint[1], paint[2], BODY)
      }
      out.indices.push(base, base + 1, base + 2)
    }
  }

  // the floor, so the car is closed from below
  out.quad([[-W, 0.3, -L], [W, 0.3, -L], [W, 0.3, L], [-W, 0.3, L]],
    [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.12, 0.12, 0.13], FIXED)

  // glass, sitting just proud of the shell so it never z-fights with the panel behind it
  const glassAt = (z: number, y0: number, y1: number, w: number): void => {
    box(out, 0, (y0 + y1) / 2, z, w, (y1 - y0) / 2, 0.03, GLASS, FIXED)
  }
  glassAt(L * 0.30, 0.86, 1.18, W * 0.78)        // windscreen
  glassAt(-L * 0.46, 0.88, 1.12, W * 0.76)       // rear screen
  for (const s of [-1, 1]) box(out, s * W * 0.93, 1.02, -L * 0.1, 0.03, 0.15, L * 0.28, GLASS, FIXED)

  box(out, 0, 0.55, L * 1.005, W * 0.66, 0.09, 0.05, LIGHT, EMIT)      // headlights
  box(out, 0, 0.60, -L * 1.005, W * 0.66, 0.08, 0.05, RED, EMIT)       // tail lights
  box(out, 0, 0.40, L * 1.01, W * 0.82, 0.08, 0.04, DARK, FIXED)       // front bumper
  box(out, 0, 0.40, -L * 1.01, W * 0.82, 0.08, 0.04, DARK, FIXED)      // rear bumper

  // wheels sitting in their arches, with a hub so they do not read as black blocks
  for (const z of [L * 0.62, -L * 0.62]) {
    for (const sx of [-1, 1]) {
      box(out, sx * W * 0.95, 0.32, z, 0.08, 0.32, 0.32, TYRE, FIXED)
      box(out, sx * W * 1.0, 0.32, z, 0.03, 0.15, 0.15, [0.62, 0.63, 0.66], FIXED)
    }
  }
}

/**
 * A city bus, swept from a side profile like the car.
 *
 * A bus is a box in a way a car is not, but it is not a brick: the windscreen rakes back, the roof is domed,
 * the skirt tucks under below the windows, and the front is rounded. Those four things are the difference
 * between a bus and the orange slab this used to be.
 */
export function bus(out: MeshBuilder): void {
  const L = 5.6         // half length
  const W = 1.28        // half width
  const paint: Rgb = [0.85, 0.35, 0.18]

  // (z, y) round the side, from the bottom of the nose over the roof to the tail
  const profile: [number, number][] = [
    [L, 0.42], [L, 1.9], [L * 0.97, 2.62],              // nose, up the raked windscreen
    [L * 0.84, 3.02], [L * 0.4, 3.12],                  // over the front of the roof
    [-L * 0.55, 3.12], [-L * 0.9, 3.0],                 // the roof, doming down at the back
    [-L, 2.6], [-L, 0.42],                              // the tail
  ]
  const slices: [number, number][] = [[-W, 0.965], [0, 1], [W, 0.965]]
  const at = (si: number, pi: number): [number, number, number] => {
    const [x, tuck] = slices[si]
    const [z, y] = profile[pi]
    return [x, 0.42 + (y - 0.42) * (si === 1 ? 1 : 0.995), z * tuck]
  }

  for (let si = 0; si < slices.length - 1; si++) {
    for (let pi = 0; pi < profile.length - 1; pi++) {
      const nz = profile[pi + 1][1] - profile[pi][1]
      const ny = profile[pi][0] - profile[pi + 1][0]
      const len = Math.hypot(ny, nz) || 1
      out.quad([at(si, pi), at(si, pi + 1), at(si + 1, pi + 1), at(si + 1, pi)],
        [0, ny / len, nz / len], [[0, 0], [1, 0], [1, 1], [0, 1]], paint, BODY)
    }
  }
  for (const [si, dir] of [[0, -1], [slices.length - 1, 1]] as const) {
    for (let pi = 1; pi < profile.length - 1; pi++) {
      const base = out.positions.length / 3
      const tri = dir < 0 ? [at(si, 0), at(si, pi + 1), at(si, pi)] : [at(si, 0), at(si, pi), at(si, pi + 1)]
      for (const v of tri) {
        out.positions.push(v[0], v[1], v[2])
        out.normals.push(dir, 0, 0)
        out.uvs.push(0, 0)
        out.colors.push(paint[0], paint[1], paint[2], BODY)
      }
      out.indices.push(base, base + 1, base + 2)
    }
  }
  out.quad([[-W, 0.4, -L], [W, 0.4, -L], [W, 0.4, L], [-W, 0.4, L]],
    [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.12, 0.12, 0.13], FIXED)

  // the glazing: a long band down each side, a raked screen at each end
  for (const s of [-1, 1]) box(out, s * W * 0.99, 2.22, -0.2, 0.035, 0.46, L * 0.8, GLASS, FIXED)
  box(out, 0, 2.28, L * 0.955, W * 0.88, 0.5, 0.04, GLASS, FIXED)
  box(out, 0, 2.3, -L * 0.97, W * 0.88, 0.42, 0.04, GLASS, FIXED)
  box(out, 0, 2.86, L * 0.93, W * 0.5, 0.15, 0.05, [0.1, 0.1, 0.12], FIXED)   // destination blind
  box(out, 0, 0.55, L * 0.99, W * 0.78, 0.2, 0.05, LIGHT, FIXED)
  box(out, 0, 0.68, -L * 0.99, W * 0.78, 0.17, 0.05, RED, FIXED)
  box(out, 0, 0.72, 0, W * 1.0, 0.3, L * 0.97, DARK, FIXED)                    // the skirt under the windows
  // the doors, which are most of what says "bus" from the pavement
  for (const z of [L * 0.55, -L * 0.15]) box(out, W * 1.0, 1.55, z, 0.03, 0.95, 0.42, DARK, FIXED)
  wheels(out, L * 0.72, W * 0.94, 0.46, [-1, 1])
}

/**
 * One carriage of a train, swept from a side profile like the car and the bus.
 *
 * A carriage is the most box-like thing in the city and still not a box: the ends are rounded, the roof is
 * domed and carries equipment, and the body tucks in above the solebar. Trains are seen end-on down a track
 * more often than side-on, so the nose is where the effort goes.
 */
export function carriage(out: MeshBuilder): void {
  const L = 8.5
  const W = 1.42
  const paint: Rgb = [0.74, 0.76, 0.80]

  const profile: [number, number][] = [
    [L, 0.95], [L, 2.3], [L * 0.94, 3.0],            // the nose, raking back into the cab roof
    [L * 0.8, 3.36], [L * 0.45, 3.44],
    [-L * 0.45, 3.44], [-L * 0.8, 3.36],             // the roof, domed along its length
    [-L * 0.94, 3.0], [-L, 2.3], [-L, 0.95],
  ]
  const slices: [number, number][] = [[-W, 0.96], [0, 1], [W, 0.96]]
  const at = (si: number, pi: number): [number, number, number] => {
    const [x, tuck] = slices[si]
    const [z, y] = profile[pi]
    return [x, 0.95 + (y - 0.95) * (si === 1 ? 1 : 0.99), z * tuck]
  }

  for (let si = 0; si < slices.length - 1; si++) {
    for (let pi = 0; pi < profile.length - 1; pi++) {
      const nz = profile[pi + 1][1] - profile[pi][1]
      const ny = profile[pi][0] - profile[pi + 1][0]
      const len = Math.hypot(ny, nz) || 1
      out.quad([at(si, pi), at(si, pi + 1), at(si + 1, pi + 1), at(si + 1, pi)],
        [0, ny / len, nz / len], [[0, 0], [1, 0], [1, 1], [0, 1]], paint, BODY)
    }
  }
  for (const [si, dir] of [[0, -1], [slices.length - 1, 1]] as const) {
    for (let pi = 1; pi < profile.length - 1; pi++) {
      const base = out.positions.length / 3
      const tri = dir < 0 ? [at(si, 0), at(si, pi + 1), at(si, pi)] : [at(si, 0), at(si, pi), at(si, pi + 1)]
      for (const v of tri) {
        out.positions.push(v[0], v[1], v[2])
        out.normals.push(dir, 0, 0)
        out.uvs.push(0, 0)
        out.colors.push(paint[0], paint[1], paint[2], BODY)
      }
      out.indices.push(base, base + 1, base + 2)
    }
  }

  box(out, 0, 1.28, 0, W * 1.005, 0.3, L * 0.99, [0.2, 0.36, 0.62], FIXED)     // livery stripe
  for (const s of [-1, 1]) box(out, s * W * 0.99, 2.6, 0, 0.035, 0.44, L * 0.86, GLASS, FIXED)
  box(out, 0, 2.62, L * 0.9, W * 0.86, 0.46, 0.05, GLASS, FIXED)               // cab windscreen
  box(out, 0, 2.62, -L * 0.9, W * 0.86, 0.46, 0.05, GLASS, FIXED)
  box(out, 0, 1.55, L * 0.99, W * 0.6, 0.18, 0.05, LIGHT, FIXED)               // headlights
  box(out, 0, 1.55, -L * 0.99, W * 0.6, 0.16, 0.05, RED, FIXED)
  box(out, 0, 3.56, 0.4, W * 0.5, 0.14, L * 0.35, DARK, FIXED)                 // roof equipment
  box(out, 0, 0.78, 0, W * 0.86, 0.22, L * 0.92, DARK, FIXED)                  // solebar and underframe
  for (const z of [L * 0.55, -L * 0.55]) box(out, W * 1.0, 2.0, z, 0.03, 0.85, 0.4, DARK, FIXED)  // doors
  wheels(out, L * 0.74, W * 0.8, 0.42, [-1, 1])
}

/**
 * A person. Seven boxes, and the only articulation is the legs and arms swinging — which is enough, because
 * what reads as walking at twenty metres is the gait, not the model.
 *
 * Built in three parts so the walk cycle can rotate them: `personBody`, `personLeg`, `personArm`. The limbs
 * have their pivot at the TOP of the box, at the origin, so a rotation about x swings them from the hip and
 * the shoulder rather than about their middle.
 */
export function personBody(out: MeshBuilder): void {
  box(out, 0, 1.26, 0, 0.19, 0.28, 0.12, [0.5, 0.5, 0.55])            // torso
  box(out, 0, 0.92, 0, 0.17, 0.10, 0.11, [0.28, 0.30, 0.36], FIXED)   // hips
}

/*
 * Head and hair are their own parts, each taking its colour per copy, so a walker's skin and hair are
 * THEIRS — and match the avatar-kit body they are given up close. Fixed colours made everyone in the city
 * the same person from the neck up.
 */
export function personHead(out: MeshBuilder): void {
  box(out, 0, 1.69, 0, 0.115, 0.135, 0.11, [1, 1, 1])
}

export function personHair(out: MeshBuilder): void {
  box(out, 0, 1.80, -0.01, 0.125, 0.06, 0.125, [1, 1, 1])
}

/**
 * A torso whose ORIGIN IS THE HIPS, for a rider leaning over the bars.
 *
 * `personBody` has its origin at the feet, which is right for someone standing and wrong for someone
 * leaning: rotating it forward swings the whole body about the ankles and folds the rider in half. A
 * cyclist pivots at the hips, so the model does too.
 */
export function riderTorso(out: MeshBuilder): void {
  box(out, 0, 0.30, 0, 0.19, 0.30, 0.13, [0.5, 0.5, 0.55])            // torso, hips to shoulders
  box(out, 0, 0.04, 0, 0.17, 0.09, 0.12, [0.28, 0.30, 0.36], FIXED)   // hips
  box(out, 0, 0.71, 0.02, 0.115, 0.13, 0.11, [0.86, 0.68, 0.54], FIXED)  // head
  box(out, 0, 0.83, 0.02, 0.125, 0.05, 0.12, [0.82, 0.24, 0.22], FIXED)  // helmet
  box(out, 0, 0.55, 0, 0.21, 0.06, 0.12, [0.5, 0.5, 0.55])            // shoulders
}

export function personLeg(out: MeshBuilder): void {
  box(out, 0, -0.44, 0, 0.075, 0.44, 0.09, [0.22, 0.24, 0.32], FIXED)
  box(out, 0, -0.86, 0.03, 0.08, 0.05, 0.13, [0.12, 0.12, 0.14], FIXED)   // shoe
}

export function personArm(out: MeshBuilder): void {
  box(out, 0, -0.26, 0, 0.055, 0.26, 0.065, [0.5, 0.5, 0.55])
  box(out, 0, -0.55, 0, 0.055, 0.05, 0.06, [0.86, 0.68, 0.54], FIXED)     // hand
}

/**
 * A bird: a pair of swept wings, drawn double-sided so it reads from above and below. At the size it is seen
 * it is four triangles and a suggestion.
 *
 * Both wings are built here as real geometry. An earlier version mirrored the first wing by pushing extra
 * POSITIONS only — leaving normals, colours and indices behind — which desynchronised the vertex buffers and
 * drew a pair of grey triangles the size of a city block across the middle of the screen.
 */
export function birdWing(out: MeshBuilder): void {
  const c: Rgb = [0.12, 0.12, 0.14]
  const tris: [number, number, number][][] = []
  for (const side of [1, -1]) {
    const tip: [number, number, number] = [0.62 * side, 0.10, -0.16]
    const root: [number, number, number] = [0, 0, 0.08]
    const tail: [number, number, number] = [0, 0, -0.08]
    // wound both ways so the bird is visible from above and below without turning culling off
    tris.push(side > 0 ? [root, tail, tip] : [tail, root, tip])
    tris.push(side > 0 ? [tail, root, tip] : [root, tail, tip])
  }
  for (const t of tris) {
    const base = out.positions.length / 3
    const n: [number, number, number] = [0, 1, 0]
    for (const p of t) {
      out.positions.push(p[0], p[1], p[2])
      out.normals.push(n[0], n[1], n[2])
      out.uvs.push(0, 0)
      out.colors.push(c[0], c[1], c[2], 0)
    }
    out.indices.push(base, base + 1, base + 2)
  }
}

/** An airliner, seen from a long way down: fuselage, wings, tail. */
export function plane(out: MeshBuilder): void {
  const white: Rgb = [0.92, 0.93, 0.95]
  box(out, 0, 0, 0, 1.1, 1.1, 9.5, white)                       // fuselage
  box(out, 0, 0, 1.0, 12.5, 0.22, 2.2, white)                   // wings
  box(out, 0, 0, -8.0, 4.6, 0.2, 1.2, white)                    // tailplane
  box(out, 0, 1.9, -8.2, 0.18, 1.9, 1.5, [0.22, 0.34, 0.6], FIXED)   // fin
  for (const s of [-1, 1]) box(out, s * 5.0, -0.7, 1.4, 0.8, 0.8, 1.6, [0.55, 0.57, 0.62], FIXED)
}

/** A lamp post: column, bracket and a head that glows a little even by day. */
/**
 * A lamp on a wall, the Paris way: an iron bracket out from the facade and a lantern hanging at its end.
 * Local +z points away from the wall.
 */
export function wallLamp(out: MeshBuilder): void {
  const iron: Rgb = [0.10, 0.11, 0.12]
  box(out, 0, 0, 0.03, 0.08, 0.12, 0.03, iron, FIXED)          // the plate on the wall
  box(out, 0, 0.06, 0.3, 0.025, 0.025, 0.3, iron, FIXED)       // the arm
  box(out, 0, -0.1, 0.58, 0.02, 0.14, 0.02, iron, FIXED)       // the drop
  box(out, 0, -0.34, 0.58, 0.13, 0.15, 0.13, [1.0, 0.92, 0.70], EMIT)
  box(out, 0, -0.16, 0.58, 0.16, 0.03, 0.16, iron, FIXED)      // the cap
}

export function lampPost(out: MeshBuilder): void {
  const iron: Rgb = [0.17, 0.18, 0.19]
  box(out, 0, 0.12, 0, 0.16, 0.12, 0.16, iron, FIXED)
  box(out, 0, 2.3, 0, 0.065, 2.2, 0.065, iron, FIXED)
  box(out, 0, 4.45, 0.28, 0.05, 0.05, 0.32, iron, FIXED)
  box(out, 0, 4.36, 0.58, 0.17, 0.10, 0.17, [1.0, 0.93, 0.72], EMIT)
}

/**
 * A traffic light: a post, a head with three lamps, and a hood over each.
 *
 * Faces +z, which is the direction the traffic it stops comes FROM — so it is placed looking back down the
 * street at the drivers, not along it. Getting that backwards is the sort of thing nobody can name but
 * everybody notices.
 */
export function trafficLight(out: MeshBuilder): void {
  const iron: Rgb = [0.16, 0.17, 0.18]
  box(out, 0, 0.1, 0, 0.14, 0.1, 0.14, iron, FIXED)                      // base
  box(out, 0, 1.6, 0, 0.055, 1.5, 0.055, iron, FIXED)                    // post
  box(out, 0, 3.35, 0, 0.16, 0.42, 0.11, [0.1, 0.11, 0.12], FIXED)       // the head
  // red, amber, green, each in its own hood — DARK lenses: the lit one is drawn live over it (render/lamps.ts),
  // because the lights are timed now (sim/signals.ts) and all three glowing at once could not be read
  const lamps: [number, Rgb][] = [[3.66, [0.22, 0.06, 0.05]], [3.35, [0.24, 0.17, 0.05]], [3.04, [0.05, 0.2, 0.09]]]
  for (const [y, colour] of lamps) {
    box(out, 0, y, 0.12, 0.085, 0.085, 0.03, colour, FIXED)
    box(out, 0, y + 0.11, 0.15, 0.1, 0.02, 0.06, [0.08, 0.09, 0.1], FIXED)   // the hood above it
  }
}

/** A bench, facing +z. */
/**
 * A bollard — a Paris potelet: a slim dark post with a ring near the top, knee to thigh high, set along
 * the kerb every metre and a half to keep cars off a narrow pavement. A factory rather than a model,
 * because the colour belongs to the region.
 */
export function bollard(colour: Rgb, height: number): (out: MeshBuilder) => void {
  return (out) => {
    box(out, 0, height / 2, 0, 0.045, height / 2, 0.045, colour, FIXED)
    box(out, 0, height - 0.09, 0, 0.062, 0.025, 0.062, colour, FIXED)
    box(out, 0, height + 0.02, 0, 0.035, 0.02, 0.035, colour, FIXED)
  }
}

export function bench(out: MeshBuilder): void {
  const wood: Rgb = [0.45, 0.30, 0.18]
  const iron: Rgb = [0.18, 0.19, 0.20]
  box(out, 0, 0.44, 0, 0.82, 0.04, 0.24, wood, FIXED)
  box(out, 0, 0.70, -0.22, 0.82, 0.22, 0.04, wood, FIXED)
  for (const s of [-1, 1]) box(out, s * 0.72, 0.22, 0, 0.05, 0.22, 0.22, iron, FIXED)
}

/** An upright n-sided prism about the y axis, from y0 to y1, radius r (optionally narrowing to r1 at the top). */
export function prism(out: MeshBuilder, cx: number, cz: number, y0: number, y1: number, r: number, sides: number,
                      colour: Rgb, tag = FIXED, r1 = r, cap = true): void {
  for (let i = 0; i < sides; i++) {
    const a0 = (i / sides) * Math.PI * 2
    const a1 = ((i + 1) / sides) * Math.PI * 2
    const am = (a0 + a1) / 2
    out.quad([
      [cx + Math.sin(a0) * r, y0, cz + Math.cos(a0) * r], [cx + Math.sin(a1) * r, y0, cz + Math.cos(a1) * r],
      [cx + Math.sin(a1) * r1, y1, cz + Math.cos(a1) * r1], [cx + Math.sin(a0) * r1, y1, cz + Math.cos(a0) * r1],
    ], [Math.sin(am), (r - r1) / Math.max(0.01, y1 - y0), Math.cos(am)], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
  }
  if (!cap || r1 <= 0.001) return
  for (let i = 0; i < sides; i += 2) {
    const p = (k: number): [number, number, number] => {
      const a = (k / sides) * Math.PI * 2
      return [cx + Math.sin(a) * r1, y1, cz + Math.cos(a) * r1]
    }
    out.quad([p(i), p(i + 1), p(i + 2), [cx, y1, cz]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
  }
}

const PARIS_GREEN: Rgb = [0.16, 0.27, 0.21]

/**
 * A Métro entrance in Hector Guimard's cast iron: a low green balustrade round three sides of the stair
 * opening, and at its open end two tall stems curling in to hold orange lamps and the yellow METROPOLITAIN
 * board between them. The most recognisable piece of street furniture in Paris. Local +z runs along the
 * pavement; the stairs go down towards −z.
 */
export function guimardEntrance(out: MeshBuilder): void {
  const iron = PARIS_GREEN
  box(out, 0, 0.17, 0, 0.8, 0.01, 2.0, [0.05, 0.05, 0.06], FIXED)             // the dark stairwell
  for (const s of [-1, 1]) {
    box(out, s * 0.85, 0.55, 0, 0.04, 0.02, 2.05, iron, FIXED)               // the top rail
    for (let z = -1.9; z <= 1.95; z += 0.35) box(out, s * 0.85, 0.36, z, 0.02, 0.2, 0.02, iron, FIXED)
    box(out, s * 0.85, 0.18, 0, 0.05, 0.02, 2.05, iron, FIXED)
  }
  box(out, 0, 0.55, -2.05, 0.85, 0.02, 0.04, iron, FIXED)                     // the closed end
  for (let x = -0.7; x <= 0.71; x += 0.35) box(out, x, 0.36, -2.05, 0.02, 0.2, 0.02, iron, FIXED)
  // the two stems at the open end, leaning in, lamps at the top
  for (const s of [-1, 1]) {
    box(out, s * 0.85, 1.3, 2.05, 0.05, 1.15, 0.05, iron, FIXED)
    box(out, s * 0.62, 2.62, 2.05, 0.28, 0.05, 0.05, iron, FIXED)
    box(out, s * 0.42, 2.45, 2.05, 0.09, 0.16, 0.09, [1.0, 0.55, 0.16], EMIT)   // the orange lamp
  }
  box(out, 0, 2.2, 2.05, 0.55, 0.13, 0.03, [0.86, 0.72, 0.30], FIXED)          // METROPOLITAIN
  box(out, 0, 2.2, 2.09, 0.46, 0.05, 0.01, [0.18, 0.16, 0.12], FIXED)          // its lettering, as a band
}

/** A New York subway entrance: railings round the stair and a pair of green globe lamps at the top. */
export function nycSubwayEntrance(out: MeshBuilder): void {
  const iron: Rgb = [0.12, 0.2, 0.15]
  box(out, 0, 0.17, 0, 0.75, 0.01, 1.9, [0.05, 0.05, 0.06], FIXED)
  for (const s of [-1, 1]) {
    box(out, s * 0.8, 0.95, 0, 0.03, 0.03, 1.95, iron, FIXED)
    box(out, s * 0.8, 0.55, 0, 0.02, 0.4, 1.95, iron, FIXED)
    box(out, s * 0.8, 1.2, 1.95, 0.05, 1.05, 0.05, iron, FIXED)
    prism(out, s * 0.8, 1.95, 2.25, 2.55, 0.16, 8, [0.3, 0.85, 0.4], EMIT, 0.16)    // the green globe
  }
  box(out, 0, 0.55, -1.95, 0.8, 0.4, 0.02, iron, FIXED)
}

/** A CTA entrance: railings and a sign post carrying the blue-and-white station board. */
export function ctaEntrance(out: MeshBuilder): void {
  const steel: Rgb = [0.22, 0.24, 0.26]
  box(out, 0, 0.17, 0, 0.75, 0.01, 1.9, [0.05, 0.05, 0.06], FIXED)
  for (const s of [-1, 1]) box(out, s * 0.8, 0.55, 0, 0.03, 0.4, 1.95, steel, FIXED)
  box(out, 0, 0.55, -1.95, 0.8, 0.4, 0.02, steel, FIXED)
  box(out, 1.05, 1.5, 1.9, 0.05, 1.35, 0.05, steel, FIXED)
  box(out, 1.05, 2.75, 1.9, 0.04, 0.3, 0.5, [0.1, 0.3, 0.65], FIXED)
  box(out, 1.08, 2.75, 1.9, 0.01, 0.12, 0.4, [0.95, 0.95, 0.95], FIXED)
}

/** Anywhere else: railings and a post with a plain M board. */
export function genericEntrance(out: MeshBuilder): void {
  const steel: Rgb = [0.25, 0.26, 0.28]
  box(out, 0, 0.17, 0, 0.75, 0.01, 1.9, [0.05, 0.05, 0.06], FIXED)
  for (const s of [-1, 1]) box(out, s * 0.8, 0.55, 0, 0.03, 0.4, 1.95, steel, FIXED)
  box(out, 0, 0.55, -1.95, 0.8, 0.4, 0.02, steel, FIXED)
  box(out, 1.05, 1.4, 1.9, 0.05, 1.25, 0.05, steel, FIXED)
  box(out, 1.05, 2.6, 1.9, 0.04, 0.3, 0.3, [0.9, 0.9, 0.9], FIXED)
}

/**
 * A Wallace fountain: four caryatids holding up a dome, on a pedestal, all in the same dark green. Sir
 * Richard Wallace gave Paris a hundred of them in 1872; they are still in every quarter.
 */
export function wallaceFountain(out: MeshBuilder): void {
  const g = PARIS_GREEN
  prism(out, 0, 0, 0, 0.35, 0.45, 8, g)
  prism(out, 0, 0, 0.35, 0.95, 0.3, 8, g, FIXED, 0.26)
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4
    prism(out, Math.sin(a) * 0.2, Math.cos(a) * 0.2, 0.95, 1.95, 0.06, 6, g)     // the caryatids
  }
  prism(out, 0, 0, 1.95, 2.15, 0.36, 8, g)
  prism(out, 0, 0, 2.15, 2.55, 0.34, 8, g, FIXED, 0.08)                          // the dome
  prism(out, 0, 0, 2.55, 2.72, 0.05, 6, g, FIXED, 0.0)                           // the finial
}

/** Any other drinking tap: a slim post with a little basin. */
export function drinkingTap(out: MeshBuilder): void {
  const metal: Rgb = [0.35, 0.37, 0.4]
  box(out, 0, 0.5, 0, 0.1, 0.5, 0.1, metal, FIXED)
  box(out, 0, 0.95, 0.12, 0.16, 0.04, 0.16, metal, FIXED)
}

/**
 * A Morris column: the green advertising drum of the Paris pavement, plastered with theatre posters under
 * a fluted cap. The poster band is a ring of colours — at street distance that is what a poster is.
 */
export function morrisColumn(out: MeshBuilder): void {
  const g = PARIS_GREEN
  prism(out, 0, 0, 0, 0.3, 0.72, 12, g)
  prism(out, 0, 0, 0.3, 2.7, 0.6, 12, [0.92, 0.9, 0.84])
  // (its posters are the region's poster library, pasted round the drum: render/posters.ts)
  prism(out, 0, 0, 2.7, 2.85, 0.7, 12, g)
  prism(out, 0, 0, 2.85, 3.4, 0.66, 12, g, FIXED, 0.22)
  prism(out, 0, 0, 3.4, 3.7, 0.12, 8, g, FIXED, 0)
}

/**
 * A Paris news kiosque, after Davioud's: hexagonal, dark green, a frieze of posters, a scalloped canopy and a
 * small dome. Its counter faces the pavement (+x) and it stands along the street.
 */
export function parisNewsstand(out: MeshBuilder): void {
  // BUGS.md #12: the Davioud kiosque's gist — a hexagonal green body, magazines pinned round its shutters, a
  // frieze of posters, a scalloped canopy, and a little dome with its lantern and finial
  const g: Rgb = [0.1, 0.25, 0.18]
  const dark: Rgb = [0.05, 0.14, 0.1]
  const R = 1.2
  const face = (k: number): { cx: number; cz: number; nx: number; nz: number; tx: number; tz: number } => {
    const a = ((k + 0.5) / 6) * Math.PI * 2
    const ap = R * Math.cos(Math.PI / 6)
    return { cx: Math.sin(a) * ap, cz: Math.cos(a) * ap, nx: Math.sin(a), nz: Math.cos(a), tx: Math.cos(a), tz: -Math.sin(a) }
  }
  prism(out, 0, 0, 0, 0.18, R + 0.06, 6, dark, FIXED)
  prism(out, 0, 0, 0.18, 2.3, R, 6, g, FIXED)
  const posterColours: Rgb[] = [[0.92, 0.86, 0.72], [0.82, 0.3, 0.24], [0.25, 0.42, 0.66], [0.95, 0.78, 0.3], [0.9, 0.9, 0.88], [0.55, 0.25, 0.45]]
  const flat = (c: { cx: number; cz: number; nx: number; nz: number; tx: number; tz: number }, off: number, dx: number, y: number, hw: number, hh: number, col: Rgb, tag = FIXED): void => {
    const x = c.cx + c.nx * off + c.tx * dx
    const z = c.cz + c.nz * off + c.tz * dx
    out.quad([[x - c.tx * hw, y - hh, z - c.tz * hw], [x + c.tx * hw, y - hh, z + c.tz * hw], [x + c.tx * hw, y + hh, z + c.tz * hw], [x - c.tx * hw, y + hh, z - c.tz * hw]],
      [c.nx, 0, c.nz], [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
  }
  for (let k = 0; k < 6; k++) {
    const c = face(k)
    // the frieze: a poster on every face, framed in dark green
    flat(c, 0.015, 0, 2.05, 0.5, 0.2, dark)
    flat(c, 0.02, 0, 2.05, 0.46, 0.17, posterColours[k])
    if (k === 1) {
      // the front (+x): the counter's opening, a shelf, and the day's papers across it
      flat(c, 0.02, 0, 1.3, 0.48, 0.55, [0.08, 0.08, 0.08])
      box(out, c.cx + c.nx * 0.2, 0.8, c.cz + c.nz * 0.2, 0.45, 0.03, 0.2, dark, FIXED)
      for (let i = 0; i < 4; i++) flat(c, 0.03, -0.33 + i * 0.22, 1.05, 0.09, 0.13, posterColours[(i + 2) % 6])
    } else {
      // the shutters, with magazines pinned in two rows
      for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) flat(c, 0.02, -0.3 + i * 0.3, 1.0 + r * 0.42, 0.12, 0.16, posterColours[(k + r * 2 + i) % 6])
    }
  }
  // the canopy: flaring out over the frieze, with a scalloped edge hanging from it
  prism(out, 0, 0, 2.3, 2.42, R + 0.05, 6, dark, FIXED, R + 0.42)
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2 + Math.PI / 12
    const x = Math.sin(a) * (R + 0.36)
    const z = Math.cos(a) * (R + 0.36)
    const tx = Math.cos(a) * 0.17
    const tz = -Math.sin(a) * 0.17
    out.quad([[x - tx, 2.3, z - tz], [x + tx, 2.3, z + tz], [x, 2.14, z], [x, 2.14, z]], [Math.sin(a), 0, Math.cos(a)], [[0, 0], [1, 0], [1, 1], [0, 1]], g, FIXED)
  }
  // the dome: two stages curving in, the lantern, the finial
  prism(out, 0, 0, 2.42, 2.7, R + 0.42, 6, g, FIXED, R * 0.72)
  prism(out, 0, 0, 2.7, 2.95, R * 0.72, 6, g, FIXED, R * 0.36)
  prism(out, 0, 0, 2.95, 3.25, 0.22, 6, dark, FIXED, 0.2)
  prism(out, 0, 0, 3.25, 3.35, 0.3, 6, g, FIXED, 0.08)
  prism(out, 0, 0, 3.35, 3.62, 0.05, 6, [0.72, 0.6, 0.3], FIXED, 0.015)
}

export function parisKiosk(out: MeshBuilder): void {
  const g = PARIS_GREEN
  prism(out, 0, 0, 0, 2.3, 1.2, 8, g)
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2
    box(out, Math.sin(a) * 1.13, 1.45, Math.cos(a) * 1.13, 0.4, 0.3, 0.01,
      [[0.85, 0.3, 0.25], [0.95, 0.85, 0.4], [0.3, 0.5, 0.75], [0.9, 0.9, 0.88]][i % 4] as Rgb, FIXED)
  }
  prism(out, 0, 0, 2.3, 2.45, 1.4, 8, g)
  prism(out, 0, 0, 2.45, 3.2, 1.35, 8, g, FIXED, 0.2)
  prism(out, 0, 0, 3.2, 3.5, 0.1, 6, g, FIXED, 0)
}

/** A kiosk anywhere else: a small box with a striped canopy. */
export function kiosk(out: MeshBuilder): void {
  box(out, 0, 1.2, 0, 1.2, 1.2, 0.9, [0.55, 0.57, 0.6], FIXED)
  box(out, 0, 2.5, 0.3, 1.35, 0.06, 1.25, [0.75, 0.2, 0.18], FIXED)
}

/** A bike-share station: a terminal and a row of docks along the kerb, some with a bike in. */
export function bikeDocks(colour: Rgb): (out: MeshBuilder) => void {
  return (out) => {
    box(out, 0, 0.7, -3.4, 0.16, 0.7, 0.14, colour, FIXED)                       // the terminal
    box(out, 0, 1.15, -3.26, 0.13, 0.18, 0.01, [0.1, 0.12, 0.14], FIXED)
    for (let i = 0; i < 7; i++) {
      const z = -2.6 + i * 0.85
      box(out, 0, 0.38, z, 0.04, 0.38, 0.07, colour, FIXED)
      if (i % 3 !== 1) {                                                         // a docked bike, as a frame
        box(out, 0.55, 0.55, z, 0.55, 0.03, 0.02, colour, FIXED)
        box(out, 0.2, 0.35, z, 0.3, 0.3, 0.015, [0.1, 0.1, 0.1], FIXED)
        box(out, 0.9, 0.35, z, 0.3, 0.3, 0.015, [0.1, 0.1, 0.1], FIXED)
      }
    }
  }
}

/** A fire hydrant: a red barrel, a domed cap, two side nozzles and a chain-ring. 0.75 m. */
export function hydrant(out: MeshBuilder): void {
  const red: Rgb = [0.78, 0.16, 0.12]
  prism(out, 0, 0, 0, 0.08, 0.17, 8, red)
  prism(out, 0, 0, 0.08, 0.6, 0.12, 8, red)
  prism(out, 0, 0, 0.6, 0.66, 0.15, 8, red)
  prism(out, 0, 0, 0.66, 0.78, 0.12, 8, red, FIXED, 0.04)
  for (const s of [-1, 1]) box(out, s * 0.16, 0.42, 0, 0.05, 0.05, 0.05, red, FIXED)
  box(out, 0, 0.42, 0.15, 0.06, 0.06, 0.04, [0.85, 0.85, 0.8], FIXED)
}

/** A disc facing +z, for lamp lenses and clock faces. */
export function disc(out: MeshBuilder, cx: number, cy: number, cz: number, r: number, colour: Rgb, tag = FIXED, n = 10): void {
  for (let i = 0; i < n; i += 2) {
    const p = (k: number): [number, number, number] => {
      const a = (k / n) * Math.PI * 2
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r, cz]
    }
    out.quad([[cx, cy, cz], p(i + 2), p(i + 1), p(i)], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag)
  }
}

/**
 * A signal head facing +z: housing, a backplate if asked, three lenses each under a hood. The lenses are
 * EMIT, so they glow after dark; the hoods are what make it read as a traffic light rather than three dots.
 */
function signalHead(out: MeshBuilder, x: number, y: number, z: number, housing: Rgb, backplate: boolean, scale = 1): void {
  const s = scale
  box(out, x, y, z, 0.15 * s, 0.46 * s, 0.12 * s, housing, FIXED)
  if (backplate) box(out, x, y, z - 0.13 * s, 0.26 * s, 0.56 * s, 0.01, [0.06, 0.06, 0.07], FIXED)
  // dark lenses: the lit one is drawn live over it (render/lamps.ts)
  const lamps: [number, Rgb][] = [[0.29, [0.22, 0.05, 0.04]], [0, [0.24, 0.17, 0.04]], [-0.29, [0.04, 0.2, 0.08]]]
  for (const [dy, c] of lamps) {
    disc(out, x, y + dy * s, z + 0.121 * s, 0.1 * s, c, FIXED)
    // the hood over each lens: a little roof and two cheeks
    box(out, x, y + (dy + 0.12) * s, z + 0.19 * s, 0.12 * s, 0.012 * s, 0.07 * s, housing, FIXED)
    for (const sx of [-1, 1]) box(out, x + sx * 0.115 * s, y + (dy + 0.04) * s, z + 0.19 * s, 0.006, 0.08 * s, 0.07 * s, housing, FIXED)
  }
}

/**
 * A Paris signal: a slim dark-green post, a compact black head at 2.6 m facing the traffic, and the small
 * repeater at eye height that Parisian signals carry for the driver at the stop line. Faces +z.
 */
export function trafficLightParis(out: MeshBuilder): void {
  const green: Rgb = [0.13, 0.2, 0.17]
  prism(out, 0, 0, 0, 0.12, 0.13, 8, green)
  prism(out, 0, 0, 0.12, 3.1, 0.055, 8, green, FIXED, 0.05)
  signalHead(out, 0, 2.6, 0.1, [0.08, 0.09, 0.1], false, 0.8)
  signalHead(out, 0.14, 1.55, 0.05, [0.08, 0.09, 0.1], false, 0.35)   // the repeater
  box(out, 0, 3.12, 0, 0.07, 0.02, 0.07, green, FIXED)
}

/**
 * A North American signal: a galvanized pole at the kerb and a mast arm reaching out over the carriageway,
 * the heads hanging from it over the lanes, yellow housings on black backplates; a pedestrian signal box
 * on the pole. `reach` is how far the arm runs out over the road. Faces +z — INTO the junction, at the
 * traffic coming across it, which is the far-side signal an American driver watches — and the arm runs
 * along −x: as city.ts places it (on the kerb, facing the junction) local +x points out towards the kerb,
 * so −x is over the road. Getting this backwards hung every arm over the pavement.
 */
export function trafficLightMast(reach: number): (out: MeshBuilder) => void {
  return (out) => {
    const steel: Rgb = [0.55, 0.57, 0.58]
    prism(out, 0, 0, 0, 0.25, 0.22, 8, steel)
    prism(out, 0, 0, 0.25, 6.2, 0.13, 8, steel, FIXED, 0.1)
    const arm = Math.max(2, reach)
    // the arm, slightly tapering, and its brace
    box(out, -arm / 2, 5.9, 0, arm / 2, 0.07, 0.07, steel, FIXED)
    box(out, -0.7, 5.5, 0, 0.7, 0.03, 0.03, steel, FIXED)
    const yellow: Rgb = [0.9, 0.72, 0.1]
    const heads = arm > 5 ? [arm * 0.55, arm * 0.95] : [arm * 0.9]
    for (const hx of heads) {
      box(out, -hx, 5.72, 0, 0.02, 0.12, 0.02, steel, FIXED)
      signalHead(out, -hx, 5.12, 0.02, yellow, true, 1)
    }
    // the pedestrian signal on the pole, facing across the street
    box(out, 0.22, 2.6, 0, 0.08, 0.2, 0.2, yellow, FIXED)
    box(out, 0.305, 2.6, 0, 0.005, 0.15, 0.15, [0.95, 0.5, 0.2], EMIT)
  }
}
