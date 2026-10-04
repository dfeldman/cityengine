/**
 * THE AGRICULTURE BUILDING (1915; 101 The Embarcadero, OSM way/104599975 "Ferry Station Post Office Building", old
 * name AG Building), on its pier at the South Basin beside the ferry gates. From two Mapillary frames (2026-10-03):
 * red brick walls framed in BUFF RUSTICATED STONE — chunky quoins at every corner, rusticated surrounds and keystones
 * round the windows — over a grey concrete base; three storeys under a deep eave and a low hipped clay-tile roof.
 * Before this it was a generic grey office block over the water.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, type Rgb } from '../../models.ts'
import { roof } from '../kit.ts'
import { tower, towerRing } from '../tower.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const BRICK: Rgb = [0.5, 0.22, 0.17]
const BUFF: Rgb = [0.74, 0.58, 0.38]
const BASE: Rgb = [0.6, 0.6, 0.58]
const TILE: Rgb = [0.55, 0.27, 0.18]
const GLASS: Rgb = [0.18, 0.2, 0.22]

export function agricultureBuilding(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 9 && fit.height < 20 ? fit.height : 15
  const EAVES = H - 3
  tower(out, { ...fit, height: EAVES }, {
    height: EAVES,
    base: { height: 1.2, face: { kind: 'blank', material: 'concrete', wall: BASE } },
    tiers: [
      { to: 4.6, face: { kind: 'punched', material: 'ashlar', wall: BUFF, glass: GLASS, pitch: 3.6, solid: 0.45, floor: 3.4, arched: true }, cornice: { depth: 0.3, height: 0.4, colour: BUFF } },
      { to: EAVES, face: { kind: 'punched', material: 'brick', wall: BRICK, glass: GLASS, pitch: 3.6, solid: 0.5, floor: 3.3, head: 'architrave' }, cornice: { depth: 0.5, height: 0.6, colour: BUFF } },
    ],
    roof: TILE,
  })
  const stone = surfaceTag('ashlar')
  // the quoins: buff blocks, long and short in turn, up every corner of the brick
  const ring = towerRing(fit)
  for (const p of ring) {
    for (let y = 4.6, k = 0; y < EAVES - 0.3; y += 0.7, k++) {
      const w = k % 2 ? 0.55 : 0.85
      box(out, p.x, y + 0.33, p.z, w, 0.3, w, BUFF, stone)
    }
  }
  // the deep eave and the low hipped roof of clay tile over the whole block
  const o = 1.0
  const hx = fit.hx + o, hz = fit.hz + o
  box(out, 0, EAVES + 0.15, 0, hx, 0.15, hz, BUFF, stone)
  const m = Math.min(hx, hz)
  roof(out, -hx, hx, -hz, hz, EAVES + 0.3, m * 0.24, m, m, TILE)
}

export const AG_BUILDING: Record<string, (out: MeshBuilder, fit: Fit) => void> = { agricultureBuilding }
