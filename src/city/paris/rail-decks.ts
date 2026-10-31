/**
 * The streets' bridges over tracks that OSM has no outline for (render/rail-overbridge.ts `decksBetweenMouths`; tools/paris-portals.ts writes the list). They join a tile's `bridges`, so the ways on them and the structure
 * read them as they read OSM's. Not baked: nothing in the bake reads them but the pavements' level (tools/bake.ts `levelFootOnDecks`).
 */
import { DECKS } from './rail-decks-data.ts'

const TILE = 200

export const RAIL_DECKS: { id: number; ring: number[] }[] = DECKS

/** Into a tile's outlines, each deck in every tile it touches (as the bake files OSM's). */
export function addRailDecks(t: { key: string; bridges?: { id: number; ring: number[]; name?: string }[] }): void {
  const [tx, tz] = t.key.split(',').map(Number)
  for (const d of RAIL_DECKS) {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (let i = 0; i < d.ring.length; i += 2) { x0 = Math.min(x0, d.ring[i]); x1 = Math.max(x1, d.ring[i]); z0 = Math.min(z0, d.ring[i + 1]); z1 = Math.max(z1, d.ring[i + 1]) }
    if (x1 < tx * TILE || x0 >= (tx + 1) * TILE || z1 < tz * TILE || z0 >= (tz + 1) * TILE) continue
    if (!t.bridges?.some((b) => b.id === d.id)) (t.bridges ??= []).push(d)
  }
}
