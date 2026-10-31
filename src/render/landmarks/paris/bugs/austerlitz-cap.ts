/**
 * THE COVER OVER AUSTERLITZ'S TRACKS (owner, 2026-10-31, 48.835407, 2.371575: "a bunch of train tunnel entrances. but they make no sense, they're
 * pointing all different ways. the reality is theres just a cap across the tracks"). Paris Rive Gauche is being built on slabs across the
 * track bed, one at a time, with open cuts left between them. Traced from the aerial of 2023: the plaza nearest the viaduct, the finished
 * slab, and the one under construction, each square across the cut, walled to the street on both sides.
 *
 * The bake levels the cut's floor (regions.json `levelGrounds`), and tools/paris-portals.ts places no mouths in it: this is all that stands here.
 * u runs down the cut, south-east, from the middle of the finished slab; v across it to the Avenue de France. The entry's front
 * turns local (x, z) to (6 − v, u − 26), and its base is the cut's floor.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'

const CONCRETE: Rgb = [0.56, 0.54, 0.5]
const SLAB: Rgb = [0.78, 0.76, 0.71]
const PAVING: Rgb = [0.62, 0.61, 0.58]
const RAIL: Rgb = [0.3, 0.32, 0.34]
const RUST: Rgb = [0.42, 0.24, 0.17]
const DARK: Rgb = [0.09, 0.09, 0.1]

/** the street's height over the floor of the cut */
const STREET = 8.6
const BEAM = 1.4
const SW = -18, NE = 34
const TOP_U = -116, END_U = 178
/** the slabs, down the cut, and their finishes */
const SLABS: { u0: number; u1: number; top: Rgb; site?: boolean }[] = [
  { u0: TOP_U, u1: -62, top: PAVING },
  { u0: -44, u1: 48, top: SLAB },
  { u0: 112, u1: END_U, top: CONCRETE, site: true },
]

export function austerlitzCap(out: MeshBuilder, fit: Fit): void {
  const stone = surfaceTag('concrete')
  const floor = fit.groundAt ? fit.groundAt(0, 0) : 0
  const street = floor + STREET
  const bottom = floor - 1
  /** a block by the cut's own axes */
  const put = (u0: number, u1: number, v0: number, v1: number, y0: number, y1: number, c: Rgb, tag = stone): void => {
    box(out, 6 - (v0 + v1) / 2, (y0 + y1) / 2, (u0 + u1) / 2 - 26, (v1 - v0) / 2, (y1 - y0) / 2, (u1 - u0) / 2, c, tag)
  }

  // the walls down to the track bed, with the pavement that runs along the top of each
  put(TOP_U, END_U, SW - 8, SW, bottom, street, CONCRETE)
  put(TOP_U, END_U, NE, NE + 6, bottom, street, CONCRETE)

  for (const s of SLABS) {
    put(s.u0, s.u1, SW, NE, street - BEAM, street, s.top)
    // what's under it reads as dark from either open end, the piers carrying it standing in front of the dark
    for (const [face, inward] of [[s.u0, 1], [s.u1, -1]] as const) {
      if (face === TOP_U && inward < 0) continue
      put(face + inward * 5.5, face + inward * 6, SW, NE, bottom, street - BEAM, DARK, 0)
      for (let v = SW + 4; v < NE - 2; v += 8.5) put(face + inward * 0.6, face + inward * 1.6, v - 0.45, v + 0.45, bottom, street - BEAM, CONCRETE)
    }
    if (s.site) {
      // the next building's steel, as far as it has got
      for (let u = s.u0 + 6; u < s.u1 - 2; u += 11) for (let v = SW + 6; v < NE - 2; v += 11) put(u - 0.3, u + 0.3, v - 0.3, v + 0.3, street, street + 4.5, RUST)
      for (let u = s.u0 + 6; u < s.u1 - 2; u += 22) put(u - 0.2, u + 0.2, SW + 6, NE - 7, street + 4.2, street + 4.6, RUST)
    }
  }

  // railings round the open cuts
  const rail = (u0: number, u1: number, v0: number, v1: number): void => put(u0, u1, v0, v1, street, street + 1.1, RAIL)
  for (const [u0, u1] of [[-62, -44], [48, 112]]) {
    rail(u0, u1, SW - 0.1, SW)
    rail(u0, u1, NE, NE + 0.1)
    rail(u0 - 0.1, u0, SW, NE)
    rail(u1, u1 + 0.1, SW, NE)
  }
  rail(TOP_U - 0.1, TOP_U, SW, NE)
}
