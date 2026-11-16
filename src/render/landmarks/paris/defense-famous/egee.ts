/**
 * TOUR ÉGÉE (1999, 155 m, 40 storeys; Michel Andrault / Pierre Parat). A wedge plan, a sharp prow to the south-west
 * and a curved back (OSM's ring, way/82486351), skinned in pale silver reflective glass on a fine grid, with white
 * metal edges at the prow and the ends and a flat top behind a pale parapet; the foot is a recessed dark glass lobby
 * (fr.wikipedia lead photo "Tour Egée Juillet 2020").
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { towerRing } from '../../tower.ts'
import { band, prism, scaleRing } from './cb21.ts'

const METAL = surfaceTag('metal')
const GLASS = surfaceTag('glass')
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

// tunables
const EGEE_H = 155               // fr.wikipedia
const EGEE_GLASS = '#aebcc6'     // silver-blue sky mirror
const EGEE_GRID = '#d9dfe2'
const EGEE_EDGE = '#f0f1ef'      // white corner columns
const EGEE_EDGE_W = 1.6
const EGEE_LOBBY = '#4a565e'
const EGEE_LOBBY_H = 9
const EGEE_PARAPET = 3
const EGEE_FLOOR = 3.7
const EGEE_SHARP = 35            // corners turning more than this (deg) get a white column

export function egee(out: MeshBuilder, fit: Fit): void {
  const r = towerRing(fit)
  const H = fit.height > 120 && fit.height < 190 ? fit.height : EGEE_H
  const glass = hex(EGEE_GLASS), grid = hex(EGEE_GRID), edge = hex(EGEE_EDGE)
  const lobby = scaleRing(r, 0.95)
  band(out, lobby, 0, EGEE_LOBBY_H, hex(EGEE_LOBBY), GLASS)
  capPolygon(out, lobby, EGEE_LOBBY_H, hex(EGEE_LOBBY), 0)
  prism(out, r, EGEE_LOBBY_H, H - EGEE_PARAPET, { glass, grid, floor: EGEE_FLOOR, pane: 2.6, band: 0.25, tone: 0.08 })
  band(out, r, H - EGEE_PARAPET, H, edge)
  capPolygon(out, r, H - 0.5, shade(edge, 0.7), 0)
  // white columns at the sharp corners
  for (let i = 0; i < r.length; i++) {
    const p = r[(i + r.length - 1) % r.length], q = r[i], s = r[(i + 1) % r.length]
    const a1 = Math.atan2(q.z - p.z, q.x - p.x), a2 = Math.atan2(s.z - q.z, s.x - q.x)
    let d = Math.abs(a2 - a1) * 180 / Math.PI; if (d > 180) d = 360 - d
    if (d < EGEE_SHARP) continue
    for (const [o, t] of [[p, 1], [s, 1]] as const) {
      const L = Math.hypot(o.x - q.x, o.z - q.z); if (L < 0.5) continue
      const ux = (o.x - q.x) / L, uz = (o.z - q.z) / L, w = Math.min(EGEE_EDGE_W, L / 3) * t
      const a = { x: q.x, z: q.z }, b = { x: q.x + ux * w, z: q.z + uz * w }
      const [A, B] = o === s ? [a, b] : [b, a]
      const nx = (B.z - A.z) / w, nz = -(B.x - A.x) / w
      out.quad([[A.x + nx * 0.12, EGEE_LOBBY_H, A.z + nz * 0.12], [B.x + nx * 0.12, EGEE_LOBBY_H, B.z + nz * 0.12], [B.x + nx * 0.12, H, B.z + nz * 0.12], [A.x + nx * 0.12, H, A.z + nz * 0.12]], [nx, 0, nz], UV, edge, METAL)
    }
  }
}
