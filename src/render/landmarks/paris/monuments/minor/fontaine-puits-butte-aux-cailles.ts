import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { basin, G, spout } from '../plaza-common.ts'
import { sweptTube } from './monument-kit.ts'

/*
 * LE PUITS ARTÉSIEN DE LA BUTTE-AUX-CAILLES (Paris 13e, place Paul-Verlaine; Wikidata Q16671566): the drinking fountain
 * of the 1863-1904 artesian well, fed from the Albian sands: a low trough of grey stone under a polished stainless-steel
 * pipe that rises from a post, arches over and pours straight down into it, with a steel guard rail and a second post on
 * the open side. Frame: the trough long along x, the pipe post at −x, the front (rail side) −z, y up from G. Sizes
 * scaled by eye off one Commons photo against the paving; not surveyed.
 */
export const HX = 1.6
export const HZ = 1.2

// tunables (metres)
const TW = 1.5, TD = 0.62, TH = 0.5               // stone trough: length (x), depth (z), height
const WALL = 0.11                                 // its wall thickness
const POST_X = -0.52, POST_Z = 0.12, POST_R = 0.045, POST_H = 1.2   // the pipe's post
const ARCH_R = 0.32, PIPE_R = 0.04                // arch radius (centre-line) and pipe radius
const RAIL_Y = 0.98, RAIL_R = 0.03                // guard rail along the front, height
const POST2_X = 0.62, POST2_Z = -0.42, POST2_H = 1.0   // the rail's far post
const GRATE_W = 0.5                               // drain grating in front

const STONE: Rgb = hex('#9c9a93')
const STEEL: Rgb = hex('#c3c8cb')
const WATER: Rgb = hex('#7fa8b8')
const STREAM: Rgb = hex('#bcd6df')
const GRATE: Rgb = hex('#3a3b3c')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  const plan = [{ x: -TW / 2, z: -TD / 2 }, { x: TW / 2, z: -TD / 2 }, { x: TW / 2, z: TD / 2 }, { x: -TW / 2, z: TD / 2 }]
  const inner = [{ x: -TW / 2 + WALL, z: -TD / 2 + WALL }, { x: TW / 2 - WALL, z: -TD / 2 + WALL }, { x: TW / 2 - WALL, z: TD / 2 - WALL }, { x: -TW / 2 + WALL, z: TD / 2 - WALL }]
  basin(q, plan, inner, y(0), y(TH), STONE, WATER)
  block(q, -TW / 2 - 0.03, TW / 2 + 0.03, -TD / 2 - 0.03, TD / 2 + 0.03, y(0), y(0.06), shade(STONE, 0.85))
  // the pipe: post up, a half-circle arch over towards +x, then a short drop with the spout end
  const path: [number, number, number][] = []
  path.push([POST_X, y(0), POST_Z], [POST_X, y(POST_H), POST_Z])
  for (let i = 1; i <= 10; i++) {
    const a = (i / 10) * Math.PI
    path.push([POST_X + ARCH_R - Math.cos(a) * ARCH_R, y(POST_H) + Math.sin(a) * ARCH_R, POST_Z])
  }
  path.push([POST_X + 2 * ARCH_R, y(POST_H - 0.22), POST_Z])
  sweptTube(q, path, { r: PIPE_R, sides: 10, c: STEEL })
  sweptTube(q, [[POST_X, y(0), POST_Z], [POST_X, y(0.3), POST_Z]], { r: POST_R + 0.025, sides: 10, c: shade(STEEL, 0.9) })
  // the stream falling from the spout end into the trough
  const sx = POST_X + 2 * ARCH_R
  spout(q, [sx, y(POST_H - 0.22), POST_Z], [sx + 0.03, y(TH - 0.07), POST_Z], 0, 0.014, STREAM)
  // guard rail: a horizontal bar along the front on two posts
  const rx0 = -TW / 2 - 0.1, rx1 = POST2_X
  sweptTube(q, [[rx0, y(RAIL_Y), POST2_Z], [rx1, y(RAIL_Y), POST2_Z]], { r: RAIL_R, sides: 8, c: STEEL })
  sweptTube(q, [[rx0, y(0), POST2_Z], [rx0, y(RAIL_Y), POST2_Z]], { r: RAIL_R, sides: 8, c: STEEL })
  sweptTube(q, [[POST2_X, y(0), POST2_Z], [POST2_X, y(POST2_H), POST2_Z]], { r: RAIL_R, sides: 8, c: STEEL })
  // drain grating in the paving at the front
  block(q, -GRATE_W / 2, GRATE_W / 2, -TD / 2 - 0.5, -TD / 2 - 0.36, y(0), y(0.01), GRATE)
}

export function fontainePuitsButteAuxCailles(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
