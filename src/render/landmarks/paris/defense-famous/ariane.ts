/**
 * TOUR ARIANE, ex-Tour Générale (1975, 152 m, 36 storeys; renovated 2008). A plain rectangular slab (OSM's ring,
 * way/19450182) in a WHITE punched grid: small square windows in a white aluminium frame, crisp corners, flat top
 * (fr.wikipedia lead photo "Tour Ariane Novembre 2021"). Not one of the owner's dark towers. The windows read pale
 * blue-grey with sky in them; the top storey is a slightly taller plant floor with blank panels.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { towerRing } from '../../tower.ts'
import { band } from './cb21.ts'

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const GLASS = surfaceTag('glass')

// tunables
const ARIANE_H = 152             // fr.wikipedia
const ARIANE_FRAME = '#e9ecec'   // white aluminium
const ARIANE_WIN = '#8e9ca6'     // pale blue-grey window glass
const ARIANE_LOBBY = '#4f5a60'
const ARIANE_LOBBY_H = 8
const ARIANE_FLOOR = 3.9
const ARIANE_BAY = 1.8           // window module along the face
const ARIANE_WIN_W = 0.62        // window share of the bay
const ARIANE_WIN_H = 0.6         // window share of the floor
const ARIANE_PLANT = 5           // blank plant storey at the top

const hash = (a: number, b: number): number => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v) }

export function ariane(out: MeshBuilder, fit: Fit): void {
  const r = towerRing(fit)
  const H = fit.height > 120 && fit.height < 180 ? fit.height : ARIANE_H
  const frame = hex(ARIANE_FRAME), win = hex(ARIANE_WIN)
  band(out, r, 0, ARIANE_LOBBY_H, hex(ARIANE_LOBBY), GLASS)
  band(out, r, ARIANE_LOBBY_H, H, frame)
  const y0 = ARIANE_LOBBY_H, y1 = H - ARIANE_PLANT
  const floors = Math.round((y1 - y0) / ARIANE_FLOOR), fh = (y1 - y0) / floors
  for (let i = 0; i < r.length; i++) {
    const a = r[i], b = r[(i + 1) % r.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 2) continue
    const tx = (b.x - a.x) / L, tz = (b.z - a.z) / L, nx = tz, nz = -tx
    const n: [number, number, number] = [nx, 0, nz]
    const P3 = (u: number, y: number): [number, number, number] => [a.x + tx * u + nx * 0.05, y, a.z + tz * u + nz * 0.05]
    const cols = Math.max(1, Math.round(L / ARIANE_BAY)), w = L / cols
    const ww = w * ARIANE_WIN_W, wh = fh * ARIANE_WIN_H
    for (let f = 0; f < floors; f++) {
      const yb = y0 + f * fh + fh * 0.25
      for (let c = 0; c < cols; c++) {
        const u = c * w + (w - ww) / 2
        const t = 0.9 + hash(c + i * 31, f) * 0.25
        out.quad([P3(u, yb), P3(u + ww, yb), P3(u + ww, yb + wh), P3(u, yb + wh)], n, UV, shade(win, t), GLASS)
      }
    }
  }
  capPolygon(out, r, H, hex('#9da3a5'), 0)
}
