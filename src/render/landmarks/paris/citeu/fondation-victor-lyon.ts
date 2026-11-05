/**
 * THE FONDATION VICTOR LYON — LUCIEN BECHMANN (1950, renovated 2017): six storeys of dark red brick over a pale
 * ashlar ground storey, flat roof behind a thin pale coping; the windows paired in pale stone frames; a white
 * stair tower with a canted (half-hexagon) front rising a little above the roof near the west end of the
 * Avenue Rockefeller front.
 * Refs: Commons "Fondation victor lyon.jpg", "Victorlyonparc.jpg", ciup.fr banner (docs/landmarks/refs/citeu/victor-lyon/).
 * Plan from OSM way 35282206; the long front faces bearing ~19 (NNE, onto the Avenue Rockefeller).
 */
import earcut from 'earcut'
import type { MeshBuilder } from '../../../buildings.ts'
import { FIXED } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'

const BRICK: Rgb = hex('#8a4636'), STONE: Rgb = hex('#e6e0d2'), FRAME: Rgb = hex('#efebe2'), GLASS: Rgb = hex('#38404a')
const ROOF: Rgb = hex('#4f4f4c'), TOWER: Rgb = hex('#f1eee6')
const brickTag = surfaceTag('brick'), stoneTag = surfaceTag('ashlar'), glassTag = surfaceTag('glass'), towerTag = surfaceTag('stucco')

const STOREYS = 6, GF = 4.0, FL = 2.9                // ground storey, upper storeys
const COPING_H = 0.45, COPING_OUT = 0.08              // thin pale coping band on the parapet
const PARAPET = 0.9                                   // parapet rise above the roof deck
const BAY = 3.4, PAIR_W = 2.3, WIN_H = 1.6, SILL_Y = 0.85, FRAME_W = 0.18
const GF_WIN_W = 0.9, GF_WIN_H = 2.6, GF_BAY = 1.7
const TOWER_W = 4.2, TOWER_OUT = 1.6, TOWER_UP = 2.0, TOWER_AT = 0.12  // fraction along the longest edge
const TOWER_WIN_W = 1.0, TOWER_WIN_H = 1.7

type P = { x: number; z: number }
type V = [number, number, number]

function onWall(out: MeshBuilder, a: P, b: P, n: V, t0: number, t1: number, y0: number, y1: number, c: Rgb, d: number, tag = FIXED): void {
  const L = Math.hypot(b.x - a.x, b.z - a.z), ux = (b.x - a.x) / L, uz = (b.z - a.z) / L
  const p = (t: number, y: number): V => [a.x + ux * t + n[0] * d, y, a.z + uz * t + n[2] * d]
  out.quad([p(t0, y0), p(t1, y0), p(t1, y1), p(t0, y1)], n, [[0, 0], [t1 - t0, 0], [t1 - t0, y1 - y0], [0, y1 - y0]], c, tag)
}

function cap(out: MeshBuilder, ring: P[], y: number, c: Rgb): void {
  const ix = earcut(ring.flatMap(p => [p.x, p.z]))
  for (let i = 0; i < ix.length; i += 3) {
    const p = ring[ix[i]], q = ring[ix[i + 1]], r = ring[ix[i + 2]]
    out.quad([[p.x, y, p.z], [q.x, y, q.z], [r.x, y, r.z], [r.x, y, r.z]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
  }
}

const ringOf = (fit: Fit): P[] => fit.ring && fit.ring.length >= 3 ? fit.ring : [
  { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]

export function fondationVictorLyon(out: MeshBuilder, fit: Fit): void {
  const ring = ringOf(fit), N = ring.length, eave = GF + (STOREYS - 1) * FL, top = eave + PARAPET
  let area = 0
  for (let i = 0; i < N; i++) { const a = ring[i], b = ring[(i + 1) % N]; area += a.x * b.z - b.x * a.z }
  const ccw = area > 0
  const len = ring.map((a, i) => { const b = ring[(i + 1) % N]; return Math.hypot(b.x - a.x, b.z - a.z) })
  const nrm = ring.map((a, i): V => {
    const b = ring[(i + 1) % N], L = len[i] || 1, dx = (b.x - a.x) / L, dz = (b.z - a.z) / L
    return ccw ? [dz, 0, -dx] : [-dz, 0, dx]
  })
  const longest = len.indexOf(Math.max(...len))

  for (let i = 0; i < N; i++) {
    const a = ring[i], b = ring[(i + 1) % N], L = len[i], n = nrm[i]
    if (L < 0.2) continue
    onWall(out, a, b, n, 0, L, -0.3, GF, STONE, 0, stoneTag)
    onWall(out, a, b, n, 0, L, GF, top, BRICK, 0, brickTag)
    onWall(out, a, b, n, 0, L, top - COPING_H, top, FRAME, COPING_OUT)           // the coping band only
    onWall(out, a, b, n, 0, L, GF - 0.2, GF + 0.05, FRAME, 0.05)                 // cornice over the stone storey
    if (L < 2.6) continue
    // ground storey: tall narrow windows
    const gc = Math.max(1, Math.floor(L / GF_BAY)), gs = L / gc
    for (let k = 0; k < gc; k++) {
      const t = (k + 0.5) * gs
      onWall(out, a, b, n, t - GF_WIN_W / 2, t + GF_WIN_W / 2, 0.7, 0.7 + GF_WIN_H, GLASS, 0.04, glassTag)
    }
    // upper storeys: paired windows in pale stone frames
    const cols = Math.max(1, Math.round(L / BAY)), step = L / cols, w = Math.min(PAIR_W, step - 0.6)
    for (let s = 1; s < STOREYS; s++) {
      const wy = GF + (s - 1) * FL + SILL_Y
      for (let k = 0; k < cols; k++) {
        const t = (k + 0.5) * step
        if (i === longest && Math.abs(t - L * TOWER_AT) < TOWER_W / 2 + 0.6) continue
        onWall(out, a, b, n, t - w / 2 - FRAME_W, t + w / 2 + FRAME_W, wy - FRAME_W, wy + WIN_H + FRAME_W, FRAME, 0.05)
        onWall(out, a, b, n, t - w / 2, t + w / 2, wy, wy + WIN_H, GLASS, 0.08, glassTag)
      }
    }
  }
  cap(out, ring, eave, ROOF)   // the roof deck, dark, sunk below the parapet

  // the white stair tower with its canted front
  {
    const a = ring[longest], b = ring[(longest + 1) % N], L = len[longest], n = nrm[longest]
    const ux = (b.x - a.x) / L, uz = (b.z - a.z) / L, c = L * TOWER_AT + TOWER_W / 2 < L ? Math.max(TOWER_W / 2, L * TOWER_AT) : L / 2
    const at = (t: number, d: number): P => ({ x: a.x + ux * t + n[0] * d, z: a.z + uz * t + n[2] * d })
    const h = TOWER_W / 2, k = TOWER_W * 0.25
    const pts = [at(c - h, -0.2), at(c - h, TOWER_OUT * 0.5), at(c - k, TOWER_OUT), at(c + k, TOWER_OUT), at(c + h, TOWER_OUT * 0.5), at(c + h, -0.2)]
    const ty = top + TOWER_UP
    for (let j = 0; j < pts.length - 1; j++) {
      const p = pts[j], q = pts[j + 1], l = Math.hypot(q.x - p.x, q.z - p.z)
      const fn: V = [(q.z - p.z) / l, 0, -(q.x - p.x) / l], mid = at(c, TOWER_OUT * 0.4)
      // keep the normal pointing away from the tower's middle
      if (fn[0] * ((p.x + q.x) / 2 - mid.x) + fn[2] * ((p.z + q.z) / 2 - mid.z) < 0) { fn[0] = -fn[0]; fn[2] = -fn[2] }
      onWall(out, p, q, fn, 0, l, -0.3, ty, TOWER, 0, towerTag)
      if (j === 2) for (let s = 1; s < STOREYS + 1; s++) {
        const wy = GF + (s - 1) * FL + 0.6 - FL * 0.5
        onWall(out, p, q, fn, (l - TOWER_WIN_W) / 2, (l + TOWER_WIN_W) / 2, wy, wy + TOWER_WIN_H, GLASS, 0.05, glassTag)
      }
    }
    cap(out, pts, ty, TOWER)
  }
}
