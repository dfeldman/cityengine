/**
 * TOUR CB21, ex-Tour Gan (1974, 179 m, 42 storeys; reclad 2009–10). A cross plan with notched re-entrant corners
 * (OSM's ring, way/82467041), clad since the reclad in pale green-grey glass on a fine silver grid (fr.wikipedia lead
 * photo "Tour CB21 Août 2021"). The four arms stop a few storeys short of the core, which rises to the roof with a
 * dark plant band and a pale parapet, so the top reads stepped from every side.
 * Also exports `prism`, the shared glass skin used by ariane.ts and egee.ts.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade, type Rgb } from '../../kit.ts'
import { towerRing } from '../../tower.ts'

type P = { x: number; z: number }
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const GLASS = surfaceTag('glass')
const METAL = surfaceTag('metal')

// tunables
const CB21_H = 179              // fr.wikipedia
const CB21_GLASS = '#9fb3b1'    // pale green-grey with sky in it
const CB21_GRID = '#c9d2d0'     // silver transoms
const CB21_LOBBY = '#5d6a6c'
const CB21_LOBBY_H = 7
const CB21_ARMS = 0.93          // arms stop at this share of H
const CB21_CORE = 0.82          // core scale toward the centroid
const CB21_PLANT = 4            // dark plant band below the roof
const CB21_FLOOR = 3.8

const hash = (a: number, b: number): number => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v) }

export interface PrismSkin { glass: Rgb; grid: Rgb; floor: number; pane: number; band?: number; mat?: number; tone?: number }

/** Walls of `ring` from y0 to y1: one quad per pane column per row band (tone-mottled), a grid-coloured transom strip each floor. */
export function prism(out: MeshBuilder, ring: P[], y0: number, y1: number, k: PrismSkin): void {
  const rowH = k.floor * 3, rows = Math.max(1, Math.round((y1 - y0) / rowH)), h = (y1 - y0) / rows
  const floors = Math.max(1, Math.round((y1 - y0) / k.floor)), fh = (y1 - y0) / floors
  const band = k.band ?? 0.35, tone = k.tone ?? 0.12, mat = k.mat ?? GLASS
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.2) continue
    const tx = (b.x - a.x) / L, tz = (b.z - a.z) / L, nx = tz, nz = -tx
    const n: [number, number, number] = [nx, 0, nz]
    const P3 = (u: number, y: number, o: number): [number, number, number] => [a.x + tx * u + nx * o, y, a.z + tz * u + nz * o]
    const cols = Math.max(1, Math.round(L / k.pane)), w = L / cols
    for (let r = 0; r < rows; r++) {
      const ya = y0 + r * h, yb = ya + h
      for (let c = 0; c < cols; c++) {
        const t = 1 - tone + hash(a.x + c * 1.7 + i, a.z + r * 2.3) * tone * 2
        out.quad([P3(c * w, ya, 0), P3((c + 1) * w, ya, 0), P3((c + 1) * w, yb, 0), P3(c * w, yb, 0)], n, UV, shade(k.glass, t), mat)
      }
    }
    if (band > 0) for (let f = 1; f < floors; f++) {
      const y = y0 + f * fh
      out.quad([P3(0, y - band, 0.06), P3(L, y - band, 0.06), P3(L, y, 0.06), P3(0, y, 0.06)], n, UV, k.grid, METAL)
    }
  }
}

/** Solid walls (no grid) — lobbies, plant bands, parapets. */
export function band(out: MeshBuilder, ring: P[], y0: number, y1: number, c: Rgb, mat = METAL): void {
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.2) continue
    out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [b.x, y1, b.z], [a.x, y1, a.z]], [(b.z - a.z) / L, 0, -(b.x - a.x) / L], UV, c, mat)
  }
}

export const scaleRing = (r: P[], s: number): P[] => {
  let cx = 0, cz = 0
  for (const p of r) { cx += p.x / r.length; cz += p.z / r.length }
  return r.map((p) => ({ x: cx + (p.x - cx) * s, z: cz + (p.z - cz) * s }))
}

export function cb21(out: MeshBuilder, fit: Fit): void {
  const r = towerRing(fit)
  const H = fit.height > 150 && fit.height < 200 ? fit.height : CB21_H
  const glass = hex(CB21_GLASS), grid = hex(CB21_GRID)
  const skin: PrismSkin = { glass, grid, floor: CB21_FLOOR, pane: 3, band: 0.3 }
  const lobby = scaleRing(r, 0.97)
  band(out, lobby, 0, CB21_LOBBY_H, hex(CB21_LOBBY), GLASS)
  capPolygon(out, lobby, CB21_LOBBY_H, hex(CB21_LOBBY), 0)
  const yArms = H * CB21_ARMS
  prism(out, r, CB21_LOBBY_H, yArms, skin)
  capPolygon(out, r, yArms, hex('#7d8687'), 0)
  const core = scaleRing(r, CB21_CORE)
  prism(out, core, yArms, H - CB21_PLANT, skin)
  band(out, core, H - CB21_PLANT, H - 1, shade(glass, 0.55), GLASS)
  band(out, core, H - 1, H, grid)
  capPolygon(out, core, H, hex('#8a9091'), 0)
}
