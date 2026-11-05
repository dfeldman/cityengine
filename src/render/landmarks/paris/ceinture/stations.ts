/**
 * The PETITE CEINTURE's surviving stations (owner, 2026-11-05: "work on the Petite Ceinture"). The line (1852–69) runs
 * round Paris inside the Thiers wall, mostly in cuttings, and its stations stand at street level over the trench:
 * small Second Empire pavilions, one or two storeys, round-headed openings on the ground floor in cut-stone surrounds,
 * quoined corners, a cornice and a hipped slate roof, and on the track side an iron-and-glass marquise. Closed to
 * passengers in 1934; today La Recyclerie (Ornano), Le Hasard Ludique (Saint-Ouen), the Vaugirard-Ceinture and
 * Masséna stations.
 *
 * Drawn in the footprint's own frame (Fit hx × hz, front −z): every façade the same rhythm. The numbers are named
 * constants to tune against photographs; madeBy in the manifest.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { block, shade, type Rgb } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, rectOn } from '../palaces/common.ts'

const FIXED = 0
/** a storey's height, the plinth's, and the ground-floor openings: width, height, pitch */
const STOREY = 4.4
const PLINTH = 0.6
const ARCH_W = 1.6
const ARCH_H = 3.1
const BAY = 3.4
/** upper-floor windows */
const WIN_W = 1.1
const WIN_H = 1.7
/** quoins: the block height and how far each one returns along the face */
const QUOIN = 0.45
const QUOIN_W = [0.7, 0.45]
/** the roof: pitch as rise over half-width, capped */
const ROOF_PITCH = 0.55
const ROOF_MAX = 4
/** the marquise on the track side (+z): depth out from the wall, height of its edge */
const CANOPY_D = 3.2
const CANOPY_Y = 3.7

const RENDER: Rgb = [0.86, 0.81, 0.7]
const BRICK: Rgb = [0.6, 0.35, 0.27]
const STONE: Rgb = [0.88, 0.85, 0.77]
const SLATE: Rgb = [0.3, 0.33, 0.36]
const GLASS: Rgb = [0.15, 0.17, 0.19]
const IRON: Rgb = [0.17, 0.25, 0.22]

type Face = '-z' | '+z' | '-x' | '+x'

function station(out: MeshBuilder, fit: Fit, wall: Rgb, canopy: boolean): void {
  const hx = Math.max(3, fit.hx)
  const hz = Math.max(2.5, fit.hz)
  const roofH = Math.min(ROOF_MAX, hz * ROOF_PITCH)
  const floors = Math.max(1, Math.min(3, Math.round((fit.height - roofH * 0.6) / STOREY)))
  const eave = floors * STOREY + 0.6
  // the body, the plinth, a string course per floor, the cornice
  block(out, -hx, hx, -hz, hz, 0, eave, wall)
  block(out, -hx - 0.06, hx + 0.06, -hz - 0.06, hz + 0.06, 0, PLINTH, shade(STONE, 0.78))
  for (let f = 1; f < floors; f++) block(out, -hx - 0.05, hx + 0.05, -hz - 0.05, hz + 0.05, f * STOREY - 0.1, f * STOREY + 0.12, STONE)
  block(out, -hx - 0.3, hx + 0.3, -hz - 0.3, hz + 0.3, eave - 0.25, eave + 0.15, STONE)
  block(out, -hx - 0.15, hx + 0.15, -hz - 0.15, hz + 0.15, eave - 0.55, eave - 0.25, shade(STONE, 0.94))
  // quoins at the four corners, long and short in turn
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    for (let y = PLINTH, k = 0; y < eave - 0.6; y += QUOIN, k++) {
      const w = QUOIN_W[k % 2]
      const x0 = sx > 0 ? hx - w : -hx, z0 = sz > 0 ? hz - 0.25 : -hz - 0.04
      block(out, x0, x0 + w, z0, z0 + 0.29, y, y + QUOIN - 0.04, STONE)
      const xa = sx > 0 ? hx - 0.25 : -hx - 0.04, za = sz > 0 ? hz - w : -hz
      block(out, xa, xa + 0.29, za, za + w, y, y + QUOIN - 0.04, STONE)
    }
  }
  // each face: arched openings below, windows above, in bays of BAY
  const faces: [Face, number, number][] = [['-z', -hz, hx], ['+z', hz, hx], ['-x', -hx, hz], ['+x', hx, hz]]
  for (const [f, plane, half] of faces) {
    const n = Math.max(1, Math.floor((2 * half - 1.6) / BAY))
    for (let i = 0; i < n; i++) {
      const t = -half + (2 * half) * (i + 0.5) / n
      archOn(out, f, plane, t, PLINTH, ARCH_W + 0.5, ARCH_H + 0.3, STONE, 0.05)
      archOn(out, f, plane, t, PLINTH, ARCH_W, ARCH_H, GLASS, 0.08)
      for (let fl = 1; fl < floors; fl++) {
        const y0 = fl * STOREY + 0.9
        rectOn(out, f, plane, t - WIN_W / 2 - 0.15, t + WIN_W / 2 + 0.15, y0 - 0.15, y0 + WIN_H + 0.2, STONE, 0.05)
        rectOn(out, f, plane, t - WIN_W / 2, t + WIN_W / 2, y0, y0 + WIN_H, GLASS, 0.08)
      }
    }
  }
  // the hipped slate roof: a ridge along x, hips to the corners
  const r = Math.min(hx, hz) + 0.3
  const X = hx + 0.3, Z = hz + 0.3
  const y0 = eave + 0.15, y1 = y0 + roofH
  const rx = X - r
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  out.quad([[-X, y0, -Z], [X, y0, -Z], [rx, y1, 0], [-rx, y1, 0]], [0, r, -roofH], uv, SLATE, FIXED)
  out.quad([[X, y0, Z], [-X, y0, Z], [-rx, y1, 0], [rx, y1, 0]], [0, r, roofH], uv, SLATE, FIXED)
  out.quad([[X, y0, -Z], [X, y0, Z], [rx, y1, 0], [rx, y1, 0]], [roofH, r, 0], uv, SLATE, FIXED)
  out.quad([[-X, y0, Z], [-X, y0, -Z], [-rx, y1, 0], [-rx, y1, 0]], [-roofH, r, 0], uv, SLATE, FIXED)
  // chimneys at the ridge's ends
  for (const s of [-1, 1]) block(out, s * rx - 0.35, s * rx + 0.35, -0.3, 0.3, y1 - 0.8, y1 + 1.1, shade(wall, 0.9))
  // the marquise over the platform side: a glass roof sloping out on iron brackets and a fretted valance
  if (canopy) {
    const z1 = hz + CANOPY_D
    for (let x = -hx + 0.8; x <= hx - 0.8 + 1e-6; x += 2.4) {
      block(out, x - 0.05, x + 0.05, hz, z1, CANOPY_Y - 0.12, CANOPY_Y, IRON)
      block(out, x - 0.04, x + 0.04, hz, hz + 0.9, CANOPY_Y - 1.1, CANOPY_Y - 0.12, IRON)
    }
    out.quad([[-hx, CANOPY_Y + 0.5, hz], [hx, CANOPY_Y + 0.5, hz], [hx, CANOPY_Y, z1], [-hx, CANOPY_Y, z1]], [0, 1, 0.15], uv, GLASS, FIXED)
    block(out, -hx, hx, z1 - 0.04, z1, CANOPY_Y - 0.45, CANOPY_Y, IRON)
  }
}

/** a rendered station with its marquise (Ornano, Masséna, Saint-Ouen) */
export function ceintureStation(out: MeshBuilder, fit: Fit): void { station(out, fit, RENDER, true) }
/** in brick with stone dressings (Vaugirard-Ceinture) */
export function ceintureStationBrick(out: MeshBuilder, fit: Fit): void { station(out, fit, BRICK, true) }
/** no marquise: a station whose platform side is gone or walled */
export function ceintureStationPlain(out: MeshBuilder, fit: Fit): void { station(out, fit, RENDER, false) }

export const PARIS_CEINTURE: Record<string, (out: MeshBuilder, fit: Fit) => void> = { ceintureStation, ceintureStationBrick, ceintureStationPlain }
