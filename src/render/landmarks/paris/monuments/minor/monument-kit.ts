import { MeshBuilder, capPolygonWithHoles } from '../../../../buildings.ts'
import { prism, type Rgb } from '../../../../models.ts'
import { beam, block, lathe, roof, shade } from '../../../kit.ts'
import { ccw, FIXED, UV, walls, type P2 } from '../common.ts'
import { basin, circle, falls, G, spout } from '../plaza-common.ts'

/*
 * THE MINOR-MONUMENT KIT (PARIS_MINOR_MONUMENTS.md): the structural pieces a small monument is built from — a wall with a
 * plaque, a paved forecourt, a kerbed bed, a stepped base, a round basin with water. Procedural: the sculpture on top of
 * these is Modly's. Frame as everywhere in this folder: the front faces −z, y up from the model's base, the pavement at
 * `G` (the loader sinks every model half a metre). Every routine takes plain numbers so a monument tunes them rather
 * than rewrites. Later monuments (fountains, columns, obelisks) add their routines here.
 */
export { G, basin, circle, falls, spout }

/** A straight stone wall along x from x0 to x1, `t` thick about z = 0, y0..y1, with a ridged coping `cope` high and `over` proud each side. Courses are thin darker bands every `course`. */
export function wallRun(out: MeshBuilder, o: {
  x0: number; x1: number; y0: number; y1: number; t: number; stone: Rgb; course?: number; mortar?: Rgb
  coping?: Rgb; cope?: number; over?: number
}): void {
  const h = o.t / 2
  block(out, o.x0, o.x1, -h, h, o.y0, o.y1, o.stone)
  if (o.course) {
    const m = o.mortar ?? shade(o.stone, 0.72)
    for (let y = o.y0 + o.course; y < o.y1 - 0.05; y += o.course) {
      block(out, o.x0, o.x1, -h - 0.02, -h, y, y + 0.03, m)
      block(out, o.x0, o.x1, h, h + 0.02, y, y + 0.03, m)
    }
  }
  if (o.coping) {
    const ov = o.over ?? 0.06
    roof(out, o.x0 - ov, o.x1 + ov, -h - ov, h + ov, o.y1, o.cope ?? 0.22, 0, h * 0.55, o.coping)
  }
}

/** A cut inscription panel on the −z face of a wall whose front plane is z = `z`: `w × h`, centre `x`, bottom `y0`, in a `frame` margin, with `lines` rows of gilt letters (each a fraction of the width, 0 = a gap). */
export function plaque(out: MeshBuilder, o: {
  x: number; z: number; y0: number; w: number; h: number; panel: Rgb; frame?: Rgb; fw?: number; letters?: Rgb; lines?: number[]
}): void {
  const fw = o.fw ?? 0.06
  const d = 0.05
  if (o.frame) block(out, o.x - o.w / 2 - fw, o.x + o.w / 2 + fw, o.z - d - 0.02, o.z, o.y0 - fw, o.y0 + o.h + fw, o.frame)
  block(out, o.x - o.w / 2, o.x + o.w / 2, o.z - d - 0.04, o.z, o.y0, o.y0 + o.h, o.panel)
  const rows = o.lines ?? []
  if (!o.letters || !rows.length) return
  const step = (o.h * 0.8) / rows.length
  rows.forEach((f, i) => {
    if (f <= 0) return
    const yc = o.y0 + o.h * 0.9 - step * (i + 0.5)
    const lw = o.w * 0.86 * f
    block(out, o.x - lw / 2, o.x + lw / 2, o.z - d - 0.055, o.z - d - 0.04, yc - step * 0.28, yc + step * 0.28, o.letters!)
  })
}

/** Cobble or sett paving: a slab top at y1 over x0..x1, z0..z1 (from y0), with joint lines every `pitch` both ways in a darker colour. */
export function pavedPatch(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, c: Rgb, pitch = 0.9, joint: Rgb = shade(c, 0.78)): void {
  block(out, x0, x1, z0, z1, y0, y1, c)
  if (pitch <= 0) return
  for (let x = x0 + pitch / 2; x < x1; x += pitch) block(out, x - 0.012, x + 0.012, z0, z1, y1, y1 + 0.006, joint)
  for (let z = z0 + pitch / 2; z < z1; z += pitch) block(out, x0, x1, z - 0.012, z + 0.012, y1, y1 + 0.006, joint)
}

/** A kerbed bed x0..x1, z0..z1: a stone kerb `kw` wide round it, soil `rise` above the paving at y, and tufts of planting (`plants` colours, `n` of them, deterministic). */
export function kerbedBed(out: MeshBuilder, o: {
  x0: number; x1: number; z0: number; z1: number; y: number; kerb: Rgb; kw?: number; kh?: number; soil: Rgb; plants: Rgb[]; n?: number; seed?: number; top?: number
}): void {
  const kw = o.kw ?? 0.18
  const kh = o.kh ?? 0.16
  block(out, o.x0, o.x1, o.z0, o.z1, o.y, o.y + kh, o.kerb)
  block(out, o.x0 + kw, o.x1 - kw, o.z0 + kw, o.z1 - kw, o.y + kh, o.y + kh + 0.02, o.soil)
  let s = o.seed ?? 7
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const n = o.n ?? 20
  for (let i = 0; i < n; i++) {
    const c = o.plants[Math.floor(rnd() * o.plants.length)]
    const r = 0.14 + rnd() * 0.22
    const x = o.x0 + kw + r + rnd() * Math.max(0, o.x1 - o.x0 - 2 * kw - 2 * r)
    const z = o.z0 + kw + r + rnd() * Math.max(0, o.z1 - o.z0 - 2 * kw - 2 * r)
    prism(out, x, z, o.y + kh, o.y + kh + (o.top ?? 0.5) * (0.5 + rnd() * 0.6), r, 6, c, FIXED, r * 0.55, true)
  }
}

/** A stepped base about (cx, cz) from y0: `steps` are [half-width or radius, rise] from the bottom up; `round` turns the squares to 24-sided drums. */
export function steppedBase(out: MeshBuilder, cx: number, cz: number, y0: number, steps: [number, number][], c: Rgb, round = false): number {
  let y = y0
  steps.forEach(([r, h], i) => {
    const col = shade(c, 1 - 0.03 * (steps.length - 1 - i))
    if (round) prism(out, cx, cz, y, y + h, r, 24, col, FIXED, r, true)
    else block(out, cx - r, cx + r, cz - r, cz + r, y, y + h, col)
    y += h
  })
  return y
}

/** A round basin about (cx, cz): wall `depth` high from y0 and `rim` wide at radius r, a moulded lip ring, water `drop` under the rim (shared with the plaza fountains' `basin`). */
export function roundBasin(out: MeshBuilder, cx: number, cz: number, y0: number, r: number, o: {
  rim?: number; depth?: number; lip?: number; stone: Rgb; water: Rgb; sides?: number
}): number {
  const rim = o.rim ?? 0.35
  const depth = o.depth ?? 0.6
  const sides = o.sides ?? 28
  const mv = (rr: number): P2[] => circle(rr, sides).map((p) => ({ x: p.x + cx, z: p.z + cz }))
  basin(out, mv(r), mv(r - rim), y0, y0 + depth, o.stone, o.water)
  if (o.lip) {
    const lc = shade(o.stone, 1.06)
    walls(out, mv(r + 0.06), y0 + depth, y0 + depth + o.lip, lc)
    capPolygonWithHoles(out, [ccw(mv(r + 0.06)), [...ccw(mv(r - rim))].reverse()], y0 + depth + o.lip, lc, FIXED)
  }
  return y0 + depth
}

/** A tapering stone/bronze shaft about (cx, cz) from y0 to y1: `sides` 4 is a square obelisk (`w0`, `w1` the full widths at foot and top), 3 a triangular one (`w` = side length); a pyramidion `tip` high (own colour `tipC`) on top. */
export function obelisk(out: MeshBuilder, cx: number, cz: number, y0: number, y1: number, o: {
  w0: number; w1: number; sides?: 3 | 4; c: Rgb; tip?: number; tipC?: Rgb; turn?: number
}): void {
  const n = o.sides ?? 4
  // prism takes the circumradius: a square's is w/√2, a triangle's w/√3
  const k = n === 4 ? Math.SQRT1_2 : 1 / Math.sqrt(3)
  const phase = (n === 4 ? Math.PI / 4 : 0) + (o.turn ?? 0)
  prism(out, cx, cz, y0, y1, o.w0 * k, n, o.c, FIXED, o.w1 * k, true, phase)
  if (o.tip) prism(out, cx, cz, y1, y1 + o.tip, o.w1 * k, n, o.tipC ?? o.c, FIXED, 0, true, phase)
}

/** A square tower with battered (leaning-in) walls about (cx, cz): half-width `h0` at y0 narrowing to `h1` at y1. */
export function batteredTower(out: MeshBuilder, cx: number, cz: number, y0: number, y1: number, h0: number, h1: number, c: Rgb, course?: number): void {
  const k = Math.SQRT1_2
  prism(out, cx, cz, y0, y1, 2 * h0 * k, 4, c, FIXED, 2 * h1 * k, true, Math.PI / 4)
  if (!course) return
  // joint lines: thin slightly darker slabs on each face
  const m = shade(c, 0.8)
  for (let y = y0 + course; y < y1 - 0.1; y += course) {
    const h = h0 + (h1 - h0) * ((y - y0) / (y1 - y0)) + 0.012
    block(out, cx - h, cx + h, cz - h, cz + h, y, y + 0.025, m)
  }
}

/** A bronze fire pot (a cauldron on a short foot, rim and lid-less mouth) with its square stone block, centre (cx, cz) from y0. */
export function firePot(out: MeshBuilder, cx: number, cz: number, y0: number, o: { r?: number; block?: number; stone: Rgb; bronze: Rgb }): number {
  const r = o.r ?? 0.8
  const bh = o.block ?? 0.5
  block(out, cx - r * 0.85, cx + r * 0.85, cz - r * 0.85, cz + r * 0.85, y0, y0 + bh, o.stone)
  const y = y0 + bh
  prism(out, cx, cz, y, y + 0.25, r * 0.4, 12, o.bronze, FIXED, r * 0.55, true)
  prism(out, cx, cz, y + 0.25, y + 0.7, r * 0.55, 16, o.bronze, FIXED, r, true)
  prism(out, cx, cz, y + 0.7, y + 0.95, r, 16, o.bronze, FIXED, r * 0.82, true)
  prism(out, cx, cz, y + 0.95, y + 1.02, r * 0.88, 16, shade(o.bronze, 0.6), FIXED, r * 0.88, true)
  return y + 1.02
}

/** A round statue pedestal about (cx, cz) from y0: a foot ring, the drum `r` wide and `h` high, a cap; returns the top. */
export function drumPedestal(out: MeshBuilder, cx: number, cz: number, y0: number, o: { r?: number; h?: number; drum: Rgb; trim: Rgb }): number {
  const r = o.r ?? 0.75
  const h = o.h ?? 0.9
  prism(out, cx, cz, y0, y0 + 0.12, r * 1.18, 20, o.trim, FIXED, r * 1.18, true)
  prism(out, cx, cz, y0 + 0.12, y0 + 0.12 + h, r, 20, o.drum, FIXED, r, true)
  prism(out, cx, cz, y0 + 0.12 + h, y0 + 0.2 + h, r * 1.14, 20, o.trim, FIXED, r * 1.14, true)
  return y0 + 0.2 + h
}

/** A raised fountain bowl about (cx, cz): underside tapering from the stem `stem` to the belly `r` at y0 + `depth`·0.45, a moulded rim ring at y0 + depth, water `drop` under the rim. Returns the rim height. */
export function fountainBowl(out: MeshBuilder, cx: number, cz: number, y0: number, r: number, o: {
  depth?: number; stem?: number; drop?: number; sides?: number; body: Rgb; water: Rgb
}): number {
  const d = o.depth ?? 1.0
  const stem = o.stem ?? 0.5
  const n = o.sides ?? 32
  const top = y0 + d
  lathe(out, cx, cz, [[stem, y0], [r * 0.45, y0 + d * 0.12], [r * 0.8, y0 + d * 0.35], [r * 0.97, y0 + d * 0.7], [r, y0 + d * 0.86], [r * 1.03, y0 + d * 0.9], [r * 1.03, top], [r * 0.93, top + 0.03]], n, o.body)
  prism(out, cx, cz, top - (o.drop ?? 0.12), top - (o.drop ?? 0.12) + 0.01, r * 0.93, n, o.water, FIXED, r * 0.93, true)
  return top
}

/** `n` thin arcs of water from a ring of radius r0 at height y0 out and down to radius r1 at y1 (a top bowl spilling into the one below, or mascarons into a basin). */
export function jetRing(out: MeshBuilder, cx: number, cz: number, n: number, r0: number, y0: number, r1: number, y1: number, o: { rise?: number; r?: number; c: Rgb; phase?: number }): void {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (o.phase ?? 0)
    spout(out, [cx + Math.sin(a) * r0, y0, cz + Math.cos(a) * r0], [cx + Math.sin(a) * r1, y1, cz + Math.cos(a) * r1], o.rise ?? 0.25, o.r ?? 0.025, o.c)
  }
}

type V3 = [number, number, number]

/** A tube swept along a 3-D centreline `path` (>= 2 points), radius `r` (number, or a function of 0..1 along it), `sides` facets, closed with a flat cap at each end unless `caps` is false: a serpent's body, a pipe, a rope. Smooth-shaded by radial normals. */
export function sweptTube(out: MeshBuilder, path: V3[], o: { r: number | ((t: number) => number); sides?: number; c: Rgb; caps?: boolean }): void {
  const n = o.sides ?? 12
  const rr = (t: number): number => (typeof o.r === 'number' ? o.r : o.r(t))
  const rings: { p: V3[]; nn: V3[]; c: V3; t: V3 }[] = []
  for (let i = 0; i < path.length; i++) {
    const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)]
    let t: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
    const tl = Math.hypot(t[0], t[1], t[2]) || 1
    t = [t[0] / tl, t[1] / tl, t[2] / tl]
    let s: V3 = [t[2], 0, -t[0]]
    const sl = Math.hypot(s[0], s[2])
    s = sl < 1e-3 ? [1, 0, 0] : [s[0] / sl, 0, s[2] / sl]
    const u: V3 = [t[1] * s[2] - t[2] * s[1], t[2] * s[0] - t[0] * s[2], t[0] * s[1] - t[1] * s[0]]
    const r = rr(i / (path.length - 1))
    const p: V3[] = [], nn: V3[] = []
    for (let k = 0; k < n; k++) {
      const th = (k / n) * Math.PI * 2
      const d: V3 = [s[0] * Math.cos(th) + u[0] * Math.sin(th), s[1] * Math.cos(th) + u[1] * Math.sin(th), s[2] * Math.cos(th) + u[2] * Math.sin(th)]
      nn.push(d)
      p.push([path[i][0] + d[0] * r, path[i][1] + d[1] * r, path[i][2] + d[2] * r])
    }
    rings.push({ p, nn, c: path[i], t })
  }
  for (let i = 0; i + 1 < rings.length; i++) {
    const A = rings[i], B = rings[i + 1]
    for (let k = 0; k < n; k++) {
      const k2 = (k + 1) % n
      const m: V3 = [A.nn[k][0] + A.nn[k2][0], A.nn[k][1] + A.nn[k2][1], A.nn[k][2] + A.nn[k2][2]]
      const ml = Math.hypot(m[0], m[1], m[2]) || 1
      out.quad([A.p[k], A.p[k2], B.p[k2], B.p[k]], [m[0] / ml, m[1] / ml, m[2] / ml], UV, o.c, FIXED)
    }
  }
  if (o.caps === false) return
  for (const [R, sg] of [[rings[0], -1], [rings[rings.length - 1], 1]] as [typeof rings[0], number][]) {
    const nrm: V3 = [R.t[0] * sg, R.t[1] * sg, R.t[2] * sg]
    for (let k = 0; k < n; k++) {
      const k2 = (k + 1) % n
      out.quad([R.c, R.p[k], R.p[k2], R.c], nrm, UV, o.c, FIXED)
    }
  }
}

/** A thin ring (hoop) of radius `r` about `c`, standing square to the direction `t`, made of `n` round bars of thickness `w`: a rib round a tube. */
export function hoop(out: MeshBuilder, c: V3, t: V3, r: number, w: number, col: Rgb, n = 14): void {
  const tl = Math.hypot(t[0], t[1], t[2]) || 1
  const T: V3 = [t[0] / tl, t[1] / tl, t[2] / tl]
  let s: V3 = [T[2], 0, -T[0]]
  const sl = Math.hypot(s[0], s[2])
  s = sl < 1e-3 ? [1, 0, 0] : [s[0] / sl, 0, s[2] / sl]
  const u: V3 = [T[1] * s[2] - T[2] * s[1], T[2] * s[0] - T[0] * s[2], T[0] * s[1] - T[1] * s[0]]
  const pt = (k: number): V3 => {
    const th = (k / n) * Math.PI * 2
    return [c[0] + (s[0] * Math.cos(th) + u[0] * Math.sin(th)) * r, c[1] + (s[1] * Math.cos(th) + u[1] * Math.sin(th)) * r, c[2] + (s[2] * Math.cos(th) + u[2] * Math.sin(th)) * r]
  }
  for (let k = 0; k < n; k++) beam(out, pt(k), pt(k + 1), w, col)
}

/** A flat scalloped fin (a dorsal plate) standing on `base` and leaning along `lean`, `h` tall, `len` long at the foot, `thick` thick, with a rounded-off crown of `teeth` points: the steel spines on a serpent's back. `side` is the unit direction across the fin's thickness. */
export function finPlate(out: MeshBuilder, base: V3, lean: V3, side: V3, o: { h: number; len: number; thick: number; c: Rgb }): void {
  const hl = o.len / 2, ht = o.thick / 2
  for (const sg of [-1, 1]) {
    const so: V3 = [side[0] * ht * sg, side[1] * ht * sg, side[2] * ht * sg]
    const P = (a: number, h: number): V3 => [base[0] + lean[0] * a + so[0], base[1] + h + so[1], base[2] + lean[2] * a + so[2]]
    out.quad([P(-hl, 0), P(hl, 0), P(hl * 0.35, o.h), P(-hl * 0.55, o.h * 0.8)], [side[0] * sg, side[1] * sg, side[2] * sg], UV, o.c, FIXED)
  }
  // the crown edge
  const P2 = (a: number, h: number, sg: number): V3 => [base[0] + lean[0] * a + side[0] * ht * sg, base[1] + h, base[2] + lean[2] * a + side[2] * ht * sg]
  out.quad([P2(-hl * 0.55, o.h * 0.8, -1), P2(hl * 0.35, o.h, -1), P2(hl * 0.35, o.h, 1), P2(-hl * 0.55, o.h * 0.8, 1)], [0, 1, 0], UV, o.c, FIXED)
}

export { UV }

/** A Hittorff fountain of the Champs-Élysées gardens (Diane, Ambassadeurs, Cirque, Grille du Coq) about (cx, cz) from y0: a low round basin of radius `basinR` (wall `wall` high, rim `rim` wide, floor `floor` under y0+wall), an octagonal metal pedestal `pedW` across and `pedH` high with a raised panel and scallop on each face, a foliage neck with `dolphins` dolphins, a wide shallow vasque (radius `vasqueR`) carrying `masks` lion-mask lugs, a falling ring of water into the basin and a jet from the middle. Returns the vasque rim height; the group stands on a reed tuft + round plinth at `top` (own height returned as `plinthTop`). */
export function hittorffFountain(out: MeshBuilder, cx: number, cz: number, y0: number, o: {
  basinR: number; wall?: number; rim?: number; pedW?: number; pedH?: number; neckH?: number; vasqueR?: number; vasqueDepth?: number
  masks?: number; dolphins?: number; fall?: number; stone: Rgb; metal: Rgb; water: Rgb; jet: Rgb; pedBase?: number
}): { rim: number; plinthTop: number } {
  const wall = o.wall ?? 0.75, rim = o.rim ?? 0.32
  const pedW = o.pedW ?? 1.5, pedH = o.pedH ?? 0.85, neckH = o.neckH ?? 0.95
  const vR = o.vasqueR ?? 2.0, vD = o.vasqueDepth ?? 0.62
  const yBase = y0 + (o.pedBase ?? 0.25)
  roundBasin(out, cx, cz, y0, o.basinR, { rim, depth: wall, lip: 0.06, stone: o.stone, water: o.water, sides: 40 })
  // the basin wall is panelled: shallow vertical joints every ~0.9 m
  const jc = shade(o.stone, 0.8)
  const nj = Math.round((Math.PI * 2 * o.basinR) / 0.95)
  for (let i = 0; i < nj; i++) {
    const a = (i / nj) * Math.PI * 2
    prism(out, cx + Math.sin(a) * o.basinR, cz + Math.cos(a) * o.basinR, y0 + 0.08, y0 + wall - 0.04, 0.03, 4, jc, FIXED, 0.03, true)
  }
  // octagonal pedestal: a plinth step, the faceted body, a cornice
  const rc = (pedW / 2) / Math.cos(Math.PI / 8)
  prism(out, cx, cz, y0, yBase, rc * 1.25, 8, shade(o.stone, 0.95), FIXED, rc * 1.25, true, Math.PI / 8)
  prism(out, cx, cz, yBase, yBase + 0.1, rc * 1.12, 8, shade(o.metal, 0.9), FIXED, rc * 1.12, true, Math.PI / 8)
  const yb = yBase + 0.1, yt = yBase + pedH
  prism(out, cx, cz, yb, yt, rc, 8, o.metal, FIXED, rc * 0.96, true, Math.PI / 8)
  prism(out, cx, cz, yt, yt + 0.1, rc * 1.12, 8, shade(o.metal, 1.08), FIXED, rc * 1.12, true, Math.PI / 8)
  // a raised panel and a scallop on each of the eight faces
  const pc = shade(o.metal, 0.82), sc = shade(o.metal, 1.14)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, s = Math.sin(a), c = Math.cos(a)
    const ap = pedW / 2 + 0.012
    const P = (u: number, y: number): [number, number, number] => [cx + s * ap + c * u, y, cz + c * ap - s * u]
    const hw = pedW * 0.36, ya = yb + 0.12, yz = yt - 0.14
    out.quad([P(-hw, ya), P(hw, ya), P(hw, yz), P(-hw, yz)], [s, 0, c], UV, pc, FIXED)
    const ap2 = ap + 0.01
    const Q = (u: number, y: number): [number, number, number] => [cx + s * ap2 + c * u, y, cz + c * ap2 - s * u]
    const hs = pedW * 0.2, ys = yb + 0.22, yu = yt - 0.24
    out.quad([Q(-hs * 0.35, ys), Q(hs * 0.35, ys), Q(hs, yu), Q(-hs, yu)], [s, 0, c], UV, sc, FIXED)
    for (const k of [-0.5, 0, 0.5]) out.quad([Q(k * hs - 0.015, ys + 0.03), Q(k * hs + 0.015, ys + 0.03), Q(k * hs * 1.8 + 0.015, yu - 0.02), Q(k * hs * 1.8 - 0.015, yu - 0.02)], [s, 0, c], UV, pc, FIXED)
  }
  // the neck: foliage swelling over the cornice and drawing in under the vasque
  const yn = yt + 0.1, yv = yn + neckH
  lathe(out, cx, cz, [[rc * 0.78, yn], [rc * 0.9, yn + neckH * 0.2], [rc * 0.78, yn + neckH * 0.45], [rc * 0.5, yn + neckH * 0.72], [rc * 0.42, yv]], 24, o.metal)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    beam(out, [cx + Math.sin(a) * rc * 0.82, yn + neckH * 0.15, cz + Math.cos(a) * rc * 0.82], [cx + Math.sin(a) * rc * 0.62, yn + neckH * 0.62, cz + Math.cos(a) * rc * 0.62], 0.05, shade(o.metal, 1.12))
  }
  // dolphins climbing the neck, heads down, tails curling out under the vasque
  const nd = o.dolphins ?? 4
  for (let i = 0; i < nd; i++) {
    const a = ((i + 0.5) / nd) * Math.PI * 2, s = Math.sin(a), c = Math.cos(a)
    const P = (rr: number, y: number): V3 => [cx + s * rr, y, cz + c * rr]
    sweptTube(out, [P(rc * 0.98, yn + neckH * 0.1), P(rc * 0.82, yn + neckH * 0.3), P(rc * 0.74, yn + neckH * 0.55), P(rc * 0.9, yn + neckH * 0.78), P(rc * 1.2, yn + neckH * 0.9)], { r: (t) => 0.11 * (1 - 0.6 * t) + 0.03, sides: 8, c: shade(o.metal, 1.05) })
  }
  // the vasque: a wide shallow bowl, lugs with lion masks round the rim
  const rimY = fountainBowl(out, cx, cz, yv, vR, { depth: vD, stem: rc * 0.42, drop: 0.1, sides: 36, body: o.metal, water: o.water })
  const nm = o.masks ?? 12
  for (let i = 0; i < nm; i++) {
    const a = (i / nm) * Math.PI * 2, s = Math.sin(a), c = Math.cos(a)
    prism(out, cx + s * vR * 1.02, cz + c * vR * 1.02, rimY - 0.24, rimY + 0.06, 0.12, 6, shade(o.metal, 1.12), FIXED, 0.11, true)
    prism(out, cx + s * vR * 1.04, cz + c * vR * 1.04, rimY - 0.16, rimY + 0.0, 0.06, 5, shade(o.metal, 0.8), FIXED, 0.06, true)
  }
  // water: a thin ring of falls from the vasque lip into the basin, and a jet at the tuft
  const fall = o.fall ?? 0.05
  jetRing(out, cx, cz, 56, vR * 1.0, rimY - 0.05, Math.min(o.basinR - rim - 0.15, vR + 0.35), y0 + wall - 0.06, { rise: fall, r: 0.02, c: o.jet })
  // the tuft of reeds and the round plinth for the sculpture
  const tuft = rimY + 0.04
  prism(out, cx, cz, rimY, tuft + 0.1, 0.5, 12, shade(o.metal, 0.9), FIXED, 0.42, true)
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2
    beam(out, [cx + Math.sin(a) * 0.3, tuft + 0.05, cz + Math.cos(a) * 0.3], [cx + Math.sin(a) * 0.6, tuft + 0.45 + (i % 3) * 0.08, cz + Math.cos(a) * 0.6], 0.04, shade(o.metal, 1.1))
  }
  prism(out, cx, cz, tuft + 0.1, tuft + 0.38, 0.38, 14, o.metal, FIXED, 0.3, true)
  return { rim: rimY, plinthTop: tuft + 0.38 }
}
