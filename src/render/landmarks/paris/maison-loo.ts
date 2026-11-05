import type { MeshBuilder } from '../../buildings.ts'
import { block, hex, roof, shade, type Rgb } from '../kit.ts'
import type { Fit } from '../fit.ts'

// tunables, read off the owner's street photograph (2026-11-04); local −z is the Rue de Courcelles front
const GROUND_H = 4.6       // the ground storey under the first tiled skirt
const MID_EAVES = 11.6     // the second skirt, over the loggia storey and the one above
const TOP_EAVES = 18.6     // the big flared hip roof
const SKIRT_OUT = 1.3      // how far the pent roofs stand out from the wall
const SKIRT_RISE = 1.1
const TOP_OUT = 1.6
const TOP_RISE = 3.6
const CORNER_LIFT = 0.45   // the upturned eave corners
const INSET = 0.6          // the upper storeys stand back from the ground storey
const BAYS = 4             // window bays per face
const LOGGIA = 3           // columned bays on the front's second storey

type Face = '-z' | '+z' | '-x' | '+x'

/**
 * Maison de Loo (La Pagoda), 48 rue de Courcelles (way 68828954): Fernand Bloch's 1926 remodelling of a Paris
 * hôtel for the dealer C.T. Loo. Not a pagoda but a square five-storey block painted oxblood red, ringed by three
 * tiers of tiled Chinese eaves with upturned corners, lattice windows between red piers, gilt friezes, a columned
 * loggia on the front's second storey and a green-ridged hip roof.
 */
export function maisonLoo(out: MeshBuilder, fit: Fit): void {
  const red = hex('#c2493c'), pier = shade(hex('#c2493c'), 0.86), tile = hex('#6b4436'), green = hex('#3f6b55')
  const gold = hex('#b89a5a'), lattice = hex('#8a6a42'), dark = hex('#2a2422'), iron = hex('#26282a')
  const hx = fit.hx, hz = fit.hz, ux = hx - INSET, uz = hz - INSET

  // ground storey, then the inset upper block
  block(out, -hx, hx, -hz, hz, 0, GROUND_H, red)
  block(out, -ux, ux, -uz, uz, GROUND_H, TOP_EAVES, red)
  skirt(out, hx, hz, GROUND_H, SKIRT_OUT, SKIRT_RISE, tile, green)
  skirt(out, ux, uz, MID_EAVES, SKIRT_OUT, SKIRT_RISE, tile, green)
  // the top: a flared skirt then the steep hip with its green ridge
  skirt(out, ux, uz, TOP_EAVES, TOP_OUT, 1.2, tile, green)
  roof(out, -ux - 0.2, ux + 0.2, -uz - 0.2, uz + 0.2, TOP_EAVES + 1.0, TOP_RISE, ux * 0.55, uz * 0.25, tile)
  const ry = TOP_EAVES + 1.0 + TOP_RISE
  block(out, -ux * 0.48, ux * 0.48, -uz * 0.78, uz * 0.78, ry - 0.15, ry + 0.25, green)

  for (const f of ['-z', '+z', '-x', '+x'] as Face[]) {
    const half = f === '-z' || f === '+z' ? ux : uz, ghalf = f === '-z' || f === '+z' ? hx : hz
    const wall = f === '-z' || f === '+z' ? uz : ux, gwall = f === '-z' || f === '+z' ? hz : hx
    const bw = (2 * half) / BAYS
    // red piers between the bays, gilt friezes under each skirt and over the loggia storey
    for (let i = 0; i <= BAYS; i++) fbox(out, f, -half + i * bw - 0.25, -half + i * bw + 0.25, wall, wall + 0.12, GROUND_H, TOP_EAVES, pier)
    for (const y of [MID_EAVES - 0.9, TOP_EAVES - 0.9, GROUND_H + 3.1]) fbox(out, f, -half, half, wall, wall + 0.08, y, y + 0.55, gold)
    // lattice windows on the three upper storeys
    for (let i = 0; i < BAYS; i++) {
      const u = -half + (i + 0.5) * bw
      for (const [y0, h] of [[GROUND_H + 0.9, 2.0], [GROUND_H + 4.0, 1.8], [MID_EAVES + 1.3, 2.0], [MID_EAVES + 4.0, 1.9]] as const) {
        if (f === '-z' && y0 < GROUND_H + 3 && Math.abs(i + 0.5 - BAYS / 2) < LOGGIA / 2) continue
        latticeWindow(out, f, u, wall, y0, Math.min(1.5, bw * 0.5), h, lattice, dark)
      }
      // the lattice balustrade panels at the foot of the second storey
      fbox(out, f, u - bw * 0.42, u + bw * 0.42, wall, wall + 0.1, GROUND_H + 0.2, GROUND_H + 0.8, lattice)
    }
    // ground storey: a door on the front, tall lattice windows elsewhere
    const gb = (2 * ghalf) / BAYS
    for (let i = 0; i < BAYS; i++) {
      const u = -ghalf + (i + 0.5) * gb
      if (f === '-z' && i === 0) {
        fbox(out, f, u - 1.0, u + 1.0, gwall, gwall + 0.06, 0, 2.9, dark)       // the gate
        fbox(out, f, u - 1.6, u + 1.6, gwall + 0.4, gwall + 1.4, 3.3, 3.6, tile) // its little tiled hood
      } else latticeWindow(out, f, u, gwall, 1.0, Math.min(1.3, gb * 0.45), 2.4, lattice, dark)
    }
    // the iron railing on a stone curb round the plot
    const rw = gwall + 1.8
    fbox(out, f, -ghalf - 1.8, ghalf + 1.8, rw, rw + 0.3, 0, 0.45, hex('#b9b5aa'))
    for (let u = -ghalf - 1.8; u <= ghalf + 1.8; u += 0.22) fbox(out, f, u - 0.02, u + 0.02, rw + 0.12, rw + 0.16, 0.45, 2.1, iron)
    fbox(out, f, -ghalf - 1.8, ghalf + 1.8, rw + 0.1, rw + 0.18, 2.0, 2.1, iron)
  }

  // the front loggia: round red columns carrying a lattice valance, a dark recess behind
  const lw = (2 * ux) / BAYS, z = -uz
  block(out, -lw * LOGGIA / 2, lw * LOGGIA / 2, z - 0.02, z + 0.02, GROUND_H + 0.8, GROUND_H + 3.0, dark)
  for (let k = 0; k <= LOGGIA * 2; k++) {
    const x = -lw * LOGGIA / 2 + (k * lw) / 2
    column(out, x, z - 0.8, GROUND_H + 0.8, GROUND_H + 3.1, 0.22, red)
  }
  block(out, -lw * LOGGIA / 2 - 0.3, lw * LOGGIA / 2 + 0.3, z - 1.1, z, GROUND_H + 2.6, GROUND_H + 3.1, lattice)
  block(out, -lw * LOGGIA / 2 - 0.3, lw * LOGGIA / 2 + 0.3, z - 1.1, z, GROUND_H + 3.1, GROUND_H + 3.4, red)
  block(out, -lw * LOGGIA / 2 - 0.3, lw * LOGGIA / 2 + 0.3, z - 1.1, z, GROUND_H + 0.6, GROUND_H + 0.8, red)
}

/** An axis-aligned box on a face: u along the face (left to right seen from outside), d outward from the centre. */
function fbox(out: MeshBuilder, f: Face, u0: number, u1: number, d0: number, d1: number, y0: number, y1: number, c: Rgb): void {
  if (f === '-z') block(out, u0, u1, -d1, -d0, y0, y1, c)
  else if (f === '+z') block(out, -u1, -u0, d0, d1, y0, y1, c)
  else if (f === '-x') block(out, -d1, -d0, -u1, -u0, y0, y1, c)
  else block(out, d0, d1, u0, u1, y0, y1, c)
}

/** A deep-set window with a timber lattice: dark glass, frame, and a grid of bars. */
function latticeWindow(out: MeshBuilder, f: Face, u: number, wall: number, y0: number, w: number, h: number, wood: Rgb, glass: Rgb): void {
  fbox(out, f, u - w / 2, u + w / 2, wall, wall + 0.03, y0, y0 + h, glass)
  fbox(out, f, u - w / 2 - 0.1, u + w / 2 + 0.1, wall, wall + 0.1, y0 - 0.1, y0, wood)
  fbox(out, f, u - w / 2 - 0.1, u + w / 2 + 0.1, wall, wall + 0.1, y0 + h, y0 + h + 0.1, wood)
  for (let k = 0; k <= 4; k++) { const x = u - w / 2 + (k * w) / 4; fbox(out, f, x - 0.035, x + 0.035, wall, wall + 0.08, y0, y0 + h, wood) }
  for (let y = y0 + 0.3; y < y0 + h; y += 0.3) fbox(out, f, u - w / 2, u + w / 2, wall, wall + 0.07, y - 0.03, y + 0.03, wood)
}

/** A pent roof all round a w×d block at eaves height y, with green ridges at the wall and lifted corners. */
function skirt(out: MeshBuilder, hx: number, hz: number, y: number, o: number, rise: number, tile: Rgb, green: Rgb): void {
  roof(out, -hx - o, hx + o, -hz - o, hz + o, y - rise, rise, o, o, tile)
  block(out, -hx - o, hx + o, -hz - o - 0.05, -hz - o + 0.12, y - rise - 0.12, y - rise + 0.05, green)
  block(out, -hx - o, hx + o, hz + o - 0.12, hz + o + 0.05, y - rise - 0.12, y - rise + 0.05, green)
  block(out, -hx - o - 0.05, -hx - o + 0.12, -hz - o, hz + o, y - rise - 0.12, y - rise + 0.05, green)
  block(out, hx + o - 0.12, hx + o + 0.05, -hz - o, hz + o, y - rise - 0.12, y - rise + 0.05, green)
  block(out, -hx - 0.1, hx + 0.1, -hz - 0.1, hz + 0.1, y - 0.15, y + 0.1, green)
  // the upturned corners: tiled wedges stepping up and out
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const r = o + 0.15 * k, lift = (CORNER_LIFT * (k + 1)) / 3
      block(out, sx * (hx + r) - 0.35, sx * (hx + r) + 0.35, sz * (hz + r) - 0.35, sz * (hz + r) + 0.35, y - rise + lift - 0.15, y - rise + lift, tile)
    }
  }
}

/** An octagonal column standing on the ground at y0. */
function column(out: MeshBuilder, x: number, z: number, y0: number, y1: number, r: number, c: Rgb): void {
  block(out, x - r, x + r, z - r * 0.42, z + r * 0.42, y0, y1, c)
  block(out, x - r * 0.42, x + r * 0.42, z - r, z + r, y0, y1, c)
  block(out, x - r * 0.75, x + r * 0.75, z - r * 0.75, z + r * 0.75, y0, y1, c)
}
