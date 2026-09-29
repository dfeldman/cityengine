/**
 * Walt Disney Family Museum, way/288340246, the Presidio (a ride route stop) — the proof that the per-edge
 * `Shaft`/`material` kit gap (docs/sf-batches/ESCALATIONS.md, "no PER-EDGE material or shaft") is closed.
 *
 * Kit batch 6 escalated this building for exactly the right reason: its baked ring (24 vertices) is
 * strictly orthogonal, matching the real two-wing 1897 brick Army barracks — the PLAN does not defeat
 * `facade()`. But the real building (per Wikipedia/archpaper.com, quoted in ESCALATIONS.md) keeps a
 * preserved BRICK, arcaded-porch front facing the parade ground on one long face, and fills the OPPOSITE
 * long face with a two-storey GLASS CURTAIN WALL added in the 2009 renovation, where the two wings' own
 * courtyard was walled in. One `material` per `facade()` call, and no per-edge `on` for `Shaft`, could not
 * say that — and a second `facade()` call on the same ring would double-draw the shared walls (the SFMOMA
 * mistake in miniature). `Shaft.by` (../facade.ts) exists now for exactly this: it partitions the ring's
 * edges between a base face and named overrides, so the front wall is drawn once in brick and the rear wall
 * is drawn once in glass, on the SAME `facade()` call.
 *
 * No usable reference photograph exists for this way: `docs/shots/refs/sf-fetch/done.csv` records its one
 * Mapillary frame as "junk", and no other batch folder has one filed under this id. Built restrained from
 * the escalation's own researched description rather than a photograph: two arched-window brick storeys on
 * the parade-ground (front, longest-edge) face, a plain glazed curtain on the wall facing it, and the short
 * return walls of the two wings kept in brick to match the front, since nothing on file says otherwise.
 *
 * Registered through ../index.ts; placed by public/landmarks/san-francisco/scratch-2.json (appended last).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { facade } from '../facade.ts'
import { towerRing } from '../tower.ts'
import { edgeAt, longestEdge } from '../parts.ts'

/** The longest edge whose heading points roughly opposite `front`'s — the wall it faces across the plan. */
function oppositeEdge(ring: { x: number; z: number }[], front: number): number {
  const frontHeading = edgeAt(ring, front).heading
  let best = front
  let bestScore = -Infinity
  for (let i = 0; i < ring.length; i++) {
    if (i === front) continue
    const e = edgeAt(ring, i)
    let d = Math.abs(e.heading - (frontHeading + Math.PI))
    while (d > Math.PI) d -= Math.PI * 2
    d = Math.abs(d)
    // a longer edge closer to dead-opposite wins; length matters more than a few degrees of baked-ring noise
    const score = e.L - d * 20
    if (score > bestScore) { bestScore = score; best = i }
  }
  return best
}

export function waltDisneyFamilyMuseum(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const front = longestEdge(ring)
  const rear = oppositeEdge(ring, front)

  facade(out, fit, {
    ground: null,
    shaft: {
      storeys: 2,
      windows: 'arched',
      material: 'brick',
      // the 2009 glass curtain wall: the rear (parade-ground-facing wall's opposite) gets its own face,
      // partitioned off the base brick — never drawn twice on the shared ring
      by: [{ on: rear, windows: 'continuous', material: 'glass' }],
    },
    top: null,
    bands: { aboveGround: null, belowTop: null, top: 'cornice' },
    crown: { kind: 'parapet', height: 0.5 },
    frame: null,
    entrance: { at: 'centre', kind: 'door', steps: 2 },
    material: 'brick',
  })
}

export const SCRATCH_2: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  waltDisneyFamilyMuseum,
}
