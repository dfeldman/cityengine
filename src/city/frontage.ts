/**
 * Which walls face a street: the question behind every shop sign and every wall-mounted lamp.
 *
 * A wall faces a street if a carriageway's centre line is close in front of it — within the carriageway,
 * the pavement and a little set-back — and in FRONT of it, not behind or off to the side. That rules out
 * party walls, the backs of courtyards and the flank of a building that only touches a street at a corner.
 */
import { unpackPoints, type PackedEdge } from './package.ts'

interface StreetSeg { ax: number; az: number; bx: number; bz: number; reach: number; half: number }

export type StreetIndex = Map<string, StreetSeg[]>

const CELL = 50

export function streetIndex(edges: readonly PackedEdge[], slack = 3): StreetIndex {
  const grid: StreetIndex = new Map()
  for (const e of edges) {
    if (e.foot) continue
    const pts = unpackPoints(e.points)
    const reach = e.width / 2 + e.walk + slack
    for (let i = 1; i < pts.length; i++) {
      const seg = { ax: pts[i - 1].x, az: pts[i - 1].z, bx: pts[i].x, bz: pts[i].z, reach, half: e.width / 2 }
      const cells = new Set<string>()
      for (const t of [0, 0.5, 1]) {
        cells.add(`${Math.floor((seg.ax + (seg.bx - seg.ax) * t) / CELL)},${Math.floor((seg.az + (seg.bz - seg.az) * t) / CELL)}`)
      }
      for (const k of cells) {
        const list = grid.get(k)
        if (list) list.push(seg)
        else grid.set(k, [seg])
      }
    }
  }
  return grid
}

/** Does the wall whose midpoint is (mx, mz), with outward normal (nx, nz), face a street? */
export function facesStreet(index: StreetIndex, mx: number, mz: number, nx: number, nz: number): boolean {
  const gx = Math.floor(mx / CELL)
  const gz = Math.floor(mz / CELL)
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      for (const sg of index.get(`${gx + dx},${gz + dz}`) ?? []) {
        const sx = sg.bx - sg.ax
        const sz = sg.bz - sg.az
        const l2 = sx * sx + sz * sz || 1
        const t = Math.max(0, Math.min(1, ((mx - sg.ax) * sx + (mz - sg.az) * sz) / l2))
        const qx = sg.ax + sx * t - mx
        const qz = sg.az + sz * t - mz
        const d = Math.hypot(qx, qz)
        if (d > sg.reach || d < 0.5) continue
        if ((qx * nx + qz * nz) / d > 0.7) return true
      }
    }
  }
  return false
}

/**
 * How far in front of a wall the nearest carriageway's centre line runs, or null: half the gap to the buildings across
 * the way, for a street the buildings line on both sides — an alley's is a couple of metres.
 */
export function centreDistance(index: StreetIndex, mx: number, mz: number, nx: number, nz: number): number | null {
  const gx = Math.floor(mx / CELL)
  const gz = Math.floor(mz / CELL)
  let best: number | null = null
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      for (const sg of index.get(`${gx + dx},${gz + dz}`) ?? []) {
        const sx = sg.bx - sg.ax
        const sz = sg.bz - sg.az
        const l2 = sx * sx + sz * sz || 1
        const t = Math.max(0, Math.min(1, ((mx - sg.ax) * sx + (mz - sg.az) * sz) / l2))
        const qx = sg.ax + sx * t - mx
        const qz = sg.az + sz * t - mz
        const d = Math.hypot(qx, qz)
        if (d > sg.reach || d < 0.5 || (qx * nx + qz * nz) / d < 0.7) continue
        if (best === null || d < best) best = d
      }
    }
  }
  return best
}

/**
 * How much pavement is in front of a wall: the distance from the wall's point (mx, mz) out along its normal
 * to the kerb of the nearest carriageway in front of it — the depth a café terrace may use. Null when no
 * street is in front.
 */
export function pavementDepth(index: StreetIndex, mx: number, mz: number, nx: number, nz: number): number | null {
  const gx = Math.floor(mx / CELL)
  const gz = Math.floor(mz / CELL)
  let best: number | null = null
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      for (const sg of index.get(`${gx + dx},${gz + dz}`) ?? []) {
        const sx = sg.bx - sg.ax
        const sz = sg.bz - sg.az
        const l2 = sx * sx + sz * sz || 1
        const t = Math.max(0, Math.min(1, ((mx - sg.ax) * sx + (mz - sg.az) * sz) / l2))
        const qx = sg.ax + sx * t - mx
        const qz = sg.az + sz * t - mz
        const d = Math.hypot(qx, qz)
        if (d > sg.reach || d < 0.5 || (qx * nx + qz * nz) / d < 0.7) continue
        const depth = d - sg.half
        if (best === null || depth < best) best = depth
      }
    }
  }
  return best
}
