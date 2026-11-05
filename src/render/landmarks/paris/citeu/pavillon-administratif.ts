/**
 * THE PAVILLON ADMINISTRATIF — LUCIEN BECHMANN (1933): the Cité's gatehouse in the Louis XIII manner. Two pale
 * stone pavilions with brick quoins, window surrounds and storey bands, three storeys under steep slate hip roofs
 * with brick-framed dormers and tall brick chimneys, joined by a one-storey stone arcade of seven round arches
 * (the main gate from the Boulevard Jourdan) under a balustraded terrace. The pavilion ends and the arcade face
 * the Cour d'Honneur to the SSW; the boulevard runs behind.
 * Refs: Commons "Cité U. August 20, 2010 N2.jpg", "... Pavillon administratif 143.jpg", "... 38.jpg"
 * (docs/landmarks/refs/citeu/pavillon-administratif/). Plan from OSM way 28841632; front bearing ~199.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { FIXED, box } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, roof, type Rgb } from '../../kit.ts'

const STONE: Rgb = hex('#e3d6b8'), BRICK: Rgb = hex('#b06a4e'), SLATE: Rgb = hex('#4a4e55'), GLASS: Rgb = hex('#3a3f46')
const DECK: Rgb = hex('#6d6a63'), SHADOW: Rgb = hex('#2e3030')
const stoneTag = surfaceTag('ashlar'), brickTag = surfaceTag('brick'), glassTag = surfaceTag('glass')

const GF = 4.4, FL = 3.6, STOREYS = 3               // ground storey, upper storeys
const CORNICE = 0.5, CORNICE_OUT = 0.35
const ROOF_LOW = 8.5, ROOF_LOW_IN = 3.2, ROOF_TOP = 2.2   // steep lower hip, then the ridge cap
const BAY = 3.3, WIN_W = 1.25, WIN_H = 2.2, SILL = 0.9, SURROUND = 0.14, QUOIN = 0.5
const DORMER_W = 1.5, DORMER_H = 2.2, DORMER_OUT = 1.0, DORMER_BASE = 0.6
const CHIMNEY_W = 1.1, CHIMNEY_D = 0.8, CHIMNEY_UP = 1.8
const ARC_H = 5.6, ARC_TOP = 7.2, ARCHES = 7, PIER_W = 1.0, ARCH_SEGS = 6
const BAL_H = 1.0, BAL_T = 0.3

type V = [number, number, number]
type R = { x0: number; x1: number; z0: number; z1: number }

/** Pavilions = the x-spans of the ring's forward points (z < 0), full z extent; the arcade is the gap between. */
function plan(fit: Fit): { W: R; E: R; A: R } {
  const ring = fit.ring && fit.ring.length >= 3 ? fit.ring : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  const fwd = ring.filter(p => p.z < 0), cx = fwd.reduce((s, p) => s + p.x, 0) / Math.max(1, fwd.length)
  const span = (pts: { x: number }[]) => [Math.min(...pts.map(p => p.x)), Math.max(...pts.map(p => p.x))]
  const wl = fwd.filter(p => p.x < cx), el = fwd.filter(p => p.x >= cx)
  const [wx0, wx1] = wl.length ? span(wl) : [-fit.hx, -fit.hx * 0.4]
  const [ex0, ex1] = el.length ? span(el) : [fit.hx * 0.4, fit.hx]
  const zs = (a: number, b: number) => ring.filter(p => p.x >= a - 0.5 && p.x <= b + 0.5).map(p => p.z)
  const W = { x0: wx0, x1: wx1, z0: Math.min(...zs(wx0, wx1)), z1: Math.max(...zs(wx0, wx1)) }
  const E = { x0: ex0, x1: ex1, z0: Math.min(...zs(ex0, ex1)), z1: Math.max(...zs(ex0, ex1)) }
  const mid = ring.filter(p => p.x > wx1 + 0.5 && p.x < ex0 - 0.5).map(p => p.z)
  const A = { x0: wx1, x1: ex0, z0: mid.length ? Math.min(...mid) : -2, z1: mid.length ? Math.max(...mid) : 2 }
  return { W, E, A }
}

/** A flat rectangle on a face: axis 'x' faces run along x at plane z (normal ±z); 'z' faces run along z at plane x. */
function rect(out: MeshBuilder, axis: 'x' | 'z', plane: number, sgn: number, t0: number, t1: number, y0: number, y1: number,
  c: Rgb, tag = FIXED): void {
  const n: V = axis === 'x' ? [0, 0, sgn] : [sgn, 0, 0]
  const p = (t: number, y: number): V => axis === 'x' ? [t, y, plane] : [plane, y, t]
  const q: V[] = (axis === 'x') === (sgn > 0) ? [p(t0, y0), p(t1, y0), p(t1, y1), p(t0, y1)] : [p(t1, y0), p(t0, y0), p(t0, y1), p(t1, y1)]
  out.quad(q, n, [[0, 0], [t1 - t0, 0], [t1 - t0, y1 - y0], [0, y1 - y0]], c, tag)
}

function facade(out: MeshBuilder, axis: 'x' | 'z', plane: number, sgn: number, t0: number, t1: number, eave: number): void {
  const L = t1 - t0, d = sgn * 0.04
  // brick quoins at the corners, brick storey bands
  rect(out, axis, plane + d, sgn, t0, t0 + QUOIN, 0, eave, BRICK, brickTag)
  rect(out, axis, plane + d, sgn, t1 - QUOIN, t1, 0, eave, BRICK, brickTag)
  for (let s = 1; s < STOREYS; s++) {
    const y = GF + (s - 1) * FL
    rect(out, axis, plane + d, sgn, t0, t1, y - 0.15, y + 0.2, BRICK, brickTag)
  }
  const cols = Math.max(1, Math.round((L - 2 * QUOIN) / BAY)), step = (L - 2 * QUOIN) / cols
  for (let s = 0; s < STOREYS; s++) {
    const y0 = s === 0 ? 1.0 : GF + (s - 1) * FL + SILL, h = s === 0 ? WIN_H + 0.4 : WIN_H
    for (let k = 0; k < cols; k++) {
      const t = t0 + QUOIN + (k + 0.5) * step
      rect(out, axis, plane + d * 1.5, sgn, t - WIN_W / 2 - SURROUND, t + WIN_W / 2 + SURROUND, y0 - SURROUND, y0 + h + SURROUND, BRICK, brickTag)
      rect(out, axis, plane + d * 2.5, sgn, t - WIN_W / 2, t + WIN_W / 2, y0, y0 + h, GLASS, glassTag)
    }
  }
}

function dormer(out: MeshBuilder, axis: 'x' | 'z', plane: number, sgn: number, t: number, y: number): void {
  // a stone-and-brick dormer standing out from the roof slope, with a little pyramid cap
  const hw = DORMER_W / 2 + 0.25, cxz = plane - sgn * DORMER_OUT / 2
  if (axis === 'x') {
    box(out, t, y + DORMER_H / 2, cxz, hw, DORMER_H / 2, DORMER_OUT / 2, BRICK, brickTag)
    roof(out, t - hw - 0.1, t + hw + 0.1, cxz - DORMER_OUT / 2 - 0.1, cxz + DORMER_OUT / 2 + 0.1, y + DORMER_H, 1.0, hw + 0.1, 0, SLATE)
  } else {
    box(out, cxz, y + DORMER_H / 2, t, DORMER_OUT / 2, DORMER_H / 2, hw, BRICK, brickTag)
    roof(out, cxz - DORMER_OUT / 2 - 0.1, cxz + DORMER_OUT / 2 + 0.1, t - hw - 0.1, t + hw + 0.1, y + DORMER_H, 1.0, 0, hw + 0.1, SLATE)
  }
  rect(out, axis, plane + sgn * 0.02, sgn, t - DORMER_W / 2 + 0.2, t + DORMER_W / 2 - 0.2, y + 0.25, y + DORMER_H - 0.25, GLASS, glassTag)
}

function pavilion(out: MeshBuilder, r: R, skipEdge: 'x0' | 'x1'): void {
  const eave = GF + (STOREYS - 1) * FL + 1.0
  box(out, (r.x0 + r.x1) / 2, (eave - 0.3) / 2, (r.z0 + r.z1) / 2, (r.x1 - r.x0) / 2, (eave + 0.3) / 2, (r.z1 - r.z0) / 2, STONE, stoneTag)
  facade(out, 'x', r.z0, -1, r.x0, r.x1, eave)
  facade(out, 'x', r.z1, 1, r.x0, r.x1, eave)
  facade(out, 'z', r.x0, -1, r.z0, r.z1, eave)
  facade(out, 'z', r.x1, 1, r.z0, r.z1, eave)
  box(out, (r.x0 + r.x1) / 2, eave + CORNICE / 2, (r.z0 + r.z1) / 2, (r.x1 - r.x0) / 2 + CORNICE_OUT, CORNICE / 2,
    (r.z1 - r.z0) / 2 + CORNICE_OUT, STONE, stoneTag)
  const y0 = eave + CORNICE, w = r.x1 - r.x0, l = r.z1 - r.z0
  const ix = Math.min(ROOF_LOW_IN, w / 2 - 0.5), iz = Math.min(ROOF_LOW_IN, l / 2 - 0.5)
  roof(out, r.x0, r.x1, r.z0, r.z1, y0, ROOF_LOW, ix, iz, SLATE)
  const tw = w - 2 * ix, tl = l - 2 * iz, ridgeX = tl > tw
  roof(out, r.x0 + ix, r.x1 - ix, r.z0 + iz, r.z1 - iz, y0 + ROOF_LOW, ROOF_TOP, ridgeX ? tw / 2 : 0.6 * tw / 2, ridgeX ? 0.6 * tl / 4 : tl / 2, SLATE)
  // dormers on the slope, one per bay pair, set in from the wall line
  const dy = y0 + DORMER_BASE, slopeIn = ROOF_LOW_IN * (DORMER_BASE / ROOF_LOW) + 0.4
  const along = (t0: number, t1: number, f: (t: number) => void) => {
    const n = Math.max(1, Math.round((t1 - t0 - 2 * QUOIN) / (BAY * 1.5))), st = (t1 - t0 - 2 * QUOIN) / n
    for (let k = 0; k < n; k++) f(t0 + QUOIN + (k + 0.5) * st)
  }
  along(r.x0 + 1, r.x1 - 1, t => { dormer(out, 'x', r.z0 + slopeIn, -1, t, dy); dormer(out, 'x', r.z1 - slopeIn, 1, t, dy) })
  along(r.z0 + 1, r.z1 - 1, t => {
    if (skipEdge !== 'x0') dormer(out, 'z', r.x0 + slopeIn, -1, t, dy)
    if (skipEdge !== 'x1') dormer(out, 'z', r.x1 - slopeIn, 1, t, dy)
  })
  // tall brick chimneys rising from the slopes near the ends
  const ctop = y0 + ROOF_LOW + ROOF_TOP + CHIMNEY_UP
  for (const fz of [0.12, 0.5, 0.88]) for (const fx of [0.32, 0.68]) {
    if (fz === 0.5 && fx === 0.82) continue
    const x = r.x0 + w * fx, z = r.z0 + l * fz
    box(out, x, (y0 + ctop) / 2, z, CHIMNEY_W / 2, (ctop - y0) / 2, CHIMNEY_D / 2, BRICK, brickTag)
    box(out, x, ctop + 0.15, z, CHIMNEY_W / 2 + 0.12, 0.15, CHIMNEY_D / 2 + 0.12, STONE, stoneTag)
  }
}

/** One face of the arcade's wall: piers and round-arch spandrels, open through. */
function arcadeFace(out: MeshBuilder, z: number, sgn: number, x0: number, x1: number): void {
  const step = (x1 - x0) / ARCHES, r = (step - PIER_W) / 2, spring = ARC_H - r
  rect(out, 'x', z, sgn, x0, x1, ARC_H, ARC_TOP, STONE, stoneTag)
  for (let k = 0; k < ARCHES; k++) {
    const cx = x0 + (k + 0.5) * step
    // piers either side of the bay
    rect(out, 'x', z, sgn, cx - step / 2, cx - r, 0, ARC_H, STONE, stoneTag)
    if (k === ARCHES - 1) rect(out, 'x', z, sgn, cx + r, cx + step / 2, 0, ARC_H, STONE, stoneTag)
    // spandrel between the arch curve and the line at ARC_H
    for (let i = 0; i < ARCH_SEGS; i++) {
      const a0 = Math.PI * i / ARCH_SEGS, a1 = Math.PI * (i + 1) / ARCH_SEGS
      const xa = cx - r * Math.cos(a0), xb = cx - r * Math.cos(a1)
      const ya = spring + r * Math.sin(a0), yb = spring + r * Math.sin(a1)
      const q: V[] = [[xa, ya, z], [xb, yb, z], [xb, ARC_H, z], [xa, ARC_H, z]]
      out.quad(sgn > 0 ? q : [q[1], q[0], q[3], q[2]], [0, 0, sgn], [[0, 0], [1, 0], [1, 1], [0, 1]], STONE, stoneTag)
    }
  }
}

function arcade(out: MeshBuilder, a: R): void {
  arcadeFace(out, a.z0, -1, a.x0, a.x1)
  arcadeFace(out, a.z1, 1, a.x0, a.x1)
  const step = (a.x1 - a.x0) / ARCHES, r = (step - PIER_W) / 2
  // pier sides and vault soffit (dark, so the arches read as openings)
  for (let k = 0; k <= ARCHES; k++) {
    const x = a.x0 + k * step
    if (k > 0) rect(out, 'z', x - PIER_W / 2, -1, a.z0, a.z1, 0, ARC_H - r, STONE, stoneTag)
    if (k < ARCHES) rect(out, 'z', x + PIER_W / 2, 1, a.z0, a.z1, 0, ARC_H - r, STONE, stoneTag)
  }
  box(out, (a.x0 + a.x1) / 2, ARC_H + 0.05, (a.z0 + a.z1) / 2, (a.x1 - a.x0) / 2, 0.05, (a.z1 - a.z0) / 2 - 0.05, SHADOW)
  // the terrace: a dark deck sunk inside a stone balustrade
  box(out, (a.x0 + a.x1) / 2, ARC_TOP - 0.05, (a.z0 + a.z1) / 2, (a.x1 - a.x0) / 2, 0.05, (a.z1 - a.z0) / 2, DECK)
  for (const z of [a.z0 + BAL_T / 2, a.z1 - BAL_T / 2])
    box(out, (a.x0 + a.x1) / 2, ARC_TOP + BAL_H / 2, z, (a.x1 - a.x0) / 2, BAL_H / 2, BAL_T / 2, STONE, stoneTag)
}

export function pavillonAdministratif(out: MeshBuilder, fit: Fit): void {
  const { W, E, A } = plan(fit)
  pavilion(out, W, 'x1')
  pavilion(out, E, 'x0')
  if (A.x1 - A.x0 > 3) arcade(out, A)
}
