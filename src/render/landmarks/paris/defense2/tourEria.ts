/**
 * Tour Eria / Campus Cyber (Puteaux, 2Portzamparc, 2021; OSM way/68849364): 13 office floors, 55 m (Paris La Défense
 * and Batiweb). A fan-shaped plot: a straight back along the street, a quarter-round front. Batiweb ("Tour Eria à la
 * Défense…"): a central core with three petal wings fanning out, stepped planted terraces between the petals. So the
 * OSM ring is resampled, split by angle about the middle of its long straight side into three sectors, and pinched
 * at the two sector joins into three rounded lobes; the pinch deepens in steps near the top (the terraces, planted).
 * Skin: pale sky-blue reflective glass with fine white floor lines; white Alucobond canopy over a dark glazed lobby.
 * BD TOPO has no height here (h 0 on the dalle).
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { towerRing } from '../../tower.ts'
import { band, prism } from '../defense-famous/cb21.ts'

type P = { x: number; z: number }
const HEIGHT = 55
const GLASS = '#b4c8d8', FOLD = '#e6ecf0', CANOPY = '#f1f1ee', LOBBY_GLASS = '#5d6c78', ROOF = '#9a9c9e', GREEN = '#6f8f55'
const LOBBY_H = 5.5, CANOPY_DEPTH = 3.5, CANOPY_T = 0.8, FLOOR = 4
const STEP = 2                 // m: ring resampling
const PINCH_W = 9             // deg: half-width of the pinch between petals
const PINCH_EDGE = 12          // m from the straight back over which the pinch fades in
// [from height m, pinch depth as a share of the radius]: the terraces step in between the petals
const PINCH: [number, number][] = [[0, 0.22], [35, 0.34], [45, 0.48]]

function resample(r: P[], step: number): P[] {
  const o: P[] = []
  for (let i = 0; i < r.length; i++) {
    const a = r[i], b = r[(i + 1) % r.length], L = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.round(L / step))
    for (let k = 0; k < n; k++) o.push({ x: a.x + (b.x - a.x) * k / n, z: a.z + (b.z - a.z) * k / n })
  }
  return o
}

export function tourEria(out: MeshBuilder, fit: Fit): void {
  const r0 = towerRing(fit), H = fit.height > 40 && fit.height < 70 ? fit.height : HEIGHT
  // the straight back = the longest edge; the pivot is its middle, petals fan out to the far side
  let li = 0, lL = 0
  for (let i = 0; i < r0.length; i++) { const a = r0[i], b = r0[(i + 1) % r0.length], L = Math.hypot(b.x - a.x, b.z - a.z); if (L > lL) { lL = L; li = i } }
  const ea = r0[li], eb = r0[(li + 1) % r0.length]
  const ex = (eb.x - ea.x) / lL, ez = (eb.z - ea.z) / lL
  const piv = { x: (ea.x + eb.x) / 2, z: (ea.z + eb.z) / 2 }
  const ring = resample(r0, STEP)
  // side of the back the building lies on
  let side = 0; for (const p of ring) side += (p.x - piv.x) * -ez + (p.z - piv.z) * ex
  const nx = -ez * Math.sign(side), nz = ex * Math.sign(side)
  const info = ring.map((p) => {
    const dx = p.x - piv.x, dz = p.z - piv.z
    return { d: dx * nx + dz * nz, th: Math.atan2(dx * nx + dz * nz, dx * ex + dz * ez) * 180 / Math.PI }
  })
  const far = info.filter((q) => q.d > PINCH_EDGE)
  const t0 = Math.min(...far.map((q) => q.th)), t1 = Math.max(...far.map((q) => q.th))
  const joins = [t0 + (t1 - t0) / 3, t0 + 2 * (t1 - t0) / 3]
  const at = (depth: number): P[] => ring.map((p, i) => {
    const { d, th } = info[i]
    const g = joins.reduce((s, j) => s + Math.exp(-(((th - j) / PINCH_W) ** 2)), 0) * Math.min(1, Math.max(0, d / PINCH_EDGE))
    const k = 1 - depth * g
    return { x: piv.x + (p.x - piv.x) * k, z: piv.z + (p.z - piv.z) * k }
  })
  const glass = hex(GLASS), fold = hex(FOLD)
  // lobby and canopy
  const base = at(PINCH[0][1])
  band(out, at(PINCH[0][1] + 0.03), 0, LOBBY_H, hex(LOBBY_GLASS))
  const cx = base.reduce((s, p) => s + p.x, 0) / base.length, cz = base.reduce((s, p) => s + p.z, 0) / base.length
  const canopy = base.map((p) => { const dx = p.x - cx, dz = p.z - cz, L = Math.hypot(dx, dz) || 1; return { x: p.x + dx / L * CANOPY_DEPTH, z: p.z + dz / L * CANOPY_DEPTH } })
  band(out, canopy, LOBBY_H, LOBBY_H + CANOPY_T, hex(CANOPY))
  capPolygon(out, canopy, LOBBY_H + CANOPY_T, hex(CANOPY), 0)
  // petals: one prism per pinch step, a planted terrace on each step
  for (let s = 0; s < PINCH.length; s++) {
    const y0 = Math.max(LOBBY_H + CANOPY_T, PINCH[s][0]), y1 = s + 1 < PINCH.length ? PINCH[s + 1][0] : H
    const rr = at(PINCH[s][1])
    prism(out, rr, y0, y1, { glass, grid: fold, floor: FLOOR, pane: 1.35, band: 0.3, tone: 0.06 })
    capPolygon(out, rr, y1, s + 1 < PINCH.length ? hex(GREEN) : hex(ROOF), 0)
  }
  band(out, at(PINCH[PINCH.length - 1][1]), H, H + 1.2, fold)
}
