/**
 * A city tile as the game draws it, from the tile as baked (PARIS_EXPAND §2): the landmarks' own buildings
 * taken out, the restyles applied, nested buildings pulled in. Done per tile as each arrives — it used to be
 * done once over the whole package at load, which a streamed city does not have.
 */
import { style as styleOf, type StyleId } from '../city/facade.ts'
import { insetNested } from '../city/nesting.ts'
import type { CityIndex, TileData } from '../city/tiles.ts'
import { replacedIds, restyles, type LandmarkEntry } from './landmarks.ts'

const hexRgb = (h: string): [number, number, number] =>
  [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255]

const inside = (r: number[], x: number, z: number): boolean => {
  let o = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) o = !o
  }
  return o
}

export function tilePreparer(entries: LandmarkEntry[], index: Pick<CityIndex, 'origin' | 'landmarks'>): (t: TileData) => TileData {
  /*
   * A landmark in the manifest REPLACES its OSM building: taken out here, before any tile is built, so its
   * generated walls, its shadow and its shop signs all go with it (render/landmarks.ts).
   */
  const replaced = replacedIds(entries)
  return (t) => {
    /*
     * And a restyle keeps its buildings but changes their dress — the Place des Vosges's brick and stone —
     * with the steep slate roof that goes with it.
     */
    const restyled = restyles(entries, { origin: index.origin, buildings: t.buildings, landmarks: index.landmarks })
    /*
     * `dropParts`: the parts OSM maps above the Vosges arcades that sit over a house already drawn whole. Only
     * those — a part bridging an ARCH (the Pavillon du Roi over Rue de Birague) has nothing under it, and
     * dropping it left a slot of sky through the pavilion.
     */
    const groundRings = t.buildings.filter((b) => (b.minHeight ?? 0) <= 0.5).map((b) => b.ring)
    const overGround = (b: { ring: number[] }): boolean => {
      let x = 0
      let z = 0
      for (let i = 0; i < b.ring.length; i += 2) { x += b.ring[i]; z += b.ring[i + 1] }
      x /= b.ring.length / 2
      z /= b.ring.length / 2
      return groundRings.some((r) => inside(r, x, z))
    }
    // the passages' points: a part a passage runs under is the arch's upper storey, never dropped
    const passagePts: number[] = t.edges.filter((e) => e.passage).flatMap((e) => e.points)
    const overPassage = (b: { ring: number[] }): boolean => {
      for (let k = 0; k < passagePts.length; k += 2) if (inside(b.ring, passagePts[k], passagePts[k + 1])) return true
      return false
    }
    const buildings = insetNested(t.buildings.filter((b) => !replaced.has(b.id)
      // a part with no height (OSM's height = min_height, round the Vosges arcades) has no walls, but it drew
      // its cornice anyway — a stone band in mid-air, z-fighting with the facade behind it
      && (b.height ?? Infinity) - (b.minHeight ?? 0) > 0.5
      && !(restyled.get(b.id)?.dropParts && (b.minHeight ?? 0) > 2.5 && overGround(b) && !overPassage(b))).map((b) => {
      const e = restyled.get(b.id)
      if (!e?.restyle) return b
      const st = ((b.minHeight ?? 0) > 2.5 && e.restyleAloft ? e.restyleAloft : e.restyle) as StyleId
      const pal = styleOf(st).palettes[0]
      const roof = e.roof === 'flat' ? { roof: 'flat' as const, roofHeight: 0 }
        : e.roofHeight !== undefined ? { roof: e.roof ?? 'hipped' as const, roofHeight: e.roofHeight } : {}
      // `height` sets the walls outright (the Louvre is mapped 12 m high and stands 25 m to its eaves); `eaves`
      // only ever lowers them
      const height = e.height !== undefined && (b.minHeight ?? 0) < 1 ? { height: e.height, levels: e.levels }
        : e.eaves !== undefined && b.height !== undefined && b.height > e.eaves && (b.minHeight ?? 0) < e.eaves
          ? { height: e.eaves, levels: e.levels } : {}
      return { ...b, style: st, ...roof, ...height, roofColour: hexRgb(e.roofColour ?? pal.roof) }
    }))
    return { ...t, buildings, fringe: t.fringe.filter((f) => !replaced.has(f.id)) }
  }
}
