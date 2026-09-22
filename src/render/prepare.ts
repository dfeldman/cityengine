/**
 * A city tile as the game draws it, from the tile as baked (PARIS_EXPAND §2): the landmarks' own buildings
 * taken out, the restyles applied, nested buildings pulled in. Done per tile as each arrives — it used to be
 * done once over the whole package at load, which a streamed city does not have.
 */
import { style as styleOf, type StyleId } from '../city/facade.ts'
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
  const allKinds = new Map<number, string>((index.landmarks ?? []).map((l) => [l.id, l.kind]))
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
    /*
     * Quick landmarks (BUGS.md #41): the buildings people steer by that no manifest entry names — schools,
     * town halls and theatres, museums, the hôtels particuliers — dressed by their kind, so they stand out
     * from the street: the civic ones in classical stone, the schools in the brick-and-stone of the Third
     * Republic's écoles, the historic houses in the Marais's own stone. (Their flags and the churches' towers
     * are render/quickmarks.ts.)
     */
    const byKind = new Map<number, string>()
    for (const l of t.landmarks) byKind.set(l.id, l.kind)
    // and for a building replaced by its parts, by the whole city's list (its parts may be in other tiles)
    const kindOf = allKinds
    const QUICK: Record<string, StyleId> = { civic: 'classical', museum: 'classical', school: 'brick', historic: 'marais', church: 'classical' }
    // a church's own parts (its towers, its apse, mapped as building:parts) are the church too; a church's
    // storeys are tall — 10 m — so its walls have a few great windows, not rows of flats
    const churchRings = t.buildings.filter((b) => byKind.get(b.id) === 'church').map((b) => b.ring)
    const inChurch = (b: { ring: number[] }): boolean => {
      let x = 0
      let z = 0
      for (let i = 0; i < b.ring.length; i += 2) { x += b.ring[i]; z += b.ring[i + 1] }
      x /= b.ring.length / 2
      z /= b.ring.length / 2
      return churchRings.some((r) => r !== b.ring && inside(r, x, z))
    }
    // (nested buildings are pulled in at bake time, over the whole city: city/nesting.ts)
    const buildings = (t.buildings.filter((b) => !replaced.has(b.id)
      // a part with no height (OSM's height = min_height, round the Vosges arcades) has no walls, but it drew
      // its cornice anyway — a stone band in mid-air, z-fighting with the facade behind it
      && (b.height ?? Infinity) - (b.minHeight ?? 0) > 0.5
      && !(restyled.get(b.id)?.dropParts && (b.minHeight ?? 0) > 2.5 && overGround(b) && !overPassage(b))).map((b) => {
      const e = restyled.get(b.id)
      if (!e?.restyle) {
        const kind = byKind.get(b.id) ?? (b.partOf !== undefined ? kindOf.get(b.partOf) : undefined) ?? (churchRings.length && inChurch(b) ? 'church' : '')
        const quick = QUICK[kind]
        if (!quick) return b
        if (kind === 'church') {
          const h = b.height ?? 15
          return { ...b, style: quick, levels: Math.max(1, Math.round((h - (b.minHeight ?? 0)) / 10)), stretch: true }
        }
        return (b.minHeight ?? 0) < 1 ? { ...b, style: quick } : b
      }
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
