/**
 * The landmark kit: the handful of shapes every building in LANDMARKS_PARIS.md is made of.
 *
 * Everything writes into a MeshBuilder in the cartoon material's vertex format — rgb colour, alpha 0 ("keep
 * this colour") — in the builders' shared frame: **the main facade faces local −z**, width runs along x,
 * depth along +z, y up from the ground. Flat colours; the material's sun, rim and hemisphere do the shading.
 */
import { MeshBuilder } from '../buildings.ts'
import { box, disc, prism, type Rgb } from '../models.ts'

export { box, disc, prism }
export type { Rgb }

const FIXED = 0

export const hex = (h: string): Rgb => {
  const s = h.replace('#', '')
  return [parseInt(s.slice(0, 2), 16) / 255, parseInt(s.slice(2, 4), 16) / 255, parseInt(s.slice(4, 6), 16) / 255]
}
export const shade = (c: Rgb, f: number): Rgb => [c[0] * f, c[1] * f, c[2] * f]

/** A solid block from its footprint box and its heights. */
export function block(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number,
                      colour: Rgb): void {
  box(out, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2, colour, FIXED)
}

/**
 * A roof over a rectangle: the base at y0 over [x0,x1]×[z0,z1], rising h to a top rectangle inset by
 * (ix, iz) on each side. ix = half the width and iz = 0 gives a ridge along z; both at half gives a pyramid;
 * smaller insets give the truncated pavilion roofs of the Hôtel de Ville.
 */
export function roof(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y0: number, h: number,
                     ix: number, iz: number, colour: Rgb): void {
  const y1 = y0 + h
  const tx0 = x0 + ix
  const tx1 = x1 - ix
  const tz0 = z0 + iz
  const tz1 = z1 - iz
  const faces: [[number, number, number][], [number, number, number]][] = [
    [[[x0, y0, z0], [x1, y0, z0], [tx1, y1, tz0], [tx0, y1, tz0]], [0, ix === 0 ? 0 : 0.7, -1]],   // front
    [[[x1, y0, z1], [x0, y0, z1], [tx0, y1, tz1], [tx1, y1, tz1]], [0, 0.7, 1]],                   // back
    [[[x0, y0, z1], [x0, y0, z0], [tx0, y1, tz0], [tx0, y1, tz1]], [-1, 0.7, 0]],                  // left
    [[[x1, y0, z0], [x1, y0, z1], [tx1, y1, tz1], [tx1, y1, tz0]], [1, 0.7, 0]],                   // right
  ]
  for (const [p, n] of faces) out.quad(p, n, [[0, 0], [1, 0], [1, 1], [0, 1]], colour, FIXED)
  if (tx1 - tx0 > 0.01 && tz1 - tz0 > 0.01) {
    out.quad([[tx0, y1, tz0], [tx1, y1, tz0], [tx1, y1, tz1], [tx0, y1, tz1]].reverse() as [number, number, number][],
      [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, FIXED)
  }
}

/**
 * A row of windows on a face of a block: dark insets a few centimetres proud of the wall, one per bay.
 * `face` is which side the windows are on; `t0..t1` the span along the face, `y0` the sill, `h` the height.
 */
export function windows(out: MeshBuilder, face: '-z' | '+z' | '-x' | '+x', plane: number, t0: number, t1: number,
                        y0: number, w: number, h: number, bay: number, colour: Rgb, frame?: Rgb): void {
  const n = Math.max(1, Math.floor((t1 - t0) / bay))
  const step = (t1 - t0) / n
  for (let i = 0; i < n; i++) {
    const t = t0 + step * (i + 0.5)
    pane(out, face, plane, t, y0, w, h, colour)
    if (frame) pane(out, face, plane, t, y0 - 0.12, w + 0.3, 0.12, frame, 0.07)   // the sill
  }
}

/** One flat rectangle on a face, `proud` off it. */
export function pane(out: MeshBuilder, face: '-z' | '+z' | '-x' | '+x', plane: number, t: number, y0: number,
                     w: number, h: number, colour: Rgb, proud = 0.05): void {
  const y1 = y0 + h
  const a = t - w / 2
  const b = t + w / 2
  let q: [number, number, number][]
  let n: [number, number, number]
  switch (face) {
    case '-z': q = [[b, y0, plane - proud], [a, y0, plane - proud], [a, y1, plane - proud], [b, y1, plane - proud]]; n = [0, 0, -1]; break
    case '+z': q = [[a, y0, plane + proud], [b, y0, plane + proud], [b, y1, plane + proud], [a, y1, plane + proud]]; n = [0, 0, 1]; break
    case '-x': q = [[plane - proud, y0, a], [plane - proud, y0, b], [plane - proud, y1, b], [plane - proud, y1, a]]; n = [-1, 0, 0]; break
    default: q = [[plane + proud, y0, b], [plane + proud, y0, a], [plane + proud, y1, a], [plane + proud, y1, b]]; n = [1, 0, 0]
  }
  out.quad(q, n, [[0, 0], [1, 0], [1, 1], [0, 1]], colour, FIXED)
}

/** A round-headed opening: a rectangle with a half-disc on top, on a −z face. */
export function archedPane(out: MeshBuilder, plane: number, t: number, y0: number, w: number, h: number, colour: Rgb): void {
  pane(out, '-z', plane, t, y0, w, h - w / 2, colour)
  const n = 8
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI
    const a1 = ((i + 1) / n) * Math.PI
    const cy = y0 + h - w / 2
    out.quad([[t, cy, plane - 0.05], [t + Math.cos(a0) * w / 2, cy + Math.sin(a0) * w / 2, plane - 0.05],
      [t + Math.cos(a1) * w / 2, cy + Math.sin(a1) * w / 2, plane - 0.05], [t, cy, plane - 0.05]].reverse() as [number, number, number][],
    [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, FIXED)
  }
}

/** A pointed (Gothic) opening on a −z face: a rectangle under a triangle. */
export function pointedPane(out: MeshBuilder, plane: number, t: number, y0: number, w: number, h: number, colour: Rgb): void {
  const spring = h - w * 0.8
  pane(out, '-z', plane, t, y0, w, spring, colour)
  out.quad([[t + w / 2, y0 + spring, plane - 0.05], [t - w / 2, y0 + spring, plane - 0.05], [t, y0 + h, plane - 0.05], [t, y0 + h, plane - 0.05]],
    [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, FIXED)
}

/** A column with a base and a capital. */
export function column(out: MeshBuilder, x: number, z: number, y0: number, y1: number, r: number, colour: Rgb): void {
  box(out, x, y0 + 0.2, z, r * 1.4, 0.2, r * 1.4, colour, FIXED)
  prism(out, x, z, y0 + 0.4, y1 - 0.5, r, 10, colour, FIXED, r * 0.9)
  box(out, x, y1 - 0.25, z, r * 1.5, 0.25, r * 1.5, colour, FIXED)
}

/** A triangular pediment standing on y0 across [x0,x1], its face at z (facing −z), `depth` deep. */
export function pediment(out: MeshBuilder, x0: number, x1: number, z: number, y0: number, h: number, depth: number, colour: Rgb): void {
  const xm = (x0 + x1) / 2
  const front: [number, number, number][] = [[x1, y0, z], [x0, y0, z], [xm, y0 + h, z], [xm, y0 + h, z]]
  out.quad(front, [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, FIXED)
  // the two sloping tops, back to z + depth
  out.quad([[x0, y0, z], [x0, y0, z + depth], [xm, y0 + h, z + depth], [xm, y0 + h, z]], [-0.6, 0.8, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, FIXED)
  out.quad([[xm, y0 + h, z], [xm, y0 + h, z + depth], [x1, y0, z + depth], [x1, y0, z]], [0.6, 0.8, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, FIXED)
}

/** A dome: a hemisphere-ish profile of stacked rings from y0, radius r, height h, with ribs if asked. */
export function dome(out: MeshBuilder, cx: number, cz: number, y0: number, r: number, h: number, colour: Rgb,
                     sides = 16, ribs?: Rgb): void {
  const rings = 6
  for (let k = 0; k < rings; k++) {
    const a0 = (k / rings) * (Math.PI / 2)
    const a1 = ((k + 1) / rings) * (Math.PI / 2)
    prism(out, cx, cz, y0 + Math.sin(a0) * h, y0 + Math.sin(a1) * h, Math.cos(a0) * r, sides, colour, FIXED,
      Math.max(0.01, Math.cos(a1) * r), k === rings - 1)
  }
  if (ribs) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      for (let k = 0; k < rings; k++) {
        const p0 = (k / rings) * (Math.PI / 2)
        const p1 = ((k + 1) / rings) * (Math.PI / 2)
        const rr = r * 1.01
        out.quad([
          [cx + Math.sin(a - 0.03) * Math.cos(p0) * rr, y0 + Math.sin(p0) * h, cz + Math.cos(a - 0.03) * Math.cos(p0) * rr],
          [cx + Math.sin(a + 0.03) * Math.cos(p0) * rr, y0 + Math.sin(p0) * h, cz + Math.cos(a + 0.03) * Math.cos(p0) * rr],
          [cx + Math.sin(a + 0.03) * Math.cos(p1) * rr, y0 + Math.sin(p1) * h, cz + Math.cos(a + 0.03) * Math.cos(p1) * rr],
          [cx + Math.sin(a - 0.03) * Math.cos(p1) * rr, y0 + Math.sin(p1) * h, cz + Math.cos(a - 0.03) * Math.cos(p1) * rr],
        ], [Math.sin(a), 0.5, Math.cos(a)], [[0, 0], [1, 0], [1, 1], [0, 1]], ribs, FIXED)
      }
    }
  }
}

/** A Gothic pinnacle: a slim square shaft and a tall pointed cap with a finial. */
export function pinnacle(out: MeshBuilder, x: number, z: number, y0: number, h: number, w: number, colour: Rgb): void {
  box(out, x, y0 + h * 0.2, z, w / 2, h * 0.2, w / 2, colour, FIXED)
  prism(out, x, z, y0 + h * 0.4, y0 + h, w * 0.62, 4, colour, FIXED, 0.02)
}

/** A round turret carried out from a wall on a corbel: the cone of the corbel, the drum, the pointed roof. */
export function turret(out: MeshBuilder, x: number, z: number, yCorbel: number, yEaves: number, r: number,
                       roofH: number, wall: Rgb, slate: Rgb): void {
  prism(out, x, z, yCorbel - 1.4, yCorbel, 0.2, 12, wall, FIXED, r)
  prism(out, x, z, yCorbel, yEaves, r, 12, wall, FIXED)
  prism(out, x, z, yEaves, yEaves + roofH, r * 1.12, 12, slate, FIXED, 0.02)
}

/**
 * Append `part` to `out` turned `angle` radians about the y axis (Babylon's sense: +z goes to (sin a, cos a)).
 * For the things a building has on all four faces: draw them once on the −z face, copy them round.
 */
export function rotated(out: MeshBuilder, part: MeshBuilder, angle: number): void {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const base = out.positions.length / 3
  for (let i = 0; i < part.positions.length; i += 3) {
    const px = part.positions[i]
    const pz = part.positions[i + 2]
    out.positions.push(px * c + pz * s, part.positions[i + 1], -px * s + pz * c)
    const nx = part.normals[i]
    const nz = part.normals[i + 2]
    out.normals.push(nx * c + nz * s, part.normals[i + 1], -nx * s + nz * c)
  }
  out.uvs.push(...part.uvs)
  out.colors.push(...part.colors)
  for (const idx of part.indices) out.indices.push(base + idx)
}

/** `part` copied onto all four faces of a building centred on the origin. */
export function fourSides(out: MeshBuilder, part: MeshBuilder): void {
  for (let k = 0; k < 4; k++) rotated(out, part, (k * Math.PI) / 2)
}

/**
 * A square tube from `a` to `b`, `r` its half-thickness: a steel member, a duct run, an escalator's tube —
 * anything that runs at an angle, which `block` cannot. Four sides and two ends.
 */
export function beam(out: MeshBuilder, a: [number, number, number], b: [number, number, number], r: number,
                     colour: Rgb, rv = r): void {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const len = Math.hypot(d[0], d[1], d[2])
  if (len < 1e-4) return
  const dn = [d[0] / len, d[1] / len, d[2] / len]
  // a side vector square to the member: across it horizontally, unless it is vertical
  let u = [dn[2], 0, -dn[0]]
  let ul = Math.hypot(u[0], u[2])
  if (ul < 1e-3) { u = [1, 0, 0]; ul = 1 }
  u = [u[0] / ul, 0, u[2] / ul]
  const v = [dn[1] * u[2] - dn[2] * u[1], dn[2] * u[0] - dn[0] * u[2], dn[0] * u[1] - dn[1] * u[0]]
  const c = (p: [number, number, number], su: number, sv: number): [number, number, number] =>
    [p[0] + u[0] * r * su + v[0] * rv * sv, p[1] + u[1] * r * su + v[1] * rv * sv, p[2] + u[2] * r * su + v[2] * rv * sv]
  const sides: [number, number, number, number][] = [[1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1], [-1, -1, 1, -1]]
  for (const [su0, sv0, su1, sv1] of sides) {
    const n: [number, number, number] = [u[0] * (su0 + su1) / 2 + v[0] * (sv0 + sv1) / 2, u[1] * (su0 + su1) / 2 + v[1] * (sv0 + sv1) / 2,
      u[2] * (su0 + su1) / 2 + v[2] * (sv0 + sv1) / 2]
    out.quad([c(a, su0, sv0), c(b, su0, sv0), c(b, su1, sv1), c(a, su1, sv1)], n, [[0, 0], [1, 0], [1, 1], [0, 1]], colour, FIXED)
  }
  for (const [p, s] of [[a, -1], [b, 1]] as const) {
    out.quad([c(p, -1, -1), c(p, 1, -1), c(p, 1, 1), c(p, -1, 1)], [dn[0] * s, dn[1] * s, dn[2] * s],
      [[0, 0], [1, 0], [1, 1], [0, 1]], colour, FIXED)
  }
}

/** `part` turned `angle` about y and moved to (tx, tz): a wall drawn once in its own frame, set in place. */
export function placed(out: MeshBuilder, part: MeshBuilder, angle: number, tx: number, tz: number): void {
  const moved = new MeshBuilder()
  rotated(moved, part, angle)
  for (let i = 0; i < moved.positions.length; i += 3) {
    moved.positions[i] += tx
    moved.positions[i + 2] += tz
  }
  const base = out.positions.length / 3
  out.positions.push(...moved.positions)
  out.normals.push(...moved.normals)
  out.uvs.push(...moved.uvs)
  out.colors.push(...moved.colors)
  for (const idx of moved.indices) out.indices.push(base + idx)
}

/**
 * An ornate classical court facade, drawn on a wall at z = 0 facing −z, `len` long, eaves at `eaves`: a stone
 * plate over whatever the city drew there, bays with pilasters between, tall windows in two storeys with
 * alternating triangular and segmental pediments, relief panels on the piers if asked, a cornice, and stone
 * lucarnes standing on it. `passage` opens a carriage arch in the middle of the ground floor.
 */
export function courtFacade(out: MeshBuilder, len: number, eaves: number, o: {
  stone: Rgb; trim: Rgb; dark: Rgb; reliefs?: boolean; lucarnes?: boolean; passage?: boolean; ground?: number
}): void {
  const g = o.ground ?? 0.5
  const half = len / 2
  block(out, -half, half, -0.18, 0, g, eaves, o.stone)
  const n = Math.max(2, Math.round(len / 3.8))
  const bay = len / n
  for (let i = 0; i <= n; i++) {
    const x = -half + i * bay
    block(out, x - 0.28, x + 0.28, -0.32, -0.18, g, eaves - 0.6, o.trim)            // pilaster
  }
  for (let i = 0; i < n; i++) {
    const x = -half + (i + 0.5) * bay
    const mid = i === Math.floor(n / 2)
    if (o.passage && mid) {
      archedPane(out, -0.33, x, g, Math.min(3.4, bay * 0.85), 5.2, o.dark)
      block(out, x - bay * 0.45, x + bay * 0.45, -0.4, -0.18, g + 5.4, g + 6.1, o.trim)
    } else {
      pane(out, '-z', -0.19, x, g + 0.9, Math.min(1.6, bay * 0.45) + 0.4, 4.1, o.trim, 0.02)
      pane(out, '-z', -0.2, x, g + 1.1, Math.min(1.6, bay * 0.45), 3.7, o.dark)
    }
    // the first floor: a tall window under a pediment, triangular and segmental in turn
    const wy = g + 6.6
    pane(out, '-z', -0.19, x, wy - 0.2, Math.min(1.5, bay * 0.42) + 0.4, 3.6, o.trim, 0.02)
    pane(out, '-z', -0.2, x, wy, Math.min(1.5, bay * 0.42), 3.2, o.dark)
    if (i % 2 === 0) pediment(out, x - 1.05, x + 1.05, -0.36, wy + 3.45, 0.7, 0.3, o.trim)
    else archedPane(out, -0.34, x, wy + 3.4, 2.0, 1.0, o.trim)
    // a relief on the pier beside it: a pale oval figure panel
    if (o.reliefs && i < n - 1) {
      const px = x + bay / 2
      pane(out, '-z', -0.33, px, wy + 0.3, 0.46, 2.7, shade(o.trim, 1.06), 0.02)
      pane(out, '-z', -0.35, px, wy + 0.9, 0.22, 1.4, shade(o.trim, 0.86), 0.02)
      pane(out, '-z', -0.35, px, wy + 2.35, 0.18, 0.25, shade(o.trim, 0.86), 0.02)
    }
  }
  block(out, -half - 0.2, half + 0.2, -0.6, -0.18, eaves - 0.7, eaves, o.trim)       // the cornice
  if (o.lucarnes) {
    for (let i = 0; i < n; i += 2) {
      const x = -half + (i + 0.5) * bay
      block(out, x - 1.2, x + 1.2, -0.5, 1.2, eaves, eaves + 3.4, o.stone)
      pane(out, '-z', -0.5, x, eaves + 0.5, 1.1, 2.3, o.dark)
      archedPane(out, -0.52, x, eaves + 3.2, 2.6, 1.3, o.trim)
      for (const s of [-1, 1]) prism(out, x + s * 1.25, -0.3, eaves + 3.4, eaves + 4.0, 0.14, 8, o.trim, 0, 0.14)
    }
  }
}
