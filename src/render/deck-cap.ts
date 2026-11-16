/**
 * A raised deck that runs THROUGH a generic building's footprint (La Défense's walkways: Passerelle des Pince-Vins through w68852021, the
 * Boulevard Patrick Devedjian viaduct through w82486000) cannot have the building standing through it: the building is capped under the
 * deck. The render-time twin of the bake's `capUnderDecks` (tools/defense-decks.ts), which only runs at a rebake — the shipped bake has
 * not had it. Where the bake already capped a building, `room >= height` and this does nothing.
 */
import type { PackedEdge } from '../city/package.ts'

/** a deck's slab, under its surface (m): the building stops this far under the lowest deck vertex in its ring */
export const DECK_CAP_THICKNESS = 1.5
/** at least this many deck vertices must fall in the ring (a deck clipping a corner is left) */
export const DECK_CAP_MIN_VERTS = 2
/** a building this tall or taller is never capped: a deck through it is a passage through its podium (Kupka A, 50 m) */
export const DECK_CAP_MAX_HEIGHT = 40
/** …and never capped below this (m above its foot): a lower room means the deck is not over the building's body at all */
export const DECK_CAP_MIN_ROOM = 3
/** DECK_CAP=0 in the URL-less env (dev) turns it off */
export const DECK_CAP_ON = true

const inRing = (r: number[], x: number, z: number): boolean => {
  let o = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) o = !o
  }
  return o
}

/** The height a generic building may have under the decks that cross it, or `height` itself when none does. */
export function capUnderDecks(ring: number[], height: number, minHeight: number, foot: number, edges: readonly PackedEdge[]): number {
  if (!DECK_CAP_ON || height >= DECK_CAP_MAX_HEIGHT) return height
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (let i = 0; i < ring.length; i += 2) { x0 = Math.min(x0, ring[i]); x1 = Math.max(x1, ring[i]); z0 = Math.min(z0, ring[i + 1]); z1 = Math.max(z1, ring[i + 1]) }
  let n = 0, low = Infinity
  for (const e of edges) {
    if (!e.bridge || e.tunnel || !e.heights) continue
    const p = e.points, last = p.length - 2
    // (only a deck that passes THROUGH: both ends outside the ring)
    if (inRing(ring, p[0], p[1]) || inRing(ring, p[last], p[last + 1])) continue
    for (let i = 0; i < p.length; i += 2) {
      if (p[i] < x0 || p[i] > x1 || p[i + 1] < z0 || p[i + 1] > z1 || !inRing(ring, p[i], p[i + 1])) continue
      n++
      low = Math.min(low, e.heights[i / 2])
    }
  }
  if (n < DECK_CAP_MIN_VERTS) return height
  const room = low - DECK_CAP_THICKNESS - foot
  if (room >= height || room < minHeight + DECK_CAP_MIN_ROOM) return height
  return Math.round(room * 10) / 10
}
