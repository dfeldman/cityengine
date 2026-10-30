/**
 * Paris's formal gardens, traced from IGN's aerial photographs (tools/ortho.ts) where OSM has not mapped their planting.
 * One file to a family; each plan says what it was traced from.
 */
import { closed, frame, rect, type GardenPlan } from './plan.ts'
import { PALACE_GARDENS } from './paris-palaces.ts'
import { PUBLIC_GARDENS } from './paris-public.ts'

/**
 * The JARDIN DU PALAIS-ROYAL (aerial, 48.8650 2.3375, 0.34 m/px). A gravel court about 216 × 90 m, its axis on bearing 18.7, inside
 * the palace's arcades. Four double rows of limes clipped into walls run its length; between the inner two, the round basin in the
 * middle and a parterre either side of it: a lawn in flower borders, in a clipped hedge. OSM maps none of it.
 */
const palaisRoyal = (): GardenPlan => {
  const f = frame(48.865, 2.337804, 18.7)
  const parterre = (s: 1 | -1) => {
    const [u0, u1] = s > 0 ? [32, 94] : [-94, -32]
    return {
      hedge: closed(rect(f, u0, -15.5, u1, 15.5)),
      lawn: rect(f, u0 + 9, -7, u1 - 9, 7),
      beds: [rect(f, u0 + 2, -13.5, u1 - 2, -9), rect(f, u0 + 2, 9, u1 - 2, 13.5), rect(f, u0 + 2, -8, u0 + 7, 8), rect(f, u1 - 7, -8, u1 - 2, 8)],
    }
  }
  const [n, s] = [parterre(1), parterre(-1)]
  return {
    name: 'Jardin du Palais-Royal',
    ring: rect(f, -108, -45, 108, 45),
    clearMapped: true,
    gravel: [rect(f, -108, -45, 108, 45)],
    lawn: [n.lawn, s.lawn],
    beds: [...n.beds, ...s.beds].map((ring) => ({ ring })),
    hedges: [{ line: n.hedge, h: 0.9, w: 0.6 }, { line: s.hedge, h: 0.9, w: 0.6 }],
    pleached: [-38, -19, 19, 38].map((v) => ({ line: [f(-100, v), f(100, v)], w: 8.5, h: 5.5, y0: 3.2, spacing: 3.5 })),
    topiary: [
      ...[[32, -15.5], [32, 15.5], [94, -15.5], [94, 15.5], [-32, -15.5], [-32, 15.5], [-94, -15.5], [-94, 15.5]]
        .map(([u, v]) => ({ at: f(u, v), shape: 'ball' as const, h: 2.2 })),
    ],
  }
}

export const GARDENS: GardenPlan[] = [palaisRoyal(), ...PALACE_GARDENS, ...PUBLIC_GARDENS]
