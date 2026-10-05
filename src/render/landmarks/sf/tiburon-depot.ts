/**
 * THE RAILROAD & FERRY DEPOT MUSEUM, Tiburon (1884, the San Francisco & North Pacific's station house; way/239211805).
 * Museum census 2026-10-05, from Commons "Tiburon Railroad & Ferry Depot Museum in 2017.jpg": a plain two-storey
 * box of pale grey board-and-batten under a shallow gable of pale green corrugated iron, the ridge along its length.
 * Tall six-over-six sash windows in brown-grey frames, evenly spaced on both floors, a brown-grey belt course between
 * the floors, and a plain door in one end. Was a 12 m sfapartment block with a row of red doors.
 *
 * Fitted with no `front`, so local x is the long axis and the ridge runs along it.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { box } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const GREY: Rgb = [0.77, 0.79, 0.8]
const TRIM: Rgb = [0.48, 0.44, 0.4]
const GLASS: Rgb = [0.12, 0.13, 0.15]
const ROOF: Rgb = [0.66, 0.72, 0.68]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export function tiburonDepot(out: MeshBuilder, fit: Fit): void {
  const hx = Math.min(fit.hx, 9), hz = Math.min(fit.hz, 6)
  const EAVES = 7.6, RISE = Math.min(2.6, hz * 0.45), BELT = 3.9
  const wood = surfaceTag('clapboard'), metal = surfaceTag('metal')
  box(out, 0, EAVES / 2, 0, hx, EAVES / 2, hz, GREY, wood)
  box(out, 0, BELT, 0, hx + 0.06, 0.16, hz + 0.06, TRIM, wood)
  // the battens, floor to eaves on all four faces
  for (const s of [-1, 1]) {
    for (let x = -hx + 0.3; x < hx; x += 0.75) box(out, x, EAVES / 2, s * (hz + 0.03), 0.04, EAVES / 2, 0.03, GREY, wood)
    for (let z = -hz + 0.3; z < hz; z += 0.75) box(out, s * (hx + 0.03), EAVES / 2, z, 0.03, EAVES / 2, 0.04, GREY, wood)
  }
  // the sashes: framed, on both floors of the long sides, two up and three down at each end
  const sash = (x: number, y: number, z: number, alongX: boolean): void => {
    const [fx, fz] = alongX ? [0.55, 0.06] : [0.06, 0.55]
    const [gx, gz] = alongX ? [0.42, 0.08] : [0.08, 0.42]
    box(out, x, y, z, fx, 1.12, fz, TRIM, wood)
    box(out, x, y, z, gx, 0.98, gz, GLASS, 0)
    box(out, x, y - 1.15, z, alongX ? 0.62 : 0.12, 0.07, alongX ? 0.12 : 0.62, TRIM, wood)
  }
  const n = Math.max(2, Math.round((2 * hx) / 3.4))
  for (let i = 0; i < n; i++) {
    const x = -hx + (i + 0.5) * (2 * hx / n)
    for (const s of [-1, 1]) for (const y of [1.9, 5.7]) sash(x, y, s * (hz + 0.07), true)
  }
  for (const s of [-1, 1]) {
    for (const z of [-hz * 0.45, hz * 0.45]) sash(s * (hx + 0.07), 5.7, z, false)
    for (const z of [-hz * 0.62, -hz * 0.2]) sash(s * (hx + 0.07), 1.9, z, false)
  }
  // the door, in the east end under its lamp
  box(out, hx + 0.08, 1.15, hz * 0.32, 0.06, 1.15, 0.55, [0.92, 0.92, 0.9], wood)
  box(out, hx + 0.1, 1.2, hz * 0.32, 0.06, 1.25, 0.66, TRIM, 0)
  // the gable: two slopes and the two end walls, each drawn wound both ways so neither is culled from either side
  const o = 0.45
  const x0 = -hx - o, x1 = hx + o, zE = hz + o, yR = EAVES + RISE
  for (const s of [-1, 1]) {
    const z = s * zE
    const q: [number, number, number][] = [[x0, EAVES, z], [x1, EAVES, z], [x1, yR, 0], [x0, yR, 0]]
    const nrm: [number, number, number] = [0, zE, s * RISE]
    out.quad(s > 0 ? q : [q[1], q[0], q[3], q[2]], nrm, UV, ROOF, metal)
    out.quad(s > 0 ? [q[1], q[0], q[3], q[2]] : q, [0, -zE, -s * RISE], UV, ROOF, metal)
  }
  for (const s of [-1, 1]) {
    const x = s * hx
    const t: [number, number, number][] = [[x, EAVES, -hz], [x, EAVES, hz], [x, EAVES + RISE * (hz / zE), 0], [x, EAVES + RISE * (hz / zE), 0]]
    out.quad(t, [s, 0, 0], UV, GREY, wood)
    out.quad([t[1], t[0], t[3], t[2]], [s, 0, 0], UV, GREY, wood)
    // the raking boards along both slopes of the gable
    for (const k of [-1, 1]) {
      const a: [number, number, number] = [x + s * 0.5, EAVES - 0.05, k * zE], b: [number, number, number] = [x + s * 0.5, yR - 0.05, 0]
      const q: [number, number, number][] = [a, b, [b[0], b[1] - 0.3, 0], [a[0], a[1] - 0.3, a[2]]]
      out.quad(q, [s, 0, 0], UV, TRIM, wood)
      out.quad([q[1], q[0], q[3], q[2]], [s, 0, 0], UV, TRIM, wood)
    }
  }
}

export const TIBURON_DEPOT: Record<string, (out: MeshBuilder, fit: Fit) => void> = { tiburonDepot }
