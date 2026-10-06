/**
 * MUNI METRO TUNNEL PORTALS (owner, 2026-10-06: "At the east portal site we draw a bunch of trains just appearing and
 * disappearing. we should add a tunnel entrance"). The bake drops track in a tunnel (a train on it would drive through
 * the buildings above), so the surface track simply ENDS where the line goes under, and the trains shuttling to its
 * end popped in and out of nothing. Each portal is placed at that end, its mouth over the last metres of the track:
 * a train runs into the dark and is gone.
 *
 * A board-formed concrete headwall with a deep lintel over a dark rectangular mouth wide enough for two tracks, wing
 * walls stepping down either side, the dark tunnel running back into the ground behind it, and a slim coping. Local
 * frame: the mouth faces +z (the surface track), the tunnel runs to −z. Placed by numeric `front` (the bearing out of
 * the tunnel).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const CONCRETE: Rgb = [0.66, 0.65, 0.62]
const COPING: Rgb = [0.72, 0.71, 0.68]
const DARK: Rgb = [0.03, 0.03, 0.035]

export function tunnelPortal(out: MeshBuilder, fit: Fit): void {
  const conc = surfaceTag('concrete')
  const W = Math.max(5.2, fit.hx * 0.65)        // half the mouth's width (two tracks)
  const H = 5.6                                  // the mouth's height
  const T = 1.2                                  // the headwall's thickness
  const D = 30                                   // how far the dark runs back
  // the headwall: piers either side of the mouth, the lintel over it
  for (const s of [-1, 1]) box(out, s * (W + 1.0), (H + 2.2) / 2, 0, 1.0, (H + 2.2) / 2, T / 2, CONCRETE, conc)
  box(out, 0, H + 1.1, 0, W + 2.0, 1.1, T / 2, CONCRETE, conc)
  box(out, 0, H + 2.3, 0.05, W + 2.2, 0.1, T / 2 + 0.15, COPING, conc)
  // the wing walls, stepping down away from the mouth
  for (const s of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const h = H + 2.2 - k * 1.8
      box(out, s * (W + 2.0 + 0.3), h / 2, T / 2 + 1.5 + k * 3, 0.3, h / 2, 1.5, CONCRETE, conc)
    }
  }
  // the dark inside: walls, roof and floor of the tunnel running back, lit by nothing
  box(out, 0, H + 0.1, -D / 2, W, 0.1, D / 2, DARK, 0)
  for (const s of [-1, 1]) box(out, s * (W + 0.1), H / 2, -D / 2, 0.1, H / 2, D / 2, DARK, 0)
  box(out, 0, H / 2, -D + 0.1, W, H / 2, 0.1, DARK, 0)
  box(out, 0, 0.02, -D / 2, W, 0.02, D / 2, DARK, 0)
  // the hill over the tunnel's first metres, so the headwall is not a free-standing screen
  box(out, 0, H + 1.7, -D / 2 - T / 2, W + 2.0, 1.7, D / 2, [0.33, 0.4, 0.26], 0)
}
