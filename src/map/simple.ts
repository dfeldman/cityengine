/**
 * The `simple` building kind (MAP-FORMAT §5.3.1): a lidar-derived building as a few planar roof faces over one
 * shared vertex table, with every wall implied. This file is the whole runtime side of it — the limits, a
 * checker, and the geometry — and knows nothing about Babylon, so a renderer (or a test) gets plain arrays.
 *
 *   roof   each face is a polygon (outer ring CCW, holes CW) on its own plane:
 *          z(k) = f.z + (f.s[0] * v[2k] + f.s[1] * v[2k+1]) / 10000, flat when `s` is absent
 *   walls  read off the edges. An edge two faces share (it is in both, reversed) is a STEP: one quad between
 *          the two roofs, facing the lower one. An edge only one face has is OUTSIDE: a quad from that roof
 *          down to the building's foot, facing out (to the right of a CCW edge).
 *
 * Nothing is inferred from coincident floats: shared vertices are the same index, which is what lets the
 * walls close exactly and what the bake (tools/lidar/simple.py) guarantees by splitting T-junctions.
 *
 * Frames: everything is the map's — x east, y north, z up, centimetres; vertex x,y relative to (s.x, s.y);
 * z above zFloor. Converting to the renderer's metres and axes is the caller's business.
 */
import earcut from 'earcut'

export interface SimpleFace {
  /** outer ring, indices into `v`, counter-clockwise */
  r: number[]
  /** holes, clockwise */
  h?: number[][]
  /** roof height at the origin (s.x, s.y), cm above zFloor */
  z: number
  /** roof slope [dz/dx, dz/dy] in 1/10000; absent = flat */
  s?: [number, number]
  /** index into the look table; absent = 0 */
  l?: number
}

/**
 * How a face looks: facade style (the pattern — windows, bays, cornice, ground floor) and colours. Lidar has no
 * colour, so a look is either generated (tools/lidar/patch.py draws it from the neighbourhood's styles and that
 * style's palettes) or written by a person; the format does not care which. A colour left out comes from the
 * style's own palettes, chosen by the building's seed, exactly as for a generic building.
 */
export interface SimpleLook {
  /** facade style: a dict.styles index in a tile, a style name in a patch (the loader interns it) */
  style: number | string
  wall?: number
  trim?: number
  accent?: number
  roof?: number
}

export interface Simple {
  /** origin of the vertex table: tile-local cm in a tile, city cm in a patch */
  x: number
  y: number
  /** vertex table, stride 2: cm from (x, y) */
  v: number[]
  f: SimpleFace[]
  /**
   * Looks, shared by faces (a face's walls and roof take its look; a step wall takes the higher face's).
   * Absent: the whole building is drawn with its own style/colour/palette fields, like any generic building —
   * which is what an override of an OSM building does.
   */
  l?: SimpleLook[]
}

/** Keep in step with LIMITS in tools/lidar/simple.py. A building over any of them is not written. */
export const SIMPLE_LIMITS = {
  /** vertex table entries — a ring index fits a byte */
  verts: 256,
  faces: 32,
  /** |dx|, |dy| in cm — an offset fits an int16 */
  half: 15000,
  /** top above foot, cm */
  height: 50000,
  /** |slope| in 1/10000 — tan 65° */
  slope: 21445,
  /** look table entries */
  looks: 16,
} as const

/** Roof height of face `f` at vertex `k`, cm above zFloor. */
export const roofZ = (s: Simple, f: SimpleFace, k: number): number =>
  f.s ? f.z + (f.s[0] * s.v[2 * k] + f.s[1] * s.v[2 * k + 1]) / 10000 : f.z

const ringArea = (s: Simple, r: number[]): number => {
  let a = 0
  for (let i = 0; i < r.length; i++) {
    const p = r[i], q = r[(i + 1) % r.length]
    a += s.v[2 * p] * s.v[2 * q + 1] - s.v[2 * q] * s.v[2 * p + 1]
  }
  return a / 2
}

/**
 * Why a record cannot be drawn, or null when it can. Cheap enough to run on every record at load: limits,
 * indices, ring orientation, and the edge rule (no directed edge twice, so no two faces overlap along it).
 * Ring simplicity and face overlap are the bake's to guarantee; a renderer that trusts the bake skips nothing
 * it needs by not re-checking them.
 */
export function checkSimple(s: Simple, foot: number, L = SIMPLE_LIMITS): string | null {
  const nv = s.v.length / 2
  if (!Number.isInteger(nv) || nv < 3) return 'vertex table'
  if (nv > L.verts) return `vertices ${nv} > ${L.verts}`
  if (s.f.length === 0) return 'no faces'
  if (s.f.length > L.faces) return `faces ${s.f.length} > ${L.faces}`
  for (const c of s.v) if (!Number.isInteger(c) || Math.abs(c) > L.half) return `vertex offset ${c}`
  const seen = new Set<number>()
  let top = -Infinity
  for (const f of s.f) {
    if (f.s && (Math.abs(f.s[0]) > L.slope || Math.abs(f.s[1]) > L.slope)) return 'slope'
    const rings = [f.r, ...(f.h ?? [])]
    for (let j = 0; j < rings.length; j++) {
      const r = rings[j]
      if (r.length < 3) return 'ring under 3 vertices'
      for (const k of r) if (!Number.isInteger(k) || k < 0 || k >= nv) return `index ${k}`
      const a = ringArea(s, r)
      if (j === 0 ? a <= 0 : a >= 0) return j === 0 ? 'outer ring not counter-clockwise' : 'hole not clockwise'
      for (let i = 0; i < r.length; i++) {
        const e = r[i] * 65536 + r[(i + 1) % r.length]
        if (r[i] === r[(i + 1) % r.length]) return 'repeated vertex'
        if (seen.has(e)) return 'directed edge used twice'
        seen.add(e)
        top = Math.max(top, roofZ(s, f, r[i]))
      }
    }
  }
  if (s.l) {
    if (s.l.length === 0 || s.l.length > L.looks) return `looks ${s.l.length}`
    for (const k of s.l) {
      if (typeof k.style !== 'number' || !Number.isInteger(k.style) || k.style < 0) return 'look style (not interned?)'
      for (const c of [k.wall, k.trim, k.accent, k.roof]) if (c !== undefined && !(Number.isInteger(c) && c >= 0 && c <= 0xffffff)) return 'look colour'
    }
  }
  for (const f of s.f) if (f.l !== undefined && (!Number.isInteger(f.l) || f.l < 0 || f.l >= (s.l?.length ?? 0))) return 'look index'
  if (top - foot > L.height) return 'height'
  if (top <= foot) return 'roof below the foot'
  return null
}

/** One wall quad: from a to b, bottom and top at each end. Its front is to the right of a→b. */
export interface SimpleWall {
  ax: number; ay: number; bx: number; by: number
  a0: number; a1: number; b0: number; b1: number
  /** true for an outside wall (down to the foot), false for a step between two roofs */
  outer: boolean
  /** the face whose look it wears: its own for an outside wall, the higher one for a step */
  face: number
}

export interface SimpleGeometry {
  /** roof triangles: x, y, z per vertex (cm, map frame, origin applied), and indices */
  roof: { positions: number[]; indices: number[]; /** face index per triangle */ faces: number[] }
  walls: SimpleWall[]
}

/**
 * Roofs triangulated, walls listed. `foot` is the building's `z`; outside walls go down to it (a renderer that
 * wants them buried in a slope subtracts its own margin). Steps lower than `minStep` cm are not walls.
 */
export function simpleGeometry(s: Simple, foot: number, minStep = 5): SimpleGeometry {
  const positions: number[] = []
  const indices: number[] = []
  const triFaces: number[] = []
  const owner = new Map<number, { f: number }>()          // directed edge a*65536+b -> face
  s.f.forEach((f, fi) => {
    const rings = [f.r, ...(f.h ?? [])]
    const flat: number[] = []
    const holes: number[] = []
    const ids: number[] = []
    for (const r of rings) {
      if (ids.length) holes.push(ids.length)
      for (let i = 0; i < r.length; i++) {
        flat.push(s.v[2 * r[i]], s.v[2 * r[i] + 1])
        ids.push(r[i])
        owner.set(r[i] * 65536 + r[(i + 1) % r.length], { f: fi })
      }
    }
    const base = positions.length / 3
    for (const k of ids) positions.push(s.x + s.v[2 * k], s.y + s.v[2 * k + 1], roofZ(s, f, k))
    // earcut's winding follows the input; the outer ring is CCW, so these come out facing up
    const tris = earcut(flat, holes.length ? holes : undefined)
    for (const t of tris) indices.push(base + t)
    for (let i = 0; i < tris.length; i += 3) triFaces.push(fi)
  })

  const walls: SimpleWall[] = []
  for (const [e, { f }] of owner) {
    const a = Math.floor(e / 65536), b = e % 65536
    const fa = s.f[f]
    const ta = roofZ(s, fa, a), tb = roofZ(s, fa, b)
    const quad = (a0: number, a1: number, b0: number, b1: number, outer: boolean, flip: boolean): void => {
      const [p, q, p0, p1, q0, q1] = flip ? [b, a, b0, b1, a0, a1] : [a, b, a0, a1, b0, b1]
      walls.push({ ax: s.x + s.v[2 * p], ay: s.y + s.v[2 * p + 1], bx: s.x + s.v[2 * q], by: s.y + s.v[2 * q + 1],
        a0: p0, a1: p1, b0: q0, b1: q1, outer, face: wearer })
    }
    const other = owner.get(b * 65536 + a)
    let wearer = f
    if (!other) { quad(foot, ta, foot, tb, true, false); continue }
    if (other.f < f) continue                                // each shared edge once
    const fb = s.f[other.f]
    const ua = roofZ(s, fb, a), ub = roofZ(s, fb, b)
    if (Math.max(Math.abs(ta - ua), Math.abs(tb - ub)) < minStep) continue
    // a→b runs CCW round face f, so its right side is outside f, inside the other face. Where f is the higher
    // the wall faces the other (lower) face as it stands; otherwise it is turned round. Two pitched roofs can
    // CROSS along an edge (f higher at a, lower at b): then the wall is two triangles meeting at the crossing,
    // facing opposite ways.
    const da = ta - ua, db = tb - ub
    wearer = da + db >= 0 ? f : other.f
    if (da * db < 0) {
      const t = da / (da - db)
      const mx = s.v[2 * a] + t * (s.v[2 * b] - s.v[2 * a]), my = s.v[2 * a + 1] + t * (s.v[2 * b + 1] - s.v[2 * a + 1])
      const mz = ta + t * (tb - ta)
      const piece = (px: number, py: number, p0: number, p1: number, qx: number, qy: number, q0: number, q1: number, flip: boolean): void => {
        const face = flip ? other.f : f
        walls.push(flip
          ? { ax: s.x + qx, ay: s.y + qy, bx: s.x + px, by: s.y + py, a0: q0, a1: q1, b0: p0, b1: p1, outer: false, face }
          : { ax: s.x + px, ay: s.y + py, bx: s.x + qx, by: s.y + qy, a0: p0, a1: p1, b0: q0, b1: q1, outer: false, face })
      }
      piece(s.v[2 * a], s.v[2 * a + 1], Math.min(ta, ua), Math.max(ta, ua), mx, my, mz, mz, da < 0)
      piece(mx, my, mz, mz, s.v[2 * b], s.v[2 * b + 1], Math.min(tb, ub), Math.max(tb, ub), db < 0)
      continue
    }
    quad(Math.min(ta, ua), Math.max(ta, ua), Math.min(tb, ub), Math.max(tb, ub), false, da + db < 0)
  }
  return { roof: { positions, indices, faces: triFaces }, walls }
}
