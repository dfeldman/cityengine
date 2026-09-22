import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { block, hex, shade } from '../kit.ts'
import type { Fit } from '../fit.ts'

const FIXED = 0

/**
 * The classical temple fronts of Paris (PARIS_EXPAND §5 B, a family): a stepped podium, a row of Corinthian
 * columns, the entablature with its frieze, and the PEDIMENT with its sculpted tympanum.
 *
 * `peripteral`: columns all the way round (the Madeleine, 52 of them); else a portico on the front only, set
 * against the building behind (the Assemblée nationale's twelve columns to the Seine).
 *
 * Local frame: the front faces −z; the long axis along z for a peripteral temple, x for a portico.
 */
interface TempleSpec {
  peripteral: boolean
  /** columns across the front */
  front: number
  /** column height, and the podium's */
  col: number
  podium: number
  /** the portico's own width (a portico on a wider building); the whole front when absent */
  width?: number
}

function temple(out: MeshBuilder, fit: Fit, t: TempleSpec): void {
  const stone = hex('#e3d9c4')
  const deep = shade(stone, 0.84)
  const shadow: Rgb = [0.34, 0.33, 0.31]
  const hx = t.peripteral ? Math.min(Math.max(fit.hx, 18), 24) : Math.min(fit.hx, (t.width ?? 60) / 2)
  const hz = t.peripteral ? Math.min(Math.max(fit.hz, 45), 56) : Math.min(fit.hz, 30)
  const r = t.col / 20
  const cap = t.col
  const ent = cap + t.col * 0.2
  const front = -hz
  // the podium and its steps across the front
  const steps = 8
  for (let i = 0; i < steps; i++) {
    const out0 = (steps - i) * (t.podium / steps) * 1.2
    block(out, -hx - (t.peripteral ? 1.5 : 0) - (t.peripteral ? 0 : 0), hx + (t.peripteral ? 1.5 : 0), front - out0, t.peripteral ? hz + 1.5 : front + 12, (i * t.podium) / steps, ((i + 1) * t.podium) / steps, shade(stone, 0.9 + (i % 2) * 0.04))
  }
  const y0 = t.podium
  if (t.peripteral) {
    // the cella: the solid wall inside the colonnade, in shadow
    block(out, -hx + 4, hx - 4, front + 5, hz - 4, y0, y0 + ent - 1, deep)
  }
  // the columns: base, fluted shaft (as a 12-sided prism), a Corinthian capital as a flaring block
  const colAt = (x: number, z: number): void => {
    box(out, x, y0 + 0.3, z, r * 1.5, 0.3, r * 1.5, stone, FIXED)
    prism(out, x, z, y0 + 0.6, y0 + cap - 1.2, r, 12, stone, FIXED, r * 0.86)
    prism(out, x, z, y0 + cap - 1.2, y0 + cap - 0.25, r * 0.9, 8, shade(stone, 1.04), FIXED, r * 1.35)
    box(out, x, y0 + cap - 0.12, z, r * 1.5, 0.12, r * 1.5, stone, FIXED)
  }
  const across = (i: number): number => -hx + 1 + ((2 * hx - 2) * i) / (t.front - 1)
  for (let i = 0; i < t.front; i++) colAt(across(i), front + 1)
  if (t.peripteral) {
    for (let i = 0; i < t.front; i++) colAt(across(i), hz - 1)
    const side = Math.round((t.front * hz) / hx)
    for (let j = 1; j < side - 1; j++) {
      const z = front + 1 + ((2 * hz - 2) * j) / (side - 1)
      colAt(-hx + 1, z)
      colAt(hx - 1, z)
    }
  } else {
    // a second row behind the first, and the wall of the building behind the portico, in shadow
    for (let i = 0; i < t.front; i++) colAt(across(i), front + 5)
    block(out, -hx, hx, front + 9, front + 10, y0, y0 + ent, shadow)
  }
  // the entablature: architrave, frieze, cornice
  const z1 = t.peripteral ? hz : front + 10
  block(out, -hx, hx, front, z1, y0 + cap, y0 + cap + t.col * 0.07, shade(stone, 1.02))
  block(out, -hx, hx, front, z1, y0 + cap + t.col * 0.07, y0 + cap + t.col * 0.14, stone)
  block(out, -hx - 0.4, hx + 0.4, front - 0.4, z1 + (t.peripteral ? 0.4 : 0), y0 + cap + t.col * 0.14, y0 + ent, shade(stone, 1.05))
  // the pediment over the front (and the back of a temple), its tympanum with a sculpted relief in shadow
  const rise = hx * 0.36
  const ped = (z: number, face: -1 | 1): void => {
    const b = y0 + ent
    const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
    // the tympanum's two faces as triangles, and the two raking cornices over them
    for (const zz of [z - 1.2, z + 1.2]) {
      const n: [number, number, number] = [0, 0, zz < z ? -1 : 1]
      out.quad([[-hx, b, zz], [hx, b, zz], [0, b + rise, zz], [0, b + rise, zz]], n, UVQ, stone, FIXED)
    }
    const len = Math.hypot(hx, rise)
    for (const sx of [-1, 1]) {
      const nx = (sx * rise) / len
      const ny = hx / len
      out.quad([[sx * (hx + 0.5), b - 0.2, z - 1.6], [0, b + rise + 0.5, z - 1.6], [0, b + rise + 0.5, z + 1.6], [sx * (hx + 0.5), b - 0.2, z + 1.6]],
        [nx, ny, 0], UVQ, shade(stone, 1.06), FIXED)
      out.quad([[sx * (hx + 0.5), b - 0.2, z - 1.6], [sx * (hx + 0.5), b - 0.75, z - 1.6], [0, b + rise - 0.05, z - 1.6], [0, b + rise + 0.5, z - 1.6]],
        [0, 0, -1], UVQ, shade(stone, 0.95), FIXED)
    }
    // the relief: a darker band of figures low across the tympanum
    block(out, -hx * 0.62, hx * 0.62, z + face * 1.25 - 0.05, z + face * 1.25 + 0.05, b + 0.4, b + rise * 0.45, shade(stone, 0.8))
    for (let i = -5; i <= 5; i++) prism(out, i * hx * 0.1, z + face * 1.3, b + 0.4, b + rise * (0.62 - Math.abs(i) * 0.05), 0.45, 6, shade(stone, 0.88), FIXED, 0.3)
  }
  ped(front + 0.8, -1)
  if (t.peripteral) {
    ped(hz - 0.8, 1)
    // the roof between the pediments, low-pitched
    for (const sx of [-1, 1]) {
      out.quad([[sx * hx, y0 + ent, front + 2], [sx * hx, y0 + ent, hz - 2], [0, y0 + ent + rise, hz - 2], [0, y0 + ent + rise, front + 2]],
        [sx * 0.5, 0.87, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], hex('#7a8084'), FIXED)
    }
  }
}

/** The Madeleine: a Corinthian temple, 52 columns on a 7 m podium, the Last Judgement in its pediment. */
export function madeleine(out: MeshBuilder, fit: Fit): void {
  temple(out, fit, { peripteral: true, front: 8, col: 20, podium: 6.5 })
}

/** The Palais Bourbon's portico to the Seine: twelve columns and a pediment, across the Pont de la Concorde. */
export function assembleePortico(out: MeshBuilder, fit: Fit): void {
  temple(out, fit, { peripteral: false, front: 12, col: 16, podium: 5, width: 48 })
}
