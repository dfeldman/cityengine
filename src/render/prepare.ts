/**
 * A city tile as the game draws it, from the tile as baked (PARIS_EXPAND §2): the landmarks' own buildings
 * taken out, the restyles applied, nested buildings pulled in. Done per tile as each arrives — it used to be
 * done once over the whole package at load, which a streamed city does not have.
 */
import { style as styleOf, type StyleId } from '../city/facade.ts'
import { specialFor } from '../city/specials.ts'
import { TILE, type CityIndex, type TileData } from '../city/tiles.ts'
import { isReplaced, replacedIds, restyles, type LandmarkEntry } from './landmarks.ts'
import { gardenWalks, parkTile, type ParkMap } from '../city/park-area.ts'
import { region } from '../city/region.ts'

const hexRgb = (h: string): [number, number, number] =>
  [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255]

const inside = (r: number[], x: number, z: number): boolean => {
  let o = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) o = !o
  }
  return o
}

export function tilePreparer(entries: LandmarkEntry[], index: Pick<CityIndex, 'origin' | 'landmarks' | 'region'>, parkMap?: ParkMap): (t: TileData) => TileData {
  /*
   * OPEN COUNTRY IS DECIDED HERE, once per tile, before anything reads a way's width (city/park-area.ts).
   * One place rather than a test inside every consumer: the road surface, the kerb, the centre line, the
   * street plantings, the sign reach and the ride graph all take `width` and `walk` from the tile this
   * returns, so correcting the style once corrects all of them and cannot fall out of step with itself.
   */
  const parkStyle = region(index.region).park
  /*
   * A landmark in the manifest REPLACES its OSM building: taken out here, before any tile is built, so its
   * generated walls, its shadow and its shop signs all go with it (render/landmarks.ts).
   */
  const replaced = replacedIds(entries)
  // an entry naming an outline the bake replaced with its own parts takes those parts too (`isReplaced`,
  // BUGS.md #100): without it the parts stayed in the massing and a plain box stood in the landmark's place

  const allKinds = new Map<number, string>((index.landmarks ?? []).map((l) => [l.id, l.kind]))
  return (t0) => {
    parkMap?.add(t0.key, t0.areas, t0.buildings.length)
    const [ktx, ktz] = t0.key.split(',').map(Number)
    const parked = parkTile(t0, parkStyle, { x0: ktx * TILE, z0: ktz * TILE, x1: (ktx + 1) * TILE, z1: (ktz + 1) * TILE })
    // (and a Paris square, however small: its walks are a garden's raked gravel, where a footway elsewhere is a pavement)
    const t = index.region === 'paris' ? gardenWalks(parked, parkStyle, { x0: ktx * TILE, z0: ktz * TILE, x1: (ktx + 1) * TILE, z1: (ktz + 1) * TILE }) : parked
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
    /*
     * A small building standing in a park whose height nobody tagged is a kiosk, a buvette, a gardeners'
     * shed — one storey. The level inference (tools/heights.ts) gave them their neighbours' six, and the
     * Tuileries had narrow apartment towers standing among its lawns.
     */
    const parks = t.areas.filter((a) => a.kind === 'park' || a.kind === 'grass' || a.kind === 'wood' || a.kind === 'paved')
    const inPark = (b: { ring: number[] }): boolean => {
      let x = 0
      let z = 0
      for (let i = 0; i < b.ring.length; i += 2) { x += b.ring[i]; z += b.ring[i + 1] }
      x /= b.ring.length / 2
      z /= b.ring.length / 2
      return parks.some((a) => inside(a.ring, x, z))
    }
    const footprint = (r: number[]): number => {
      let a = 0
      for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) a += r[j] * r[i + 1] - r[i] * r[j + 1]
      return Math.abs(a / 2)
    }
    /*
     * `historic` USED TO BE HARD-CODED TO `marais` (BUGS.md #221a). That is a PARIS style, and this table is
     * shared by every city — so a historic building anywhere in San Francisco was dressed in a Marais facade,
     * complete with the French shopfronts baked into that page. The owner found it at Fort Point, which is a
     * National Historic Site: `{mesh: 'b:marais:-29,9', material: 'facade:marais'}`. It is invisible in the
     * bake's own audit, because the style is assigned HERE, at load, not by the classifier — the baked tile
     * for that square holds two `stucco` buildings and one `brick`, and none of them is marais.
     *
     * The other four entries happen to be styles every city has. `historic` is the one that named a place.
     */
    const HISTORIC: Record<string, StyleId> = {
      paris: 'marais', 'san-francisco': 'victorian', 'new-york': 'brownstone', chicago: 'brick',
    }
    const QUICK: Record<string, StyleId> = {
      civic: 'classical', museum: 'classical', school: 'brick', church: 'classical',
      historic: HISTORIC[index.region ?? ''] ?? 'classical',
    }
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
    const buildings = (t.buildings.filter((b) => !isReplaced(replaced, b)
      // a part with no height (OSM's height = min_height, round the Vosges arcades) has no walls, but it drew
      // its cornice anyway — a stone band in mid-air, z-fighting with the facade behind it
      && ((b.height ?? Infinity) - (b.minHeight ?? 0) > 0.5
        // …except a fuel station's canopy, which the bake makes exactly a half-metre slab and city/specials.ts draws on
        // its columns (appearance research, 2026-10-22: every pump canopy in the city was being dropped here)
        || specialFor(b.id)?.part === 'canopy')
      && !(restyled.get(b.id)?.dropParts && (b.minHeight ?? 0) > 2.5 && overGround(b) && !overPassage(b))).map((b) => {
      const e = restyled.get(b.id)
      if (!e && b.levelsInferred && (b.minHeight ?? 0) < 1 && footprint(b.ring) < 300 && inPark(b)) {
        return { ...b, levels: 1, height: 4.5, roof: 'hipped' as const, roofHeight: 2 }
      }
      if (!e?.restyle) {
        const kind = byKind.get(b.id) ?? (b.partOf !== undefined ? kindOf.get(b.partOf) : undefined) ?? (churchRings.length && inChurch(b) ? 'church' : '')
        const quick = QUICK[kind]
        if (!quick) return b
        if (kind === 'church') {
          const h = b.height ?? 15
          return { ...b, style: quick, levels: Math.max(1, Math.round((h - (b.minHeight ?? 0)) / 10)), stretch: true }
        }
        // (a school in brick has no shops: the style's ground floor is shopfronts, signs painted on)
        const shops = kind === 'school' ? { noShops: true } : {}
        return (b.minHeight ?? 0) < 1 ? { ...b, style: quick, ...shops } : b
      }
      const st = ((b.minHeight ?? 0) > 2.5 && e.restyleAloft ? e.restyleAloft : e.restyle) as StyleId
      const pal = styleOf(st).palettes[0]
      const roof = e.roof === 'flat' ? { roof: 'flat' as const, roofHeight: 0 }
        : e.roofHeight !== undefined ? { roof: e.roof ?? 'hipped' as const, roofHeight: e.roofHeight } : {}
      // `height` sets the walls outright (the Louvre is mapped 12 m high and stands 25 m to its eaves); `eaves`
      // only ever lowers them
      const height = e.height !== undefined && (b.minHeight ?? 0) < 1 ? { height: e.height, levels: e.levels }
        : e.eaves !== undefined && b.height !== undefined && b.height > e.eaves && (b.minHeight ?? 0) < e.eaves
          ? { height: e.eaves, levels: e.levels }
        /*
         * Storeys counted off a photograph, for the buildings OSM describes with neither a height nor a floor
         * count — churches, halls, theatres, the cable car barn: 56 of them in San Francisco. The bake guesses
         * for those, and a guess is what puts three floors of windows on a building with one tall room. A
         * model cannot judge metres from a picture but it can count floors, which is the one dimension where
         * looking beats the data. It only ever replaces a GUESS: `levelsInferred` marks the 5,616 buildings
         * the bake invented storeys for, and an entry's `levels` is ignored on every other building, so it can
         * never overwrite what OSM actually surveyed.
         */
          : e.levels !== undefined && b.levelsInferred && (b.minHeight ?? 0) < 1
            ? { levels: e.levels, height: e.levels * 3.4 } : {}
      // paint named on the entry wins over the style's seeded palette; anything not named keeps the style's
      const paint = e.wall || e.trim || e.accent || e.groundWall
        ? { palette: { wall: e.wall ?? pal.wall, trim: e.trim ?? pal.trim, roof: e.roofColour ?? pal.roof, accent: e.accent ?? pal.accent, ...(e.groundWall ? { ground: e.groundWall } : {}) } }
        : {}
      // (storeys counted by hand are kept however tall they come out: past a 1.35 stretch the facade grammar re-derived
      //  the count from the style's storey height — Letterman's four 4.2 m storeys came back as seven, 2026-10-04)
      //  — but only a count that makes sense for the height (2.6–5.5 m a storey): several mechanical entries carry counts
      //  that do not (1200 Van Ness: 68 m in 3; Arden: 30 m in 16), which the grammar's re-derivation used to absorb)
      const per = 'levels' in height && height.levels ? (height.height - (b.minHeight ?? 0)) / height.levels : 0
      const counted = per >= 2.6 && per <= 5.5 ? { stretch: true } : {}
      const lifted = { ...b, style: st, ...roof, ...height, ...counted, ...paint, ...(e.noShops ? { noShops: true } : {}), roofColour: hexRgb(e.roofColour ?? pal.roof) }
      // on a podium: its own height, standing `base` metres up
      if (e.base !== undefined && (b.minHeight ?? 0) < e.base) {
        // (the entry's `height` is the building's OWN on its podium, even where OSM gave it a min_height of its own)
        const own = e.height ?? (lifted.height ?? 10) - (b.minHeight ?? 0)
        return { ...lifted, minHeight: e.base, height: e.base + own }
      }
      return lifted
    }))
    // (and the ones the landmarks took, for the passages through them: TileData.claimedBuildings)
    const claimedBuildings = t.buildings.filter((b) => isReplaced(replaced, b))
    return { ...t, buildings, ...(claimedBuildings.length ? { claimedBuildings } : {}), fringe: t.fringe.filter((f) => !isReplaced(replaced, f)) }
  }
}
