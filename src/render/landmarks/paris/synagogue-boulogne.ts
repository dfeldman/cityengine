import type { MeshBuilder } from '../../buildings.ts'
import { archedPane, block, hex, pane, roof, shade, type Rgb } from '../kit.ts'
import type { Fit } from '../fit.ts'

// tunables, read off the owner's two street views (2026-11-04); local −z is the rue des Abondances front
const HOUSE_EAVES = 8.2     // the two-storey gabled house on the street
const ANNEX_EAVES = 7.6     // the gabled annex with the star rondel
const HALL_EAVES = 13.5     // the prayer hall behind
const LANTERN_H = 3.2       // the square clerestory over the hall's hip roof
const GABLE_PITCH = 0.42    // gable rise per metre of half-width
const OVERHANG = 0.7        // the deep eaves
const FENCE_H = 2.4
const STAR_R = 0.9          // the rondel's star

/**
 * Synagogue de Boulogne, rue des Abondances (way 72055705). Buff brick with stone dressings, round-arched
 * windows, wide tiled eaves — basically a large house; the Star of David in a stone rondel on the annex gable
 * says what it is. A tall hip-roofed hall with a clerestory lantern stands behind, and a grey steel fence
 * closes the street.
 */
/** A glazed round-headed window with its iron glazing bars. */
function sash(out: MeshBuilder, plane: number, t: number, y0: number, w: number, h: number, glass: Rgb): void {
  archedPane(out, plane, t, y0, w, h, glass)
  const bar = hex('#8f8a7c'), n = Math.max(1, Math.round(w / 0.4))
  for (let k = 1; k < n + 1; k++) pane(out, '-z', plane - 0.02, t - w / 2 + (k * w) / (n + 1), y0, 0.04, h - w / 2, bar)
  for (let y = y0 + 0.45; y < y0 + h - w / 2; y += 0.45) pane(out, '-z', plane - 0.02, t, y, w, 0.04, bar)
}

export function synagogueBoulogne(out: MeshBuilder, fit: Fit): void {
  const brick = hex('#cdb98a'), stone = hex('#d9cfb6'), tile = hex('#5b4a40'), glass = hex('#2c3330'), steel = hex('#4d5863')
  const hx = fit.hx, hz = fit.hz, zf = -hz
  const xm = -hx + 0.45 * 2 * hx                       // where the house meets the annex
  // the hall: the back two thirds, full height, hip roof and lantern
  const hz0 = zf + 0.38 * 2 * hz
  block(out, -hx + 1.5, hx - 1.5, hz0, hz - 0.5, 0, HALL_EAVES, brick)
  block(out, -hx + 1.3, hx - 1.3, hz0 - 0.2, hz - 0.3, HALL_EAVES - 1.1, HALL_EAVES - 0.5, stone)  // the carved frieze band
  roof(out, -hx + 1.5 - OVERHANG, hx - 1.5 + OVERHANG, hz0 - OVERHANG, hz - 0.5 + OVERHANG, HALL_EAVES, 2.6, (hx - 1.5) * 0.55, (hz - 0.5 - hz0) * 0.3, tile)
  const lw = (hx - 1.5) * 0.45, lc = (hz0 + hz - 0.5) / 2, ld = (hz - 0.5 - hz0) * 0.22
  block(out, -lw, lw, lc - ld, lc + ld, HALL_EAVES + 1.5, HALL_EAVES + 1.5 + LANTERN_H, brick)
  roof(out, -lw - 0.5, lw + 0.5, lc - ld - 0.5, lc + ld + 0.5, HALL_EAVES + 1.5 + LANTERN_H, 1.2, lw * 0.7, ld * 0.5, tile)
  for (let i = -2; i <= 2; i++) sash(out, lc - ld, i * lw * 0.38, HALL_EAVES + 2.2, 0.45, 1.5, glass)
  // the hall's street-facing upper wall above the front wings: two tiers of arched windows between piers
  const hw = 2 * hx - 3
  for (let i = 0; i < 5; i++) {
    const t = -hx + 1.5 + (i + 0.5) * hw / 5
    sash(out, hz0, t, HALL_EAVES - 4.6, 1.0, 2.8, glass)
    sash(out, hz0, t, HALL_EAVES - 0.9 - 1.0, 0.5, 0.9, glass)
  }
  for (const t of [-hx + 1.5, hx - 1.5]) block(out, t - 0.8, t + 0.8, hz0 - 0.5, hz0 + 1, 0, HALL_EAVES - 1.1, shade(brick, 1.04))

  // the house and the annex on the street, gable ends to the street
  gabled(out, -hx, xm - 0.3, zf, hz0 + 1, HOUSE_EAVES, brick, stone, tile)
  gabled(out, xm + 0.3, hx, zf + 0.8, hz0 + 1, ANNEX_EAVES, brick, stone, tile)
  block(out, xm - 0.3, xm + 0.3, zf + 1.5, hz0, 0, 4.2, shade(brick, 0.9))        // the recessed entrance between them
  block(out, xm - 1.2, xm + 1.2, zf + 0.6, zf + 1.6, 4.2, 4.35, tile)              // its little tiled canopy

  // house: three arched ground-floor windows under stone hoods, a coupled arched pair above, a stone string course
  const hc = (-hx + xm - 0.3) / 2, hwid = xm - 0.3 + hx
  block(out, -hx - 0.05, xm - 0.25, zf - 0.08, zf, 4.0, 4.3, stone)
  block(out, -hx - 0.05, xm - 0.25, zf - 0.1, zf, 0, 0.9, shade(stone, 0.85))      // the stone plinth
  for (const k of [-1, 0, 1]) {
    const t = hc + k * hwid * 0.27
    sash(out, zf - 0.04, t, 1.1, 1.5 + 0.5, 2.6 + 0.3, stone)
    archedPane(out, zf - 0.06, t, 1.25, 1.3, 2.6, glass)
  }
  for (const k of [-0.5, 0.5]) {
    const t = hc + k * 1.6
    sash(out, zf - 0.04, t, 5.0, 1.45, 2.4, stone)
    archedPane(out, zf - 0.06, t, 5.1, 1.2, 2.2, glass)
  }
  // annex: a coupled lancet pair under the gable, single lancets either side, and the star rondel
  const ac = (xm + 0.3 + hx) / 2, aw = hx - xm - 0.3, az = zf + 0.8
  for (const t of [ac - 0.4, ac + 0.4]) sash(out, az - 0.06, t, 4.3, 0.4, 2.4, glass)
  archedPane(out, az - 0.04, ac, 4.2, 1.6, 2.7, stone)
  for (const t of [ac - aw * 0.33, ac + aw * 0.33]) { archedPane(out, az - 0.04, t, 3.2, 0.9, 2.0, stone); sash(out, az - 0.06, t, 3.3, 0.4, 1.8, glass) }
  disc(out, ac, 2.6, az - 0.05, STAR_R * 1.3, stone)
  star(out, ac, 2.6, az - 0.08, STAR_R, shade(stone, 0.6), 0.09)

  // the steel fence along the street, vertical bars over a solid lower panel
  const fz = zf - 1.2
  pane(out, '-z', fz, 0, 0.6, 2 * hx, FENCE_H - 0.9, steel, 0)
  block(out, -hx, hx, fz, fz + 0.3, 0, 0.6, hex('#b9b5aa'))
  for (let x = -hx; x <= hx; x += 0.25) block(out, x - 0.02, x + 0.02, fz - 0.03, fz + 0.03, 0.6, FENCE_H, steel)
}

/** A brick volume with its gable end to the street: walls, stone gable coping, tiled pitch overhanging the sides. */
function gabled(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, eaves: number, brick: Rgb, stone: Rgb, tile: Rgb): void {
  const w = (x1 - x0) / 2, c = (x0 + x1) / 2, rise = w * GABLE_PITCH * 2
  block(out, x0, x1, z0, z1, 0, eaves, brick)
  roof(out, x0 - OVERHANG, x1 + OVERHANG, z0 - OVERHANG * 0.6, z1, eaves - OVERHANG * GABLE_PITCH * 2, rise + OVERHANG * GABLE_PITCH * 2, w + OVERHANG, 0, tile)
  const tri = (y0: number, r: number, h: number, z: number, col: Rgb): void =>
    out.quad([[c + r, y0, z], [c - r, y0, z], [c, y0 + h, z], [c, y0 + h, z]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], col, 0)
  const zg = z0 - OVERHANG * 0.6 - 0.02              // the gable stands proud of the roof's own end face
  tri(eaves - 0.25, w + 0.1, rise + 0.25, zg, stone)
  tri(eaves, w - 0.35, rise - 0.35 * GABLE_PITCH * 2, zg - 0.02, brick)
  block(out, x0, x1, zg, z0, eaves - 0.4, eaves, brick)
  block(out, x0 - 0.05, x1 + 0.05, z0 - 0.08, z1, eaves - 0.4, eaves - 0.1, stone)   // the cornice band
}

type V = [number, number, number]
function disc(out: MeshBuilder, cx: number, cy: number, z: number, r: number, col: Rgb): void {
  for (let k = 0; k < 16; k++) {
    const a0 = (k * Math.PI) / 8, a1 = ((k + 1) * Math.PI) / 8
    out.quad([[cx, cy, z], [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, z], [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, z], [cx, cy, z]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], col, 0)
  }
}

/** A Star of David in bars on a −z face. */
function star(out: MeshBuilder, cx: number, cy: number, z: number, r: number, col: Rgb, t: number): void {
  for (const up of [1, -1]) {
    const v: V[] = [0, 1, 2].map((k) => {
      const a = up * Math.PI / 2 + (k * 2 * Math.PI) / 3
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r, z]
    })
    for (let k = 0; k < 3; k++) {
      const a = v[k], b = v[(k + 1) % 3], l = Math.hypot(b[0] - a[0], b[1] - a[1])
      const nx = (-(b[1] - a[1]) / l) * t, ny = ((b[0] - a[0]) / l) * t
      out.quad([[a[0] + nx, a[1] + ny, z], [b[0] + nx, b[1] + ny, z], [b[0] - nx, b[1] - ny, z], [a[0] - nx, a[1] - ny, z]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], col, 0)
    }
  }
}
