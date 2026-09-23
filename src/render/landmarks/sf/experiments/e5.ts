/**
 * Experiment 5 of MODELING_IMPROVEMENT_1.md — builders written by one experimental run.
 *
 * Each experiment owns exactly ONE of these files so that several can run at once without touching the
 * same lines. The record is already imported and spread into SF_BUILDERS by sf/index.ts, so filling this in
 * is the only edit a run needs to make. Builders here are named `e5_<something>` to keep the flat
 * PROCEDURAL keyspace collision-free (BUGS.md #92).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { tower } from '../../tower.ts'
import { colonnade } from '../../parts.ts'

export const EXP_5: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** 301 Pine (neoclassical, 16m): light granite, prominent Corinthian columns. */
  e5_pacificExchange_301_Pine: (out, fit) => {
    // Main building structure: neoclassical with a high solid wall (columns engaged in facade)
    tower(out, fit, {
      height: 16,
      tiers: [
        {
          to: 1,
          face: {
            kind: 'punched',
            wall: [0.84, 0.81, 0.76],
            glass: [0.5, 0.52, 0.55],
            pitch: 4.2,
            floor: 4.5,
            solid: 0.75,  // high solid ratio for classical character
            material: 'granite',
          },
          cornice: { depth: 0.9, height: 0.8 },
        },
      ],
      crown: { kind: 'parapet', height: 0.6 },
      roof: [0.6, 0.59, 0.56],
    })

    // Add colonnade on the front (main facade)
    if (fit.ring && fit.ring.length >= 4) {
      // Find the front edge (longest edge, typically first or second)
      let maxLen = 0
      let frontIdx = 0
      for (let i = 0; i < fit.ring.length; i++) {
        const a = fit.ring[i]
        const b = fit.ring[(i + 1) % fit.ring.length]
        const len = Math.hypot(b.x - a.x, b.z - a.z)
        if (len > maxLen) {
          maxLen = len
          frontIdx = i
        }
      }

      const a = fit.ring[frontIdx]
      const b = fit.ring[(frontIdx + 1) % fit.ring.length]

      // Colonnade with 4-5 Corinthian columns on the front
      colonnade(out, a, b, 0, 10, 4, {
        radius: 0.65,
        out: 0.8,
        colour: [0.84, 0.81, 0.76],
        material: 'granite',
        order: 'corinthian',
        entablature: 1.2,
      })
    }
  },
}

