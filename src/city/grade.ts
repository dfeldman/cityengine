/**
 * The streets' own level (BUGS.md #38): the bake gives each street the highest ground across its corridor, and
 * inside the corridor everything — the road, the pavement, a building's foot, a street tree — stands at that
 * level rather than tipped with the hill.
 *
 * Moved out of render/city.ts (2026-09-28) because map format v3 BAKES heights (docs/MAP-FORMAT.md rule 3), and
 * a baked building foot is only right if the bake levels the ground exactly as the renderer does. One class, both
 * sides.
 *
 * Code frame: x east, z north, metres.
 */
import type { PackedEdge } from './package.ts'

interface Seg { ax: number; az: number; bx: number; bz: number; ha: number; hb: number; half: number }

export class StreetGrade {
  /** each segment of each street at grade, with its heights at both ends and its half-width, in 10 m cells */
  private readonly cells = new Map<string, Seg[]>()
  private readonly seen = new Set<number>()

  /** File a street (idempotent by id). Bridges, tunnels and streets without heights have no corridor. */
  add(e: Pick<PackedEdge, 'id' | 'points' | 'heights' | 'bridge' | 'tunnel' | 'foot' | 'width' | 'walk'>): void {
    if (this.seen.has(e.id) || !e.heights || e.bridge || e.tunnel) return
    this.seen.add(e.id)
    const half = (e.foot ? e.width / 2 : e.width / 2 + Math.max(e.walk, 0.6)) + 0.3
    for (let i = 2; i < e.points.length; i += 2) {
      const sg = { ax: e.points[i - 2], az: e.points[i - 1], bx: e.points[i], bz: e.points[i + 1], ha: e.heights[i / 2 - 1], hb: e.heights[i / 2], half }
      const x0 = Math.floor((Math.min(sg.ax, sg.bx) - half) / 10)
      const x1 = Math.floor((Math.max(sg.ax, sg.bx) + half) / 10)
      const z0 = Math.floor((Math.min(sg.az, sg.bz) - half) / 10)
      const z1 = Math.floor((Math.max(sg.az, sg.bz) + half) / 10)
      for (let gx = x0; gx <= x1; gx++) for (let gz = z0; gz <= z1; gz++) {
        const k = `${gx},${gz}`
        const list = this.cells.get(k)
        if (list) list.push(sg)
        else this.cells.set(k, [sg])
      }
    }
  }

  /** The level of the street whose corridor (x, z) is in — the nearest, where two overlap — or null. */
  at(x: number, z: number): number | null {
    const list = this.cells.get(`${Math.floor(x / 10)},${Math.floor(z / 10)}`)
    if (!list) return null
    let best: number | null = null
    let bd = Infinity
    for (const sg of list) {
      const dx = sg.bx - sg.ax
      const dz = sg.bz - sg.az
      const l2 = dx * dx + dz * dz || 1e-9
      const t = Math.max(0, Math.min(1, ((x - sg.ax) * dx + (z - sg.az) * dz) / l2))
      const d = Math.hypot(x - sg.ax - dx * t, z - sg.az - dz * t)
      if (d > sg.half || d >= bd) continue
      bd = d
      best = sg.ha + (sg.hb - sg.ha) * t
    }
    return best
  }
}
