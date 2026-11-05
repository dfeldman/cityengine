import type { MeshBuilder } from '../../buildings.ts'
import { block, hex, pane, shade, type Rgb } from '../kit.ts'
import { box } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import type { Fit } from '../fit.ts'

const FIXED = 0
const CONCRETE = surfaceTag('concrete')
/** a box in white concrete, so the pale faces are not read as ashlar */
const slab = (out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, c: Rgb): void =>
  box(out, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2, c, CONCRETE)

// tunables, read off the street photo (three doors ≈ 3.3 m each set the scale)
const BASE_H = 5.2          // the beige ashlar plinth
const TOP_H = 9.8           // top of the claustra screen
const SCREEN_INSET = 0.12   // the screen stands just behind the plinth face
const HALF_W = 7           // the front is ~14 m (three doors and their piers)
const SCREEN_SIDE = 0.14    // fraction of the width left plain white at each end of the screen
const COLS = 17             // star cells across the screen
const ROWS = 7              // and up it
const STAR_R = 0.7          // hexagram point radius, as a fraction of the cell pitch
const HOLE_R = 0.33         // the dark hexagonal opening in each star
const DOOR_W = 3.1
const DOOR_H = 3.0
const DOOR_GAP = 0.55

/**
 * Synagogue Don Isaac Abravanel, 84 rue de la Roquette (1960s, Sephardi). A low street front between two
 * tall white neighbours: a plinth of beige stone with three grey-blue steel doors (the middle one bearing a
 * Star of David, under a thin glass canopy), a line of Hebrew carved above them, and over it all a white
 * concrete claustra — a lattice of interlocking Stars of David, dark hexagonal openings at their hearts.
 * No cross, no bell, no spire: none belongs here.
 */
export function synagogueAbravanel(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#c2b29c')
  const white = hex('#eceae4')
  const dark = hex('#24262a')
  const steel = hex('#6e7d8f')
  const hx = Math.min(fit.hx, HALF_W)
  const hz = Math.max(4, fit.hz)
  const zf = -hz
  // the prayer hall behind, below the top of the screen, and the plinth in front
  slab(out, -hx, hx, zf + 1.2, hz, 0, TOP_H - 0.6, white)
  block(out, -hx, hx, zf, zf + 1.2, 0, BASE_H, stone)
  block(out, -hx - 0.05, hx + 0.05, zf - 0.08, zf + 1.2, BASE_H - 0.15, BASE_H, shade(stone, 1.08))
  // the Hebrew line above the middle door, as a faint carved band
  pane(out, '-z', zf - 0.01, 0, DOOR_H + 1.05, 4.4, 0.22, shade(stone, 0.8))
  // three doors, vertical ribs, the middle one with its star and canopy
  for (const i of [-1, 0, 1]) {
    const x = i * (DOOR_W + DOOR_GAP)
    pane(out, '-z', zf - 0.02, x, 0.15, DOOR_W, DOOR_H, steel)
    for (let k = 1; k < 12; k++) pane(out, '-z', zf - 0.035, x - DOOR_W / 2 + (k * DOOR_W) / 12, 0.15, 0.04, DOOR_H, shade(steel, 0.85))
    pane(out, '-z', zf - 0.04, x, 0.15, 0.05, DOOR_H, shade(steel, 0.7))
  }
  block(out, -DOOR_W / 2 - 0.3, DOOR_W / 2 + 0.3, zf - 0.9, zf, DOOR_H + 0.3, DOOR_H + 0.36, hex('#7d8a8c'))
  outlineStar(out, 0, 1.75, zf - 0.12, 0.85, 0.07, shade(steel, 0.75))
  // the claustra: white frame, dark void behind, white hexagrams with dark hexagonal hearts
  const z = zf + SCREEN_INSET
  const w = 2 * hx * (1 - 2 * SCREEN_SIDE)
  const y0 = BASE_H
  const h = TOP_H - BASE_H
  slab(out, -hx, hx, z, z + 0.6, y0, TOP_H, white)
  pane(out, '-z', z - 0.01, 0, y0 + 0.12, w, h - 0.35, dark)
  slab(out, -hx, hx, z - 0.15, z + 0.6, TOP_H - 0.25, TOP_H, shade(white, 0.92))
  const px = w / COLS
  const py = (h - 0.35) / ROWS
  const p = Math.min(px, py)
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cx = -w / 2 + (c + 0.5) * px
      const cy = y0 + 0.12 + (r + 0.5) * py
      filledStar(out, cx, cy, z - 0.09, p * STAR_R, white)
      hexagon(out, cx, cy, z - 0.1, p * HOLE_R, dark)
    }
  }
}

type V = [number, number, number]
const tri = (out: MeshBuilder, a: V, b: V, c: V, col: Rgb): void =>
  out.quad([a, c, b, b], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], col, CONCRETE)

function triangle(cx: number, cy: number, z: number, r: number, up: number): V[] {
  return [0, 1, 2].map((k) => {
    const a = up * Math.PI / 2 + (k * 2 * Math.PI) / 3
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r, z] as V
  })
}

function filledStar(out: MeshBuilder, cx: number, cy: number, z: number, r: number, col: Rgb): void {
  for (const up of [1, -1]) {
    const t = triangle(cx, cy, z, r, up)
    tri(out, t[0], t[1], t[2], col)
  }
}

function hexagon(out: MeshBuilder, cx: number, cy: number, z: number, r: number, col: Rgb): void {
  for (let k = 0; k < 6; k++) {
    const a0 = (k * Math.PI) / 3
    const a1 = ((k + 1) * Math.PI) / 3
    tri(out, [cx, cy, z], [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, z], [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, z], col)
  }
}

/** A Star of David drawn in bars, as welded onto the middle door. */
function outlineStar(out: MeshBuilder, cx: number, cy: number, z: number, r: number, t: number, col: Rgb): void {
  for (const up of [1, -1]) {
    const v = triangle(cx, cy, z, r, up)
    for (let k = 0; k < 3; k++) {
      const a = v[k]
      const b = v[(k + 1) % 3]
      const dx = b[0] - a[0]
      const dy = b[1] - a[1]
      const l = Math.hypot(dx, dy)
      const nx = (-dy / l) * t
      const ny = (dx / l) * t
      out.quad([[a[0] + nx, a[1] + ny, z], [b[0] + nx, b[1] + ny, z], [b[0] - nx, b[1] - ny, z], [a[0] - nx, a[1] - ny, z]],
        [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], col, FIXED)
    }
  }
}
