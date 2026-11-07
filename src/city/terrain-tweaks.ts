/**
 * Runtime changes to the ground, applied to each tile's fine block as it streams in (city/terrain.ts `addTile`), so the
 * drawn ground, the grass, everything draped and the depth occluder all see the same ground — and nothing is rebaked.
 * The coarse far grid is left alone: from a kilometre off a 20 m post cannot hold a pit, and a model covers it close up.
 *
 * Named in regions.json `terrainTweaks`, in lat/lon, applied in their order. Kinds:
 *   - `level`: every fine post inside the ring is set to `y`, eased back into the ground over `fade` metres outside it (the
 *     bake's `levelGrounds`, without a rebake: for a dip the survey read through glass, as at the Carrousel's skylight).
 *   - `pit`: every fine post inside the ring is lowered to the pit's floor (never raised). The
 *     ground ramps back up over one grid step outside the lowered posts, so a model must cover that band — a pit is
 *     for something drawn INTO it (the Louvre's inverted pyramid, under its skylight), with the ring drawn a little
 *     inside the model's rim. Its floor is `y` when given, else `depth` below the coarse ground at the ring's centre.
 */
import type { Projection } from './geo.ts'

export interface TerrainTweakSpec {
  name: string
  kind: 'pit' | 'level'
  ring: [number, number][]
  /** the level or the floor, in metres on the city's datum */
  y?: number
  /** pit: metres below the coarse ground at the ring's centre, when no `y` */
  depth?: number
  /** level: metres eased back into the ground outside the ring (default 8) */
  fade?: number
}

/** A tweak in local metres, ready to apply: `ring` flat [x, z, …], `y` the floor in metres. */
export interface TerrainTweak {
  name: string
  kind: 'pit' | 'level'
  ring: number[]
  x0: number; x1: number; z0: number; z1: number
  y: number
  fade: number
}

function distToRing(r: number[], x: number, z: number): number {
  let d = Infinity
  for (let i = 0; i < r.length; i += 2) {
    const j = (i + 2) % r.length, dx = r[j] - r[i], dz = r[j + 1] - r[i + 1]
    const t = Math.max(0, Math.min(1, ((x - r[i]) * dx + (z - r[i + 1]) * dz) / (dx * dx + dz * dz || 1)))
    d = Math.min(d, Math.hypot(r[i] + dx * t - x, r[i + 1] + dz * t - z))
  }
  return d
}

export function inRing(r: number[], x: number, z: number): boolean {
  let inside = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) inside = !inside
  }
  return inside
}

/** Project the specs into local metres; `ground` is the coarse ground (heights before any tile has landed). */
export function prepareTweaks(specs: TerrainTweakSpec[] | undefined, proj: Projection, ground: (x: number, z: number) => number): TerrainTweak[] {
  return (specs ?? []).map((s) => {
    const ring = s.ring.flatMap(([lat, lon]) => { const q = proj.toLocal({ lat, lon }); return [q.x, q.z] })
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, cx = 0, cz = 0
    for (let i = 0; i < ring.length; i += 2) {
      x0 = Math.min(x0, ring[i]); x1 = Math.max(x1, ring[i]); z0 = Math.min(z0, ring[i + 1]); z1 = Math.max(z1, ring[i + 1])
      cx += ring[i]; cz += ring[i + 1]
    }
    const n = ring.length / 2
    const fade = s.kind === 'level' ? s.fade ?? 8 : 0
    const y = s.y ?? ground(cx / n, cz / n) - (s.depth ?? 0)
    return { name: s.name, kind: s.kind, ring, x0: x0 - fade, x1: x1 + fade, z0: z0 - fade, z1: z1 + fade, y, fade }
  })
}

/** Apply the tweaks to one tile's block in place: `dm` decimetres, row-major, post (r, c) at (ox + c·step, oz + r·step). */
export function applyTweaks(tweaks: TerrainTweak[], dm: Int16Array, cols: number, step: number, ox: number, oz: number): number {
  let n = 0
  for (const t of tweaks) {
    if (t.x1 < ox || t.x0 > ox + (cols - 1) * step || t.z1 < oz || t.z0 > oz + (cols - 1) * step) continue
    const v = Math.round(t.y * 10)
    for (let r = Math.max(0, Math.floor((t.z0 - oz) / step)); r <= Math.min(cols - 1, Math.ceil((t.z1 - oz) / step)); r++) {
      for (let c = Math.max(0, Math.floor((t.x0 - ox) / step)); c <= Math.min(cols - 1, Math.ceil((t.x1 - ox) / step)); c++) {
        const x = ox + c * step, z = oz + r * step, i = r * cols + c
        if (t.kind === 'pit') {
          if (!inRing(t.ring, x, z)) continue
          dm[i] = Math.min(dm[i], v)
        } else {
          const k = inRing(t.ring, x, z) ? 1 : t.fade > 0 ? 1 - distToRing(t.ring, x, z) / t.fade : 0
          if (k <= 0) continue
          dm[i] = Math.round(dm[i] + (v - dm[i]) * k)
        }
        n++
      }
    }
  }
  return n
}
