/**
 * THE CARNEGIE BRANCH LIBRARIES (1909–1918), libraries audit 2026-10-04: generic blocks until now. They share one
 * plan — a raised basement of small windows, the reading room over it lit by a row of TALL windows (arched or
 * square-headed), a moulded cornice, a red tile hip roof, the entrance in the middle of the street front up a short
 * flight of steps, in a stone surround with a little pediment — and differ in their wall and their windows. Each from a
 * Mapillary frame on its street.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { tower, towerRing } from '../tower.ts'
import { boxAlong, edgeAt, edgeFacing } from '../parts.ts'

interface Branch { wall: Rgb; trim: Rgb; material: 'brick' | 'stucco' | 'terracotta' | 'ashlar'; arched: boolean; base: number; H: number; flat?: boolean }

const TILE: Rgb = [0.42, 0.21, 0.16]

function carnegieBranch(b: Branch): (out: MeshBuilder, fit: Fit) => void {
  return (out, fit) => {
    const H = b.H
    tower(out, fit, {
      height: H,
      base: { height: b.base, face: { kind: 'punched', wall: b.wall, glass: [0.18, 0.18, 0.2], pitch: 3.2, floor: b.base, solid: 0.7, material: b.material } },
      tiers: [{ to: H, face: { kind: 'punched', wall: b.wall, glass: [0.2, 0.22, 0.24], pitch: 3.4, floor: H - b.base, solid: 0.42, arched: b.arched, material: b.material }, cornice: { depth: 0.6, height: 0.7, colour: b.trim } }],
      roof: b.flat ? [0.4, 0.4, 0.38] : TILE,
      crown: b.flat ? { kind: 'parapet', height: 0.6, colour: [0.3, 0.32, 0.3] } : { kind: 'hip', height: 3, inset: 0.3, colour: TILE, material: 'tile' },
    })
    // the entrance on the street front: a stone surround, its pediment, the dark doors, the steps up to them
    const ring = towerRing(fit)
    const e = edgeAt(ring, edgeFacing(ring))
    const at = (u: number, o: number): [number, number] => [e.mid.x + e.tx * u + e.nx * o, e.mid.z + e.tz * u + e.nz * o]
    const st = surfaceTag(b.material === 'brick' ? 'ashlar' : b.material)
    let [x, z] = at(0, 0.25)
    boxAlong(out, x, b.base + 1.6, z, 1.7, 1.9, 0.25, e.heading, b.trim, st)
    ;[x, z] = at(0, 0.52)
    boxAlong(out, x, b.base + 1.1, z, 0.95, 1.4, 0.04, e.heading, [0.28, 0.2, 0.14], 0)
    for (let k = 0; k < 4; k++) {
      ;[x, z] = at(0, 0.5 + 0.45 * (4 - k))
      boxAlong(out, x, (b.base * (k + 1)) / 4 / 2, z, 2.2, (b.base * (k + 1)) / 4 / 2, 0.23, e.heading, b.trim, st)
    }
    for (let k = 0; k < 4; k++) {
      ;[x, z] = at(0, 0.3)
      boxAlong(out, x, b.base + 3.65 + k * 0.22, z, 1.9 - k * 0.45, 0.11, 0.3, e.heading, b.trim, st)
    }
  }
}

/**
 * Potrero Branch (1951, rebuilt 2010), 1616 20th Street (way/267263053), Commons "Portrero Branch (4506342194).jpg":
 * a white stucco frame holding two storeys of glass in a dark grid of mullions, a deep roof canopy soffited in
 * warm red-brown wood along the top, and a second, lower wood canopy over the door at one side under the lettering.
 * Front 0: 20th Street is north.
 */
function potreroBranchLibrary(out: MeshBuilder, fit: Fit): void {
  const H = 10
  const WHITE: Rgb = [0.92, 0.92, 0.9], WOOD: Rgb = [0.52, 0.27, 0.17], MULLION: Rgb = [0.16, 0.17, 0.18], GLASS: Rgb = [0.34, 0.46, 0.5]
  tower(out, fit, {
    height: H,
    tiers: [{ to: H, face: { kind: 'blank', wall: WHITE, material: 'stucco' } }],
    roof: [0.6, 0.6, 0.6],
    crown: { kind: 'parapet', height: 0.6, colour: WHITE, material: 'stucco' },
  })
  const ring = towerRing(fit)
  const e = edgeAt(ring, edgeFacing(ring, 180))
  const on = (u: number, y: number, o: number, w: number, h: number, d: number, c: Rgb, tag: number): void =>
    boxAlong(out, e.mid.x + e.tx * u + e.nx * o, y, e.mid.z + e.tz * u + e.nz * o, w / 2, h / 2, d / 2, e.heading, c, tag)
  const glass = surfaceTag('glass'), metal = surfaceTag('metal'), wood = surfaceTag('clapboard')
  const gw = e.L - 2.4
  // the glass wall, set in the white frame
  on(0, 4.6, 0.04, gw, 7.6, 0.06, GLASS, glass)
  for (let k = 0; k <= 6; k++) on(-gw / 2 + (k * gw) / 6, 4.6, 0.1, 0.12, 7.6, 0.1, MULLION, metal)
  for (const y of [1, 3.3, 5.6, 8.3]) on(0, y, 0.1, gw, 0.12, 0.1, MULLION, metal)
  // the white frame proud round it
  on(0, H - 0.6, 0.35, e.L, 1.2, 0.7, WHITE, surfaceTag('stucco'))
  for (const s of [-1, 1]) on(s * (e.L / 2 - 0.6), H / 2, 0.35, 1.2, H, 0.7, WHITE, surfaceTag('stucco'))
  // the wood-soffited roof canopy, and the lower one over the door
  on(0, H - 0.05, 1.4, e.L + 0.6, 0.5, 2.8, WOOD, wood)
  on(e.L * 0.22, 3.6, 1.3, e.L * 0.42, 0.35, 2.6, WOOD, wood)
}

export const LIBRARIES: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  potreroBranchLibrary,
  /** Mission Branch (1916, John Reid Jr.), 24th and Bartlett: dusty pink-beige terracotta, five great arched windows */
  missionBranchLibrary: carnegieBranch({ wall: [0.78, 0.68, 0.62], trim: [0.82, 0.74, 0.66], material: 'terracotta', arched: true, base: 4.2, H: 13 }),
  /** Noe Valley (1916, John Reid Jr.), Jersey Street: buff brick, square-headed windows under a lettered frieze */
  noeValleyBranchLibrary: carnegieBranch({ wall: [0.78, 0.7, 0.56], trim: [0.82, 0.77, 0.66], material: 'brick', arched: false, base: 3.4, H: 10 }),
  /** Sunset Branch (1918, G. Albert Lansburgh), Irving at 18th Ave: red brick, tall round-arched windows */
  /** Park Branch (1909), 1833 Page St: buff brick, tall square windows, the pedimented door up a long stair, a dark
   *  cornice over a flat roof (Commons, "Park Branch Library, San Francisco, California, US.jpg") */
  parkBranchLibrary: carnegieBranch({ wall: [0.66, 0.54, 0.4], trim: [0.86, 0.82, 0.72], material: 'brick', arched: false, base: 3.2, H: 11, flat: true }),
  sunsetBranchLibrary: carnegieBranch({ wall: [0.56, 0.28, 0.22], trim: [0.82, 0.78, 0.7], material: 'brick', arched: true, base: 2.4, H: 11 }),
}
