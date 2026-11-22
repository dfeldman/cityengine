import { MeshBuilder, capPolygonWithHoles } from '../../../buildings.ts'
import { prism, type Rgb } from '../../../models.ts'
import { block, roof, shade } from '../../kit.ts'
import { ccw, FIXED, UV, walls, type P2 } from './common.ts'
import { basin, circle, falls, G, spout } from './plaza-common.ts'

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

export { UV }
