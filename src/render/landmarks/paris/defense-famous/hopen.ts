/**
 * TOUR HOPEN, ex-Adria / Technip (Andrault & Ayoub 2002; restructured 2021–25, Ateliers 2/3/4 with Studio Briand &
 * Berthereau on the facade). Twin of Tour Égée: a wedge plan (OSM's ring, way/82486022). The 2002 tower was black
 * mirror glass; the reclad is LIGHT — a white metal frame whose mullions run on the slant, zigzagging up the faces,
 * over blue sky-glass, and a deep V-groove cut down a face with stepped terraces inside it (Chateauform's Hopen
 * reference photo, 2025; paris-la-defense.com project page: 155 m, panoramic rooftop restaurant near 150 m).
 * Heights: BD TOPO h = 153; IGN LiDAR HD MNS from the dalle (58.8 m NGF): roof 133, rooftop pavilion 137–144 at the
 * south-east, a mast to 165 at the west edge; fr.wikipedia roof 150, spire 167. The game stands it on the lowest
 * ground, so the BD TOPO height is the roof.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { registerRing, type P2 } from '../museums/enframe.ts'
import { towerRing } from '../../tower.ts'
import { centroid, scaleAbout, walls } from './tourAlto.ts'

type P = { x: number; z: number }
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const GLASS = surfaceTag('glass')
const METAL = surfaceTag('metal')

// tunables
const HOPEN_H = 153               // BD TOPO roof
const HOPEN_MAST = 14             // mast above the roof (spire 167)
const HOPEN_LOBBY_H = 10          // the open public base
const HOPEN_FLOOR = 3.5
const HOPEN_PANE = 3.0
const HOPEN_SLANT = 0.55          // sideways run of a mullion per storey (fraction of a pane)
const HOPEN_ZIG = 6               // storeys before the slant turns back
const HOPEN_MULLION = 0.5         // white frame width
const HOPEN_GLASS = '#7f9fb8'     // blue sky glass
const HOPEN_FRAME = '#eef0ef'     // white metal
const HOPEN_LOBBY = '#4e5b63'
const HOPEN_ROOFC = '#9aa1a3'
const HOPEN_V_W = 9, HOPEN_V_D = 5 // the V-groove's mouth and depth, on the longest face
const HOPEN_PAV: P2[] = [[4, -24], [20, -24], [20, -13], [4, -13]] // rooftop pavilion, E/N
const HOPEN_PAV_H = 6
const HOPEN_MAST_AT: P2 = [-9, 3]

// OSM ring, E/N metres from its vertex mean (48.89528, 2.23648)
const OSM: P2[] = [[-11, -6], [-4, -16], [-8, -34], [38, -26], [27, -10], [25, -8], [15, 6], [13, 9], [2, 25], [-6, 18], [-7, 18], [-8, 12], [-9, 5], [-10, 5], [-10, 4], [-10, 3], [-10, 2], [-11, -2]]

const hash = (a: number, b: number): number => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v) }

/** the ring with a V cut into the middle of its longest edge */
function grooved(r: P[]): { ring: P[]; v: number } {
  let li = 0, lb = 0
  for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length], L = Math.hypot(b.x - a.x, b.z - a.z); if (L > lb) { lb = L; li = i } }
  const a = r[li], b = r[(li + 1) % r.length], tx = (b.x - a.x) / lb, tz = (b.z - a.z) / lb, nx = tz, nz = -tx
  const m = lb / 2, w = Math.min(HOPEN_V_W, lb * 0.4) / 2
  const pts = [{ x: a.x + tx * (m - w), z: a.z + tz * (m - w) }, { x: a.x + tx * m - nx * HOPEN_V_D, z: a.z + tz * m - nz * HOPEN_V_D }, { x: a.x + tx * (m + w), z: a.z + tz * (m + w) }]
  return { ring: [...r.slice(0, li + 1), ...pts, ...r.slice(li + 1)], v: li + 2 }
}

export function hopen(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(OSM, fit)
  const base = towerRing(fit)
  const H = fit.height > 135 && fit.height < 175 ? fit.height : HOPEN_H
  const { ring, v } = grooved(base)
  const glass = hex(HOPEN_GLASS), frame = hex(HOPEN_FRAME)
  // open base, recessed
  const c = centroid(base)
  walls(out, scaleAbout(base, c, 0.95), 0, HOPEN_LOBBY_H, hex(HOPEN_LOBBY), GLASS)
  capPolygon(out, base, HOPEN_LOBBY_H, hex(HOPEN_LOBBY), 0)
  const y0 = HOPEN_LOBBY_H, n = Math.round((H - y0) / HOPEN_FLOOR), fh = (H - y0) / n
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.3) continue
    const tx = (b.x - a.x) / L, tz = (b.z - a.z) / L, nx = tz, nz = -tx
    const N: [number, number, number] = [nx, 0, nz]
    const inV = i === v - 1 || i === v
    const P3 = (u: number, y: number, o: number): [number, number, number] => [a.x + tx * u + nx * o, y, a.z + tz * u + nz * o]
    // glass, a tone per storey band
    for (let k = 0; k < n; k++) {
      const ya = y0 + k * fh, yb = ya + fh
      const tone = inV ? 0.62 : 0.9 + hash(a.x + k, a.z) * 0.18
      out.quad([P3(0, ya, 0), P3(L, ya, 0), P3(L, yb, 0), P3(0, yb, 0)], N, UV, shade(glass, tone), GLASS)
      // white floor line
      out.quad([P3(0, ya, 0.1), P3(L, ya, 0.1), P3(L, ya + (inV ? 1.1 : 0.35), 0.1), P3(0, ya + (inV ? 1.1 : 0.35), 0.1)], N, UV, inV ? shade(frame, 0.85) : frame, METAL)
    }
    if (inV) continue // the groove's walls: terraces, no slanted frame
    // slanted white mullions, zigzagging every HOPEN_ZIG storeys
    const cols = Math.max(1, Math.round(L / HOPEN_PANE)), w = L / cols, s = HOPEN_SLANT * w, hw = HOPEN_MULLION / 2
    for (let k = 0; k < n; k++) {
      const ya = y0 + k * fh, yb = ya + fh
      const blk = Math.floor(k / HOPEN_ZIG), ph = k % HOPEN_ZIG
      const dir = blk % 2 === 0 ? 1 : -1
      const off0 = dir > 0 ? ph * s : (HOPEN_ZIG - ph) * s
      for (let cc = -1; cc <= cols; cc++) {
        const u0 = cc * w + (off0 % w), ub = u0 + dir * s
        if (u0 < hw || u0 > L - hw || ub < hw || ub > L - hw) continue
        out.quad([P3(u0 - hw, ya, 0.18), P3(u0 + hw, ya, 0.18), P3(ub + hw, yb, 0.18), P3(ub - hw, yb, 0.18)], N, UV, frame, METAL)
      }
    }
    // white corner edges
    out.quad([P3(0, y0, 0.2), P3(0.7, y0, 0.2), P3(0.7, H, 0.2), P3(0, H, 0.2)], N, UV, frame, METAL)
  }
  walls(out, ring, H, H + 1.5, frame)
  capPolygon(out, ring, H + 0.2, hex(HOPEN_ROOFC), 0)
  // rooftop restaurant pavilion (glass) and the mast
  const pav = HOPEN_PAV.map(([e, nn]) => F.xz(e, nn))
  const pr = (() => { let A = 0; for (let i = 0; i < pav.length; i++) { const p = pav[i], q = pav[(i + 1) % pav.length]; A += p.x * q.z - q.x * p.z } return A >= 0 ? pav : [...pav].reverse() })()
  walls(out, pr, H, H + HOPEN_PAV_H, shade(glass, 0.8), GLASS)
  capPolygon(out, pr, H + HOPEN_PAV_H, frame, 0)
  const m = F.xz(HOPEN_MAST_AT[0], HOPEN_MAST_AT[1])
  const mr = [{ x: m.x - 0.4, z: m.z - 0.4 }, { x: m.x + 0.4, z: m.z - 0.4 }, { x: m.x + 0.4, z: m.z + 0.4 }, { x: m.x - 0.4, z: m.z + 0.4 }]
  walls(out, mr, H, H + HOPEN_MAST, hex('#c8cccc'))
}
