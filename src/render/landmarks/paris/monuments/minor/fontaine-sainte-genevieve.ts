import { MeshBuilder, capPolygonWithHoles } from '../../../../buildings.ts'
import { prism, type Rgb } from '../../../../models.ts'
import { beam, block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { ccw, FIXED, walls, type P2 } from '../common.ts'
import { G } from '../plaza-common.ts'

/*
 * THE FONTAINE SAINTE-GENEVIÈVE (place Jacqueline-de-Romilly, corner of the rue de la Montagne-Sainte-Geneviève and the
 * rue Descartes, 5e, opposite the old École polytechnique; rebuilt 1864 after the 17th-century triangular fountain by
 * Guillain and Bernard was pulled down; Wikidata Q3076089): a semicircular stone wall about 6 m across, topped by a blue
 * iron railing, with a stone pier at each end bearing the city's escutcheon, a chain across the open side, and three
 * blue lion-head mascarons pouring into floor gratings. The lion head is a Modly model (statues manifest:
 * sainte-genevieve-lion). Frame: the chord (open side) lies on z = 0 and faces −z; the wall bulges toward +z; x along the
 * chord, y up from the base, pavement at G. Radius is OSM's 12-point arc (untagged way, ~3 m); heights are scaled off one
 * Commons photograph against the lion head (~0.3 m), not surveyed.
 */
export const HX = 3.6
export const HZ = 3.6

// tunables
export const RADIUS = 3.0         // outer radius of the wall, centre of the chord to the outside face
const WALL_T = 0.4                // wall thickness
const WALL_H = 0.62               // stone wall above the pavement
const PIER_W = 0.6                // the end piers' width along x and depth
const PIER_H = 1.55               // their height
const RAIL_H = 0.9                // iron railing above the wall top
const BAR_PITCH = 0.13            // spacing of railing bars (m of arc)
const CHAIN_Y = 0.7               // the chain across the open side
const LION_Y = 0.36               // lion mouth above the floor
const LION_ANGLES = [0.5, 0.25, 0.75] // as fractions of the half circle from the right pier
const SEG = 28                    // segments of the half circle

const STONE: Rgb = hex('#cfc8b4')
const FLOOR: Rgb = hex('#8e8c82')
const BLUE: Rgb = hex('#3b6fb5')
const GRATE: Rgb = hex('#3a3a38')
const CHAINC: Rgb = hex('#2d2d2d')
const WET: Rgb = hex('#7d9aa4')

/** Where the lion heads sit (landmark frame, facing into the basin): for the statues manifest */
export const LIONS: { at: [number, number, number]; bearing: number }[] = LION_ANGLES.map((f) => {
  const a = f * Math.PI
  const r = RADIUS - WALL_T
  return { at: [Math.cos(a) * r, G + LION_Y, Math.sin(a) * r], bearing: 0 }
})

const arc = (r: number, n: number, rev = false): P2[] => {
  const o: P2[] = []
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI
    o.push({ x: Math.cos(a) * r, z: Math.sin(a) * r })
  }
  return rev ? o.reverse() : o
}

function draw(q: MeshBuilder): void {
  const y0 = G
  const ri = RADIUS - WALL_T
  const rm = RADIUS - WALL_T / 2
  // the floor: a half disc a hand under the pavement's face, slightly darker and wet
  const half = arc(ri, SEG)
  capPolygonWithHoles(q, [ccw(half)], y0 + 0.03, FLOOR, FIXED)
  walls(q, half, y0, y0 + 0.03, shade(FLOOR, 0.9))
  // the wall: a half-ring band
  const band = [...arc(RADIUS, SEG), ...arc(ri, SEG, true)]
  walls(q, band, y0, y0 + WALL_H, STONE)
  capPolygonWithHoles(q, [ccw(band)], y0 + WALL_H, shade(STONE, 1.06), FIXED)
  // the end piers with a cap and the city's shield on the inner face
  for (const s of [-1, 1]) {
    const cx = s * rm
    block(q, cx - PIER_W / 2, cx + PIER_W / 2, -0.05, PIER_W - 0.05, y0, y0 + PIER_H, STONE)
    block(q, cx - PIER_W / 2 - 0.06, cx + PIER_W / 2 + 0.06, -0.11, PIER_W + 0.01, y0 + PIER_H, y0 + PIER_H + 0.1, shade(STONE, 1.06))
    block(q, cx - 0.14, cx + 0.14, -0.1, -0.05, y0 + PIER_H - 0.55, y0 + PIER_H - 0.2, shade(STONE, 0.82))
    // the scaled pattern on the pier faces: a few shallow bands
    for (let k = 0; k < 4; k++) block(q, cx - PIER_W / 2 - 0.01, cx + PIER_W / 2 + 0.01, 0.1 + k * 0.1, 0.14 + k * 0.1, y0 + 0.2, y0 + PIER_H - 0.7, shade(STONE, 0.94))
  }
  // the railing: bars every BAR_PITCH on the wall's centre line, a top and a middle rail, between the piers
  const a0 = Math.asin(PIER_W / 2 / rm) * 0.9 + 0.12
  const a1 = Math.PI - a0
  const n = Math.max(6, Math.round(((a1 - a0) * rm) / BAR_PITCH))
  const yt = y0 + WALL_H + RAIL_H
  let prev: [number, number] | null = null
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n
    const x = Math.cos(a) * rm
    const z = Math.sin(a) * rm
    block(q, x - 0.012, x + 0.012, z - 0.012, z + 0.012, y0 + WALL_H, yt, BLUE)
    if (prev) {
      for (const y of [yt, y0 + WALL_H + 0.05, y0 + WALL_H + RAIL_H * 0.5]) beam(q, [prev[0], y, prev[1]], [x, y, z], y === yt ? 0.02 : 0.012, BLUE)
    }
    prev = [x, z]
  }
  // the lion heads' wet streaks and gratings on the floor
  for (const f of LION_ANGLES) {
    const a = f * Math.PI
    const gx = Math.cos(a) * (ri - 0.45)
    const gz = Math.sin(a) * (ri - 0.45)
    block(q, gx - 0.22, gx + 0.22, gz - 0.12, gz + 0.12, y0 + 0.03, y0 + 0.045, GRATE)
    prism(q, Math.cos(a) * (ri - 0.2), Math.sin(a) * (ri - 0.2), y0 + 0.03, y0 + 0.04, 0.3, 10, WET, undefined, 0.3, true)
  }
  // the chain across the open side, sagging between the piers' inner faces
  const xa = rm - PIER_W / 2
  let pp: [number, number] | null = null
  for (let i = 0; i <= 10; i++) {
    const t = i / 10
    const x = -xa + 2 * xa * t
    const y = y0 + CHAIN_Y - 0.12 * Math.sin(Math.PI * t)
    if (pp) beam(q, [pp[0], pp[1], 0], [x, y, 0], 0.012, CHAINC)
    pp = [x, y]
  }
}

export function fontaineSainteGenevieve(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
