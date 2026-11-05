/**
 * The Grand Trianon (Hardouin-Mansart, 1687) and the Queen's Hameau (Mique, 1783–87), each on its own OSM footprint (the fit's
 * ring and courts).
 *
 * The Grand Trianon is one storey of tall arched windows: pale stone walls, pink Languedoc marble pilasters between the bays,
 * a flat roof behind a balustrade. The Hameau's cottages are rendered rubble with timber, under thatch or old tile.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { boxAlong, edgeAt } from '../../parts.ts'
import { extrude, palette, type Storey } from '../palaces/common.ts'

type P2 = { x: number; z: number }

/** the Grand Trianon: wall height, bay spacing, window width, the pilasters' width and how proud, the balustrade */
const GT = { stone: '#ebe1cc', marble: '#b8656b', eaves: 8.2, bay: 4.4, win: 2.5, pil: { w: 0.7, d: 0.25 },
  storey: { y: 0, h: 5.2, sill: 0.5, arched: true } as Storey, bal: { h: 1.1, post: 3.2 } }

function ringsOf(fit: Fit): P2[][] {
  const ring = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  return [ring, ...(fit.holes ?? [])]
}

/** pilasters between the bays along every face, the same spacing extrude gives its windows */
function pilasters(out: MeshBuilder, rings: P2[][], bay: number, y0: number, y1: number, c: Rgb, pil = GT.pil): void {
  for (const r of rings) for (let i = 0; i < r.length; i++) {
    const e = edgeAt(r, i)
    if (e.L < 3) continue
    const nb = Math.max(1, Math.round((e.L - 1.2) / bay)), step = (e.L - 1.2) / nb
    for (let k = 0; k <= nb; k++) {
      const u = 0.6 + k * step
      boxAlong(out, e.a.x + e.tx * u + e.nx * pil.d / 2, (y0 + y1) / 2, e.a.z + e.tz * u + e.nz * pil.d / 2, pil.w / 2, (y1 - y0) / 2, pil.d / 2, e.heading, c)
    }
  }
}

/** a balustrade round every ring at the roof's edge: plinth, posts at intervals, rail */
function ringBalustrade(out: MeshBuilder, rings: P2[][], y: number, c: Rgb): void {
  const h = GT.bal.h
  for (const r of rings) for (let i = 0; i < r.length; i++) {
    const e = edgeAt(r, i)
    const at = (u: number): [number, number] => [e.a.x + e.tx * u - e.nx * 0.2, e.a.z + e.tz * u - e.nz * 0.2]
    const [mx, mz] = at(e.L / 2)
    boxAlong(out, mx, y + 0.12, mz, e.L / 2, 0.12, 0.25, e.heading, c)
    boxAlong(out, mx, y + h - 0.08, mz, e.L / 2, 0.08, 0.22, e.heading, c)
    const n = Math.max(1, Math.round(e.L / 0.6))
    for (let k = 0; k <= n; k++) {
      const [x, z] = at((e.L * k) / n), post = k % Math.max(1, Math.round(GT.bal.post / 0.6)) === 0
      boxAlong(out, x, y + h / 2, z, post ? 0.22 : 0.07, h / 2 - 0.1, post ? 0.22 : 0.07, e.heading, c)
    }
  }
}

export function versaillesGrandTrianon(out: MeshBuilder, fit: Fit): void {
  const rings = ringsOf(fit), p = palette(GT.stone, '#7d7f7c')
  p.trim = shade(hex(GT.stone), 1.04)
  extrude(out, rings, p, { eaves: GT.eaves, storeys: [GT.storey], bay: GT.bay, win: GT.win, rise: 0.15, inset: 0.3, dormers: false })
  pilasters(out, rings, GT.bay, 0.3, GT.eaves - 0.7, hex(GT.marble))
  ringBalustrade(out, rings, GT.eaves + 0.15, shade(hex(GT.stone), 1.06))
}

/** the Petit Trianon (Gabriel, 1762–68): a cube of pale stone, a rusticated ground floor, the piano nobile's tall windows and
 * an attic's square ones under a flat roof and balustrade; Corinthian pilasters (columns on the west front) across the upper two */
const PT = { stone: '#e9dfc9', eaves: 14.2, bay: 4.6, win: 1.7, pil: { w: 0.9, d: 0.45 }, order: [4.4, 13.4] as [number, number],
  storeys: [{ y: 0, h: 2.6, sill: 0.9, arched: true }, { y: 5, h: 3.6, sill: 0.4 }, { y: 10.6, h: 1.5, sill: 0.3 }] as Storey[] }

export function versaillesPetitTrianon(out: MeshBuilder, fit: Fit): void {
  const rings = ringsOf(fit), p = palette(PT.stone, '#7d7f7c')
  extrude(out, rings, p, { eaves: PT.eaves, storeys: PT.storeys, bay: PT.bay, win: PT.win, rise: 0.15, inset: 0.3, dormers: false })
  const light = shade(hex(PT.stone), 1.07)
  pilasters(out, rings, PT.bay, PT.order[0], PT.order[1], light, PT.pil)
  // the band over the rusticated ground floor
  for (const r of rings) for (let i = 0; i < r.length; i++) {
    const e = edgeAt(r, i)
    boxAlong(out, e.mid.x + e.nx * 0.2, PT.order[0] - 0.2, e.mid.z + e.nz * 0.2, e.L / 2 + 0.2, 0.2, 0.3, e.heading, light)
  }
  ringBalustrade(out, rings, PT.eaves + 0.15, light)
}

/** a Hameau building: its storeys, wall colour, roof colour and pitch (rise over the inset); thatch is a deep, soft rise */
interface Cottage { walls: string; roof: string; storeys: number; rise: number; inset: number; eaves?: number }
const THATCH = '#8b7550', TILE = '#9a5a3f'
export const HAMEAU: Record<string, Cottage> = {
  maisonReine: { walls: '#e2d4b8', roof: TILE, storeys: 2, rise: 4.2, inset: 3.2 },
  billard: { walls: '#e2d4b8', roof: TILE, storeys: 2, rise: 3.8, inset: 3 },
  moulin: { walls: '#d8c7a4', roof: THATCH, storeys: 2, rise: 4.5, inset: 3.4 },
  rechauffoir: { walls: '#d8c7a4', roof: THATCH, storeys: 1, rise: 4, inset: 3 },
  boudoir: { walls: '#e6dac2', roof: THATCH, storeys: 1, rise: 3.2, inset: 2.6 },
  laiterie: { walls: '#e8ddc6', roof: THATCH, storeys: 1, rise: 3.6, inset: 2.8 },
  colombier: { walls: '#d8c7a4', roof: THATCH, storeys: 1, rise: 3.4, inset: 2.6 },
  garde: { walls: '#d8c7a4', roof: THATCH, storeys: 1, rise: 3.6, inset: 2.8 },
  ferme: { walls: '#d5c3a0', roof: THATCH, storeys: 1, rise: 4, inset: 3.2 },
  /** the Tour de Marlborough: a round stone tower, a gallery near the top, a low cap */
  marlborough: { walls: '#e6dbc4', roof: '#7a6a55', storeys: 4, rise: 1.4, inset: 1.6, eaves: 13 },
}

export const hameauBuilder = (c: Cottage) => (out: MeshBuilder, fit: Fit): void => {
  const p = palette(c.walls, c.roof)
  p.trim = hex('#6b5238') // the timber
  const st: Storey[] = Array.from({ length: c.storeys }, (_, i) => ({ y: i * 3, h: 1.3, sill: 0.8 }))
  extrude(out, ringsOf(fit), p, { eaves: c.eaves ?? c.storeys * 3 + 0.3, storeys: st, bay: 3.2, win: 1.0, rise: c.rise, inset: c.inset, dormers: false })
}

export const TRIANON_BUILDERS = {
  versaillesGrandTrianon, versaillesPetitTrianon,
  ...Object.fromEntries(Object.entries(HAMEAU).map(([k, c]) => [`hameau${k[0].toUpperCase()}${k.slice(1)}`, hameauBuilder(c)])),
} as Record<string, (out: MeshBuilder, fit: Fit) => void>
