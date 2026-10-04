/**
 * PLAIN FOOTBRIDGES that OSM maps as `building=bridge` with a storey count — drawn by the city as a house raised on
 * stilts (owner, 2026-10-03, 1200 Gough: "rendering as an elevated skinny house . in reality it is a plain concrete
 * walk", with a Street View frame: a pale concrete deck across the drive with a thin steel railing on top).
 *
 * `concreteFootbridge`, fitted to the OSM outline: a deck slab `DECK` thick whose underside stands at the entry's
 * `height` less the rail (set level with what it leads onto), a fascia round it, and a steel picket railing along
 * its two sides, the ends left open.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, strut, type Rgb } from '../../models.ts'
import { towerRing } from '../tower.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const CONCRETE: Rgb = [0.78, 0.74, 0.66]
const UNDER: Rgb = [0.6, 0.57, 0.52]
const RAIL: Rgb = [0.22, 0.23, 0.24]
const DECK = 0.7
const RAIL_H = 1.1

export function concreteFootbridge(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const top = Math.max(3, fit.height - RAIL_H)
  const bottom = top - DECK
  const conc = surfaceTag('concrete')
  // the deck: its top, its soffit, and a fascia round every edge
  const cap = (y: number, up: boolean, c: Rgb): void => {
    for (let i = 1; i < ring.length - 1; i++) {
      const a = ring[0], b = ring[i], d = ring[i + 1]
      const q: [number, number, number][] = [[a.x, y, a.z], [b.x, y, b.z], [d.x, y, d.z], [d.x, y, d.z]]
      out.quad(up ? q : [...q].reverse(), [0, up ? 1 : -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, conc)
    }
  }
  cap(top, true, CONCRETE)
  cap(bottom, false, UNDER)
  // rails along the SIDES only — the edges running with the longest one; the ends are where the walk meets the
  // tower and the parking structure's roof it leads onto (owner: "it goes to the roof of the parking structure")
  const edges = ring.map((a, i) => { const b = ring[(i + 1) % ring.length]; return { L: Math.hypot(b.x - a.x, b.z - a.z), dx: b.x - a.x, dz: b.z - a.z } })
  const long = edges.reduce((m, e) => (e.L > m.L ? e : m), edges[0])
  const alongLong = (e: { L: number; dx: number; dz: number }): boolean => Math.abs((e.dx * long.dx + e.dz * long.dz) / (e.L * long.L || 1)) > 0.9
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.05) return
    const tx = (b.x - a.x) / L, tz = (b.z - a.z) / L
    out.quad([[a.x, bottom, a.z], [b.x, bottom, b.z], [b.x, top, b.z], [a.x, top, a.z]], [tz, 0, -tx], [[0, 0], [1, 0], [1, 1], [0, 1]], CONCRETE, conc)
    // the railing: a top rail and pickets every 1.2 m, a little in from the edge
    if (!alongLong(edges[i])) return
    const ix = -tz * 0.1, iz = tx * 0.1
    strut(out, [a.x + ix, top + RAIL_H, a.z + iz], [b.x + ix, top + RAIL_H, b.z + iz], 0.05, 0.05, RAIL)
    for (let u = 0.3; u < L - 0.2; u += 1.2) box(out, a.x + tx * u + ix, top + RAIL_H / 2, a.z + tz * u + iz, 0.025, RAIL_H / 2, 0.025, RAIL, 0)
  })
}

export const FOOTBRIDGES: Record<string, (out: MeshBuilder, fit: Fit) => void> = { concreteFootbridge }
