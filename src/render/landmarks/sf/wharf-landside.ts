/**
 * FISHERMAN'S WHARF, the land side and its interior courts (owner, 2026-10-17: "The Anchor's Landing and other similar
 * interior areas are full of shops and life"; "every store is trying to get your attention… very loud and unique").
 * Built building by building from Mapillary; each builder names its photograph.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'

export const WHARF_LANDSIDE: Record<string, (out: MeshBuilder, fit: Fit) => void> = {}
