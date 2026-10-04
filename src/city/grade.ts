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

/** a 10 m cell's key, as a number (cells run to a few thousand either way of the origin) */
const cellKey = (gx: number, gz: number): number => (gx + 50000) * 100000 + (gz + 50000)
const endKey = (x: number, z: number): string => `${Math.round(x * 10)},${Math.round(z * 10)}`

interface Seg {
  ax: number; az: number; bx: number; bz: number; ha: number; hb: number; half: number; cut: boolean
  /** a ramp's first / last segment: its corridor stops SQUARE at that end (see `add`) */
  squareA?: boolean; squareB?: boolean
}

export class StreetGrade {
  /** each segment of each street at grade, with its heights at both ends and its half-width, in 10 m cells */
  // (keyed by number: a string key built per query was half this class's cost, every wheel of every car every frame)
  private readonly cells = new Map<number, Seg[]>()
  private readonly seen = new Set<number>()
  /** how many ramp edges end at each point: where ramps chain, the corridor stays round (no notch in the fill) */
  private readonly rampEnds = new Map<string, number>()

  /** File a street (idempotent by id). Bridges, tunnels and streets without heights have no corridor. */
  add(e: Pick<PackedEdge, 'id' | 'points' | 'heights' | 'bridge' | 'tunnel' | 'foot' | 'width' | 'walk' | 'cut' | 'ramp'>): void {
    if (this.seen.has(e.id) || !e.heights || e.bridge || e.tunnel) return
    this.seen.add(e.id)
    const half = (e.foot ? e.width / 2 : e.width / 2 + Math.max(e.walk, 0.6)) + 0.3
    for (let i = 2; i < e.points.length; i += 2) {
      const sg: Seg = { ax: e.points[i - 2], az: e.points[i - 1], bx: e.points[i], bz: e.points[i + 1], ha: e.heights[i / 2 - 1], hb: e.heights[i / 2], half, cut: !!e.cut }
      /*
       * A ramp's corridor is its embankment's fill, and it ends SQUARE: the round cap of an ordinary street (which
       * is what joins a street to its junction) spilled off the end of the embankment where the ramp meets its
       * bridge — onto the road the bridge crosses, which rose to the deck as a wedge of ground (Lincoln Blvd under
       * the Presidio Parkway, 2026-10-03).
       */
      if (e.ramp) { sg.squareA = i === 2; sg.squareB = i === e.points.length - 2 }
      if (e.ramp && i === 2) this.rampEnds.set(endKey(sg.ax, sg.az), (this.rampEnds.get(endKey(sg.ax, sg.az)) ?? 0) + 1)
      if (e.ramp && i === e.points.length - 2) this.rampEnds.set(endKey(sg.bx, sg.bz), (this.rampEnds.get(endKey(sg.bx, sg.bz)) ?? 0) + 1)
      const x0 = Math.floor((Math.min(sg.ax, sg.bx) - half) / 10)
      const x1 = Math.floor((Math.max(sg.ax, sg.bx) + half) / 10)
      const z0 = Math.floor((Math.min(sg.az, sg.bz) - half) / 10)
      const z1 = Math.floor((Math.max(sg.az, sg.bz) + half) / 10)
      for (let gx = x0; gx <= x1; gx++) for (let gz = z0; gz <= z1; gz++) {
        const k = cellKey(gx, gz)
        const list = this.cells.get(k)
        if (list) list.push(sg)
        else this.cells.set(k, [sg])
      }
    }
  }

  /** The level of the street whose corridor (x, z) is in — the nearest, where two overlap — or null. */
  at(x: number, z: number): number | null { return this.nearest(x, z)?.h ?? null }

  /**
   * The level of a street in a CUT whose corridor (x, z) is in (the nearest corridor there being a cut), or null: a
   * street running down into a tunnel mouth (tools/tunnels.ts). There the street is below the ground, and what is
   * draped on it must follow the street — not stand at the ground over it, which is the rule everywhere else.
   */
  cutAt(x: number, z: number): number | null {
    const n = this.nearest(x, z)
    return n && n.cut ? n.h : null
  }

  private nearest(x: number, z: number): { h: number; cut: boolean } | null {
    const list = this.cells.get(cellKey(Math.floor(x / 10), Math.floor(z / 10)))
    if (!list) return null
    let bestH = 0
    let bestCut = false
    let bd2 = Infinity
    for (const sg of list) {
      const dx = sg.bx - sg.ax
      const dz = sg.bz - sg.az
      const l2 = dx * dx + dz * dz || 1e-9
      const u = ((x - sg.ax) * dx + (z - sg.az) * dz) / l2
      if (u < 0 && sg.squareA && (this.rampEnds.get(endKey(sg.ax, sg.az)) ?? 0) < 2) continue
      if (u > 1 && sg.squareB && (this.rampEnds.get(endKey(sg.bx, sg.bz)) ?? 0) < 2) continue
      const t = u < 0 ? 0 : u > 1 ? 1 : u
      const ex = x - sg.ax - dx * t, ez = z - sg.az - dz * t
      const d2 = ex * ex + ez * ez
      if (d2 > sg.half * sg.half || d2 >= bd2) continue
      bd2 = d2
      bestH = sg.ha + (sg.hb - sg.ha) * t
      bestCut = sg.cut
    }
    return bd2 === Infinity ? null : { h: bestH, cut: bestCut }
  }
}
